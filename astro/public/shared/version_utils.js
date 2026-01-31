// /shared/version_utils.js
// Version export/import utilities

/**
 * Export version as JSON
 */
export function exportAsJSON(version) {
  const content = JSON.stringify(version, null, 2);
  const filename = `${version.name || version.id}.json`;
  downloadFile(content, filename, 'application/json');
}

/**
 * Export version as CSV
 */
export function exportAsCSV(version) {
  let csv = '';
  
  // Manufacturers
  csv += 'MANUFACTURERS\n';
  csv += 'ID,Name\n';
  Object.values(version.manufacturers || {}).forEach(m => {
    csv += `"${m.id}","${m.name}"\n`;
  });
  csv += '\n';
  
  // Product Lines
  csv += 'PRODUCT LINES\n';
  csv += 'ID,Manufacturer ID,Name\n';
  Object.values(version.productLines || {}).forEach(pl => {
    csv += `"${pl.id}","${pl.manufacturerId}","${pl.name}"\n`;
  });
  csv += '\n';
  
  // Products
  csv += 'PRODUCTS\n';
  csv += 'ID,Product Line ID,Product Type,Type Code,Name,Pricing Model,UI Rate,Flat Price,Minimum UI,Maximum UI\n';
  Object.values(version.products || {}).forEach(p => {
    const uiRate = p.uiRate || '';
    const flatPrice = p.flatPrice || '';
    const maxUI = p.maximumUI || '';
    csv += `"${p.id}","${p.productLineId}","${p.productType}","${p.productTypeCode}","${p.name}","${p.pricingModel}","${uiRate}","${flatPrice}","${p.minimumUI}","${maxUI}"\n`;
  });
  csv += '\n';
  
  // Addons
  csv += 'ADDONS\n';
  csv += 'ID,Name,Pricing Model,UI Rate,Flat Price,Exclusive Group,Mandatory,Hidden From Customer,Job Based,Allowed Product Types,Allowed Product Lines,Min Size,Max Size\n';
  Object.values(version.addons || {}).forEach(a => {
    const uiRate = a.uiRate || '';
    const flatPrice = a.flatPrice || '';
    const exclusiveGroup = a.exclusiveGroup || '';
    const minSize = a.minSize || '';
    const maxSize = a.maxSize || '';
    const productTypes = (a.allowedProductTypes || []).join('; ');
    const productLines = (a.allowedProductLines || []).join('; ');
    csv += `"${a.id}","${a.name}","${a.pricingModel}","${uiRate}","${flatPrice}","${exclusiveGroup}","${a.mandatory ? 'YES' : 'NO'}","${a.hiddenFromCustomer ? 'YES' : 'NO'}","${a.isJobBased ? 'YES' : 'NO'}","${productTypes}","${productLines}","${minSize}","${maxSize}"\n`;
  });

  const filename = `${version.name || version.id}.csv`;
  downloadFile(csv, filename, 'text/csv');
}

/**
 * Import version from JSON content
 */
export function importFromJSON(content) {
  const versionData = JSON.parse(content);
  
  if (!versionData.id || !versionData.manufacturers) {
    throw new Error('Invalid version JSON format');
  }
  
  return {
    manufacturers: versionData.manufacturers || {},
    productLines: versionData.productLines || {},
    products: versionData.products || {},
    addons: versionData.addons || {}
  };
}

/**
 * Import version from CSV content
 */
export function importFromCSV(content) {
  const lines = content.trim().split('\n');
  const data = {
    manufacturers: {},
    productLines: {},
    products: {},
    addons: {}
  };
  
  let currentSection = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Section headers
    if (line === 'MANUFACTURERS') {
      currentSection = 'manufacturers';
      i++; // skip column header
      continue;
    } else if (line === 'PRODUCT LINES') {
      currentSection = 'productLines';
      i++;
      continue;
    } else if (line === 'PRODUCTS') {
      currentSection = 'products';
      i++;
      continue;
    } else if (line === 'ADDONS') {
      currentSection = 'addons';
      i++;
      continue;
    } else if (line === '') {
      continue;
    }
    
    // Parse CSV line
    const values = parseCSVLine(line);
    
    // Parse based on section
    if (currentSection === 'manufacturers' && values.length >= 2) {
      const id = values[0];
      const name = values[1];
      data.manufacturers[id] = { id, name };
    } else if (currentSection === 'productLines' && values.length >= 3) {
      const id = values[0];
      const manufacturerId = values[1];
      const name = values[2];
      data.productLines[id] = { id, manufacturerId, name };
    } else if (currentSection === 'products' && values.length >= 5) {
      const product = {
        id: values[0],
        productLineId: values[1],
        productType: values[2],
        productTypeCode: values[3],
        name: values[4],
        pricingModel: values[5],
        minimumUI: parseInt(values[8]) || 0,
        maximumUI: values[9] ? parseInt(values[9]) : null
      };
      if (product.pricingModel === 'UI' && values[6]) {
        product.uiRate = parseFloat(values[6]);
      }
      if (product.pricingModel === 'FLAT' && values[7]) {
        product.flatPrice = parseFloat(values[7]);
      }
      data.products[product.id] = product;
    } else if (currentSection === 'addons' && values.length >= 4) {
      const addon = {
        id: values[0],
        name: values[1],
        pricingModel: values[2],
        exclusiveGroup: values[5] || null,
        mandatory: values[6].toUpperCase() === 'YES',
        hiddenFromCustomer: values[7].toUpperCase() === 'YES',
        isJobBased: values[8].toUpperCase() === 'YES',
        minSize: values[11] ? parseFloat(values[11]) : null,
        maxSize: values[12] ? parseFloat(values[12]) : null
      };
      
      if (addon.pricingModel === 'UI' && values[3]) {
        addon.uiRate = parseFloat(values[3]);
      }
      if (addon.pricingModel === 'FLAT' && values[4]) {
        addon.flatPrice = parseFloat(values[4]);
      }
      
      addon.allowedProductTypes = values[9] 
        ? values[9].split(';').map(t => t.trim()).filter(t => t) 
        : null;
      addon.allowedProductLines = values[10]
        ? values[10].split(';').map(l => l.trim()).filter(l => l)
        : null;
      
      data.addons[addon.id] = addon;
    }
  }
  
  return data;
}

/**
 * Parse a single CSV line handling quoted values
 */
function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;
  
  for (let j = 0; j < line.length; j++) {
    const char = line[j];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  
  return values.map(v => v.replace(/"/g, ''));
}

/**
 * Trigger file download in browser
 */
function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}