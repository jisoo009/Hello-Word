import { escapeHTML } from '../core/Utils.js';
import { ASSET_PATH } from '../core/Config.js';

function getRoot() {
  let root = document.getElementById('toast-root');
  if (!root) {
    root = document.createElement('div');
    root.id = 'toast-root';
    document.body.appendChild(root);
  }
  return root;
}

export function showToast(message, { type = 'success', duration = 2000 } = {}) {
  const toast = document.createElement('div');
  toast.className = `toast${type === 'error' ? ' is-error' : ''}`;
  const icon = type === 'error' ? '' : `<img class="icon" src="${ASSET_PATH.icons}IconCheck.svg" alt="">`;
  toast.innerHTML = `${icon}<span>${escapeHTML(message)}</span>`;
  getRoot().appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('is-show'));
  setTimeout(() => {
    toast.classList.remove('is-show');
    setTimeout(() => toast.remove(), 250);
  }, duration);
}
