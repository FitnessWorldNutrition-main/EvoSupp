# Cart Conditions Implementation - EvoSupp Theme

## Overview
This implementation adds two critical cart validation features to your Shopify theme:
1. **Incompatible Products Detection** - Prevents customers from adding conflicting products to their cart
2. **Maximum Quantity Enforcement** - Limits the quantity of specific products that can be purchased

## Features

### 1. Incompatible Products
- Automatically detects when incompatible products are in the cart
- Displays an alert message in French
- Removes the newly added incompatible product
- Refreshes the cart to show updated state

### 2. Maximum Quantity Control
- Enforces product-specific quantity limits
- Adjusts quantity automatically if limit is exceeded
- Updates product page UI to show remaining available quantity
- Hides quantity selector when maximum is reached
- Disables "Add to Cart" button when maximum quantity is reached

## Files Modified/Created

### New Files
1. **assets/cart-conditions.js** - Main JavaScript class handling cart validation logic

### Modified Files
1. **snippets/product-add-to-cart.liquid** - Added metafield properties to product forms
2. **snippets/product-information.liquid** - Updated quantity selector to respect max quantities
3. **snippets/product-card.liquid** - Added metafield data attributes for quick add
4. **assets/app.js** - Updated quickAdd method to pass metafield properties
5. **layout/theme.liquid** - Added cart-conditions.js script loading
6. **locales/fr.json** - Added French translations for messages

## Setup Instructions

### 1. Create Required Metafields

You need to create two product metafields in your Shopify admin:

#### Metafield 1: Maximum Quantity
- **Namespace:** `custom`
- **Key:** `max_quantity`
- **Type:** Single line text or Number
- **Description:** Maximum quantity allowed per customer

#### Metafield 2: Incompatible Products
- **Namespace:** `custom`
- **Key:** `produits_incompatibles`
- **Type:** List of products
- **Description:** Products that cannot be in cart with this product

### 2. Configure Products

For each product that needs restrictions:

1. Go to Products in Shopify Admin
2. Select the product
3. Scroll to Metafields section
4. Set `max_quantity` (e.g., "3" for maximum 3 units)
5. Set `produits_incompatibles` - select incompatible products from the list

### 3. Test the Implementation

#### Test Maximum Quantity:
1. Add a product with max_quantity metafield to cart
2. Try to add more than the maximum quantity
3. You should see an alert and quantity adjusted to maximum

#### Test Incompatible Products:
1. Add Product A to cart
2. Try to add Product B (marked as incompatible with A)
3. You should see an alert and Product A removed from cart

## How It Works

### JavaScript Flow (cart-conditions.js)

1. **Event Listener**: Listens for `cart:item-added` event
2. **Cart Check**: Fetches current cart state via AJAX
3. **Validation**: 
   - Checks for incompatible products
   - Checks for max quantity violations
4. **Action**: 
   - Removes incompatible items
   - Adjusts quantities if over limit
5. **UI Update**: Updates product page UI and refreshes cart

### Liquid Template Logic

- **Product Forms**: Hidden inputs store metafield values as cart properties
- **Quantity Selector**: Calculates remaining quantity and sets max attribute
- **Quick Add**: Data attributes pass metafield values to JavaScript

### Properties in Cart Items

When products are added to cart, these properties are stored:
- `_max_quantity`: The maximum allowed quantity
- `_produits_incompatibles`: Comma-separated list of incompatible product IDs

## Customization

### Change Alert Messages

Edit `assets/cart-conditions.js`:

```javascript
// Incompatible products message (line ~77)
alert(
  `Le produit "${currentProductTitle}" est incompatible avec "${blockedProductTitle}". Le produit incompatible sera supprimé.`
);

// Max quantity message (line ~118)
alert(
  `La quantité maximale pour le produit "${decodedTitle}" est ${maxQuantity}. Le produit sera ajusté à cette limite.`
);
```

### Change Button Text

Edit `assets/cart-conditions.js` (line ~209):

```javascript
labelElement.textContent = 'Quantité maximale atteinte';
```

Or use localization:

Edit `locales/fr.json` and add reference in JavaScript to use theme translations.

## Localization

French translations added to `locales/fr.json`:
- `products.product.maximum_quantity`: "Quantité maximale atteinte"
- `products.product.produits_incompatibles`: "Produit incompatible dans le panier"

To add other languages, update the corresponding locale files (en.default.json, es.json, etc.)

## Troubleshooting

### Issue: Validation not working
- Check browser console for JavaScript errors
- Verify cart-conditions.js is loaded in theme.liquid
- Ensure metafields are properly configured

### Issue: Quantity selector not hiding
- Clear browser cache
- Check if max_quantity metafield has a value
- Verify product is in cart (quantity check only runs after adding to cart)

### Issue: Quick add not passing properties
- Check data attributes in product-card.liquid
- Verify app.js modifications are present
- Test with browser network tab to see form data

## Browser Compatibility

Tested and working on:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

## Performance Notes

- Validation runs on `cart:item-added` event (after add to cart)
- Single AJAX request to fetch cart state
- Minimal impact on page load
- No impact when products don't have metafields

## Support

For issues or questions:
1. Check browser console for errors
2. Verify metafield configuration
3. Test with browser network tab to see API calls
4. Review cart.js responses to verify properties are saved

## Version History

**v1.0** (Current)
- Initial implementation
- Incompatible products detection
- Maximum quantity enforcement
- French localization
- Product page UI updates

