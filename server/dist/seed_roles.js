import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';
dotenv.config();
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role for auth operations
if (!supabaseServiceRoleKey) {
    console.error('Error: SUPABASE_SERVICE_ROLE_KEY is required for seeding.');
    process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});
async function seedProfessional(file, role) {
    const filePath = path.join(__dirname, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    for (const item of data) {
        console.log(`Seeding ${role}: ${item.name} (${item.email})`);
        // 1. Create/Update user in auth.users
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: item.email,
            password: item.password || 'Password123!',
            email_confirm: true,
            user_metadata: { role, name: item.name }
        });
        if (authError) {
            if (authError.message.includes('already registered')) {
                console.log(`User ${item.email} already exists in Auth.`);
                // We'll proceed to update the public profile regardless
            }
            else {
                console.error(`Error creating auth user for ${item.email}:`, authError);
                continue;
            }
        }
        const userId = authData?.user?.id;
        if (!userId) {
            // If already exists, we need to fetch the ID
            const { data: existingUsers } = await supabase.from('User').select('id').eq('email', item.email).single();
            if (existingUsers) {
                // Update profile
                const { error: updateError } = await supabase
                    .from('User')
                    .update({
                    name: item.name,
                    role: role,
                    updatedAt: new Date().toISOString()
                })
                    .eq('id', existingUsers.id);
                if (updateError)
                    console.error(`Error updating profile for ${item.email}:`, updateError);
            }
            continue;
        }
        // 2. Create public profile
        const { error: profileError } = await supabase
            .from('User')
            .upsert({
            id: userId,
            name: item.name,
            email: item.email,
            role: role,
            referralCode: `${role.toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
        });
        if (profileError) {
            console.error(`Error seeding profile for ${item.email}:`, profileError);
            continue;
        }
        // 3. Create wallet
        const { error: walletError } = await supabase
            .from('Wallet')
            .upsert({
            userId: userId,
            balance: 0,
            points: 0
        });
        if (walletError) {
            console.error(`Error seeding wallet for ${item.email}:`, walletError);
        }
    }
}
async function main() {
    console.log('--- Starting Role Seeding ---');
    await seedProfessional('shops.json', 'shop');
    await seedProfessional('technicians.json', 'technician');
    await seedProfessional('deliverypersonnel.json', 'delivery');
    console.log('--- Seeding Completed ---');
}
main().catch(err => {
    console.error('Fatal Seeding Error:', err);
    process.exit(1);
});
//# sourceMappingURL=seed_roles.js.map