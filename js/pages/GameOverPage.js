import { requireAuth } from '../core/Auth.js';
import { saveGameRecord, getBestSurvivalTime } from '../api/RecordApi.js';
import { touchWordbook } from '../api/WordbookApi.js';
import { goTo } from '../core/Router.js';
import { qs, escapeHTML, formatTime } from '../core/Utils.js';
import { STORAGE_KEYS, ASSET_PATH, TOTAL_ROUNDS } from '../core/Config.js';
import { showToast } from '../components/Toast.js';

let result = null;

async function initGameOverPage() {
  const { user } = await requireAuth();

  result = readResult();
  if (!result) {
    goTo('list');
    return;
  }

  qs('#restart').addEventListener('click', restartGame);
  qs('#go-list').addEventListener('click', goToWordbookList);

  await saveResultOnce(user.id);
  let best = null;
  try {
    best = await getBestSurvivalTime(user.id, result.wordbookId);
  } catch (err) {
    console.error(err);
  }
  displayResult(result, best);
}

function readResult() {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEYS.lastResult));
  } catch {
    return null;
  }
}

async function saveResultOnce(userId) {
  if (result.saved) return;
  try {
    await saveGameRecord({
      userId,
      wordbookId: result.wordbookId,
      correctCount: result.correctCount,
      survivalTime: result.survivalTime,
      isCleared: result.isCleared,
    });
    await touchWordbook(result.wordbookId);
    result.saved = true;
    sessionStorage.setItem(STORAGE_KEYS.lastResult, JSON.stringify(result));
  } catch (err) {
    console.error(err);
    showToast('기록을 저장하지 못했어요.', { type: 'error' });
  }
}

function displayResult(r, best) {
  document.title = `${r.isCleared ? '클리어' : '게임 오버'} · Hello Word`;

  const bg = r.isCleared ? 'BgDarkClassroom.jpg' : 'JumpscareFace.jpg';
  qs('#result-bg').style.setProperty('--bg', `url(${ASSET_PATH.images}${bg})`);

  const badge = qs('#result-badge');
  badge.textContent = r.isCleared ? '게임 클리어' : '게임 오버';
  badge.className = `result-badge ${r.isCleared ? 'is-clear' : 'is-fail'}`;
  qs('#result-title').textContent = r.isCleared
    ? `${r.totalRounds}라운드를 모두 버텼어요`
    : `${r.failedRound}라운드에서 들켰어요`;

  const total = r.totalRounds ?? TOTAL_ROUNDS;
  qs('#result-rounds').innerHTML = Array.from({ length: total }, (_, i) => {
    const res = r.roundResults?.[i];
    return `<span class="round-dot${res === 'correct' ? ' is-correct' : ''}${res === 'wrong' ? ' is-wrong' : ''}"></span>`;
  }).join('');

  qs('#result-correct').textContent = `${r.correctCount} / ${total}`;
  qs('#result-survival').textContent = formatTime(r.survivalTime);
  qs('#result-best').textContent = formatTime(best ?? r.survivalTime);

  if (r.isCleared) renderPlayedWords(r.playedWords);
  else renderWrongWord(r.wrongWord);
}

function renderWrongWord(w) {
  qs('#result-words-title').textContent = '틀린 단어';
  qs('#result-words').innerHTML = `
    <div class="wrong-word">
      <p class="wrong-term">${escapeHTML(w.term)}</p>
      <div class="wrong-detail">
        <span>정답 <b>${escapeHTML(w.meaning)}</b></span>
        <span class="my-answer">내 답 <b>${escapeHTML(w.userAnswer || '(입력 없음)')}</b></span>
      </div>
    </div>`;
}

function renderPlayedWords(words) {
  qs('#result-words-title').textContent = '이번 게임 단어';
  qs('#result-words').innerHTML = `
    <ul class="played-list">
      ${words
        .map((w) => `<li><span class="played-term">${escapeHTML(w.term)}</span><span>${escapeHTML(w.meaning)}</span></li>`)
        .join('')}
    </ul>`;
}

function restartGame() {
  goTo('game', { id: result.wordbookId });
}

function goToWordbookList() {
  goTo('list');
}

initGameOverPage();
