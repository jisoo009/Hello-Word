import { supabase } from '../core/SupabaseClient.js';

const SUMMARY_COLUMNS = 'id, user_id, title, word_count, memorized_count, best_time, last_studied_at, created_at';

export async function getWordbookList(userId, sort = 'recent') {
  let query = supabase.from('wordbook_summary').select(SUMMARY_COLUMNS).eq('user_id', userId);

  if (sort === 'name') {
    query = query.order('title', { ascending: true });
  } else {
    query = query
      .order('last_studied_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getWordbook(wordbookId) {
  const { data, error } = await supabase
    .from('wordbook_summary')
    .select(SUMMARY_COLUMNS)
    .eq('id', wordbookId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createWordbook(userId, title) {
  const { data, error } = await supabase
    .from('wordbooks')
    .insert({ user_id: userId, title: title.trim() })
    .select('id')
    .single();
  if (error) throw error;
  return data;
}

export async function updateWordbookTitle(wordbookId, title) {
  const { error } = await supabase
    .from('wordbooks')
    .update({ title: title.trim(), updated_at: new Date().toISOString() })
    .eq('id', wordbookId);
  if (error) throw error;
}

export async function deleteWordbook(wordbookId) {
  const { error } = await supabase.from('wordbooks').delete().eq('id', wordbookId);
  if (error) throw error;
}

export async function duplicateWordbook(wordbookId) {
  const { data: original, error: e1 } = await supabase
    .from('wordbooks')
    .select('user_id, title')
    .eq('id', wordbookId)
    .single();
  if (e1) throw e1;

  const { data: words, error: e2 } = await supabase
    .from('words')
    .select('term, meaning, phonetic')
    .eq('wordbook_id', wordbookId)
    .order('created_at', { ascending: true });
  if (e2) throw e2;

  const { data: copy, error: e3 } = await supabase
    .from('wordbooks')
    .insert({ user_id: original.user_id, title: `${original.title} (복사본)` })
    .select('id')
    .single();
  if (e3) throw e3;

  if (words.length > 0) {
    const rows = words.map((w) => ({ ...w, wordbook_id: copy.id, status: 'new' }));
    const { error: e4 } = await supabase.from('words').insert(rows);
    if (e4) throw e4;
  }
  return { newId: copy.id };
}

export async function touchWordbook(wordbookId) {
  const { error } = await supabase
    .from('wordbooks')
    .update({ last_studied_at: new Date().toISOString() })
    .eq('id', wordbookId);
  if (error) throw error;
}
