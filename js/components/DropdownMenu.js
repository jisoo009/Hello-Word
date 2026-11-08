import { escapeHTML } from '../core/Utils.js';
import { ASSET_PATH } from '../core/Config.js';

let menuEl = null;

function onOutside(e) {
  if (menuEl && !menuEl.contains(e.target)) closeDropdown();
}
function onKey(e) {
  if (e.key === 'Escape') closeDropdown();
}

export function openDropdown(anchorEl, items) {
  closeDropdown();

  menuEl = document.createElement('div');
  menuEl.className = 'dropdown';
  menuEl.innerHTML = items
    .map(
      (item, i) => `
      <button type="button" class="dropdown-item${item.danger ? ' is-danger' : ''}" data-index="${i}">
        ${item.icon ? `<img class="icon icon-sm" src="${ASSET_PATH.icons}${item.icon}.svg" alt="">` : ''}
        <span>${escapeHTML(item.label)}</span>
      </button>`,
    )
    .join('');
  document.body.appendChild(menuEl);

  const rect = anchorEl.getBoundingClientRect();
  menuEl.style.top = `${rect.bottom + 6 + window.scrollY}px`;
  menuEl.style.left = `${rect.right - menuEl.offsetWidth + window.scrollX}px`;

  menuEl.addEventListener('click', (e) => {
    const btn = e.target.closest('.dropdown-item');
    if (!btn) return;
    const item = items[Number(btn.dataset.index)];
    closeDropdown();
    item.onClick?.();
  });

  setTimeout(() => {
    document.addEventListener('click', onOutside);
    document.addEventListener('keydown', onKey);
  });
}

export function closeDropdown() {
  menuEl?.remove();
  menuEl = null;
  document.removeEventListener('click', onOutside);
  document.removeEventListener('keydown', onKey);
}
