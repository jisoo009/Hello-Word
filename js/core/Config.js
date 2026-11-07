export const SUPABASE_URL = 'https://frryedsikjtkfcphiwbh.supabase.co';   // 대시보드 → Project Settings → API
export const SUPABASE_ANON_KEY = 'sb_publishable_Giw6awa-VhMBiWw4X-xC_w_eXYanQRo';                // anon public 키 (service_role 키 절대 X)

export const TOTAL_ROUNDS = 4;
export const DEFAULT_TIME_LIMIT = 10;
export const MIN_TIME_LIMIT = 5;
export const MAX_TIME_LIMIT = 30;
export const WHITE_LOCK_MS = 2000;
export const CORRECT_DELAY_MS = 3000;
export const JUMPSCARE_MS = 1500;
export const START_REDIRECT_MS = 3000;

export const DEFAULT_SETTINGS = { time_limit: 10, bgm_volume: 70, sfx_volume: 85, bgm_on: true, sfx_on: true };
export const WORD_STATUS = { NEW: 'new', KNOWN: 'memorized', UNKNOWN: 'unknown' };
export const STORAGE_KEYS = { lastResult: 'hw:lastResult' };