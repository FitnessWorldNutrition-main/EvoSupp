/**
 * @class
 * @function FreeShippingBar
 * Multi-tier free shipping progress bar with dynamic updates
 */

if (!customElements.get('free-shipping-bar')) {
  class FreeShippingBar extends HTMLElement {
    constructor() {
      super();
      this.previousTierReached = 0;
    }

    connectedCallback() {
      this.textElement = this.querySelector('.free-shipping-bar__text');
      this.progressElement = this.querySelector('.free-shipping-bar__progress');
      this.icons = {
        tier1: this.querySelector('.free-shipping-bar__icon--tier1'),
        tier2: this.querySelector('.free-shipping-bar__icon--tier2'),
        tier3: this.querySelector('.free-shipping-bar__icon--tier3')
      };
      this.markers = {
        tier1: this.querySelector('.free-shipping-bar__marker--tier1'),
        tier2: this.querySelector('.free-shipping-bar__marker--tier2'),
        tier3: this.querySelector('.free-shipping-bar__marker--tier3')
      };

      // Parse configuration from data attributes
      this.config = {
        tier1Cents: parseInt(this.dataset.tier1Cents, 10) || 9000,
        tier2Cents: parseInt(this.dataset.tier2Cents, 10) || 20000,
        tier3Cents: parseInt(this.dataset.tier3Cents, 10) || 30000,
        tier1Enabled: this.dataset.tier1Enabled === 'true',
        tier2Enabled: this.dataset.tier2Enabled === 'true',
        tier3Enabled: this.dataset.tier3Enabled === 'true',
        tier1Message: this.dataset.tier1Message || 'Plus que {remaining_amount} pour la livraison gratuite',
        tier2Message: this.dataset.tier2Message || 'Plus que {remaining_amount} pour le 3x sans frais',
        tier3Message: this.dataset.tier3Message || 'Plus que {remaining_amount} pour le prochain palier',
        tier1ReachedMessage: this.dataset.tier1ReachedMessage || 'Bravo ! La livraison vous est offerte !',
        tier2ReachedMessage: this.dataset.tier2ReachedMessage || 'Bravo ! Vous pouvez profiter du 3x sans frais !',
        tier3ReachedMessage: this.dataset.tier3ReachedMessage || 'Félicitations ! Vous avez débloqué tous les avantages !',
        maxThreshold: parseInt(this.dataset.maxThreshold, 10) || 30000
      };

      // Initial calculation
      this.cartTotal = parseInt(this.dataset.cartTotal, 10) || 0;
      this.previousTierReached = this.calculateTierReached(this.cartTotal);
      this.updateDisplay(this.cartTotal);

      // Listen for cart updates
      this.boundHandleCartChange = this.handleCartChange.bind(this);
      document.addEventListener('cart:change', this.boundHandleCartChange);
      document.addEventListener('cart:updated', this.boundHandleCartChange);
      
      // Also listen for custom event from cart drawer
      window.addEventListener('cart:refresh', this.boundHandleCartChange);
    }

    disconnectedCallback() {
      document.removeEventListener('cart:change', this.boundHandleCartChange);
      document.removeEventListener('cart:updated', this.boundHandleCartChange);
      window.removeEventListener('cart:refresh', this.boundHandleCartChange);
    }

    handleCartChange(event) {
      if (event.detail && event.detail.cart) {
        const cart = event.detail.cart;
        this.updateFromCart(cart);
      } else {
        // Fetch cart data if not provided in event
        this.fetchCartAndUpdate();
      }
    }

    async fetchCartAndUpdate() {
      try {
        const response = await fetch('/cart.js');
        const cart = await response.json();
        this.updateFromCart(cart);
      } catch (error) {
        console.error('Free shipping bar: Error fetching cart', error);
      }
    }

    updateFromCart(cart) {
      // Calculate total from items requiring shipping only
      let calculatedTotal = 0;
      
      if (cart.items) {
        cart.items.forEach(item => {
          if (item.requires_shipping) {
            calculatedTotal += item.final_line_price;
          }
        });
      }

      // Subtract cart-level discounts
      if (cart.cart_level_discount_applications) {
        cart.cart_level_discount_applications.forEach(discount => {
          calculatedTotal -= discount.total_allocated_amount;
        });
      }

      // Ensure non-negative
      calculatedTotal = Math.max(0, calculatedTotal);

      // Apply currency conversion if available
      if (Shopify && Shopify.currency && Shopify.currency.rate) {
        // Don't multiply by rate here as we compare to already converted tier values
      }

      this.cartTotal = calculatedTotal;
      this.updateDisplay(calculatedTotal);
    }

    calculateTierReached(total) {
      if (total >= this.config.tier3Cents && this.config.tier3Enabled) {
        return 3;
      } else if (total >= this.config.tier2Cents && this.config.tier2Enabled) {
        return 2;
      } else if (total >= this.config.tier1Cents && this.config.tier1Enabled) {
        return 1;
      }
      return 0;
    }

    updateDisplay(total) {
      const currentTierReached = this.calculateTierReached(total);

      // Update progress bar
      const progress = Math.min(1, total / this.config.maxThreshold);
      this.style.setProperty('--progress', progress);

      if (this.progressElement) {
        this.progressElement.setAttribute('aria-valuenow', total);
      }

      // Update message
      this.updateMessage(total, currentTierReached);

      // Update icons/markers state
      this.updateTierIndicators(currentTierReached);

      // Animate if tier was just reached
      if (currentTierReached > this.previousTierReached) {
        this.animateTierReached(currentTierReached);
      }

      this.previousTierReached = currentTierReached;
    }

    updateMessage(total, tierReached) {
      if (!this.textElement) return;

      let message = '';
      let remainingCents = 0;

      if (tierReached === 3) {
        message = this.config.tier3ReachedMessage;
        remainingCents = 0;
      } else if (tierReached === 2) {
        if (this.config.tier3Enabled) {
          remainingCents = this.config.tier3Cents - total;
          message = this.config.tier2ReachedMessage;
        } else {
          message = this.config.tier2ReachedMessage;
          remainingCents = 0;
        }
      } else if (tierReached === 1) {
        if (this.config.tier2Enabled) {
          remainingCents = this.config.tier2Cents - total;
          message = this.config.tier1ReachedMessage;
        } else {
          message = this.config.tier1ReachedMessage;
          remainingCents = 0;
        }
      } else {
        remainingCents = this.config.tier1Cents - total;
        message = this.config.tier1Message;
      }

      // Format remaining amount
      const formattedAmount = this.formatMoney(remainingCents);
      message = message.replace('{remaining_amount}', formattedAmount);

      this.textElement.textContent = message;
    }

    formatMoney(cents) {
      // Apply currency rate if available
      if (Shopify && Shopify.currency && Shopify.currency.rate) {
        cents = Math.round(cents * Shopify.currency.rate);
      }

      const format = window.theme?.settings?.money_format || '{{amount}}€';
      const amount = (cents / 100).toFixed(2).replace('.', ',');
      const amountNoDecimals = Math.round(cents / 100).toString();

      return format
        .replace('{{amount_with_comma_separator}}', amount)
        .replace('{{amount}}', amountNoDecimals)
        .replace('{{amount_no_decimals}}', amountNoDecimals);
    }

    updateTierIndicators(tierReached) {
      // Update tier 1
      const tier1Element = this.icons.tier1 || this.markers.tier1;
      if (tier1Element) {
        tier1Element.classList.toggle('free-shipping-bar__icon--reached', tierReached >= 1);
        tier1Element.classList.toggle('free-shipping-bar__marker--reached', tierReached >= 1);
      }

      // Update tier 2
      const tier2Element = this.icons.tier2 || this.markers.tier2;
      if (tier2Element) {
        tier2Element.classList.toggle('free-shipping-bar__icon--reached', tierReached >= 2);
        tier2Element.classList.toggle('free-shipping-bar__marker--reached', tierReached >= 2);
      }

      // Update tier 3
      const tier3Element = this.icons.tier3 || this.markers.tier3;
      if (tier3Element) {
        tier3Element.classList.toggle('free-shipping-bar__icon--reached', tierReached >= 3);
        tier3Element.classList.toggle('free-shipping-bar__marker--reached', tierReached >= 3);
      }
    }

    animateTierReached(tier) {
      let element = null;

      if (tier === 1) {
        element = this.icons.tier1 || this.markers.tier1;
      } else if (tier === 2) {
        element = this.icons.tier2 || this.markers.tier2;
      } else if (tier === 3) {
        element = this.icons.tier3 || this.markers.tier3;
      }

      if (element) {
        element.classList.add('just-reached');
        setTimeout(() => {
          element.classList.remove('just-reached');
        }, 400);
      }
    }
  }

  customElements.define('free-shipping-bar', FreeShippingBar);
}
