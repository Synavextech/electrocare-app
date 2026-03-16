import { supabase } from '../db.js';
import fs from 'fs';
import path from 'path';

async function seed() {
    console.log('🚀 Starting Advanced Database Seeding...');

    try {
        // 0. Load Shop Data from shop.json
        const possiblePaths = [
            path.resolve(process.cwd(), 'shop.json'),
            path.resolve(process.cwd(), '../shop.json'),
            path.resolve(path.dirname(new URL(import.meta.url).pathname), '../../shop.json')
        ];
        
        let shopDataPath = '';
        for (const p of possiblePaths) {
            if (fs.existsSync(p)) {
                shopDataPath = p;
                break;
            }
        }

        if (!shopDataPath) {
            throw new Error('shop.json not found in expected locations');
        }
        console.log(`Loading shop data from: ${shopDataPath}`);
        const shops = JSON.parse(fs.readFileSync(shopDataPath, 'utf8'));

        // 1. Seed Device Types
        console.log('Seeding Device Types...');
        const deviceTypes = [
            { name: 'Mobile Phone', icon: '📱' },
            { name: 'Laptop', icon: '💻' },
            { name: 'Tablet', icon: '📟' },
            { name: 'Smartwatch', icon: '⌚' }
        ];

        const typeMapping: Record<string, string> = {};
        for (const type of deviceTypes) {
            const { data, error } = await supabase.from('DeviceTypes').upsert(type, { onConflict: 'name' }).select().single();
            if (error) console.error(`❌ Error seeding device type ${type.name}:`, error.message);
            else if (data) {
                typeMapping[type.name] = data.id;
                console.log(`✅ Seeded Device Type: ${type.name}`);
            }
        }

        // 2. Seed Device Models
        console.log('Seeding Device Models...');
        const models = [
            { name: 'iPhone 15 Pro', brand: 'Apple', type: 'Mobile Phone' },
            { name: 'Galaxy S24', brand: 'Samsung', type: 'Mobile Phone' },
            { name: 'MacBook Pro 14"', brand: 'Apple', type: 'Laptop' },
            { name: 'Dell XPS 13', brand: 'Dell', type: 'Laptop' },
            { name: 'iPad Pro', brand: 'Apple', type: 'Tablet' },
            { name: 'Apple Watch Series 9', brand: 'Apple', type: 'Smartwatch' }
        ];

        for (const model of models) {
            const typeId = typeMapping[model.type];
            if (typeId) {
                const { error } = await supabase.from('DeviceModels').insert({
                    name: model.name,
                    brand: model.brand,
                    deviceTypeId: typeId
                });
                if (error && error.code !== '23505') console.error(`❌ Error seeding model ${model.name}:`, error.message);
                else console.log(`✅ Seeded Model: ${model.name}`);
            }
        }

        // 3. Seed Shops, Techs, and Delivery
        console.log('Looping through shops to create everything...');
        for (const shopItem of shops) {
            console.log(`--- Seeding Shop: ${shopItem.name} (${shopItem.id}) ---`);

            // a. Create Shop User Account
            const shopEmail = shopItem.email || `shop.${shopItem.id.toLowerCase()}@electrocare.co.ke`;
            const { data: shopAuth, error: shopAuthErr } = await supabase.auth.admin.createUser({
                email: shopEmail,
                password: shopItem.id, // Pre-set password as ID
                email_confirm: true,
                user_metadata: { name: shopItem.name, role: 'shop' }
            });

            if (shopAuthErr) {
                if (!shopAuthErr.message.includes('already registered')) {
                    console.error(`❌ Error creating shop auth for ${shopItem.id}:`, shopAuthErr.message);
                    continue;
                }
            }

            // Get the user ID (either newly created or existing)
            const { data: existingShopUser } = await supabase.from('User').select('id').eq('email', shopEmail).single();
            const shopUserId = shopAuth?.user?.id || existingShopUser?.id;

            if (!shopUserId) {
                console.error(`❌ Could not resolve userId for shop ${shopItem.id}`);
                continue;
            }

            // Ensure role is 'shop'
            await supabase.from('User').update({ role: 'shop' }).eq('id', shopUserId);

            // b. Insert into Shops table
            const { data: seededShop, error: shopErr } = await supabase.from('Shops').upsert({
                shopCode: shopItem.id,
                name: shopItem.name,
                address: shopItem.address,
                lat: shopItem.lat,
                lng: shopItem.lng,
                county: shopItem.county,
                rating: shopItem.rating || 4.5,
                services: ['Mobile Phone Repair', 'Laptop Repair', 'Software Update', 'Recycling']
            }, { onConflict: 'shopCode' }).select().single();

            if (shopErr) {
                console.error(`❌ Error inserting shop ${shopItem.id}:`, shopErr.message);
                continue;
            }

            const shopId = seededShop.id;

            // c. Create 2 Technicians per shop
            const techRoles = [
                { suffix: 'HW', category: 'Hardware', name: 'Hardware Specialist', sub: 'Repair' },
                { suffix: 'SW', category: 'Software', name: 'Software Diagnostics', sub: 'Diagnostics' }
            ];

            for (const tRole of techRoles) {
                const techEmail = `tech.${tRole.suffix.toLowerCase()}.${shopItem.id.toLowerCase()}@electrocare.co.ke`;
                const techPass = `tech.${tRole.suffix.toLowerCase()}.${shopItem.id}`;

                const { data: tAuth, error: tAuthErr } = await supabase.auth.admin.createUser({
                    email: techEmail,
                    password: techPass,
                    email_confirm: true,
                    user_metadata: { name: `${shopItem.name} - ${tRole.name}`, role: 'technician' }
                });

                if (tAuthErr && !tAuthErr.message.includes('already registered')) {
                    console.error(`❌ Error creating tech auth:`, tAuthErr.message);
                    continue;
                }

                const { data: eTUser } = await supabase.from('User').select('id').eq('email', techEmail).single();
                const tUserId = tAuth?.user?.id || eTUser?.id;

                if (tUserId) {
                    await supabase.from('User').update({ role: 'technician' }).eq('id', tUserId);
                    const { error: tErr } = await supabase.from('Technicians').upsert({
                        name: `${shopItem.name} - ${tRole.name}`,
                        email: techEmail,
                        category: tRole.category,
                        subCategory: tRole.sub,
                        shopId: shopId,
                        userId: tUserId,
                        rating: 4.8
                    }, { onConflict: 'email' });
                    if (tErr) console.error(`❌ Error seeding technician:`, tErr.message);
                    else console.log(`   ✅ Seeded Tech: ${tRole.name}`);
                }
            }

            // d. Create 2 Delivery Personnel per shop
            const deliveryRoles = [
                { suffix: 'RT', type: 'RealTime', name: 'Real Time Rider' },
                { suffix: 'FT', type: 'OneTime', name: 'Fixed Time Delivery' }
            ];

            for (const dRole of deliveryRoles) {
                const dEmail = `rider.${dRole.suffix.toLowerCase()}.${shopItem.id.toLowerCase()}@electrocare.co.ke`;
                const dPass = `rider.${dRole.suffix.toLowerCase()}.${shopItem.id}`;

                const { data: dAuth, error: dAuthErr } = await supabase.auth.admin.createUser({
                    email: dEmail,
                    password: dPass,
                    email_confirm: true,
                    user_metadata: { name: `${shopItem.name} - ${dRole.name}`, role: 'delivery' }
                });

                if (dAuthErr && !dAuthErr.message.includes('already registered')) {
                    console.error(`❌ Error creating delivery auth:`, dAuthErr.message);
                    continue;
                }

                const { data: eDUser } = await supabase.from('User').select('id').eq('email', dEmail).single();
                const dUserId = dAuth?.user?.id || eDUser?.id;

                if (dUserId) {
                    await supabase.from('User').update({ role: 'delivery' }).eq('id', dUserId);
                    const { error: dErr } = await supabase.from('DeliveryPersonnel').upsert({
                        name: `${shopItem.name} - ${dRole.name}`,
                        email: dEmail,
                        type: dRole.type,
                        shopId: shopId,
                        userId: dUserId,
                        rating: 4.9
                    }, { onConflict: 'email' });
                    if (dErr) console.error(`❌ Error seeding delivery:`, dErr.message);
                    else console.log(`   ✅ Seeded Delivery: ${dRole.name}`);
                }
            }
        }

    } catch (err: any) {
        console.error('❌ Critical Error during seeding:', err.message);
    }

    console.log('🎉 Advanced Seeding Process Completed!');
}
seed().catch(console.error);
