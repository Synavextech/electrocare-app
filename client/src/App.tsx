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

  return (
    <RouterProvider
      router={router}
      context={{ auth: { user, loading } }}
    />
  );
}

export default App;
