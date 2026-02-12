import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

import fs from 'fs'

// Load .env.local manually to ensure correct parsing
const envPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8')
    envConfig.split('\n').forEach(line => {
        const [key, ...value] = line.split('=')
        if (key && value) {
            process.env[key.trim()] = value.join('=').trim().replace(/^["']|["']$/g, '')
        }
    })
} else {
    console.error('.env.local not found at', envPath)
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables. Found:', {
        url: supabaseUrl ? 'Set' : 'Missing',
        key: supabaseServiceKey ? 'Set' : 'Missing'
    })
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkListings() {
    console.log('Checking listings...')
    const { data: listings, error } = await supabase
        .from('listings')
        .select('id, title, status, host_id, available_from, available_to')

    if (error) {
        console.error('Error fetching listings:', error)
        return
    }

    console.log(`Found ${listings.length} listings:`)
    listings.forEach(l => {
        console.log(`- [${l.status}] ${l.title} (ID: ${l.id})`)
    })

    // Check for vans table existence (might error if not created yet)
    const { data: vans, error: vansError } = await supabase
        .from('vans')
        .select('count')
        .limit(1)

    if (vansError) {
        console.log('Vans table likely does not exist yet.')
    } else {
        console.log('Vans table exists.')
    }
}

checkListings()
