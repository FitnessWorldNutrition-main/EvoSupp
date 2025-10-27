/**
 * @class
 * @function CartConditions
 * Handles cart validation for incompatible products and maximum quantities
 */
class CartConditions {
  constructor() {
    this.initEventListeners();
  }

  /**
   * Decodes HTML entities in strings
   */
  decodeHtml(html) {
    const textArea = document.createElement("textarea");
    textArea.innerHTML = html;
    return textArea.value;
  }

  /**
   * Initialize event listeners for cart changes
   */
  initEventListeners() {
    document.addEventListener("cart:item-added", (event) => {
      this.checkCartConditions(event);
    });
  }

  /**
   * Fetch current cart state and check conditions
   */
  async checkCartConditions(event) {
    try {
      const cartResponse = await fetch(`${theme.routes.cart_url}.js`);
      const cartData = await cartResponse.json();
      
      if (cartData.items.length > 0) {
        await this.checkIncompatibleProducts(cartData);
        await this.checkMaxQuantities(cartData);
      }
    } catch (error) {
      console.error('Error checking cart conditions:', error);
    }
  }

  /**
   * Check for incompatible products in cart
   */
  async checkIncompatibleProducts(cartData) {
    const alreadyProcessed = new Set();
    const itemsToRemove = [];

    cartData.items.forEach((item, index) => {
      const incompatibleProductsId = item.properties?._produits_incompatibles;
      
      if (!incompatibleProductsId) return;
      
      const incompatibleProductsIdArray = incompatibleProductsId.split(',').map(Number);

      incompatibleProductsIdArray.forEach((incompatibleId) => {
        const key = [item.product_id, incompatibleId].sort().join('-');
        
        if (alreadyProcessed.has(key)) return;
        
        alreadyProcessed.add(key);

        const blockedProduct = cartData.items.find((cartItem) => cartItem.product_id === incompatibleId);

        if (blockedProduct) {
          const currentProductTitle = this.decodeHtml(item.title);
          const blockedProductTitle = this.decodeHtml(blockedProduct.title);

          alert(
            `Le produit "${currentProductTitle}" est incompatible avec "${blockedProductTitle}". Le produit incompatible sera supprimé.`
          );

          // Mark the newly added item for removal
          itemsToRemove.push(index + 1);
        }
      });
    });

    // Remove incompatible items
    for (const lineNumber of itemsToRemove) {
      await this.updateCartLine(lineNumber, 0);
    }

    if (itemsToRemove.length > 0) {
      document.dispatchEvent(new CustomEvent("cart:refresh"));
    }
  }

  /**
   * Check for maximum quantity violations
   */
  async checkMaxQuantities(cartData) {
    const updatePromises = [];

    cartData.items.forEach((item, index) => {
      const maxQuantity = parseInt(item.properties?._max_quantity);
      
      // Skip if no max quantity or max quantity is 'none'
      if (!maxQuantity || isNaN(maxQuantity) || item.properties?._max_quantity === 'none') {
        return;
      }

      if (item.quantity > maxQuantity) {
        const decodedTitle = this.decodeHtml(item.title);

        alert(
          `La quantité maximale pour le produit "${decodedTitle}" est ${maxQuantity}. Le produit sera ajusté à cette limite.`
        );

        updatePromises.push(this.updateCartLine(index + 1, maxQuantity));
      }
    });

    if (updatePromises.length > 0) {
      await Promise.all(updatePromises);
      
      // Get updated cart data and update UI
      const updatedCartResponse = await fetch(`${theme.routes.cart_url}.js`);
      const updatedCartData = await updatedCartResponse.json();
      
      this.updateProductPageUI(updatedCartData);
      document.dispatchEvent(new CustomEvent("cart:refresh"));
    }
  }

  /**
   * Update a cart line item quantity
   */
  async updateCartLine(line, quantity) {
    try {
      const response = await fetch(`${theme.routes.cart_change_url}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          line: line,
          quantity: quantity,
        }),
      });

      return response.json();
    } catch (error) {
      console.error('Error updating cart line:', error);
    }
  }

  /**
   * Update product page UI based on cart state
   */
  updateProductPageUI(cartData) {
    // Only update if we're on a product page
    const productForm = document.querySelector('product-form');
    if (!productForm) return;

    cartData.items.forEach((item) => {
      const variantId = item.variant_id;
      const maxQuantity = parseInt(item.properties?._max_quantity);
      
      // Skip if no max quantity or it's 'none'
      if (isNaN(maxQuantity) || item.properties?._max_quantity === 'none') {
        return;
      }

      // Find quantity inputs for this variant
      const quantityInputs = document.querySelectorAll('input[name="quantity"]');
      const addToCartButtons = document.querySelectorAll('.single-add-to-cart-button');

      quantityInputs.forEach((input) => {
        const form = input.closest('form');
        if (!form) return;
        
        const variantInput = form.querySelector('input[name="id"]');
        if (!variantInput || parseInt(variantInput.value) !== variantId) return;

        const quantitySelector = input.closest('quantity-selector');
        
        if (item.quantity >= maxQuantity) {
          // Hide quantity selector when max is reached
          if (quantitySelector) {
            quantitySelector.style.display = 'none';
          }
          
          // Disable add to cart button
          addToCartButtons.forEach((button) => {
            const buttonForm = button.closest('form');
            if (buttonForm === form) {
              button.disabled = true;
              const labelElement = button.querySelector('.single-add-to-cart-button--text');
              if (labelElement) {
                labelElement.textContent = 'Quantité maximale atteinte';
              }
            }
          });
        } else {
          // Update max quantity and value
          const remainingQuantity = maxQuantity - item.quantity;
          input.value = Math.min(parseInt(input.value) || 1, remainingQuantity);
          input.max = remainingQuantity;
          
          if (quantitySelector) {
            quantitySelector.style.display = '';
          }
          
          // Re-enable add to cart button
          addToCartButtons.forEach((button) => {
            const buttonForm = button.closest('form');
            if (buttonForm === form) {
              button.disabled = false;
              const labelElement = button.querySelector('.single-add-to-cart-button--text');
              if (labelElement) {
                labelElement.textContent = 'Ajouter au panier';
              }
            }
          });
        }
      });
    });
  }
}

// Initialize CartConditions when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new CartConditions();
});

