import { createFileRoute, redirect } from '@tanstack/react-router';
import DeliveryPersonneldashboard from '../pages/DeliveryPersonneldashboard';

export const Route = createFileRoute('/delivery')({
    component: DeliveryPersonneldashboard,
    beforeLoad: ({ context }: { context: any }) => {
        if (!context.auth?.user || context.auth.user.role !== 'delivery') {
            throw redirect({ to: '/login' });
        }
    },
});
