import { Injectable, Signal, signal } from '@angular/core';

export interface BusinessInfo {
  name: string;
  name_en: string;
  site_lang: string;
  phone: string;
  phone_display: string;
  whatsapp?: string;   // optional – omit or leave empty if not on WhatsApp
  website: string;
  rating: number;
  reviews_count: number;
  address_he: string;
  address_en: string;
  category_he: string;
  category_en: string;
  maps_url: string;
  thumbnail: string;
  logo_emoji: string;
  logo_url?: string;
  geo: { latitude: number; longitude: number };
  schema_type: string;
  price_range: string;
}

export interface WorkingHour {
  day_key: string;
  day_he: string;
  day_en: string;
  hours_he: string;
  hours_en: string;
  is_open: boolean;
}

export interface ServiceItem {
  id: string;
  icon: string;
  title_he: string;
  title_en: string;
  desc_he: string;
  desc_en: string;
}

export interface Review {
  author: string;
  rating: number;
  text_he: string;
  text_en: string;
  date: string;
  is_local_guide: boolean;
}

export interface Photo {
  url: string;
  thumb: string;
  source: string;
  alt_he: string;
  alt_en: string;
}

export interface DesignTokens {
  hero_layout: string;
  card_style: string;
  button_style: string;
  hero_pattern: string;
  gallery_style: string;
  section_style: string;
  animation_style: string;
}

const DEFAULT_DESIGN: DesignTokens = {
  hero_layout: 'centered',
  card_style: 'shadow',
  button_style: 'rounded',
  hero_pattern: 'circles',
  gallery_style: 'masonry',
  section_style: 'standard',
  animation_style: 'elegant',
};

export interface BusinessJson {
  business: BusinessInfo;
  hours: WorkingHour[];
  services: ServiceItem[];
  reviews: Review[];
  photos: Photo[];
  translations: Record<string, { he: string; en: string }>;
  design?: DesignTokens;
  hidden_sections?: string[];
}

declare global {
  interface Window { __bizData?: Promise<BusinessJson>; }
}

@Injectable({ providedIn: 'root' })
export class BusinessDataService {
  private _business = signal<BusinessInfo | null>(null);
  private _hours = signal<WorkingHour[]>([]);
  private _services = signal<ServiceItem[]>([]);
  private _reviews = signal<Review[]>([]);
  private _photos = signal<Photo[]>([]);
  private _translations = signal<Record<string, { he: string; en: string }>>({});
  private _design = signal<DesignTokens>(DEFAULT_DESIGN);
  private _loaded = signal(false);
  private _hiddenSections = signal<string[]>([]);

  readonly business: Signal<BusinessInfo | null> = this._business.asReadonly();
  readonly hours: Signal<WorkingHour[]> = this._hours.asReadonly();
  readonly services: Signal<ServiceItem[]> = this._services.asReadonly();
  readonly reviews: Signal<Review[]> = this._reviews.asReadonly();
  readonly photos: Signal<Photo[]> = this._photos.asReadonly();
  readonly translations: Signal<Record<string, { he: string; en: string }>> = this._translations.asReadonly();
  readonly design: Signal<DesignTokens> = this._design.asReadonly();
  readonly loaded: Signal<boolean> = this._loaded.asReadonly();
  readonly hiddenSections: Signal<string[]> = this._hiddenSections.asReadonly();

  isHidden(key: string): boolean {
    return this._hiddenSections().includes(key);
  }

  constructor() {
    this.loadAll();
  }

  private loadAll(): void {
    // Use pre-fetched promise from inline script, or fetch now as fallback
    const promise = window.__bizData ?? fetch('/data/business.json').then(r => r.json());
    promise.then((data: BusinessJson) => {
      this._business.set(data.business);
      this._hours.set(data.hours);
      this._services.set(data.services);
      this._reviews.set(data.reviews);
      this._photos.set(data.photos);
      this._translations.set(data.translations ?? {});
      this._design.set({ ...DEFAULT_DESIGN, ...(data.design ?? {}) });
      this._hiddenSections.set(data.hidden_sections ?? []);
      this._loaded.set(true);
    });
  }
}
