import { supabase } from '../db';

async function seed() {
    console.log('🚀 Starting Full Database Seeding...');

    try {
        // 1. Seed Shops
        console.log('Seeding Shops...');
        const shops = [
            { shopCode: 'SHOP-NRB-001', name: 'Central Repair Hub', address: 'Kenyatta Avenue, Nairobi', lat: -1.2833, lng: 36.8167, county: 'Nairobi', services: ['Mobile Phone Repair', 'Laptop Repair', 'Software Update'] },
            { shopCode: 'SHOP-MSA-001', name: 'Coastal Tech Solutions', address: 'Digo Road, Mombasa', lat: -4.0435, lng: 39.6682, county: 'Mombasa', services: ['Screen Replacement', 'Battery Swap', 'Water Damage Repair'] },
            { shopCode: 'SHOP-KSM-001', name: 'Lakeside Gadget Clinic', address: 'Oginga Odinga St, Kisumu', lat: -0.1022, lng: 34.7617, county: 'Kisumu', services: ['Tablet Repair', 'Charging Port Fix', 'Data Recovery'] },
            { shopCode: 'SHOP-NKR-001', name: 'Rift Valley Electronics', address: 'Kenyatta Lane, Nakuru', lat: -0.2827, lng: 36.0701, county: 'Nakuru', services: ['Keypad Repair', 'Network Issues', 'Mic/Speaker Fix'] },
            { shopCode: 'SHOP-ELD-001', name: 'Highland Mobile Repair', address: 'Uganda Rd, Eldoret', lat: 0.5143, lng: 35.2698, county: 'Uasin Gishu', services: ['Glass Protection', 'Motherboard Repair', 'System Optimization'] }
        ];

        const shopIdMap: Record<string, string> = {};

        for (const shop of shops) {
            const { data, error } = await supabase.from('Shops').upsert(shop, { onConflict: 'shopCode' }).select().single();
            if (error) {
                console.error(`❌ Error seeding shop ${shop.name}:`, error.message);
            } else if (data) {
                shopIdMap[shop.shopCode] = data.id;
                console.log(`✅ Seeded Shop: ${shop.name}`);
            }
        }

        // 2. Seed Technicians (2 per shop)
        console.log('Seeding Technicians...');
        const technicians = [];
        for (const [code, id] of Object.entries(shopIdMap)) {
            const cityName = code.split('-')[1];
            technicians.push(
                { name: `Tech ${cityName} A`, email: `tech.${cityName}.a@electrocare.com`, phone: '0712345678', category: 'Hardware', subCategory: 'Screen/LCD', shopId: id, rating: 4.8, description: 'Expert in mobile hardware' },
                { name: `Tech ${cityName} B`, email: `tech.${cityName}.b@electrocare.com`, phone: '0723456789', category: 'Software', subCategory: 'OS/Firmware', shopId: id, rating: 4.7, description: 'Software troubleshooting specialist' }
            );
        }

        for (const tech of technicians) {
            const { error } = await supabase.from('Technicians').upsert(tech, { onConflict: 'email' });
            if (error) console.error(`❌ Error seeding technician ${tech.name}:`, error.message);
            else console.log(`✅ Seeded Technician: ${tech.name}`);
        }

        // 3. Seed Delivery Personnel (1 per shop)
        console.log('Seeding Delivery Personnel...');
        const deliveryPersonnel = [];
        for (const [code, id] of Object.entries(shopIdMap)) {
            const cityName = code.split('-')[1];
            deliveryPersonnel.push({
                name: `Rider ${cityName}`,
                email: `rider.${cityName}@electrocare.com`,
                type: 'RealTime',
                region: cityName,
                shopId: id,
                rating: 4.9
            });
        }

        for (const dp of deliveryPersonnel) {
            const { error } = await supabase.from('DeliveryPersonnel').upsert(dp, { onConflict: 'email' });
            if (error) console.error(`❌ Error seeding delivery: ${dp.name}:`, error.message);
            else console.log(`✅ Seeded Delivery: ${dp.name}`);
        }

        // 4. Seed Device Types
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

        // 5. Seed Device Models
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
                if (error && error.code !== '23505') { // Ignore duplicate key error
                    console.error(`❌ Error seeding model ${model.name}:`, error.message);
                } else {
                    console.log(`✅ Seeded Model: ${model.name}`);
                }
            }
        }

    } catch (err: any) {
        console.error('❌ Critical Error during seeding:', err.message);
    }

    console.log('🎉 Full Seeding Process Completed!');
}

seed().catch(console.error);
