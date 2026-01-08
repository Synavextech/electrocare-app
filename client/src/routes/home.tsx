import { createFileRoute, redirect } from '@tanstack/react-router';
import Home from '../pages/Home';

export const Route = createFileRoute('/home')({
    component: Home,
    beforeLoad: ({ context }: { context: any }) => {
        if (!context.auth?.user) {
            throw redirect({ to: '/login' });
        }
    },
});
