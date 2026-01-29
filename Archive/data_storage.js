/**
 * DATA STORAGE - localStorage wrapper with version history
 * Future: swap localStorage for fetch() to JSON files or API
 */

export const DataStorage = {
  // Storage keys
  KEYS: {
    MANUFACTURERS: 'pricing_manufacturers',
    PRODUCT_LINES: 'pricing_product_lines',
    PRODUCTS: 'pricing_products',
    ADDONS: 'pricing_addons',
    QUOTES: 'pricing_quotes',
    QUOTE_VERSIONS: 'pricing_quote_versions',
    PRICING_VERSIONS: 'pricing_versions',
    CURRENT_VERSION: 'pricing_current_version',
    GLOBAL_SETTINGS: 'global_settings'
  },

  /**
   * Get data from storage
   */
  get(key, defaultValue = null) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
      console.error(`Error reading ${key}:`, error);
      return defaultValue;
    }
  },

  /**
   * Set data in storage
   */
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error writing ${key}:`, error);
      return false;
    }
  },

  /**
   * Initialize empty data structures if needed
   */
  initializeSampleData() {
    if (!this.get(this.KEYS.MANUFACTURERS)) {
      this.set(this.KEYS.MANUFACTURERS, {});
      this.set(this.KEYS.PRODUCT_LINES, {});
      this.set(this.KEYS.PRODUCTS, {});
      this.set(this.KEYS.ADDONS, {});
      this.set(this.KEYS.QUOTES, {});
      this.set(this.KEYS.QUOTE_VERSIONS, {});
      
      // Initialize global settings with defaults
      this.set(this.KEYS.GLOBAL_SETTINGS, {
        minimumUI: 65,
        alertsEnabled: true,
        rules: []
      });
    }
  },

  /**
   * Get global settings
   */
  getGlobalSettings() {
    return this.get(this.KEYS.GLOBAL_SETTINGS, { minimumUI: 65, alertsEnabled: true, rules: [] });
  },

  /**
   * Update global settings
   */
  updateGlobalSettings(settings) {
    const current = this.getGlobalSettings();
    const merged = { ...current, ...settings };
    this.set(this.KEYS.GLOBAL_SETTINGS, merged);
  },

  /**
   * Get all manufacturers
   */
  getManufacturers() {
    return this.get(this.KEYS.MANUFACTURERS, {});
  },

  /**
   * Get all product lines
   */
  getProductLines() {
    return this.get(this.KEYS.PRODUCT_LINES, {});
  },

  /**
   * Get all products
   */
  getProducts() {
    return this.get(this.KEYS.PRODUCTS, {});
  },

  /**
   * Get all addons
   */
  getAddons() {
    return this.get(this.KEYS.ADDONS, {});
  },

  /**
   * Save quote (creates new version)
   */
  saveQuote(quote) {
    const quotes = this.get(this.KEYS.QUOTES, {});
    quotes[quote.id] = quote;
    this.set(this.KEYS.QUOTES, quotes);
  },

  /**
   * Save quote version (immutable snapshot)
   */
  saveQuoteVersion(version) {
    const versions = this.get(this.KEYS.QUOTE_VERSIONS, {});
    if (!versions[version.quoteId]) {
      versions[version.quoteId] = [];
    }
    versions[version.quoteId].push(version);
    this.set(this.KEYS.QUOTE_VERSIONS, versions);
  },

  /**
   * Get quote versions for a specific quote
   */
  getQuoteVersions(quoteId) {
    const versions = this.get(this.KEYS.QUOTE_VERSIONS, {});
    return versions[quoteId] || [];
  },

  /**
   * Publish a new pricing version (snapshot of all pricing data)
   */
  publishPricingVersion(notes = '') {
    const version = {
      id: `pricing_v${Date.now()}`,
      timestamp: new Date().toISOString(),
      notes,
      manufacturers: this.getManufacturers(),
      productLines: this.getProductLines(),
      products: this.getProducts(),
      addons: this.getAddons()
    };

    const versions = this.get(this.KEYS.PRICING_VERSIONS, []);
    versions.push(version);
    this.set(this.KEYS.PRICING_VERSIONS, versions);
    this.set(this.KEYS.CURRENT_VERSION, version.id);

    return version;
  },

  /**
   * Get all pricing versions
   */
  getPricingVersions() {
    return this.get(this.KEYS.PRICING_VERSIONS, []);
  },

  /**
   * Load a specific pricing version (read-only)
   */
  loadPricingVersion(versionId) {
    const versions = this.getPricingVersions();
    return versions.find(v => v.id === versionId);
  },

  /**
   * Export all data as JSON (for backup/migration)
   */
  exportAll() {
    return {
      manufacturers: this.getManufacturers(),
      productLines: this.getProductLines(),
      products: this.getProducts(),
      addons: this.getAddons(),
      quotes: this.get(this.KEYS.QUOTES, {}),
      quoteVersions: this.get(this.KEYS.QUOTE_VERSIONS, {}),
      pricingVersions: this.getPricingVersions(),
      globalSettings: this.getGlobalSettings()
    };
  },

  /**
   * Import data from JSON (for restore/migration)
   */
  importAll(data) {
    if (data.manufacturers) this.set(this.KEYS.MANUFACTURERS, data.manufacturers);
    if (data.productLines) this.set(this.KEYS.PRODUCT_LINES, data.productLines);
    if (data.products) {
      // Ensure all products have productLineId
      const productLines = data.productLines || this.getProductLines();
      const products = data.products;
      
      Object.values(products).forEach(product => {
        // If product is missing productLineId, try to find it
        if (!product.productLineId && product.lineId) {
          product.productLineId = product.lineId; // Handle renamed field
        }
        // If still missing, default to first product line
        if (!product.productLineId) {
          const firstLineId = Object.keys(productLines)[0];
          if (firstLineId) {
            product.productLineId = firstLineId;
          }
        }
      });
      
      this.set(this.KEYS.PRODUCTS, products);
    }
    if (data.addons) this.set(this.KEYS.ADDONS, data.addons);
    if (data.quotes) this.set(this.KEYS.QUOTES, data.quotes);
    if (data.quoteVersions) this.set(this.KEYS.QUOTE_VERSIONS, data.quoteVersions);
    if (data.pricingVersions) this.set(this.KEYS.PRICING_VERSIONS, data.pricingVersions);
    if (data.globalSettings) this.set(this.KEYS.GLOBAL_SETTINGS, data.globalSettings);
  },


};
