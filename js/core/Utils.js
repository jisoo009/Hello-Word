export const qs = (selector, root = document) => root.querySelector(selector);
export const qsa = (selector, root = document) => [...root.querySelectorAll(selector)];

export function escapeHTML(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function formatTime(sec) {
  if (sec === null || sec === undefined) return '—';
  const total = Math.max(0, Math.round(sec));
  const m = String(Math.floor(total / 60)).padStart(2, '0');
  const s = String(total % 60).padStart(2, '0');
  return `${m}:${s}`;
}

export function formatDate(iso) {
  if (!iso) return '학습 기록 없음';
  const d = new Date(iso);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

export function normalizeAnswer(str) {
  return String(str ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s.~!?'"·]/g, '');
}

export function splitMeanings(meaning) {
  return String(meaning ?? '')
    .split(/[,/;]/)
    .map((m) => m.trim())
    .filter(Boolean);
}

export function isCorrectAnswer(input, meaning) {
  const answer = normalizeAnswer(input);
  if (!answer) return false;
  return splitMeanings(meaning).some((m) => normalizeAnswer(m) === answer);
}

export function validateEmail(str) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(str).trim());
}

export function validatePassword(str) {
  return /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(String(str));
}

export function debounce(fn, ms = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

export function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

export function percent(part, total) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}
