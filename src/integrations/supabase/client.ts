
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://relqexesmhirdxubfgmy.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlbHFleGVzbWhpcmR4dWJmZ215Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk5MTE5MzQsImV4cCI6MjA1NTQ4NzkzNH0.8hR3r7buhr3QNlE94Jb4_ALLx2UFXLjl4fuLDq0pIr0";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  db: {
    schema: 'public',
    pool: {
      max: 50,
      idleTimeoutMillis: 30000
    }
  },
  auth: {
    persistSession: true,
    storageKey: 'supabase-auth'
  }
});
