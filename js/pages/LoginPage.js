import { logIn, redirectIfLoggedIn } from '../core/Auth.js';
import { goTo, getParam } from '../core/Router.js';
import { qs, validateEmail } from '../core/Utils.js';
import { showToast } from '../components/Toast.js';

let isSubmitting = false;

const form = qs('#login-form');
const emailInput = qs('#login-email');
const passwordInput = qs('#login-password');
const errorEl = qs('#login-error');
const submitBtn = qs('#login-submit');

async function initLoginPage() {
  if (await redirectIfLoggedIn()) return;

  if (getParam('signup') === 'done') {
    showToast('가입이 완료됐어요. 로그인해 주세요.', { duration: 2600 });
  }

  form.addEventListener('submit', handleLoginSubmit);
  [emailInput, passwordInput].forEach((input) =>
    input.addEventListener('input', () => showLoginError('')),
  );
  qs('#find-password').addEventListener('click', () => showToast('비밀번호 찾기는 준비 중이에요.'));
  emailInput.focus();
}

async function handleLoginSubmit(e) {
  e.preventDefault();
  if (isSubmitting) return;

  const email = emailInput.value.trim();
  const password = passwordInput.value;
  if (!validateEmail(email)) return showLoginError('이메일 형식을 확인해 주세요.');
  if (!password) return showLoginError('비밀번호를 입력해 주세요.');

  setLoading(true);
  try {
    await logIn(email, password);
    goTo('main');
  } catch (err) {
    showLoginError(err.message);
    setLoading(false);
  }
}

function showLoginError(msg) {
  errorEl.textContent = msg;
  emailInput.classList.toggle('is-error', Boolean(msg));
  passwordInput.classList.toggle('is-error', Boolean(msg));
}

function setLoading(loading) {
  isSubmitting = loading;
  submitBtn.disabled = loading;
  submitBtn.textContent = loading ? '로그인 중…' : '로그인';
}

initLoginPage();
