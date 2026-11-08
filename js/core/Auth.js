import { supabase } from './SupabaseClient.js';
import { goTo } from './Router.js';
import { getProfile } from '../api/ProfileApi.js';

export let currentUser = null;
export let currentProfile = null;

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    goTo('login');
    throw new Error('로그인이 필요해요.');
  }
  currentUser = { id: session.user.id, email: session.user.email };

  if (!currentProfile) {
    const profile = await getProfile(currentUser.id);
    currentProfile = profile ?? {
      id: currentUser.id,
      nickname: session.user.user_metadata?.nickname ?? '사용자',
      email: currentUser.email,
    };
  }
  return { user: currentUser, profile: currentProfile };
}

export async function redirectIfLoggedIn() {
  const session = await getSession();
  if (session) {
    goTo('main');
    return true;
  }
  return false;
}

export async function logIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) throw new Error(toKoreanAuthError(error));
  return data;
}

export async function signUp(email, password, nickname) {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: { data: { nickname: nickname.trim() } },
  });
  if (error) throw new Error(toKoreanAuthError(error));

  if (data.session) await supabase.auth.signOut();
}

export async function logOut() {
  await supabase.auth.signOut();
  currentUser = null;
  currentProfile = null;
  goTo('login');
}

export function toKoreanAuthError(error) {
  const msg = error?.message ?? '';
  if (msg.includes('Invalid login credentials')) return '이메일 또는 비밀번호가 올바르지 않아요.';
  if (msg.includes('User already registered')) return '이미 가입된 이메일이에요.';
  if (msg.includes('Database error saving new user')) return '이미 사용 중인 닉네임이에요.';
  if (msg.includes('Email not confirmed')) return '이메일 인증을 먼저 완료해 주세요.';
  if (msg.includes('Password should be')) return '비밀번호가 너무 짧아요.';
  if (msg.includes('For security purposes') || msg.includes('rate limit')) return '잠시 후 다시 시도해 주세요.';
  return '문제가 생겼어요. 잠시 후 다시 시도해 주세요.';
}
