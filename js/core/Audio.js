import { ASSET_PATH, DEFAULT_SETTINGS } from './Config.js';

export const SOUND_FILES = {
  chant: 'ChantMugunghwa.mp3',
  bgm: 'BgmAmbience.mp3',
  candle: 'SfxCandle.mp3',
  lock: 'SfxLock.mp3',
  correct: 'SfxCorrect.mp3',
  jumpscare: 'SfxJumpscare.mp3',
  click: 'SfxClick.mp3',
};

export const SOUND_CHANNEL = {
  chant: 'bgm',
  bgm: 'bgm',
  candle: 'sfx',
  lock: 'sfx',
  correct: 'sfx',
  jumpscare: 'sfx',
  click: 'sfx',
};

export const soundMap = {};

export const volumeState = {
  bgm: DEFAULT_SETTINGS.bgm_volume / 100,
  sfx: DEFAULT_SETTINGS.sfx_volume / 100,
  bgmOn: DEFAULT_SETTINGS.bgm_on,
  sfxOn: DEFAULT_SETTINGS.sfx_on,
};

function getAudio(name) {
  if (!soundMap[name]) {
    const audio = new Audio(ASSET_PATH.sounds + SOUND_FILES[name]);
    audio.preload = 'auto';
    soundMap[name] = audio;
  }
  return soundMap[name];
}

export function preloadSounds(names = Object.keys(SOUND_FILES)) {
  names.forEach(getAudio);
}

export function applyAudioSettings(settings) {
  volumeState.bgm = (settings.bgm_volume ?? 70) / 100;
  volumeState.sfx = (settings.sfx_volume ?? 85) / 100;
  volumeState.bgmOn = settings.bgm_on ?? true;
  volumeState.sfxOn = settings.sfx_on ?? true;

  Object.entries(soundMap).forEach(([name, audio]) => {
    const channel = SOUND_CHANNEL[name];
    audio.volume = volumeState[channel];
    if (!volumeState[`${channel}On`]) audio.pause();
  });
}

export function playSound(name, { loop = false, rate = 1 } = {}) {
  const channel = SOUND_CHANNEL[name];
  if (!channel || !volumeState[`${channel}On`]) return null;

  const audio = getAudio(name);
  audio.loop = loop;
  audio.playbackRate = rate;
  audio.volume = volumeState[channel];
  audio.currentTime = 0;
  audio.play().catch(() => {});
  return audio;
}

export function stopSound(name) {
  const audio = soundMap[name];
  if (!audio) return;
  audio.pause();
  audio.currentTime = 0;
}

export function stopAllSounds() {
  Object.keys(soundMap).forEach(stopSound);
}

export function getDuration(name) {
  const audio = getAudio(name);
  if (audio.readyState >= 1 && Number.isFinite(audio.duration)) {
    return Promise.resolve(audio.duration);
  }
  return new Promise((resolve) => {
    const done = (value) => {
      audio.removeEventListener('loadedmetadata', onLoad);
      audio.removeEventListener('error', onError);
      resolve(value);
    };
    const onLoad = () => done(audio.duration);
    const onError = () => done(null);
    audio.addEventListener('loadedmetadata', onLoad);
    audio.addEventListener('error', onError);
    setTimeout(() => done(null), 1500);
  });
}
