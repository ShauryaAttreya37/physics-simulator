import { createClient } from '@supabase/supabase-js';

// Hardcoding these is safe because Supabase anon keys and URLs are designed to be public
// and are bundled into the frontend anyway. This ensures Vercel works instantly without config.
const supabaseUrl = 'https://oyxfkrqhsntggbazdcxh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95eGZrcnFoc250Z2diYXpkY3hoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MDc4NzIsImV4cCI6MjA5MzI4Mzg3Mn0.1TgIEjUmasapLI81oo11aeREBPBRySVHKngSgip3Jds';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
