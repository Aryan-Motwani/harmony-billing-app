import {createClient} from '@supabase/supabase-js'


let apiUrl = 'https://xoxzdjzrdyisyobvwjxc.supabase.co'
let apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhveHpkanpyZHlpc3lvYnZ3anhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE0MTk5MjYsImV4cCI6MjA0Njk5NTkyNn0.rGA8I9v3CZ35-bVj71-RAghjv3DqxG06T_Wo3W1ulps';
export const supabase = createClient(apiUrl, apiKey) 