'use client';

import Header from './Header';
import { ErrorBoundary } from '../common/ErrorBoundary';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main>{children}</main>
      </div>
    </ErrorBoundary>
  );
}

