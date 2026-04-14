import { Component, inject, signal } from '@angular/core';
import { I18nService } from '../services/i18n.service';
import { BusinessDataService } from '../services/business-data.service';

@Component({
  selector: 'app-reviews',
  standalone: true,
  template: `
    @if (!biz.isHidden('reviews')) {
    <section id="reviews" class="py-20 bg-white" [attr.dir]="i18n.dir()" data-edit-section="reviews">
      <div class="max-w-6xl mx-auto px-6">
        <!-- Header -->
        <div class="text-center mb-12" data-animate>
          <h2 class="text-4xl font-black text-gray-900 mb-3">
            {{ i18n.t()('reviews_title') }}
          </h2>
          <div class="w-16 h-1.5 bg-blue-600 rounded mx-auto mb-4"></div>
          <p class="text-gray-500 text-lg">
            {{ i18n.t()('reviews_subtitle') }}
          </p>

          <!-- Overall rating summary -->
          @if (biz.business(); as b) {
            <div class="inline-flex items-center gap-4 mt-6 bg-yellow-50 border border-yellow-200 rounded-2xl px-8 py-4">
              <div class="text-5xl font-black text-yellow-500">{{ b.rating }}</div>
              <div>
                <div class="flex gap-0.5 text-yellow-400 text-xl mb-1">
                  @for (s of stars(b.rating); track $index) {
                    <span>{{ s }}</span>
                  }
                </div>
                <div class="text-sm text-gray-500">
                  {{ i18n.t()('reviews_based_on') }}
                  {{ b.reviews_count }}
                  {{ i18n.t()('reviews_reviews') }}
                </div>
              </div>
            </div>
          }
        </div>

        <!-- Reviews grid -->
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          @for (review of visibleReviews(); track review.author; let i = $index) {
            <div [class]="cardClass()" data-animate [attr.data-edit-delete]="'reviews.' + i">
              <div class="flex items-start justify-between mb-3">
                <div>
                  <div class="font-bold text-gray-800 text-sm">{{ review.author }}</div>
                  @if (review.is_local_guide) {
                    <div class="text-xs text-blue-500 mt-0.5">
                      🏅 {{ i18n.t()('reviews_local_guide') }}
                    </div>
                  }
                </div>
                <div class="flex gap-0.5 text-yellow-400 text-sm">
                  @for (s of stars(review.rating); track $index) {
                    <span>{{ s }}</span>
                  }
                </div>
              </div>
              <p data-edit-key="reviews.{{i}}.text_he" class="text-gray-600 text-sm leading-relaxed">{{ i18n.isPrimary() ? review.text_he : review.text_en }}</p>
              <div class="text-xs text-gray-400 mt-3">{{ review.date }}</div>
            </div>
          }
        </div>

        <!-- Load more -->
        @if (showMore()) {
          <div class="text-center mt-8">
            <button
              (click)="loadMore()"
              [class]="'border-2 border-blue-600 text-blue-600 font-bold px-8 py-3 hover:bg-blue-50 transition-colors ' + btnClass()"
            >
              {{ i18n.t()('reviews_load_more') }}
            </button>
          </div>
        }
      </div>
    </section>
    }
  `,
})
export class ReviewsComponent {
  protected i18n = inject(I18nService);
  protected biz = inject(BusinessDataService);
  private visibleCount = signal(6);

  cardClass(): string {
    switch (this.biz.design().card_style) {
      case 'border': return 'bg-white rounded-2xl p-5 border-2 border-blue-200 hover:border-blue-400 transition-all duration-200';
      case 'glass':  return 'bg-white/60 backdrop-blur-sm rounded-2xl p-5 border border-white/30 shadow-lg hover:shadow-xl transition-all duration-200';
      case 'solid':  return 'bg-blue-50 rounded-2xl p-5 hover:bg-blue-100 transition-all duration-200';
      default:       return 'bg-gray-50 rounded-2xl p-5 border border-gray-100 hover:shadow-md transition-shadow duration-200';
    }
  }

  btnClass(): string {
    switch (this.biz.design().button_style) {
      case 'pill':  return 'rounded-full';
      case 'sharp': return 'rounded-lg';
      default:      return 'rounded-2xl';
    }
  }

  visibleReviews() {
    return this.biz.reviews().slice(0, this.visibleCount());
  }

  showMore() {
    return this.biz.reviews().length > this.visibleCount();
  }

  loadMore(): void {
    this.visibleCount.update((n) => n + 6);
  }

  stars(rating: number): string[] {
    return Array.from({ length: 5 }, (_, i) => (i < rating ? '★' : '☆'));
  }
}
