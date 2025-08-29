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
import applicationNotificationService from '@/services/applicationNotificationService';

// Application data interface for application portal form submissions
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
  INTERESTED: "INTERESTED",
  APPLIED: "APPLIED",
  IN_REVIEW: "IN_REVIEW",
  QUALIFIED: "QUALIFIED",
  ADMITTED: "ADMITTED",
  ENROLLED: "ENROLLED",
  DEFERRED: "DEFERRED",
  EXPIRED: "EXPIRED",
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
  INTERESTED: "INTERESTED",
  APPLIED: "APPLIED",
  IN_REVIEW: "IN_REVIEW",
  QUALIFIED: "QUALIFIED",
  ADMITTED: "ADMITTED",
  ENROLLED: "ENROLLED",
  DEFERRED: "DEFERRED",
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
   * Updates existing leads from INTERESTED to APPLIED if they exist
   */
  async createApplicationAndLead(data: StudentApplicationData): Promise<DirectApplicationResponse> {
    try {
      console.log('🎯 Creating application and checking for existing lead...');
      
      // Ensure user is authenticated before proceeding
      await this.ensureAuthenticated();
      
      const currentTime = new Date();
      const applicationId = this.generateApplicationId();
      
      // 🔍 Check if a lead already exists for this email or phone
      const existingLead = await this.findExistingLead(data.email, data.phone);
      
      let leadId: string;
      let isUpdatingExistingLead = false;
      
      if (existingLead) {
        leadId = existingLead.id;
        isUpdatingExistingLead = true;
        console.log(`📋 Found existing lead ${leadId} with status: ${existingLead.status}`);
      } else {
        leadId = this.generateLeadId();
        console.log(`✨ Creating new lead ${leadId}`);
      }
      
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
        status: APPLICATION_STATUSES.APPLIED,
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
        leadId: leadId, // Link to existing or new lead
        whatsappMessageSent: false,
      };

      // Create timeline entry based on whether we're updating or creating
      const timelineEntry = {
        date: currentTime.toISOString(),
        action: isUpdatingExistingLead ? "APPLICATION_SUBMITTED" : "CREATED",
        status: LEAD_STATUSES.APPLIED,
        notes: isUpdatingExistingLead 
          ? `Lead status updated from ${existingLead?.status} to APPLIED - Application submitted`
          : `Lead created from APPLICATION_FORM with APPLIED status`,
      };

      // Prepare lead data (matching backend structure exactly)
      const leadData = {
        // Basic Info
        status: LEAD_STATUSES.APPLIED,
        source: existingLead?.source || LEAD_SOURCES.APPLICATION_FORM,
        createdAt: existingLead?.createdAt || currentTime.toISOString(),
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
        assignedTo: existingLead?.assignedTo || null,
        priority: existingLead?.priority || "MEDIUM",

        // Tracking
        totalInteractions: existingLead?.totalInteractions || 0,
        lastInteractionAt: existingLead?.lastInteractionAt || null,
        nextFollowUpDate: null,

        // Timeline - preserve existing timeline and add new entry
        timeline: [
          ...(Array.isArray(existingLead?.timeline) ? existingLead.timeline : []),
          timelineEntry
        ],

        // Notes
        notes: existingLead?.notes || "",
        tags: Array.isArray(existingLead?.tags) ? existingLead.tags : [],
      };

      console.log('📋 Application data prepared:', applicationData);
      console.log(`🔄 Lead data prepared - ${isUpdatingExistingLead ? 'UPDATING' : 'CREATING'} with APPLIED status:`, leadData);

      // Use Firestore batch to ensure atomicity
      const batch = writeBatch(db);
      
      // Add application document
      const applicationRef = doc(collection(db, 'applications'), applicationId);
      batch.set(applicationRef, applicationData);
      
      // Add or update lead document
      const leadRef = doc(collection(db, 'leads'), leadId);
      batch.set(leadRef, leadData);
      
      // Commit both documents atomically
      await batch.commit();

      const actionMessage = isUpdatingExistingLead 
        ? `Application created and existing lead ${leadId} updated from ${existingLead?.status} to APPLIED`
        : `Application and new lead created successfully`;

      console.log(`✅ ${actionMessage}`);
      console.log('📄 Application ID:', applicationId);
      console.log('👤 Lead ID:', leadId);

      return {
        success: true,
        message: actionMessage,
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
   * Find existing lead by email or phone number
   * Prioritizes email match, then phone match
   */
  private async findExistingLead(email: string, phone: string): Promise<{
    id: string;
    status: string;
    source: string;
    createdAt: string;
    assignedTo?: string;
    priority?: string;
    totalInteractions?: number;
    lastInteractionAt?: string;
    timeline?: Array<{
      date: string;
      action: string;
      status: string;
      notes: string;
    }>;
    notes?: string;
    tags?: string[];
  } | null> {
    try {
      console.log(`🔍 Searching for existing lead with email: ${email} or phone: ${phone}`);
      
      // Ensure authentication
      await this.ensureAuthenticated();
      
      // Check if user is still authenticated after ensureAuthenticated
      if (!auth.currentUser) {
        console.warn('⚠️ User authentication failed, skipping lead search');
        return null;
      }
      
      const leadsRef = collection(db, 'leads');
      
      // First, try to find by email (primary identifier)
      const emailQuery = query(
        leadsRef,
        where('email', '==', email.toLowerCase())
      );
      
      const emailSnapshot = await getDocs(emailQuery);
      
      if (!emailSnapshot.empty) {
        const leadDoc = emailSnapshot.docs[0];
        const leadData = leadDoc.data();
        
        console.log(`✅ Found existing lead by email: ${leadDoc.id} with status: ${leadData.status}`);
        
        return {
          id: leadDoc.id,
          status: leadData.status,
          source: leadData.source,
          createdAt: leadData.createdAt,
          assignedTo: leadData.assignedTo,
          priority: leadData.priority,
          totalInteractions: leadData.totalInteractions,
          lastInteractionAt: leadData.lastInteractionAt,
          timeline: leadData.timeline,
          notes: leadData.notes,
          tags: leadData.tags,
        };
      }
      
      // If no email match, try to find by phone number
      const phoneQuery = query(
        leadsRef,
        where('phone', '==', phone)
      );
      
      const phoneSnapshot = await getDocs(phoneQuery);
      
      if (!phoneSnapshot.empty) {
        const leadDoc = phoneSnapshot.docs[0];
        const leadData = leadDoc.data();
        
        console.log(`✅ Found existing lead by phone: ${leadDoc.id} with status: ${leadData.status}`);
        
        return {
          id: leadDoc.id,
          status: leadData.status,
          source: leadData.source,
          createdAt: leadData.createdAt,
          assignedTo: leadData.assignedTo,
          priority: leadData.priority,
          totalInteractions: leadData.totalInteractions,
          lastInteractionAt: leadData.lastInteractionAt,
          timeline: leadData.timeline,
          notes: leadData.notes,
          tags: leadData.tags,
        };
      }
      
      console.log(`ℹ️ No existing lead found for email: ${email} or phone: ${phone}`);
      return null;
      
    } catch (error: unknown) {
      console.error('❌ Error searching for existing lead:', error);
      
      // Handle specific Firebase permission errors
      if (error && typeof error === 'object' && 'code' in error) {
        const firebaseError = error as { code: string };
        if (firebaseError.code === 'permission-denied') {
          console.warn('⚠️ Permission denied accessing leads collection. User may not have required permissions.');
        } else if (firebaseError.code === 'unauthenticated') {
          console.warn('⚠️ User is not authenticated. Attempting to re-authenticate...');
          try {
            await this.ensureAuthenticated();
          } catch (authError) {
            console.error('❌ Re-authentication failed:', authError);
          }
        }
      }
      
      // Don't throw error, just return null to proceed with creating new lead
      return null;
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
      
      if (!existingUrl || existingUrl === '' || existingUrl === null || typeof existingUrl !== 'string') {
        console.log(`ℹ️ No existing ${documentType} found for application ${applicationId} or invalid URL type`);
        return;
      }
      
      console.log(`🔍 Found existing ${documentType} URL: ${existingUrl}`);
      
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
        
      } catch (parseError: unknown) {
        console.error(`❌ Error parsing URL for ${documentType}:`, parseError);
        console.log(`🔍 Problematic URL: ${existingUrl}`);
        console.log(`🔍 URL type: ${typeof existingUrl}`);
        
        // If it's a type error, log additional debug info
        if (parseError instanceof TypeError) {
          console.log(`🔍 TypeError details: ${parseError.message}`);
        }
        
        return;
      }
      
    } catch (error) {
      // Don't throw error if old file deletion fails - proceed with new upload
      if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'storage/object-not-found') {
        console.log(`ℹ️ Old ${documentType} file not found in storage (may have been deleted already)`);
      } else {
        console.warn(`⚠️ Failed to delete old ${documentType}:`, error);
      }
    }
  }

  /**
   * Upload document to Firebase Storage and update Firestore with public URL by email
   * Handles passport photos, academic documents, and identification documents
   * Automatically deletes previous document to save storage space
   */
  async uploadDocumentAndUpdateFirestoreByEmail(email: string, upload: Omit<DocumentUpload, 'applicationId' | 'studentEmail'>): Promise<DocumentUploadResponse> {
    try {
      // Get applications by email to find the most recent one
      const applications = await this.getApplicationsByEmail(email);
      
      if (applications.length === 0) {
        throw new Error('No applications found for the provided email');
      }

      // Use the most recent application
      const latestApplication = applications[0];
      
      // Create full upload object with application details
      const fullUpload: DocumentUpload = {
        ...upload,
        applicationId: latestApplication.id,
        studentEmail: email,
      };

      console.log(`📤 Uploading ${upload.type} for email ${email} (application ${latestApplication.id})...`);
      
      return await this.uploadDocumentAndUpdateFirestore(fullUpload);

    } catch (error) {
      console.error(`❌ Error uploading document by email:`, error);
      throw error;
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
      try {
        await this.deleteOldDocument(upload.applicationId, upload.type);
      } catch (deleteError) {
        console.warn(`⚠️ Non-critical error deleting old document:`, deleteError);
        // Continue with upload even if deletion fails
      }
      
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
   * Submit application immediately and process documents in background
   * This provides instant feedback to users while documents upload asynchronously
   */
  async submitApplicationWithBackgroundDocuments(data: StudentApplicationData, files?: {
    passportPhoto?: File;
    academicDocuments: File[];
    identificationDocuments: File[];
  }): Promise<DirectApplicationResponse & { documentProcessing?: Promise<DocumentUploadResponse[]> }> {
    try {
      console.log('🚀 Starting optimized application submission...');
      
      // 1. Submit application immediately without waiting for documents
      const applicationResult = await this.createApplicationAndLead(data);
      
      if (!applicationResult.success) {
        throw new Error(applicationResult.message || 'Failed to create application');
      }
      
      // 2. Start document processing in background if files exist
      let documentProcessingPromise: Promise<DocumentUploadResponse[]> | undefined;
      
      if (files && (files.passportPhoto || files.academicDocuments?.length || files.identificationDocuments?.length)) {
        console.log('📤 Starting background document processing...');
        
        const uploads: DocumentUpload[] = [];
        
        // Prepare upload array
        if (files.passportPhoto) {
          uploads.push({
            file: files.passportPhoto,
            type: 'passportPhoto' as const,
            applicationId: applicationResult.applicationId,
            studentEmail: data.email,
          });
        }
        
        if (files.academicDocuments?.length) {
          uploads.push({
            file: files.academicDocuments[0],
            type: 'academicDocuments' as const,
            applicationId: applicationResult.applicationId,
            studentEmail: data.email,
          });
        }
        
        if (files.identificationDocuments?.length) {
          uploads.push({
            file: files.identificationDocuments[0],
            type: 'identificationDocument' as const,
            applicationId: applicationResult.applicationId,
            studentEmail: data.email,
          });
        }
        
        // Start parallel document upload (don't await)
        documentProcessingPromise = this.uploadMultipleDocuments(uploads);
        
        // Optionally handle completion in background
        documentProcessingPromise.then((results) => {
          const successCount = results.filter(r => r.success).length;
          console.log(`✅ Background document processing completed: ${successCount}/${results.length} successful`);
        }).catch((error) => {
          console.error('❌ Background document processing failed:', error);
        });
      }
      
      // 3. Send application submission notifications (email and WhatsApp)
      try {
        console.log('📧 Sending application submission notifications...');
        applicationNotificationService.sendApplicationSubmissionNotifications({
          applicationId: applicationResult.applicationId,
          phoneNumber: data.phone,
          email: data.email,
        }).then((notificationResult) => {
          if (notificationResult.success) {
            console.log('✅ Application notifications sent successfully');
          } else {
            console.warn('⚠️ Application notifications failed:', notificationResult.error);
          }
        }).catch((error) => {
          console.error('❌ Error sending application notifications:', error);
        });
      } catch (error) {
        console.error('❌ Non-critical error with notifications:', error);
        // Don't fail the entire submission for notification errors
      }
      
      return {
        ...applicationResult,
        documentProcessing: documentProcessingPromise
      };
      
    } catch (error) {
      console.error('❌ Error in optimized application submission:', error);
      throw error;
    }
  }

  /**
   * Upload multiple documents with batch Firestore updates (OPTIMIZED)
   */
  async uploadMultipleDocumentsOptimized(uploads: DocumentUpload[]): Promise<DocumentUploadResponse[]> {
    try {
      console.log(`📤 Uploading ${uploads.length} documents with batch operations...`);
      
      // 1. Delete old documents in parallel
      const deletePromises = uploads.map(upload => 
        this.deleteOldDocument(upload.applicationId, upload.type).catch(err => {
          console.warn(`⚠️ Failed to delete old ${upload.type}:`, err);
        })
      );
      await Promise.all(deletePromises);
      
      // 2. Upload all files to storage in parallel
      const uploadPromises = uploads.map(async (upload) => {
        try {
          // Validate file
          if (!upload.file || upload.file.size === 0) {
            throw new Error('No file provided or file is empty');
          }

          // Check file size (max 10MB)
          const maxSize = 10 * 1024 * 1024;
          if (upload.file.size > maxSize) {
            throw new Error('File size must be less than 10MB');
          }

          // Generate unique filename
          const timestamp = Date.now();
          const fileExtension = upload.file.name.split('.').pop() || 'unknown';
          const sanitizedEmail = upload.studentEmail.replace(/[^a-zA-Z0-9]/g, '_');
          const fileName = `${upload.type}_${upload.applicationId}_${sanitizedEmail}_${timestamp}.${fileExtension}`;
          const storagePath = `applications/${upload.applicationId}/documents/${fileName}`;
          
          // Upload to Firebase Storage
          const storageRef = ref(storage, storagePath);
          const uploadTask = await uploadBytes(storageRef, upload.file);
          const downloadUrl = await getDownloadURL(uploadTask.ref);

          return {
            upload,
            downloadUrl,
            fileName,
            success: true
          };
        } catch (error) {
          console.error(`❌ Upload failed for ${upload.type}:`, error);
          return {
            upload,
            downloadUrl: '',
            fileName: '',
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      });

      const uploadResults = await Promise.all(uploadPromises);
      
      // 3. Batch update Firestore with all document URLs
      const successfulUploads = uploadResults.filter(result => result.success);
      
      if (successfulUploads.length > 0) {
        const applicationId = uploads[0].applicationId;
        const updateData: Record<string, string | Date> = {
          updatedAt: new Date(),
        };
        
        // Add all document URLs to update
        successfulUploads.forEach(result => {
          updateData[result.upload.type] = result.downloadUrl;
        });
        
        try {
          const applicationRef = doc(db, 'applications', applicationId);
          await updateDoc(applicationRef, updateData);
          console.log(`✅ Batch updated Firestore with ${successfulUploads.length} document URLs`);
        } catch (firestoreError) {
          console.warn('⚠️ Files uploaded but Firestore batch update failed:', firestoreError);
        }
      }
      
      // 4. Format response
      const results: DocumentUploadResponse[] = uploadResults.map(result => ({
        success: result.success,
        message: result.success 
          ? `${result.upload.type} uploaded successfully`
          : `Failed to upload ${result.upload.type}: ${result.error}`,
        documentType: result.upload.type,
        downloadUrl: result.downloadUrl,
        fileName: result.fileName,
      }));

      const successCount = results.filter(r => r.success).length;
      console.log(`✅ Batch upload completed: ${successCount}/${uploads.length} successful`);

      return results;
    } catch (error) {
      console.error('❌ Error in optimized multiple document upload:', error);
      throw error;
    }
  }

  /**
   * Upload multiple documents for an application (OPTIMIZED - Parallel processing)
   */
  async uploadMultipleDocuments(uploads: DocumentUpload[]): Promise<DocumentUploadResponse[]> {
    try {
      console.log(`📤 Uploading ${uploads.length} documents in parallel...`);
      
      // Process all uploads in parallel for better performance
      const uploadPromises = uploads.map(async (upload) => {
        try {
          const result = await this.uploadDocumentAndUpdateFirestore(upload);
          return result;
        } catch (error) {
          console.error(`❌ Failed to upload ${upload.type}:`, error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          return {
            success: false,
            message: `Failed to upload ${upload.type}: ${errorMessage}`,
            documentType: upload.type,
            downloadUrl: '',
            fileName: '',
          };
        }
      });

      // Wait for all uploads to complete
      const results = await Promise.all(uploadPromises);

      const successCount = results.filter(r => r.success).length;
      console.log(`✅ Uploaded ${successCount}/${uploads.length} documents successfully (parallel processing)`);

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
          status: data.status || APPLICATION_STATUSES.APPLIED,
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
        });
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
    const totalSteps = 5; // 5 steps total for better granularity
    let completedSteps = 0;
    let progressPercentage = 0; // Default to 0%
    let status = 'Not Started';
    let statusColor = 'text-gray-800';
    let statusBgColor = 'bg-gray-100';
    let nextAction = 'Start Your Application';

    // Determine progress based on application status with fixed percentages
    switch (application.status?.toLowerCase()) {
      case 'interested':
        completedSteps = 0;
        progressPercentage = 0;
        status = 'Interest Expressed';
        statusColor = 'text-blue-800';
        statusBgColor = 'bg-blue-100';
        nextAction = 'Complete Your Application';
        break;
        
      case 'applied':
        completedSteps = 1;
        progressPercentage = 20; // Fixed 20%
        status = 'Application Submitted';
        statusColor = 'text-purple-800';
        statusBgColor = 'bg-purple-100';
        nextAction = 'Upload Required Documents';
        break;
      
      case 'in_review':
        completedSteps = 2;
        progressPercentage = 40; // Fixed 40%
        status = 'Under Review';
        statusColor = 'text-yellow-800';
        statusBgColor = 'bg-yellow-100';
        nextAction = 'Wait for Review Completion';
        break;
      
      case 'qualified':
        completedSteps = 3;
        progressPercentage = 60; // Fixed 60%
        status = 'Qualified';
        statusColor = 'text-orange-800';
        statusBgColor = 'bg-orange-100';
        nextAction = 'Wait for Admission Decision';
        break;
      
      case 'admitted':
        completedSteps = 4;
        progressPercentage = 80; // Fixed 80%
        status = 'Admitted';
        statusColor = 'text-green-800';
        statusBgColor = 'bg-green-100';
        nextAction = 'Complete Enrollment';
        break;
      
      case 'enrolled':
        completedSteps = 5;
        progressPercentage = 100; // Fixed 100%
        status = 'Enrolled';
        statusColor = 'text-emerald-800';
        statusBgColor = 'bg-emerald-100';
        nextAction = 'Access Application Portal';
        break;
        
      case 'deferred':
        completedSteps = 0;
        progressPercentage = 0; // Fixed 0% for deferred
        status = 'Deferred';
        statusColor = 'text-amber-800';
        statusBgColor = 'bg-amber-100';
        nextAction = 'Wait for Next Intake';
        break;
        
      case 'expired':
        completedSteps = 0;
        progressPercentage = 0; // Fixed 0% for expired
        status = 'Application Expired';
        statusColor = 'text-red-800';
        statusBgColor = 'bg-red-100';
        nextAction = 'Submit New Application';
        break;
      
      case 'rejected':
        completedSteps = 0;
        progressPercentage = 0; // Fixed 0% for rejected
        status = 'Application Declined';
        statusColor = 'text-red-800';
        statusBgColor = 'bg-red-100';
        nextAction = 'Contact Admissions';
        break;
      
      default:
        // Check if documents are available to determine step
        if (application.passportPhoto || application.academicDocuments || application.identificationDocument) {
          completedSteps = 1;
          progressPercentage = 15; // Slight progress for document upload
          status = 'Documents Uploaded';
          statusColor = 'text-blue-800';
          statusBgColor = 'bg-blue-100';
          nextAction = 'Wait for Review';
        }
        break;
    }

    // Ensure progress percentage never exceeds 100% or goes below 0%
    progressPercentage = Math.max(0, Math.min(100, progressPercentage));

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

  // Update existing application data by email
  async updateApplicationDataByEmail(email: string, data: StudentApplicationData): Promise<{ success: boolean; message: string }> {
    try {
      // Ensure authentication
      if (!auth.currentUser) {
        await signInAnonymously(auth);
      }

      // Get applications by email to find the most recent one
      const applications = await this.getApplicationsByEmail(email);
      
      if (applications.length === 0) {
        return {
          success: false,
          message: 'No applications found for the provided email'
        };
      }

      // Use the most recent application
      const latestApplication = applications[0];
      const applicationRef = doc(db, 'applications', latestApplication.id);

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

      console.log(`✅ Successfully updated application: ${latestApplication.id} by email: ${email}`);

      return {
        success: true,
        message: 'Application updated successfully'
      };

    } catch (error) {
      console.error('❌ Error updating application by email:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      return {
        success: false,
        message: `Failed to update application: ${errorMessage}`
      };
    }
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
