/**
 * Lazy-loaded edit module — code-split, never downloaded by regular visitors.
 *
 * Approach: make ALL visible text elements editable (no data-attributes needed).
 * Changes are tracked as {original → new} text pairs and applied to business.json
 * by searching for matching string values recursively.
 *
 * For i18n UI labels (section titles, buttons, etc.) that come from DEFAULTS
 * in the i18n service, changes are written as overrides into translations{}.
 */

import { I18N_DEFAULTS } from '../services/i18n-defaults';

// ── Types ────────────────────────────────────────────────────────────────────

interface BusinessJson {
  business: Record<string, any>;
  editToken?: string;
  hours: any[];
  services: any[];
  reviews: any[];
  photos: any[];
  translations: Record<string, { he: string; en: string }>;
  design?: Record<string, any>;
  hidden_sections?: string[];
}

// ── State ────────────────────────────────────────────────────────────────────

let originalData: BusinessJson;
let mutatedData: BusinessJson;
let toolbar: HTMLElement;
let editStyleEl: HTMLStyleElement;
let observer: MutationObserver | null = null;
const processed = new WeakSet<Element>();
const textChanges = new Map<string, string>(); // originalText → newText

// Version picker state
interface VersionInfo {
  folder: string;
  version: number;
  isCurrent: boolean;
  label: string;
}
let versionPanel: HTMLElement | null = null;
let versionsList: VersionInfo[] = [];
let previewingVersion: VersionInfo | null = null;

/** Tags that typically contain editable text content. */
const TEXT_TAGS = new Set([
  'H1','H2','H3','H4','H5','H6','P','SPAN','A','BUTTON',
  'DIV','LABEL','LI','TD','TH','FIGCAPTION','BLOCKQUOTE',
]);

/** Elements to skip — interactive / structural. */
const SKIP_SELECTORS = '#edit-toolbar, .edit-toast, .edit-delete-btn, .edit-section-delete-btn, .edit-img-overlay, script, style, svg, iframe, input, textarea, select, noscript';

// ── Public entry point ───────────────────────────────────────────────────────

export async function initEditMode(token: string): Promise<void> {
  const valid = await verifyToken(token);
  if (!valid) {
    console.warn('[edit-mode] Invalid token — edit mode not activated.');
    return;
  }

  originalData = await (window as any).__bizData;
  mutatedData = structuredClone(originalData);

  injectStyles();
  createToolbar();
  document.body.classList.add('edit-mode-active');

  // Process what's already rendered
  scanAndProcess();

  // Watch for new elements (Angular @defer blocks, lazy components)
  observer = new MutationObserver(() => scanAndProcess());
  observer.observe(document.body, { childList: true, subtree: true });

  // Backup scans for timing edge cases
  for (const delay of [300, 800, 2000, 4000, 8000]) {
    setTimeout(() => scanAndProcess(), delay);
  }

  showToast('✏️ Edit mode active — click any text to edit it');
}

// ── Token verification ───────────────────────────────────────────────────────

async function verifyToken(token: string): Promise<boolean> {
  const data: BusinessJson = await (window as any).__bizData;
  return !!data.editToken && data.editToken === token;
}

// ── Scan DOM for all text elements ───────────────────────────────────────────

function scanAndProcess(): void {
  // Text elements
  const allElements = document.querySelectorAll<HTMLElement>(
    'h1,h2,h3,h4,h5,h6,p,span,a,button,div,label,li,td,th,figcaption,blockquote'
  );

  allElements.forEach(el => {
    if (processed.has(el)) return;
    if (el.closest(SKIP_SELECTORS)) return;
    if (!isLeafText(el)) return;

    const text = el.innerText.trim();
    if (!text || text.length < 2) return; // skip empty / single-char elements

    processed.add(el);
    makeEditable(el);
  });

  // Logo (emoji → image upload) (via data-edit-logo)
  document.querySelectorAll<HTMLElement>('[data-edit-logo]').forEach(el => {
    if (processed.has(el)) return;
    processed.add(el);
    setupLogoEditable(el);
  });

  // Images (via data-edit-img)
  document.querySelectorAll<HTMLElement>('[data-edit-img]').forEach(el => {
    if (processed.has(el)) return;
    processed.add(el);
    setupImageEditable(el);
  });

  // Deletable list items (via data-edit-delete)
  document.querySelectorAll<HTMLElement>('[data-edit-delete]').forEach(el => {
    if (processed.has(el)) return;
    processed.add(el);
    setupDeleteButton(el);
  });

  // Deletable sections (via data-edit-section)
  document.querySelectorAll<HTMLElement>('[data-edit-section]').forEach(el => {
    if (processed.has(el)) return;
    processed.add(el);
    setupSectionDelete(el);
  });

  // Add-photo containers (via data-edit-add-photo)
  document.querySelectorAll<HTMLElement>('[data-edit-add-photo]').forEach(el => {
    if (processed.has(el)) return;
    processed.add(el);
    setupAddPhotoContainer(el);
  });
}

/**
 * Returns true if the element has meaningful direct text content
 * (not just whitespace distributed across child elements).
 */
function isLeafText(el: HTMLElement): boolean {
  // If it has no text at all, skip
  const text = el.innerText?.trim();
  if (!text) return false;

  // If it only contains other text-bearing elements, it's not a leaf
  // Check: does this element have direct text nodes with real content?
  for (const node of el.childNodes) {
    if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
      return true;
    }
  }

  // Allow elements that have very few children (like a span inside)
  const childTextEls = el.querySelectorAll('h1,h2,h3,h4,h5,h6,p,span,a,div');
  if (childTextEls.length === 0) return true; // No text sub-elements → it's a leaf

  return false;
}

// ── Make any element editable ────────────────────────────────────────────────

function makeEditable(el: HTMLElement): void {
  el.classList.add('edit-hoverable');

  // Store original text for change tracking
  const originalText = el.innerText.trim();
  el.setAttribute('data-edit-original', originalText);

  el.addEventListener('click', function handler(e) {
    // Don't interfere if already editing
    if (el.contentEditable === 'true') return;

    // Don't block links in non-edit scenarios — but in edit mode, prevent navigation
    e.preventDefault();
    e.stopPropagation();

    el.contentEditable = 'true';
    el.classList.add('edit-active');
    el.focus();

    // Select all text for easy replacement
    const sel = window.getSelection();
    if (sel) {
      const range = document.createRange();
      range.selectNodeContents(el);
      sel.removeAllRanges();
      sel.addRange(range);
    }
  });

  el.addEventListener('blur', () => {
    el.contentEditable = 'false';
    el.classList.remove('edit-active');

    const newText = el.innerText.trim();
    const orig = el.getAttribute('data-edit-original') || '';
    if (newText !== orig) {
      textChanges.set(orig, newText);
      applyChangeToJson(orig, newText);
      el.setAttribute('data-edit-original', newText);
      markDirty();
    }
  });

  el.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      el.blur();
    }
    if (e.key === 'Escape') {
      // Revert to original
      el.innerText = el.getAttribute('data-edit-original') || '';
      el.blur();
    }
  });
}

// ── Apply text change to business.json by content matching ───────────────────

/** Reverse lookup: displayed text → { i18n key, language }. Built once at init. */
let i18nReverseLookup: Map<string, { key: string; lang: 'he' | 'en' }> | null = null;

function getI18nReverseLookup(): Map<string, { key: string; lang: 'he' | 'en' }> {
  if (i18nReverseLookup) return i18nReverseLookup;
  i18nReverseLookup = new Map();

  // First add all DEFAULTS (lowest priority — overridden below by translations)
  for (const [key, entry] of Object.entries(I18N_DEFAULTS)) {
    if (entry.he) i18nReverseLookup.set(entry.he, { key, lang: 'he' });
    if (entry.en) i18nReverseLookup.set(entry.en, { key, lang: 'en' });
  }

  // Then add translations from business.json (higher priority — already-overridden values)
  if (mutatedData.translations) {
    for (const [key, entry] of Object.entries(mutatedData.translations)) {
      if (entry.he) i18nReverseLookup.set(entry.he, { key, lang: 'he' });
      if (entry.en) i18nReverseLookup.set(entry.en, { key, lang: 'en' });
    }
  }

  return i18nReverseLookup;
}

function applyChangeToJson(originalText: string, newText: string): void {
  // 1. Try regular content matching in the full JSON tree
  replaceInObject(mutatedData, originalText, newText);

  // 2. Check if this text is an i18n label (from DEFAULTS or translations)
  const lookup = getI18nReverseLookup();
  const match = lookup.get(originalText);
  if (match) {
    // Write override into translations so the i18n service picks it up on reload
    if (!mutatedData.translations) mutatedData.translations = {} as any;
    if (!mutatedData.translations[match.key]) {
      // Seed from DEFAULTS so both languages are preserved
      const def = I18N_DEFAULTS[match.key];
      mutatedData.translations[match.key] = def
        ? { he: def.he, en: def.en }
        : { he: '', en: '' };
    }
    (mutatedData.translations[match.key] as any)[match.lang] = newText;

    // Update the reverse lookup with the new text
    lookup.delete(originalText);
    lookup.set(newText, match);
  }
}

function replaceInObject(obj: any, find: string, replace: string): void {
  if (!obj || typeof obj !== 'object') return;

  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (typeof val === 'string') {
      // Exact match or the value contains the find text
      if (val === find) {
        obj[key] = replace;
      } else if (val.includes(find) && find.length >= 10) {
        // For longer strings, allow partial match (e.g. editing part of a paragraph)
        obj[key] = val.replace(find, replace);
      }
    } else if (Array.isArray(val)) {
      val.forEach((item, i) => {
        if (typeof item === 'string' && item === find) {
          val[i] = replace;
        } else if (typeof item === 'object') {
          replaceInObject(item, find, replace);
        }
      });
    } else if (typeof val === 'object') {
      replaceInObject(val, find, replace);
    }
  }
}

// ── Image editing ────────────────────────────────────────────────────────────

function setupImageEditable(container: HTMLElement): void {
  const img = container.querySelector('img');
  if (!img) return;

  container.classList.add('edit-img-wrap');
  const overlay = document.createElement('div');
  overlay.className = 'edit-img-overlay';
  overlay.innerHTML = '📷 Replace image';
  overlay.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    pickImage(img, container.getAttribute('data-edit-img')!);
  });
  container.style.position = 'relative';
  container.appendChild(overlay);
}

function pickImage(img: HTMLImageElement, key: string): void {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = () => {
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      img.src = dataUrl;
      setNestedValue(mutatedData, key, dataUrl);
      markDirty();
    };
    reader.readAsDataURL(file);
  };
  input.click();
}

// ── Logo editing (emoji → image upload) ─────────────────────────────────────

function setupLogoEditable(container: HTMLElement): void {
  container.classList.add('edit-img-wrap');
  const overlay = document.createElement('div');
  overlay.className = 'edit-img-overlay edit-logo-overlay';
  overlay.innerHTML = '📷 Upload logo';
  overlay.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    pickLogoImage(container);
  });
  container.appendChild(overlay);
}

function pickLogoImage(container: HTMLElement): void {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = () => {
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;

      // Update JSON
      mutatedData.business.logo_url = dataUrl;
      mutatedData.business.logo_emoji = '';

      // Update DOM: replace emoji span with img (or update existing img src)
      const existingImg = container.querySelector('img') as HTMLImageElement | null;
      const emojiSpan = container.querySelector('span') as HTMLElement | null;
      if (existingImg) {
        existingImg.src = dataUrl;
      } else if (emojiSpan) {
        const img = document.createElement('img');
        img.src = dataUrl;
        img.alt = mutatedData.business?.name || '';
        img.className = 'h-10 w-auto max-w-[120px] object-contain';
        emojiSpan.replaceWith(img);
      }

      markDirty();
      showToast('✅ לוגו עודכן — שמור כדי לשמור את השינוי');
    };
    reader.readAsDataURL(file);
  };
  input.click();
}

// ── Add photo to gallery ──────────────────────────────────────────────────────

function setupAddPhotoContainer(galleryContainer: HTMLElement): void {
  const key = galleryContainer.getAttribute('data-edit-add-photo')!;

  const addCard = document.createElement('div');
  addCard.className = 'edit-add-photo-btn';
  addCard.setAttribute('data-edit-ui', 'add-photo');

  // Adapt size to gallery style
  if (galleryContainer.classList.contains('grid')) {
    addCard.style.aspectRatio = '1 / 1';
  } else if (galleryContainer.classList.contains('overflow-x-auto')) {
    addCard.style.flexShrink = '0';
    addCard.style.width = '18rem';
    addCard.style.minHeight = '14rem';
  }

  addCard.innerHTML = `<span style="font-size:2.2rem;line-height:1">+</span><span>הוסף תמונה</span>`;
  addCard.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    pickAndAddPhoto(galleryContainer, key, addCard);
  });
  galleryContainer.appendChild(addCard);
}

function pickAndAddPhoto(galleryContainer: HTMLElement, key: string, addCard: HTMLElement): void {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.multiple = true;
  input.onchange = () => {
    Array.from(input.files ?? []).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const arr = (mutatedData as any)[key] as any[];
        arr.push({ url: dataUrl, thumb: dataUrl, source: 'owner', alt_he: 'תמונה', alt_en: 'Photo' });
        const newIndex = arr.length - 1;

        const tile = document.createElement('div');
        tile.setAttribute('data-edit-delete', `${key}.${newIndex}`);
        tile.setAttribute('data-edit-img', `${key}.${newIndex}.url`);

        if (galleryContainer.classList.contains('grid')) {
          tile.className = 'aspect-square cursor-pointer overflow-hidden rounded-xl relative group';
        } else if (galleryContainer.classList.contains('overflow-x-auto')) {
          tile.className = 'snap-center shrink-0 w-72 cursor-pointer overflow-hidden rounded-xl relative group';
        } else {
          tile.className = 'break-inside-avoid cursor-pointer overflow-hidden rounded-xl relative group';
        }

        const img = document.createElement('img');
        img.src = dataUrl;
        img.alt = 'תמונה';
        img.className = 'w-full object-cover';
        tile.appendChild(img);

        galleryContainer.insertBefore(tile, addCard);
        setupDeleteButton(tile);
        setupImageEditable(tile);

        markDirty();
        showToast('✅ תמונה נוספה');
      };
      reader.readAsDataURL(file);
    });
  };
  input.click();
}

// ── List item deletion ───────────────────────────────────────────────────────

function setupDeleteButton(el: HTMLElement): void {
  const btn = document.createElement('button');
  btn.className = 'edit-delete-btn';
  btn.innerHTML = '🗑️';
  btn.title = 'Delete item';
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!confirm('Delete this item?')) return;
    const key = el.getAttribute('data-edit-delete')!;
    const [arrayName, indexStr] = key.split('.');
    const index = parseInt(indexStr, 10);
    const arr = (mutatedData as any)[arrayName];
    if (Array.isArray(arr) && index >= 0 && index < arr.length) {
      arr.splice(index, 1);
      el.style.transition = 'all 0.3s ease';
      el.style.opacity = '0';
      el.style.transform = 'scale(0.95)';
      setTimeout(() => el.remove(), 300);
      markDirty();
    }
  });
  el.style.position = 'relative';
  el.appendChild(btn);
}

// ── Section deletion ─────────────────────────────────────────────────────────

function setupSectionDelete(el: HTMLElement): void {
  el.classList.add('edit-section-deletable');

  const btn = document.createElement('button');
  btn.className = 'edit-section-delete-btn';
  btn.innerHTML = '🗑️ הסר רכיב';
  btn.title = 'Remove this section';

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();

    const sectionKey = el.getAttribute('data-edit-section')!;
    if (!confirm(`להסיר את הרכיב "${sectionKey}"? ניתן לשחזר על ידי עריכת ה-JSON ישירות.`)) return;

    // Animate out
    el.style.transition = 'all 0.4s ease';
    el.style.opacity = '0';
    el.style.transform = 'scale(0.97)';
    el.style.maxHeight = el.offsetHeight + 'px';
    setTimeout(() => {
      el.style.maxHeight = '0';
      el.style.overflow = 'hidden';
      el.style.paddingTop = '0';
      el.style.paddingBottom = '0';
      el.style.marginTop = '0';
      el.style.marginBottom = '0';
    }, 400);
    setTimeout(() => el.remove(), 800);

    // Update mutatedData
    if (!mutatedData.hidden_sections) mutatedData.hidden_sections = [];
    if (!mutatedData.hidden_sections.includes(sectionKey)) {
      mutatedData.hidden_sections.push(sectionKey);
    }
    markDirty();
  });

  el.style.position = 'relative';
  el.appendChild(btn);
}

// ── Toolbar ──────────────────────────────────────────────────────────────────

function createToolbar(): void {
  toolbar = document.createElement('div');
  toolbar.id = 'edit-toolbar';
  toolbar.innerHTML = `
    <span class="edit-toolbar-label">✏️ Edit Mode</span>
    <button id="edit-btn-versions">📋 Versions</button>
    <button id="edit-btn-save">💾 Save</button>
    <button id="edit-btn-deploy">🚀 Deploy</button>
    <button id="edit-btn-cancel">✖ Exit</button>
  `;
  document.body.appendChild(toolbar);
  toolbar.querySelector('#edit-btn-versions')!.addEventListener('click', toggleVersionPanel);
  toolbar.querySelector('#edit-btn-save')!.addEventListener('click', save);
  toolbar.querySelector('#edit-btn-deploy')!.addEventListener('click', triggerDeploy);
  toolbar.querySelector('#edit-btn-cancel')!.addEventListener('click', cancel);
}

// ── Version picker ───────────────────────────────────────────────────────────

async function toggleVersionPanel(): Promise<void> {
  if (versionPanel) {
    closeVersionPanel();
    return;
  }

  try {
    const res = await fetch('/api/versions');
    if (!res.ok) throw new Error('Failed to fetch versions');
    versionsList = await res.json();
  } catch {
    showToast('⚠️ Could not load versions (only available on dev server)');
    return;
  }

  if (versionsList.length <= 1) {
    showToast('ℹ️ No other versions found');
    return;
  }

  versionPanel = document.createElement('div');
  versionPanel.id = 'version-panel';
  versionPanel.innerHTML = `
    <div class="version-panel-header">
      <span>📋 JSON Versions</span>
      <button id="version-panel-close">✕</button>
    </div>
    <div class="version-panel-list">
      ${versionsList.map(v => `
        <div class="version-item${v.isCurrent ? ' version-current' : ''}" data-folder="${v.folder}">
          <div class="version-item-label">${v.label}${v.isCurrent ? ' <span class="version-badge">current</span>' : ''}</div>
          <div class="version-item-folder">${v.folder}</div>
          <div class="version-item-actions">
            <button class="version-btn-preview" data-folder="${v.folder}">👁 Preview</button>
            ${!v.isCurrent ? `<button class="version-btn-apply" data-folder="${v.folder}">✅ Apply</button>` : ''}
          </div>
        </div>
      `).join('')}
    </div>
  `;
  document.body.appendChild(versionPanel);

  versionPanel.querySelector('#version-panel-close')!.addEventListener('click', closeVersionPanel);

  versionPanel.querySelectorAll('.version-btn-preview').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const folder = (e.currentTarget as HTMLElement).getAttribute('data-folder')!;
      previewVersion(folder);
    });
  });

  versionPanel.querySelectorAll('.version-btn-apply').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const folder = (e.currentTarget as HTMLElement).getAttribute('data-folder')!;
      applyVersion(folder);
    });
  });
}

function closeVersionPanel(): void {
  versionPanel?.remove();
  versionPanel = null;
}

async function loadVersionData(folder: string): Promise<BusinessJson | null> {
  try {
    const res = await fetch(`/api/version-data?folder=${encodeURIComponent(folder)}`);
    if (!res.ok) throw new Error('Failed to load version');
    return await res.json();
  } catch {
    showToast('⚠️ Could not load version data');
    return null;
  }
}

async function previewVersion(folder: string): Promise<void> {
  const data = await loadVersionData(folder);
  if (!data) return;

  const info = versionsList.find(v => v.folder === folder);
  previewingVersion = info ?? null;

  // Keep the current editToken so edit mode stays valid after reload
  data.editToken = originalData.editToken;
  mutatedData = structuredClone(data);

  markDirtyWithLabel(`👁 Previewing ${info?.label ?? folder}`);
  showToast(`👁 Loaded ${info?.label ?? folder} — click Save to persist, or Apply for full reload`);
}

async function applyVersion(folder: string): Promise<void> {
  if (isDirty && previewingVersion?.folder !== folder) {
    if (!confirm('You have unsaved changes. Apply this version anyway?')) return;
  }

  const data = await loadVersionData(folder);
  if (!data) return;

  // Keep the current editToken so edit mode stays valid
  data.editToken = originalData.editToken;

  const json = JSON.stringify(data, null, 2);
  const info = versionsList.find(v => v.folder === folder);

  // Save via API, commit to GitHub, trigger redeploy, then reload
  const applyBtn = versionPanel?.querySelector<HTMLButtonElement>(`.version-btn-apply[data-folder="${folder}"]`);
  if (applyBtn) { applyBtn.disabled = true; applyBtn.textContent = '⏳ שומר…'; }

  try {
    const res = await fetch('/api/save-business', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: json,
    });
    if (res.ok) {
      const resData = await res.json();
      const hash = resData.hash ?? resData.git?.hash ?? '';
      showToast(`✅ ${info?.label ?? folder} הוחל — האתר יתעדכן תוך ~1 דקה${hash ? ` (${hash})` : ''}`);
      setTimeout(() => location.reload(), 800);
    } else {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.error || `Server error ${res.status}`);
    }
  } catch (err: any) {
    if (applyBtn) { applyBtn.disabled = false; applyBtn.textContent = '✅ Apply'; }
    showToast(`❌ שגיאה: ${err.message}`);
  }
}

let isDirty = false;
function markDirty(): void {
  isDirty = true;
  const label = toolbar?.querySelector('.edit-toolbar-label');
  if (label) label.textContent = '✏️ Unsaved changes';
  const saveBtn = toolbar?.querySelector('#edit-btn-save') as HTMLElement | null;
  if (saveBtn) saveBtn.style.background = '#22c55e';
}

function markDirtyWithLabel(text: string): void {
  isDirty = true;
  const label = toolbar?.querySelector('.edit-toolbar-label');
  if (label) label.textContent = text;
  const saveBtn = toolbar?.querySelector('#edit-btn-save') as HTMLElement | null;
  if (saveBtn) saveBtn.style.background = '#22c55e';
}

// ── Save (PUT to /api/save-business, fallback to download) ──────────────────

function save(): void {
  const json = JSON.stringify(mutatedData, null, 2);

  const saveBtn = toolbar?.querySelector('#edit-btn-save') as HTMLButtonElement | null;
  if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = '⏳ Saving…'; }

  fetch('/api/save-business', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: json,
  })
    .then(async res => {
      if (res.ok) return res.json();
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.error || `Server error ${res.status}`);
    })
    .then((data: any) => {
      isDirty = false;
      resetToolbar();
      if (data.git?.committed || data.committed) {
        showToast(`✅ נשמר! האתר יתעדכן תוך ~1 דקה (${data.hash ?? data.git?.hash ?? ''})`);
      } else {
        showToast('✅ נשמר בהצלחה!');
      }
    })
    .catch((err: Error) => {
      resetToolbar();
      showToast(`❌ שגיאה בשמירה: ${err.message} — מוריד JSON כגיבוי`);
      downloadJson(json);
      isDirty = false;
    });
}

function downloadJson(json: string): void {
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'business.json';
  a.click();
  URL.revokeObjectURL(url);
}

function resetToolbar(): void {
  const label = toolbar?.querySelector('.edit-toolbar-label');
  if (label) label.textContent = '✏️ Edit Mode';
  const saveBtn = toolbar?.querySelector('#edit-btn-save') as HTMLButtonElement | null;
  if (saveBtn) { saveBtn.style.background = ''; saveBtn.disabled = false; saveBtn.textContent = '💾 Save'; }
}

// ── Deploy (trigger redeploy without saving changes) ─────────────────────────

async function triggerDeploy(): Promise<void> {
  const deployBtn = toolbar?.querySelector<HTMLButtonElement>('#edit-btn-deploy');
  if (deployBtn) { deployBtn.disabled = true; deployBtn.textContent = '⏳ Deploying…'; }

  try {
    const res = await fetch('/api/deploy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ editToken: originalData.editToken }),
    });
    if (res.ok) {
      showToast('🚀 Deploy הופעל — האתר יתעדכן תוך ~1 דקה');
    } else {
      const err = await res.json().catch(() => ({}));
      showToast(`❌ Deploy נכשל: ${err.error || `Server error ${res.status}`}`);
    }
  } catch (err: any) {
    showToast(`❌ Deploy נכשל: ${err.message}`);
  } finally {
    if (deployBtn) { deployBtn.disabled = false; deployBtn.textContent = '🚀 Deploy'; }
  }
}

// ── Cancel ───────────────────────────────────────────────────────────────────

function cancel(): void {
  if (isDirty && !confirm('You have unsaved changes. Exit?')) return;
  observer?.disconnect();
  observer = null;
  document.body.classList.remove('edit-mode-active');
  editStyleEl?.remove();
  toolbar?.remove();

  document.querySelectorAll('.edit-hoverable').forEach(el => {
    (el as HTMLElement).contentEditable = 'false';
    el.classList.remove('edit-hoverable', 'edit-active');
    (el as HTMLElement).removeAttribute('title');
    (el as HTMLElement).removeAttribute('data-edit-original');
  });
  document.querySelectorAll('.edit-delete-btn').forEach(el => el.remove());
  document.querySelectorAll('.edit-section-delete-btn').forEach(el => el.remove());
  document.querySelectorAll('.edit-section-deletable').forEach(el => el.classList.remove('edit-section-deletable'));
  document.querySelectorAll('.edit-img-overlay').forEach(el => el.remove());
  document.querySelectorAll('.edit-img-wrap').forEach(el => el.classList.remove('edit-img-wrap'));
  document.querySelectorAll('[data-edit-ui]').forEach(el => el.remove());
  closeVersionPanel();
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function setNestedValue(obj: any, path: string, value: any): void {
  const parts = path.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = isNaN(Number(parts[i])) ? parts[i] : Number(parts[i]);
    if (current[key] == null) return;
    current = current[key];
  }
  const lastKey = parts[parts.length - 1];
  current[isNaN(Number(lastKey)) ? lastKey : Number(lastKey)] = value;
}

function showToast(message: string): void {
  const existing = document.querySelector('.edit-toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'edit-toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('edit-toast-hide');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ── Injected styles ──────────────────────────────────────────────────────────

function injectStyles(): void {
  editStyleEl = document.createElement('style');
  editStyleEl.textContent = `
    /* ── Editable text ── */
    .edit-hoverable {
      cursor: pointer !important;
      position: relative;
      border-radius: 4px;
      transition: outline 0.15s, background 0.15s;
      outline: 2px dashed transparent;
      outline-offset: 3px;
    }
    .edit-hoverable:hover {
      outline: 2px dashed #eab308;
      background: rgba(234, 179, 8, 0.07);
    }

    /* Active editing state */
    .edit-active {
      outline: 2px solid #eab308 !important;
      outline-offset: 3px;
      background: rgba(234, 179, 8, 0.1) !important;
      cursor: text !important;
    }

    /* ── Image edit overlay ── */
    .edit-img-wrap { cursor: pointer; }
    .edit-img-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      background: rgba(0,0,0,0.5);
      color: white;
      font-size: 1rem;
      font-weight: 600;
      opacity: 0;
      transition: opacity 0.2s;
      pointer-events: auto;
      cursor: pointer;
      border-radius: inherit;
      z-index: 10;
    }
    .edit-img-wrap:hover .edit-img-overlay {
      opacity: 1;
    }

    /* ── Logo overlay (small icon — tighter font) ── */
    .edit-logo-overlay {
      font-size: 0.65rem;
      padding: 2px 4px;
      border-radius: 6px;
      white-space: nowrap;
    }

    /* ── Delete button ── */
    .edit-delete-btn {
      position: absolute;
      top: 6px;
      left: 6px;
      z-index: 20;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      border: none;
      background: #ef4444;
      color: white;
      font-size: 13px;
      cursor: pointer;
      display: none;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      transition: transform 0.15s;
      line-height: 1;
    }
    [dir="rtl"] .edit-delete-btn {
      left: auto;
      right: 6px;
    }
    [data-edit-delete]:hover > .edit-delete-btn {
      display: flex;
    }
    .edit-delete-btn:hover {
      transform: scale(1.15);
      background: #dc2626;
    }

    /* ── Section delete button ── */
    .edit-section-delete-btn {
      position: absolute;
      top: 12px;
      inset-inline-end: 16px;
      z-index: 50;
      display: none;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      border-radius: 10px;
      border: none;
      background: #ef4444;
      color: white;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(239,68,68,0.4);
      transition: background 0.15s, transform 0.15s;
      white-space: nowrap;
    }
    .edit-section-deletable:hover > .edit-section-delete-btn {
      display: flex;
    }
    .edit-section-delete-btn:hover {
      background: #dc2626;
      transform: scale(1.04);
    }
    .edit-section-deletable {
      outline: none;
      transition: outline 0.2s;
    }
    .edit-section-deletable:hover {
      outline: 2px dashed #ef4444;
      outline-offset: -2px;
    }

    /* ── Add photo button ── */
    .edit-add-photo-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      border: 2px dashed #3b82f6;
      border-radius: 12px;
      background: rgba(59, 130, 246, 0.08);
      cursor: pointer;
      color: #3b82f6;
      font-weight: 700;
      min-height: 120px;
      padding: 20px;
      text-align: center;
      transition: background 0.2s, border-color 0.2s, transform 0.15s;
      font-family: inherit;
      font-size: 14px;
      box-sizing: border-box;
    }
    .edit-add-photo-btn:hover {
      background: rgba(59, 130, 246, 0.18);
      border-color: #2563eb;
      transform: scale(1.02);
    }

    /* ── Version panel ── */
    #version-panel {
      position: fixed;
      bottom: 80px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 9998;
      background: #0f172a;
      color: white;
      border-radius: 16px;
      box-shadow: 0 12px 40px rgba(0,0,0,0.45);
      width: 380px;
      max-height: 60vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      font-family: inherit;
      font-size: 14px;
      direction: rtl;
      animation: version-panel-in 0.2s ease;
    }
    @keyframes version-panel-in {
      from { opacity: 0; transform: translateX(-50%) translateY(10px); }
      to   { opacity: 1; transform: translateX(-50%) translateY(0); }
    }
    .version-panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 18px;
      border-bottom: 1px solid rgba(255,255,255,0.1);
      font-weight: 700;
      font-size: 15px;
    }
    .version-panel-header button {
      background: none;
      border: none;
      color: rgba(255,255,255,0.6);
      font-size: 18px;
      cursor: pointer;
      padding: 2px 6px;
      border-radius: 6px;
      transition: background 0.15s;
    }
    .version-panel-header button:hover {
      background: rgba(255,255,255,0.1);
      color: white;
    }
    .version-panel-list {
      overflow-y: auto;
      padding: 8px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .version-item {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 10px;
      padding: 12px 14px;
      transition: background 0.15s, border-color 0.15s;
    }
    .version-item:hover {
      background: rgba(255,255,255,0.1);
      border-color: rgba(255,255,255,0.15);
    }
    .version-current {
      border-color: #3b82f6;
      background: rgba(59, 130, 246, 0.1);
    }
    .version-item-label {
      font-weight: 700;
      font-size: 14px;
      margin-bottom: 2px;
    }
    .version-badge {
      background: #3b82f6;
      color: white;
      font-size: 10px;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 6px;
      margin-inline-start: 6px;
      vertical-align: middle;
    }
    .version-item-folder {
      font-size: 11px;
      color: rgba(255,255,255,0.45);
      margin-bottom: 8px;
      direction: ltr;
      text-align: right;
      word-break: break-all;
    }
    .version-item-actions {
      display: flex;
      gap: 6px;
    }
    .version-btn-preview,
    .version-btn-apply {
      flex: 1;
      padding: 6px 10px;
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 8px;
      background: rgba(255,255,255,0.08);
      color: white;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s;
      text-align: center;
    }
    .version-btn-preview:hover {
      background: rgba(255,255,255,0.18);
    }
    .version-btn-apply {
      background: rgba(34, 197, 94, 0.2);
      border-color: rgba(34, 197, 94, 0.3);
    }
    .version-btn-apply:hover {
      background: rgba(34, 197, 94, 0.35);
    }

    /* ── Floating toolbar ── */
    #edit-toolbar {
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 9999;
      background: #1e293b;
      color: white;
      padding: 10px 20px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      gap: 10px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.35);
      font-family: inherit;
      font-size: 14px;
      direction: rtl;
    }
    #edit-toolbar button {
      background: rgba(255,255,255,0.15);
      border: 1px solid rgba(255,255,255,0.2);
      color: white;
      padding: 8px 16px;
      border-radius: 10px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
      transition: background 0.15s;
      white-space: nowrap;
    }
    #edit-toolbar button:hover {
      background: rgba(255,255,255,0.25);
    }
    .edit-toolbar-label {
      font-weight: 700;
      white-space: nowrap;
    }

    /* ── Toast ── */
    .edit-toast {
      position: fixed;
      top: 80px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 10000;
      background: #1e293b;
      color: white;
      padding: 14px 28px;
      border-radius: 12px;
      font-size: 15px;
      font-weight: 600;
      box-shadow: 0 4px 16px rgba(0,0,0,0.3);
      animation: edit-toast-in 0.3s ease;
      direction: rtl;
    }
    .edit-toast-hide {
      opacity: 0;
      transition: opacity 0.3s;
    }
    @keyframes edit-toast-in {
      from { opacity: 0; transform: translateX(-50%) translateY(-10px); }
      to   { opacity: 1; transform: translateX(-50%) translateY(0); }
    }
  `;
  document.head.appendChild(editStyleEl);
}
