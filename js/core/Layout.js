import { requireAuth, logOut } from './Auth.js';
import { goTo, PAGES } from './Router.js';
import { escapeHTML, debounce, qs } from './Utils.js';
import { ASSET_PATH } from './Config.js';
import { getWordbookList } from '../api/WordbookApi.js';
import { openCreateWordbookModal } from '../components/WordbookModal.js';

const SIDEBAR_WORDBOOK_LIMIT = 5;
let layoutState = { user: null, profile: null, activeMenu: 'home', activeWordbookId: null };

const icon = (name, cls = 'icon') => `<img class="${cls}" src="${ASSET_PATH.icons}${name}.svg" alt="">`;

export async function initLayout(activeMenu, { activeWordbookId = null, onSearch = null, searchValue = '' } = {}) {
  const { user, profile } = await requireAuth();
  layoutState = { user, profile, activeMenu, activeWordbookId };

  renderTopbar(onSearch, searchValue);
  await renderSidebar(activeMenu, activeWordbookId);
  return { user, profile };
}

export async function renderSidebar(activeMenu = layoutState.activeMenu, activeWordbookId = layoutState.activeWordbookId) {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;
  const { profile } = layoutState;
  const navItem = (key, page, iconName, label) => `
    <a class="nav-item${activeMenu === key ? ' is-active' : ''}" href="./${PAGES[page]}">
      ${icon(iconName)}<span>${label}</span>
    </a>`;

  sidebar.className = 'sidebar';
  sidebar.innerHTML = `
    <a class="sidebar-logo" href="./${PAGES.main}">
      <img src="${ASSET_PATH.logo}LogoHorizontalDark.svg" alt="Hello Word" />
    </a>
    <nav class="sidebar-nav">
      ${navItem('home', 'main', 'IconHome', '홈')}
      ${navItem('wordbooks', 'list', 'IconBook', '단어장')}
      ${navItem('settings', 'settings', 'IconGear', '설정')}
    </nav>
    <p class="sidebar-section-title">내 단어장</p>
    <div class="sidebar-wordbooks" id="sidebar-wordbooks"></div>
    <div class="sidebar-profile">
      <div class="avatar">${escapeHTML((profile.nickname || '?').charAt(0))}</div>
      <div class="profile-text">
        <p class="profile-name">${escapeHTML(profile.nickname)}</p>
        <p class="profile-email">${escapeHTML(profile.email ?? '')}</p>
      </div>
      <button type="button" class="icon-btn" id="logout-btn" title="로그아웃">${icon('IconLogout')}</button>
    </div>`;

  qs('#logout-btn', sidebar).addEventListener('click', () => {
    if (confirm('로그아웃할까요?')) logOut();
  });

  await refreshSidebarWordbooks(activeWordbookId);
}

export async function refreshSidebarWordbooks(activeWordbookId = layoutState.activeWordbookId) {
  const box = document.getElementById('sidebar-wordbooks');
  if (!box) return;
  try {
    const list = await getWordbookList(layoutState.user.id, 'recent');
    if (list.length === 0) {
      box.innerHTML = '<p class="sidebar-wb-item text-muted">아직 없어요</p>';
      return;
    }
    box.innerHTML = list
      .slice(0, SIDEBAR_WORDBOOK_LIMIT)
      .map(
        (wb) => `
        <a class="sidebar-wb-item${wb.id === activeWordbookId ? ' is-active' : ''}" href="./${PAGES.study}?id=${wb.id}">
          <span>${escapeHTML(wb.title)}</span>
          <span class="sidebar-wb-count">${wb.word_count}</span>
        </a>`,
      )
      .join('');
  } catch (err) {
    console.error(err);
    box.innerHTML = '';
  }
}

export function renderTopbar(onSearch, searchValue = '') {
  const topbar = document.getElementById('topbar');
  if (!topbar) return;

  topbar.className = 'topbar';
  topbar.innerHTML = `
    <label class="search-box">
      ${icon('IconSearch')}
      <input id="topbar-search" type="search" placeholder="단어장, 단어 검색" value="${escapeHTML(searchValue)}" />
    </label>
    <button type="button" class="btn btn-wax btn-sm" id="new-wordbook-btn">+ 새 단어장</button>`;

  const input = qs('#topbar-search', topbar);
  if (onSearch) {
    input.addEventListener('input', debounce(() => onSearch(input.value.trim()), 300));
  } else {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && input.value.trim()) goTo('list', { q: input.value.trim() });
    });
  }

  qs('#new-wordbook-btn', topbar).addEventListener('click', async () => {
    const id = await openCreateWordbookModal();
    if (id) goTo('study', { id, manage: '1' });
  });
}
