import { createClient } from '@supabase/supabase-js';

// The URL your backend team provided
const supabaseUrl = 'https://iihtzvvxckktyqfxihkp.supabase.co';

// CRITICAL: You need to ask your backend team for the "anon public API key"!
// It is a long string of characters they can copy from their Supabase dashboard.
const supabaseAnonKey = 'sb_publishable_k08gItJp-MEG1OkokP3uDg_ucGZDeTY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);