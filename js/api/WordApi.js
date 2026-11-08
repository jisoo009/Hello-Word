import { supabase } from '../core/SupabaseClient.js';

const WORD_COLUMNS = 'id, wordbook_id, term, meaning, phonetic, status, created_at';

export async function getWordsByWordbookId(wordbookId) {
  const { data, error } = await supabase
    .from('words')
    .select(WORD_COLUMNS)
    .eq('wordbook_id', wordbookId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function addWord(wordbookId, term, meaning, phonetic = null) {
  const { data, error } = await supabase
    .from('words')
    .insert({
      wordbook_id: wordbookId,
      term: term.trim(),
      meaning: meaning.trim(),
      phonetic: phonetic?.trim() || null,
    })
    .select(WORD_COLUMNS)
    .single();
  if (error) throw error;
  return data;
}

export async function updateWord(wordId, { term, meaning, phonetic }) {
  const patch = {};
  if (term !== undefined) patch.term = term.trim();
  if (meaning !== undefined) patch.meaning = meaning.trim();
  if (phonetic !== undefined) patch.phonetic = phonetic?.trim() || null;

  const { error } = await supabase.from('words').update(patch).eq('id', wordId);
  if (error) throw error;
}

export async function deleteWord(wordId) {
  const { error } = await supabase.from('words').delete().eq('id', wordId);
  if (error) throw error;
}

export async function updateWordStatus(wordId, status) {
  const { error } = await supabase.from('words').update({ status }).eq('id', wordId);
  if (error) throw error;
}

export async function resetWordStatuses(wordbookId) {
  const { error } = await supabase.from('words').update({ status: 'new' }).eq('wordbook_id', wordbookId);
  if (error) throw error;
}
