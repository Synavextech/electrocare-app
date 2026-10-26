import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

import path from 'path';
// In CommonJS __dirname and __filename are available globally.
// If using TS with CommonJS, we don't need fileURLToPath(import.meta.url)

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

import { resolveFromRoot } from './utils/paths.js';

dotenv.config({ path: resolveFromRoot('.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase URL or Key');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});