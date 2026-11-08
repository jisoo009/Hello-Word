import { signUp, toKoreanAuthError } from '../core/Auth.js';
import { isEmailTaken, isNicknameTaken } from '../api/ProfileApi.js';
import { goTo } from '../core/Router.js';
import { qs, debounce, validateEmail, validatePassword } from '../core/Utils.js';

const formState = { emailOk: false, passwordOk: false, nicknameOk: false };

const form = qs('#signup-form');
const emailInput = qs('#signup-email');
const emailMsg = qs('#signup-email-msg');
const passwordInput = qs('#signup-password');
const passwordMsg = qs('#signup-password-msg');
const nicknameInput = qs('#signup-nickname');
const nicknameMsg = qs('#signup-nickname-msg');
const submitBtn = qs('#signup-submit');

function initSignUpPage() {
  emailInput.addEventListener('input', () => {
    formState.emailOk = false;
    updateSubmitState();
    handleEmailInput();
  });
  passwordInput.addEventListener('input', handlePasswordInput);
  nicknameInput.addEventListener('input', () => {
    formState.nicknameOk = false;
    updateSubmitState();
    handleNicknameInput();
  });
  form.addEventListener('submit', handleSignUpSubmit);
  emailInput.focus();
}

const handleEmailInput = debounce(async () => {
  const email = emailInput.value.trim();
  if (!email) return setFieldMessage(emailInput, emailMsg, '', '');
  if (!validateEmail(email)) return setFieldMessage(emailInput, emailMsg, '이메일 형식을 확인해 주세요.', 'error');

  try {
    const taken = await isEmailTaken(email);
    if (email !== emailInput.value.trim()) return;
    formState.emailOk = !taken;
    setFieldMessage(
      emailInput,
      emailMsg,
      taken ? '이미 가입된 이메일이에요.' : '사용할 수 있는 이메일이에요.',
      taken ? 'error' : 'ok',
    );
  } catch (err) {
    console.error(err);
    setFieldMessage(emailInput, emailMsg, '중복 확인에 실패했어요. 잠시 후 다시 입력해 주세요.', 'error');
  }
  updateSubmitState();
}, 400);

function handlePasswordInput() {
  const ok = validatePassword(passwordInput.value);
  formState.passwordOk = ok;
  if (!passwordInput.value) {
    setFieldMessage(passwordInput, passwordMsg, '8자 이상, 영문과 숫자를 함께 입력해 주세요.', '');
  } else {
    setFieldMessage(
      passwordInput,
      passwordMsg,
      ok ? '안전한 비밀번호예요.' : '8자 이상, 영문과 숫자를 함께 입력해 주세요.',
      ok ? 'ok' : 'error',
    );
  }
  updateSubmitState();
}

const handleNicknameInput = debounce(async () => {
  const nickname = nicknameInput.value.trim();
  if (!nickname) return setFieldMessage(nicknameInput, nicknameMsg, '', '');
  if (nickname.length < 2 || nickname.length > 10) {
    return setFieldMessage(nicknameInput, nicknameMsg, '닉네임은 2~10자로 입력해 주세요.', 'error');
  }

  try {
    const taken = await isNicknameTaken(nickname);
    if (nickname !== nicknameInput.value.trim()) return;
    formState.nicknameOk = !taken;
    setFieldMessage(
      nicknameInput,
      nicknameMsg,
      taken ? '이미 사용 중인 닉네임이에요.' : '사용할 수 있는 닉네임이에요.',
      taken ? 'error' : 'ok',
    );
  } catch (err) {
    console.error(err);
    setFieldMessage(nicknameInput, nicknameMsg, '중복 확인에 실패했어요.', 'error');
  }
  updateSubmitState();
}, 400);

function setFieldMessage(input, msgEl, text, type) {
  msgEl.textContent = text;
  msgEl.classList.toggle('is-ok', type === 'ok');
  msgEl.classList.toggle('is-error', type === 'error');
  input.classList.toggle('is-error', type === 'error');
}

function updateSubmitState() {
  submitBtn.disabled = !(formState.emailOk && formState.passwordOk && formState.nicknameOk);
}

async function handleSignUpSubmit(e) {
  e.preventDefault();
  if (submitBtn.disabled) return;

  submitBtn.disabled = true;
  submitBtn.textContent = '가입 중…';
  try {
    await signUp(emailInput.value, passwordInput.value, nicknameInput.value);
    goTo('login', { signup: 'done' });
  } catch (err) {
    setFieldMessage(nicknameInput, nicknameMsg, err.message || toKoreanAuthError(err), 'error');
    submitBtn.textContent = '가입하기';
    updateSubmitState();
  }
}

initSignUpPage();
