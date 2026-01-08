import { createFileRoute, redirect } from '@tanstack/react-router';
import Tracking from '../pages/Tracking';

export const Route = createFileRoute('/tracking')({
    component: Tracking,
    beforeLoad: ({ context }: { context: any }) => {
        if (!context.auth?.user) {
            throw redirect({ to: '/login' });
        }
    },
});
