// /shared/admin_schemas.js
// Field schemas for all admin data types - single source of truth

export const FIELD_SCHEMAS = {
  mfg: {
    title: 'Edit Manufacturer',
    fields: [
      { label: 'Name', key: 'name', type: 'text', id: 'edit-mfg-name' }
    ]
  },
  
  line: {
    title: 'Edit Product Line',
    fields: [
      { label: 'Name', key: 'name', type: 'text', id: 'edit-line-name' }
    ]
  },
  
  prod: {
    title: 'Edit Product',
    fields: [
      {
        label: 'Product Type (Immutable)',
        type: 'readonly',
        value: (item) => item.productType || 'N/A',
        help: 'Product type cannot be changed. It controls which addons are available.'
      },
      {
        label: 'Product Line (Immutable)',
        type: 'readonly',
        value: (item, context) => context.productLineName || 'N/A',
        help: 'Product line cannot be changed after creation.'
      },
      { label: 'Name', key: 'name', type: 'text', id: 'edit-prod-name' },
      { label: 'Product Type Code', key: 'productTypeCode', type: 'text', id: 'edit-prod-code' },
      {
        label: 'Pricing Model',
        key: 'pricingModel',
        type: 'select',
        id: 'edit-prod-model',
        onChange: 'window.toggleEditPricingFields()',
        options: [
          { value: 'UI', label: 'UI Based' },
          { value: 'FLAT', label: 'Flat Price' }
        ]
      },
      {
        type: 'pricingGroup',
        modelKey: 'pricingModel',
        uiGroupId: 'edit-prod-rate-group',
        flatGroupId: 'edit-prod-price-group',
        uiField: { label: 'UI Rate ($/UI)', key: 'uiRate', type: 'number', id: 'edit-prod-ui-rate', step: '0.01' },
        flatField: { label: 'Flat Price', key: 'flatPrice', type: 'number', id: 'edit-prod-flat-price', step: '0.01' }
      },
      { label: 'Minimum UI', key: 'minimumUI', type: 'number', id: 'edit-prod-min-ui' },
      { label: 'Maximum UI (leave blank for unlimited)', key: 'maximumUI', type: 'number', id: 'edit-prod-max-ui' }
    ]
  },
  
  addon: {
    title: 'Edit Addon',
    fields: [
      { label: 'Name', key: 'name', type: 'text', id: 'edit-addon-name' },
      {
        label: 'Pricing Model',
        key: 'pricingModel',
        type: 'select',
        id: 'edit-addon-model',
        onChange: 'window.toggleEditAddonPricingFields()',
        options: [
          { value: 'UI', label: 'UI Based' },
          { value: 'FLAT', label: 'Flat Price' }
        ]
      },
      {
        type: 'pricingGroup',
        modelKey: 'pricingModel',
        uiGroupId: 'edit-addon-rate-group',
        flatGroupId: 'edit-addon-price-group',
        uiField: { label: 'UI Rate ($/UI)', key: 'uiRate', type: 'number', id: 'edit-addon-ui-rate', step: '0.01' },
        flatField: { label: 'Flat Price', key: 'flatPrice', type: 'number', id: 'edit-addon-flat-price', step: '0.01' }
      },
      { label: 'Exclusive Group (optional)', key: 'exclusiveGroup', type: 'text', id: 'edit-addon-exclusive' },
      { label: 'Mandatory', key: 'mandatory', type: 'checkbox', id: 'edit-addon-mandatory' },
      { label: 'Hidden from Customer', key: 'hiddenFromCustomer', type: 'checkbox', id: 'edit-addon-hidden' },
      { label: 'Job Based (Global)', key: 'isJobBased', type: 'checkbox', id: 'edit-addon-job-based' },
      { type: 'section', label: 'Restrictions (Optional)' },
      {
        type: 'group',
        className: 'form-row',
        fields: [
          {
            label: 'Allowed Product Types',
            key: 'allowedProductTypes',
            type: 'text',
            id: 'edit-addon-product-types',
            placeholder: 'e.g., Window, Door',
            formatter: (value) => (value || []).join(', ')
          },
          {
            label: 'Allowed Product Lines',
            key: 'allowedProductLines',
            type: 'text',
            id: 'edit-addon-product-lines',
            placeholder: 'e.g., Premium, Standard',
            formatter: (value) => (value || []).join(', ')
          },
          { label: 'Max Size (sq ft)', key: 'maxSize', type: 'number', id: 'edit-addon-max-size', step: '0.01' },
          { label: 'Min Size (sq ft)', key: 'minSize', type: 'number', id: 'edit-addon-min-size', step: '0.01' }
        ]
      }
    ]
  }
};

/**
 * Resolves field value from item data
 */
export function resolveFieldValue(field, item, context = {}) {
  if (typeof field.value === 'function') {
    return field.value(item, context);
  }
  const rawValue = field.key ? item[field.key] : '';
  return field.formatter ? field.formatter(rawValue, item, context) : rawValue;
}

/**
 * Builds HTML for a single input control
 */
export function buildInputHtml(field, value, onChange = '', step = '', placeholder = '', wrap = true) {
  if (field.type === 'select') {
    const optionsHtml = (field.options || []).map((option) => {
      const optionValue = typeof option === 'string' ? option : option.value;
      const optionLabel = typeof option === 'string' ? option : option.label;
      const selected = optionValue === value ? 'selected' : '';
      return `<option value="${optionValue}" ${selected}>${optionLabel}</option>`;
    }).join('');
    const inner = `
      <label>${field.label}</label>
      <select id="${field.id}"${onChange}>
        ${optionsHtml}
      </select>
    `;
    return wrap ? `<div class="form-group">${inner}</div>` : inner;
  }

  if (field.type === 'checkbox') {
    const checked = value ? 'checked' : '';
    const inner = `
      <label style="display: flex; align-items: center; gap: 0.5rem;">
        <input type="checkbox" id="${field.id}" ${checked} style="width: auto;">
        ${field.label}
      </label>
    `;
    return wrap ? `<div class="form-group">${inner}</div>` : inner;
  }

  const inputType = field.type || 'text';
  const inner = `
    <label>${field.label}</label>
    <input type="${inputType}" id="${field.id}" value="${value ?? ''}"${step}${placeholder}>
  `;
  return wrap ? `<div class="form-group">${inner}</div>` : inner;
}

/**
 * Builds HTML for any field type
 */
export function buildFieldHtml(field, item, context = {}) {
  if (field.type === 'section') {
    return `<h3 style="margin-top: 1.5rem; margin-bottom: 1rem; font-size: 0.95rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em;">${field.label}</h3>`;
  }

  if (field.type === 'group') {
    const groupFields = (field.fields || []).map((innerField) => buildFieldHtml(innerField, item, context)).join('');
    return `<div class="${field.className || ''}">${groupFields}</div>`;
  }

  if (field.type === 'readonly') {
    const value = resolveFieldValue(field, item, context) ?? '';
    return `
      <div class="form-group">
        <label>${field.label}</label>
        <div style="padding: 0.75rem; background: #f4f4f5; border-radius: 4px; border: 1px solid rgba(0,0,0,0.08); color: #666; font-weight: 500;">${value}</div>
        ${field.help ? `<small style="display: block; margin-top: 0.5rem; color: #999;">${field.help}</small>` : ''}
      </div>
    `;
  }

  if (field.type === 'pricingGroup') {
    const modelValue = resolveFieldValue({ key: field.modelKey }, item, context) || 'UI';
    const uiDisplay = modelValue === 'UI' ? '' : 'none';
    const flatDisplay = modelValue === 'FLAT' ? '' : 'none';
    const uiValue = resolveFieldValue(field.uiField, item, context) ?? '';
    const flatValue = resolveFieldValue(field.flatField, item, context) ?? '';
    const uiFieldHtml = buildInputHtml(field.uiField, uiValue, '', field.uiField.step ? ` step="${field.uiField.step}"` : '', '', false);
    const flatFieldHtml = buildInputHtml(field.flatField, flatValue, '', field.flatField.step ? ` step="${field.flatField.step}"` : '', '', false);
    return `
      <div id="${field.uiGroupId}" class="form-group" style="display:${uiDisplay};">
        ${uiFieldHtml}
      </div>
      <div id="${field.flatGroupId}" class="form-group" style="display:${flatDisplay};">
        ${flatFieldHtml}
      </div>
    `;
  }

  const value = resolveFieldValue(field, item, context) ?? '';
  const placeholder = field.placeholder ? ` placeholder="${field.placeholder}"` : '';
  const step = field.step ? ` step="${field.step}"` : '';
  const onChange = field.onChange ? ` onchange="${field.onChange}"` : '';
  return buildInputHtml(field, value, onChange, step, placeholder);
}