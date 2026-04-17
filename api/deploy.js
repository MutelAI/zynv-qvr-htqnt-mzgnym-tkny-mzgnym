/**
 * Vercel Serverless Function — POST /api/deploy
 *
 * Validates the editToken (from request body or query param),
 * then triggers a Vercel redeploy via VERCEL_DEPLOY_HOOK.
 *
 * Required env vars:
 *   VERCEL_DEPLOY_HOOK — webhook URL created during `deploy` in business-site-generator
 *
 * For token validation also needs:
 *   GITHUB_TOKEN, GITHUB_REPO_OWNER, GITHUB_REPO  (or their legacy equivalents)
 */

const FILE_PATH = 'public/data/business.json';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const deployHook = process.env.VERCEL_DEPLOY_HOOK;
  if (!deployHook) {
    res.status(503).json({ error: 'VERCEL_DEPLOY_HOOK is not configured on this deployment' });
    return;
  }

  // Validate editToken so only authorized users can trigger a redeploy
  const token = req.body?.editToken ?? req.query?.token ?? null;
  if (!token) {
    res.status(400).json({ error: 'Missing editToken' });
    return;
  }

  const ghToken = process.env.GITHUB_TOKEN;
  const owner   = process.env.GITHUB_REPO_OWNER || process.env.GITHUB_ORG || process.env.VERCEL_GIT_REPO_OWNER;
  const repo    = process.env.GITHUB_REPO || process.env.VERCEL_GIT_REPO_SLUG;

  if (ghToken && owner && repo) {
    // Fetch current business.json from GitHub to verify the token
    const apiBase = `https://api.github.com/repos/${owner}/${repo}/contents/${FILE_PATH}`;
    const getRes = await fetch(apiBase, {
      headers: {
        Authorization: `Bearer ${ghToken}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (getRes.ok) {
      const fileData = await getRes.json();
      let current;
      try {
        current = JSON.parse(Buffer.from(fileData.content, 'base64').toString('utf-8'));
      } catch {
        res.status(500).json({ error: 'Could not parse business.json from GitHub' });
        return;
      }

      if (!current.editToken || current.editToken !== token) {
        res.status(403).json({ error: 'Invalid edit token' });
        return;
      }
    }
    // If GitHub fetch fails, still allow deploy (non-blocking)
  }

  // Trigger Vercel redeploy
  const hookRes = await fetch(deployHook, { method: 'POST' });
  if (!hookRes.ok) {
    res.status(500).json({ error: `Deploy hook failed (${hookRes.status})` });
    return;
  }

  res.status(200).json({ ok: true });
}
