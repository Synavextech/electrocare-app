import { createFileRoute, redirect } from '@tanstack/react-router';
import ScheduleRepair from '../pages/ScheduleRepair';

export const Route = createFileRoute('/schedule')({
    component: ScheduleRepair,
    beforeLoad: ({ context }: { context: any }) => {
        if (!context.auth?.user) {
            throw redirect({ to: '/login' });
        }
    },
});
