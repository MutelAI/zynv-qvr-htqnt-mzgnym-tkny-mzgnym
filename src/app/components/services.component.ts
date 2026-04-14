import { Component, inject } from '@angular/core';
import { I18nService } from '../services/i18n.service';
import { BusinessDataService } from '../services/business-data.service';

@Component({
  selector: 'app-services',
  standalone: true,
  template: `
    @if (!biz.isHidden('services')) {
    <section id="services" class="py-20 bg-white" [attr.dir]="i18n.dir()" data-edit-section="services">
      <div class="max-w-6xl mx-auto px-6">
        <!-- Header -->
        <div class="text-center mb-14" data-animate>
          <h2 class="text-4xl font-black text-gray-900 mb-3">
            {{ i18n.t()('services_title') }}
          </h2>
          <div class="w-16 h-1.5 bg-blue-600 rounded mx-auto mb-4"></div>
          <p data-edit-key="translations.services_subtitle.he" class="text-gray-500 text-lg max-w-2xl mx-auto">
            {{ i18n.t()('services_subtitle') }}
          </p>
        </div>

        <!-- Services grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          @for (svc of biz.services(); track svc.id; let i = $index) {
            <div [class]="cardClass()" data-animate [attr.data-edit-delete]="'services.' + i">
              <div class="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
                {{ svc.icon }}
              </div>
              <h3 data-edit-key="services.{{i}}.title_he" class="font-bold text-gray-900 text-lg mb-2">
                {{ i18n.isPrimary() ? svc.title_he : svc.title_en }}
              </h3>
              <p data-edit-key="services.{{i}}.desc_he" class="text-gray-500 text-sm leading-relaxed">
                {{ i18n.isPrimary() ? svc.desc_he : svc.desc_en }}
              </p>
            </div>
          }
        </div>

        <!-- CTA below services -->
        <div class="mt-12 text-center">
          <a
            href="#contact"
            (click)="scrollTo($event)"
            [class]="'inline-flex items-center gap-2 bg-blue-600 text-white font-bold px-8 py-4 hover:bg-blue-700 hover:scale-105 transition-all duration-200 shadow-lg shadow-blue-200 ' + btnClass()"
          >
            🛠️ {{ i18n.t()('services_cta') }}
          </a>
        </div>
      </div>
    </section>
    }
  `,
})
export class ServicesComponent {
  protected i18n = inject(I18nService);
  protected biz = inject(BusinessDataService);

  cardClass(): string {
    switch (this.biz.design().card_style) {
      case 'border': return 'group bg-white rounded-2xl p-6 border-2 border-blue-200 hover:border-blue-400 hover:-translate-y-1 transition-all duration-300 text-center';
      case 'glass':  return 'group bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/30 shadow-lg hover:-translate-y-1 transition-all duration-300 text-center';
      case 'solid':  return 'group bg-blue-50 rounded-2xl p-6 hover:bg-blue-100 hover:-translate-y-1 transition-all duration-300 text-center';
      default:       return 'group bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:border-blue-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 text-center';
    }
  }

  btnClass(): string {
    switch (this.biz.design().button_style) {
      case 'pill':  return 'rounded-full';
      case 'sharp': return 'rounded-lg';
      default:      return 'rounded-2xl';
    }
  }

  scrollTo(e: Event): void {
    e.preventDefault();
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
  }
}
