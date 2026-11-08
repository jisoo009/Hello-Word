import { qs, shuffle } from '../core/Utils.js';
import { ASSET_PATH } from '../core/Config.js';

export const CHANT_CHARS = ['무', '궁', '화', '꽃', '이', '피', '었', '습', '니', '다'];
const WORD_BREAKS = [3, 5];

export const JUMPSCARE_IMAGES = [`${ASSET_PATH.images}JumpscareFace.jpg`];

let candleTimer = null;
let chantTimer = null;

export function renderChantTrack() {
  const track = qs('#chant-track');
  track.innerHTML =
    CHANT_CHARS.map(
      (ch, i) => `<span class="chant-char${WORD_BREAKS.includes(i) ? ' is-gap' : ''}">${ch}</span>`,
    ).join('') + '<span class="chant-line"><span class="chant-line-fill"></span></span>';
}

export function startChant(sec) {
  resetChant();
  const chars = [...document.querySelectorAll('.chant-char')];
  const fill = qs('.chant-line-fill');
  const step = (sec * 1000) / chars.length;
  let lit = 0;

  fill.style.transition = `width ${sec}s linear`;
  requestAnimationFrame(() => {
    fill.style.width = '100%';
  });

  chars[0]?.classList.add('is-lit');
  lit = 1;
  chantTimer = setInterval(() => {
    if (lit >= chars.length) {
      clearInterval(chantTimer);
      return;
    }
    chars[lit].classList.add('is-lit');
    lit += 1;
  }, step);
}

export function resetChant() {
  clearInterval(chantTimer);
  document.querySelectorAll('.chant-char').forEach((el) => el.classList.remove('is-lit'));
  const fill = qs('.chant-line-fill');
  if (fill) {
    fill.style.transition = 'none';
    fill.style.width = '0%';
  }
}

export function lightAllChant() {
  clearInterval(chantTimer);
  document.querySelectorAll('.chant-char').forEach((el) => el.classList.add('is-lit'));
}

export function startCandleTimer(sec, onTick) {
  stopCandleTimer();
  let left = sec;
  const el = qs('#time-left');
  el.textContent = String(left).padStart(2, '0');
  el.parentElement.classList.remove('is-urgent');

  candleTimer = setInterval(() => {
    left -= 1;
    el.textContent = String(Math.max(left, 0)).padStart(2, '0');
    if (left <= 3) el.parentElement.classList.add('is-urgent');
    onTick?.(left);
    if (left <= 0) stopCandleTimer();
  }, 1000);
}

export function stopCandleTimer() {
  clearInterval(candleTimer);
  candleTimer = null;
}

export function renderRoundIndicator(current, total) {
  qs('#round-text').textContent = `${String(current + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;
  qs('#round-candles').innerHTML = Array.from({ length: total }, (_, i) => {
    let cls = '';
    if (i < current) cls = 'is-done';
    else if (i === current) cls = 'is-current';
    return `<span class="round-candle ${cls}"></span>`;
  }).join('');
}

export function renderRoundDots(el, results, total) {
  el.innerHTML = Array.from({ length: total }, (_, i) => {
    const r = results[i];
    return `<span class="round-dot${r === 'correct' ? ' is-correct' : ''}${r === 'wrong' ? ' is-wrong' : ''}"></span>`;
  }).join('');
}

export function animateLockBar(ms) {
  const bar = qs('#lock-bar');
  bar.style.transition = 'none';
  bar.style.width = '0%';
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      bar.style.transition = `width ${ms}ms linear`;
      bar.style.width = '100%';
    });
  });
}

export function showJumpscare() {
  const [src] = shuffle(JUMPSCARE_IMAGES);
  qs('#jumpscare-img').src = src;
  qs('#jumpscare-layer').classList.add('is-active');
}
