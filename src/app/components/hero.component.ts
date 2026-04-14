import { Component, inject } from '@angular/core';
import { I18nService } from '../services/i18n.service';
import { BusinessDataService } from '../services/business-data.service';

@Component({
  selector: 'app-hero',
  standalone: true,
  template: `
    <section
      id="hero"
      [class]="'relative overflow-hidden bg-gradient-to-br from-sky-400 via-amber-100 to-orange-200 flex items-center ' + (biz.design().hero_layout === 'minimal' ? 'min-h-[70vh] items-end' : 'justify-center min-h-screen')"
      [attr.dir]="i18n.dir()"
    >
      <!-- ═══ Background patterns ═══ -->
      @switch (biz.design().hero_pattern) {
        @case ('circles') {
          <div class="absolute inset-0 overflow-hidden pointer-events-none">
            <div class="absolute -top-40 -right-40 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
            <div class="absolute -bottom-40 -left-40 w-96 h-96 bg-sky-300/20 rounded-full blur-3xl animate-pulse" style="animation-delay:1s"></div>
            <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl"></div>
          </div>
        }
        @case ('dots') {
          <div
            class="absolute inset-0 pointer-events-none opacity-20"
            style="background-image: radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px); background-size: 28px 28px;"
          ></div>
        }
        @case ('mesh') {
          <div class="absolute inset-0 overflow-hidden pointer-events-none">
            <div class="absolute top-0 right-0 w-[500px] h-[500px] bg-sky-400/30 rounded-full blur-[100px] -translate-y-1/4 translate-x-1/4"></div>
            <div class="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-300/20 rounded-full blur-[80px] translate-y-1/4 -translate-x-1/4"></div>
            <div class="absolute top-1/2 left-1/3 w-[300px] h-[300px] bg-indigo-500/15 rounded-full blur-[60px]"></div>
          </div>
        }
        @default { <!-- none: clean gradient --> }
      }

      <!-- ═══ Layout: split ═══ -->
      @if (biz.design().hero_layout === 'split') {
        <div class="relative z-10 max-w-6xl mx-auto px-6 py-32 flex flex-col md:flex-row items-center gap-12 w-full">
          <div class="flex-1 text-white" [class.text-center]="i18n.dir() !== 'rtl'" [class.md:text-start]="true">
            <div class="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/30 rounded-full px-4 py-2 text-sm font-medium mb-6 animate-fade-in">
              <span>{{ biz.business()?.logo_emoji || '🏢' }}</span>
              <span data-edit-key="translations.hero_badge.he">{{ i18n.t()('hero_badge') }}</span>
            </div>
            <h1 data-edit-key="business.name" class="text-5xl md:text-6xl font-black mb-4 tracking-tight leading-tight animate-slide-up">
              {{ i18n.isPrimary() ? biz.business()?.name : biz.business()?.name_en }}
            </h1>
            <p data-edit-key="translations.hero_subtitle.he" class="text-xl text-white/80 mb-6 font-light animate-slide-up" style="animation-delay:0.1s">
              {{ i18n.t()('hero_subtitle') }}
            </p>
            @if (biz.business(); as b) {
              <div class="flex items-center gap-3 mb-8 animate-fade-in" style="animation-delay:0.15s" [class.justify-center]="i18n.dir() !== 'rtl'">
                <span class="text-yellow-300 text-lg">⭐ {{ b.rating }}</span>
                <span class="text-white/65 text-sm">({{ b.reviews_count }}+ {{ i18n.t()('reviews_happy') }})</span>
              </div>
            }
            <div class="flex flex-col sm:flex-row gap-4 animate-slide-up" style="animation-delay:0.2s">
              <a [href]="'tel:' + biz.business()?.phone"
                [class]="'w-full sm:w-auto bg-white text-gray-800 font-bold text-lg px-8 py-4 shadow-2xl hover:shadow-blue-300/50 hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2 ' + btnClass()">
                📞 {{ i18n.t()('hero_cta_call') }}
              </a>
              <a [href]="whatsappUrl()" target="_blank" rel="noopener"
                [class]="'w-full sm:w-auto bg-green-500 text-white font-bold text-lg px-8 py-4 shadow-2xl hover:shadow-green-400/50 hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2 ' + btnClass()">
                💬 {{ i18n.t()('hero_cta_whatsapp') }}
              </a>
            </div>
            <p class="mt-6 text-white/65 text-sm animate-fade-in" style="animation-delay:0.4s">
              ✅ {{ i18n.t()('hero_available') }}
            </p>
          </div>
          <!-- Visual side -->
          <div class="flex-1 flex items-center justify-center animate-fade-in" style="animation-delay:0.3s">
            <div class="text-[120px] md:text-[180px] leading-none drop-shadow-2xl select-none">
              {{ biz.business()?.logo_emoji || '🏢' }}
            </div>
          </div>
        </div>
      }

      <!-- ═══ Layout: minimal ═══ -->
      @if (biz.design().hero_layout === 'minimal') {
        <div class="relative z-10 max-w-4xl mx-auto px-6 pb-16 pt-32 text-white text-center w-full">
          <h1 data-edit-key="business.name" class="text-6xl md:text-8xl font-black mb-3 tracking-tight leading-none animate-slide-up">
            {{ i18n.isPrimary() ? biz.business()?.name : biz.business()?.name_en }}
          </h1>
          <p data-edit-key="translations.hero_subtitle.he" class="text-xl text-white/80 mb-6 animate-slide-up" style="animation-delay:0.1s">
            {{ i18n.t()('hero_subtitle') }}
          </p>
          @if (biz.business(); as b) {
            <div class="inline-flex items-center gap-2 text-yellow-300 mb-8 animate-fade-in" style="animation-delay:0.2s">
              <span class="text-lg">⭐ {{ b.rating }}</span>
              <span class="text-white/65 text-sm">({{ b.reviews_count }}+ {{ i18n.t()('reviews_happy') }})</span>
            </div>
          }
          <div class="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style="animation-delay:0.3s">
            <a [href]="'tel:' + biz.business()?.phone"
              [class]="'bg-white text-gray-800 font-bold px-8 py-4 hover:scale-105 transition-all flex items-center gap-2 ' + btnClass()">
              📞 {{ i18n.t()('hero_cta_call') }}
            </a>
            <a [href]="whatsappUrl()" target="_blank" rel="noopener"
              [class]="'bg-green-500 text-white font-bold px-8 py-4 hover:scale-105 transition-all flex items-center gap-2 ' + btnClass()">
              💬 {{ i18n.t()('hero_cta_whatsapp') }}
            </a>
          </div>
        </div>
      }

      <!-- ═══ Layout: centered (default) ═══ -->
      @if (biz.design().hero_layout !== 'split' && biz.design().hero_layout !== 'minimal') {
        <div class="relative z-10 text-center text-white px-6 max-w-4xl mx-auto py-32">
          <div class="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/30 rounded-full px-4 py-2 text-sm font-medium mb-6 animate-fade-in">
            <span>{{ biz.business()?.logo_emoji || '❄️' }}</span>
            <span data-edit-key="translations.hero_badge.he">{{ i18n.t()('hero_badge') }}</span>
          </div>
          <h1 data-edit-key="business.name" class="text-5xl md:text-7xl font-black mb-4 tracking-tight leading-tight animate-slide-up">
            {{ i18n.isPrimary() ? biz.business()?.name : biz.business()?.name_en }}
          </h1>
          <p data-edit-key="translations.hero_subtitle.he" class="text-xl md:text-2xl text-white/80 mb-8 font-light animate-slide-up" style="animation-delay:0.1s">
            {{ i18n.t()('hero_subtitle') }}
          </p>
          @if (biz.business(); as b) {
            <div class="flex items-center justify-center gap-4 mb-10 animate-slide-up" style="animation-delay:0.2s">
              <div class="flex items-center gap-2 bg-yellow-400/20 border border-yellow-300/40 rounded-full px-5 py-2">
                <span class="text-yellow-300 text-lg">⭐</span>
                <span class="font-black text-2xl text-yellow-300">{{ b.rating }}</span>
                <span class="text-yellow-200 text-sm">{{ i18n.t()('stars_out_of') }}</span>
              </div>
              <div class="text-white/65 text-sm">
                {{ b.reviews_count }}+ {{ i18n.t()('reviews_happy') }}
              </div>
            </div>
          }
          <div class="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style="animation-delay:0.3s">
            <a [href]="'tel:' + biz.business()?.phone"
              [class]="'w-full sm:w-auto bg-white text-gray-800 font-bold text-lg px-8 py-4 shadow-2xl hover:shadow-blue-300/50 hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2 ' + btnClass()">
              📞 {{ i18n.t()('hero_cta_call') }}
            </a>
            <a [href]="whatsappUrl()" target="_blank" rel="noopener"
              [class]="'w-full sm:w-auto bg-green-500 text-white font-bold text-lg px-8 py-4 shadow-2xl hover:shadow-green-400/50 hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2 ' + btnClass()">
              💬 {{ i18n.t()('hero_cta_whatsapp') }}
            </a>
          </div>
          <p class="mt-6 text-white/65 text-sm animate-fade-in" style="animation-delay:0.5s">
            ✅ {{ i18n.t()('hero_available') }}
          </p>
        </div>
        <div class="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/60 animate-bounce">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
          </svg>
        </div>
      }
    </section>
  `,
})
export class HeroComponent {
  protected i18n = inject(I18nService);
  protected biz = inject(BusinessDataService);

  btnClass(): string {
    switch (this.biz.design().button_style) {
      case 'pill':  return 'rounded-full';
      case 'sharp': return 'rounded-lg';
      default:      return 'rounded-2xl';
    }
  }

  whatsappUrl() {
    const phone = this.biz.business()?.whatsapp?.replace(/\D/g, '') ?? '';
    const msg = this.i18n.t()('contact_wa_hello');
    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  }
}
