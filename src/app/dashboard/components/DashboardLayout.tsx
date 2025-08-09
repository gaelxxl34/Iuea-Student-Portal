'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardSidebar from './DashboardSidebar';
import MobileNavigation from './MobileNavigation';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, userData, signOut } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  const [openSidebar, setOpenSidebar] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  
  useEffect(() => {
    // Check if we're on client-side
    if (typeof window !== 'undefined') {
      const handleResize = () => {
        setIsMobile(window.innerWidth < 1024);
      };
      
      // Set initial value
      handleResize();
      
      // Add event listener
      window.addEventListener('resize', handleResize);
      
      // Cleanup
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  // Close sidebar on path change on mobile
  useEffect(() => {
    if (isMobile) {
      setOpenSidebar(false);
    }
  }, [pathname, isMobile]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showProfileDropdown && !target.closest('.relative')) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProfileDropdown]);

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Get user display information
  const getDisplayName = () => {
    if (userData?.firstName && userData?.lastName) {
      return `${userData.firstName} ${userData.lastName}`;
    }
    if (user?.displayName) {
      return user.displayName;
    }
    if (userData?.firstName) {
      return userData.firstName;
    }
    return 'Student';
  };

  const getInitials = () => {
    const name = getDisplayName();
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getUserEmail = () => {
    return userData?.email || user?.email || '';
  };

  return (
    <ProtectedRoute requireEmailVerification={true}>
      <div className="flex flex-col h-screen bg-slate-50">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 py-3 px-4 flex items-center justify-between z-10">
          {/* Logo */}
          <div className="flex items-center">
            <Image 
              src="https://iuea.ac.ug/sitepad-data/uploads/2020/11/Website-Logo.png" 
              alt="IUEA Logo" 
              width={120}
              height={48}
              className="h-12 w-auto object-contain"
            />
          </div>
          
          {/* User profile dropdown */}
          <div className="relative">
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center text-sm text-slate-600 mr-2">
                <span className="text-slate-700 font-medium">Student</span>
              </div>
              <div 
                className="flex items-center gap-2 cursor-pointer hover:bg-slate-100 rounded-full p-1 transition-colors"
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              >
                <div className="h-8 w-8 bg-[#780000] text-white rounded-full flex items-center justify-center text-sm font-medium">
                  {getInitials()}
                </div>
                <span className="hidden sm:block text-sm font-medium text-slate-700">{getDisplayName()}</span>
                <i className="ri-arrow-down-s-line text-slate-400"></i>
              </div>
            </div>
            
            {/* Dropdown Menu */}
            {showProfileDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-sm font-medium text-slate-900">{getDisplayName()}</p>
                  <p className="text-xs text-slate-500">{getUserEmail()}</p>
                  {userData?.whatsappNumber && (
                    <p className="text-xs text-slate-500 mt-1">{userData.whatsappNumber}</p>
                  )}
                  <div className="mt-2 flex items-center gap-1">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    <span className="text-xs text-slate-600">
                      Application: {userData?.applicationStatus || 'Draft'}
                    </span>
                  </div>
                </div>
                <Link
                  href="/dashboard/profile"
                  className="flex items-center w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  onClick={() => setShowProfileDropdown(false)}
                >
                  <i className="ri-user-line mr-2"></i>
                  Profile Settings
                </Link>
                <button 
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <i className="ri-logout-box-line mr-2"></i>
                  Logout
                </button>
              </div>
            )}
          </div>
        </header>
        
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <DashboardSidebar isMobile={isMobile} isOpen={openSidebar} />
          
          {/* Main Content */}
          <main className="flex-1 overflow-auto dashboard-content">
            {children}
          </main>
        </div>
        
        {/* Mobile Navigation */}
        {isMobile && <MobileNavigation />}
      </div>
    </ProtectedRoute>
  );
}
