import { getWordbook, createWordbook, updateWordbookTitle, deleteWordbook } from '../api/WordbookApi.js';
import { getWordsByWordbookId, addWord, updateWord, deleteWord } from '../api/WordApi.js';
import { escapeHTML, qs } from '../core/Utils.js';
import { ASSET_PATH, TOTAL_ROUNDS } from '../core/Config.js';
import { currentUser } from '../core/Auth.js';
import { goTo } from '../core/Router.js';
import { showToast } from './Toast.js';

let modalWordbook = null;
let modalWords = [];
let editingWordId = null;
let onChangeCallback = null;
let rootEl = null;

const icon = (name) => `<img class="icon icon-sm" src="${ASSET_PATH.icons}${name}.svg" alt="">`;

function getRoot() {
  let root = document.getElementById('modal-root');
  if (!root) {
    root = document.createElement('div');
    root.id = 'modal-root';
    document.body.appendChild(root);
  }
  return root;
}

function notifyChange() {
  onChangeCallback?.({ wordbook: modalWordbook, words: modalWords });
}

function onKeydown(e) {
  if (e.key !== 'Escape') return;
  if (editingWordId) cancelEditWord();
  else closeWordbookModal();
}

export async function openWordbookModal(wordbookId, { onChange } = {}) {
  onChangeCallback = onChange ?? null;
  editingWordId = null;

  const [wordbook, words] = await Promise.all([getWordbook(wordbookId), getWordsByWordbookId(wordbookId)]);
  if (!wordbook) {
    showToast('단어장을 찾을 수 없어요.', { type: 'error' });
    return;
  }
  modalWordbook = { id: wordbook.id, title: wordbook.title };
  modalWords = words;

  rootEl = getRoot();
  rootEl.innerHTML = `
    <div class="modal-overlay" data-action="overlay">
      <div class="modal word-modal" role="dialog" aria-modal="true">
        <div class="word-modal-head">
          <div class="word-modal-title-wrap">
            <h2 id="modal-title" class="word-modal-title"></h2>
            <span id="modal-count" class="badge"></span>
            <button id="modal-edit-title" type="button" class="icon-btn" data-action="edit-title" title="이름 수정">${icon('IconEdit')}</button>
          </div>
          <button id="modal-close" type="button" class="icon-btn" data-action="close" title="닫기">
            <img class="icon icon-lg" src="${ASSET_PATH.icons}IconClose.svg" alt="">
          </button>
        </div>

        <form id="word-add-form" class="word-add-form" autocomplete="off">
          <input id="word-add-term" class="input" placeholder="영단어" maxlength="60" />
          <input id="word-add-meaning" class="input" placeholder="뜻을 입력하세요" maxlength="100" />
          <button type="submit" class="btn btn-wax">추가</button>
        </form>

        <div class="word-table-head">
          <span>#</span><span>영단어</span><span>뜻</span><span></span>
        </div>
        <ul id="modal-word-list" class="word-table-body"></ul>

        <div class="word-modal-foot">
          <button id="modal-delete-wordbook" type="button" class="btn-danger-text" data-action="delete-wordbook">단어장 삭제</button>
          <button id="modal-start-game" type="button" class="btn btn-wax btn-lg" data-action="start-game">게임 시작</button>
        </div>
      </div>
    </div>`;

  renderModalHeader();
  renderModalWords();

  qs('#word-add-form', rootEl).addEventListener('submit', handleAddWord);
  rootEl.querySelector('.modal-overlay').addEventListener('click', handleModalClick);
  rootEl.querySelector('#modal-word-list').addEventListener('keydown', handleEditKeydown);
  document.addEventListener('keydown', onKeydown);
  qs('#word-add-term', rootEl).focus();
}

export function closeWordbookModal() {
  if (!rootEl) return;
  rootEl.innerHTML = '';
  rootEl = null;
  editingWordId = null;
  document.removeEventListener('keydown', onKeydown);
}

function renderModalHeader() {
  qs('#modal-title', rootEl).textContent = modalWordbook.title;
  qs('#modal-count', rootEl).textContent = `${modalWords.length}단어`;
}

export function renderModalWords() {
  const list = qs('#modal-word-list', rootEl);
  if (modalWords.length === 0) {
    list.innerHTML = `<li class="word-empty">아직 단어가 없어요. 위에서 첫 단어를 추가해 보세요.</li>`;
    return;
  }

  list.innerHTML = modalWords
    .map((w, i) => {
      if (w.id === editingWordId) {
        return `
        <li class="word-row is-editing" data-id="${w.id}">
          <span class="word-no">${i + 1}</span>
          <input class="input input-sm" data-field="term" value="${escapeHTML(w.term)}" />
          <input class="input input-sm" data-field="meaning" value="${escapeHTML(w.meaning)}" />
          <div class="word-row-actions">
            <button type="button" class="btn-text is-wax" data-action="save-edit">저장</button>
            <button type="button" class="btn-text" data-action="cancel-edit">취소</button>
          </div>
        </li>`;
      }
      return `
        <li class="word-row" data-id="${w.id}">
          <span class="word-no">${i + 1}</span>
          <span class="word-term">${escapeHTML(w.term)}</span>
          <span class="word-meaning">${escapeHTML(w.meaning)}</span>
          <div class="word-row-actions">
            <button type="button" class="icon-btn" data-action="edit-word" title="수정">${icon('IconEdit')}</button>
            <button type="button" class="icon-btn" data-action="delete-word" title="삭제">${icon('IconTrash')}</button>
          </div>
        </li>`;
    })
    .join('');
}

async function handleModalClick(e) {
  if (e.target.dataset.action === 'overlay') {
    closeWordbookModal();
    return;
  }
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const wordId = btn.closest('.word-row')?.dataset.id;

  switch (btn.dataset.action) {
    case 'close':
      closeWordbookModal();
      break;
    case 'edit-title':
      await handleEditTitle();
      break;
    case 'edit-word':
      startEditWord(wordId);
      break;
    case 'save-edit':
      await saveEditWord(wordId);
      break;
    case 'cancel-edit':
      cancelEditWord();
      break;
    case 'delete-word':
      await handleDeleteWord(wordId);
      break;
    case 'delete-wordbook':
      await handleDeleteWordbook();
      break;
    case 'start-game':
      handleModalStartGame();
      break;
    default:
  }
}

async function handleAddWord(e) {
  e.preventDefault();
  const termInput = qs('#word-add-term', rootEl);
  const meaningInput = qs('#word-add-meaning', rootEl);
  const term = termInput.value.trim();
  const meaning = meaningInput.value.trim();

  if (!term || !meaning) {
    showToast('영단어와 뜻을 모두 입력해 주세요.', { type: 'error' });
    (term ? meaningInput : termInput).focus();
    return;
  }

  try {
    const word = await addWord(modalWordbook.id, term, meaning);
    modalWords.push(word);
    termInput.value = '';
    meaningInput.value = '';
    renderModalHeader();
    renderModalWords();
    qs('#modal-word-list', rootEl).lastElementChild?.scrollIntoView({ block: 'nearest' });
    termInput.focus();
    notifyChange();
  } catch (err) {
    console.error(err);
    showToast('단어를 추가하지 못했어요.', { type: 'error' });
  }
}

export function startEditWord(wordId) {
  editingWordId = wordId;
  renderModalWords();
  qs(`.word-row[data-id="${wordId}"] input`, rootEl)?.focus();
}

export async function saveEditWord(wordId) {
  const row = qs(`.word-row[data-id="${wordId}"]`, rootEl);
  const term = qs('[data-field="term"]', row).value.trim();
  const meaning = qs('[data-field="meaning"]', row).value.trim();
  if (!term || !meaning) {
    showToast('영단어와 뜻을 모두 입력해 주세요.', { type: 'error' });
    return;
  }
  try {
    await updateWord(wordId, { term, meaning });
    const word = modalWords.find((w) => w.id === wordId);
    Object.assign(word, { term, meaning });
    editingWordId = null;
    renderModalWords();
    notifyChange();
  } catch (err) {
    console.error(err);
    showToast('수정하지 못했어요.', { type: 'error' });
  }
}

export function cancelEditWord() {
  editingWordId = null;
  renderModalWords();
}

function handleEditKeydown(e) {
  if (!editingWordId || e.target.tagName !== 'INPUT') return;
  if (e.key === 'Enter') {
    e.preventDefault();
    saveEditWord(editingWordId);
  }
}

async function handleDeleteWord(wordId) {
  const word = modalWords.find((w) => w.id === wordId);
  if (!confirm(`'${word.term}' 단어를 삭제할까요?`)) return;
  try {
    await deleteWord(wordId);
    modalWords = modalWords.filter((w) => w.id !== wordId);
    renderModalHeader();
    renderModalWords();
    notifyChange();
  } catch (err) {
    console.error(err);
    showToast('삭제하지 못했어요.', { type: 'error' });
  }
}

async function handleEditTitle() {
  const title = await openPromptModal({
    title: '단어장 이름 수정',
    value: modalWordbook.title,
    confirmText: '저장',
  });
  if (!title || title === modalWordbook.title) return;
  try {
    await updateWordbookTitle(modalWordbook.id, title);
    modalWordbook.title = title;
    renderModalHeader();
    notifyChange();
    showToast('이름을 바꿨어요.');
  } catch (err) {
    console.error(err);
    showToast('이름을 바꾸지 못했어요.', { type: 'error' });
  }
}

async function handleDeleteWordbook() {
  if (!confirm(`'${modalWordbook.title}' 단어장을 삭제할까요?\n단어와 게임 기록도 모두 지워져요.`)) return;
  try {
    await deleteWordbook(modalWordbook.id);
    closeWordbookModal();
    goTo('list');
  } catch (err) {
    console.error(err);
    showToast('삭제하지 못했어요.', { type: 'error' });
  }
}

function handleModalStartGame() {
  if (modalWords.length < TOTAL_ROUNDS) {
    showToast(`게임을 하려면 단어가 ${TOTAL_ROUNDS}개 이상 필요해요.`, { type: 'error' });
    return;
  }
  goTo('game', { id: modalWordbook.id });
}

export function openPromptModal({ title, value = '', placeholder = '', confirmText = '확인' }) {
  return new Promise((resolve) => {
    const wrap = document.createElement('div');
    wrap.innerHTML = `
      <div class="modal-overlay" data-action="cancel">
        <form class="modal modal-sm" autocomplete="off">
          <h2 class="modal-title">${escapeHTML(title)}</h2>
          <input class="input" maxlength="40" placeholder="${escapeHTML(placeholder)}" value="${escapeHTML(value)}" />
          <div class="modal-actions">
            <button type="button" class="btn btn-ghost" data-action="cancel">취소</button>
            <button type="submit" class="btn btn-wax">${escapeHTML(confirmText)}</button>
          </div>
        </form>
      </div>`;
    document.body.appendChild(wrap);

    const input = qs('input', wrap);
    input.focus();
    input.select();

    const finish = (result) => {
      document.removeEventListener('keydown', onEsc, true);
      wrap.remove();
      resolve(result);
    };
    const onEsc = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        finish(null);
      }
    };
    document.addEventListener('keydown', onEsc, true);

    wrap.addEventListener('click', (e) => {
      if (e.target.dataset.action === 'cancel') finish(null);
    });
    qs('form', wrap).addEventListener('submit', (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) {
        input.focus();
        return;
      }
      finish(text);
    });
  });
}

export async function openCreateWordbookModal() {
  const title = await openPromptModal({
    title: '새 단어장',
    placeholder: '예) 수능 필수 영단어',
    confirmText: '만들기',
  });
  if (!title) return null;
  try {
    const { id } = await createWordbook(currentUser.id, title);
    return id;
  } catch (err) {
    console.error(err);
    showToast('단어장을 만들지 못했어요.', { type: 'error' });
    return null;
  }
}
