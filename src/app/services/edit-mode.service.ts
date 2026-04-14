import { Injectable, signal } from '@angular/core';

declare global {
  interface Window { __editToken?: string | null; }
}

/**
 * Lightweight shell (~300 B minified) that lives in the main bundle.
 * The real edit logic is lazy-loaded only when a valid token is present.
 */
@Injectable({ providedIn: 'root' })
export class EditModeService {
  /** True once the edit module is loaded and active. */
  readonly active = signal(false);

  /** Exposed so the lazy module can flip it on. */
  _activate(): void { this.active.set(true); }
  _deactivate(): void { this.active.set(false); }

  constructor() {
    const token = window.__editToken;
    if (token) {
      this.bootstrap(token);
    }
  }

  private async bootstrap(token: string): Promise<void> {
    // Dynamic import — this chunk is NOT included in the main bundle
    const { initEditMode } = await import('../edit/edit-module');
    initEditMode(token);
  }
}
