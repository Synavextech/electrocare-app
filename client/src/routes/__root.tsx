import { createRootRoute, Outlet } from '@tanstack/react-router';
import useAuth from '../hooks/useAuth';
import useTheme from '../hooks/useTheme';
import TopNav from '../components/TopNav';
import BottomNav from '../components/BottomNav';
import { useEffect } from 'react';

export const Route = createRootRoute({
    component: RootComponent,
});

function RootComponent() {
    const { theme } = useTheme();
    const { user } = useAuth();

    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
    }, [theme]);

    // Logic for showing TopNav (migration from App.tsx)
    const showTopNav = user; // Simplified for routing, components will handle internal logic or use specific routes

    return (
        <div className={`min-h-screen ${theme === 'dark' ? 'dark' : ''} bg-background text-foreground flex flex-col`}>
            {showTopNav && <TopNav />}
            <main className={`flex-1 container mx-auto p-4 ${showTopNav ? 'pt-28' : ''} ${user ? 'pb-32' : ''}`}>
                <Outlet />
            </main>
            {user && <BottomNav />}
        </div>
    );
}
