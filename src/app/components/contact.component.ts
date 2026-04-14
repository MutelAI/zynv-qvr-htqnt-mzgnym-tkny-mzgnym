import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { I18nService } from '../services/i18n.service';
import { BusinessDataService } from '../services/business-data.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [FormsModule],
  template: `
    <section id="contact" class="py-20 bg-gradient-to-br from-orange-200 via-sky-300 to-sky-500" [attr.dir]="i18n.dir()">
      <div class="max-w-6xl mx-auto px-6">
        <div class="grid md:grid-cols-2 gap-12 items-start">

          <!-- Left: Info -->
          <div class="text-white">
            <h2 class="text-4xl font-black mb-3">
              {{ i18n.t()('contact_title') }}
            </h2>
            <div class="w-16 h-1.5 bg-white/50 rounded mb-6"></div>
            <p data-edit-key="translations.contact_subtitle.he" class="text-white/80 text-lg mb-8">
              {{ i18n.t()('contact_subtitle') }}
            </p>

            <!-- Direct contact buttons -->
            <div class="space-y-4">
              @if (biz.business(); as b) {
                <a
                  [href]="'tel:' + b.phone"
                  class="flex items-center gap-4 bg-white/15 hover:bg-white/25 border border-white/30 rounded-2xl px-5 py-4 transition-all"
                >
                  <span class="text-2xl">📞</span>
                  <div>
                    <div class="text-xs text-white/65 mb-0.5">{{ i18n.t()('contact_call') }}</div>
                    <div class="font-bold text-lg">{{ b.phone_display }}</div>
                  </div>
                </a>

                <a
                  [href]="waUrl()"
                  target="_blank"
                  rel="noopener"
                  class="flex items-center gap-4 bg-green-500/80 hover:bg-green-500 border border-green-400/30 rounded-2xl px-5 py-4 transition-all"
                >
                  <span class="text-2xl">💬</span>
                  <div>
                    <div class="text-xs text-green-100 mb-0.5">{{ i18n.t()('contact_whatsapp') }}</div>
                    <div class="font-bold text-lg">{{ b.phone_display }}</div>
                  </div>
                </a>

                <a
                  [href]="b.maps_url"
                  target="_blank"
                  rel="noopener"
                  class="flex items-center gap-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl px-5 py-4 transition-all"
                >
                  <span class="text-2xl">📍</span>
                  <div>
                    <div class="text-xs text-white/65 mb-0.5">{{ i18n.t()('contact_address') }}</div>
                    <div class="font-semibold">
                      {{ i18n.isPrimary() ? b.address_he : b.address_en }}
                    </div>
                  </div>
                </a>
              }
            </div>
          </div>

          <!-- Right: Form -->
          <div class="bg-white rounded-3xl shadow-2xl p-8">
            @if (!submitted()) {
              <form (ngSubmit)="onSubmit()" #form="ngForm">
                <h3 class="text-xl font-black text-gray-800 mb-6">
                  {{ i18n.t()('contact_form_title') }}
                </h3>

                <div class="space-y-4">
                  <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1">
                      {{ i18n.t()('contact_name') }}
                    </label>
                    <input
                      type="text"
                      [(ngModel)]="formData.name"
                      name="name"
                      required
                      [placeholder]="i18n.t()('contact_name_placeholder')"
                      class="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                    />
                  </div>

                  <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1">
                      {{ i18n.t()('contact_phone') }}
                    </label>
                    <input
                      type="tel"
                      [(ngModel)]="formData.phone"
                      name="phone"
                      required
                      [placeholder]="i18n.t()('contact_phone_placeholder')"
                      class="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                    />
                  </div>

                  <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1">
                      {{ i18n.t()('contact_message') }}
                    </label>
                    <textarea
                      [(ngModel)]="formData.message"
                      name="message"
                      rows="3"
                      [placeholder]="i18n.t()('contact_message_placeholder')"
                      class="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition resize-none"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    [disabled]="!form.valid"
                    [class]="'w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white font-bold py-4 transition-all hover:scale-[1.02] shadow-lg shadow-green-200 text-lg ' + btnClass()"
                  >
                    {{ i18n.t()('contact_submit') }}
                  </button>
                </div>
              </form>
            } @else {
              <div class="text-center py-8">
                <div class="text-6xl mb-4">✅</div>
                <h3 class="text-xl font-black text-gray-800 mb-2">
                  {{ i18n.t()('contact_thanks_title') }}
                </h3>
                <p class="text-gray-500 text-sm">
                  {{ i18n.t()('contact_thanks_desc') }}
                </p>
              </div>
            }
          </div>

        </div>
      </div>
    </section>
  `,
})
export class ContactComponent {
  protected i18n = inject(I18nService);
  protected biz = inject(BusinessDataService);
  protected submitted = signal(false);

  protected formData = { name: '', phone: '', message: '' };

  onSubmit(): void {
    const b = this.biz.business();
    if (!b) return;

    const t = this.i18n.t();
    const msg = `${t('contact_wa_intro')} ${this.formData.name}.\n${t('contact_wa_phone_label')} ${this.formData.phone}\n${t('contact_wa_message_label')} ${this.formData.message || t('contact_wa_default_msg')}`;

    const phone = (b.whatsapp ?? '').replace(/\D/g, '');
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
    this.submitted.set(true);
  }

  btnClass(): string {
    switch (this.biz.design().button_style) {
      case 'pill':  return 'rounded-full';
      case 'sharp': return 'rounded-lg';
      default:      return 'rounded-2xl';
    }
  }

  waUrl(): string {
    const phone = this.biz.business()?.whatsapp?.replace(/\D/g, '') ?? '';
    return `https://wa.me/${phone}`;
  }
}
