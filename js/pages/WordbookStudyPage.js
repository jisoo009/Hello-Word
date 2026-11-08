import { initLayout, refreshSidebarWordbooks } from '../core/Layout.js';
import { getWordbook, touchWordbook } from '../api/WordbookApi.js';
import { getWordsByWordbookId, updateWordStatus } from '../api/WordApi.js';
import { openWordbookModal } from '../components/WordbookModal.js';
import { showToast } from '../components/Toast.js';
import { goTo, getParam, requireParam } from '../core/Router.js';
import { qs, qsa, escapeHTML, formatTime, shuffle, percent } from '../core/Utils.js';
import { WORD_STATUS, TOTAL_ROUNDS } from '../core/Config.js';

const UNKNOWN_PREVIEW = 6;

const wordbookId = requireParam('id');
let wordbook = null;
let words = [];
let deck = [];
let cardIndex = 0;
let isFlipped = false;
let activeTab = 'card';
let isReviewMode = false;

async function initStudyPage() {
  await initLayout('wordbooks', { activeWordbookId: wordbookId });

  qs('#flashcard').addEventListener('click', handleCardClick);
  qs('#btn-prev').addEventListener('click', goPrev);
  qs('#btn-next').addEventListener('click', goNext);
  qs('#btn-known').addEventListener('click', () => markWord(WORD_STATUS.KNOWN));
  qs('#btn-unknown').addEventListener('click', () => markWord(WORD_STATUS.UNKNOWN));
  qs('#btn-shuffle').addEventListener('click', shuffleDeck);
  qs('#btn-review-unknown').addEventListener('click', startReviewUnknown);
  qs('#open-manage').addEventListener('click', openManage);
  qs('#empty-add').addEventListener('click', openManage);
  qs('#study-start-game').addEventListener('click', startGame);
  qsa('.tab').forEach((btn) => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));
  document.addEventListener('keydown', handleStudyKeydown);

  await loadStudyData();
  touchWordbook(wordbookId).catch(console.error);

  if (getParam('manage') === '1') openManage();
}

async function loadStudyData() {
  try {
    [wordbook, words] = await Promise.all([getWordbook(wordbookId), getWordsByWordbookId(wordbookId)]);
  } catch (err) {
    console.error(err);
    showToast('단어장을 불러오지 못했어요.', { type: 'error' });
    return;
  }
  if (!wordbook) {
    showToast('단어장을 찾을 수 없어요.', { type: 'error' });
    goTo('list');
    return;
  }

  const currentId = deck[cardIndex]?.id;
  deck = isReviewMode ? words.filter((w) => w.status === WORD_STATUS.UNKNOWN) : [...words];
  if (deck.length === 0) {
    isReviewMode = false;
    deck = [...words];
  }
  const keep = deck.findIndex((w) => w.id === currentId);
  cardIndex = keep >= 0 ? keep : 0;

  renderAll();
}

function renderAll() {
  renderStudyHeader();
  renderCard();
  renderStudyStatus();
  renderMemorizedBar();
  if (activeTab === 'list') renderWordTable();
}

function counts() {
  const known = words.filter((w) => w.status === WORD_STATUS.KNOWN).length;
  const unknown = words.filter((w) => w.status === WORD_STATUS.UNKNOWN).length;
  return { known, unknown, left: words.length - known - unknown };
}

function renderStudyHeader() {
  const { known } = counts();
  document.title = `${wordbook.title} · Hello Word`;
  qs('#breadcrumb-title').textContent = wordbook.title;
  qs('#study-title').textContent = wordbook.title;
  qs('#study-meta').textContent = `${words.length}단어 · 외운 단어 ${known}개 · 최고 기록 ${formatTime(wordbook.best_time)}`;
}

function renderCard() {
  const empty = deck.length === 0;
  qs('#study-empty').classList.toggle('is-hidden', !empty);
  qs('#card-area').classList.toggle('is-hidden', empty);
  if (empty) return;

  const word = deck[cardIndex];
  const card = qs('#flashcard');
  card.classList.toggle('is-flipped', isFlipped);
  card.classList.toggle('is-known', word.status === WORD_STATUS.KNOWN);
  card.classList.toggle('is-unknown', word.status === WORD_STATUS.UNKNOWN);

  qs('#card-index').textContent = `${cardIndex + 1} / ${deck.length}${isReviewMode ? ' · 모르는 단어' : ''}`;
  qs('#card-term').textContent = word.term;
  qs('#card-phonetic').textContent = word.phonetic ? `/${word.phonetic.replace(/^\/|\/$/g, '')}/` : '';
  qs('#card-meaning').textContent = word.meaning;
  qs('#card-hint-text').textContent = isFlipped ? '다시 누르면 단어가 보여요' : '카드를 누르면 뜻이 보여요';
}

function flipCard() {
  isFlipped = !isFlipped;
  renderCard();
}

function handleCardClick(e) {
  if (e.target.closest('#card-speak')) {
    speakTerm();
    return;
  }
  flipCard();
}

function goNext() {
  if (deck.length === 0) return;
  if (cardIndex === deck.length - 1) {
    showToast('마지막 카드예요. 처음으로 돌아갈게요.');
    cardIndex = 0;
  } else {
    cardIndex += 1;
  }
  isFlipped = false;
  renderCard();
}

function goPrev() {
  if (deck.length === 0) return;
  cardIndex = cardIndex === 0 ? deck.length - 1 : cardIndex - 1;
  isFlipped = false;
  renderCard();
}

async function markWord(status) {
  const word = deck[cardIndex];
  if (!word) return;
  const prev = word.status;
  word.status = status;
  renderStudyStatus();
  renderMemorizedBar();
  renderStudyHeader();
  goNext();
  try {
    await updateWordStatus(word.id, status);
  } catch (err) {
    console.error(err);
    word.status = prev;
    renderAll();
    showToast('저장하지 못했어요.', { type: 'error' });
  }
}

function renderStudyStatus() {
  const { known, unknown, left } = counts();
  qs('#stat-known').textContent = known;
  qs('#stat-unknown').textContent = unknown;
  qs('#stat-left').textContent = left;
  qs('#unknown-count').textContent = unknown;

  const unknownWords = words.filter((w) => w.status === WORD_STATUS.UNKNOWN);
  const list = qs('#unknown-list');
  list.innerHTML = unknownWords.length
    ? unknownWords
        .slice(0, UNKNOWN_PREVIEW)
        .map((w) => `<li><span class="unknown-term">${escapeHTML(w.term)}</span><span>${escapeHTML(w.meaning)}</span></li>`)
        .join('') +
      (unknownWords.length > UNKNOWN_PREVIEW ? `<li class="text-muted">외 ${unknownWords.length - UNKNOWN_PREVIEW}개</li>` : '')
    : '<li class="text-muted">아직 모르는 단어가 없어요.</li>';

  qs('#btn-review-unknown').disabled = unknownWords.length === 0;
  qs('#btn-review-unknown').textContent = isReviewMode ? '전체 단어 다시 보기' : '모르는 단어만 다시 보기';
  if (isReviewMode) qs('#btn-review-unknown').disabled = false;
}

function renderMemorizedBar() {
  const { known } = counts();
  qs('#memorized-text').textContent = `${known} / ${words.length}`;
  qs('#memorized-bar').style.width = `${percent(known, words.length)}%`;
}

function shuffleDeck() {
  if (deck.length < 2) return;
  deck = shuffle(deck);
  cardIndex = 0;
  isFlipped = false;
  renderCard();
  showToast('카드를 섞었어요.');
}

function startReviewUnknown() {
  if (isReviewMode) {
    isReviewMode = false;
    deck = [...words];
  } else {
    const unknownWords = words.filter((w) => w.status === WORD_STATUS.UNKNOWN);
    if (unknownWords.length === 0) return;
    isReviewMode = true;
    deck = unknownWords;
  }
  cardIndex = 0;
  isFlipped = false;
  renderCard();
  renderStudyStatus();
}

function speakTerm() {
  const word = deck[cardIndex];
  if (!word || !('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(word.term);
  utter.lang = 'en-US';
  utter.rate = 0.9;
  speechSynthesis.speak(utter);
}

function switchTab(tab) {
  activeTab = tab;
  qsa('.tab').forEach((btn) => btn.classList.toggle('is-active', btn.dataset.tab === tab));
  qs('#panel-card').classList.toggle('is-hidden', tab !== 'card');
  qs('#panel-list').classList.toggle('is-hidden', tab !== 'list');
  if (tab === 'list') renderWordTable();
}

function renderWordTable() {
  const statusLabel = {
    [WORD_STATUS.KNOWN]: '<span class="badge badge-wax">외웠어요</span>',
    [WORD_STATUS.UNKNOWN]: '<span class="badge badge-danger">모르겠어요</span>',
    [WORD_STATUS.NEW]: '<span class="badge">남은 단어</span>',
  };
  qs('#word-table tbody').innerHTML = words.length
    ? words
        .map(
          (w, i) => `
          <tr>
            <td class="mono text-muted">${i + 1}</td>
            <td class="word-table-term">${escapeHTML(w.term)}</td>
            <td>${escapeHTML(w.meaning)}</td>
            <td>${statusLabel[w.status] ?? statusLabel.new}</td>
          </tr>`,
        )
        .join('')
    : '<tr><td colspan="4" class="text-sub" style="text-align:center;padding:40px">단어가 없어요.</td></tr>';
}

function openManage() {
  openWordbookModal(wordbookId, {
    onChange: async () => {
      await loadStudyData();
      refreshSidebarWordbooks(wordbookId);
    },
  });
}

function startGame() {
  if (words.length < TOTAL_ROUNDS) {
    showToast(`게임을 하려면 단어가 ${TOTAL_ROUNDS}개 이상 필요해요.`, { type: 'error' });
    return;
  }
  goTo('game', { id: wordbookId });
}

function handleStudyKeydown(e) {
  if (document.querySelector('.modal-overlay')) return;
  if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
  if (activeTab !== 'card') return;

  if (e.key === 'ArrowRight') goNext();
  else if (e.key === 'ArrowLeft') goPrev();
  else if (e.key === ' ') {
    e.preventDefault();
    flipCard();
  }
}

initStudyPage();
