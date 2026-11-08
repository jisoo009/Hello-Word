export const SUPABASE_URL = 'https://YOUR-PROJECT-ID.supabase.co';
export const SUPABASE_ANON_KEY = 'YOUR-ANON-KEY';

export const TOTAL_ROUNDS = 4;
export const DEFAULT_TIME_LIMIT = 10;
export const MIN_TIME_LIMIT = 5;
export const MAX_TIME_LIMIT = 30;
export const WHITE_LOCK_MS = 2000;
export const CORRECT_DELAY_MS = 3000;
export const JUMPSCARE_MS = 1500;
export const START_REDIRECT_MS = 3000;

export const DEFAULT_SETTINGS = {
  time_limit: DEFAULT_TIME_LIMIT,
  bgm_volume: 70,
  sfx_volume: 85,
  bgm_on: true,
  sfx_on: true,
};

export const WORD_STATUS = {
  NEW: 'new',
  KNOWN: 'memorized',
  UNKNOWN: 'unknown',
};

export const STORAGE_KEYS = {
  lastResult: 'hw:lastResult',
};

export const ASSET_PATH = {
  icons: '../assets/icons/',
  images: '../assets/images/',
  logo: '../assets/logo/',
  sounds: '../assets/sounds/',
};
