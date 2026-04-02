import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://your-supabase-url.supabase.co';
const supabaseKey = 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  // Initialize your application logic here
  console.log('Supabase project initialized.');

  // Example: Fetch tasks from the database
  const { data, error } = await supabase
    .from('tasks')
    .select('*');

  if (error) {
    console.error('Error fetching tasks:', error);
  } else {
    console.log('Fetched tasks:', data);
  }
}

main();