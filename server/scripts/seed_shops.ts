import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load .env from server root
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Service Role Key in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedShops() {
    try {
        const shopsPath = path.join(__dirname, '../shops.json');
        if (!fs.existsSync(shopsPath)) {
            console.error('shops.json not found at', shopsPath);
            return;
        }

        const shopsData = JSON.parse(fs.readFileSync(shopsPath, 'utf8'));
        console.log(`Found ${shopsData.length} shops in shops.json. Seeding...`);

        for (const shop of shopsData) {
            const { data, error } = await supabase
                .from('Shops')
                .upsert({
                    shopCode: shop.shopCode || `${Date.now()}-${shop.county.toUpperCase().replace(/\s+/g, '')}-${Math.floor(Math.random() * 1000)}`,
                    name: shop.name,
                    address: shop.address,
                    lat: shop.lat,
                    lng: shop.lng,
                    county: shop.county,
                    rating: shop.rating || 4.5,
                    services: shop.services || ['All devices repair'],
                }, { onConflict: 'shopCode' });

            if (error) {
                console.error(`Failed to seed shop ${shop.name}:`, error.message);
            } else {
                console.log(`Seeded shop: ${shop.name}`);
            }
        }

        console.log('Seeding completed.');
    } catch (err) {
        console.error('Seeding failed:', err);
    }
}

seedShops();
