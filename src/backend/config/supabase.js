// supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://drigmxamcmbhakxttkpd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyaWdteGFtY21iaGFreHR0a3BkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwNzUzMDksImV4cCI6MjA2NjY1MTMwOX0.BrpaYwYWOC6MvDBB--h9s1IXnQGBv26gndp2JkMLleI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
