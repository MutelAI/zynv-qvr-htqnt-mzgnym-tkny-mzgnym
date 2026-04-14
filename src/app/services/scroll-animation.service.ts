import { Injectable, inject } from '@angular/core';
import { BusinessDataService } from './business-data.service';

/**
 * Drives scroll-triggered entrance animations using the `motion` library
 * (vanilla JS, Angular-compatible — NOT framer-motion).
 *
 * Usage: add [data-animate] to any element you want animated.
 * Call init() once after the page is fully rendered.
 *
 * Also watches for dynamically loaded elements (e.g. from @defer blocks)
 * via MutationObserver so late-arriving content is animated too.
 */
@Injectable({ providedIn: 'root' })
export class ScrollAnimationService {
  private biz = inject(BusinessDataService);
  private animatedEls = new WeakSet<HTMLElement>();
  private motionLib: { inView: any; animate: any } | null = null;
  private style = 'elegant';

  async init(): Promise<void> {
    const motion = await import('motion');
    this.motionLib = motion;
    this.style = this.biz.design().animation_style ?? 'elegant';

    if (this.style === 'minimal') return;

    document.documentElement.classList.add('js-ready');

    // Animate everything already in the DOM
    this.animateNewElements(document.querySelectorAll<HTMLElement>('[data-animate]'));

    // Watch for @defer / dynamically inserted elements
    const observer = new MutationObserver((mutations) => {
      const newEls: HTMLElement[] = [];
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (!(node instanceof HTMLElement)) continue;
          if (node.hasAttribute('data-animate') && !this.animatedEls.has(node)) {
            newEls.push(node);
          }
          node.querySelectorAll<HTMLElement>('[data-animate]').forEach((el) => {
            if (!this.animatedEls.has(el)) newEls.push(el);
          });
        }
      }
      if (newEls.length) this.animateNewElements(newEls);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  private animateNewElements(elements: NodeListOf<HTMLElement> | HTMLElement[]): void {
    if (!this.motionLib) return;
    const { inView, animate } = this.motionLib;
    const style = this.style;

    Array.from(elements).forEach((el: HTMLElement, i: number) => {
      if (this.animatedEls.has(el)) return;
      this.animatedEls.add(el);

      const delay = (i % 4) * 0.08;
      inView(el, () => {
        switch (style) {
          case 'energetic':
            animate(el, { opacity: [0, 1], scale: [0.85, 1] }, {
              duration: 0.5, delay,
              ease: [0.34, 1.56, 0.64, 1],
            });
            break;
          case 'dramatic':
            animate(el, { opacity: [0, 1], x: [el.closest('[dir="rtl"]') ? 60 : -60, 0] }, {
              duration: 0.6, delay,
              ease: [0.22, 1, 0.36, 1],
            });
            break;
          case 'elegant':
          default:
            animate(el, { opacity: [0, 1], y: [24, 0] }, {
              duration: 0.7, delay,
              ease: [0.22, 1, 0.36, 1],
            });
            break;
        }
      }, { amount: 0.15 });
    });
  }
}
