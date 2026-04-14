import { Component, inject } from '@angular/core';
import { I18nService } from '../services/i18n.service';
import { BusinessDataService } from '../services/business-data.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  template: `
    <footer class="bg-gray-900 text-gray-400 py-10" [attr.dir]="i18n.dir()">
      <div class="max-w-6xl mx-auto px-6">
        <div class="grid md:grid-cols-3 gap-8 mb-8">

          <!-- Brand -->
          <div>
            <div class="flex items-center gap-2 mb-3">
              <span class="text-2xl">{{ biz.business()?.logo_emoji || '🏢' }}</span>
              <span class="text-white font-bold text-lg">
                {{ i18n.isPrimary() ? biz.business()?.name : biz.business()?.name_en }}
              </span>
            </div>
            <p class="text-sm leading-relaxed">
              {{ i18n.isPrimary() ? biz.business()?.category_he : biz.business()?.category_en }}
            </p>
            <div class="flex gap-2 mt-4">
              @if (biz.business(); as b) {
                <a [href]="'tel:' + b.phone" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                  📞 {{ i18n.t()('contact_call') }}
                </a>
                <a [href]="waUrl()" target="_blank" rel="noopener" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                  💬 WhatsApp
                </a>
              }
            </div>
          </div>

          <!-- Quick links -->
          <div>
            <h4 class="text-white font-semibold mb-3">
              {{ i18n.t()('footer_quick_links') }}
            </h4>
            <ul class="space-y-2 text-sm">
              @for (item of navItems; track item.key) {
                <li>
                  <a
                    [href]="'#' + item.anchor"
                    (click)="scrollTo(item.anchor, $event)"
                    class="hover:text-white transition-colors"
                  >
                    {{ i18n.t()(item.key) }}
                  </a>
                </li>
              }
            </ul>
          </div>

          <!-- Contact info -->
          <div>
            <h4 class="text-white font-semibold mb-3">
              {{ i18n.t()('contact_title') }}
            </h4>
            @if (biz.business(); as b) {
              <ul class="space-y-2 text-sm">
                <li>
                  <a [href]="'tel:' + b.phone" class="hover:text-white transition-colors">
                    📞 {{ b.phone_display }}
                  </a>
                </li>
                <li>
                  <a [href]="b.maps_url" target="_blank" rel="noopener" class="hover:text-white transition-colors">
                    📍 {{ i18n.isPrimary() ? b.address_he : b.address_en }}
                  </a>
                </li>
                <li>
                  🌐
                  <a [href]="b.website" target="_blank" rel="noopener" class="hover:text-white transition-colors">
                    {{ b.website }}
                  </a>
                </li>
              </ul>
            }
          </div>
        </div>

        <!-- Bottom bar -->
        <div class="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          <span>
            © {{ year }}
            {{ i18n.isPrimary() ? biz.business()?.name : biz.business()?.name_en }}.
            {{ i18n.t()('footer_rights') }}
          </span>
        </div>
      </div>
    </footer>
  `,
})
export class FooterComponent {
  protected i18n = inject(I18nService);
  protected biz = inject(BusinessDataService);
  protected year = new Date().getFullYear();

  protected navItems = [
    { key: 'nav_about', anchor: 'about' },
    { key: 'nav_services', anchor: 'services' },
    { key: 'nav_gallery', anchor: 'gallery' },
    { key: 'nav_reviews', anchor: 'reviews' },
    { key: 'nav_contact', anchor: 'contact' },
    { key: 'nav_location', anchor: 'location' },
  ];

  scrollTo(anchor: string, e: Event): void {
    e.preventDefault();
    document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth' });
  }

  waUrl(): string {
    return `https://wa.me/${this.biz.business()?.whatsapp?.replace(/\D/g, '')}`;
  }
}
