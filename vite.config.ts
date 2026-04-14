/// <reference types="vitest" />

import { defineConfig, type Plugin } from 'vite';
import analog from '@analogjs/platform';
import tailwindcss from '@tailwindcss/vite';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

/**
 * Finds all sibling version folders for the current site.
 * e.g. if root is output/Mayfair_Key_and_Lock_v3, returns
 * [Mayfair_Key_and_Lock, Mayfair_Key_and_Lock_v2, ..._v3]
 */
function findSiblingVersions(root: string): { folder: string; version: number; isCurrent: boolean; businessJsonPath: string }[] {
  const parentDir = path.dirname(root);
  const currentFolder = path.basename(root);

  // Extract base name: strip _vN suffix
  const baseMatch = currentFolder.match(/^(.+?)(_v\d+)?$/);
  const baseName = baseMatch ? baseMatch[1] : currentFolder;

  if (!fs.existsSync(parentDir)) return [];

  const entries = fs.readdirSync(parentDir, { withFileTypes: true });
  const versions: { folder: string; version: number; isCurrent: boolean; businessJsonPath: string }[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const name = entry.name;
    // Match exact base name or base_vN
    if (name === baseName) {
      const bjPath = path.join(parentDir, name, 'public', 'data', 'business.json');
      if (fs.existsSync(bjPath)) {
        versions.push({ folder: name, version: 1, isCurrent: name === currentFolder, businessJsonPath: bjPath });
      }
    } else {
      const m = name.match(new RegExp(`^${escapeRegex(baseName)}_v(\\d+)$`));
      if (m) {
        const bjPath = path.join(parentDir, name, 'public', 'data', 'business.json');
        if (fs.existsSync(bjPath)) {
          versions.push({ folder: name, version: parseInt(m[1], 10), isCurrent: name === currentFolder, businessJsonPath: bjPath });
        }
      }
    }
  }

  return versions.sort((a, b) => a.version - b.version);
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Tiny dev-only plugin: handles PUT /api/save-business
 * Saves business.json and auto-commits to Git so every version is preserved.
 */
function editSavePlugin(): Plugin {
  return {
    name: 'edit-save-business',
    configureServer(server) {
      // Prevent browser from caching business.json so edits show up on refresh
      server.middlewares.use('/data/business.json', (_req, res, next) => {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        next();
      });

      // ── List all sibling versions ───────────────────────────────────────
      server.middlewares.use('/api/versions', (req, res) => {
        if (req.method !== 'GET') { res.statusCode = 405; res.end('Method not allowed'); return; }
        try {
          const versions = findSiblingVersions(server.config.root);
          const result = versions.map(v => ({
            folder: v.folder,
            version: v.version,
            isCurrent: v.isCurrent,
            label: v.version === 1 ? 'v1 (original)' : `v${v.version}`,
          }));
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(result));
        } catch (e: any) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: e.message }));
        }
      });

      // ── Get a specific version's business.json ──────────────────────────
      server.middlewares.use('/api/version-data', (req, res) => {
        if (req.method !== 'GET') { res.statusCode = 405; res.end('Method not allowed'); return; }
        const url = new URL(req.url!, `http://${req.headers.host}`);
        const folder = url.searchParams.get('folder');
        if (!folder) { res.statusCode = 400; res.end(JSON.stringify({ error: 'Missing folder param' })); return; }

        // Validate folder name to prevent path traversal
        if (/[\/\\]|\.\./.test(folder)) { res.statusCode = 400; res.end(JSON.stringify({ error: 'Invalid folder name' })); return; }

        const versions = findSiblingVersions(server.config.root);
        const match = versions.find(v => v.folder === folder);
        if (!match) { res.statusCode = 404; res.end(JSON.stringify({ error: 'Version not found' })); return; }

        try {
          const data = fs.readFileSync(match.businessJsonPath, 'utf-8');
          JSON.parse(data); // validate
          res.setHeader('Content-Type', 'application/json');
          res.end(data);
        } catch (e: any) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: e.message }));
        }
      });

      server.middlewares.use('/api/save-business', (req, res) => {
        if (req.method !== 'PUT') {
          res.statusCode = 405;
          res.end('Method not allowed');
          return;
        }
        const chunks: Buffer[] = [];
        req.on('data', (c: Buffer) => chunks.push(c));
        req.on('end', () => {
          try {
            const body = Buffer.concat(chunks).toString('utf-8');
            // Validate it's parseable JSON before writing
            JSON.parse(body);
            const target = path.resolve(server.config.root, 'public/data/business.json');
            fs.writeFileSync(target, body, 'utf-8');

            // Auto-commit to Git for version history
            const gitResult = gitCommitJson(target, server.config.root);

            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 200;
            res.end(JSON.stringify({ ok: true, git: gitResult }));
          } catch (e: any) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: e.message }));
          }
        });
      });
    },
  };
}

/** Stage and commit business.json; returns commit info or error. */
function gitCommitJson(filePath: string, cwd: string): { committed: boolean; hash?: string; error?: string } {
  try {
    execSync(`git add "${filePath}"`, { cwd, stdio: 'pipe' });
    const timestamp = new Date().toLocaleString('en-GB', { hour12: false });
    execSync(`git commit -m "edit-mode: save ${timestamp}"`, { cwd, stdio: 'pipe' });
    const hash = execSync('git rev-parse --short HEAD', { cwd, stdio: 'pipe' }).toString().trim();
    return { committed: true, hash };
  } catch (e: any) {
    // "nothing to commit" is fine — content identical to last commit
    if (e.stdout?.toString().includes('nothing to commit')) {
      return { committed: false, error: 'No changes to commit' };
    }
    return { committed: false, error: e.message };
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  build: {
    target: ['es2020'],
  },
  resolve: {
    mainFields: ['module'],
    dedupe: [
      '@angular/core',
      '@angular/common',
      '@angular/platform-browser',
      '@angular/router',
      '@angular/forms',
    ],
  },
  optimizeDeps: {
    include: [
      '@angular/core',
      '@angular/common',
      '@angular/common/http',
      '@angular/platform-browser',
      '@angular/platform-browser/animations',
      '@angular/router',
      '@angular/forms',
    ],
  },
  plugins: [
    editSavePlugin(),
    analog({
      ssr: false,
      static: true,
      prerender: {
        routes: [],
      },
    }),
    tailwindcss()
  ],
}));
