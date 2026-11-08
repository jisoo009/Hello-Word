import {
  TOTAL_ROUNDS,
  WHITE_LOCK_MS,
  CORRECT_DELAY_MS,
  JUMPSCARE_MS,
  STORAGE_KEYS,
} from '../core/Config.js';
import { requireAuth } from '../core/Auth.js';
import { goTo, requireParam } from '../core/Router.js';
import { qs, shuffle, isCorrectAnswer } from '../core/Utils.js';
import { getWordbook } from '../api/WordbookApi.js';
import { getWordsByWordbookId } from '../api/WordApi.js';
import { loadSettings } from '../api/SettingsApi.js';
import { applyAudioSettings, preloadSounds, playSound, stopSound, stopAllSounds, getDuration } from '../core/Audio.js';
import {
  renderChantTrack,
  startChant,
  resetChant,
  lightAllChant,
  startCandleTimer,
  stopCandleTimer,
  renderRoundIndicator,
  renderRoundDots,
  animateLockBar,
  showJumpscare,
} from '../game/GameEffects.js';

const wordbookId = requireParam('id');

let gameState = 'ready';
let wordbook = null;
let words = [];
let roundWords = [];
let currentRound = 0;
let currentWord = null;
let timeLimit = 10;
let isInputLocked = true;
let correctCount = 0;
let gameStartTime = 0;
let playedWords = [];
let roundResults = [];
let timers = [];

const root = qs('#game-root');
const answerInput = qs('#answer-input');

async function initGamePage() {
  const { user } = await requireAuth();

  qs('#ready-cancel').addEventListener('click', handleReadyCancel);
  qs('#ready-start').addEventListener('click', startGame);
  answerInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') e.preventDefault();
  });

  try {
    const [wb, list, settings] = await Promise.all([
      getWordbook(wordbookId),
      getWordsByWordbookId(wordbookId),
      loadSettings(user.id),
    ]);
    if (!wb) {
      goTo('list');
      return;
    }
    wordbook = wb;
    words = list;
    timeLimit = settings.time_limit;
    applyAudioSettings(settings);
  } catch (err) {
    console.error(err);
    qs('#ready-title').textContent = '불러오지 못했어요';
    return;
  }

  preloadSounds();
  renderChantTrack();
  renderReady();
}

function renderReady() {
  qs('#ready-title').textContent = wordbook.title;
  qs('#ready-time').textContent = `제한 시간 ${timeLimit}초`;
  qs('#ready-count').textContent = `${words.length}단어`;

  const enough = words.length >= TOTAL_ROUNDS;
  qs('#ready-start').disabled = !enough;
  const warning = qs('#ready-warning');
  warning.classList.toggle('is-hidden', enough);
  warning.textContent = enough ? '' : `단어가 ${TOTAL_ROUNDS}개 이상 있어야 게임을 할 수 있어요.`;
  if (enough) qs('#ready-start').focus();
}

function setGameState(state) {
  gameState = state;
  root.dataset.state = state;
}

function later(fn, ms) {
  const id = setTimeout(fn, ms);
  timers.push(id);
  return id;
}

function startGame() {
  roundWords = shuffle(words).slice(0, TOTAL_ROUNDS);
  currentRound = 0;
  correctCount = 0;
  playedWords = [];
  roundResults = [];
  gameStartTime = Date.now();
  playSound('bgm', { loop: true });
  startRound();
}

function startRound() {
  currentWord = roundWords[currentRound];
  renderRoundIndicator(currentRound, TOTAL_ROUNDS);
  startDarkPhase();
}

function startDarkPhase() {
  setGameState('dark');
  isInputLocked = false;
  answerInput.disabled = false;
  answerInput.value = '';
  qs('#word-term').textContent = currentWord.term;
  later(() => answerInput.focus(), 50);

  playSound('candle', { loop: true });
  startCandleTimer(timeLimit);
  startChant(timeLimit);
  playGhostVoice(startWhitePhase);
}

async function playGhostVoice(onEnd) {
  later(onEnd, timeLimit * 1000);
  const duration = await getDuration('chant');
  if (gameState !== 'dark') return;
  const rate = duration ? Math.min(2, Math.max(0.5, duration / timeLimit)) : 1;
  playSound('chant', { rate });
}

function startWhitePhase() {
  if (gameState !== 'dark') return;
  setGameState('white');
  isInputLocked = true;
  answerInput.disabled = true;
  stopCandleTimer();
  lightAllChant();
  stopSound('candle');
  stopSound('chant');
  playSound('lock');
  animateLockBar(WHITE_LOCK_MS);
  later(judgeRound, WHITE_LOCK_MS);
}

function checkAnswer(userInput) {
  return isCorrectAnswer(userInput, currentWord.meaning);
}

function judgeRound() {
  const userAnswer = answerInput.value.trim();
  const isCorrect = checkAnswer(userAnswer);
  playedWords.push({ term: currentWord.term, meaning: currentWord.meaning, userAnswer, isCorrect });
  roundResults.push(isCorrect ? 'correct' : 'wrong');

  if (isCorrect) handleCorrect();
  else triggerJumpScare(userAnswer);
}

function handleCorrect() {
  correctCount += 1;
  setGameState('correct');
  playSound('correct');
  resetChant();

  qs('#correct-term').textContent = currentWord.term;
  qs('#correct-meaning').textContent = currentWord.meaning;
  renderRoundDots(qs('#correct-dots'), roundResults, TOTAL_ROUNDS);

  const isLast = currentRound + 1 >= TOTAL_ROUNDS;
  const countdownEl = qs('#correct-countdown');
  countdownEl.parentElement.innerHTML = isLast
    ? '<span id="correct-countdown">3</span>초 후 결과 화면'
    : '<span id="correct-countdown">3</span>초 후 다음 라운드';

  let left = Math.round(CORRECT_DELAY_MS / 1000);
  const tick = setInterval(() => {
    left -= 1;
    const el = qs('#correct-countdown');
    if (el) el.textContent = Math.max(left, 0);
    if (left <= 0) clearInterval(tick);
  }, 1000);
  timers.push(tick);

  later(nextRound, CORRECT_DELAY_MS);
}

function nextRound() {
  currentRound += 1;
  if (currentRound < TOTAL_ROUNDS) startRound();
  else endGame(true);
}

function triggerJumpScare(userAnswer) {
  setGameState('jumpscare');
  stopAllSounds();
  playSound('jumpscare');
  showJumpscare();
  later(() => endGame(false, userAnswer), JUMPSCARE_MS);
}

function endGame(isCleared, userAnswer = '') {
  clearAllTimers();
  stopAllSounds();

  const result = {
    wordbookId,
    wordbookTitle: wordbook.title,
    isCleared,
    correctCount,
    totalRounds: TOTAL_ROUNDS,
    survivalTime: Math.round((Date.now() - gameStartTime) / 1000),
    failedRound: isCleared ? null : currentRound + 1,
    wrongWord: isCleared ? null : { term: currentWord.term, meaning: currentWord.meaning, userAnswer },
    playedWords,
    roundResults,
    saved: false,
  };
  sessionStorage.setItem(STORAGE_KEYS.lastResult, JSON.stringify(result));
  goTo('gameOver', { id: wordbookId });
}

function clearAllTimers() {
  timers.forEach((id) => {
    clearTimeout(id);
    clearInterval(id);
  });
  timers = [];
  stopCandleTimer();
}

function handleReadyCancel() {
  if (history.length > 1) history.back();
  else goTo('study', { id: wordbookId });
}

initGamePage();
