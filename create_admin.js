import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAdmin() {
    const email = process.env.ADMIN_EMAIL || 'admin@electrocare.com';
    const password = process.env.ADMIN_PASSWORD || 'adminpassword123';
    const name = process.env.ADMIN_NAME || 'System Admin';

    console.log(`Creating admin user: ${email}`);

    const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
            name,
            role: 'admin'
        }
    });

    if (error) {
        console.error('Error creating admin:', error.message);
    } else {
        console.log('Admin created successfully:', data.user.id);
        // Ensure the user is in the public.User table (if trigger didn't catch it or for safety)
        const { error: profileError } = await supabase
            .from('User')
            .upsert({
                id: data.user.id,
                email: email,
                name: name,
                role: 'admin'
            });

        if (profileError) {
            console.error('Error creating admin profile:', profileError.message);
        } else {
            console.log('Admin profile verified.');
        }
    }
}

createAdmin();