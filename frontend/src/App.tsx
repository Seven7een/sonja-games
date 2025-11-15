import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './core/hooks/useAuth';
import { Layout } from './core/components/layout/Layout';
import { SignIn } from './core/components/auth/SignIn';
import { SignUp } from './core/components/auth/SignUp';
import { Home } from './pages/Home';
import WordleGame from './games/wordle/pages/WordleGame';
import WordleStats from './games/wordle/pages/WordleStats';

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



function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/sign-in/*" element={<SignIn />} />
        <Route path="/sign-up/*" element={<SignUp />} />

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
                <WordleGame />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/wordle/stats"
          element={
            <ProtectedRoute>
              <Layout>
                <WordleStats />
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
