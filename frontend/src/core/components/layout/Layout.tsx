/**
 * Layout component
 * Main layout wrapper with header and content area
 * Provides consistent structure across all pages
 */

import { ReactNode } from 'react';
import { Header } from './Header';

interface LayoutProps {
  children: ReactNode;
}

/**
 * Layout component
 * Wraps page content with header and responsive container
 */
export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {children}
      </main>
    </div>
  );
};

export default Layout;
