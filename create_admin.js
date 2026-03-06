import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

const adminEmail = process.env.ADMIN_EMAIL || 'admin@electrocare.tech';
const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';
const adminName = process.env.ADMIN_NAME || 'System Admin';

async function createAdmin() {
    console.log(`Creating/Updating admin user: ${adminEmail}`);

    // 1. Create/Get user in auth.users
    const { data: { user }, error: authError } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: { name: adminName }
    });

    console.log('Auth check result:', { authError });

    if (authError) {
        console.log('Auth error message:', authError.message);
        console.log('Auth error status:', authError.status);

        // Handle both standard error message and possible variations
        if (authError.message.includes('already registered') || authError.status === 400 || authError.status === 422) {
            console.log('User might already exist in auth.users, attempting to fetch and update role...');

            // Get the existing user's ID
            const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
            if (listError) {
                console.error('Error listing users:', listError);
                throw listError;
            }

            const users = usersData.users || [];
            console.log(`Searching for ${adminEmail} among ${users.length} users...`);

            const existingUser = users.find(u => u.email === adminEmail);
            if (!existingUser) {
                console.error('User not found in list, but createUser failed. This might be a permission issue.');
                throw authError;
            }

            console.log(`Found existing user with ID: ${existingUser.id}`);

            // 2. Update role in public."User" table
            const { error: profileError } = await supabase
                .from('User')
                .upsert({
                    id: existingUser.id,
                    name: adminName,
                    email: adminEmail,
                    role: 'admin'
                }, { onConflict: 'id' });

            if (profileError) {
                console.error('Error updating profile:', profileError);
                throw profileError;
            }
            console.log('Admin profile updated successfully.');
        } else {
            throw authError;
        }
    } else {
        console.log('New admin user created in auth.users:', user.id);

        // 2. Ensuring profile exists
        const { error: profileError } = await supabase
            .from('User')
            .upsert({
                id: user.id,
                name: adminName,
                email: adminEmail,
                role: 'admin'
            });

        if (profileError) {
            console.error('Error creating profile:', profileError);
            throw profileError;
        }
        console.log('Admin profile created successfully.');
    }
}

createAdmin().catch(err => {
    console.error('Error creating admin:', err);
    process.exit(1);
});