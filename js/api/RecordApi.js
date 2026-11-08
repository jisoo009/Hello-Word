import { supabase } from '../core/SupabaseClient.js';
import { getWordbook } from './WordbookApi.js';

export async function saveGameRecord({ userId, wordbookId, correctCount, survivalTime, isCleared }) {
  const { data, error } = await supabase
    .from('game_records')
    .insert({
      user_id: userId,
      wordbook_id: wordbookId,
      correct_count: correctCount,
      survival_time: survivalTime,
      is_cleared: isCleared,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getBestSurvivalTime(userId, wordbookId) {
  const { data, error } = await supabase
    .from('game_records')
    .select('survival_time')
    .eq('user_id', userId)
    .eq('wordbook_id', wordbookId)
    .order('survival_time', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.survival_time ?? null;
}

export async function getRecentSummary(userId) {
  const { data, error } = await supabase
    .from('game_records')
    .select('wordbook_id, played_at')
    .eq('user_id', userId)
    .order('played_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return getWordbook(data.wordbook_id);
}
