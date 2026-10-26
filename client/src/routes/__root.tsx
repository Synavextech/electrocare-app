import { createRootRoute, Outlet, useRouterState } from '@tanstack/react-router';
import useAuth from '../hooks/useAuth';
import useTheme from '../hooks/useTheme';
import TopNav from '../components/TopNav';
import BottomNav from '../components/BottomNav';
import PWAInstallPrompt from '../components/PWAInstallPrompt';

export const Route = createRootRoute({
    component: RootComponent,
});

function RootComponent() {
    const { theme } = useTheme();
    const { user } = useAuth();
    const router = useRouterState();
    const isLandingPage = router.location.pathname === '/';

    const showTopNav = !!user;

    return (
        <div className={`min-h-screen ${theme === 'dark' ? 'dark' : 'light'} bg-canvas text-foreground flex flex-col transition-colors duration-300`}>
            {showTopNav && <TopNav />}
            <main className={`flex-1 ${!isLandingPage ? 'container mx-auto p-4' : ''} ${showTopNav ? 'pt-28' : ''} ${user ? 'pb-32' : ''}`}>
                <Outlet />
            </main>
            {user && <BottomNav />}
            <PWAInstallPrompt />
        </div>
    );
}
