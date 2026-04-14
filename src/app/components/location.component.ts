import { Component, inject, computed } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { I18nService } from '../services/i18n.service';
import { BusinessDataService } from '../services/business-data.service';

@Component({
  selector: 'app-location',
  standalone: true,
  template: `
    @if (!biz.isHidden('location')) {
    <section id="location" class="py-20 bg-gray-50" [attr.dir]="i18n.dir()" data-edit-section="location">
      <div class="max-w-6xl mx-auto px-6">
        <div class="text-center mb-12" data-animate>
          <h2 class="text-4xl font-bold text-gray-900 mb-3">{{ i18n.t()('location_title') }}</h2>
          <p class="text-gray-500 text-lg">{{ i18n.t()('location_subtitle') }}</p>
        </div>

        @if (biz.business(); as b) {
          <div class="grid md:grid-cols-2 gap-8 items-stretch" data-animate>
            <!-- Map embed -->
            <div class="rounded-2xl overflow-hidden shadow-lg min-h-[320px]">
              @if (safeMapUrl(); as url) {
                <iframe
                  [src]="url"
                  width="100%"
                  height="100%"
                  style="border:0; min-height:320px"
                  allowfullscreen
                  loading="lazy"
                  referrerpolicy="no-referrer-when-downgrade"
                ></iframe>
              }
            </div>

            <!-- Info card -->
            <div class="bg-white rounded-2xl shadow-lg p-8 flex flex-col justify-center gap-6">
              <div class="flex items-start gap-4">
                <span class="text-3xl">📍</span>
                <div>
                  <h3 class="font-bold text-gray-800 text-lg mb-1">{{ i18n.t()('location_address') }}</h3>
                  <p class="text-gray-600">{{ i18n.isPrimary() ? b.address_he : b.address_en }}</p>
                </div>
              </div>

              <div class="flex items-start gap-4">
                <span class="text-3xl">📞</span>
                <div>
                  <h3 class="font-bold text-gray-800 text-lg mb-1">{{ i18n.t()('location_phone') }}</h3>
                  <a [href]="'tel:' + b.phone" class="text-blue-600 hover:underline">{{ b.phone_display }}</a>
                </div>
              </div>


              <a [href]="b.maps_url" target="_blank" rel="noopener"
                 class="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-colors mt-2">
                🗺️ {{ i18n.t()('location_navigate') }}
              </a>
            </div>
          </div>
        }
      </div>
    </section>
    }
  `,
})
export class LocationComponent {
  protected i18n = inject(I18nService);
  protected biz = inject(BusinessDataService);
  private sanitizer = inject(DomSanitizer);

  protected safeMapUrl = computed<SafeResourceUrl | null>(() => {
    const b = this.biz.business();
    if (!b?.geo) return null;
    const q = encodeURIComponent(`${b.geo.latitude},${b.geo.longitude}`);
    const url = `https://maps.google.com/maps?q=${q}&z=15&output=embed`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  });
}
