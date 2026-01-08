import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } })
    }

    try {
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { email, password, name, phone, role } = await req.json()

        // 1. Create Auth User
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { name, role: role || 'user' }
        })

        if (authError) throw authError

        if (!authUser.user) throw new Error('User creation failed')

        // 2. Create Public Profile
        const { error: profileError } = await supabaseAdmin
            .from('User')
            .insert({
                id: authUser.user.id,
                email,
                name,
                phone,
                role: role || 'user'
            })

        if (profileError) {
            // Rollback auth user if profile creation fails (optional but good practice)
            await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
            throw profileError
        }

        // 3. Create Wallet
        const { error: walletError } = await supabaseAdmin
            .from('Wallet')
            .insert({
                userId: authUser.user.id,
                balance: 0,
                points: 0,
                electroCoins: 0
            })

        if (walletError) {
            // Rollback everything
            await supabaseAdmin.from('User').delete().eq('id', authUser.user.id)
            await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
            throw walletError
        }

        return new Response(
            JSON.stringify({ user: authUser.user, message: 'User created successfully' }),
            { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } },
        )
    } catch (error) {
        return new Response(
            JSON.stringify({ error: (error as Error).message }),
            { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } },
        )
    }
})
