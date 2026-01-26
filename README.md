# Window & Door Quoting System

Clean, framework-agnostic pricing engine with separate admin and sales interfaces.

## 🎯 Quick Start

### Local Development (Vanilla JS)

1. **Create project structure:**
```
/quoting-system/
  pricingEngine.js
  dataStorage.js
  /admin/
    index.html
  /sales/
    index.html
```

2. **Copy the files:**
   - `pricingEngine.js` → Root pricing logic
   - `dataStorage.js` → localStorage wrapper
   - Admin HTML → `/admin/index.html`
   - Sales HTML → `/sales/index.html`

3. **Run with local server:**
```bash
# Python 3
python -m http.server 8000

# Or Node.js
npx serve

# Or VS Code Live Server extension
```

4. **Access:**
   - Admin: `http://localhost:8000/admin/`
   - Sales: `http://localhost:8000/sales/`

## 📁 File Structure

```
/quoting-system/
  ├── pricingEngine.js         # Core pricing logic (pure functions)
  ├── dataStorage.js           # Persistence layer (localStorage)
  ├── /admin/
  │   └── index.html           # Admin control panel
  └── /sales/
      └── index.html           # Sales quote builder
```

## 🔑 Key Features

### Admin Interface
- ✅ Full CRUD for manufacturers, product lines, products, addons
- ✅ View all pricing (par rates, hidden labor, etc.)
- ✅ Publish pricing versions (immutable snapshots)
- ✅ Export/import data as JSON
- ✅ Version history tracking

### Sales Interface
- ✅ Filtered view (no par pricing visible)
- ✅ Product selection with dimension inputs
- ✅ Addon selection (only visible options)
- ✅ Live price calculation
- ✅ Sales commission/uplift
- ✅ Save/load quotes
- ✅ Quote versioning
- ✅ Generate quote documents

### Pricing Engine
- ✅ Framework-agnostic (pure JavaScript)
- ✅ UI-based and flat pricing models
- ✅ Mandatory addons auto-applied
- ✅ Exclusive addon groups
- ✅ Hidden labor addons
- ✅ Size validation
- ✅ Version locking (quotes never reprice)

## 💾 Data Storage

**Current:** localStorage (works offline, no server needed)

**Future migration paths:**
1. JSON files via `fetch()`
2. REST API backend
3. Database (PostgreSQL, MongoDB, etc.)

### Export/Import

**Admin panel includes:**
- Export all data to JSON file
- Import data from JSON file
- Automatic backup before major changes

## 🔄 Migration to Astro

When ready to migrate:

```
src/
  ├── lib/
  │   ├── pricingEngine.ts    # Convert from .js (minimal changes)
  │   └── dataStorage.ts      # Swap localStorage for API calls
  ├── pages/
  │   ├── admin.astro         # Convert admin HTML
  │   └── sales.astro         # Convert sales HTML
  └── components/
      ├── QuoteBuilder.tsx    # Extract as React component
      └── PricingTable.tsx    # Reusable tables
```

**Migration is trivial because:**
- Pricing logic has zero framework dependencies
- Data model is JSON-serializable
- UI and logic are completely separated

## 📊 Pricing Rules (Enforced by Engine)

1. **UI Calculation:** `ceil(width + height)` with minimum
2. **Pricing Models:** UI-based OR flat (never both)
3. **Addons:** Modify base product (no SKU explosion)
4. **Hidden Labor:** Included in par, invisible to customer
5. **Below-Par Prevention:** Final price ≥ total par price
6. **Version Locking:** Old quotes never recalculate

## 🎨 Sample Data Included

On first run, system auto-loads:
- 2 manufacturers (Andersen, Pella)
- 2 product lines (400 Series, 250 Series)
- 3 products (SH, DH, Door)
- 4 addons (Grids, Tempered Glass, Installation, Hardware)

**Admin can modify everything.**

## 🔐 Security Notes

**Current (localStorage):**
- Data stored in browser only
- No authentication needed
- Single-user system

**Future (production):**
- Add authentication layer
- Separate admin/sales user roles
- Encrypt sensitive pricing data
- Audit log for pricing changes

## 🚀 Next Steps

### Immediate Enhancements
1. ✅ PDF quote generation (instead of text)
2. ✅ Email quote to customer
3. ✅ Product images/photos
4. ✅ Tax calculation
5. ✅ Discount codes

### Backend Migration
1. Replace `DataStorage.get()` with `fetch()` calls
2. Create REST API endpoints
3. Add PostgreSQL database
4. Implement user authentication
5. Add WebSocket for real-time updates

### Advanced Features
1. Multi-user quote collaboration
2. Approval workflows
3. Integration with accounting software
4. Customer portal (view quotes online)
5. Analytics dashboard

## 🐛 Troubleshooting

**Issue:** Files not loading in browser
- **Fix:** Use local server (not `file://` protocol)

**Issue:** Data disappears after refresh
- **Fix:** Check browser localStorage quota
- **Export data regularly as backup**

**Issue:** Prices calculating wrong
- **Fix:** Check product `minimumUI` setting
- **Check addon exclusive groups**

**Issue:** Can't add line items in sales
- **Fix:** Ensure product has allowed addons configured
- **Check size limits if set**

## 📝 Philosophy

This system follows these principles:

1. **Zero framework lock-in** → Works anywhere
2. **Logic separated from UI** → Easy to test/debug
3. **Same engine, different views** → Single source of truth
4. **AI-friendly structure** → Clear, readable, maintainable
5. **Migration-ready** → Designed to scale

## 📄 License

MIT (or your preferred license)

## 🤝 Contributing

1. Pricing logic changes → Update `pricingEngine.js` only
2. Data model changes → Update both storage and engine
3. UI changes → Modify HTML files independently
4. Always test with admin AND sales interfaces

---

**Questions?** The code is extensively commented. Start with `pricingEngine.js` to understand core logic.
