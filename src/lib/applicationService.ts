/**
 * Student Application Service
 * Handles direct Firebase integration for application submissions
 */

import { 
  collection, 
  updateDoc, 
  doc, 
  query, 
  where, 
  getDocs,
  DocumentData,
  QueryDocumentSnapshot,
  writeBatch,
  orderBy,
  getDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { signInAnonymously } from 'firebase/auth';
import { db, storage, auth } from '@/lib/firebase';

// Application data interface for student portal form submissions
export interface StudentApplicationData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  countryOfBirth: string;
  gender: string;
  modeOfStudy: string;
  preferredIntake: string;
  preferredProgram: string;
  postalAddress: string;
  sponsorTelephone?: string;
  sponsorEmail?: string;
  howDidYouHear?: string;
  additionalNotes?: string;
}

// Document upload interface
export interface DocumentUpload {
  file: File;
  type: 'passportPhoto' | 'academicDocuments' | 'identificationDocument';
  applicationId: string;
  studentEmail: string;
}

// Document upload response
export interface DocumentUploadResponse {
  success: boolean;
  message: string;
  documentType: string;
  downloadUrl: string;
  fileName: string;
}

// Response interface from webhook submission
export interface ApplicationResponse {
  success: boolean;
  message: string;
  applicationId?: string;
  leadId?: string;
  statusNote?: string;
}

// Application data interface for retrieved applications
export interface Application {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  countryOfBirth: string;
  gender: string;
  modeOfStudy: string;
  preferredIntake: string;
  preferredProgram: string;
  postalAddress?: string;
  stage: string;
  status: string;
  submittedAt: string;
  updatedAt: string;
  passportPhoto?: string;
  academicDocuments?: string;
  identificationDocument?: string;
  // Add sponsor and additional information fields
  sponsorTelephone?: string;
  sponsorEmail?: string;
  howDidYouHear?: string;
  additionalNotes?: string;
}

// Lead constants (matching backend)
export const LEAD_STATUSES = {
  INQUIRY: "INQUIRY",
  CONTACTED: "CONTACTED", 
  PRE_QUALIFIED: "PRE_QUALIFIED",
  APPLIED: "APPLIED",
  QUALIFIED: "QUALIFIED",
  ADMITTED: "ADMITTED",
  ENROLLED: "ENROLLED",
  NURTURE: "NURTURE",
  REJECTED: "REJECTED",
} as const;

export const LEAD_SOURCES = {
  WEBSITE: "WEBSITE",
  META_ADS: "META_ADS",
  GOOGLE_ADS: "GOOGLE_ADS",
  WHATSAPP: "WHATSAPP",
  LINKEDIN: "LINKEDIN",
  REFERRAL: "REFERRAL",
  WALK_IN: "WALK_IN",
  PHONE: "PHONE",
  EMAIL: "EMAIL",
  EDUCATION_FAIR: "EDUCATION_FAIR",
  PARTNER: "PARTNER",
  APPLICATION_FORM: "APPLICATION_FORM",
  MANUAL: "MANUAL",
  SOCIAL_MEDIA: "SOCIAL_MEDIA",
  EVENT: "EVENT",
  OTHER: "OTHER",
} as const;

// Application status constants (matching backend)
export const APPLICATION_STATUSES = {
  DRAFT: "DRAFT",
  SUBMITTED: "SUBMITTED",
  UNDER_REVIEW: "UNDER_REVIEW",
  DOCUMENTS_REQUIRED: "DOCUMENTS_REQUIRED",
  DOCUMENTS_RECEIVED: "DOCUMENTS_RECEIVED",
  INTERVIEW_COMPLETED: "INTERVIEW_COMPLETED",
  CONDITIONALLY_ACCEPTED: "CONDITIONALLY_ACCEPTED",
  ACCEPTED: "ACCEPTED",
  REJECTED: "REJECTED",
  WAITLISTED: "WAITLISTED",
  ENROLLED: "ENROLLED",
  DEFERRED: "DEFERRED",
  WITHDRAWN: "WITHDRAWN",
  EXPIRED: "EXPIRED",
} as const;

// Direct application/lead creation response
export interface DirectApplicationResponse {
  success: boolean;
  message: string;
  applicationId: string;
  leadId: string;
  application: Record<string, unknown>;
  lead: Record<string, unknown>;
}

class StudentApplicationService {
  constructor() {
    console.log('🔧 StudentApplicationService initialized for direct Firebase integration');
  }

  /**
   * Create application and lead directly in Firestore
   * Uses Firebase client SDK with proper authentication
   */
  async createApplicationAndLead(data: StudentApplicationData): Promise<DirectApplicationResponse> {
    try {
      console.log('🎯 Creating application and lead directly...');
      
      // Ensure user is authenticated before proceeding
      await this.ensureAuthenticated();
      
      const currentTime = new Date();
      const applicationId = this.generateApplicationId();
      const leadId = this.generateLeadId();
      
      // Prepare application data (matching backend structure exactly)
      const applicationData = {
        // Personal Information
        name: `${data.firstName} ${data.lastName}`,
        countryOfBirth: data.countryOfBirth,
        gender: data.gender,
        email: data.email.toLowerCase(),
        phoneNumber: data.phone,
        passportPhoto: null, // Will be populated when uploaded
        postalAddress: data.postalAddress || null,

        // Initially null - will be populated with user information by the service
        // if the application is submitted manually or by an admin user
        submittedBy: null,

        // Academic Information
        modeOfStudy: data.modeOfStudy,
        preferredIntake: data.preferredIntake,
        preferredProgram: data.preferredProgram,
        secondaryProgram: null,
        academicDocuments: [], // Will be populated when uploaded
        identificationDocument: null, // Will be populated when uploaded

        // Sponsorship Information
        sponsor: null,
        sponsorTelephone: data.sponsorTelephone || null,
        sponsorEmail: data.sponsorEmail || null,
        howDidYouHear: data.howDidYouHear || null,
        additionalNotes: data.additionalNotes || null,

        // Application Meta
        status: APPLICATION_STATUSES.SUBMITTED,
        submittedAt: currentTime.toISOString(),
        createdAt: currentTime.toISOString(),
        updatedAt: currentTime.toISOString(),

        // Application stage - defaults to "new"
        stage: "new",

        // Simple status note instead of timeline
        statusNote: "Application submitted",

        // Additional Fields
        notes: "",

        // Integration
        leadId: leadId, // Will be populated when lead is created
        whatsappMessageSent: false,
      };

      // Create the initial timeline entry for lead
      const initialTimelineEntry = {
        date: currentTime.toISOString(),
        action: "CREATED",
        status: LEAD_STATUSES.APPLIED,
        notes: `Lead created from APPLICATION_FORM`,
      };

      // Prepare lead data (matching backend structure exactly)
      const leadData = {
        // Basic Info
        status: LEAD_STATUSES.APPLIED,
        source: LEAD_SOURCES.APPLICATION_FORM,
        createdAt: currentTime.toISOString(),
        updatedAt: currentTime.toISOString(),

        // Contact Info
        name: `${data.firstName} ${data.lastName}`,
        phone: data.phone,
        email: data.email.toLowerCase(),
        whatsappNumber: data.phone,

        // Application Info
        program: data.preferredProgram,
        applicationSubmitted: true,
        applicationDate: currentTime.toISOString(),
        
        // Additional Information
        sponsorTelephone: data.sponsorTelephone || null,
        sponsorEmail: data.sponsorEmail || null,
        howDidYouHear: data.howDidYouHear || null,
        additionalNotes: data.additionalNotes || null,

        // Assignment
        assignedTo: null,
        priority: "MEDIUM",

        // Tracking
        totalInteractions: 0,
        lastInteractionAt: null,
        nextFollowUpDate: null,

        // Timeline - with synchronized initial status
        timeline: [initialTimelineEntry],

        // Notes
        notes: "",
        tags: [],
      };

      console.log('📋 Application data prepared:', applicationData);
      console.log('� Lead data prepared with APPLIED status:', leadData);

      // Use Firestore batch to ensure atomicity
      const batch = writeBatch(db);
      
      // Add application document
      const applicationRef = doc(collection(db, 'applications'), applicationId);
      batch.set(applicationRef, applicationData);
      
      // Add lead document
      const leadRef = doc(collection(db, 'leads'), leadId);
      batch.set(leadRef, leadData);
      
      // Commit both documents atomically
      await batch.commit();

      console.log('✅ Application and lead created successfully');
      console.log('📄 Application ID:', applicationId);
      console.log('👤 Lead ID:', leadId);

      return {
        success: true,
        message: 'Application and lead created successfully',
        applicationId: applicationId,
        leadId: leadId,
        application: applicationData,
        lead: leadData,
      };

    } catch (error) {
      console.error('❌ Error creating application and lead:', error);
      throw error;
    }
  }

  /**
   * Ensure user is authenticated, sign in anonymously if not
   */
  private async ensureAuthenticated(): Promise<void> {
    try {
      if (!auth.currentUser) {
        console.log('🔐 User not authenticated, signing in anonymously...');
        await signInAnonymously(auth);
        console.log('✅ Anonymous authentication successful');
      } else {
        console.log('✅ User already authenticated:', auth.currentUser.email || 'anonymous');
      }
    } catch (error) {
      console.error('❌ Authentication failed:', error);
      throw new Error('Authentication failed. Please try again.');
    }
  }

  /**
   * Delete old document from Firebase Storage
   */
  async deleteOldDocument(applicationId: string, documentType: string): Promise<void> {
    try {
      // Get current application data to find existing document URL
      const applicationRef = doc(db, 'applications', applicationId);
      const applicationDoc = await getDoc(applicationRef);
      
      if (!applicationDoc.exists()) {
        console.log(`⚠️ Application ${applicationId} not found, skipping old document deletion`);
        return;
      }
      
      const applicationData = applicationDoc.data();
      const existingUrl = applicationData[documentType];
      
      if (!existingUrl || existingUrl === '' || existingUrl === null) {
        console.log(`ℹ️ No existing ${documentType} found for application ${applicationId}`);
        return;
      }
      
      // Extract storage path from different possible Firebase Storage URL formats
      let storagePath: string | null = null;
      
      try {
        // Format 1: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?alt=media&token={token}
        if (existingUrl.includes('/o/')) {
          const urlParts = existingUrl.split('/o/')[1]?.split('?')[0];
          if (urlParts) {
            storagePath = decodeURIComponent(urlParts);
          }
        }
        // Format 2: gs://{bucket}/{path} (if somehow stored this way)
        else if (existingUrl.startsWith('gs://')) {
          storagePath = existingUrl.replace(/^gs:\/\/[^\/]+\//, '');
        }
        // Format 3: Direct path (if stored as just the path)
        else if (existingUrl.includes('applications/')) {
          storagePath = existingUrl;
        }
        
        if (!storagePath) {
          console.warn(`⚠️ Could not parse storage path from URL: ${existingUrl}`);
          return;
        }
        
        console.log(`🗑️ Deleting old ${documentType} from path: ${storagePath}`);
        
        // Delete the old file
        const oldFileRef = ref(storage, storagePath);
        await deleteObject(oldFileRef);
        console.log(`✅ Successfully deleted old ${documentType}`);
        
      } catch (parseError) {
        console.warn(`⚠️ Error parsing URL for ${documentType}: ${existingUrl}`, parseError);
        return;
      }
      
    } catch (error) {
      // Don't throw error if old file deletion fails - proceed with new upload
      if ((error as any)?.code === 'storage/object-not-found') {
        console.log(`ℹ️ Old ${documentType} file not found in storage (may have been deleted already)`);
      } else {
        console.warn(`⚠️ Failed to delete old ${documentType}:`, error);
      }
    }
  }

  /**
   * Upload document to Firebase Storage and update Firestore with public URL
   * Handles passport photos, academic documents, and identification documents
   * Automatically deletes previous document to save storage space
   */
  async uploadDocumentAndUpdateFirestore(upload: DocumentUpload): Promise<DocumentUploadResponse> {
    try {
      console.log(`📤 Uploading ${upload.type} for application ${upload.applicationId}...`);
      
      // 0. Delete old document first to save storage space
      await this.deleteOldDocument(upload.applicationId, upload.type);
      
      // 1. Validate file
      if (!upload.file || upload.file.size === 0) {
        throw new Error('No file provided or file is empty');
      }

      // Check file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (upload.file.size > maxSize) {
        throw new Error('File size must be less than 10MB');
      }

      // Check file type
      const allowedTypes = {
        passportPhoto: ['image/jpeg', 'image/jpg', 'image/png'],
        academicDocuments: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
        identificationDocument: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
      };

      if (!allowedTypes[upload.type].includes(upload.file.type)) {
        throw new Error(`Invalid file type for ${upload.type}. Allowed: ${allowedTypes[upload.type].join(', ')}`);
      }

      // 2. Generate unique filename
      const timestamp = Date.now();
      const fileExtension = upload.file.name.split('.').pop() || 'unknown';
      const sanitizedEmail = upload.studentEmail.replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `${upload.type}_${upload.applicationId}_${sanitizedEmail}_${timestamp}.${fileExtension}`;
      
      // 3. Create Firebase Storage path
      const storagePath = `applications/${upload.applicationId}/documents/${fileName}`;
      
      console.log(`📁 Storage path: ${storagePath}`);

      // 4. Upload to Firebase Storage directly
      const storageRef = ref(storage, storagePath);
      const uploadTask = await uploadBytes(storageRef, upload.file);
      const downloadUrl = await getDownloadURL(uploadTask.ref);

      console.log(`✅ File uploaded successfully: ${downloadUrl}`);

      // 5. Update Firestore application document with the public URL
      const updateData = {
        [upload.type]: downloadUrl,
        updatedAt: new Date().toISOString(),
      };

      try {
        const applicationRef = doc(db, 'applications', upload.applicationId);
        await updateDoc(applicationRef, updateData);
        console.log(`✅ Firestore updated with ${upload.type} URL`);
      } catch (firestoreError) {
        console.warn('⚠️ File uploaded but Firestore update failed:', firestoreError);
        // Don't throw error here as file is already uploaded
      }

      return {
        success: true,
        message: `${upload.type} uploaded successfully (previous file cleaned up)`,
        documentType: upload.type,
        downloadUrl: downloadUrl,
        fileName: fileName,
      };

    } catch (error) {
      console.error(`❌ Error uploading ${upload.type}:`, error);
      throw error;
    }
  }

  /**
   * Upload multiple documents for an application
   */
  async uploadMultipleDocuments(uploads: DocumentUpload[]): Promise<DocumentUploadResponse[]> {
    try {
      console.log(`📤 Uploading ${uploads.length} documents...`);
      
      const results: DocumentUploadResponse[] = [];
      
      // Upload documents sequentially to avoid overwhelming the server
      for (const upload of uploads) {
        try {
          const result = await this.uploadDocumentAndUpdateFirestore(upload);
          results.push(result);
        } catch (error) {
          console.error(`❌ Failed to upload ${upload.type}:`, error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          results.push({
            success: false,
            message: `Failed to upload ${upload.type}: ${errorMessage}`,
            documentType: upload.type,
            downloadUrl: '',
            fileName: '',
          });
        }
      }

      const successCount = results.filter(r => r.success).length;
      console.log(`✅ Uploaded ${successCount}/${uploads.length} documents successfully`);

      return results;
    } catch (error) {
      console.error('❌ Error uploading multiple documents:', error);
      throw error;
    }
  }

  /**
   * Delete all documents for an application (useful when deleting entire application)
   */
  async deleteAllApplicationDocuments(applicationId: string): Promise<{ success: boolean; deletedCount: number }> {
    const documentTypes = ['passportPhoto', 'academicDocuments', 'identificationDocument'];
    let deletedCount = 0;
    
    console.log(`🗑️ Cleaning up all documents for application ${applicationId}`);
    
    for (const docType of documentTypes) {
      try {
        await this.deleteOldDocument(applicationId, docType);
        deletedCount++;
      } catch (error) {
        console.warn(`⚠️ Failed to delete ${docType} for application ${applicationId}:`, error);
      }
    }
    
    console.log(`✅ Cleaned up ${deletedCount}/${documentTypes.length} document types for application ${applicationId}`);
    
    return {
      success: deletedCount > 0,
      deletedCount
    };
  }

  /**
   * Generate a unique application ID
   */
  private generateApplicationId(): string {
    return `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }



  /**
   * Generate a unique lead ID
   */
  private generateLeadId(): string {
    return `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get applications by email address from Firestore
   */
  async getApplicationsByEmail(email: string): Promise<Application[]> {
    try {
      console.log('🔍 Fetching applications for email:', email);
      
      // Ensure user is authenticated
      await this.ensureAuthenticated();
      
      // Query applications collection by email
      const applicationsRef = collection(db, 'applications');
      const q = query(
        applicationsRef, 
        where('email', '==', email.toLowerCase()),
        orderBy('submittedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        console.log('📭 No applications found for user');
        return [];
      }
      
      const applications: Application[] = [];
      querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
        const data = doc.data();
        applications.push({
          id: doc.id,
          name: data.name || '',
          email: data.email || '',
          phoneNumber: data.phoneNumber || '',
          countryOfBirth: data.countryOfBirth || '',
          gender: data.gender || '',
          modeOfStudy: data.modeOfStudy || '',
          preferredIntake: data.preferredIntake || '',
          preferredProgram: data.preferredProgram || '',
          postalAddress: data.postalAddress || '',
          stage: data.stage || 'submitted',
          status: data.status || APPLICATION_STATUSES.SUBMITTED,
          submittedAt: data.submittedAt || '',
          updatedAt: data.updatedAt || '',
          passportPhoto: data.passportPhoto || '',
          academicDocuments: data.academicDocuments || '',
          identificationDocument: data.identificationDocument || '',
          // Add sponsor and additional information fields
          sponsorTelephone: data.sponsorTelephone || '',
          sponsorEmail: data.sponsorEmail || '',
          howDidYouHear: data.howDidYouHear || '',
          additionalNotes: data.additionalNotes || '',
        } as any);
      });
      
      console.log(`✅ Found ${applications.length} applications for user`);
      return applications;
      
    } catch (error) {
      console.error('❌ Failed to fetch applications:', error);
      // Return empty array to avoid blocking UI
      return [];
    }
  }

  /**
   * Calculate application progress based on stage and available data
   */
  calculateProgress(application: Application): {
    completedSteps: number;
    totalSteps: number;
    progressPercentage: number;
    status: string;
    statusColor: string;
    statusBgColor: string;
    nextAction: string;
  } {
    const totalSteps = 4;
    let completedSteps = 0;
    let status = 'Not Started';
    let statusColor = 'text-gray-800';
    let statusBgColor = 'bg-gray-100';
    let nextAction = 'Start Your Application';

    // Determine progress based on application stage and data completeness
    switch (application.stage?.toLowerCase()) {
      case 'new':
      case 'submitted':
        completedSteps = 1;
        status = 'Application Submitted';
        statusColor = 'text-blue-800';
        statusBgColor = 'bg-blue-100';
        nextAction = 'Upload Required Documents';
        break;
      
      case 'document_review':
      case 'documents_pending':
        completedSteps = 2;
        status = 'Under Review';
        statusColor = 'text-yellow-800';
        statusBgColor = 'bg-yellow-100';
        nextAction = 'Wait for Document Review';
        break;
      
      case 'admitted':
      case 'accepted':
        completedSteps = 3;
        status = 'Admitted';
        statusColor = 'text-green-800';
        statusBgColor = 'bg-green-100';
        nextAction = 'Complete Enrollment';
        break;
      
      case 'enrolled':
        completedSteps = 4;
        status = 'Enrolled';
        statusColor = 'text-green-800';
        statusBgColor = 'bg-green-100';
        nextAction = 'Prepare for Classes';
        break;
      
      case 'rejected':
        completedSteps = 2;
        status = 'Application Declined';
        statusColor = 'text-red-800';
        statusBgColor = 'bg-red-100';
        nextAction = 'Contact Admissions';
        break;
      
      default:
        // Check if documents are available to determine step
        if (application.passportPhoto || application.academicDocuments || application.identificationDocument) {
          completedSteps = 2;
          status = 'Documents Uploaded';
          statusColor = 'text-blue-800';
          statusBgColor = 'bg-blue-100';
          nextAction = 'Wait for Review';
        }
        break;
    }

    const progressPercentage = Math.round((completedSteps / totalSteps) * 100);

    return {
      completedSteps,
      totalSteps,
      progressPercentage,
      status,
      statusColor,
      statusBgColor,
      nextAction
    };
  }

  // Update existing application data
  async updateApplicationData(applicationId: string, data: StudentApplicationData): Promise<{ success: boolean; message: string }> {
    try {
      // Ensure authentication
      if (!auth.currentUser) {
        await signInAnonymously(auth);
      }

      // Reference to the specific application document
      const applicationRef = doc(db, 'applications', applicationId);

      // Prepare update data
      const updateData = {
        name: `${data.firstName} ${data.lastName}`,
        email: data.email,
        phoneNumber: data.phone,
        countryOfBirth: data.countryOfBirth,
        gender: data.gender,
        postalAddress: data.postalAddress,
        preferredProgram: data.preferredProgram,
        modeOfStudy: data.modeOfStudy,
        preferredIntake: data.preferredIntake,
        sponsorTelephone: data.sponsorTelephone || null,
        sponsorEmail: data.sponsorEmail || null,
        howDidYouHear: data.howDidYouHear || null,
        additionalNotes: data.additionalNotes || null,
        updatedAt: new Date().toISOString(),
      };

      // Update the application document
      await updateDoc(applicationRef, updateData);

      console.log(`✅ Successfully updated application: ${applicationId}`);

      return {
        success: true,
        message: 'Application updated successfully'
      };

    } catch (error) {
      console.error('❌ Error updating application:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      return {
        success: false,
        message: `Failed to update application: ${errorMessage}`
      };
    }
  }

}

// Export singleton instance
export const studentApplicationService = new StudentApplicationService();
