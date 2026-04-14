import { Component, OnInit, effect, inject } from '@angular/core';
import { HeaderComponent } from '../components/header.component';
import { HeroComponent } from '../components/hero.component';
import { AboutComponent } from '../components/about.component';
import { ServicesComponent } from '../components/services.component';
import { GalleryComponent } from '../components/gallery.component';
import { ReviewsComponent } from '../components/reviews.component';
import { ContactComponent } from '../components/contact.component';
import { LocationComponent } from '../components/location.component';
import { FooterComponent } from '../components/footer.component';
import { WhatsappFabComponent } from '../components/whatsapp-fab.component';
import { I18nService } from '../services/i18n.service';
import { BusinessDataService, BusinessInfo } from '../services/business-data.service';
import { ScrollAnimationService } from '../services/scroll-animation.service';
import { EditModeService } from '../services/edit-mode.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    HeaderComponent,
    HeroComponent,
    AboutComponent,
    ServicesComponent,
    GalleryComponent,
    ReviewsComponent,
    ContactComponent,
    LocationComponent,
    FooterComponent,
    WhatsappFabComponent,
  ],
  template: `
    <app-header />
    <main>
      <app-hero />
      <app-about />
      @defer (on viewport) {
        <app-services />
      } @placeholder {
        <div style="min-height:200px"></div>
      }
      @defer (on viewport) {
        <app-gallery />
      } @placeholder {
        <div style="min-height:200px"></div>
      }
      @defer (on viewport) {
        <app-reviews />
      } @placeholder {
        <div style="min-height:200px"></div>
      }
      <app-contact />
      <app-location />
    </main>
    <app-footer />
    <app-whatsapp-fab />
  `,
})
export default class HomePage implements OnInit {
  private i18n = inject(I18nService);
  private biz = inject(BusinessDataService);
  private scrollAnim = inject(ScrollAnimationService);
  private _editMode = inject(EditModeService); // triggers lazy bootstrap if ?edit= present

  constructor() {
    effect(() => {
      const lang = this.i18n.lang();
      const b = this.biz.business();
      document.documentElement.setAttribute('lang', lang);
      document.documentElement.setAttribute('dir', lang === 'he' ? 'rtl' : 'ltr');
      this.updateSEO(lang === 'he', b);
    });

    effect(() => {
      const b = this.biz.business();
      if (b) this.injectJsonLd(b);
    });

    // Kick off scroll animations once data is loaded
    effect(() => {
      if (this.biz.loaded()) {
        // Wait for Angular + deferred blocks to render
        setTimeout(() => this.scrollAnim.init(), 300);
      }
    });
  }

  ngOnInit(): void {
    document.documentElement.setAttribute('lang', 'he');
    document.documentElement.setAttribute('dir', 'rtl');
    this.updateSEO(true, null);
  }

  private setMeta(attrs: Record<string, string>): void {
    const selector = Object.entries(attrs)
      .filter(([k]) => k !== 'content')
      .map(([k, v]) => `[${k}="${v}"]`)
      .join('');
    let el = document.querySelector<HTMLMetaElement>(`meta${selector}`);
    if (!el) {
      el = document.createElement('meta');
      Object.entries(attrs).filter(([k]) => k !== 'content').forEach(([k, v]) => el!.setAttribute(k, v));
      document.head.appendChild(el);
    }
    el.setAttribute('content', attrs['content'] ?? '');
  }

  private updateSEO(isHe: boolean, b: BusinessInfo | null): void {
    const name = b?.name ?? '';
    const nameEn = b?.name_en ?? '';
    const displayName = isHe ? name : nameEn;
    const phone = b?.phone_display ?? '';
    const rating = b?.rating ?? 0;
    const reviewCount = b?.reviews_count ?? 0;
    const image = b?.thumbnail ?? '';
    const website = b?.website ?? '';
    const category = isHe ? (b?.category_he ?? '') : (b?.category_en ?? '');

    document.title = `${displayName} | ${category}`;
    this.setMeta({ name: 'description', content: `${displayName} - ${category}. ⭐ ${rating}/5 | ${reviewCount} ${isHe ? 'ביקורות' : 'reviews'} | 📞 ${phone}` });
    this.setMeta({ name: 'author', content: displayName });

    this.setMeta({ property: 'og:type', content: 'business.business' });
    this.setMeta({ property: 'og:title', content: `${displayName} | ${category}` });
    this.setMeta({ property: 'og:description', content: `${displayName} • ⭐${rating} • 📞 ${phone}` });
    this.setMeta({ property: 'og:image', content: image });
    this.setMeta({ property: 'og:url', content: website });
    this.setMeta({ property: 'og:locale', content: isHe ? 'he_IL' : 'en_US' });
    this.setMeta({ property: 'og:site_name', content: displayName });

    this.setMeta({ name: 'twitter:card', content: 'summary_large_image' });
    this.setMeta({ name: 'twitter:title', content: displayName });
    this.setMeta({ name: 'twitter:description', content: `${category} • ⭐${rating}` });
    this.setMeta({ name: 'twitter:image', content: image });
    this.setMeta({ name: 'robots', content: 'index, follow' });
  }

  private injectJsonLd(b: BusinessInfo): void {
    const existing = document.getElementById('structured-data');
    if (existing) existing.remove();

    const hours = this.biz.hours();
    const openHours = hours
      .filter((h) => h.is_open)
      .map((h) => {
        const match = h.hours_en.match(/(\d{1,2}:\d{2})\s*[–-]\s*(\d{1,2}:\d{2})/);
        return {
          '@type': 'OpeningHoursSpecification',
          'dayOfWeek': h.day_en,
          'opens': match ? match[1] : '00:00',
          'closes': match ? match[2] : '23:59',
        };
      });

    const schema: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': b.schema_type || 'LocalBusiness',
      'name': b.name,
      'alternateName': b.name_en,
      'description': b.category_he,
      'telephone': b.phone,
      'url': b.website,
      'image': b.thumbnail,
      'address': {
        '@type': 'PostalAddress',
        'streetAddress': b.address_en,
        'addressCountry': 'IL',
      },
      'geo': {
        '@type': 'GeoCoordinates',
        'latitude': b.geo.latitude,
        'longitude': b.geo.longitude,
      },
      'openingHoursSpecification': openHours,
      'aggregateRating': {
        '@type': 'AggregateRating',
        'ratingValue': b.rating.toString(),
        'reviewCount': b.reviews_count.toString(),
        'bestRating': '5',
        'worstRating': '1',
      },
      'priceRange': b.price_range || '$$',
    };

    const script = document.createElement('script');
    script.id = 'structured-data';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schema, null, 2);
    document.head.appendChild(script);
  }
}
