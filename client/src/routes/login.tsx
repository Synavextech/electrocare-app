import { createFileRoute, redirect } from '@tanstack/react-router';
import Login from '../pages/Auth';

export const Route = createFileRoute('/login')({
    component: Login,
    beforeLoad: ({ context }: { context: any }) => {
        if (context.auth?.user) {
            throw redirect({ to: '/home' });
        }
    },
});
