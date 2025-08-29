'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { studentApplicationService, type Application } from '@/lib/applicationService';
import { DashboardSkeleton } from '@/components/skeletons/DashboardSkeleton';
import welcomeService from '@/services/welcomeService';
export default function Dashboard() {
  const router = useRouter();
  const { user, userData, loading, refreshUser } = useAuth();
  
  // State for real application data
  const [applicationData, setApplicationData] = useState<Application | null>(null);
  const [applicationsLoading, setApplicationsLoading] = useState(true);
  const [applicationsError, setApplicationsError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Automatic welcome message function for first login
  const sendWelcomeMessages = useCallback(async () => {
    if (!user || !userData) {
      return;
    }

    // Check if welcome messages should be sent
    const shouldSend = await welcomeService.shouldSendWelcomeMessages(user.uid);
    if (!shouldSend) {
      console.log('Welcome messages already sent for this user');
      return;
    }

    console.log('🎉 First login detected, sending welcome messages...');
    
    const userName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || user.displayName || 'Student';
    const userEmail = user.email || '';
    
    try {
      // Send welcome email
      const emailResult = await welcomeService.sendWelcomeEmail({
        userEmail,
        userName,
        isFirstLogin: true
      });
      
      console.log('✅ Welcome email sent:', emailResult);
      
      // Send welcome WhatsApp message if phone number is available
      if (userData.whatsappNumber) {
        const whatsappResult = await welcomeService.sendWelcomeWhatsApp({
          phoneNumber: userData.whatsappNumber,
          userName,
          isFirstLogin: true
        });
        
        console.log('✅ Welcome WhatsApp sent:', whatsappResult);
      }
      
      // Mark welcome messages as sent
      welcomeService.markWelcomeMessagesSent(user.uid);
      
    } catch (error) {
      console.error('❌ Error sending welcome messages:', error);
    }
  }, [user, userData]);

  // Refresh application data function
  const refreshApplicationData = async () => {
    if (!user?.email || applicationsLoading) return;
    
    setIsRefreshing(true);
    setApplicationsError(null);

    try {
      console.log('🔄 Refreshing application data for user:', user.email);
      const applications = await studentApplicationService.getApplicationsByEmail(user.email);
      
      if (applications.length > 0) {
        const mostRecentApp = applications.sort((a, b) => 
          new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
        )[0];
        
        console.log('✅ Application refreshed:', mostRecentApp);
        setApplicationData(mostRecentApp);
      } else {
        console.log('📭 No applications found for user');
        setApplicationData(null);
      }
    } catch (error) {
      console.error('❌ Failed to refresh application data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh application data';
      setApplicationsError(errorMessage);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const checkAuthAndVerification = async () => {
      // If not loading and no user, redirect to login
      if (!loading && !user) {
        router.push('/login');
        return;
      }

      // If user exists, check email verification status
      if (user && !loading) {
        // If user is not verified in Firebase Auth, try refreshing first
        if (!user.emailVerified) {
          try {
            // Try refreshing the user once to get latest verification status
            await refreshUser();
            // Check if user is still not verified after refresh
            if (!user.emailVerified) {
              // Still not verified, redirect to verification page
              router.push('/verify-email');
            }
            // If verified after refresh, continue to dashboard
          } catch (error) {
            console.error('Error refreshing user:', error);
            // If refresh fails, redirect to verification
            router.push('/verify-email');
          }
        }
        
        // If user is verified and we have user data, trigger welcome messages
        if (user.emailVerified && userData) {
          sendWelcomeMessages();
        }
      }
    };

    checkAuthAndVerification();
  }, [user, loading, userData, router, refreshUser, sendWelcomeMessages]);

  // Load application data when user is available
  useEffect(() => {
    const loadApplicationData = async () => {
      if (!user?.email) {
        setApplicationsLoading(false);
        return;
      }

      setApplicationsLoading(true);
      setApplicationsError(null);

      try {
        console.log('🔍 Loading applications for user:', user.email);
        
        const applications = await studentApplicationService.getApplicationsByEmail(user.email);
        
        if (applications.length > 0) {
          // Use the most recent application
          const mostRecentApp = applications.sort((a, b) => 
            new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
          )[0];
          
          console.log('✅ Application loaded:', mostRecentApp);
          setApplicationData(mostRecentApp);
        } else {
          console.log('📭 No applications found for user');
          setApplicationData(null);
        }
      } catch (error) {
        console.error('❌ Failed to load application data:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to load application data';
        setApplicationsError(`Unable to load application data: ${errorMessage}`);
        setApplicationData(null);
      } finally {
        setApplicationsLoading(false);
      }
    };

    if (user?.emailVerified) {
      loadApplicationData();
    } else {
      // If user is not email verified, don't keep loading
      setApplicationsLoading(false);
    }
  }, [user]);

  // Show loading while checking auth state or loading applications
  if (loading || applicationsLoading) {
    console.log('🔄 Dashboard loading state:', { loading, applicationsLoading, user: !!user, userEmail: user?.email });
    return <DashboardSkeleton />;
  }

  // Don't render anything if user is not authenticated or email not verified
  if (!user || !user.emailVerified) {
    return null;
  }

  // Calculate application status from real data or use defaults
  const applicationStatus = applicationData ? (() => {
    const progress = studentApplicationService.calculateProgress(applicationData);
    
    return {
      status: progress.status,
      statusColor: progress.statusColor,
      statusBgColor: progress.statusBgColor,
      completedSteps: progress.completedSteps,
      totalSteps: progress.totalSteps,
      nextAction: progress.nextAction,
      progressPercentage: progress.progressPercentage,
      deadline: 'Aug 30, 2025' // This could be dynamic based on intake
    };
  })() : {
    status: 'Not Started',
    statusColor: 'text-gray-800',
    statusBgColor: 'bg-gray-100',
    completedSteps: 0,
    totalSteps: 5,
    nextAction: 'Start Your Application',
    progressPercentage: 0,
    deadline: 'Aug 30, 2025'
  };
  
  // Generate required documents from real application data
  const requiredDocuments = applicationData ? [
    { 
      id: 1, 
      name: 'National ID / Passport', 
      status: applicationData.identificationDocument ? 'uploaded' : 'pending', 
      date: applicationData.identificationDocument ? new Date(applicationData.updatedAt).toLocaleDateString() : null 
    },
    { 
      id: 2, 
      name: 'Academic Documents', 
      status: applicationData.academicDocuments ? 'uploaded' : 'pending', 
      date: applicationData.academicDocuments ? new Date(applicationData.updatedAt).toLocaleDateString() : null 
    },
    { 
      id: 3, 
      name: 'Passport Photo', 
      status: applicationData.passportPhoto ? 'uploaded' : 'pending', 
      date: applicationData.passportPhoto ? new Date(applicationData.updatedAt).toLocaleDateString() : null 
    },
  ] : [
    { id: 1, name: 'National ID / Passport', status: 'pending', date: null },
    { id: 2, name: 'Academic Documents', status: 'pending', date: null },
    { id: 3, name: 'Passport Photo', status: 'pending', date: null },
  ];

  // Generate programs of interest from real application data
  const programsOfInterest = applicationData ? [
    { 
      id: 1, 
      name: applicationData.preferredProgram || 'Program Not Specified',
      faculty: 'Faculty of Computing & Engineering', // This could be mapped from program
      status: 'Applied'
    }
  ] : [
    { id: 1, name: 'No program selected yet', faculty: '', status: 'Not Selected' },
  ];

  // Dynamic application checklist based on real data
  const applicationChecklist = [
    {
      id: 1,
      title: 'Create Account',
      completed: true, // If user exists, this is always completed
      // date: 'Aug 1, 2025'
    },
    {
      id: 2,
      title: 'Personal Information',
      completed: !!applicationData, // Completed if application exists
      date: applicationData ? new Date(applicationData.submittedAt).toLocaleDateString() : null
    },
    {
      id: 3,
      title: 'Select Programs',
      completed: !!(applicationData?.preferredProgram),
      date: applicationData?.preferredProgram ? new Date(applicationData.submittedAt).toLocaleDateString() : null
    },
    {
      id: 4,
      title: 'Upload Documents',
      completed: !!(applicationData?.passportPhoto && applicationData?.academicDocuments && applicationData?.identificationDocument),
      date: (applicationData?.passportPhoto && applicationData?.academicDocuments && applicationData?.identificationDocument) 
        ? new Date(applicationData.updatedAt).toLocaleDateString() : null,
      deadline: 'Aug 30, 2025'
    },
    {
      id: 5,
      title: 'Pay Application Fee',
      completed: false, // This would be based on payment status when implemented
      date: null,
      available: false
    }
  ];

  return (
    <div className="p-4 md:p-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-slate-800">Application Portal</h1>
        <p className="text-sm md:text-base text-slate-600">
          Welcome back, {userData?.firstName || user.displayName || 'Student'}!
        </p>
      </div>

      {/* Quick Navigation - Always Visible */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Link 
          href="/dashboard" 
          className="bg-white rounded-lg p-4 border border-slate-200 hover:border-red-800/30 transition-colors group"
        >
          <div className="flex items-center">
            <div className="h-10 w-10 bg-red-50 rounded-lg flex items-center justify-center group-hover:bg-red-100 transition-colors">
              <i className="ri-dashboard-line text-red-800"></i>
            </div>
            <div className="ml-3">
              <h3 className="font-medium text-slate-800">Dashboard</h3>
              <p className="text-xs text-slate-600">Overview & Status</p>
            </div>
          </div>
        </Link>

        <Link 
          href="/dashboard/application" 
          className="bg-white rounded-lg p-4 border border-slate-200 hover:border-red-800/30 transition-colors group"
        >
          <div className="flex items-center">
            <div className="h-10 w-10 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
              <i className="ri-file-list-3-line text-blue-800"></i>
            </div>
            <div className="ml-3">
              <h3 className="font-medium text-slate-800">My Application</h3>
              <p className="text-xs text-slate-600">{applicationData ? 'Edit & Update' : 'Start Application'}</p>
            </div>
          </div>
        </Link>

        <Link 
          href="/dashboard/documents" 
          className="bg-white rounded-lg p-4 border border-slate-200 hover:border-red-800/30 transition-colors group"
        >
          <div className="flex items-center">
            <div className="h-10 w-10 bg-green-50 rounded-lg flex items-center justify-center group-hover:bg-green-100 transition-colors">
              <i className="ri-file-upload-line text-green-800"></i>
            </div>
            <div className="ml-3">
              <h3 className="font-medium text-slate-800">Documents</h3>
              <p className="text-xs text-slate-600">Upload & Manage</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Application Status */}
      <div className="bg-white rounded-lg p-3 md:p-4 border border-[#EDEDED] mb-6">
        {applicationsError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">⚠️ {applicationsError}</p>
            <button 
              onClick={refreshApplicationData}
              className="text-xs text-red-600 hover:text-red-800 mt-1 underline"
            >
              Try again
            </button>
          </div>
        )}
        
        {applicationData && (
          <div className="mb-4 text-xs text-slate-500">
            Last updated: {new Date(applicationData.updatedAt).toLocaleString()}
          </div>
        )}
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
          <div>
            <h2 className="text-base md:text-lg font-semibold text-slate-800">Application Status</h2>
            <p className="text-xs md:text-sm text-slate-600 mt-1">
              {applicationData ? `${applicationData.preferredIntake} Intake 2025` : 'August Intake 2025'}
              
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={refreshApplicationData}
              disabled={isRefreshing}
              className="text-slate-600 hover:text-slate-800 p-1 rounded-md hover:bg-slate-100 transition-colors disabled:opacity-50"
              title="Refresh application data"
            >
              <i className={`ri-refresh-line text-sm ${isRefreshing ? 'animate-spin' : ''}`}></i>
            </button>
            <span 
              className={`px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-medium ${applicationStatus.statusBgColor} ${applicationStatus.statusColor}`}
            >
              {applicationStatus.status}
            </span>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mt-3 md:mt-4">
          <div className="flex justify-between text-xs md:text-sm mb-1">
            <span className="font-medium">Application Progress</span>
            <span>{applicationStatus.completedSteps}/{applicationStatus.totalSteps} Steps Completed</span>
          </div>
          <div className="w-full bg-[#EDEDED] rounded-full h-2.5">
            <div 
              className="bg-[#780000] h-2.5 rounded-full transition-all duration-300" 
              style={{ width: `${Math.max(0, Math.min(100, applicationStatus.progressPercentage))}%` }}
            ></div>
          </div>
        </div>
        
        {/* Next action */}
        <div className="mt-3 md:mt-4 p-3 bg-red-50 rounded-lg border-l-4 border-red-800 flex flex-col gap-3">
          <div>
            <p className="font-medium text-sm md:text-base">Next Step: {applicationStatus.nextAction}</p>
            <p className="text-xs md:text-sm text-slate-600 mt-1">
              <i className="ri-calendar-line mr-1"></i>
              Deadline: {applicationStatus.deadline}
            </p>
          </div>
          {applicationData ? (
            <Link 
              href="/dashboard/documents" 
              className="w-full sm:w-auto min-h-[44px] px-6 py-3 bg-[#780000] text-white rounded-lg text-base font-medium hover:bg-[#600000] transition-colors text-center flex items-center justify-center"
            >
              <i className="ri-folder-line mr-2"></i>
              Manage Documents
            </Link>
          ) : (
            <Link 
              href="/dashboard/application" 
              className="w-full sm:w-auto min-h-[44px] px-6 py-3 bg-[#780000] text-white rounded-lg text-base font-medium hover:bg-[#600000] transition-colors text-center flex items-center justify-center"
            >
              <i className="ri-play-line mr-2"></i>
              Start Application
            </Link>
          )}
        </div>
      </div>



      {/* Main Content - 2 Column Layout on larger screens */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Programs Section */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base md:text-lg font-semibold text-slate-800">Programs of Interest</h2>
            </div>
            <div className="grid gap-3">
              {programsOfInterest.map((program) => (
                <div key={program.id} className="p-3 border border-[#EDEDED] rounded-lg hover:border-[#780000]/30 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-1 gap-2">
                    <h3 className="font-medium text-sm md:text-base">{program.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full w-fit ${
                      program.status === 'Applied' 
                        ? 'bg-green-50 text-green-700' 
                        : 'bg-blue-50 text-blue-700'
                    }`}>
                      {program.status || 'Interested'}
                    </span>
                  </div>
                  {program.faculty && <p className="text-xs md:text-sm text-slate-600 mb-1">{program.faculty}</p>}
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-[#EDEDED] text-center">
              <Link 
                href="/dashboard/application"
                className="text-red-800 hover:text-red-900 font-medium inline-flex items-center text-sm"
              >
                <i className="ri-edit-line mr-1"></i>
                Modify Program Selection
              </Link>
            </div>
          </div>
          
          {/* Documents Section */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base md:text-lg font-semibold text-slate-800">Required Documents</h2>
              <Link href="/dashboard/documents" className="text-xs md:text-sm text-red-800 hover:underline">
                See All
              </Link>
            </div>
            
            <div className="space-y-3">
              {requiredDocuments.map((document) => (
                <div key={document.id} className="p-3 border border-[#EDEDED] rounded-lg hover:border-[#780000]/30 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <div>
                      <h3 className="font-medium text-sm md:text-base">{document.name}</h3>
                      {document.date && (
                        <p className="text-xs text-slate-600 mt-1">
                          Uploaded on {document.date}
                        </p>
                      )}
                    </div>
                    {document.status === 'uploaded' ? (
                      <span className="flex items-center text-xs px-2 py-1 bg-green-50 text-green-700 rounded-full w-fit">
                        <i className="ri-check-line mr-1"></i>
                        Uploaded
                      </span>
                    ) : (
                      <Link 
                        href="/dashboard/documents"
                        className="min-h-[36px] text-sm px-4 py-2 border border-red-800 text-red-800 hover:bg-red-800 hover:text-white rounded-lg transition-colors w-fit flex items-center justify-center"
                      >
                        <i className="ri-upload-line mr-1"></i>
                        Upload
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Right Column */}
        <div className="space-y-6">
          {/* Application Checklist */}
          <div className="card">
            <h2 className="text-base md:text-lg font-semibold text-slate-800 mb-4">Application Checklist</h2>
            <div className="space-y-3">
              {applicationChecklist.map((item) => (
                <div key={item.id} className="flex items-start">
                  <div className={`mt-0.5 h-4 w-4 md:h-5 md:w-5 rounded-full flex items-center justify-center ${
                    item.completed 
                      ? 'bg-green-100' 
                      : item.available === false 
                        ? 'bg-gray-100' 
                        : 'bg-yellow-100'
                  }`}>
                    {item.completed ? (
                      <i className="ri-check-line text-green-600 text-xs"></i>
                    ) : item.available === false ? (
                      <span className="text-slate-600 text-xs">{item.id}</span>
                    ) : (
                      <i className="ri-time-line text-yellow-600 text-xs"></i>
                    )}
                  </div>
                  <div className="ml-3">
                    <p className="font-medium text-sm md:text-base">{item.title}</p>
                    <p className="text-xs text-slate-600">
                      {item.completed && item.date
                        ? `Completed on ${item.date}`
                        : item.deadline && !item.completed
                          ? `Due by ${item.deadline}`
                          : item.available === false
                            ? 'Not yet available'
                            : 'Pending'
                      }
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Need Help */}
          <div className="bg-[#780000]/5 rounded-lg p-3 md:p-4">
            <h3 className="font-semibold text-[#333333] text-sm md:text-base">Need Help?</h3>
            <p className="text-xs md:text-sm text-slate-600 mt-1">
              Our admission team is ready to assist you with your application.
            </p>
            <div className="mt-3 space-y-2">
              <div className="flex items-center text-xs md:text-sm">
                <i className="ri-phone-line w-4 md:w-5 text-[#780000]"></i>
                <span>+256 790 002 000</span>
              </div>
              <div className="flex items-center text-xs md:text-sm">
                <i className="ri-mail-line w-4 md:w-5 text-[#780000]"></i>
                <span>apply@iuea.ac.ug</span>
              </div>
              <div className="flex items-center text-xs md:text-sm">
                <i className="ri-whatsapp-line w-4 md:w-5 text-[#780000]"></i>
                <span>WhatsApp Support</span>
              </div>
              {userData?.whatsappNumber && (
                <div className="flex items-center text-xs md:text-sm bg-green-50 p-2 rounded">
                  <i className="ri-whatsapp-line w-4 md:w-5 text-green-600"></i>
                  <span className="text-green-700">Your Number: {userData.whatsappNumber}</span>
                  <i className="ri-check-line w-3 h-3 text-green-600 ml-1"></i>
                </div>
              )}
            </div>
            <button className="w-full mt-3 py-2 bg-[#780000] text-white rounded-lg text-xs md:text-sm font-medium hover:bg-[#600000] transition-colors">
              Contact Admission Office
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
