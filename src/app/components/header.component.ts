import { Component, HostListener, inject, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { I18nService } from '../services/i18n.service';
import { BusinessDataService } from '../services/business-data.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [NgClass],
  template: `
    <header
      [class]="'fixed top-0 left-0 right-0 z-50 transition-all duration-300 ' + (scrolled() ? 'bg-white shadow-md' : 'bg-transparent')"
      [attr.dir]="i18n.dir()"
    >
      <div class="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <!-- Logo / Name -->
        <a href="#hero" class="flex items-center gap-2 group" (click)="scrollTo('hero', $event)">
          <div data-edit-logo class="relative inline-flex items-center justify-center">
            @if (biz.business()?.logo_url) {
              <img [src]="biz.business()!.logo_url" [alt]="biz.business()!.name" class="h-10 w-auto max-w-[120px] object-contain" />
            } @else {
              <span class="text-2xl">{{ biz.business()?.logo_emoji || '🏢' }}</span>
            }
          </div>
          <div>
            <div [class]="'font-bold text-lg leading-tight transition-colors ' + (scrolled() ? 'text-blue-700' : 'text-white')">
              {{ i18n.isPrimary() ? biz.business()?.name : biz.business()?.name_en }}
            </div>
            <div [class]="'text-xs transition-colors ' + (scrolled() ? 'text-gray-500' : 'text-white/65')">
              {{ i18n.isPrimary() ? biz.business()?.category_he : biz.business()?.category_en }}
            </div>
          </div>
        </a>

        <!-- Desktop Nav -->
        <nav class="hidden md:flex items-center gap-6">
          @for (item of navItems; track item.key) {
            <a
              [href]="'#' + item.anchor"
              [class]="'text-sm font-medium transition-colors hover:text-blue-400 ' + (scrolled() ? 'text-gray-700' : 'text-white')"
              (click)="scrollTo(item.anchor, $event)"
            >{{ i18n.t()(item.key) }}</a>
          }
        </nav>

        <!-- Right side: Lang toggle + Phone -->
        <div class="flex items-center gap-3">
          <!-- Phone (desktop) -->
          <a
            [href]="'tel:' + biz.business()?.phone"
            [class]="'hidden md:flex items-center gap-1 text-sm font-semibold px-3 py-1.5 rounded-full transition-all ' + (scrolled() ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-white/20 text-white hover:bg-white/30')"
          >
            📞 {{ biz.business()?.phone_display }}
          </a>

          <!-- Language toggle -->
          @if (i18n.showLangToggle()) {
            <button
              (click)="i18n.toggleLang()"
              [class]="'text-sm font-medium px-3 py-1.5 rounded-full border transition-all ' + (scrolled() ? 'border-blue-600 text-blue-600 hover:bg-blue-50' : 'border-white/60 text-white hover:bg-white/10')"
            >
              {{ i18n.t()('lang_toggle') }}
            </button>
          }

          <!-- Mobile hamburger -->
          <button
            class="md:hidden p-2"
            (click)="mobileOpen.set(!mobileOpen())"
            [attr.aria-label]="'Menu'"
          >
            <svg [class]="'w-6 h-6 ' + (scrolled() ? 'text-gray-800' : 'text-white')" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              @if (!mobileOpen()) {
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
              } @else {
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              }
            </svg>
          </button>
        </div>
      </div>

      <!-- Mobile Menu -->
      @if (mobileOpen()) {
        <div class="md:hidden bg-white shadow-lg border-t border-gray-100 px-4 py-4">
          <nav class="flex flex-col gap-3">
            @for (item of navItems; track item.key) {
              <a
                [href]="'#' + item.anchor"
                class="text-gray-700 font-medium py-2 border-b border-gray-100 hover:text-blue-600 transition-colors"
                (click)="scrollTo(item.anchor, $event); mobileOpen.set(false)"
              >{{ i18n.t()(item.key) }}</a>
            }
            <a
              [href]="'tel:' + biz.business()?.phone"
              class="mt-2 bg-blue-600 text-white text-center py-3 rounded-lg font-semibold"
            >📞 {{ biz.business()?.phone_display }}</a>
          </nav>
        </div>
      }
    </header>
  `,
})
export class HeaderComponent {
  protected i18n = inject(I18nService);
  protected biz = inject(BusinessDataService);
  protected scrolled = signal(false);
  protected mobileOpen = signal(false);

  protected navItems = [
    { key: 'nav_about', anchor: 'about' },
    { key: 'nav_services', anchor: 'services' },
    { key: 'nav_gallery', anchor: 'gallery' },
    { key: 'nav_reviews', anchor: 'reviews' },
    { key: 'nav_contact', anchor: 'contact' },
    { key: 'nav_location', anchor: 'location' },
  ];

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrolled.set(window.scrollY > 60);
  }

  scrollTo(anchor: string, e: Event): void {
    e.preventDefault();
    document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth' });
  }
}
