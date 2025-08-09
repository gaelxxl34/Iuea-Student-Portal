'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireEmailVerification?: boolean;
}

export default function ProtectedRoute({ 
  children, 
  requireEmailVerification = true 
}: ProtectedRouteProps) {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!loading) {
      // If no user is authenticated, redirect to login
      if (!user) {
        router.push('/login');
        return;
      }

      // If email verification is required and user's email is not verified
      if (requireEmailVerification && user && !user.emailVerified) {
        router.push('/verify-email');
        return;
      }

      // User is properly authenticated
      setIsChecking(false);
    }
  }, [user, userData, loading, router, requireEmailVerification]);

  // Show loading spinner while checking authentication
  if (loading || isChecking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#780000]"></div>
          <p className="text-slate-600 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is not authenticated, don't render children (redirect will happen)
  if (!user) {
    return null;
  }

  // If email verification is required but user is not verified, don't render children
  if (requireEmailVerification && !user.emailVerified) {
    return null;
  }

  // User is authenticated and verified (if required), render children
  return <>{children}</>;
}
