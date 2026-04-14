import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const url = process.env.VITE_SUPABASE_URL || '';
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabaseAnon = createClient(url, anonKey);

async function test() {
  console.log("Testing with Anon Key...");
  const { data: anonData, error: anonError } = await supabaseAnon
    .from('formularios')
    .select('*')
    .eq('slug', 'teste-2');
  console.log("Anon Result:", anonData, anonError?.message);
}

test();

test();
