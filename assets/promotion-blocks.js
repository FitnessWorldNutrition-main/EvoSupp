/**
 *  @class
 *  @function PromotionBlocks
 */
if (!customElements.get('promotion-blocks')) {
  class PromotionBlocks extends HTMLElement {
    constructor() {
      super();
      this.autoplayInterval = null;
      this.currentIndex = 0;
      this.isPaused = false;
    }

    connectedCallback() {
      // Only enable autoplay on mobile and when swipe-on-mobile is enabled
      if (!this.classList.contains('swipe-on-mobile')) {
        return;
      }

      this.inner = this.querySelector('.promotion-blocks--inner');
      this.items = Array.from(this.querySelectorAll('.promotion-blocks--item'));
      
      if (!this.inner || this.items.length <= 1) {
        return;
      }

      // Check if mobile (max-width: 767px)
      this.checkMobile();
      
      // Re-check on window resize
      window.addEventListener('resize', () => this.checkMobile());

      // Pause on hover/touch
      this.inner.addEventListener('mouseenter', () => this.pause());
      this.inner.addEventListener('mouseleave', () => this.resume());
      
      // Pause when user manually scrolls
      this.inner.addEventListener('scroll', () => this.onUserScroll(), { passive: true });
    }

    checkMobile() {
      const isMobile = window.matchMedia('(max-width: 767px)').matches;
      
      if (isMobile && !this.autoplayInterval) {
        this.startAutoplay();
      } else if (!isMobile && this.autoplayInterval) {
        this.stopAutoplay();
      }
    }

    startAutoplay() {
      // Auto-scroll every 3 seconds
      const delay = parseInt(this.dataset.autoplayDelay) || 3000;
      
      this.autoplayInterval = setInterval(() => {
        if (!this.isPaused) {
          this.scrollToNext();
        }
      }, delay);
    }

    stopAutoplay() {
      if (this.autoplayInterval) {
        clearInterval(this.autoplayInterval);
        this.autoplayInterval = null;
      }
    }

    scrollToNext() {
      if (!this.inner || this.items.length === 0) {
        return;
      }

      this.currentIndex = (this.currentIndex + 1) % this.items.length;
      const item = this.items[this.currentIndex];
      
      if (item) {
        item.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    }

    onUserScroll() {
      // Temporarily pause autoplay when user manually scrolls
      this.isPaused = true;
      
      if (this.scrollTimeout) {
        clearTimeout(this.scrollTimeout);
      }
      
      // Resume autoplay after 5 seconds of no scrolling
      this.scrollTimeout = setTimeout(() => {
        this.isPaused = false;
      }, 5000);
    }

    pause() {
      this.isPaused = true;
    }

    resume() {
      this.isPaused = false;
    }

    disconnectedCallback() {
      this.stopAutoplay();
      if (this.scrollTimeout) {
        clearTimeout(this.scrollTimeout);
      }
    }
  }
  
  customElements.define('promotion-blocks', PromotionBlocks);
}
