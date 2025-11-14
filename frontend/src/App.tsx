import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './core/hooks/useAuth';
import { Layout } from './core/components/layout/Layout';
import { SignIn } from './core/components/auth/SignIn';
import { SignUp } from './core/components/auth/SignUp';
import { Home } from './pages/Home';

/**
 * Protected Route wrapper
 * Redirects to sign-in if user is not authenticated
 */
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/sign-in" replace />;
};

/**
 * Placeholder components for Wordle game pages
 * These will be implemented in later tasks
 */
const WordleGamePlaceholder = () => (
  <div className="text-center py-12">
    <h2 className="text-2xl font-bold text-gray-900 mb-4">Wordle Game</h2>
    <p className="text-gray-600">New Game interface coming soon...</p>
  </div>
);

const WordleStatsPlaceholder = () => (
  <div className="text-center py-12">
    <h2 className="text-2xl font-bold text-gray-900 mb-4">Wordle Statistics</h2>
    <p className="text-gray-600">Statistics page coming soon...</p>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/sign-up" element={<SignUp />} />

        {/* Protected Routes with Layout */}
        <Route
          path="/"
          element={
            <Layout>
              <Home />
            </Layout>
          }
        />
        <Route
          path="/wordle"
          element={
            <ProtectedRoute>
              <Layout>
                <WordleGamePlaceholder />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/wordle/stats"
          element={
            <ProtectedRoute>
              <Layout>
                <WordleStatsPlaceholder />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
