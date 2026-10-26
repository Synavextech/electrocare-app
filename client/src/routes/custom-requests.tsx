import { createFileRoute } from '@tanstack/react-router';
import CustomRequestPage from '../pages/CustomRequestPage';

export const Route = createFileRoute('/custom-requests')({
    component: CustomRequestPage,
});

