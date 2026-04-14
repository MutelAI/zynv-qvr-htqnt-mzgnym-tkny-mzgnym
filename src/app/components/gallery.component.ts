import { Component, inject, signal } from '@angular/core';
import { I18nService } from '../services/i18n.service';
import { BusinessDataService, Photo } from '../services/business-data.service';

@Component({
  selector: 'app-gallery',
  standalone: true,
  template: `
    @if (!biz.isHidden('gallery')) {
    <section id="gallery" class="py-20 bg-gray-50" [attr.dir]="i18n.dir()" data-edit-section="gallery">
      <div class="max-w-6xl mx-auto px-6">
        <!-- Header -->
        <div class="text-center mb-12" data-animate>
          <h2 class="text-4xl font-black text-gray-900 mb-3">
            {{ i18n.t()('gallery_title') }}
          </h2>
          <div class="w-16 h-1.5 bg-blue-600 rounded mx-auto mb-4"></div>
          <p class="text-gray-500 text-lg">
            {{ i18n.t()('gallery_subtitle') }}
          </p>
        </div>

        <!-- ═══ Gallery: masonry ═══ -->
        @if (biz.design().gallery_style !== 'grid' && biz.design().gallery_style !== 'slider') {
          <div class="columns-2 md:columns-3 lg:columns-4 gap-3 space-y-3" [attr.data-edit-add-photo]="'photos'">
            @for (photo of biz.photos(); track photo.url; let i = $index) {
              <div
                class="break-inside-avoid cursor-pointer overflow-hidden rounded-xl group relative"
                (click)="openLightbox(i)"
                [attr.data-edit-delete]="'photos.' + i"
                [attr.data-edit-img]="'photos.' + i + '.url'"
              >
                <img
                  [src]="photo.thumb"
                  [alt]="i18n.isPrimary() ? photo.alt_he : photo.alt_en"
                  class="w-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  (error)="onImgError($event)"
                />
                <div class="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                  <div class="text-white text-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">🔍</div>
                </div>
              </div>
            }
          </div>
        }

        <!-- ═══ Gallery: grid ═══ -->
        @if (biz.design().gallery_style === 'grid') {
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3" [attr.data-edit-add-photo]="'photos'">
            @for (photo of biz.photos(); track photo.url; let i = $index) {
              <div
                class="aspect-square cursor-pointer overflow-hidden rounded-xl group relative"
                (click)="openLightbox(i)"
                [attr.data-edit-delete]="'photos.' + i"
                [attr.data-edit-img]="'photos.' + i + '.url'"
              >
                <img
                  [src]="photo.thumb"
                  [alt]="i18n.isPrimary() ? photo.alt_he : photo.alt_en"
                  class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                  (error)="onImgError($event)"
                />
                <div class="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                  <div class="text-white text-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">🔍</div>
                </div>
              </div>
            }
          </div>
        }

        <!-- ═══ Gallery: slider ═══ -->
        @if (biz.design().gallery_style === 'slider') {
          <div class="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 scrollbar-thin" [attr.data-edit-add-photo]="'photos'">
            @for (photo of biz.photos(); track photo.url; let i = $index) {
              <div
                class="snap-center shrink-0 w-72 md:w-80 cursor-pointer overflow-hidden rounded-xl group relative"
                (click)="openLightbox(i)"
                [attr.data-edit-delete]="'photos.' + i"
                [attr.data-edit-img]="'photos.' + i + '.url'"
              >
                <img
                  [src]="photo.thumb"
                  [alt]="i18n.isPrimary() ? photo.alt_he : photo.alt_en"
                  class="w-full h-56 md:h-64 object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  (error)="onImgError($event)"
                />
                <div class="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                  <div class="text-white text-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">🔍</div>
                </div>
              </div>
            }
          </div>
        }
      </div>

      <!-- Lightbox -->
      @if (lightboxOpen()) {
        <div
          class="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          (click)="closeLightbox()"
        >
          <button
            class="absolute top-4 end-4 text-white text-3xl hover:text-gray-300 z-10"
            (click)="closeLightbox()"
            [attr.aria-label]="i18n.t()('lightbox_close')"
          >✕</button>

          <button
            class="absolute start-4 top-1/2 -translate-y-1/2 text-white text-4xl hover:text-gray-300 z-10 bg-black/40 rounded-full w-12 h-12 flex items-center justify-center"
            (click)="prevPhoto($event)"
            [attr.aria-label]="i18n.t()('lightbox_prev')"
          >‹</button>

          <img
            [src]="biz.photos()[currentIndex()]?.url"
            [alt]="i18n.isPrimary() ? biz.photos()[currentIndex()]?.alt_he : biz.photos()[currentIndex()]?.alt_en"
            class="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
            (click)="$event.stopPropagation()"
          />

          <button
            class="absolute end-4 top-1/2 -translate-y-1/2 text-white text-4xl hover:text-gray-300 z-10 bg-black/40 rounded-full w-12 h-12 flex items-center justify-center"
            (click)="nextPhoto($event)"
            [attr.aria-label]="i18n.t()('lightbox_next')"
          >›</button>

          <div class="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
            {{ currentIndex() + 1 }} / {{ biz.photos().length }}
          </div>
        </div>
      }
    </section>
    }
  `,
})
export class GalleryComponent {
  protected i18n = inject(I18nService);
  protected biz = inject(BusinessDataService);
  protected lightboxOpen = signal(false);
  protected currentIndex = signal(0);

  openLightbox(index: number): void {
    this.currentIndex.set(index);
    this.lightboxOpen.set(true);
    document.body.style.overflow = 'hidden';
  }

  closeLightbox(): void {
    this.lightboxOpen.set(false);
    document.body.style.overflow = '';
  }

  prevPhoto(e: Event): void {
    e.stopPropagation();
    const len = this.biz.photos().length;
    this.currentIndex.update((i) => (i - 1 + len) % len);
  }

  nextPhoto(e: Event): void {
    e.stopPropagation();
    const len = this.biz.photos().length;
    this.currentIndex.update((i) => (i + 1) % len);
  }

  onImgError(e: Event): void {
    const img = e.target as HTMLImageElement;
    img.parentElement?.classList.add('hidden');
  }
}
