import { createFileRoute, redirect } from '@tanstack/react-router';
import Wallet from '../pages/Wallet';

export const Route = createFileRoute('/wallet')({
    component: Wallet,
    beforeLoad: ({ context }: { context: any }) => {
        if (!context.auth?.user) {
            throw redirect({ to: '/login' });
        }
    },
});
