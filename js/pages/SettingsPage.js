import { initLayout } from '../core/Layout.js';
import { loadSettings, saveSettings } from '../api/SettingsApi.js';
import { applyAudioSettings, playSound } from '../core/Audio.js';
import { showToast } from '../components/Toast.js';
import { qs, clamp } from '../core/Utils.js';
import { MIN_TIME_LIMIT, MAX_TIME_LIMIT, DEFAULT_SETTINGS } from '../core/Config.js';

let userId = null;
let savedSettings = { ...DEFAULT_SETTINGS };
let draftSettings = { ...DEFAULT_SETTINGS };

async function initSettingsPage() {
  const { user } = await initLayout('settings');
  userId = user.id;

  qs('#time-minus').addEventListener('click', () => changeTimeLimit(-1));
  qs('#time-plus').addEventListener('click', () => changeTimeLimit(1));
  qs('#time-range').addEventListener('input', handleTimeRange);
  qs('#bgm-range').addEventListener('input', (e) => handleVolumeInput('bgm', e));
  qs('#sfx-range').addEventListener('input', (e) => handleVolumeInput('sfx', e));
  qs('#sfx-range').addEventListener('change', () => playSound('click'));
  qs('#bgm-toggle').addEventListener('click', () => toggleSound('bgm'));
  qs('#sfx-toggle').addEventListener('click', () => toggleSound('sfx'));
  qs('#settings-cancel').addEventListener('click', handleCancel);
  qs('#settings-save').addEventListener('click', handleSave);

  try {
    savedSettings = await loadSettings(userId);
  } catch (err) {
    console.error(err);
    showToast('설정을 불러오지 못했어요. 기본값으로 보여줄게요.', { type: 'error' });
  }
  draftSettings = { ...savedSettings };
  applyAudioSettings(draftSettings);
  renderSettings();
}

function setRangeFill(input) {
  const { min, max, value } = input;
  input.style.setProperty('--fill', `${((value - min) / (max - min)) * 100}%`);
}

function renderSettings() {
  const d = draftSettings;
  qs('#time-value').textContent = d.time_limit;
  qs('#time-range').value = d.time_limit;

  qs('#bgm-range').value = d.bgm_volume;
  qs('#bgm-value').textContent = d.bgm_volume;
  qs('#bgm-range').disabled = !d.bgm_on;
  qs('#bgm-toggle').classList.toggle('is-on', d.bgm_on);

  qs('#sfx-range').value = d.sfx_volume;
  qs('#sfx-value').textContent = d.sfx_volume;
  qs('#sfx-range').disabled = !d.sfx_on;
  qs('#sfx-toggle').classList.toggle('is-on', d.sfx_on);

  ['#time-range', '#bgm-range', '#sfx-range'].forEach((sel) => setRangeFill(qs(sel)));
}

function changeTimeLimit(delta) {
  draftSettings.time_limit = clamp(draftSettings.time_limit + delta, MIN_TIME_LIMIT, MAX_TIME_LIMIT);
  renderSettings();
}

function handleTimeRange(e) {
  draftSettings.time_limit = Number(e.target.value);
  renderSettings();
}

function handleVolumeInput(channel, e) {
  draftSettings[`${channel}_volume`] = Number(e.target.value);
  applyAudioSettings(draftSettings);
  renderSettings();
}

function toggleSound(channel) {
  draftSettings[`${channel}_on`] = !draftSettings[`${channel}_on`];
  applyAudioSettings(draftSettings);
  renderSettings();
}

function handleCancel() {
  draftSettings = { ...savedSettings };
  applyAudioSettings(draftSettings);
  renderSettings();
  showToast('변경 사항을 되돌렸어요.');
}

async function handleSave() {
  const btn = qs('#settings-save');
  btn.disabled = true;
  try {
    await saveSettings(userId, draftSettings);
    savedSettings = { ...draftSettings };
    applyAudioSettings(savedSettings);
    showToast('설정이 저장되었어요.');
  } catch (err) {
    console.error(err);
    showToast('저장하지 못했어요.', { type: 'error' });
  } finally {
    btn.disabled = false;
  }
}

initSettingsPage();
