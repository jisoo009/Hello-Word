import { supabase } from '../core/SupabaseClient.js';

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, nickname, email')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function isEmailTaken(email) {
  const { data, error } = await supabase.rpc('is_email_taken', { p_email: email.trim() });
  if (error) throw error;
  return data === true;
}

export async function isNicknameTaken(nickname) {
  const { data, error } = await supabase.rpc('is_nickname_taken', { p_nickname: nickname.trim() });
  if (error) throw error;
  return data === true;
}
