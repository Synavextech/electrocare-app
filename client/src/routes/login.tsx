import { createFileRoute, redirect } from '@tanstack/react-router';
import Login from '../pages/Auth';

export const Route = createFileRoute('/login')({
    component: Login,
    beforeLoad: ({ context }: { context: any }) => {
        if (context.auth?.user) {
            const role = context.auth.user.role;
            if (role === 'admin') throw redirect({ to: '/admin' });
            if (role === 'technician') throw redirect({ to: '/technician' });
            if (role === 'delivery') throw redirect({ to: '/delivery' });
            if (role === 'shop') throw redirect({ to: '/shop' });
            throw redirect({ to: '/home' });
        }
    },
});
