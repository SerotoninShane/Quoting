/**
 * PRICING ENGINE - Framework Agnostic Core
 * Pure functions, no UI dependencies
 */

export const PricingEngine = {
  /**
   * Check if an addon is allowed for a given product and size
   * @param {object} addon - The addon to check
   * @param {object} product - The product we're checking against
   * @param {number} ui - The United Inches (size) of the product
   * @returns {boolean} True if addon is allowed for this product
   */
  isAddonAllowed(addon, product, ui) {
    // Check product type restrictions (match against `productType` or fallback fields)
    if (addon.allowedProductTypes && addon.allowedProductTypes.length > 0) {
      const productType = product.productType || product.type || product.productTypeCode;
      if (!productType || !addon.allowedProductTypes.includes(productType)) {
        return false;
      }
    }

    // Check product line restrictions (match against `productLineId` or `productLine`)
    if (addon.allowedProductLines && addon.allowedProductLines.length > 0) {
      const productLine = product.productLineId || product.productLine;
      if (!productLine || !addon.allowedProductLines.includes(productLine)) {
        return false;
      }
    }

    // Check max size restriction (in square feet, e.g., max 21 sq ft)
    if (addon.maxSize !== null && ui > addon.maxSize) {
      return false;
    }

    // Check min size restriction
    if (addon.minSize !== null && ui < addon.minSize) {
      return false;
    }

    return true;
  },

  /**
   * Get available addons for a product, filtered by restrictions
   * @param {object} product - The product to get addons for
   * @param {number} ui - The United Inches (size) of the product
   * @param {object} allAddons - All available addons
   * @returns {array} Array of addon IDs that are allowed for this product
   */
  getAvailableAddonsForProduct(product, ui, allAddons = {}) {
    return Object.keys(allAddons).filter(addonId => {
      const addon = allAddons[addonId];
      return this.isAddonAllowed(addon, product, ui);
    });
  },

  /**
   * Calculate United Inches (always rounds up)
   */
  calculateUI(width, height) {
    return Math.ceil(width + height);
  },

  /**
   * Calculate square footage
   */
  calculateSquareFootage(width, height) {
    return (width * height) / 144; // Convert sq inches to sq feet
  },

  /**
   * Calculate a single line item's pricing
   * @returns {object} { ui, basePrice, addonTotal, lineItemParTotal, appliedAddons }
   */
  calculateLineItem({ product, width, height, selectedAddonIds = [], allAddons = {} }) {
    // Step 1: Calculate UI
    const ui = this.calculateUI(width, height);
    const effectiveUI = Math.max(ui, product.minimumUI || 0);

    // Step 2: Calculate base par price
    let basePrice = 0;
    if (product.pricingModel === 'UI') {
      basePrice = effectiveUI * product.uiRate;
    } else if (product.pricingModel === 'FLAT') {
      basePrice = product.flatPrice;
    } else {
      throw new Error(`Invalid pricing model: ${product.pricingModel}`);
    }

    // Step 3: Process addons
    const appliedAddons = [];
    const usedExclusiveGroups = new Set();
    let addonTotal = 0;

    // Auto-apply mandatory addons
    const mandatoryAddonIds = (product.allowedAddons || [])
      .filter(addonId => allAddons[addonId]?.mandatory)
      .map(addonId => addonId);

    const allAddonIds = [...new Set([...mandatoryAddonIds, ...selectedAddonIds])];

    for (const addonId of allAddonIds) {
      const addon = allAddons[addonId];
      if (!addon) continue;

      // Check if addon is allowed for this product and size
      if (!this.isAddonAllowed(addon, product, ui)) {
        continue; // Skip this addon if it's not allowed
      }

      // Check exclusive group conflicts
      if (addon.exclusiveGroup) {
        if (usedExclusiveGroups.has(addon.exclusiveGroup)) {
          throw new Error(`Exclusive addon conflict in group: ${addon.exclusiveGroup}`);
        }
        usedExclusiveGroups.add(addon.exclusiveGroup);
      }

      // Calculate addon price
      let addonPrice = 0;
      if (addon.pricingModel === 'UI') {
        addonPrice = effectiveUI * addon.uiRate;
      } else if (addon.pricingModel === 'FLAT') {
        addonPrice = addon.flatPrice;
      }

      addonTotal += addonPrice;
      appliedAddons.push({
        id: addonId,
        name: addon.name,
        price: addonPrice,
        hidden: addon.hiddenFromCustomer || false
      });
    }

    // Step 4: Line item total
    const lineItemParTotal = basePrice + addonTotal;

    return {
      ui: effectiveUI,
      basePrice,
      addonTotal,
      lineItemParTotal,
      appliedAddons
    };
  },

  /**
   * Calculate complete quote pricing with job-based addons
   */
  calculateQuote({ lineItems, jobBasedAddons = [], salesUplift = 0 }) {
    if (salesUplift < 0) {
      throw new Error('Sales uplift cannot be negative');
    }

    const totalParPrice = lineItems.reduce((sum, item) => sum + item.lineItemParTotal, 0);

    // Add job-based addon costs
    let jobAddonTotal = 0;
    for (const addon of jobBasedAddons) {
      jobAddonTotal += addon.price || 0;
    }

    const finalPrice = totalParPrice + jobAddonTotal + salesUplift;

    if (finalPrice < totalParPrice) {
      throw new Error('Final price cannot be below par price');
    }

    return {
      totalParPrice,
      jobAddonTotal,
      jobBasedAddons,
      salesUplift,
      finalPrice
    };
  },

  /**
   * Create a locked quote version (immutable snapshot)
   */
  createQuoteVersion({ quoteId, lineItems, salesUplift = 0, metadata = {} }) {
    const quoteCalc = this.calculateQuote({ lineItems, salesUplift });

    return {
      id: `${quoteId}_v${Date.now()}`,
      quoteId,
      timestamp: new Date().toISOString(),
      lineItems: JSON.parse(JSON.stringify(lineItems)), // Deep clone
      totalParPrice: quoteCalc.totalParPrice,
      salesUplift: quoteCalc.salesUplift,
      finalPrice: quoteCalc.finalPrice,
      locked: true,
      metadata
    };
  },

  /**
   * Validate product size and UI limits
   */
  validateSize({ product, width, height }) {
    if (!product.sizeLimits) return { valid: true };

    const errors = [];
    const limits = product.sizeLimits;

    if (limits.minWidth && width < limits.minWidth) {
      errors.push(`Width must be at least ${limits.minWidth}"`);
    }
    if (limits.maxWidth && width > limits.maxWidth) {
      errors.push(`Width cannot exceed ${limits.maxWidth}"`);
    }
    if (limits.minHeight && height < limits.minHeight) {
      errors.push(`Height must be at least ${limits.minHeight}"`);
    }
    if (limits.maxHeight && height > limits.maxHeight) {
      errors.push(`Height cannot exceed ${limits.maxHeight}"`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  },

  /**
   * Validate product UI limits (minimum and maximum)
   */
  validateUI({ product, ui }) {
    const errors = [];

    if (product.minimumUI && ui < product.minimumUI) {
      errors.push(`UI must be at least ${product.minimumUI}`);
    }
    if (product.maximumUI && ui > product.maximumUI) {
      errors.push(`UI cannot exceed ${product.maximumUI}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
};
