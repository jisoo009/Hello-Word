import { supabase } from '../core/SupabaseClient.js';
import { DEFAULT_SETTINGS } from '../core/Config.js';

export async function loadSettings(userId) {
  const { data, error } = await supabase
    .from('game_settings')
    .select('time_limit, bgm_volume, sfx_volume, bgm_on, sfx_on')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return { ...DEFAULT_SETTINGS, ...(data ?? {}) };
}

export async function saveSettings(userId, settings) {
  const { error } = await supabase.from('game_settings').upsert(
    {
      user_id: userId,
      time_limit: settings.time_limit,
      bgm_volume: settings.bgm_volume,
      sfx_volume: settings.sfx_volume,
      bgm_on: settings.bgm_on,
      sfx_on: settings.sfx_on,
    },
    { onConflict: 'user_id' },
  );
  if (error) throw error;
}
