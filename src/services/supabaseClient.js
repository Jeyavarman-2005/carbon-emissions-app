import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://drigmxamcmbhakxttkpd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyaWdteGFtY21iaGFreHR0a3BkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwNzUzMDksImV4cCI6MjA2NjY1MTMwOX0.BrpaYwYWOC6MvDBB--h9s1IXnQGBv26gndp2JkMLleI'; // Your actual anon public key

let supabase;

if (!supabase) {
  supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });
}

export default supabase;