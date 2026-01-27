import { createRootRoute, Outlet, useRouterState } from '@tanstack/react-router';
import useAuth from '../hooks/useAuth';
import useTheme from '../hooks/useTheme';
import TopNav from '../components/TopNav';
import BottomNav from '../components/BottomNav';
import PWAInstallPrompt from '../components/PWAInstallPrompt';
import { useEffect } from 'react';

export const Route = createRootRoute({
    component: RootComponent,
});

function RootComponent() {
    const { theme } = useTheme();
    const { user } = useAuth();
    const router = useRouterState();
    const isLandingPage = router.location.pathname === '/';

    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
    }, [theme]);

    // Logic for showing TopNav (migration from App.tsx)
    const showTopNav = user;

    return (
        <div className={`min-h-screen ${theme === 'dark' ? 'dark' : ''} bg-background text-foreground flex flex-col`}>
            {showTopNav && <TopNav />}
            <main className={`flex-1 ${!isLandingPage ? 'container mx-auto p-4' : ''} ${showTopNav ? 'pt-28' : ''} ${user ? 'pb-32' : ''}`}>
                <Outlet />
            </main>
            {user && <BottomNav />}
            <PWAInstallPrompt />
        </div>
    );
}
