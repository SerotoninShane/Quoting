export function showAlert(message, type = 'success', options = {}) {
  if (options && options.enabled === false) return;

  const alert = document.createElement('div');
  alert.className = `alert alert-${type}`;

  const contentDiv = document.createElement('div');
  contentDiv.className = 'alert-content';
  contentDiv.textContent = message;

  const closeBtn = document.createElement('button');
  closeBtn.className = 'alert-close';
  closeBtn.innerHTML = '✕';
  closeBtn.onclick = (e) => {
    e.stopPropagation();
    alert.style.animation = 'slideDown 0.3s ease-out reverse';
    setTimeout(() => alert.remove(), 300);
  };

  alert.appendChild(contentDiv);
  alert.appendChild(closeBtn);

  const existingAlerts = document.querySelectorAll('.alert').length;
  alert.style.zIndex = 10000 + existingAlerts;

  document.body.appendChild(alert);

  setTimeout(() => {
    alert.style.animation = 'slideDown 0.3s ease-out reverse';
    setTimeout(() => alert.remove(), 300);
  }, options.autoCloseMs || 5000);
}

export function showModal(title, content, buttons = []) {
  const modalId = `modal-${Date.now()}`;
  let buttonHtml = '';
  if (buttons.length === 0) {
    buttonHtml = `<button class="btn-secondary" onclick="document.getElementById('${modalId}').remove()">Close</button>`;
  } else {
    buttonHtml = buttons.map((btn, idx) => {
      const btnClass = btn.type === 'primary' ? 'btn-primary' : btn.type === 'danger' ? 'btn-danger' : 'btn-secondary';
      const btnId = `btn-${modalId}-${idx}`;
      return `<button id="${btnId}" class="${btnClass}">${btn.label}</button>`;
    }).join('');
  }

  const html = `<div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.35); z-index: 1000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(2px);" id="${modalId}" onclick="if(event.target.id === '${modalId}') this.remove()">
    <div style="background: white; padding: 1.5rem; border-radius: 8px; max-width: 500px; width: 90%; border: 1px solid rgba(0,0,0,0.08); box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); max-height: 80vh; overflow-y: auto;">
      <h2 style="margin-top: 0; margin-bottom: 1rem;">${title}</h2>
      <div id="modal-content-${Date.now()}">${content}</div>
      <div style="display: flex; gap: 8px; margin-top: 1.5rem;">
        ${buttonHtml}
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', html);

  buttons.forEach((btn, idx) => {
    const btnId = `btn-${modalId}-${idx}`;
    const btnElement = document.getElementById(btnId);
    if (btnElement && btn.onclick) {
      btnElement.onclick = (e) => {
        e.preventDefault();
        if (typeof btn.onclick === 'function') {
          btn.onclick();
        } else {
          eval(btn.onclick);
        }
        if (!btn.keepOpen) {
          const modal = document.getElementById(modalId);
          if (modal) modal.remove();
        }
      };
    }
  });

  return modalId;
}
