'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardSidebar from './DashboardSidebar';
import MobileNavigation from './MobileNavigation';
import { studentApplicationService, type Application } from '@/lib/applicationService';

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
  const [applicationData, setApplicationData] = useState<Application | null>(null);
  const [applicationLoading, setApplicationLoading] = useState(true);
  
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

  // Load application data for real status
  useEffect(() => {
    const loadApplicationData = async () => {
      if (!user?.email) {
        setApplicationLoading(false);
        return;
      }

      try {
        const applications = await studentApplicationService.getApplicationsByEmail(user.email);
        
        if (applications.length > 0) {
          // Use the most recent application
          const mostRecentApp = applications.sort((a, b) => 
            new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
          )[0];
          setApplicationData(mostRecentApp);
        } else {
          setApplicationData(null);
        }
      } catch (error) {
        console.error('Failed to load application data:', error);
        setApplicationData(null);
      } finally {
        setApplicationLoading(false);
      }
    };

    if (user?.emailVerified) {
      loadApplicationData();
    } else {
      setApplicationLoading(false);
    }
  }, [user]);

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

  // Get real application status
  const getApplicationStatus = () => {
    if (applicationLoading) {
      return { status: 'Loading...', color: 'text-slate-500' };
    }
    
    if (!applicationData) {
      return { status: 'Not Started', color: 'text-gray-600' };
    }
    
    const progress = studentApplicationService.calculateProgress(applicationData);
    
    // Map status to colors - using actual backend status values
    const statusColors: Record<string, string> = {
      'Not Started': 'text-gray-600',
      'Interest Expressed': 'text-blue-600',
      'Application Submitted': 'text-purple-600', // This maps to "applied" status
      'Under Review': 'text-yellow-600', // This maps to "in_review" status
      'Qualified': 'text-orange-600',
      'Admitted': 'text-green-600',
      'Enrolled': 'text-emerald-600',
      'Deferred': 'text-amber-600',
      'Application Expired': 'text-red-600',
      'Application Declined': 'text-red-600',
      'Documents Uploaded': 'text-blue-600'
    };
    
    return {
      status: progress.status,
      color: statusColors[progress.status] || 'text-slate-600'
    };
  };

  return (
    <ProtectedRoute requireEmailVerification={true}>
      <div className="flex flex-col h-screen bg-slate-50">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 py-2 sm:py-3 px-3 sm:px-4 flex items-center justify-between z-10 min-h-[60px]">
          {/* Logo */}
          <div className="flex items-center">
            <Image 
              src="https://iuea.ac.ug/sitepad-data/uploads/2020/11/Website-Logo.png" 
              alt="IUEA Logo" 
              width={isMobile ? 100 : 120}
              height={isMobile ? 40 : 48}
              className="h-8 sm:h-12 w-auto object-contain"
            />
          </div>
          
          {/* User profile dropdown */}
          <div className="relative">
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="hidden sm:flex items-center text-sm text-slate-600 mr-2">
                <span className="text-slate-700 font-medium">Student</span>
              </div>
              <div 
                className="flex items-center gap-2 cursor-pointer hover:bg-slate-100 rounded-full p-2 transition-colors min-h-[44px] min-w-[44px]"
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              >
                <div className="h-7 w-7 sm:h-8 sm:w-8 bg-[#780000] text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-medium">
                  {getInitials()}
                </div>
                <span className="hidden sm:block text-sm font-medium text-slate-700">{getDisplayName()}</span>
                <i className="ri-arrow-down-s-line text-slate-400 text-sm sm:text-base"></i>
              </div>
            </div>
            
            {/* Dropdown Menu */}
            {showProfileDropdown && (
              <div className="absolute right-0 mt-2 w-64 sm:w-56 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-sm font-medium text-slate-900 truncate">{getDisplayName()}</p>
                  <p className="text-xs text-slate-500 truncate">{getUserEmail()}</p>
                  {userData?.whatsappNumber && (
                    <p className="text-xs text-slate-500 mt-1">{userData.whatsappNumber}</p>
                  )}
                  <div className="mt-2 flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${
                      getApplicationStatus().status === 'Not Started' ? 'bg-gray-400' :
                      getApplicationStatus().status === 'Loading...' ? 'bg-blue-400' :
                      getApplicationStatus().status === 'Application Submitted' ? 'bg-purple-400' : // maps to "applied"
                      getApplicationStatus().status === 'Under Review' ? 'bg-yellow-400' : // maps to "in_review"
                      getApplicationStatus().status === 'Qualified' ? 'bg-orange-400' :
                      getApplicationStatus().status === 'Admitted' ? 'bg-green-400' :
                      getApplicationStatus().status === 'Enrolled' ? 'bg-emerald-400' :
                      getApplicationStatus().status.includes('Expired') || getApplicationStatus().status.includes('Declined') ? 'bg-red-400' :
                      'bg-blue-400'
                    }`}></div>
                    <span className={`text-xs ${getApplicationStatus().color}`}>
                      Application: {getApplicationStatus().status}
                    </span>
                  </div>
                  {applicationData && (
                    <div className="mt-1">
                      <p className="text-xs text-slate-500">
                        Program: {applicationData.preferredProgram || 'Not specified'}
                      </p>
                      <p className="text-xs text-slate-500">
                        Intake: {applicationData.preferredIntake || 'Not specified'}
                      </p>
                    </div>
                  )}
                </div>
                <button 
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 active:bg-red-100 transition-colors"
                >
                  <i className="ri-logout-box-line mr-3 text-base"></i>
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
          <main className="flex-1 overflow-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 pb-20 lg:pb-6">
            {children}
          </main>
        </div>
        
        {/* Mobile Navigation */}
        {isMobile && <MobileNavigation />}
      </div>
    </ProtectedRoute>
  );
}
