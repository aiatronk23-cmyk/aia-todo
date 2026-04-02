import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://your-supabase-url.supabase.co';
const supabaseAnonKey = 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const getTasks = async () => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*');
  if (error) throw error;
  return data;
};

export const createTask = async (task) => {
  const { data, error } = await supabase
    .from('tasks')
    .insert([task]);
  if (error) throw error;
  return data;
};

export const updateTask = async (id, updates) => {
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .match({ id });
  if (error) throw error;
  return data;
};

export const deleteTask = async (id) => {
  const { data, error } = await supabase
    .from('tasks')
    .delete()
    .match({ id });
  if (error) throw error;
  return data;
};