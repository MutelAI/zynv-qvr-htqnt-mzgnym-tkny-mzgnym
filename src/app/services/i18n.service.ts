import { Injectable, computed, inject, signal } from '@angular/core';
import { BusinessDataService } from './business-data.service';
import { I18N_DEFAULTS } from './i18n-defaults';

export type Lang = string; // ISO 639-1 code, e.g. 'he', 'hu', 'en'

/** Languages that render right-to-left. */
const RTL_LANGS = new Set(['he', 'ar', 'fa', 'ur']);

const DEFAULTS = I18N_DEFAULTS;

@Injectable({ providedIn: 'root' })
export class I18nService {
  private biz = inject(BusinessDataService);

  /** ISO code the user has explicitly chosen; null = follow site default. */
  private _userLang = signal<Lang | null>(null);

  /** The site's primary language as set by the generator (e.g. 'hu', 'he', 'en'). */
  readonly siteLang = computed(() => this.biz.business()?.site_lang ?? 'he');

  /** Currently active language: user override → site default. */
  readonly lang = computed<Lang>(() => this._userLang() ?? this.siteLang());

  /** True when the active language is the primary (non-English) one. */
  readonly isPrimary = computed(() => this.lang() !== 'en');

  readonly isRtl = computed(() => RTL_LANGS.has(this.lang()));
  readonly dir   = computed(() => this.isRtl() ? 'rtl' : 'ltr');

  /** Show language toggle only when the business.json includes a lang_toggle translation (bilingual sites). */
  readonly showLangToggle = computed(() => 'lang_toggle' in this.biz.translations());

  /** Returns the translation for the given key — checks business.json first, then static defaults. */
  t = computed(() => {
    const translations = this.biz.translations();
    const lang     = this.lang();
    const siteLang = this.siteLang();

    return (key: string, fallback?: string): string => {
      const bizEntry = translations[key];
      const defEntry = DEFAULTS[key];

      // Helper: pick primary or English value from an entry
      const pick = (entry: { he: string; en: string } | undefined) => {
        if (!entry) return null;
        return lang === 'en'
          ? (entry['en'] || entry['he'] || null)
          : (entry['he'] || entry['en'] || null);
      };

      // Business-specific translations always win
      if (bizEntry) return pick(bizEntry) ?? fallback ?? key;

      // Static defaults: for non-Hebrew sites, 'he' contains Hebrew text which is wrong
      // → fall back to English instead of showing Hebrew to Hungarian/French/etc. visitors
      if (defEntry) {
        if (lang === 'en' || siteLang !== 'he') {
          return defEntry['en'] || fallback || key;
        }
        return defEntry['he'] || defEntry['en'] || fallback || key;
      }

      return fallback || key;
    };
  });

  toggleLang(): void {
    const current  = this.lang();
    const siteLang = this.siteLang();
    this._userLang.set(current === 'en' ? siteLang : 'en');
  }

  setLang(lang: Lang): void {
    this._userLang.set(lang);
  }
}
