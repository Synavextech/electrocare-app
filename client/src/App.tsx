import { RouterProvider, createRouter } from '@tanstack/react-router';
import useAuth from './hooks/useAuth';

// Import the generated route tree
import { routeTree } from './routeTree.gen';
import NotFound from './pages/NotFound';

// Create a new router instance
const router = createRouter({
  routeTree,
  defaultNotFoundComponent: NotFound,
  context: {
    auth: undefined!, // We'll inject this in App component
  },
});

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center">
        <div className="relative">
          <div className="w-14 h-14 rounded-full border-4 border-brand/20 border-t-brand animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center text-xl">⚡</div>
        </div>
        <p className="mt-4 text-xs font-black uppercase tracking-[0.3em] text-brand">ElectroCare</p>
      </div>
    );
  }

  return (
    <RouterProvider
      router={router}
      context={{ auth: { user, loading } }}
    />
  );
}

export default App;
