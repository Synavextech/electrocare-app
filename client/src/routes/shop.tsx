import { createFileRoute, redirect } from '@tanstack/react-router';
import Shop from '../pages/Shopdashboard';

export const Route = createFileRoute('/shop')({
    component: Shop,
    beforeLoad: ({ context }: { context: any }) => {
        if (!context.auth?.user || context.auth.user.role !== 'shop') {
            throw redirect({ to: '/login' });
        }
    },
});
