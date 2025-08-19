'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { studentApplicationService, Application } from '@/lib/applicationService';
import { useApplicationDocuments } from '@/hooks/useDocumentAccess';
import { useFileUpload } from '@/hooks/useFileUpload';
import { DocumentsSkeleton } from '@/components/skeletons/DocumentsSkeleton';

export default function DocumentsPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // File upload hook
  const { uploading, progress, error: uploadError, uploadApplicationDocument, reset } = useFileUpload({
    maxSizeInMB: 10,
    onSuccess: (result) => {
      console.log('Document uploaded successfully:', result);
      fetchApplications(); // Refresh applications after upload
      reset();
    },
    onError: (error) => {
      console.error('Upload failed:', error);
    }
  });

  // Create stable application object for the hook
  const stableApplication = useMemo(() => {
    return {
      id: selectedApplication?.id || '',
      passportPhoto: selectedApplication?.passportPhoto || '',
      academicDocuments: selectedApplication?.academicDocuments || '',
      identificationDocument: selectedApplication?.identificationDocument || ''
    };
  }, [selectedApplication]);

  // Document access hook for selected application - only when we have a valid application
  const shouldFetchDocuments = Boolean(selectedApplication?.id);
  const { documents, loading: documentsLoading, refetch } = useApplicationDocuments(
    shouldFetchDocuments ? stableApplication : { id: '', passportPhoto: '', academicDocuments: '', identificationDocument: '' }
  );

  // Document categories - matching our 3 document types
  const documentCategories: Array<{
    id: 'passportPhoto' | 'academicDocuments' | 'identificationDocument';
    name: string;
    key: string;
  }> = [
    { id: 'passportPhoto', name: 'Passport Photo', key: 'passportPhoto' },
    { id: 'academicDocuments', name: 'Academic Documents', key: 'academicDocuments' },
    { id: 'identificationDocument', name: 'Identification Documents', key: 'identificationDocument' },
  ];
  
  const [activeCategory, setActiveCategory] = useState<'passportPhoto' | 'academicDocuments' | 'identificationDocument'>('passportPhoto');

  const fetchApplications = useCallback(async () => {
    if (!user?.email) {
      console.log('📋 No user email available, setting loading to false');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      console.log('📋 Fetching applications for user:', user.email);
      const userApplications = await studentApplicationService.getApplicationsByEmail(user.email);
      console.log('📋 Applications fetched:', userApplications);
      setApplications(userApplications);
      
      // Auto-select first application if none selected
      if (userApplications.length > 0 && !selectedApplication) {
        console.log('📋 Auto-selecting first application:', userApplications[0]);
        setSelectedApplication(userApplications[0]);
      }
      
    } catch (err) {
      console.error('❌ Failed to fetch applications:', err);
      setError('Failed to load applications. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [user?.email, selectedApplication]);

  // Fetch applications when component mounts
  useEffect(() => {
    console.log('📋 useEffect triggered for fetchApplications');
    fetchApplications();
  }, [fetchApplications]);

  // Handle file selection and upload
  const handleFileUpload = async (documentType: 'passportPhoto' | 'academicDocuments' | 'identificationDocument') => {
    if (!selectedApplication || !user?.email) {
      alert('Please select an application first');
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = documentType === 'passportPhoto' 
      ? 'image/jpeg,image/jpg,image/png' 
      : 'application/pdf,image/jpeg,image/jpg,image/png,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const result = await uploadApplicationDocument(
          file,
          selectedApplication.id,
          documentType,
          user.email!
        );

        if (result) {
          // Update the selected application with the new document URL
          setSelectedApplication(prev => prev ? {
            ...prev,
            [documentType]: result.downloadURL
          } : null);
          
          // Refetch documents to get the latest URLs
          refetch();
        }
      } catch (error) {
        console.error('Upload failed:', error);
      }
    };

    input.click();
  };

  // Show loading skeleton - but always show navigation
  if (isLoading) {
    return (
      <div className="pb-20 md:pb-0">
        {/* Quick Navigation - Always visible */}
        <div className="mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
              className="bg-white rounded-lg p-4 border border-slate-200 hover:border-blue-800/30 transition-colors group"
            >
              <div className="flex items-center">
                <div className="h-10 w-10 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                  <i className="ri-file-list-3-line text-blue-800"></i>
                </div>
                <div className="ml-3">
                  <h3 className="font-medium text-slate-800">My Application</h3>
                  <p className="text-xs text-slate-600">Start or Edit</p>
                </div>
              </div>
            </Link>

            <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
              <div className="flex items-center">
                <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <i className="ri-file-upload-line text-green-800"></i>
                </div>
                <div className="ml-3">
                  <h3 className="font-medium text-green-800">Documents</h3>
                  <p className="text-xs text-green-600">Current Page</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <DocumentsSkeleton />
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="pb-20 md:pb-0">
        {/* Quick Navigation - Always visible */}
        <div className="mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
              className="bg-white rounded-lg p-4 border border-slate-200 hover:border-blue-800/30 transition-colors group"
            >
              <div className="flex items-center">
                <div className="h-10 w-10 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                  <i className="ri-file-list-3-line text-blue-800"></i>
                </div>
                <div className="ml-3">
                  <h3 className="font-medium text-slate-800">My Application</h3>
                  <p className="text-xs text-slate-600">Start or Edit</p>
                </div>
              </div>
            </Link>

            <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
              <div className="flex items-center">
                <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <i className="ri-file-upload-line text-green-800"></i>
                </div>
                <div className="ml-3">
                  <h3 className="font-medium text-green-800">Documents</h3>
                  <p className="text-xs text-green-600">Current Page</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <i className="ri-error-warning-line text-red-600 text-lg mr-3"></i>
            <div>
              <h3 className="font-medium text-red-800">Error Loading Documents</h3>
              <p className="text-red-700 text-sm">{error}</p>
              <button 
                onClick={fetchApplications}
                className="mt-2 text-sm text-red-800 hover:text-red-900 underline"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show no applications state
  if (applications.length === 0) {
    return (
      <div className="pb-20 md:pb-0">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl md:text-2xl font-bold text-slate-800">Documents</h1>
          <p className="text-sm md:text-base text-slate-600">
            Upload and manage your application documents
          </p>
        </div>

        {/* Navigation Card */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">Quick Navigation</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link 
              href="/dashboard" 
              className="flex items-center p-3 border border-slate-200 rounded-lg hover:border-red-800/30 transition-colors group"
            >
              <div className="h-10 w-10 bg-red-50 rounded-lg flex items-center justify-center group-hover:bg-red-100 transition-colors mr-3">
                <i className="ri-dashboard-line text-red-800"></i>
              </div>
              <div>
                <h3 className="font-medium text-slate-800">Dashboard</h3>
                <p className="text-xs text-slate-600">View overview</p>
              </div>
            </Link>
            <Link 
              href="/dashboard/application" 
              className="flex items-center p-3 border border-slate-200 rounded-lg hover:border-blue-800/30 transition-colors group"
            >
              <div className="h-10 w-10 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors mr-3">
                <i className="ri-file-list-3-line text-blue-800"></i>
              </div>
              <div>
                <h3 className="font-medium text-slate-800">My Application</h3>
                <p className="text-xs text-slate-600">Start application</p>
              </div>
            </Link>
          </div>
        </div>

        {/* No Applications Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <div className="max-w-md mx-auto">
            <i className="ri-file-list-line text-4xl text-blue-600 mb-4"></i>
            <h3 className="text-lg font-medium text-slate-800 mb-2">No Application Found</h3>
            <p className="text-slate-600 mb-6">
              You need to create and submit an application before you can upload documents. 
              Documents are linked to your application and help support your admission process.
            </p>
            
            <div className="space-y-3">
              <Link 
                href="/dashboard/application"
                className="inline-flex items-center px-6 py-3 bg-red-800 text-white rounded-lg hover:bg-red-900 transition-colors font-medium"
              >
                <i className="ri-add-line mr-2"></i>
                Start My Application
              </Link>
              <p className="text-xs text-slate-500">
                Once your application is created, you can return here to upload required documents
              </p>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-6 bg-white border border-slate-200 rounded-lg p-6">
          <h3 className="font-medium text-slate-800 mb-3">
            <i className="ri-question-line mr-2"></i>
            What documents will I need?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center mb-2">
                <i className="ri-image-line text-slate-600 mr-2"></i>
                <span className="font-medium text-sm">Passport Photo</span>
              </div>
              <p className="text-xs text-slate-600">Recent passport-style photograph with plain background</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center mb-2">
                <i className="ri-file-text-line text-slate-600 mr-2"></i>
                <span className="font-medium text-sm">Academic Documents</span>
              </div>
              <p className="text-xs text-slate-600">Transcripts, certificates, and academic records</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center mb-2">
                <i className="ri-id-card-line text-slate-600 mr-2"></i>
                <span className="font-medium text-sm">Identification</span>
              </div>
              <p className="text-xs text-slate-600">National ID, passport, or government-issued ID</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Get document info for the active category
  const getDocumentInfo = (category: string) => {
    const application = selectedApplication;
    if (!application) return null;

    switch (category) {
      case 'passportPhoto':
        return {
          name: 'Passport Photo',
          description: 'Upload a recent passport-style photograph. The photo should be clear, with good lighting, showing your full face against a plain background.',
          fileTypes: 'JPG, JPEG, PNG',
          maxSize: '5MB',
          isRequired: true,
          uploadedUrl: documents?.passportPhotoUrl,
          hasDocument: !!application.passportPhoto
        };
      case 'academicDocuments':
        return {
          name: 'Academic Documents',
          description: 'Upload transcripts, certificates, diplomas, or academic records from previous institutions.',
          fileTypes: 'PDF, DOC, DOCX, JPG, JPEG, PNG',
          maxSize: '10MB',
          isRequired: true,
          uploadedUrl: documents?.academicDocumentsUrl,
          hasDocument: !!application.academicDocuments
        };
      case 'identificationDocument':
        return {
          name: 'Identification Document',
          description: 'Upload passport, national ID, or other government-issued identification.',
          fileTypes: 'PDF, DOC, DOCX, JPG, JPEG, PNG',
          maxSize: '10MB',
          isRequired: true,
          uploadedUrl: documents?.identificationDocumentUrl,
          hasDocument: !!application.identificationDocument
        };
      default:
        return null;
    }
  };

  const documentInfo = getDocumentInfo(activeCategory);
  const uploadedCount = [
    selectedApplication?.passportPhoto,
    selectedApplication?.academicDocuments,
    selectedApplication?.identificationDocument
  ].filter(Boolean).length;

  return (
    <div className="pb-20 md:pb-0">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-slate-800">Application Documents</h1>
        <p className="text-sm md:text-base text-slate-800/70">
          Upload the required documents for your admission application. All documents must be clear and legible.
        </p>
      </div>

      {/* Quick Navigation */}
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
          className="bg-white rounded-lg p-4 border border-slate-200 hover:border-blue-800/30 transition-colors group"
        >
          <div className="flex items-center">
            <div className="h-10 w-10 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
              <i className="ri-file-list-3-line text-blue-800"></i>
            </div>
            <div className="ml-3">
              <h3 className="font-medium text-slate-800">My Application</h3>
              <p className="text-xs text-slate-600">Edit & Update</p>
            </div>
          </div>
        </Link>

        <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
          <div className="flex items-center">
            <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
              <i className="ri-file-upload-line text-green-800"></i>
            </div>
            <div className="ml-3">
              <h3 className="font-medium text-green-800">Documents</h3>
              <p className="text-xs text-green-600">Current Page</p>
            </div>
          </div>
        </div>
      </div>

      {/* Application Selector */}
      {applications.length > 1 && (
        <div className="bg-white rounded-lg p-4 border border-slate-200 mb-6">
          <label className="block text-sm font-medium text-slate-800 mb-2">
            Select Application
          </label>
          <select 
            value={selectedApplication?.id || ''}
            onChange={(e) => {
              const app = applications.find(a => a.id === e.target.value);
              setSelectedApplication(app || null);
            }}
            className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          >
            {applications.map((app) => (
              <option key={app.id} value={app.id}>
                {app.preferredProgram} - {app.preferredIntake} ({app.status})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Documents Status Summary */}
      <div className="bg-white rounded-lg p-4 border border-slate-200 mb-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <span className="text-slate-600 text-xs block mb-1">Required</span>
            <div className="text-2xl font-bold text-slate-800">3</div>
            <p className="text-xs text-slate-600">Documents</p>
          </div>
          
          <div className="text-center">
            <span className="text-slate-600 text-xs block mb-1">Uploaded</span>
            <div className="text-2xl font-bold text-green-600">{uploadedCount}</div>
            <p className="text-xs text-slate-600">Documents</p>
          </div>
          
          <div className="text-center">
            <span className="text-slate-600 text-xs block mb-1">Pending</span>
            <div className="text-2xl font-bold text-yellow-600">{3 - uploadedCount}</div>
            <p className="text-xs text-slate-600">Documents</p>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium">Required Documents Progress</span>
            <span className="text-slate-600">{uploadedCount}/3</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-3">
            <div 
              className="bg-red-800 h-3 rounded-full transition-all duration-300" 
              style={{ width: `${(uploadedCount / 3) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Document Categories Tabs */}
      <div className="bg-white rounded-lg overflow-hidden mb-6 border border-slate-200">
        <div className="flex overflow-x-auto scrollbar-hide">
          {documentCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`flex-1 min-w-0 px-3 py-4 text-sm font-medium transition-colors whitespace-nowrap border-b-2 ${
                activeCategory === category.id
                  ? 'text-red-800 border-red-800 bg-red-50'
                  : 'text-slate-600 border-transparent hover:text-red-800 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <span className="truncate">{category.name}</span>
                {selectedApplication && selectedApplication[category.key as keyof Application] && (
                  <i className="ri-check-line text-green-600 text-sm"></i>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Document Display */}
      {documentInfo && (
        <div className="bg-white rounded-lg p-4 border border-slate-200">
          <div className="flex flex-col gap-4">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <h3 className="font-medium text-base flex items-center">
                    {documentInfo.name}
                    <span className="text-red-600 ml-1">*</span>
                  </h3>
                  {documentInfo.hasDocument && (
                    <span className="text-xs px-2 py-0.5 bg-green-50 text-green-700 rounded-full flex items-center w-fit">
                      <i className="ri-check-line mr-1"></i>
                      Uploaded
                    </span>
                  )}
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2">
                  {documentInfo.hasDocument && documentInfo.uploadedUrl ? (
                    <>
                      <a 
                        href={documentInfo.uploadedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center px-4 py-3 bg-slate-100 text-slate-800 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium min-h-[44px]"
                      >
                        <i className="ri-eye-line mr-2"></i>
                        View Document
                      </a>
                      <button 
                        onClick={() => handleFileUpload(activeCategory)}
                        disabled={uploading}
                        className="flex items-center justify-center px-4 py-3 border border-red-800 text-red-800 hover:bg-red-800 hover:text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                      >
                        <i className="ri-upload-line mr-2"></i>
                        Replace Document
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={() => handleFileUpload(activeCategory)}
                      disabled={uploading}
                      className="flex items-center justify-center px-4 py-3 bg-red-800 text-white rounded-lg hover:bg-red-900 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] w-full sm:w-auto"
                    >
                      {uploading ? (
                        <>
                          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <i className="ri-upload-line mr-2"></i>
                          Upload Document
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
              
              <p className="text-sm text-slate-800/70 mb-3">{documentInfo.description}</p>
              
              {/* File requirements */}
              <div className="bg-slate-50 rounded-lg p-3 mb-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center">
                    <i className="ri-file-line text-slate-500 mr-2"></i>
                    <span className="text-slate-600">
                      <strong>Formats:</strong> {documentInfo.fileTypes}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <i className="ri-database-line text-slate-500 mr-2"></i>
                    <span className="text-slate-600">
                      <strong>Max Size:</strong> {documentInfo.maxSize}
                    </span>
                  </div>
                </div>
              </div>

              {/* Upload Progress */}
              {uploading && progress && (
                <div className="bg-blue-50 rounded-lg p-3 mb-3">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-blue-800">Uploading...</span>
                    <span className="text-blue-600">{Math.round(progress.percentage)}%</span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress.percentage}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Upload Error */}
              {uploadError && (
                <div className="bg-red-50 rounded-lg p-3 mb-3">
                  <div className="flex items-center text-red-800">
                    <i className="ri-error-warning-line mr-2"></i>
                    <span className="text-sm">{uploadError}</span>
                  </div>
                </div>
              )}
              
              {/* Document Preview */}
              {documentsLoading ? (
                <div className="bg-slate-50 rounded-lg p-8 text-center">
                  <div className="animate-spin w-6 h-6 border-2 border-slate-300 border-t-red-600 rounded-full mx-auto mb-2"></div>
                  <p className="text-sm text-slate-600">Loading document...</p>
                </div>
              ) : documentInfo.uploadedUrl ? (
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-slate-800">Document Preview</span>
                    <a 
                      href={documentInfo.uploadedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                    >
                      <i className="ri-external-link-line mr-1"></i>
                      Open in new tab
                    </a>
                  </div>
                  
                  {/* Image preview for photos */}
                  {activeCategory === 'passportPhoto' && documentInfo.uploadedUrl ? (
                    <div className="max-w-xs mx-auto">
                      <Image 
                        src={documentInfo.uploadedUrl}
                        alt="Passport Photo"
                        width={300}
                        height={400}
                        className="w-full rounded-lg shadow-sm"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  ) : (
                    /* Document icon for PDFs and other docs */
                    <div className="text-center py-8">
                      <i className="ri-file-text-line text-4xl text-slate-400 mb-2"></i>
                      <p className="text-sm text-slate-600">Document uploaded successfully</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-yellow-50 rounded-lg p-3">
                  <div className="flex items-center text-yellow-800">
                    <i className="ri-alert-line mr-2"></i>
                    <span className="text-sm">This document is required for your application.</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Submit Documents Button */}
      <div className="mt-6">
        <div className="bg-slate-50 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className={`w-4 h-4 rounded-full mr-3 flex items-center justify-center ${
                uploadedCount === 3 ? 'bg-green-600' : 'bg-yellow-600'
              }`}>
                <i className={`ri-${uploadedCount === 3 ? 'check' : 'alert'}-line text-white text-xs`}></i>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800">
                  {uploadedCount === 3 ? 'All required documents uploaded!' : 'Some required documents are still pending'}
                </p>
                <p className="text-xs text-slate-600">
                  {uploadedCount}/3 required documents completed
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col gap-3">
          <Link
            href="/dashboard/application"
            className="w-full px-4 py-3 text-sm border border-slate-200 text-slate-800 rounded-lg hover:border-red-800 hover:text-red-800 transition-colors text-center font-medium min-h-[44px] flex items-center justify-center"
          >
            <i className="ri-arrow-left-line mr-2"></i>
            Back to Application
          </Link>
          <button
            disabled={uploadedCount !== 3}
            className={`w-full px-4 py-3 text-sm rounded-lg transition-colors font-medium min-h-[44px] flex items-center justify-center ${
              uploadedCount === 3
                ? 'bg-red-800 text-white hover:bg-red-900'
                : 'bg-slate-200 text-slate-500 cursor-not-allowed'
            }`}
          >
            {uploadedCount === 3 ? (
              <>
                <i className="ri-check-line mr-2"></i>
                Documents Complete!
              </>
            ) : (
              <>
                <i className="ri-alert-line mr-2"></i>
                Complete Required Documents First
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}