import { supabase } from './db';
import bcrypt from 'bcryptjs';
async function main() {
    const adminName = process.env.ADMIN_NAME || 'ADMIN';
    const adminEmail = process.env.ADMIN_EMAIL || 'support01@electrocare.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Electron93458s.';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    // Check if admin exists in User table
    const { data: existingAdmin } = await supabase
        .from('User')
        .select('*')
        .eq('email', adminEmail)
        .eq('role', 'admin')
        .single();
    if (existingAdmin) {
        console.log('Admin already exists:', existingAdmin);
        return;
    }
    // Create admin user
    const { data: admin, error } = await supabase
        .from('User')
        .insert({
        name: adminName,
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        referralCode: `ADMIN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    })
        .select()
        .single();
    if (error) {
        console.error('Error creating admin:', error);
        throw error;
    }
    // Create wallet for admin
    await supabase.from('Wallet').insert({
        userId: admin.id,
        balance: 0,
        points: 0
    });
    console.log('Admin created:', admin);
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
});
//# sourceMappingURL=create_admin.js.map