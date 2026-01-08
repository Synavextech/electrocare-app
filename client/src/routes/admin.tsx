import { createFileRoute, redirect } from '@tanstack/react-router';
import AdminDashboard from '../pages/AdminDashboard';

export const Route = createFileRoute('/admin')({
    component: AdminDashboard,
    beforeLoad: ({ context }: { context: any }) => {
        if (!context.auth?.user || context.auth.user.role !== 'admin') {
            throw redirect({ to: '/login' });
        }
    },
});
