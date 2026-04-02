import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iihtzvvxckktyqfxihkp.supabase.co';

const supabaseAnonKey = 'sb_publishable_k08gItJp-MEG1OkokP3uDg_ucGZDeTY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);