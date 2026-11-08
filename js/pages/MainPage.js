import { initLayout } from '../core/Layout.js';
import { getRecentSummary } from '../api/RecordApi.js';
import { getWordbookList } from '../api/WordbookApi.js';
import { goTo, PAGES } from '../core/Router.js';
import { qs, escapeHTML, formatTime, formatDate, percent } from '../core/Utils.js';
import { ASSET_PATH, TOTAL_ROUNDS } from '../core/Config.js';
import { showToast } from '../components/Toast.js';

let recentSummary = null;
let homeWordbooks = [];

async function initMainPage() {
  const { user, profile } = await initLayout('home');
  renderGreeting(profile);

  try {
    await Promise.all([loadRecentSummary(user.id), loadHomeWordbooks(user.id)]);
    renderRecentCard(recentSummary ?? homeWordbooks[0] ?? null);
    renderHomeWordbooks(homeWordbooks.slice(0, 4));
  } catch (err) {
    console.error(err);
    showToast('데이터를 불러오지 못했어요.', { type: 'error' });
  }
}

function renderGreeting(profile) {
  qs('#greeting').textContent = `안녕하세요, ${profile.nickname}님`;
}

async function loadRecentSummary(userId) {
  recentSummary = await getRecentSummary(userId);
}

async function loadHomeWordbooks(userId) {
  homeWordbooks = await getWordbookList(userId, 'recent');
}

function renderRecentCard(summary) {
  const title = qs('#recent-title');
  const meta = qs('#recent-meta');
  const best = qs('#recent-best');
  const startBtn = qs('#recent-start');

  if (!summary) {
    title.textContent = '아직 단어장이 없어요';
    meta.textContent = '오른쪽 위 + 새 단어장으로 시작해 보세요.';
    best.textContent = '—';
    startBtn.textContent = '단어장 만들기';
    startBtn.onclick = () => qs('#new-wordbook-btn')?.click();
    return;
  }

  title.textContent = summary.title;
  meta.textContent = `${summary.word_count}단어 · 마지막 학습 ${formatDate(summary.last_studied_at)}`;
  best.textContent = formatTime(summary.best_time);
  startBtn.onclick = () => {
    if (summary.word_count < TOTAL_ROUNDS) {
      showToast(`게임을 하려면 단어가 ${TOTAL_ROUNDS}개 이상 필요해요.`, { type: 'error' });
      goTo('study', { id: summary.id, manage: '1' });
      return;
    }
    goTo('game', { id: summary.id });
  };
}

function renderHomeWordbooks(list) {
  const grid = qs('#home-wordbook-grid');
  if (list.length === 0) {
    grid.innerHTML = '<p class="empty-state" style="grid-column: 1 / -1">단어장을 만들면 여기에 보여요.</p>';
    return;
  }
  grid.innerHTML = list
    .map(
      (wb) => `
      <a class="wb-card" href="./${PAGES.study}?id=${wb.id}">
        <span class="wb-card-icon"><img class="icon" src="${ASSET_PATH.icons}IconBook.svg" alt=""></span>
        <p class="wb-card-title">${escapeHTML(wb.title)}</p>
        <p class="wb-card-meta">${wb.word_count}단어</p>
        <div class="progress"><div class="progress-fill" style="width:${percent(wb.memorized_count, wb.word_count)}%"></div></div>
      </a>`,
    )
    .join('');
}

initMainPage();
