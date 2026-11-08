import { initLayout, refreshSidebarWordbooks } from '../core/Layout.js';
import { getWordbookList, updateWordbookTitle, duplicateWordbook, deleteWordbook } from '../api/WordbookApi.js';
import { openPromptModal } from '../components/WordbookModal.js';
import { openDropdown } from '../components/DropdownMenu.js';
import { showToast } from '../components/Toast.js';
import { goTo, getParam } from '../core/Router.js';
import { qs, qsa, escapeHTML, formatTime, formatDate, percent } from '../core/Utils.js';
import { ASSET_PATH, TOTAL_ROUNDS } from '../core/Config.js';

let userId = null;
let wordbookList = [];
let sortMode = 'recent';
let searchQuery = getParam('q') ?? '';

async function initWordbookListPage() {
  const { user } = await initLayout('wordbooks', {
    searchValue: searchQuery,
    onSearch: (q) => {
      searchQuery = q;
      renderWordbookList();
    },
  });
  userId = user.id;

  qsa('.sort-tab').forEach((btn) => btn.addEventListener('click', () => handleSortChange(btn.dataset.sort)));
  qs('#wordbook-list').addEventListener('click', handleListClick);

  await loadWordbooks();
}

async function loadWordbooks() {
  try {
    wordbookList = await getWordbookList(userId, sortMode);
    renderWordbookList();
  } catch (err) {
    console.error(err);
    showToast('단어장을 불러오지 못했어요.', { type: 'error' });
  }
}

function getVisibleWordbooks() {
  const q = searchQuery.toLowerCase();
  return q ? wordbookList.filter((wb) => wb.title.toLowerCase().includes(q)) : wordbookList;
}

function renderWordbookList() {
  const visible = getVisibleWordbooks();
  const listEl = qs('#wordbook-list');
  const emptyEl = qs('#wordbook-empty');

  qs('#wordbook-count').textContent = wordbookList.length;
  listEl.innerHTML = visible.map((wb, i) => renderWordbookRow(wb, i === 0)).join('');

  if (visible.length === 0) {
    emptyEl.textContent = searchQuery
      ? `'${searchQuery}' 검색 결과가 없어요.`
      : '아직 단어장이 없어요. 오른쪽 위 + 새 단어장을 눌러 만들어 보세요.';
    emptyEl.classList.remove('is-hidden');
  } else {
    emptyEl.classList.add('is-hidden');
  }
}

function renderWordbookRow(wb, isFirst) {
  const rate = percent(wb.memorized_count, wb.word_count);
  const studied = wb.last_studied_at ? `${formatDate(wb.last_studied_at)} 학습` : '학습 기록 없음';
  return `
    <li class="wb-row" data-id="${wb.id}" data-action="open">
      <span class="wb-row-icon"><img class="icon icon-lg" src="${ASSET_PATH.icons}IconBook.svg" alt=""></span>
      <div class="wb-row-text">
        <p class="wb-row-title">${escapeHTML(wb.title)}</p>
        <p class="wb-row-meta">${wb.word_count}단어 · 최고 ${formatTime(wb.best_time)} · ${studied}</p>
      </div>
      <div class="wb-row-progress">
        <div class="progress"><div class="progress-fill" style="width:${rate}%"></div></div>
        <span class="mono">${rate}%</span>
      </div>
      <button type="button" class="btn ${isFirst ? 'btn-wax' : 'btn-ghost-wax'} wb-row-game" data-action="game">게임 시작</button>
      <button type="button" class="icon-btn" data-action="more" title="더보기">
        <img class="icon" src="${ASSET_PATH.icons}IconMore.svg" alt="">
      </button>
    </li>`;
}

function handleListClick(e) {
  const row = e.target.closest('.wb-row');
  if (!row) return;
  const wb = wordbookList.find((w) => w.id === row.dataset.id);
  const action = e.target.closest('[data-action]')?.dataset.action;

  if (action === 'game') startGameIfReady(wb);
  else if (action === 'more') openRowMenu(wb, e.target.closest('[data-action]'));
  else goTo('study', { id: wb.id });
}

function openRowMenu(wb, anchor) {
  openDropdown(anchor, [
    {
      label: '이름 수정',
      icon: 'IconEdit',
      onClick: async () => {
        const title = await openPromptModal({ title: '단어장 이름 수정', value: wb.title, confirmText: '저장' });
        if (!title || title === wb.title) return;
        try {
          await updateWordbookTitle(wb.id, title);
          await afterChange('이름을 바꿨어요.');
        } catch (err) {
          console.error(err);
          showToast('이름을 바꾸지 못했어요.', { type: 'error' });
        }
      },
    },
    {
      label: '복제하기',
      icon: 'IconBook',
      onClick: async () => {
        try {
          await duplicateWordbook(wb.id);
          await afterChange('단어장을 복제했어요.');
        } catch (err) {
          console.error(err);
          showToast('복제하지 못했어요.', { type: 'error' });
        }
      },
    },
    {
      label: '삭제',
      icon: 'IconTrash',
      danger: true,
      onClick: async () => {
        if (!confirm(`'${wb.title}' 단어장을 삭제할까요?\n단어와 게임 기록도 모두 지워져요.`)) return;
        try {
          await deleteWordbook(wb.id);
          await afterChange('삭제했어요.');
        } catch (err) {
          console.error(err);
          showToast('삭제하지 못했어요.', { type: 'error' });
        }
      },
    },
  ]);
}

async function afterChange(message) {
  await loadWordbooks();
  await refreshSidebarWordbooks();
  showToast(message);
}

function handleSortChange(mode) {
  if (mode === sortMode) return;
  sortMode = mode;
  qsa('.sort-tab').forEach((btn) => btn.classList.toggle('is-active', btn.dataset.sort === mode));
  loadWordbooks();
}

function startGameIfReady(wb) {
  if (wb.word_count < TOTAL_ROUNDS) {
    showToast(`게임을 하려면 단어가 ${TOTAL_ROUNDS}개 이상 필요해요.`, { type: 'error' });
    return;
  }
  goTo('game', { id: wb.id });
}

initWordbookListPage();
