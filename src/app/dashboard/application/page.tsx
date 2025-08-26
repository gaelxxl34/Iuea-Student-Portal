'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import PhoneInput from 'react-phone-number-input';
import { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { useAuth } from '@/contexts/AuthContext';
import { studentApplicationService, type Application, type StudentApplicationData } from '@/lib/applicationService';
import { ApplicationSkeleton, ApplicationViewSkeleton } from '@/components/skeletons/ApplicationSkeleton';
import { ToastContainer, useToast } from '@/components/Toast';
import ProgressIndicator from '@/components/ui/progress-indicator';
import { FileSizePreview } from '@/components/FileSizePreview';
import { useUploadProgress } from '@/hooks/useUploadProgress';
import { compressApplicationDocuments } from '@/lib/fileCompressionService';
import metaPixel from '@/lib/metaPixel';

// Form data interface for the application form
interface FormData {
  // Basic personal information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  countryOfBirth: string;
  gender: string;
  postalAddress: string;
  
  // Academic preferences
  program: string;
  modeOfStudy: string;
  intake: string;
  
  // Additional fields
  sponsorTelephone: string;
  sponsorEmail: string;
  howDidYouHear: string;
  additionalNotes: string;
}

// Extended application type with progress
interface ApplicationWithProgress extends Application {
  progress?: {
    completedSteps: number;
    totalSteps: number;
    progressPercentage: number;
    status: string;
    statusColor: string;
    statusBgColor: string;
    nextAction: string;
  };
}

// Helper type for user data with optional phone fields
interface UserDataWithOptionalPhone {
  firstName?: string;
  lastName?: string;
  email?: string;
  whatsappNumber?: string;
  phoneNumber?: string;
  phone?: string;
}

export default function ApplicationPage() {
  const { user, userData, refreshUser } = useAuth();
  const { toasts, removeToast, showSuccess, showError, showWarning } = useToast();
  const { progress, startProgress, updateFileProgress, updateStage, reset: resetProgress } = useUploadProgress();
  
  // Application form sections - matching frontend structure exactly
  const formSections = [
    { id: 'personal', name: 'Personal Details', completed: false },
    { id: 'program', name: 'Program Selection', completed: false },
    { id: 'additional', name: 'Additional Information', completed: false },
  ];
  
  const [activeSection, setActiveSection] = useState('personal');
  const [isEditing, setIsEditing] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Application status management
  const [submittedApplication, setSubmittedApplication] = useState<ApplicationWithProgress | null>(null);
  const [isLoadingApplication, setIsLoadingApplication] = useState(false);
  const [applicationMode, setApplicationMode] = useState<'form' | 'view'>('form'); // form = editing, view = viewing submitted
  
  // File state for documents
  const [files, setFiles] = useState<{
    passportPhoto?: File;
    academicDocuments: File[];
    identificationDocuments: File[];
  }>({
    academicDocuments: [],
    identificationDocuments: [],
  });
  
  // Application data state
  const [applicationData, setApplicationData] = useState<FormData>(() => {
    // Initialize with user data if available
    const initialData: FormData = {
      // Personal Details - will be populated from user data
      firstName: userData?.firstName || '',
      lastName: userData?.lastName || '',
      email: userData?.email || user?.email || '',
      phone: userData?.whatsappNumber || '',
      countryOfBirth: '',
      gender: '',
      postalAddress: '',
      
      // Program Selection
      program: '',
      modeOfStudy: '',
      intake: '',
      
      // Additional Information
      sponsorTelephone: '',
      sponsorEmail: '',
      howDidYouHear: '',
      additionalNotes: '',
    };
    
    console.log('🎯 Initializing application data:', initialData);
    return initialData;
  });

  // Pre-populate form with user data when available
  useEffect(() => {
    if (userData && userData.email) {
      console.log('📋 Pre-populating form with user data:', userData);
      console.log('📋 WhatsApp Number from userData:', userData.whatsappNumber);
      console.log('📋 All userData fields:', Object.keys(userData));
      
      setApplicationData(prev => ({
        ...prev,
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        email: userData.email || '',
        phone: userData.whatsappNumber || (userData as unknown as Record<string, unknown>).phoneNumber as string || (userData as unknown as Record<string, unknown>).phone as string || '',
      }));
    }
  }, [userData]);

  // Track page view and form interactions
  useEffect(() => {
    metaPixel.trackPageView('Application Page');
  }, []);

  // Track when user starts filling the application form
  useEffect(() => {
    const hasFormData = applicationData.firstName || applicationData.lastName || 
                       applicationData.program || applicationData.modeOfStudy;
    if (hasFormData && !submittedApplication) {
      metaPixel.trackFormStart('application');
    }
  }, [applicationData.firstName, applicationData.lastName, applicationData.program, applicationData.modeOfStudy, submittedApplication]);

  // Also initialize form data when user loads
  useEffect(() => {
    if (user?.email && !applicationData.email) {
      console.log('📋 Setting email from user auth:', user.email);
      setApplicationData(prev => ({
        ...prev,
        email: user.email || '',
      }));
    }
  }, [user, applicationData.email]); // applicationData dependency is needed

  // Check for submitted application
  const checkForSubmittedApplication = useCallback(async () => {
    if (!userData?.email) return;

    setIsLoadingApplication(true);
    
    try {
      const applications = await studentApplicationService.getApplicationsByEmail(userData.email);
      
      if (applications && applications.length > 0) {
        // User has a submitted application
        const app = applications[0];
        const progress = studentApplicationService.calculateProgress(app);
        
        const submittedApp = {
          ...app,
          progress,
        };
        
        setSubmittedApplication(submittedApp);
        setApplicationMode('view');
        setIsEditing(false);
        console.log('✅ Found submitted application:', submittedApp.id);
        return;
      }

      // No submitted application found
      setApplicationMode('form');
      
    } catch (error) {
      console.error('Error checking for submitted application:', error);
      setApplicationMode('form');
    } finally {
      setIsLoadingApplication(false);
    }
  }, [userData?.email]);

  // Load existing application on component mount
  useEffect(() => {
    if (user?.uid) {
      checkForSubmittedApplication();
    }
  }, [user?.uid, checkForSubmittedApplication]);

  // Debug effect to log user data
  useEffect(() => {
    console.log('🔍 User state changed:', { user: user?.email, userData });
    console.log('📝 Current application data:', { 
      firstName: applicationData.firstName, 
      lastName: applicationData.lastName, 
      email: applicationData.email, 
      phone: applicationData.phone 
    });
  }, [user, userData, applicationData.firstName, applicationData.lastName, applicationData.email, applicationData.phone]);

  // Helper function to refresh user data and re-populate form
  const refreshUserData = async () => {
    try {
      console.log('🔄 Refreshing user data...');
      await refreshUser();
      
      // Force re-population after refresh
      if (userData) {
        console.log('🔍 Full userData after refresh:', userData);
        console.log('🔍 userData.whatsappNumber:', userData.whatsappNumber);
        console.log('🔍 All phone-related fields:', {
          whatsappNumber: userData.whatsappNumber,
          phoneNumber: (userData as UserDataWithOptionalPhone).phoneNumber,
          phone: (userData as UserDataWithOptionalPhone).phone,
        });
        
        setApplicationData(prev => ({
          ...prev,
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          email: userData.email || user?.email || '',
          phone: userData.whatsappNumber || (userData as UserDataWithOptionalPhone).phoneNumber || (userData as UserDataWithOptionalPhone).phone || '',
        }));
        console.log('✅ User data refreshed and form updated');
      }
    } catch (error) {
      console.error('❌ Error refreshing user data:', error);
    }
  };

  // Utility functions for submitted application display
  const formatDate = (dateString: unknown) => {
    if (!dateString) return 'Not available';
    
    try {
      // Handle Firestore timestamp objects
      if (typeof dateString === 'object' && dateString !== null) {
        // Check for Firestore timestamp format
        if ('seconds' in dateString || '_seconds' in dateString) {
          const timestampObj = dateString as { seconds?: number; _seconds?: number };
          const seconds = timestampObj.seconds || timestampObj._seconds;
          if (seconds) {
            const date = new Date(seconds * 1000);
            if (!isNaN(date.getTime())) {
              return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });
            }
          }
        }
        // Handle Date objects
        if (dateString instanceof Date) {
          if (!isNaN(dateString.getTime())) {
            return dateString.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });
          }
        }
      }
      
      // Handle string dates
      if (typeof dateString === 'string') {
        const date = new Date(dateString);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });
        }
      }
      
      // If we can't format it, return the original value or a fallback
      return String(dateString) || 'Not available';
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Not available';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'interested':
        return 'text-blue-600 bg-blue-100';
      case 'applied':
        return 'text-purple-600 bg-purple-100';
      case 'in_review':
        return 'text-yellow-600 bg-yellow-100';
      case 'qualified':
        return 'text-orange-600 bg-orange-100';
      case 'admitted':
        return 'text-green-600 bg-green-100';
      case 'enrolled':
        return 'text-emerald-600 bg-emerald-100';
      case 'deferred':
        return 'text-amber-600 bg-amber-100';
      case 'expired':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  // Handler for section navigation
  const handleSectionClick = (sectionId: string) => {
    setActiveSection(sectionId);
  };

  // Validation function
  const validateFormData = (formData: FormData): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    // Required personal fields
    if (!formData.firstName.trim()) errors.push('First name is required');
    if (!formData.lastName.trim()) errors.push('Last name is required');
    if (!formData.email.trim()) errors.push('Email is required');
    if (!formData.phone.trim()) errors.push('Phone number is required');
    if (!formData.countryOfBirth.trim()) errors.push('Country of birth is required');
    if (!formData.gender.trim()) errors.push('Gender is required');
    if (!formData.postalAddress.trim()) errors.push('Physical address is required');
    
    // Required academic fields
    if (!formData.program.trim()) errors.push('Program selection is required');
    if (!formData.modeOfStudy.trim()) errors.push('Mode of study is required');
    if (!formData.intake.trim()) errors.push('Intake selection is required');
    
    // Required additional field
    if (!formData.howDidYouHear.trim()) errors.push('Please tell us how you heard about the university');
    
    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.push('Please enter a valid email address');
    }
    
    // Phone number validation
    if (formData.phone && !isValidPhoneNumber(formData.phone)) {
      errors.push('Please enter a valid phone number with country code');
    }
    
    // Sponsor phone validation (if provided)
    if (formData.sponsorTelephone && !isValidPhoneNumber(formData.sponsorTelephone)) {
      errors.push('Please enter a valid sponsor phone number with country code');
    }
    
    // Sponsor email validation (if provided)
    if (formData.sponsorEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.sponsorEmail)) {
      errors.push('Please enter a valid sponsor email address');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };

  // Handler for final application submission (OPTIMIZED VERSION)
  const handleSubmitApplication = async () => {
    if (!user?.uid) return;
    
    // Validate form data
    const validation = validateFormData(applicationData);
    
    if (!validation.isValid) {
      // Group errors by section for better UX
      const personalErrors = validation.errors.filter(error => 
        error.includes('First name') || error.includes('Last name') || 
        error.includes('Email') || error.includes('Phone') || 
        error.includes('Country') || error.includes('Gender') || 
        error.includes('Physical address')
      );
      
      const programErrors = validation.errors.filter(error => 
        error.includes('Program') || error.includes('Mode of study') || 
        error.includes('Intake')
      );
      
      const additionalErrors = validation.errors.filter(error => 
        error.includes('how you heard')
      );
      
      let errorMessage = 'Please complete the following required fields:\n\n';
      
      if (personalErrors.length > 0) {
        errorMessage += '📝 Personal Details:\n' + personalErrors.map(e => `• ${e}`).join('\n') + '\n\n';
      }
      
      if (programErrors.length > 0) {
        errorMessage += '🎓 Program Selection:\n' + programErrors.map(e => `• ${e}`).join('\n') + '\n\n';
      }
      
      if (additionalErrors.length > 0) {
        errorMessage += 'ℹ️ Additional Information:\n' + additionalErrors.map(e => `• ${e}`).join('\n') + '\n\n';
      }
      
      showError(
        'Validation Error',
        errorMessage.trim(),
        8000
      );
      return;
    }
    
    try {
      setIsSubmitting(true);
      resetProgress();
      
      // 0. Ensure user is authenticated
      if (!user) {
        showError(
          'Authentication Required',
          'Please sign in to submit your application.',
          5000
        );
        return;
      }
      
      console.log('👤 Current user for application submission:', {
        uid: user.uid,
        email: user.email
      });
      
      // Prepare file names for progress tracking
      const fileNames: string[] = [];
      if (files.passportPhoto) fileNames.push(files.passportPhoto.name);
      files.academicDocuments.forEach(file => fileNames.push(file.name));
      files.identificationDocuments.forEach(file => fileNames.push(file.name));
      
      // Start progress tracking
      startProgress(fileNames);
      updateStage('preparing', 'Preparing your application...');
      
      // Transform form data to StudentApplicationData
      const studentData: StudentApplicationData = {
        firstName: applicationData.firstName,
        lastName: applicationData.lastName,
        email: applicationData.email,
        phone: applicationData.phone,
        countryOfBirth: applicationData.countryOfBirth,
        gender: applicationData.gender,
        postalAddress: applicationData.postalAddress,
        preferredProgram: applicationData.program,
        modeOfStudy: applicationData.modeOfStudy,
        preferredIntake: applicationData.intake,
        sponsorTelephone: applicationData.sponsorTelephone,
        sponsorEmail: applicationData.sponsorEmail,
        howDidYouHear: applicationData.howDidYouHear,
        additionalNotes: applicationData.additionalNotes,
      };
      
      // Step 1: Compress files if they exist (OPTIMIZATION)
      let processedFiles = files;
      if (files.passportPhoto || files.academicDocuments?.length || files.identificationDocuments?.length) {
        updateStage('compressing', 'Optimizing file sizes for faster upload...');
        
        try {
          const compressionResult = await compressApplicationDocuments(files);
          processedFiles = compressionResult;
          
          // Show compression results
          const totalOriginalSize = compressionResult.compressionResults.reduce((sum, r) => sum + r.originalSize, 0);
          const totalCompressedSize = compressionResult.compressionResults.reduce((sum, r) => sum + r.compressedSize, 0);
          const savingsPercent = Math.round((1 - totalCompressedSize / totalOriginalSize) * 100);
          
          if (savingsPercent > 10) {
            showSuccess(
              'Files Optimized',
              `File sizes reduced by ${savingsPercent}% for faster upload!`,
              4000
            );
          }
        } catch (compressionError) {
          console.warn('File compression failed, proceeding with original files:', compressionError);
          // Continue with original files if compression fails
        }
      }
      
      // Step 2: Submit application immediately (OPTIMIZATION - Don't wait for files)
      updateStage('uploading', 'Submitting your application...');
      
      const result = await studentApplicationService.submitApplicationWithBackgroundDocuments(
        studentData, 
        processedFiles
      );
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to create application');
      }
      
      // Step 3: Track document upload progress if files exist
      if (result.documentProcessing) {
        updateStage('uploading', 'Uploading documents...');
        
        // Simulate progress for user feedback (since we can't track Firebase upload progress directly)
        const progressInterval = setInterval(() => {
          fileNames.forEach(fileName => {
            const currentProgress = progress.files[fileName]?.progress || 0;
            if (currentProgress < 90) {
              updateFileProgress(fileName, Math.min(currentProgress + Math.random() * 15, 90));
            }
          });
        }, 1000);
        
        try {
          // Wait for document processing to complete
          const uploadResults = await result.documentProcessing;
          clearInterval(progressInterval);
          
          // Update final progress
          uploadResults.forEach((uploadResult, index) => {
            const fileName = fileNames[index];
            if (fileName) {
              updateFileProgress(
                fileName, 
                100, 
                uploadResult.success ? 'completed' : 'error',
                uploadResult.success ? undefined : uploadResult.message
              );
            }
          });
          
          const successfulUploads = uploadResults.filter(r => r.success);
          console.log(`✅ Background upload completed: ${successfulUploads.length}/${uploadResults.length} successful`);
          
        } catch (uploadError) {
          clearInterval(progressInterval);
          console.error('Document upload error:', uploadError);
          // Don't fail the entire submission for document upload errors
        }
      }
      
      // Step 4: Finalize
      updateStage('finalizing', 'Finalizing your submission...');
      
      // Brief delay for UX
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      updateStage('completed', 'Application submitted successfully!');
      
      // 🎯 TRACK APPLICATION SUBMISSION TO META
      metaPixel.trackApplicationSubmission({
        email: applicationData.email,
        firstName: applicationData.firstName,
        lastName: applicationData.lastName,
        phone: applicationData.phone,
        program: applicationData.program
      });

      console.log('🎯 Meta Pixel: Application submission tracked for', applicationData.email);
      
      showSuccess(
        'Application Submitted Successfully!',
        'Your application has been submitted! You can track your progress and upload additional documents anytime.',
        8000
      );
      
      // Refresh to show submitted application
      setTimeout(async () => {
        await checkForSubmittedApplication();
      }, 2000);
      
    } catch (error) {
      console.error('Failed to submit application:', error);
      updateStage('error', 'Submission failed');
      showError(
        'Submission Failed',
        `Failed to submit application: ${error instanceof Error ? error.message : 'Unknown error'}`,
        7000
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler for updating existing application data
  const handleUpdateApplication = async () => {
    if (!user?.uid || !submittedApplication) return;
    
    // Validate form data
    const validation = validateFormData(applicationData);
    
    if (!validation.isValid) {
      // Group errors by section for better UX
      const personalErrors = validation.errors.filter(error => 
        error.includes('First name') || error.includes('Last name') || 
        error.includes('Email') || error.includes('Phone') || 
        error.includes('Country') || error.includes('Gender') || 
        error.includes('Physical address')
      );
      
      const programErrors = validation.errors.filter(error => 
        error.includes('Program') || error.includes('Mode of study') || 
        error.includes('Intake')
      );
      
      const additionalErrors = validation.errors.filter(error => 
        error.includes('how you heard')
      );
      
      let errorMessage = 'Please complete the following required fields:\n\n';
      
      if (personalErrors.length > 0) {
        errorMessage += '📝 Personal Details:\n' + personalErrors.map(e => `• ${e}`).join('\n') + '\n\n';
      }
      
      if (programErrors.length > 0) {
        errorMessage += '🎓 Program Selection:\n' + programErrors.map(e => `• ${e}`).join('\n') + '\n\n';
      }
      
      if (additionalErrors.length > 0) {
        errorMessage += 'ℹ️ Additional Information:\n' + additionalErrors.map(e => `• ${e}`).join('\n') + '\n\n';
      }
      
      showError(
        'Validation Error',
        errorMessage.trim(),
        8000
      );
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Transform form data to StudentApplicationData for update
      const updatedData: StudentApplicationData = {
        firstName: applicationData.firstName,
        lastName: applicationData.lastName,
        email: applicationData.email,
        phone: applicationData.phone,
        countryOfBirth: applicationData.countryOfBirth,
        gender: applicationData.gender,
        postalAddress: applicationData.postalAddress,
        preferredProgram: applicationData.program,
        modeOfStudy: applicationData.modeOfStudy,
        preferredIntake: applicationData.intake,
        sponsorTelephone: applicationData.sponsorTelephone,
        sponsorEmail: applicationData.sponsorEmail,
        howDidYouHear: applicationData.howDidYouHear,
        additionalNotes: applicationData.additionalNotes,
      };
      
      // Update the existing application
      const result = await studentApplicationService.updateApplicationData(submittedApplication.id, updatedData);
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to update application');
      }

      // Upload new documents if they exist
      if (files.passportPhoto || files.academicDocuments?.length || files.identificationDocuments?.length) {
        const uploads = [];
        
        // Add passport photo
        if (files.passportPhoto) {
          uploads.push({
            file: files.passportPhoto,
            type: 'passportPhoto' as const,
            applicationId: submittedApplication.id,
            studentEmail: applicationData.email,
          });
        }
        
        // Add academic documents
        if (files.academicDocuments?.length) {
          uploads.push({
            file: files.academicDocuments[0], // Take first for now
            type: 'academicDocuments' as const,
            applicationId: submittedApplication.id,
            studentEmail: applicationData.email,
          });
        }
        
        // Add identification documents
        if (files.identificationDocuments?.length) {
          uploads.push({
            file: files.identificationDocuments[0], // Take first for now
            type: 'identificationDocument' as const,
            applicationId: submittedApplication.id,
            studentEmail: applicationData.email,
          });
        }
        
        // Upload documents
        const uploadResults = await studentApplicationService.uploadMultipleDocuments(uploads);
        
        const successfulUploads = uploadResults.filter(r => r.success);
        console.log(`✅ Uploaded ${successfulUploads.length}/${uploads.length} documents successfully`);
      }
      
      showSuccess(
        'Application Updated Successfully!',
        `Your application has been updated successfully! Changes have been saved to your application record.`,
        7000
      );
      
      // Refresh to show updated application
      await checkForSubmittedApplication();
      setApplicationMode('view');
      setIsEditing(false);
      
    } catch (error) {
      console.error('Failed to update application:', error);
      showError(
        'Update Failed',
        `Failed to update application: ${error instanceof Error ? error.message : 'Unknown error'}`,
        7000
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler for updating documents for submitted applications
  const handleUpdateDocuments = async () => {
    if (!user?.uid || !submittedApplication) return;
    
    try {
      setIsSubmitting(true);
      
      // Ensure user is authenticated before proceeding
      if (!user) {
        showError(
          'Authentication Required',
          'Please sign in to upload documents.',
          5000
        );
        return;
      }
      
      console.log('👤 Current user for document upload:', {
        uid: user.uid,
        email: user.email
      });
      
      // Use the studentApplicationService to upload documents
      const uploads = [];
      
      // Add passport photo if exists
      if (files.passportPhoto) {
        uploads.push({
          file: files.passportPhoto,
          type: 'passportPhoto' as const,
          applicationId: submittedApplication.id,
          studentEmail: submittedApplication.email,
        });
      }
      
      // Add academic documents if exist
      if (files.academicDocuments && files.academicDocuments.length > 0) {
        // For now, just upload the first document
        uploads.push({
          file: files.academicDocuments[0],
          type: 'academicDocuments' as const,
          applicationId: submittedApplication.id,
          studentEmail: submittedApplication.email,
        });
      }
      
      // Add identification documents if exist
      if (files.identificationDocuments && files.identificationDocuments.length > 0) {
        // For now, just upload the first document
        uploads.push({
          file: files.identificationDocuments[0],
          type: 'identificationDocument' as const,
          applicationId: submittedApplication.id,
          studentEmail: submittedApplication.email,
        });
      }
      
      if (uploads.length === 0) {
        showWarning(
          'No Documents Selected',
          'Please select at least one document to upload.',
          5000
        );
        return;
      }
      
      console.log(`📤 Starting upload of ${uploads.length} documents...`);
      
      // Upload documents using studentApplicationService
      const results = await studentApplicationService.uploadMultipleDocuments(uploads);
      
      const successfulUploads = results.filter((r) => r.success);
      const failedUploads = results.filter((r) => !r.success);
      
      if (successfulUploads.length > 0) {
        showSuccess(
          'Documents Uploaded Successfully!',
          `Successfully uploaded ${successfulUploads.length} document(s)! Previous documents were automatically replaced to save storage space.`,
          7000
        );
        
        // Refresh the submitted application data
        await checkForSubmittedApplication();
        setApplicationMode('view');
        setIsEditing(false);
      }
      
      if (failedUploads.length > 0) {
        console.warn('Some uploads failed:', failedUploads);
        const errorDetails = failedUploads.map(f => f.message).join(', ');
        showError(
          'Some Uploads Failed',
          `${failedUploads.length} document(s) failed to upload: ${errorDetails}. Please try again.`,
          7000
        );
      }
      
    } catch (error) {
      console.error('Failed to update documents:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      showError(
        'Document Update Failed',
        `Failed to update documents: ${errorMessage}. Please check your connection and try again.`,
        7000
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler for form data updates
  const handleInputChange = (field: string, value: string) => {
    setApplicationData(prev => {
      const updated = {
        ...prev,
        [field]: value
      };
      
      // Clear program selection when mode of study or intake changes
      if (field === 'modeOfStudy' || field === 'intake') {
        updated.program = '';
      }
      
      return updated;
    });
  };

  // Handler for file uploads
  const handleFileUpload = (field: string, fileList: FileList | null) => {
    if (fileList) {
      if (field === 'passportPhoto') {
        setFiles(prev => ({ ...prev, passportPhoto: fileList[0] }));
      } else if (field === 'academicDocuments') {
        const newFiles = Array.from(fileList);
        setFiles(prev => ({ ...prev, academicDocuments: [...prev.academicDocuments, ...newFiles] }));
      } else if (field === 'identificationDocuments') {
        const newFiles = Array.from(fileList);
        setFiles(prev => ({ ...prev, identificationDocuments: [...prev.identificationDocuments, ...newFiles] }));
      }
    }
  };

  // Helper function to remove a file from a document array
  const removeFile = (field: string, index: number) => {
    if (field === 'academicDocuments') {
      setFiles(prev => ({
        ...prev,
        academicDocuments: prev.academicDocuments.filter((_, i) => i !== index)
      }));
    } else if (field === 'identificationDocuments') {
      setFiles(prev => ({
        ...prev,
        identificationDocuments: prev.identificationDocuments.filter((_, i) => i !== index)
      }));
    }
  };

  // Check if sections are completed
  const isPersonalDetailsComplete = () => {
    return applicationData.firstName && 
           applicationData.lastName && 
           applicationData.email && 
           applicationData.phone && 
           applicationData.countryOfBirth && 
           applicationData.gender && 
           applicationData.postalAddress &&
           files.passportPhoto;
  };

  const isProgramSelectionComplete = () => {
    return applicationData.program && 
           applicationData.modeOfStudy && 
           applicationData.intake &&
           files.academicDocuments.length > 0 &&
           files.identificationDocuments.length > 0;
  };

  const isAdditionalInfoComplete = () => {
    return applicationData.howDidYouHear;
  };

  // Program data organized by faculty, mode, and intake
  const programData = {
    'On Campus': {
      'January': {
        'Faculty of Business Management (FBM)': [
          'Bachelor of Business Administration',
          'Bachelor of Public Administration',
          'Bachelor of Procurement & Logistics Management',
          'Bachelor of Human Resource Management',
          'Bachelor of Tourism & Hotel Management',
          'Master of Business Administration (MBA)'
        ],
        'Faculty of Science and Technology (FST)': [
          'CISCO (3 months)',
          'Bachelor of Information Technology (Web Dev)',
          'Bachelor of Information Technology (Mobile Programming)',
          'Bachelor of Information Technology (Networking)',
          'Bachelor of Science in Computer Science',
          'Bachelor of Science in Environmental Science & Management',
          'Bachelor of Science in Software Engineering',
          'Bachelor of Science in Climate-Smart Agriculture',
          'Master of Information Technology (MIT)'
        ],
        'Faculty of Engineering (FOE)': [
          'Diploma in Architecture',
          'Diploma in Civil Engineering',
          'Diploma in Electrical Engineering',
          'Bachelor of Architecture',
          'Bachelor of Science in Civil Engineering',
          'Bachelor of Science in Electrical Engineering',
          'Bachelor of Science in Petroleum Engineering',
          'Bachelor of Science in Mining Engineering',
          'Bachelor of Science in Mechatronics & Robotics Engineering',
          'Bachelor of Science in Communications Engineering'
        ],
        'Faculty of Law and Humanities (FLH)': [
          'Bachelor of Laws',
          'Bachelor of International Relations & Diplomatic Studies',
          'Bachelor of Journalism & Communication Studies',
          'Master of International Relations & Diplomatic Studies'
        ],
        'International Foundation Programme (IFP)': [
          'Higher Education Access Programme in Physical Science',
          'Higher Education Access Programme in Humanities'
        ]
      },
      'May': {
        'Faculty of Business Management (FBM)': [
          'Bachelor of Business Administration',
          'Bachelor of Public Administration',
          'Bachelor of Procurement & Logistics Management',
          'Bachelor of Human Resource Management',
          'Bachelor of Tourism & Hotel Management',
          'Master of Business Administration (MBA)'
        ],
        'Faculty of Science and Technology (FST)': [
          'CISCO (3 months)',
          'Bachelor of Information Technology (Web Dev)',
          'Bachelor of Information Technology (Mobile Programming)',
          'Bachelor of Information Technology (Networking)',
          'Bachelor of Science in Computer Science',
          'Bachelor of Science in Environmental Science & Management',
          'Bachelor of Science in Software Engineering',
          'Bachelor of Science in Climate-Smart Agriculture',
          'Master of Information Technology (MIT)'
        ]
      },
      'August': {
        'Faculty of Business Management (FBM)': [
          'Bachelor of Business Administration',
          'Bachelor of Public Administration',
          'Bachelor of Procurement & Logistics Management',
          'Bachelor of Human Resource Management',
          'Bachelor of Tourism & Hotel Management',
          'Master of Business Administration (MBA)'
        ],
        'Faculty of Science and Technology (FST)': [
          'CISCO (3 months)',
          'Bachelor of Information Technology (Web Dev)',
          'Bachelor of Information Technology (Mobile Programming)',
          'Bachelor of Information Technology (Networking)',
          'Bachelor of Science in Computer Science',
          'Bachelor of Science in Environmental Science & Management',
          'Bachelor of Science in Software Engineering',
          'Bachelor of Science in Climate-Smart Agriculture',
          'Master of Information Technology (MIT)'
        ],
        'Faculty of Engineering (FOE)': [
          'Diploma in Architecture',
          'Diploma in Civil Engineering',
          'Diploma in Electrical Engineering',
          'Bachelor of Architecture',
          'Bachelor of Science in Civil Engineering',
          'Bachelor of Science in Electrical Engineering',
          'Bachelor of Science in Petroleum Engineering',
          'Bachelor of Science in Mining Engineering',
          'Bachelor of Science in Mechatronics & Robotics Engineering',
          'Bachelor of Science in Communications Engineering'
        ],
        'Faculty of Law and Humanities (FLH)': [
          'Bachelor of Laws',
          'Bachelor of International Relations & Diplomatic Studies',
          'Bachelor of Journalism & Communication Studies',
          'Master of International Relations & Diplomatic Studies'
        ],
        'International Foundation Programme (IFP)': [
          'Higher Education Access Programme in Physical Science',
          'Higher Education Access Programme in Humanities'
        ]
      }
    },
    'Online': {
      'January': {
        'Faculty of Business Management (FBM)': [
          'Bachelor of Business Administration',
          'Master of Business Administration (MBA)'
        ],
        'Faculty of Science and Technology (FST)': [
          'Bachelor of Information Technology'
        ],
        'Faculty of Law and Humanities (FLH)': [
          'Bachelor of Laws (LLB)'
        ],
        'International Foundation Programme (IFP)': [
          'International Foundation Programme (Physical Science)',
          'International Foundation Programme (Humanities)'
        ]
      },
      'May': {
        'Faculty of Business Management (FBM)': [
          'Bachelor of Business Administration',
          'Master of Business Administration (MBA)'
        ],
        'Faculty of Science and Technology (FST)': [
          'Bachelor of Information Technology'
        ]
      },
      'August': {
        'Faculty of Business Management (FBM)': [
          'Bachelor of Business Administration',
          'Master of Business Administration (MBA)'
        ],
        'Faculty of Science and Technology (FST)': [
          'Bachelor of Information Technology'
        ],
        'Faculty of Law and Humanities (FLH)': [
          'Bachelor of Laws (LLB)'
        ],
        'International Foundation Programme (IFP)': [
          'International Foundation Programme (Physical Science)',
          'International Foundation Programme (Humanities)'
        ]
      }
    }
  };

  // Get available programs grouped by faculty based on mode of study and intake
  const getAvailablePrograms = () => {
    const { modeOfStudy, intake } = applicationData;
    
    if (!modeOfStudy || !intake) {
      return {};
    }
    
    return programData[modeOfStudy as keyof typeof programData]?.[intake as keyof typeof programData['On Campus']] || {};
  };

  // Get total count of programs across all faculties
  const getTotalProgramCount = () => {
    const programs = getAvailablePrograms();
    return Object.values(programs).reduce((total: number, facultyPrograms) => total + (facultyPrograms as string[]).length, 0);
  };

  // Get form completion percentage
  const getFormCompletionPercentage = () => {
    const totalFields = 11; // Total required fields
    let completedFields = 0;
    
    if (applicationData.firstName.trim()) completedFields++;
    if (applicationData.lastName.trim()) completedFields++;
    if (applicationData.email.trim()) completedFields++;
    if (applicationData.phone.trim()) completedFields++;
    if (applicationData.countryOfBirth.trim()) completedFields++;
    if (applicationData.gender.trim()) completedFields++;
    if (applicationData.postalAddress.trim()) completedFields++;
    if (applicationData.program.trim()) completedFields++;
    if (applicationData.modeOfStudy.trim()) completedFields++;
    if (applicationData.intake.trim()) completedFields++;
    if (applicationData.howDidYouHear.trim()) completedFields++;
    
    const percentage = Math.round((completedFields / totalFields) * 100);
    // Ensure percentage never exceeds 100% or goes below 0%
    return Math.max(0, Math.min(100, percentage));
  };

  // Clean, organized countries list with flag emojis - prioritizing African countries and common destinations
  const countryList = [
    // East African Countries (Priority for IUEA)
    '🇺🇬 Uganda',
    '🇰🇪 Kenya',
    '🇹🇿 Tanzania',
    '🇷🇼 Rwanda',
    '🇧🇮 Burundi',
    '🇸🇸 South Sudan',
    '🇪🇹 Ethiopia',
    '🇸🇴 Somalia',
    '🇪🇷 Eritrea',
    '🇩🇯 Djibouti',
    '🇨🇩 Democratic Republic of Congo',
    
    // Other African Countries
    '🇳🇬 Nigeria',
    '🇬🇭 Ghana',
    '🇿🇦 South Africa',
    '🇪🇬 Egypt',
    '🇲🇦 Morocco',
    '🇹🇳 Tunisia',
    '🇩🇿 Algeria',
    '🇱🇾 Libya',
    '🇸🇩 Sudan',
    '🇹🇩 Chad',
    '🇨🇫 Central African Republic',
    '🇨🇬 Republic of Congo',
    '🇨🇲 Cameroon',
    '🇬🇦 Gabon',
    '🇬🇶 Equatorial Guinea',
    '🇸🇹 São Tomé and Príncipe',
    '🇦🇴 Angola',
    '🇿🇲 Zambia',
    '🇲🇼 Malawi',
    '🇲🇿 Mozambique',
    '🇿🇼 Zimbabwe',
    '🇧🇼 Botswana',
    '🇳🇦 Namibia',
    '🇱🇸 Lesotho',
    '🇸🇿 Eswatini',
    '🇲🇬 Madagascar',
    '🇲🇺 Mauritius',
    '🇸🇨 Seychelles',
    '🇰🇲 Comoros',
    '🇲🇱 Mali',
    '🇧🇫 Burkina Faso',
    '🇳🇪 Niger',
    '🇸🇳 Senegal',
    '🇬🇲 Gambia',
    '🇬🇼 Guinea-Bissau',
    '🇬🇳 Guinea',
    '🇸🇱 Sierra Leone',
    '🇱🇷 Liberia',
    '🇨🇮 Côte d\'Ivoire',
    '🇹🇬 Togo',
    '🇧🇯 Benin',
    '🇨🇻 Cape Verde',
    
    // Popular International Destinations
    '🇺🇸 United States',
    '🇬🇧 United Kingdom',
    '🇨🇦 Canada',
    '🇦🇺 Australia',
    '🇩🇪 Germany',
    '🇫🇷 France',
    '🇳🇱 Netherlands',
    '🇧🇪 Belgium',
    '🇨🇭 Switzerland',
    '🇦🇹 Austria',
    '🇮🇹 Italy',
    '🇪🇸 Spain',
    '🇵🇹 Portugal',
    '🇸🇪 Sweden',
    '🇳🇴 Norway',
    '🇩🇰 Denmark',
    '🇫🇮 Finland',
    '🇮🇪 Ireland',
    '🇳🇿 New Zealand',
    
    // Asian Countries
    '🇨🇳 China',
    '🇮🇳 India',
    '🇯🇵 Japan',
    '🇰🇷 South Korea',
    '🇸🇬 Singapore',
    '🇲🇾 Malaysia',
    '🇹🇭 Thailand',
    '🇵🇭 Philippines',
    '🇮🇩 Indonesia',
    '🇻🇳 Vietnam',
    '🇵🇰 Pakistan',
    '🇧🇩 Bangladesh',
    '🇱🇰 Sri Lanka',
    '🇦🇫 Afghanistan',
    '🇮🇷 Iran',
    '🇮🇶 Iraq',
    '🇹🇷 Turkey',
    '🇸🇦 Saudi Arabia',
    '🇦🇪 United Arab Emirates',
    '🇶🇦 Qatar',
    '🇰🇼 Kuwait',
    '🇧🇭 Bahrain',
    '🇴🇲 Oman',
    '🇾🇪 Yemen',
    '🇯🇴 Jordan',
    '🇱🇧 Lebanon',
    '🇸🇾 Syria',
    '🇮🇱 Israel',
    '🇵🇸 Palestine',
    
    // South American Countries
    '🇧🇷 Brazil',
    '🇦🇷 Argentina',
    '🇨🇱 Chile',
    '🇨🇴 Colombia',
    '🇵🇪 Peru',
    '🇻🇪 Venezuela',
    '🇪🇨 Ecuador',
    '🇧🇴 Bolivia',
    '🇵🇾 Paraguay',
    '🇺🇾 Uruguay',
    '🇬🇾 Guyana',
    '🇸🇷 Suriname',
    
    // Other European Countries
    '🇷🇺 Russia',
    '🇵🇱 Poland',
    '🇨🇿 Czech Republic',
    '🇸🇰 Slovakia',
    '🇭🇺 Hungary',
    '🇷🇴 Romania',
    '🇧🇬 Bulgaria',
    '🇬🇷 Greece',
    '🇭🇷 Croatia',
    '🇷🇸 Serbia',
    '🇧🇦 Bosnia and Herzegovina',
    '🇲🇪 Montenegro',
    '🇲🇰 North Macedonia',
    '🇦🇱 Albania',
    '🇸🇮 Slovenia',
    '🇪🇪 Estonia',
    '🇱🇻 Latvia',
    '🇱🇹 Lithuania',
    '🇧🇾 Belarus',
    '🇺🇦 Ukraine',
    '🇲🇩 Moldova',
    
    // Other Countries
    '🇲🇽 Mexico',
    '🇯🇲 Jamaica',
    '🇨🇺 Cuba',
    '🇭🇹 Haiti',
    '🇩🇴 Dominican Republic',
    '🇵🇷 Puerto Rico',
    '🇹🇹 Trinidad and Tobago',
    '🇧🇧 Barbados',
    '🇫🇯 Fiji',
    '🇵🇬 Papua New Guinea',
    '🇸🇧 Solomon Islands',
    '🇻🇺 Vanuatu',
    '🇼🇸 Samoa',
    '🇹🇴 Tonga',
    '🇫🇲 Micronesia',
    '🇵🇼 Palau',
    '🇲🇭 Marshall Islands',
    '🇰🇮 Kiribati',
    '🇹🇻 Tuvalu',
    '🇳🇷 Nauru'
  ].sort();
  
  return (
    <div className="pb-20 md:pb-0">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
      
      {/* Progress Indicator */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <ProgressIndicator progress={progress} showDetails={true} />
            
            {progress.stage !== 'completed' && progress.stage !== 'error' && (
              <div className="mt-4 flex items-center justify-center">
                <button
                  onClick={() => {
                    setIsSubmitting(false);
                    resetProgress();
                  }}
                  className="text-sm text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
            
            {progress.stage === 'completed' && (
              <div className="mt-4 flex justify-center">
                <button
                  onClick={() => {
                    setIsSubmitting(false);
                    resetProgress();
                  }}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Continue
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Loading State */}
      {isLoadingApplication && (
        applicationMode === 'view' ? <ApplicationViewSkeleton /> : <ApplicationSkeleton />
      )}

      {/* Submitted Application View */}
      {!isLoadingApplication && applicationMode === 'view' && submittedApplication && (
        <div className="space-y-6">
          {/* Quick Navigation - Application View Mode */}
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

            <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
              <div className="flex items-center">
                <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <i className="ri-file-list-3-line text-blue-800"></i>
                </div>
                <div className="ml-3">
                  <h3 className="font-medium text-blue-800">My Application</h3>
                  <p className="text-xs text-blue-600">Current Page</p>
                </div>
              </div>
            </div>

            <Link 
              href="/dashboard/documents" 
              className="bg-white rounded-lg p-4 border border-slate-200 hover:border-green-800/30 transition-colors group"
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

          {/* Header with Application Status */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-800">My Application</h1>
                <p className="text-sm text-slate-500">Submitted on {formatDate(submittedApplication.submittedAt)}</p>
              </div>
              
              <div className="flex flex-col sm:items-end gap-2">
                <div className="flex flex-wrap gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(submittedApplication.status)}`}>
                    {submittedApplication.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                
                {/* Edit Application Button */}
                <button
                  onClick={() => {
                    // Pre-fill form with existing application data
                    setApplicationData({
                      firstName: submittedApplication.name.split(' ')[0] || '',
                      lastName: submittedApplication.name.split(' ').slice(1).join(' ') || '',
                      email: submittedApplication.email,
                      phone: submittedApplication.phoneNumber,
                      countryOfBirth: submittedApplication.countryOfBirth || '',
                      gender: submittedApplication.gender || '',
                      postalAddress: submittedApplication.postalAddress || '',
                      program: submittedApplication.preferredProgram || '',
                      modeOfStudy: submittedApplication.modeOfStudy || '',
                      intake: submittedApplication.preferredIntake || '',
                      sponsorTelephone: submittedApplication.sponsorTelephone || '',
                      sponsorEmail: submittedApplication.sponsorEmail || '',
                      howDidYouHear: submittedApplication.howDidYouHear || '',
                      additionalNotes: submittedApplication.additionalNotes || ''
                    });
                    setApplicationMode('form');
                    setIsEditing(true);
                    setActiveSection('personal');
                  }}
                  className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors text-sm flex items-center gap-2"
                >
                  <i className="ri-edit-line"></i>
                  Edit Application
                </button>
              </div>
            </div>

            {/* Show progress information instead of statusNote */}
            {submittedApplication.progress && (
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-800 font-medium">Application Progress</span>
                <span className="text-blue-600 font-bold">{Math.max(0, Math.min(100, submittedApplication.progress.progressPercentage))}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${Math.max(0, Math.min(100, submittedApplication.progress.progressPercentage))}%` }}
                ></div>
              </div>
              <p className="text-blue-700 text-sm">
                <i className="ri-information-line mr-2"></i>
                {submittedApplication.progress.nextAction}
              </p>
            </div>
            )}
          </div>

          {/* Personal Information */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
              <i className="ri-user-line mr-2"></i>
              Personal Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Full Name</label>
                <p className="text-slate-800">{submittedApplication.name}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Email Address</label>
                <p className="text-slate-800">{submittedApplication.email}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Phone Number</label>
                <p className="text-slate-800">{submittedApplication.phoneNumber}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Gender</label>
                <p className="text-slate-800 capitalize">{submittedApplication.gender}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Country of Birth</label>
                <p className="text-slate-800">{submittedApplication.countryOfBirth}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Physical Address</label>
                <p className="text-slate-800">{submittedApplication.postalAddress}</p>
              </div>
            </div>
          </div>

          {/* Program Information */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
              <i className="ri-graduation-cap-line mr-2"></i>
              Program Selection
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Preferred Program</label>
                <p className="text-slate-800 font-medium">{submittedApplication.preferredProgram}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Mode of Study</label>
                <p className="text-slate-800 capitalize">{submittedApplication.modeOfStudy.replace('_', ' ')}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Preferred Intake</label>
                <p className="text-slate-800 capitalize">{submittedApplication.preferredIntake}</p>
              </div>
            </div>
          </div>

          {/* Sponsorship Information & Additional Details */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
              <i className="ri-information-line mr-2"></i>
              Additional Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Sponsor Information */}
              {(submittedApplication.sponsorTelephone || submittedApplication.sponsorEmail) && (
                <>
                  <div className="md:col-span-2">
                    <h4 className="text-base font-medium text-slate-700 mb-3">
                      <i className="ri-shield-user-line mr-2"></i>
                      Sponsor Information
                    </h4>
                  </div>
                  
                  {submittedApplication.sponsorTelephone && (
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">Sponsor Telephone</label>
                      <p className="text-slate-800">{submittedApplication.sponsorTelephone}</p>
                    </div>
                  )}
                  
                  {submittedApplication.sponsorEmail && (
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">Sponsor Email</label>
                      <p className="text-slate-800">{submittedApplication.sponsorEmail}</p>
                    </div>
                  )}
                </>
              )}
              
              {/* How did you hear about us */}
              {submittedApplication.howDidYouHear && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-600 mb-1">How did you hear about the university?</label>
                  <p className="text-slate-800 capitalize">
                    {submittedApplication.howDidYouHear === 'social-media' ? 'Social Media (Facebook, Instagram, Twitter)' :
                     submittedApplication.howDidYouHear === 'website' ? 'University Website' :
                     submittedApplication.howDidYouHear === 'friend-family' ? 'Friend or Family Recommendation' :
                     submittedApplication.howDidYouHear === 'education-fair' ? 'Education Fair' :
                     submittedApplication.howDidYouHear === 'newspaper-magazine' ? 'Newspaper/Magazine' :
                     submittedApplication.howDidYouHear === 'radio-tv' ? 'Radio/Television' :
                     submittedApplication.howDidYouHear === 'school-counselor' ? 'School Counselor' :
                     submittedApplication.howDidYouHear === 'alumni' ? 'Alumni' :
                     submittedApplication.howDidYouHear === 'search-engine' ? 'Search Engine (Google, Bing)' :
                     submittedApplication.howDidYouHear === 'university-representative' ? 'University Representative Visit' :
                     submittedApplication.howDidYouHear === 'other' ? 'Other' :
                     submittedApplication.howDidYouHear.replace('-', ' ').replace('_', ' ')
                    }
                  </p>
                </div>
              )}
              
              {/* Additional Notes */}
              {submittedApplication.additionalNotes && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-600 mb-1">Additional Notes</label>
                  <p className="text-slate-800">{submittedApplication.additionalNotes}</p>
                </div>
              )}
            </div>
            
            {/* Show message if no additional information is available */}
            {!submittedApplication.sponsorTelephone && 
             !submittedApplication.sponsorEmail && 
             !submittedApplication.howDidYouHear && 
             !submittedApplication.additionalNotes && (
              <p className="text-slate-500 italic">No additional information provided.</p>
            )}
          </div>

          {/* Documents Status */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
              <i className="ri-file-list-line mr-2"></i>
              Document Status
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center">
                  <i className="ri-image-line text-slate-600 mr-3"></i>
                  <span className="text-slate-800">Passport Photo</span>
                </div>
                <span className={`px-2 py-1 rounded text-sm ${
                  submittedApplication.passportPhoto ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {submittedApplication.passportPhoto ? 'Uploaded' : 'Missing'}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center">
                  <i className="ri-file-text-line text-slate-600 mr-3"></i>
                  <span className="text-slate-800">Academic Documents</span>
                </div>
                <span className={`px-2 py-1 rounded text-sm ${
                  submittedApplication.academicDocuments ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {submittedApplication.academicDocuments ? 'Uploaded' : 'Missing'}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center">
                  <i className="ri-id-card-line text-slate-600 mr-3"></i>
                  <span className="text-slate-800">Identification Documents</span>
                </div>
                <span className={`px-2 py-1 rounded text-sm ${
                  submittedApplication.identificationDocument ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {submittedApplication.identificationDocument ? 'Uploaded' : 'Missing'}
                </span>
              </div>
            </div>

            {(!submittedApplication.passportPhoto || !submittedApplication.academicDocuments || !submittedApplication.identificationDocument) && (
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex">
                    <i className="ri-alert-line text-amber-600 mt-0.5 mr-3"></i>
                    <div>
                      <h4 className="text-amber-800 font-medium">Missing Documents</h4>
                      <p className="text-amber-700 text-sm mt-1">
                        Some required documents are missing. You can upload them here or contact the admissions office.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      // Pre-fill form with existing application data
                      setApplicationData({
                        firstName: submittedApplication.name.split(' ')[0] || '',
                        lastName: submittedApplication.name.split(' ').slice(1).join(' ') || '',
                        email: submittedApplication.email,
                        phone: submittedApplication.phoneNumber,
                        countryOfBirth: submittedApplication.countryOfBirth || '',
                        gender: submittedApplication.gender || '',
                        postalAddress: submittedApplication.postalAddress || '',
                        program: submittedApplication.preferredProgram || '',
                        modeOfStudy: submittedApplication.modeOfStudy || '',
                        intake: submittedApplication.preferredIntake || '',
                        sponsorTelephone: submittedApplication.sponsorTelephone || '',
                        sponsorEmail: submittedApplication.sponsorEmail || '',
                        howDidYouHear: submittedApplication.howDidYouHear || '',
                        additionalNotes: submittedApplication.additionalNotes || ''
                      });
                      setApplicationMode('form');
                      setIsEditing(true);
                      // Reset files and form for document upload mode
                      setFiles({
                        academicDocuments: [],
                        identificationDocuments: [],
                      });
                    }}
                    className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors text-sm whitespace-nowrap"
                  >
                    <i className="ri-upload-line mr-2"></i>
                    Edit Application or Upload Documents
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Contact Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">
              <i className="ri-customer-service-2-line mr-2"></i>
              Need Help?
            </h3>
            <p className="text-blue-700 mb-4">
              If you have questions about your application, need to submit missing documents, or need to make changes to your submitted application, please contact our admissions office.
            </p>
            <div className="flex flex-wrap gap-4">
              <a 
                href="mailto:apply@iuea.ac.ug" 
                className="inline-flex items-center text-blue-800 hover:text-blue-900"
              >
                <i className="ri-mail-line mr-2"></i>
                apply@iuea.ac.ug
              </a>
              <a 
                href="tel:+256790002000" 
                className="inline-flex items-center text-blue-800 hover:text-blue-900"
              >
                <i className="ri-phone-line mr-2"></i>
                +256 790 002 000
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Application Form (when no submitted application or starting new) */}
      {!isLoadingApplication && applicationMode === 'form' && (
        <>
      {/* Page Header */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
          {submittedApplication && isEditing ? 'Edit Application' : submittedApplication ? 'Update Application Documents' : 'My Application'}
        </h1>
        
        {submittedApplication && isEditing && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start">
              <i className="ri-edit-line text-amber-600 mr-2 mt-0.5"></i>
              <span className="text-sm text-amber-700">
                <strong>Edit Mode:</strong> You can now modify your submitted application data. Changes will update your existing application.
              </span>
            </div>
          </div>
        )}
        
        {submittedApplication && !isEditing && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start">
              <i className="ri-information-line text-blue-600 mr-2 mt-0.5"></i>
              <span className="text-sm text-blue-700">
                Your application has been submitted. You can only update documents at this time.
              </span>
            </div>
          </div>
        )}
        
        {/* Progress indicator for form completion */}
        {!submittedApplication && (
          <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">Application Progress</span>
              <span className="text-sm font-bold text-slate-600">{getFormCompletionPercentage()}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div 
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${getFormCompletionPercentage()}%` }}
              ></div>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Complete all required fields to submit your application
            </p>
          </div>
        )}
      </div>

      {/* Quick Navigation - Application Form Mode */}
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

        <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
          <div className="flex items-center">
            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <i className="ri-file-list-3-line text-blue-800"></i>
            </div>
            <div className="ml-3">
              <h3 className="font-medium text-blue-800">My Application</h3>
              <p className="text-xs text-blue-600">Current Page</p>
            </div>
          </div>
        </div>

        <Link 
          href="/dashboard/documents" 
          className="bg-white rounded-lg p-4 border border-slate-200 hover:border-green-800/30 transition-colors group"
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

      {/* Application Progress */}
      <div className="bg-white rounded-lg p-3 md:p-4 border border-slate-200 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
          {formSections.map((section, index) => {
            const isCompleted = index === 0 ? isPersonalDetailsComplete() : 
                               index === 1 ? isProgramSelectionComplete() : 
                               isAdditionalInfoComplete();
            
            return (
              <div 
                key={section.id}
                className="flex flex-col items-center"
              >
                <div className="relative mb-1 md:mb-2">
                  <div 
                    className={`h-6 w-6 md:h-8 md:w-8 rounded-full flex items-center justify-center text-xs ${
                      isCompleted 
                        ? 'bg-red-800 text-white' 
                        : activeSection === section.id
                        ? 'bg-red-800/20 border-2 border-red-800 text-red-800'
                        : 'bg-slate-200 text-slate-800/50'
                    }`}
                  >
                    {isCompleted ? (
                      <i className="ri-check-line"></i>
                    ) : (
                      index + 1
                    )}
                  </div>
                  {index < formSections.length - 1 && (
                    <div 
                      className={`absolute top-1/2 left-full w-12 md:w-16 h-0.5 -translate-y-1/2 ${
                        isCompleted ? 'bg-red-800' : 'bg-slate-200'
                      }`}
                    ></div>
                  )}
                </div>
                <span 
                  className={`text-xs md:text-sm text-center ${
                    activeSection === section.id ? 'text-red-800 font-medium' : 'text-slate-800/70'
                  }`}
                >
                  {section.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Navigation */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left side: navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg overflow-hidden border border-slate-200">
            <div className="p-3 bg-[#f7f7f7] border-b border-slate-200">
              <h3 className="font-semibold text-slate-800 text-sm md:text-base">Application Sections</h3>
            </div>
            <div>
              {formSections.map((section, index) => {
                const isCompleted = index === 0 ? isPersonalDetailsComplete() : 
                                   index === 1 ? isProgramSelectionComplete() : 
                                   isAdditionalInfoComplete();
                
                return (
                  <button
                    key={section.id}
                    onClick={() => handleSectionClick(section.id)}
                    className={`w-full text-left px-3 md:px-4 py-2 md:py-3 flex items-center justify-between border-b border-slate-200 last:border-b-0 ${
                      activeSection === section.id
                        ? 'bg-red-800/5 border-l-4 border-l-[#780000]'
                        : ''
                    }`}
                  >
                    <div className="flex items-center">
                      <span 
                        className={`text-xs md:text-sm ${
                          activeSection === section.id ? 'text-red-800 font-medium' : ''
                        }`}
                      >
                        {section.name}
                      </span>
                    </div>
                    {isCompleted && (
                      <div className="h-4 w-4 md:h-5 md:w-5 rounded-full bg-green-100 flex items-center justify-center">
                        <i className="ri-check-line text-green-600 text-xs"></i>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Application Tips */}
          <div className="mt-4 bg-blue-50 rounded-lg p-3 md:p-4">
            <h3 className="font-medium text-blue-800 text-sm md:text-base">
              {submittedApplication ? 'Document Update' : 'Tips'}
            </h3>
            <ul className="mt-2 space-y-2 text-xs md:text-sm text-blue-700">
              {submittedApplication ? (
                <>
                  <li className="flex">
                    <i className="ri-information-line mr-2 mt-1 flex-shrink-0"></i>
                    <span>You can only update documents for your existing application.</span>
                  </li>
                  <li className="flex">
                    <i className="ri-information-line mr-2 mt-1 flex-shrink-0"></i>
                    <span>Upload clear, high-quality scans or photos of your documents.</span>
                  </li>
                  <li className="flex">
                    <i className="ri-information-line mr-2 mt-1 flex-shrink-0"></i>
                    <span>Accepted formats: PDF, DOC, DOCX, JPG, JPEG, PNG.</span>
                  </li>
                  <li className="flex">
                    <i className="ri-recycle-line mr-2 mt-1 flex-shrink-0"></i>
                    <span>Uploading new documents will automatically replace previous ones to save storage.</span>
                  </li>
                </>
              ) : (
                <>
                  <li className="flex">
                    <i className="ri-information-line mr-2 mt-1 flex-shrink-0"></i>
                    <span>Complete all three sections for your application to be considered.</span>
                  </li>
                  <li className="flex">
                    <i className="ri-information-line mr-2 mt-1 flex-shrink-0"></i>
                    <span>Upload clear, legible copies of all required documents.</span>
                  </li>
                  <li className="flex">
                    <i className="ri-information-line mr-2 mt-1 flex-shrink-0"></i>
                    <span>Provide accurate sponsor information if applicable.</span>
                  </li>
                  <li className="flex">
                    <i className="ri-information-line mr-2 mt-1 flex-shrink-0"></i>
                    <span>Review your information before completing each section.</span>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>

        {/* Right side: active form section */}
        <div className="lg:col-span-3">
          {/* Personal Details Section - Matching frontend PersonalDetailsStep */}
          {activeSection === 'personal' && (
            <div className="bg-white rounded-lg p-4 md:p-6 border border-slate-200">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
                <h2 className="text-base md:text-lg font-semibold text-slate-800">Personal Details</h2>
                <span className={`text-xs px-2 py-1 rounded-full w-fit ${
                  isPersonalDetailsComplete() 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {isPersonalDetailsComplete() ? 'Completed' : 'In Progress'}
                </span>
              </div>
              
              {/* Information about pre-populated fields */}
              {userData && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start">
                    <i className="ri-information-line text-blue-600 mr-2 mt-0.5"></i>
                    <div>
                      <p className="text-sm text-blue-700">
                        <strong>Pre-filled Information:</strong> Your name, email, and phone number have been automatically filled from your verified account. 
                        You can edit your name if needed, but email and phone cannot be changed as they&apos;re verified.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Warning when user data is not loaded */}
              {!userData && user && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start">
                      <i className="ri-alert-line text-amber-600 mr-2 mt-0.5"></i>
                      <div>
                        <p className="text-sm text-amber-700">
                          <strong>User data not loaded:</strong> Your personal information couldn&apos;t be loaded automatically. 
                          Click refresh to try loading your account data, or fill in the fields manually.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={refreshUserData}
                      className="ml-3 bg-amber-600 text-white px-3 py-1 rounded text-xs hover:bg-amber-700 transition-colors whitespace-nowrap"
                    >
                      <i className="ri-refresh-line mr-1"></i>
                      Refresh Data
                    </button>
                  </div>
                </div>
              )}
              
              {/* Personal Details Form */}
              <div className="grid grid-cols-1 gap-4 sm:gap-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-800 mb-2">
                      First Name <span className="text-red-600">*</span>
                      {userData && applicationData.firstName && (
                        <span className="ml-2 text-xs text-green-600">(from account)</span>
                      )}
                    </label>
                    <input
                      type="text"
                      value={applicationData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      readOnly={!isEditing}
                      className={`w-full px-4 py-3 rounded-lg border-2 border-slate-200 text-base ${
                        isEditing ? 'bg-white' : 'bg-[#f7f7f7]'
                      }`}
                      placeholder="Enter your first name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-800 mb-2">
                      Last Name <span className="text-red-600">*</span>
                      {userData && applicationData.lastName && (
                        <span className="ml-2 text-xs text-green-600">(from account)</span>
                      )}
                    </label>
                    <input
                      type="text"
                      value={applicationData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      readOnly={!isEditing}
                      className={`w-full px-4 py-3 rounded-lg border-2 border-slate-200 text-base ${
                        isEditing ? 'bg-white' : 'bg-[#f7f7f7]'
                      }`}
                      placeholder="Enter your last name"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-800 mb-2">
                    Email Address <span className="text-red-600">*</span>
                    {!submittedApplication && (
                      <span className="ml-2 inline-flex items-center px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                        <i className="ri-shield-check-line mr-1"></i>
                        Verified
                      </span>
                    )}
                  </label>
                  <input
                    type="email"
                    value={applicationData.email || user?.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    readOnly={!submittedApplication}
                    className={`w-full px-4 py-3 rounded-lg border-2 text-base ${
                      submittedApplication 
                        ? 'border-slate-200 bg-white' 
                        : 'border-green-200 bg-green-50 cursor-not-allowed'
                    }`}
                  />
                  {!submittedApplication && (
                    <p className="text-xs text-green-600 mt-1 flex items-center">
                      <i className="ri-lock-line mr-1"></i>
                      Email cannot be changed as it&apos;s verified and linked to your account
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-800 mb-2">
                    Phone Number <span className="text-red-600">*</span>
                    {!submittedApplication && (
                      <span className="ml-2 inline-flex items-center px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                        <i className="ri-shield-check-line mr-1"></i>
                        Verified
                      </span>
                    )}
                  </label>
                  <input
                    type="tel"
                    value={applicationData.phone || userData?.whatsappNumber || (userData as UserDataWithOptionalPhone)?.phoneNumber || (userData as UserDataWithOptionalPhone)?.phone || ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    readOnly={!submittedApplication}
                    className={`w-full px-4 py-3 rounded-lg border-2 text-base ${
                      submittedApplication 
                        ? 'border-slate-200 bg-white' 
                        : 'border-green-200 bg-green-50 cursor-not-allowed'
                    }`}
                  />
                  {!submittedApplication && (
                    <p className="text-xs text-green-600 mt-1 flex items-center">
                      <i className="ri-lock-line mr-1"></i>
                      WhatsApp number cannot be changed as it&apos;s verified and linked to your account
                    </p>
                  )}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-800 mb-2">
                      Country of Birth <span className="text-red-600">*</span>
                    </label>
                    {isEditing ? (
                      <select
                        value={applicationData.countryOfBirth}
                        onChange={(e) => handleInputChange('countryOfBirth', e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 text-base bg-white"
                      >
                        <option value="">Select Country</option>
                        {countryList.map((country) => (
                          <option key={country} value={country}>
                            {country}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={applicationData.countryOfBirth}
                        readOnly
                        className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 text-base bg-[#f7f7f7]"
                      />
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-800 mb-2">
                      Gender <span className="text-red-600">*</span>
                    </label>
                    {isEditing ? (
                      <select
                        value={applicationData.gender}
                        onChange={(e) => handleInputChange('gender', e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 text-base bg-white"
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={applicationData.gender}
                        readOnly
                        className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 text-base bg-[#f7f7f7]"
                      />
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-800 mb-2">
                    Physical Address <span className="text-red-600">*</span>
                  </label>
                  <textarea
                    value={applicationData.postalAddress}
                    onChange={(e) => handleInputChange('postalAddress', e.target.value)}
                    readOnly={!isEditing}
                    rows={3}
                    className={`w-full px-4 py-3 rounded-lg border-2 border-slate-200 text-base resize-none ${
                      isEditing ? 'bg-white' : 'bg-[#f7f7f7]'
                    }`}
                    placeholder="Enter your physical address (P.O. Box, street, city, postal code)"
                  />
                  <p className="text-xs text-slate-500 mt-1">Enter your physical address (P.O. Box, street, city, postal code)</p>
                </div>
                
                {/* Passport Photo Section */}
                <div>
                  <label className="block text-sm font-medium text-slate-800 mb-2">
                    Passport Photo <span className="text-red-600">*</span>
                  </label>
                  <div className={`border-2 border-dashed border-slate-200 rounded-lg p-4 text-center ${
                    isEditing ? 'bg-white' : 'bg-[#f7f7f7]'
                  }`}>
                    <div className="flex flex-col items-center">
                      <i className="ri-image-line text-2xl text-slate-400 mb-2"></i>
                      {files.passportPhoto ? (
                        <p className="text-sm text-slate-600">{files.passportPhoto.name}</p>
                      ) : submittedApplication ? (
                        <p className="text-sm text-slate-600">
                          {submittedApplication.passportPhoto ? 'Current photo on file - Upload new to replace' : 'No photo on file - Upload required'}
                        </p>
                      ) : (
                        <p className="text-sm text-slate-600">No photo uploaded</p>
                      )}
                      {isEditing && (
                        <div className="mt-2">
                          <input
                            type="file"
                            accept="image/jpeg,image/jpg,image/png"
                            onChange={(e) => handleFileUpload('passportPhoto', e.target.files)}
                            className="hidden"
                            id="passport-photo"
                          />
                          <label
                            htmlFor="passport-photo"
                            className="cursor-pointer bg-red-800 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
                          >
                            {submittedApplication ? 'Update Photo' : 'Choose File'}
                          </label>
                        </div>
                      )}
                      <p className="text-xs text-slate-500 mt-1">
                        Upload a recent passport-style photograph. JPG, JPEG, PNG accepted. Previous photos will be automatically replaced.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex flex-col sm:flex-row sm:justify-between gap-3">
                <button
                  onClick={() => handleSectionClick('program')}
                  className="px-4 py-2 text-sm bg-red-800 text-white rounded-lg hover:bg-[#600000] transition-colors"
                >
                  Next: Program Selection
                  <i className="ri-arrow-right-line ml-1"></i>
                </button>

                <button
                  onClick={
                    submittedApplication && isEditing 
                      ? handleUpdateApplication 
                      : submittedApplication && !isEditing 
                      ? handleUpdateDocuments 
                      : handleSubmitApplication
                  }
                  disabled={
                    isSubmitting || 
                    (!submittedApplication && (!isPersonalDetailsComplete() || !isProgramSelectionComplete() || !isAdditionalInfoComplete()))
                  }
                  className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <i className="ri-loader-4-line mr-2 animate-spin"></i>
                      {progress.stage === 'preparing' ? 'Preparing...' :
                       progress.stage === 'compressing' ? 'Optimizing...' :
                       progress.stage === 'uploading' ? 'Uploading...' :
                       progress.stage === 'finalizing' ? 'Finalizing...' :
                       submittedApplication && isEditing 
                        ? 'Updating...' 
                        : submittedApplication && !isEditing 
                        ? 'Updating...' 
                        : 'Submitting...'
                      }
                    </>
                  ) : (
                    <>
                      <i className={`${
                        submittedApplication && isEditing 
                          ? 'ri-save-line' 
                          : submittedApplication && !isEditing 
                          ? 'ri-upload-line' 
                          : 'ri-send-plane-line'
                      } mr-2`}></i>
                      {submittedApplication && isEditing 
                        ? 'Update Application' 
                        : submittedApplication && !isEditing 
                        ? 'Update Documents' 
                        : 'Submit Application'
                      }
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Program Selection Section - Matching frontend ProgramStep */}
          {activeSection === 'program' && (
            <div className="bg-white rounded-lg p-4 md:p-6 border border-slate-200">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
                <h2 className="text-base md:text-lg font-semibold text-slate-800">Program Selection</h2>
                <span className={`text-xs px-2 py-1 rounded-full w-fit ${
                  isProgramSelectionComplete() 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {isProgramSelectionComplete() ? 'Completed' : 'In Progress'}
                </span>
              </div>
              
              {/* Program Selection Form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-800 mb-1">
                    Mode of Study <span className="text-red-600">*</span>
                  </label>
                  {isEditing ? (
                    <select
                      value={applicationData.modeOfStudy}
                      onChange={(e) => handleInputChange('modeOfStudy', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border-2 border-slate-200 text-sm bg-white"
                    >
                      <option value="">Select Mode</option>
                      <option value="On Campus">On Campus</option>
                      <option value="Online">Online</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={applicationData.modeOfStudy || ''}
                      readOnly
                      className="w-full px-3 py-2 rounded-lg border-2 border-slate-200 text-sm bg-[#f7f7f7]"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-800 mb-1">
                    Intake <span className="text-red-600">*</span>
                  </label>
                  {isEditing ? (
                    <select
                      value={applicationData.intake}
                      onChange={(e) => handleInputChange('intake', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border-2 border-slate-200 text-sm bg-white"
                    >
                      <option value="">Select Intake</option>
                      <option value="January">January</option>
                      <option value="May">May</option>
                      <option value="August">August</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={applicationData.intake || ''}
                      readOnly
                      className="w-full px-3 py-2 rounded-lg border-2 border-slate-200 text-sm bg-[#f7f7f7]"
                    />
                  )}
                </div>
                
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-800 mb-1">
                    Program <span className="text-red-600">*</span>
                  </label>
                  {isEditing ? (
                    <div>
                      <select
                        value={applicationData.program}
                        onChange={(e) => handleInputChange('program', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border-2 border-slate-200 text-sm bg-white"
                        disabled={!applicationData.modeOfStudy || !applicationData.intake}
                      >
                        <option value="">
                          {!applicationData.modeOfStudy || !applicationData.intake 
                            ? 'Please select Mode of Study and Intake first' 
                            : 'Select Program'
                          }
                        </option>
                        {Object.entries(getAvailablePrograms()).map(([faculty, programs]) => (
                          <optgroup key={faculty} label={faculty}>
                            {(programs as string[]).map((program) => (
                              <option key={program} value={program}>
                                {program}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                      
                      {/* Program availability info */}
                      {applicationData.modeOfStudy && applicationData.intake && (
                        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-start">
                            <i className="ri-information-line text-blue-600 mr-2 mt-0.5"></i>
                            <div>
                              <p className="text-sm text-blue-700 font-medium mb-1">
                                Available Programs for {applicationData.modeOfStudy} - {applicationData.intake} Intake
                              </p>
                              <p className="text-xs text-blue-600">
                                Showing {getTotalProgramCount()} program(s) across {Object.keys(getAvailablePrograms()).length} faculties for your selected mode of study and intake.
                                {getTotalProgramCount() === 0 && ' No programs are available for this combination.'}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {(!applicationData.modeOfStudy || !applicationData.intake) && (
                        <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                          <div className="flex items-start">
                            <i className="ri-alert-line text-amber-600 mr-2 mt-0.5"></i>
                            <div>
                              <p className="text-sm text-amber-700">
                                Please select both <strong>Mode of Study</strong> and <strong>Intake</strong> to see available programs organized by faculty.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={applicationData.program || ''}
                      readOnly
                      className="w-full px-3 py-2 rounded-lg border-2 border-slate-200 text-sm bg-[#f7f7f7]"
                    />
                  )}
                </div>
                
                {/* Academic Documents Section */}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-800 mb-2">
                    Academic Documents <span className="text-red-600">*</span>
                  </label>
                  <div className={`border-2 border-slate-200 rounded-lg p-4 ${isEditing ? 'bg-white' : 'bg-[#f7f7f7]'}`}>
                    <div className="flex items-center mb-2">
                      <i className="ri-file-text-line text-lg text-slate-600 mr-2"></i>
                      <span className="text-sm font-medium text-slate-700">
                        {submittedApplication ? 'New Documents to Upload:' : 'Uploaded Documents:'}
                      </span>
                      {submittedApplication && (
                        <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                          {submittedApplication.academicDocuments ? 'Has documents on file' : 'No documents on file'}
                        </span>
                      )}
                    </div>
                    {files.academicDocuments && files.academicDocuments.length > 0 ? (
                      <ul className="space-y-1">
                        {files.academicDocuments.map((doc, index) => (
                          <li key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                            <div className="flex items-center">
                              <i className="ri-file-line text-slate-600 mr-2"></i>
                              <span className="text-sm text-slate-700">{doc.name}</span>
                            </div>
                            {isEditing && (
                              <button
                                onClick={() => removeFile('academicDocuments', index)}
                                className="text-red-600 hover:text-red-800"
                                title="Remove file"
                              >
                                <i className="ri-delete-bin-line"></i>
                              </button>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-slate-500">No documents uploaded</p>
                    )}
                    {isEditing && (
                      <div className="mt-3">
                        <input
                          type="file"
                          multiple
                          accept=".pdf,.doc,.docx,image/jpeg,image/jpg,image/png"
                          onChange={(e) => handleFileUpload('academicDocuments', e.target.files)}
                          className="hidden"
                          id="academic-docs"
                        />
                        <label
                          htmlFor="academic-docs"
                          className="cursor-pointer bg-red-800 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm inline-block"
                        >
                          <i className="ri-upload-line mr-2"></i>
                          Upload Documents
                        </label>
                      </div>
                    )}
                    <p className="text-xs text-slate-500 mt-2">
                      Upload transcripts, certificates, diplomas, or academic records from previous institutions. Previous uploads will be replaced automatically.
                    </p>
                  </div>
                </div>

                {/* Identification Documents Section */}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-800 mb-2">
                    Identification Documents <span className="text-red-600">*</span>
                  </label>
                  <div className={`border-2 border-slate-200 rounded-lg p-4 ${isEditing ? 'bg-white' : 'bg-[#f7f7f7]'}`}>
                    <div className="flex items-center mb-2">
                      <i className="ri-id-card-line text-lg text-slate-600 mr-2"></i>
                      <span className="text-sm font-medium text-slate-700">
                        {submittedApplication ? 'New Documents to Upload:' : 'Uploaded Documents:'}
                      </span>
                      {submittedApplication && (
                        <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                          {submittedApplication.identificationDocument ? 'Has documents on file' : 'No documents on file'}
                        </span>
                      )}
                    </div>
                    {files.identificationDocuments && files.identificationDocuments.length > 0 ? (
                      <ul className="space-y-1">
                        {files.identificationDocuments.map((doc, index) => (
                          <li key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                            <div className="flex items-center">
                              <i className="ri-file-line text-slate-600 mr-2"></i>
                              <span className="text-sm text-slate-700">{doc.name}</span>
                            </div>
                            {isEditing && (
                              <button
                                onClick={() => removeFile('identificationDocuments', index)}
                                className="text-red-600 hover:text-red-800"
                                title="Remove file"
                              >
                                <i className="ri-delete-bin-line"></i>
                              </button>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-slate-500">No documents uploaded</p>
                    )}
                    {isEditing && (
                      <div className="mt-3">
                        <input
                          type="file"
                          multiple
                          accept=".pdf,.doc,.docx,image/jpeg,image/jpg,image/png"
                          onChange={(e) => handleFileUpload('identificationDocuments', e.target.files)}
                          className="hidden"
                          id="id-docs"
                        />
                        <label
                          htmlFor="id-docs"
                          className="cursor-pointer bg-red-800 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm inline-block"
                        >
                          <i className="ri-upload-line mr-2"></i>
                          Upload Documents
                        </label>
                      </div>
                    )}
                    <p className="text-xs text-slate-500 mt-2">
                      Upload passport, national ID, birth certificate, or other government-issued identification. Previous uploads will be replaced automatically.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* File Size Preview */}
              {(files.passportPhoto || 
                files.academicDocuments.length > 0 || 
                files.identificationDocuments.length > 0) && (
                <div className="mt-6">
                  <FileSizePreview
                    files={{
                      passportPhoto: files.passportPhoto,
                      academicDocuments: files.academicDocuments,
                      identificationDocuments: files.identificationDocuments
                    }}
                  />
                </div>
              )}
              
              <div className="mt-6 flex flex-col sm:flex-row sm:justify-between gap-3">
                <button
                  onClick={() => handleSectionClick('personal')}
                  className="px-4 py-2 text-sm border border-slate-200 text-slate-800 rounded-lg hover:border-red-800 hover:text-red-800 transition-colors"
                >
                  <i className="ri-arrow-left-line mr-1"></i>
                  Previous: Personal Details
                </button>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => handleSectionClick('additional')}
                    className="px-4 py-2 text-sm bg-red-800 text-white rounded-lg hover:bg-[#600000] transition-colors"
                  >
                    Next: Additional Information
                    <i className="ri-arrow-right-line ml-1"></i>
                  </button>

                  <button
                    onClick={
                      submittedApplication && isEditing 
                        ? handleUpdateApplication 
                        : submittedApplication && !isEditing 
                        ? handleUpdateDocuments 
                        : handleSubmitApplication
                    }
                    disabled={
                      isSubmitting || 
                      (!submittedApplication && (!isPersonalDetailsComplete() || !isProgramSelectionComplete() || !isAdditionalInfoComplete()))
                    }
                    className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isSubmitting ? (
                      <>
                        <i className="ri-loader-4-line mr-2 animate-spin"></i>
                        {submittedApplication && isEditing 
                          ? 'Updating...' 
                          : submittedApplication && !isEditing 
                          ? 'Updating...' 
                          : 'Submitting...'
                        }
                      </>
                    ) : (
                      <>
                        <i className={`${
                          submittedApplication && isEditing 
                            ? 'ri-save-line' 
                            : submittedApplication && !isEditing 
                            ? 'ri-upload-line' 
                            : 'ri-send-plane-line'
                        } mr-2`}></i>
                        {submittedApplication && isEditing 
                          ? 'Update Application' 
                          : submittedApplication && !isEditing 
                          ? 'Update Documents' 
                          : 'Submit Application'
                        }
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Additional Information Section - Matching frontend AdditionalDataStep */}
          {activeSection === 'additional' && (
            <div className="bg-white rounded-lg p-4 md:p-6 border border-slate-200">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
                <h2 className="text-base md:text-lg font-semibold text-slate-800">Additional Information</h2>
                <span className={`text-xs px-2 py-1 rounded-full w-fit ${
                  isAdditionalInfoComplete() 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {isAdditionalInfoComplete() ? 'Completed' : 'In Progress'}
                </span>
              </div>
              
              {/* Sponsorship Information */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-slate-800 mb-3">Sponsorship Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-800 mb-1">
                      Sponsor Telephone
                    </label>
                    {isEditing ? (
                      <div className="w-full px-3 py-2 rounded-lg border-2 border-slate-200 text-sm bg-white focus-within:border-red-800 hover:border-red-800/50 transition-colors">
                        <PhoneInput
                          international
                          countryCallingCodeEditable={false}
                          defaultCountry="UG"
                          value={applicationData.sponsorTelephone}
                          onChange={(value) => handleInputChange('sponsorTelephone', value || '')}
                          placeholder="Enter sponsor's phone number"
                          style={{
                            '--PhoneInputCountryFlag-height': '1.2em',
                            '--PhoneInputCountryFlag-width': '1.5em',
                            '--PhoneInputCountrySelectArrow-color': '#666666',
                            '--PhoneInputCountrySelectArrow-opacity': '0.8',
                          }}
                        />
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={applicationData.sponsorTelephone}
                        readOnly
                        className="w-full px-3 py-2 rounded-lg border-2 border-slate-200 text-sm bg-[#f7f7f7]"
                      />
                    )}
                    <p className="text-xs text-slate-500 mt-1">Phone number of sponsor or parent/guardian with country code</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-800 mb-1">
                      Sponsor Email
                    </label>
                    <input
                      type="email"
                      value={applicationData.sponsorEmail}
                      onChange={(e) => handleInputChange('sponsorEmail', e.target.value)}
                      readOnly={!isEditing}
                      className={`w-full px-3 py-2 rounded-lg border-2 border-slate-200 text-sm ${
                        isEditing ? 'bg-white' : 'bg-[#f7f7f7]'
                      }`}
                      placeholder="sponsor@example.com"
                    />
                    <p className="text-xs text-slate-500 mt-1">Valid email address of sponsor or parent/guardian</p>
                  </div>
                </div>
              </div>

              {/* How did you hear about us */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-800 mb-1">
                  How did you hear about the university? <span className="text-red-600">*</span>
                </label>
                {isEditing ? (
                  <select
                    value={applicationData.howDidYouHear}
                    onChange={(e) => handleInputChange('howDidYouHear', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border-2 border-slate-200 text-sm bg-white"
                  >
                    <option value="">Select Option</option>
                    <option value="social-media">Social Media (Facebook, Instagram, Twitter)</option>
                    <option value="website">University Website</option>
                    <option value="friend-family">Friend or Family Recommendation</option>
                    <option value="education-fair">Education Fair</option>
                    <option value="newspaper-magazine">Newspaper/Magazine</option>
                    <option value="radio-tv">Radio/Television</option>
                    <option value="school-counselor">School Counselor</option>
                    <option value="alumni">Alumni</option>
                    <option value="search-engine">Search Engine (Google, Bing)</option>
                    <option value="university-representative">University Representative Visit</option>
                    <option value="other">Other</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    value={
                      applicationData.howDidYouHear === 'social-media' ? 'Social Media (Facebook, Instagram, Twitter)' :
                      applicationData.howDidYouHear === 'website' ? 'University Website' :
                      applicationData.howDidYouHear === 'friend-family' ? 'Friend or Family Recommendation' :
                      applicationData.howDidYouHear === 'education-fair' ? 'Education Fair' :
                      applicationData.howDidYouHear === 'newspaper-magazine' ? 'Newspaper/Magazine' :
                      applicationData.howDidYouHear === 'radio-tv' ? 'Radio/Television' :
                      applicationData.howDidYouHear === 'school-counselor' ? 'School Counselor' :
                      applicationData.howDidYouHear === 'alumni' ? 'Alumni' :
                      applicationData.howDidYouHear === 'search-engine' ? 'Search Engine (Google, Bing)' :
                      applicationData.howDidYouHear === 'university-representative' ? 'University Representative Visit' :
                      applicationData.howDidYouHear === 'other' ? 'Other' :
                      applicationData.howDidYouHear
                    }
                    readOnly
                    className="w-full px-3 py-2 rounded-lg border-2 border-slate-200 text-sm bg-[#f7f7f7]"
                  />
                )}
              </div>

              {/* Additional Notes */}
              <div>
                <label className="block text-sm font-medium text-slate-800 mb-1">
                  Additional Notes
                </label>
                <textarea
                  value={applicationData.additionalNotes}
                  onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
                  readOnly={!isEditing}
                  rows={4}
                  className={`w-full px-3 py-2 rounded-lg border-2 border-slate-200 text-sm resize-none ${
                    isEditing ? 'bg-white' : 'bg-[#f7f7f7]'
                  }`}
                />
                <p className="text-xs text-slate-500 mt-1">Any additional information you&apos;d like to share (optional)</p>
              </div>
              
              <div className="mt-6 flex flex-col sm:flex-row sm:justify-between gap-3">
                <button
                  onClick={() => handleSectionClick('program')}
                  className="px-4 py-2 text-sm border border-slate-200 text-slate-800 rounded-lg hover:border-red-800 hover:text-red-800 transition-colors"
                >
                  <i className="ri-arrow-left-line mr-1"></i>
                  Previous: Program Selection
                </button>

                <button
                  onClick={
                    submittedApplication && isEditing 
                      ? handleUpdateApplication 
                      : submittedApplication && !isEditing 
                      ? handleUpdateDocuments 
                      : handleSubmitApplication
                  }
                  disabled={
                    isSubmitting || 
                    (!submittedApplication && (!isPersonalDetailsComplete() || !isProgramSelectionComplete() || !isAdditionalInfoComplete()))
                  }
                  className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <i className="ri-loader-4-line mr-2 animate-spin"></i>
                      {submittedApplication && isEditing 
                        ? 'Updating...' 
                        : submittedApplication && !isEditing 
                        ? 'Updating...' 
                        : 'Submitting...'
                      }
                    </>
                  ) : (
                    <>
                      <i className={`${
                        submittedApplication && isEditing 
                          ? 'ri-save-line' 
                          : submittedApplication && !isEditing 
                          ? 'ri-upload-line' 
                          : 'ri-send-plane-line'
                      } mr-2`}></i>
                      {submittedApplication && isEditing 
                        ? 'Update Application' 
                        : submittedApplication && !isEditing 
                        ? 'Update Documents' 
                        : 'Submit Application'
                      }
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
        </>
      )}
    </div>
  );
}
