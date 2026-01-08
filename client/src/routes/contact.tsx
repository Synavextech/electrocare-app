import { createFileRoute } from '@tanstack/react-router';
import ContactUs from '../pages/ContactUs';

export const Route = createFileRoute('/contact')({
    component: ContactUs,
});
