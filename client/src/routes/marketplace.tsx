import { createFileRoute, redirect } from '@tanstack/react-router';
import MarketplacePage from '../pages/MarketplacePage';

export const Route = createFileRoute('/marketplace')({
    component: MarketplacePage,
    beforeLoad: ({ context }: { context: any }) => {
        if (!context.auth?.user) {
            throw redirect({ to: '/login' });
        }
    },
});
