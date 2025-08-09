'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function Dashboard() {
  const router = useRouter();
  const { user, userData, loading, checkEmailVerification } = useAuth();

  useEffect(() => {
    // If not loading and no user, redirect to login
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    // If user exists, check email verification status
    if (user && !loading) {
      // Check if user is verified in Firebase Auth but not in our userData
      if (user.emailVerified && userData && !userData.emailVerified) {
        // Force a verification check to sync Firestore
        checkEmailVerification().then((isVerified) => {
          if (!isVerified) {
            router.push('/verify-email');
          }
        });
      } else if (!user.emailVerified) {
        // If user is not verified in Firebase Auth, redirect to verification
        router.push('/verify-email');
        return;
      }
    }
  }, [user, userData, loading, router, checkEmailVerification]);

  // Show loading while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#780000]"></div>
      </div>
    );
  }

  // Don't render anything if user is not authenticated or email not verified
  if (!user || !user.emailVerified) {
    return null;
  }

  // Application status and checklist items
  const applicationStatus = {
    status: 'In Progress',
    completedSteps: 3,
    totalSteps: 5,
    nextAction: 'Upload Academic Transcripts',
    deadline: 'Aug 30, 2025'
  };
  
  // Required documents
  const requiredDocuments = [
    { id: 1, name: 'National ID / Passport', status: 'uploaded', date: 'Aug 2, 2025' },
    { id: 2, name: 'High School Diploma', status: 'uploaded', date: 'Aug 3, 2025' },
    { id: 3, name: 'Academic Transcripts', status: 'pending', date: null },
    { id: 4, name: 'Passport Photo', status: 'uploaded', date: 'Aug 2, 2025' },
    { id: 5, name: 'Recommendation Letter', status: 'pending', date: null },
  ];

  // Programs of interest
  const programsOfInterest = [
    { id: 1, name: 'Bachelor of Science in Computer Science', faculty: 'Faculty of Computing & Engineering', deadline: 'Sep 15, 2025', tuition: '$2,500 / semester' },
    { id: 2, name: 'Bachelor of Business Administration', faculty: 'Faculty of Business & Management', deadline: 'Sep 15, 2025', tuition: '$2,300 / semester' },
  ];

  // Admission announcements
  const admissionAnnouncements = [
    { id: 1, title: 'Fall 2025 Application Deadline Extended', date: 'Aug 5, 2025', type: 'Important' },
    { id: 2, title: 'Required Documents Submission Reminder', date: 'Aug 3, 2025', type: 'Reminder' },
    { id: 3, title: 'New Programs Added for Fall Intake', date: 'Aug 1, 2025', type: 'Update' },
  ];

  return (
    <div className="p-4 md:p-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-slate-800">Student Portal</h1>
        <p className="text-sm md:text-base text-slate-600">
          Welcome back, {userData?.firstName || user.displayName || 'Student'}!
        </p>
      </div>

      {/* Application Status */}
      <div className="bg-white rounded-lg p-3 md:p-4 border border-[#EDEDED] mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
          <div>
            <h2 className="text-base md:text-lg font-semibold text-slate-800">Application Status</h2>
            <p className="text-xs md:text-sm text-slate-600 mt-1">Fall Semester 2025</p>
          </div>
          
          <div className="flex items-center">
            <span 
              className={`px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-medium
                ${applicationStatus.status === 'In Progress' 
                  ? 'bg-yellow-100 text-yellow-800' 
                  : applicationStatus.status === 'Submitted' 
                  ? 'bg-blue-100 text-blue-800'
                  : applicationStatus.status === 'Approved' 
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
                }`}
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
              className="bg-[#780000] h-2.5 rounded-full" 
              style={{ width: `${(applicationStatus.completedSteps / applicationStatus.totalSteps) * 100}%` }}
            ></div>
          </div>
        </div>
        
        {/* Next action */}
        <div className="mt-3 md:mt-4 p-3 bg-red-50 rounded-lg border-l-4 border-red-800 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div>
            <p className="font-medium text-sm md:text-base">Next Step: {applicationStatus.nextAction}</p>
            <p className="text-xs md:text-sm text-slate-600 mt-1">
              <i className="ri-calendar-line mr-1"></i>
              Deadline: {applicationStatus.deadline}
            </p>
          </div>
          <Link 
            href="/dashboard/documents" 
            className="px-3 md:px-4 py-2 bg-[#780000] text-white rounded-lg text-xs md:text-sm font-medium hover:bg-[#600000] transition-colors whitespace-nowrap text-center"
          >
            Upload Now
          </Link>
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
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full w-fit">Interested</span>
                  </div>
                  <p className="text-xs md:text-sm text-slate-600 mb-1">{program.faculty}</p>
                  <div className="flex flex-col sm:flex-row sm:justify-between text-xs mt-2 text-slate-500 gap-1">
                    <div className="flex items-center">
                      <i className="ri-calendar-line mr-1"></i>
                      <span>Application Deadline: {program.deadline}</span>
                    </div>
                    <div className="flex items-center">
                      <i className="ri-money-dollar-circle-line mr-1"></i>
                      <span>{program.tuition}</span>
                    </div>
                  </div>
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
                      <button className="text-xs px-3 py-1 border border-red-800 text-red-800 hover:bg-red-800 hover:text-white rounded-full transition-colors w-fit">
                        Upload
                      </button>
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
              <div className="flex items-start">
                <div className="mt-0.5 h-4 w-4 md:h-5 md:w-5 rounded-full bg-green-100 flex items-center justify-center">
                  <i className="ri-check-line text-green-600 text-xs"></i>
                </div>
                <div className="ml-3">
                  <p className="font-medium text-sm md:text-base">Create Account</p>
                  <p className="text-xs text-slate-600">Completed on Aug 1, 2025</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="mt-0.5 h-4 w-4 md:h-5 md:w-5 rounded-full bg-green-100 flex items-center justify-center">
                  <i className="ri-check-line text-green-600 text-xs"></i>
                </div>
                <div className="ml-3">
                  <p className="font-medium text-sm md:text-base">Personal Information</p>
                  <p className="text-xs text-slate-600">Completed on Aug 2, 2025</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="mt-0.5 h-4 w-4 md:h-5 md:w-5 rounded-full bg-green-100 flex items-center justify-center">
                  <i className="ri-check-line text-green-600 text-xs"></i>
                </div>
                <div className="ml-3">
                  <p className="font-medium text-sm md:text-base">Select Programs</p>
                  <p className="text-xs text-slate-600">Completed on Aug 3, 2025</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="mt-0.5 h-4 w-4 md:h-5 md:w-5 rounded-full bg-yellow-100 flex items-center justify-center">
                  <i className="ri-time-line text-yellow-600 text-xs"></i>
                </div>
                <div className="ml-3">
                  <p className="font-medium text-sm md:text-base">Upload Documents</p>
                  <p className="text-xs text-slate-600">Due by Aug 30, 2025</p>
                </div>
              </div>
              
              <div className="flex items-start opacity-50">
                <div className="mt-0.5 h-4 w-4 md:h-5 md:w-5 rounded-full bg-[#EDEDED] flex items-center justify-center">
                  <span className="text-slate-600 text-xs">5</span>
                </div>
                <div className="ml-3">
                  <p className="font-medium text-sm md:text-base">Pay Application Fee</p>
                  <p className="text-xs text-slate-600">Not yet available</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Announcements */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base md:text-lg font-semibold text-[#333333]">Announcements</h2>
              <button className="text-xs md:text-sm text-[#780000] hover:underline">
                View All
              </button>
            </div>
            
            <div className="space-y-3">
              {admissionAnnouncements.map((announcement) => (
                <div key={announcement.id} className="p-3 border border-[#EDEDED] rounded-lg hover:border-[#780000]/30 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-1 gap-1">
                    <span 
                      className={`text-xs px-2 py-0.5 rounded-full w-fit ${
                        announcement.type === 'Important' 
                          ? 'bg-red-100 text-red-700' 
                          : announcement.type === 'Reminder'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {announcement.type}
                    </span>
                    <span className="text-xs text-[#333333]/60">{announcement.date}</span>
                  </div>
                  <h3 className="font-medium text-sm md:text-base">{announcement.title}</h3>
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
                <span>+256 702 000000</span>
              </div>
              <div className="flex items-center text-xs md:text-sm">
                <i className="ri-mail-line w-4 md:w-5 text-[#780000]"></i>
                <span>admissions@iuea.ac.ug</span>
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
