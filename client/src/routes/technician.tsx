import { createFileRoute, redirect } from '@tanstack/react-router';
import Techniciandashboard from '../pages/Techniciandashboard';

export const Route = createFileRoute('/technician')({
  component: Techniciandashboard,
  beforeLoad: ({ context }: { context: any }) => {
    if (!context.auth?.user || context.auth.user.role !== 'technician') {
      throw redirect({ to: '/login' });
    }
  },
});
