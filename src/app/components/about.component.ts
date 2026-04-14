import { Component, inject } from '@angular/core';
import { I18nService } from '../services/i18n.service';
import { BusinessDataService } from '../services/business-data.service';

@Component({
  selector: 'app-about',
  standalone: true,
  template: `
    <section id="about" class="py-20 bg-gray-50" [attr.dir]="i18n.dir()">
      <div class="max-w-6xl mx-auto px-6">
        <div class="grid md:grid-cols-2 gap-12 items-center">

          <!-- Text side -->
          <div data-animate>
            <h2 class="text-4xl font-black text-gray-900 mb-4">
              {{ i18n.t()('about_title') }}
            </h2>
            <div class="w-16 h-1.5 bg-blue-600 rounded mb-6"></div>
            <p data-edit-key="translations.about_desc.he" class="text-gray-600 text-lg leading-relaxed mb-8">
              {{ i18n.t()('about_desc') }}
            </p>

            <!-- Hours quick view -->
            @if (biz.hours().length && !biz.isHidden('hours')) {
              <div [class]="hoursCardClass()" data-edit-section="hours">
                <h3 class="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  🕐 {{ i18n.t()('hours_title') }}
                </h3>
                <div class="space-y-2">
                  @for (h of biz.hours(); track h.day_key) {
                    <div class="flex justify-between items-center text-sm">
                      <span class="font-medium text-gray-700">
                        {{ i18n.isPrimary() ? h.day_he : h.day_en }}
                      </span>
                      <span
                        [class]="h.is_open ? 'text-green-600 font-semibold' : 'text-red-400'"
                      >
                        {{ i18n.isPrimary() ? h.hours_he : h.hours_en }}
                      </span>
                    </div>
                  }
                </div>
              </div>
            }
          </div>

          <!-- Stats side -->
          <div class="grid grid-cols-2 gap-5">
            @for (stat of stats(); track stat.label) {
              <div [class]="statCardClass()">
                <div class="text-4xl mb-2">{{ stat.icon }}</div>
                <div class="text-3xl font-black text-blue-700 mb-1">{{ stat.value }}</div>
                <div class="text-sm text-gray-500">{{ stat.label }}</div>
              </div>
            }
          </div>

        </div>
      </div>
    </section>
  `,
})
export class AboutComponent {
  protected i18n = inject(I18nService);
  protected biz = inject(BusinessDataService);

  statCardClass(): string {
    switch (this.biz.design().card_style) {
      case 'border': return 'bg-white rounded-2xl border-2 border-blue-200 p-6 text-center hover:border-blue-400 hover:-translate-y-1 transition-all duration-200';
      case 'glass':  return 'bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 shadow-lg p-6 text-center hover:-translate-y-1 transition-all duration-200';
      case 'solid':  return 'bg-blue-50 rounded-2xl p-6 text-center hover:bg-blue-100 hover:-translate-y-1 transition-all duration-200';
      default:       return 'bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center hover:shadow-md hover:-translate-y-1 transition-all duration-200';
    }
  }

  hoursCardClass(): string {
    switch (this.biz.design().card_style) {
      case 'border': return 'bg-white rounded-2xl border-2 border-blue-200 p-6';
      case 'glass':  return 'bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 shadow-lg p-6';
      case 'solid':  return 'bg-blue-50 rounded-2xl p-6';
      default:       return 'bg-white rounded-2xl shadow-sm border border-gray-100 p-6';
    }
  }

  stats() {
    const b = this.biz.business();
    return [
      { icon: '⭐', value: b?.rating ?? '4.9', label: this.i18n.t()('about_rating_label') },
      { icon: '😊', value: `${b?.reviews_count ?? 49}+`, label: this.i18n.t()('about_reviews_label') },
      { icon: '🏆', value: this.i18n.t()('about_years_value'), label: this.i18n.t()('about_years_label') },
      { icon: '⚡', value: '24/7', label: this.i18n.t()('about_available_label') },
    ];
  }
}
