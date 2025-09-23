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

  // Calculate missing documents for specific next action
  const missingDocuments = requiredDocuments.filter(doc => doc.status === 'pending');
  
  // Create specific next action message based on missing documents
  const getSpecificNextAction = () => {
    if (!applicationData) {
      return 'Start Your Application';
    }
    
    if (missingDocuments.length === 0) {
      return 'All Documents Submitted - Under Review';
    }
    
    if (missingDocuments.length === 1) {
      return `Upload Missing: ${missingDocuments[0].name}`;
    }
    
    if (missingDocuments.length === 2) {
      return `Upload Missing: ${missingDocuments[0].name} & ${missingDocuments[1].name}`;
    }
    
    // All 3 documents missing
    return 'Upload All Required Documents';
  };

  // Update application status with specific next action
  const applicationStatus = applicationData ? (() => {
    const progress = studentApplicationService.calculateProgress(applicationData);
    
    // Calculate deadline as 7 days after application submission
    const submissionDate = new Date(applicationData.submittedAt);
    const deadlineDate = new Date(submissionDate);
    deadlineDate.setDate(deadlineDate.getDate() + 7);
    const formattedDeadline = deadlineDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
    
    console.log('📅 Deadline calculation:', {
      submissionDate: submissionDate.toISOString(),
      submissionDateLocal: submissionDate.toLocaleDateString(),
      deadlineDate: deadlineDate.toISOString(),
      deadlineDateLocal: deadlineDate.toLocaleDateString(),
      formattedDeadline,
      applicationData: applicationData.submittedAt
    });
    
    return {
      status: progress.status,
      statusColor: progress.statusColor,
      statusBgColor: progress.statusBgColor,
      completedSteps: progress.completedSteps,
      totalSteps: progress.totalSteps,
      nextAction: getSpecificNextAction(), // Use our specific next action
      progressPercentage: progress.progressPercentage,
      deadline: formattedDeadline
    };
  })() : {
    status: 'Not Started',
    statusColor: 'text-gray-800',
    statusBgColor: 'bg-gray-100',
    completedSteps: 0,
    totalSteps: 5,
    nextAction: 'Start Your Application',
    progressPercentage: 0,
    deadline: null // No deadline until application is submitted
  };

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
      completed: true, // Always completed since user is logged in
      date: user?.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'Completed'
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
      // Dynamic deadline - 7 days after application submission, or null if no application
      deadline: applicationData 
        ? (() => {
            const submissionDate = new Date(applicationData.submittedAt);
            const deadlineDate = new Date(submissionDate);
            deadlineDate.setDate(deadlineDate.getDate() + 7);
            return deadlineDate.toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric' 
            });
          })()
        : null // No deadline until application is submitted
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
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto p-4 lg:p-8">
        {/* Clean Header */}
        <div className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-2">
            Welcome back, {userData?.firstName || user.displayName || 'Student'}! 👋
          </h1>
          <p className="text-slate-600 text-lg">
            Track your application progress and manage your admission process
          </p>
        </div>

        {/* Application Status - Hero Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 lg:p-8 mb-8">
          {applicationsError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <i className="ri-error-warning-line text-red-500 mr-2"></i>
                <p className="text-red-800 font-medium">{applicationsError}</p>
              </div>
              <button 
                onClick={refreshApplicationData}
                className="text-red-600 hover:text-red-800 mt-2 text-sm underline"
              >
                Try again
              </button>
            </div>
          )}
          
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <i className="ri-graduation-cap-line text-red-600 text-xl"></i>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Application Status</h2>
                  <p className="text-slate-600">
                    {applicationData ? `${applicationData.preferredIntake} Intake 2025` : 'August Intake 2025'}
                  </p>
                </div>
              </div>
              
              {/* Progress Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-700 font-medium">Application Progress</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={refreshApplicationData}
                      disabled={isRefreshing}
                      className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors disabled:opacity-50"
                      title="Refresh application data"
                    >
                      <i className={`ri-refresh-line ${isRefreshing ? 'animate-spin' : ''}`}></i>
                    </button>
                    <span 
                      className={`px-3 py-1 rounded-full text-sm font-medium ${applicationStatus.statusBgColor} ${applicationStatus.statusColor}`}
                    >
                      {applicationStatus.status}
                    </span>
                  </div>
                </div>
                
                <div className="w-full bg-slate-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-red-600 to-red-800 h-3 rounded-full transition-all duration-500 ease-out relative overflow-hidden" 
                    style={{ width: `${Math.max(0, Math.min(100, applicationStatus.progressPercentage))}%` }}
                  >
                    <div className="absolute inset-0 bg-white opacity-20 animate-pulse"></div>
                  </div>
                </div>
                
                <div className="flex justify-between text-sm text-slate-600">
                  <span>{applicationStatus.completedSteps}/{applicationStatus.totalSteps} steps completed</span>
                  <span>{applicationStatus.progressPercentage}% complete</span>
                </div>
              </div>
            </div>
            
            {/* Next Action CTA */}
            <div className="lg:w-80">
              <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200">
                <div className="text-center mb-4">
                  <i className="ri-arrow-right-circle-line text-red-600 text-2xl mb-2"></i>
                  <h3 className="font-bold text-slate-900 mb-1">Next Step</h3>
                  <p className="text-slate-700 font-medium">{applicationStatus.nextAction}</p>
                  {applicationStatus.deadline && (
                    <p className="text-sm text-slate-600 mt-1">
                      <i className="ri-calendar-line mr-1"></i>
                      Deadline: {applicationStatus.deadline}
                    </p>
                  )}
                  {applicationData && (
                    <p className="text-xs text-slate-500 mt-1">
                      (7 days from submission: {new Date(applicationData.submittedAt).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })})
                    </p>
                  )}
                </div>
                
                {applicationData ? (
                  <Link 
                    href="/dashboard/documents" 
                    className="w-full h-12 px-6 bg-[#780000] hover:bg-[#600000] text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    <i className="ri-folder-line"></i>
                    Manage Documents
                  </Link>
                ) : (
                  <Link 
                    href="/dashboard/application" 
                    className="w-full h-12 px-6 bg-[#780000] hover:bg-[#600000] text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    <i className="ri-play-line"></i>
                    Start Application
                  </Link>
                )}
              </div>
            </div>
          </div>
          
          {applicationData && (
            <div className="mt-4 text-xs text-slate-500 flex items-center">
              <i className="ri-time-line mr-1"></i>
              Last updated: {new Date(applicationData.updatedAt).toLocaleString()}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link 
            href="/dashboard/application" 
            className="bg-white rounded-xl p-6 border border-slate-200 hover:border-red-300 hover:shadow-md transition-all group"
          >
            <div className="flex items-center mb-3">
              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <i className="ri-file-list-3-line text-blue-600"></i>
              </div>
              <div className="ml-3">
                <h3 className="font-semibold text-slate-900">My Application</h3>
                <p className="text-sm text-slate-600">{applicationData ? 'Edit & Update' : 'Start Application'}</p>
              </div>
            </div>
          </Link>

          <Link 
            href="/dashboard/documents" 
            className="bg-white rounded-xl p-6 border border-slate-200 hover:border-green-300 hover:shadow-md transition-all group"
          >
            <div className="flex items-center mb-3">
              <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <i className="ri-file-upload-line text-green-600"></i>
              </div>
              <div className="ml-3">
                <h3 className="font-semibold text-slate-900">Documents</h3>
                <p className="text-sm text-slate-600">Upload & Manage</p>
              </div>
            </div>
          </Link>

          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <div className="flex items-center mb-3">
              <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <i className="ri-customer-service-line text-purple-600"></i>
              </div>
              <div className="ml-3">
                <h3 className="font-semibold text-slate-900">Get Help</h3>
                <p className="text-sm text-slate-600">Contact Support</p>
              </div>
            </div>
            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex items-center">
                <i className="ri-phone-line w-4 text-purple-600 mr-2"></i>
                <span>+256 790 002 000</span>
              </div>
              <div className="flex items-center">
                <i className="ri-mail-line w-4 text-purple-600 mr-2"></i>
                <span>apply@iuea.ac.ug</span>
              </div>
            </div>
          </div>
        </div>


        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Primary Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Application Checklist - Prominent */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center mb-6">
                <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <i className="ri-checkbox-line text-green-600"></i>
                </div>
                <h2 className="text-xl font-bold text-slate-900">Application Checklist</h2>
              </div>
              
              <div className="space-y-4">
                {applicationChecklist.map((item) => (
                  <div key={item.id} className="flex items-center p-4 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center mr-4 ${
                      item.completed 
                        ? 'bg-green-100 text-green-600' 
                        : item.available === false 
                          ? 'bg-slate-100 text-slate-400' 
                          : 'bg-yellow-100 text-yellow-600'
                    }`}>
                      {item.completed ? (
                        <i className="ri-check-line text-sm font-bold"></i>
                      ) : item.available === false ? (
                        <span className="text-xs font-bold">{item.id}</span>
                      ) : (
                        <i className="ri-time-line text-sm"></i>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">{item.title}</h3>
                      <p className="text-sm text-slate-600">
                        {item.completed && item.date
                          ? `✓ Completed on ${item.date}`
                          : item.deadline && !item.completed
                            ? `📅 Due by ${item.deadline}${item.title === 'Upload Documents' && applicationData ? ` (7 days from application)` : ''}`
                            : item.available === false
                              ? '⏳ Not yet available'
                              : '⏳ Pending'
                        }
                      </p>
                    </div>
                    {!item.completed && item.available !== false && (
                      <i className="ri-arrow-right-line text-slate-400"></i>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Programs Section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <i className="ri-book-line text-blue-600"></i>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">Program Selection</h2>
                </div>
                <Link 
                  href="/dashboard/application"
                  className="text-red-600 hover:text-red-700 font-medium text-sm flex items-center"
                >
                  <i className="ri-edit-line mr-1"></i>
                  Modify
                </Link>
              </div>
              
              <div className="space-y-3">
                {programsOfInterest.map((program) => (
                  <div key={program.id} className="p-4 border border-slate-200 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-slate-900">{program.name}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        program.status === 'Applied' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {program.status || 'Interested'}
                      </span>
                    </div>
                    {program.faculty && <p className="text-sm text-slate-600">{program.faculty}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Right Column - Secondary Content */}
          <div className="space-y-6">
            {/* Documents Status */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                    <i className="ri-file-list-line text-orange-600"></i>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">Documents</h2>
                </div>
                <Link href="/dashboard/documents" className="text-red-600 hover:text-red-700 text-sm font-medium">
                  View All
                </Link>
              </div>
              
              <div className="space-y-3">
                {requiredDocuments.map((document) => (
                  <div key={document.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                    <div>
                      <h3 className="font-medium text-slate-900 text-sm">{document.name}</h3>
                      {document.date && (
                        <p className="text-xs text-slate-600 mt-1">
                          Uploaded {document.date}
                        </p>
                      )}
                    </div>
                    {document.status === 'uploaded' ? (
                      <div className="flex items-center text-green-600">
                        <i className="ri-check-circle-fill"></i>
                      </div>
                    ) : (
                      <Link 
                        href="/dashboard/documents"
                        className="text-red-600 hover:text-red-700 p-1"
                      >
                        <i className="ri-upload-line"></i>
                      </Link>
                    )}
                  </div>
                ))}
              </div>
              
              <Link 
                href="/dashboard/documents"
                className="w-full mt-4 h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors flex items-center justify-center"
              >
                <i className="ri-folder-open-line mr-2"></i>
                Manage All Documents
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
