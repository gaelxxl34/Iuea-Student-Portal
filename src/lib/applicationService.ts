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
  getDoc,
  setDoc,
  deleteDoc,
  limit
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
  dateOfBirth: string;
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
  dateOfBirth?: string;
  gender: string;
  modeOfStudy: string;
  preferredIntake: string;
  preferredProgram: string;
  postalAddress?: string;
  status: string;
  submittedAt: string;
  updatedAt: string;
  passportPhoto?: string;
  academicDocuments?: string[]; // Changed to array to support multiple documents
  identificationDocument?: string;
  // Add sponsor and additional information fields
  sponsorTelephone?: string;
  sponsorEmail?: string;
  howDidYouHear?: string;
  additionalNotes?: string;
}

export interface DraftDocumentMetadata {
  downloadUrl: string;
  fileName: string;
  size: number;
  contentType: string;
  uploadedAt: string;
  type: 'passportPhoto' | 'academicDocuments' | 'identificationDocument';
}

export interface ApplicationDraft {
  id: string;
  email: string;
  uid?: string;
  status: 'draft';
  formData: Partial<StudentApplicationData>;
  activeSection?: string;
  lastSavedAt?: string;
  createdAt: string;
  updatedAt: string;
  documents: {
    passportPhoto?: DraftDocumentMetadata;
    identificationDocument?: DraftDocumentMetadata;
    academicDocuments: DraftDocumentMetadata[];
  };
}

// Lead constants (matching backend)
export const LEAD_STATUSES = {
  INTERESTED: "INTERESTED",
  APPLIED: "APPLIED",
  MISSING_DOCUMENT: "MISSING_DOCUMENT",
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
  MISSING_DOCUMENT: "MISSING_DOCUMENT",
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
  // Cooldown map to avoid spamming permission-denied queries per email
  private applicationsFetchCooldown: Record<string, number> = {};
  // One-time flag to avoid noisy logs
  private hasLoggedApplicationsPermissionDenied = false;
  constructor() {
    console.log('🔧 StudentApplicationService initialized for direct Firebase integration');
  }

  private getDraftRef(applicationId: string) {
    return doc(db, 'applicationDrafts', applicationId);
  }

  private mapDraftSnapshot(applicationId: string, data: DocumentData): ApplicationDraft {
    const passportPhotoRaw = data.documents?.passportPhoto;
    const identificationRaw = data.documents?.identificationDocument;
    const academicRaw = data.documents?.academicDocuments;

    // Note: This function uses undefined for missing fields in the TypeScript model
    // When writing back to Firestore, convert undefined to null or omit fields entirely,
    // as Firestore doesn't accept undefined values
    return {
      id: applicationId,
      email: (data.email as string) || '',
      uid: data.uid as string | undefined,
      status: 'draft',
      formData: (data.formData as Partial<StudentApplicationData>) || {},
      activeSection: data.activeSection as string | undefined,
      lastSavedAt: data.lastSavedAt as string | undefined,
      createdAt: (data.createdAt as string) || new Date().toISOString(),
      updatedAt: (data.updatedAt as string) || new Date().toISOString(),
      documents: {
        passportPhoto: passportPhotoRaw && typeof passportPhotoRaw === 'object'
          ? (passportPhotoRaw as DraftDocumentMetadata)
          : undefined,
        identificationDocument: identificationRaw && typeof identificationRaw === 'object'
          ? (identificationRaw as DraftDocumentMetadata)
          : undefined,
        academicDocuments: Array.isArray(academicRaw)
          ? (academicRaw as DraftDocumentMetadata[])
          : [],
      },
    };
  }

  async ensureDraftApplication(email: string, uid?: string): Promise<ApplicationDraft> {
    // Create a hybrid approach that works with both Firestore and localStorage
    const normalizedEmail = email.trim().toLowerCase();
    const effectiveUid = uid ?? auth.currentUser?.uid;
    const applicationId = this.generateApplicationId();
    const now = new Date().toISOString();
    let draftFromFirestore: ApplicationDraft | null = null;
    let draftFromLocalStorage: ApplicationDraft | null = null;

    // Try to find a draft in localStorage first
    try {
      if (typeof window !== 'undefined') {
        // Look for any localStorage keys that might contain this user's draft
        const possibleKeys: string[] = [];
        
        // Scan localStorage for potential draft keys
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith('application_draft_')) {
            possibleKeys.push(key);
          }
        }
        
        // Check each possible draft for matching email
        for (const key of possibleKeys) {
          try {
            const savedDraft = JSON.parse(localStorage.getItem(key) || '{}');
            if (savedDraft?.formData?.email === normalizedEmail || 
                savedDraft?.email === normalizedEmail) {
              
              // Found a matching draft
              draftFromLocalStorage = {
                id: key.replace('application_draft_', ''),
                email: normalizedEmail,
                uid: effectiveUid,
                status: 'draft',
                formData: savedDraft.formData || {},
                activeSection: savedDraft.activeSection || 'personal',
                lastSavedAt: savedDraft.lastSavedAt || now,
                createdAt: savedDraft.createdAt || now,
                updatedAt: now,
                documents: savedDraft.documents || { academicDocuments: [] },
              };
              break;
            }
          } catch (parseError) {
            console.warn('Failed to parse localStorage draft:', parseError);
          }
        }
      }
    } catch (localStorageError) {
      console.warn('Error accessing localStorage:', localStorageError);
    }

    // Try to get draft from Firestore if possible (but don't fail if it doesn't work)
    // Use our silent authentication check to avoid unnecessary errors
    const isAuthenticated = await this.ensureAuthenticated(true);
    if (isAuthenticated) {
      try {
        const draftsRef = collection(db, 'applicationDrafts');
        const draftQuery = query(draftsRef, where('email', '==', normalizedEmail), where('uid', '==', effectiveUid), limit(1));
        
        try {
          const snapshot = await getDocs(draftQuery);
          
          if (!snapshot.empty) {
            const draftDoc = snapshot.docs[0];
            const draftData = draftDoc.data();
            draftFromFirestore = this.mapDraftSnapshot(draftDoc.id, draftData);
            
            // Update the UID if needed
            if (!draftFromFirestore.uid || draftFromFirestore.uid !== effectiveUid) {
              try {
                await updateDoc(draftDoc.ref, { uid: effectiveUid });
                draftFromFirestore.uid = effectiveUid;
              } catch (_) {
                // Silent fail - we'll continue with the draft we have
              }
            }
          }
        } catch (_) {
          // Silent fail - we'll fall back to localStorage
        }
      } catch (_) {
        // Silent fail - we'll fall back to localStorage
      }
    }

    // If we have a Firestore draft, use it (it takes priority)
    if (draftFromFirestore) {
      // Also update localStorage with this draft for redundancy
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem(
            `application_draft_${draftFromFirestore.id}`, 
            JSON.stringify(draftFromFirestore)
          );
        }
      } catch (_) {
        // Silent fail - localStorage is just a backup
      }
      
      console.log('✅ Found existing draft in Firestore:', draftFromFirestore.id);
      return draftFromFirestore;
    }
    
    // If we have a localStorage draft, use it
    if (draftFromLocalStorage) {
      console.log('✅ Found existing draft in localStorage:', draftFromLocalStorage.id);
      
      // Try to sync this to Firestore if possible (but don't fail if it doesn't work)
      const isAuthenticated = await this.ensureAuthenticated(true);
      if (isAuthenticated) {
        try {
          await setDoc(
            this.getDraftRef(draftFromLocalStorage.id), 
            {...draftFromLocalStorage, id: undefined}
          );
          console.log('✅ Synced localStorage draft to Firestore');
        } catch (_) {
          // Silent fail - localStorage is our source of truth here
        }
      }
      
      return draftFromLocalStorage;
    }
    
    // Create a new draft in both localStorage and Firestore
    const newDraftId = applicationId;
    const newDraft: ApplicationDraft = {
      id: newDraftId,
      email: normalizedEmail,
      uid: effectiveUid,
      status: 'draft',
      formData: {},
      activeSection: 'personal',
      lastSavedAt: now,
      createdAt: now,
      updatedAt: now,
      documents: {
        academicDocuments: [],
      },
    };
    
    // Save to localStorage first (this should always work)
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          `application_draft_${newDraftId}`, 
          JSON.stringify(newDraft)
        );
        console.log('✅ Created new draft in localStorage:', newDraftId);
      }
    } catch (localSaveError) {
      console.warn('Could not save new draft to localStorage:', localSaveError);
    }
    
    // Try to save to Firestore if possible (but don't fail if it doesn't work)
    const isAuthenticatedForCreate = await this.ensureAuthenticated(true);
    if (isAuthenticatedForCreate) {
      try {
        await setDoc(this.getDraftRef(newDraftId), {...newDraft, id: undefined});
        console.log('✅ Created new draft in Firestore:', newDraftId);
      } catch (_) {
        // Silent fail - localStorage is our fallback
      }
    }
    
    return newDraft;
  }

  async loadDraftByEmail(email: string): Promise<ApplicationDraft | null> {
    // Check for authentication silently
    const isAuthenticated = await this.ensureAuthenticated(true);
    if (!isAuthenticated) {
      // If not authenticated, check localStorage instead
      return this.loadDraftFromLocalStorageByEmail(email);
    }

    try {
      const normalizedEmail = email.toLowerCase();
      const draftsRef = collection(db, 'applicationDrafts');
      // Only query drafts owned by current user
      const draftQuery = query(draftsRef, where('email', '==', normalizedEmail), where('uid', '==', auth.currentUser?.uid), limit(1));
      const snapshot = await getDocs(draftQuery);

      if (snapshot.empty) {
        // If not in Firestore, try localStorage
        return this.loadDraftFromLocalStorageByEmail(email);
      }

      const draftDoc = snapshot.docs[0];
      return this.mapDraftSnapshot(draftDoc.id, draftDoc.data());
    } catch (_) {
      // On any Firestore error, fall back to localStorage
      return this.loadDraftFromLocalStorageByEmail(email);
    }
  }
  
  private loadDraftFromLocalStorageByEmail(email: string): ApplicationDraft | null {
    if (typeof window === 'undefined') {
      return null;
    }
    
    const normalizedEmail = email.toLowerCase();
    
    // Look for any localStorage keys that might contain this user's draft
    const possibleKeys: string[] = [];
    
    // Scan localStorage for potential draft keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('application_draft_')) {
        possibleKeys.push(key);
      }
    }
    
    // Check each possible draft for matching email
    for (const key of possibleKeys) {
      try {
        const savedDraft = JSON.parse(localStorage.getItem(key) || '{}');
        if (savedDraft?.formData?.email === normalizedEmail || 
            savedDraft?.email === normalizedEmail) {
          
          const now = new Date().toISOString();
          // Found a matching draft
          return {
            id: key.replace('application_draft_', ''),
            email: normalizedEmail,
            uid: auth.currentUser?.uid,
            status: 'draft',
            formData: savedDraft.formData || {},
            activeSection: savedDraft.activeSection || 'personal',
            lastSavedAt: savedDraft.lastSavedAt || now,
            createdAt: savedDraft.createdAt || now,
            updatedAt: now,
            documents: savedDraft.documents || { academicDocuments: [] },
          };
        }
      } catch (parseError) {
        console.warn('Failed to parse localStorage draft:', parseError);
      }
    }
    
    return null;
  }

  /**
   * Get draft document metadata from a draft application
   * This allows the UI to display previously uploaded documents after page refresh
   */
  async getDraftDocuments(draftId: string): Promise<{
    academicDocuments: DraftDocumentMetadata[];
    passportPhoto?: DraftDocumentMetadata;
    identificationDocument?: DraftDocumentMetadata;
  } | null> {
    try {
      // First check if the draft exists
      const draftRef = this.getDraftRef(draftId);
      const draftSnapshot = await getDoc(draftRef);
      
      if (!draftSnapshot.exists()) {
        console.warn('⚠️ Draft documents not found, draft does not exist:', draftId);
        return null;
      }
      
      const data = draftSnapshot.data();
      const documents = data.documents || {};
      
      // Return the documents structure with proper typing
      return {
        academicDocuments: Array.isArray(documents.academicDocuments) 
          ? documents.academicDocuments 
          : [],
        passportPhoto: documents.passportPhoto || undefined,
        identificationDocument: documents.identificationDocument || undefined
      };
    } catch (error) {
      console.error('❌ Failed to get draft documents:', error);
      return null;
    }
  }
  
  async saveDraft(applicationId: string, payload: {
    formData: Partial<StudentApplicationData>;
    activeSection?: string;
    lastSavedAt?: string;
  }): Promise<void> {
    // Try to save to both Firestore (if possible) and localStorage
    const now = new Date().toISOString();
    
    // Save to localStorage first (this always works)
    try {
      // Create localStorage backup
      if (typeof window !== 'undefined') {
        const localStorageKey = `application_draft_${applicationId}`;
        const existingData = localStorage.getItem(localStorageKey);
        const currentData = existingData ? JSON.parse(existingData) : {};
        
        const localStoragePayload = {
          id: applicationId,
          formData: { ...(currentData.formData || {}), ...payload.formData },
          activeSection: payload.activeSection || currentData.activeSection || 'personal',
          lastSavedAt: payload.lastSavedAt || now,
          updatedAt: now,
        };
        
        localStorage.setItem(localStorageKey, JSON.stringify(localStoragePayload));
        console.log('💾 Draft saved to localStorage', { id: applicationId });
      }
    } catch (localError) {
      console.error('❌ Failed to save draft to localStorage:', localError);
    }
    
    // Then try to save to Firestore - using silent auth check to avoid unnecessary errors
    const isAuthenticated = await this.ensureAuthenticated(true);
    if (!isAuthenticated) {
      // Silently exit after localStorage save - no need for console warnings
      return;
    }
    
    try {
      // Validate applicationId
      if (!applicationId || applicationId.trim().length === 0) {
        return; // Exit silently after localStorage save
      }

      const draftRef = this.getDraftRef(applicationId);
      let data: DocumentData = {};
      let currentFormData = {};
      
      try {
        const draftSnapshot = await getDoc(draftRef);
        if (draftSnapshot.exists()) {
          data = draftSnapshot.data();
          currentFormData = (data.formData as Partial<StudentApplicationData>) || {};
        }
      } catch (_) {
        // Silently handle this error - it's expected with permission issues
        // and we've already saved to localStorage
      }

      const updatePayload = {
        formData: { ...currentFormData, ...payload.formData },
        activeSection: payload.activeSection ?? data.activeSection ?? 'personal',
        lastSavedAt: payload.lastSavedAt ?? now,
        updatedAt: now,
        email: data.email || auth.currentUser?.email?.toLowerCase(),
        uid: data.uid || auth.currentUser?.uid,
      };

      try {
        await updateDoc(draftRef, updatePayload);
        console.log('✅ Draft saved to Firestore');
      } catch (_) {
        // If update fails, try to create the document
        try {
          await setDoc(draftRef, updatePayload);
          console.log('✅ Created new draft in Firestore');
        } catch (_) {
          // Silently handle this error - localStorage backup already worked
        }
      }
    } catch (_) {
      // Silently handle Firestore errors - localStorage backup already worked
    }
  }

  private async deleteExistingDraftDocumentFile(applicationId: string, metadata?: DraftDocumentMetadata) {
    if (!metadata) return;

    try {
      let storagePath: string | null = null;

      if (metadata.downloadUrl.includes('/o/')) {
        const urlParts = metadata.downloadUrl.split('/o/')[1]?.split('?')[0];
        if (urlParts) storagePath = decodeURIComponent(urlParts);
      } else if (metadata.downloadUrl.startsWith('gs://')) {
        storagePath = metadata.downloadUrl.replace(/^gs:\/\/[^\/]+\//, '');
      } else if (metadata.downloadUrl.includes('applications/')) {
        storagePath = metadata.downloadUrl;
      }

      if (!storagePath) {
        console.warn('⚠️ Unable to derive storage path for draft document:', metadata.downloadUrl);
        return;
      }

      const fileRef = ref(storage, storagePath);
      await deleteObject(fileRef);
      console.log('🧹 Deleted draft document from storage:', storagePath);
    } catch (error) {
      console.warn('⚠️ Failed to delete draft document file:', error);
    }
  }

  async uploadDraftDocument(upload: DocumentUpload): Promise<DraftDocumentMetadata> {
    // Check for authentication
    const isAuthenticated = await this.ensureAuthenticated(true);
    if (!isAuthenticated) {
      throw new Error("Unable to upload document - authentication required");
    }

    const draftRef = this.getDraftRef(upload.applicationId);
    let draftSnapshot;
    try {
      draftSnapshot = await getDoc(draftRef);
    } catch (_) {
      throw new Error("Failed to access draft application - permission denied");
    }

    if (!draftSnapshot.exists()) {
      throw new Error('Draft application not found');
    }

    if (!upload.file || upload.file.size === 0) {
      throw new Error('No file provided or file is empty');
    }

    const maxSize = 10 * 1024 * 1024;
    if (upload.file.size > maxSize) {
      throw new Error('File size must be less than 10MB');
    }

    const allowedTypes = {
      passportPhoto: ['image/jpeg', 'image/jpg', 'image/png'],
      academicDocuments: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
      identificationDocument: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
    } satisfies Record<DocumentUpload['type'], string[]>;

    if (!allowedTypes[upload.type].includes(upload.file.type)) {
      throw new Error(`Invalid file type for ${upload.type}. Allowed: ${allowedTypes[upload.type].join(', ')}`);
    }

    const draftData = this.mapDraftSnapshot(upload.applicationId, draftSnapshot.data());

    if (upload.type === 'academicDocuments' && draftData.documents.academicDocuments.length >= 5) {
      throw new Error('Maximum of 5 academic documents allowed. Please remove some documents before uploading new ones.');
    }

    if (upload.type !== 'academicDocuments') {
      await this.deleteExistingDraftDocumentFile(upload.applicationId, draftData.documents[upload.type]);
    }

    const timestamp = Date.now();
    const fileExtension = upload.file.name.split('.').pop() || 'unknown';
    const sanitizedEmail = upload.studentEmail.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `draft_${upload.type}_${upload.applicationId}_${sanitizedEmail}_${timestamp}.${fileExtension}`;
    const storagePath = `applications/${upload.applicationId}/documents/${fileName}`;

    const storageRef = ref(storage, storagePath);
    const uploadTask = await uploadBytes(storageRef, upload.file);
    const downloadUrl = await getDownloadURL(uploadTask.ref);

    const metadata: DraftDocumentMetadata = {
      downloadUrl,
      fileName,
      size: upload.file.size,
      contentType: upload.file.type,
      uploadedAt: new Date().toISOString(),
      type: upload.type,
    };

    // Create a clean documents object for Firebase with no undefined values
    const documentsUpdate: {
      academicDocuments: DraftDocumentMetadata[];
      passportPhoto?: DraftDocumentMetadata | null;
      identificationDocument?: DraftDocumentMetadata | null;
    } = {
      // Always include academicDocuments as an array
      academicDocuments: [...(draftData.documents.academicDocuments || [])],
    };
    
    // Only include defined properties for passport photo and ID document
    if (draftData.documents.passportPhoto || upload.type === 'passportPhoto') {
      documentsUpdate.passportPhoto = upload.type === 'passportPhoto' 
        ? metadata 
        : draftData.documents.passportPhoto || null;
    }
    
    if (draftData.documents.identificationDocument || upload.type === 'identificationDocument') {
      documentsUpdate.identificationDocument = upload.type === 'identificationDocument'
        ? metadata
        : draftData.documents.identificationDocument || null;
    }
    
    // Add the new document to the appropriate collection
    if (upload.type === 'academicDocuments') {
      documentsUpdate.academicDocuments.push(metadata);
    }

    await updateDoc(draftRef, {
      documents: documentsUpdate,
      updatedAt: new Date().toISOString(),
    });

    return metadata;
  }

  async deleteDraftDocument(applicationId: string, documentType: 'passportPhoto' | 'academicDocuments' | 'identificationDocument', downloadUrl?: string): Promise<void> {
    // Check for authentication
    const isAuthenticated = await this.ensureAuthenticated(true);
    if (!isAuthenticated) {
      throw new Error("Unable to delete document - authentication required");
    }

    const draftRef = this.getDraftRef(applicationId);
    let draftSnapshot;
    try {
      draftSnapshot = await getDoc(draftRef);
    } catch (_) {
      throw new Error("Failed to access draft application - permission denied");
    }

    if (!draftSnapshot.exists()) {
      throw new Error('Draft application not found');
    }

    const draftData = this.mapDraftSnapshot(applicationId, draftSnapshot.data());

    if (documentType === 'academicDocuments') {
      // Handle academic documents separately since they're an array
      const filtered = draftData.documents.academicDocuments.filter((doc) => doc.downloadUrl !== downloadUrl);

      const removedItems = draftData.documents.academicDocuments.filter((doc) => doc.downloadUrl === downloadUrl);
      await Promise.all(removedItems.map((item) => this.deleteExistingDraftDocumentFile(applicationId, item)));

      await updateDoc(draftRef, {
        'documents.academicDocuments': filtered,
        updatedAt: new Date().toISOString(),
      });
      return;
    }

    // Handle single document types (passportPhoto, identificationDocument)
    const metadata = draftData.documents[documentType];
    await this.deleteExistingDraftDocumentFile(applicationId, metadata);
    
    // Create a clean update for Firestore that avoids undefined values
    const updatePayload: Record<string, string | null | number | boolean | Date> = {
      updatedAt: new Date().toISOString(),
    };
    
    // Set the field to null explicitly (not undefined)
    updatePayload[`documents.${documentType}`] = null;
    
    await updateDoc(draftRef, updatePayload);
  }

  async deleteDraft(applicationId: string, options?: { removeFiles?: boolean }): Promise<void> {
    await this.ensureAuthenticated();

    const draftRef = this.getDraftRef(applicationId);
    const draftSnapshot = await getDoc(draftRef);

    if (!draftSnapshot.exists()) {
      return;
    }

    const draftData = this.mapDraftSnapshot(applicationId, draftSnapshot.data());

    if (options?.removeFiles) {
      const deletions: Promise<void>[] = [];

      if (draftData.documents.passportPhoto) {
        deletions.push(this.deleteExistingDraftDocumentFile(applicationId, draftData.documents.passportPhoto));
      }
      if (draftData.documents.identificationDocument) {
        deletions.push(this.deleteExistingDraftDocumentFile(applicationId, draftData.documents.identificationDocument));
      }
      draftData.documents.academicDocuments.forEach((item) => {
        deletions.push(this.deleteExistingDraftDocumentFile(applicationId, item));
      });

      await Promise.all(deletions);
    }

    await deleteDoc(draftRef);
  }

  async promoteDraftToSubmitted(applicationId: string, data: StudentApplicationData): Promise<DirectApplicationResponse> {
    await this.ensureAuthenticated();

    const draftRef = this.getDraftRef(applicationId);
    const draftSnapshot = await getDoc(draftRef);

    if (!draftSnapshot.exists()) {
      throw new Error('Draft application not found');
    }

    const draft = this.mapDraftSnapshot(applicationId, draftSnapshot.data());

    const response = await this.createApplicationAndLead(data, {
      applicationId,
      documents: draft.documents,
      createdAt: draft.createdAt,
      submittedAt: new Date().toISOString(),
    });

    // Remove draft document but keep files as they are now referenced by the submitted application
    await this.deleteDraft(applicationId, { removeFiles: false });

    return response;
  }

  /**
   * Create application and lead directly in Firestore
   * Uses Firebase client SDK with proper authentication
   * Updates existing leads from INTERESTED to APPLIED if they exist
   */
  async createApplicationAndLead(
    data: StudentApplicationData,
    options?: {
      applicationId?: string;
      documents?: ApplicationDraft['documents'];
      status?: keyof typeof APPLICATION_STATUSES;
      createdAt?: string;
      submittedAt?: string;
    }
  ): Promise<DirectApplicationResponse> {
    try {
      console.log('🎯 Creating application and checking for existing lead...');
      
      // Ensure user is authenticated before proceeding
      await this.ensureAuthenticated();
      
      const currentTime = new Date();
      const applicationId = options?.applicationId ?? this.generateApplicationId();
      const applicationStatus = options?.status ?? APPLICATION_STATUSES.APPLIED;
      const createdAt = options?.createdAt ?? currentTime.toISOString();
      const submittedAt = options?.submittedAt ?? currentTime.toISOString();
      
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
        // Authentication/Ownership fields (required for Firestore security rules)
        uid: auth.currentUser?.uid,
        email: data.email.toLowerCase(),

        // Personal Information
        name: `${data.firstName} ${data.lastName}`,
        countryOfBirth: data.countryOfBirth,
        dateOfBirth: data.dateOfBirth || null,
        gender: data.gender,
        phoneNumber: data.phone,
        passportPhoto: options?.documents?.passportPhoto?.downloadUrl ?? null,
        postalAddress: data.postalAddress || null,

        // Initially null - will be populated with user information by the service
        // if the application is submitted manually or by an admin user
        submittedBy: null,

        // Academic Information
        modeOfStudy: data.modeOfStudy,
        preferredIntake: data.preferredIntake,
        preferredProgram: data.preferredProgram,
        secondaryProgram: null,
        academicDocuments: options?.documents?.academicDocuments?.map((doc) => doc.downloadUrl) ?? [],
        identificationDocument: options?.documents?.identificationDocument?.downloadUrl ?? null,

        // Sponsorship Information
        sponsor: null,
        sponsorTelephone: data.sponsorTelephone || null,
        sponsorEmail: data.sponsorEmail || null,
        howDidYouHear: data.howDidYouHear || null,
        additionalNotes: data.additionalNotes || null,

        // Application Meta
        status: applicationStatus,
        submittedAt,
        createdAt,
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
        // Authentication/Ownership fields (required for Firestore security rules)
        uid: auth.currentUser?.uid,
        email: data.email.toLowerCase(),

        // Basic Info
        status: LEAD_STATUSES.APPLIED,
        source: existingLead?.source || LEAD_SOURCES.APPLICATION_FORM,
        createdAt: existingLead?.createdAt || currentTime.toISOString(),
        updatedAt: currentTime.toISOString(),

        // Contact Info
        name: `${data.firstName} ${data.lastName}`,
        phone: data.phone,
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
   * Ensure user is authenticated with proper credentials (not anonymous)
   * @param silent If true, returns false instead of throwing an error if authentication fails
   * @returns true if authenticated, false if silent mode and auth failed
   */
  private async ensureAuthenticated(silent = false): Promise<boolean> {
    try {
      if (!auth.currentUser) {
        if (silent) return false;
        throw new Error('User must be authenticated to perform this operation. Please sign in first.');
      }
      
      // Check if user is anonymous (not allowed for draft operations)
      if (auth.currentUser.isAnonymous) {
        if (silent) return false;
        throw new Error('Anonymous users cannot save drafts. Please sign in or create an account.');
      }
      
      // Check if user has an email (required for Firestore security rules)
      if (!auth.currentUser.email) {
        if (silent) return false;
        throw new Error('User email is required for this operation. Please ensure your account has a verified email.');
      }
      
      // Debug: Check user authentication details in non-silent mode only
      if (!silent) {
        console.log('🔍 Current user:', {
          uid: auth.currentUser.uid,
          email: auth.currentUser.email,
          emailVerified: auth.currentUser.emailVerified
        });
        
        // Get and debug the ID token
        try {
          // Token is fetched but only tokenResult is used
          await auth.currentUser.getIdToken();
          const tokenResult = await auth.currentUser.getIdTokenResult();
          console.log('🔍 Token claims:', {
            email: tokenResult.claims.email,
            email_verified: tokenResult.claims.email_verified,
            uid: tokenResult.claims.sub
          });
        } catch (tokenError) {
          console.warn('⚠️ Error getting token (non-critical):', tokenError);
        }
        
        console.log('✅ User authenticated:', auth.currentUser.email);
      }
      
      return true;
    } catch (error) {
      if (silent) return false;
      console.error('❌ Authentication check failed:', error);
      throw error;
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
      
      // First, try to find by email (primary identifier) AND user ownership
      const emailQuery = query(
        leadsRef,
        where('email', '==', email.toLowerCase()),
        where('uid', '==', auth.currentUser?.uid)
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
      
      // If no email match, try to find by phone number AND user ownership
      const phoneQuery = query(
        leadsRef,
        where('phone', '==', phone),
        where('uid', '==', auth.currentUser?.uid)
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
      
      // 0. Delete old document first to save storage space (only for single document types)
      if (upload.type !== 'academicDocuments') {
        try {
          await this.deleteOldDocument(upload.applicationId, upload.type);
        } catch (deleteError) {
          console.warn(`⚠️ Non-critical error deleting old document:`, deleteError);
          // Continue with upload even if deletion fails
        }
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

      // Check academic documents limit (maximum 5 documents)
      if (upload.type === 'academicDocuments') {
        const applicationRef = doc(db, 'applications', upload.applicationId);
        const applicationDoc = await getDoc(applicationRef);
        
        if (applicationDoc.exists()) {
          const currentData = applicationDoc.data();
          const currentAcademicDocs = Array.isArray(currentData.academicDocuments) 
            ? currentData.academicDocuments 
            : (currentData.academicDocuments ? [currentData.academicDocuments] : []);
          
          if (currentAcademicDocs.length >= 5) {
            throw new Error('Maximum of 5 academic documents allowed. Please remove some documents before uploading new ones.');
          }
        }
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
      interface UpdateData {
        updatedAt: string;
        academicDocuments?: string[];
        passportPhoto?: string;
        identificationDocument?: string;
        [key: string]: unknown; // Allow additional properties for Firestore
      }

      const updateData: UpdateData = {
        updatedAt: new Date().toISOString(),
      };

      if (upload.type === 'academicDocuments') {
        // For academic documents, append to array instead of replacing
        const applicationRef = doc(db, 'applications', upload.applicationId);
        const applicationDoc = await getDoc(applicationRef);
        
        if (applicationDoc.exists()) {
          const currentData = applicationDoc.data();
          const currentAcademicDocs = Array.isArray(currentData.academicDocuments) 
            ? currentData.academicDocuments 
            : (currentData.academicDocuments ? [currentData.academicDocuments] : []);
          
          console.log(`📎 Current academic documents count: ${currentAcademicDocs.length}`);
          console.log(`📎 Adding new document: ${downloadUrl}`);
          updateData.academicDocuments = [...currentAcademicDocs, downloadUrl];
          console.log(`📎 Total after upload: ${updateData.academicDocuments.length} documents`);
        } else {
          console.log(`📎 No existing application found, creating first academic document`);
          updateData.academicDocuments = [downloadUrl];
        }
      } else {
        // For other document types (passport photo, identification), replace as before
        updateData[upload.type] = downloadUrl;
      }

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
    identificationDocument?: File; // Changed from array to single file
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
      
      if (files && (files.passportPhoto || files.academicDocuments?.length || files.identificationDocument)) {
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
        
        if (files.identificationDocument) {
          uploads.push({
            file: files.identificationDocument,
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
   * Delete a specific academic document by its download URL
   * - Removes the file from Firebase Storage (best effort)
   * - Removes the URL from the application's academicDocuments array in Firestore
   */
  async deleteAcademicDocument(applicationId: string, documentUrl: string): Promise<{ success: boolean; message: string }> {
    try {
      // Fetch application
      const applicationRef = doc(db, 'applications', applicationId);
      const applicationDoc = await getDoc(applicationRef);
      if (!applicationDoc.exists()) {
        return { success: false, message: `Application ${applicationId} not found` };
      }

      const data = applicationDoc.data();
      const currentAcademicDocs: string[] = Array.isArray(data.academicDocuments)
        ? data.academicDocuments
        : (data.academicDocuments ? [data.academicDocuments] : []);

      if (!currentAcademicDocs.includes(documentUrl)) {
        // Proceed to clean up anyway but inform not found in array
        console.warn('Academic document URL not present in Firestore array, proceeding to attempt storage cleanup.');
      }

      // Attempt to delete storage object (best effort)
      try {
        let storagePath: string | null = null;
        if (documentUrl.includes('/o/')) {
          const urlParts = documentUrl.split('/o/')[1]?.split('?')[0];
          if (urlParts) storagePath = decodeURIComponent(urlParts);
        } else if (documentUrl.startsWith('gs://')) {
          storagePath = documentUrl.replace(/^gs:\/\/[^\/]+\//, '');
        } else if (documentUrl.includes('applications/')) {
          storagePath = documentUrl;
        }

        if (storagePath) {
          const fileRef = ref(storage, storagePath);
          await deleteObject(fileRef);
          console.log('✅ Deleted academic document from storage:', storagePath);
        } else {
          console.warn('⚠️ Could not parse storage path from academic document URL:', documentUrl);
        }
      } catch (storageErr) {
        // Non-fatal: continue to update Firestore
        console.warn('⚠️ Failed to delete academic document from storage:', storageErr);
      }

      // Update Firestore to remove the URL from the array
      const updatedDocs = currentAcademicDocs.filter((u) => u !== documentUrl);
      try {
        await updateDoc(applicationRef, {
          academicDocuments: updatedDocs,
          updatedAt: new Date().toISOString(),
        });
        console.log(`✅ Removed academic document from Firestore array. New count: ${updatedDocs.length}`);
      } catch (firestoreErr) {
        console.error('❌ Failed to update Firestore academicDocuments array:', firestoreErr);
        return { success: false, message: 'Failed to update application record after deleting document' };
      }

      return { success: true, message: 'Academic document removed successfully' };
    } catch (err) {
      console.error('❌ Error deleting academic document:', err);
      return { success: false, message: err instanceof Error ? err.message : 'Unknown error' };
    }
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
      // Use silent auth to avoid noisy logs; return empty if not authenticated
      const isAuthed = await this.ensureAuthenticated(true);
      if (!isAuthed || !auth.currentUser?.email) {
        return [];
      }

      const currentUserEmail = auth.currentUser.email.toLowerCase();
      const requestedEmail = email.toLowerCase();

      // Only allow querying for own applications to satisfy common Firestore rules
      if (currentUserEmail !== requestedEmail) {
        return [];
      }

      // Cooldown after permission-denied to prevent repeated failed calls
      const cooldownUntil = this.applicationsFetchCooldown[requestedEmail] ?? 0;
      if (Date.now() < cooldownUntil) {
        return [];
      }

      // Query by email and uid for ownership validation
      const applicationsRef = collection(db, 'applications');
      const q = query(applicationsRef, where('email', '==', requestedEmail), where('uid', '==', auth.currentUser.uid));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
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
          dateOfBirth: data.dateOfBirth || '',
          gender: data.gender || '',
          modeOfStudy: data.modeOfStudy || '',
          preferredIntake: data.preferredIntake || '',
          preferredProgram: data.preferredProgram || '',
          postalAddress: data.postalAddress || '',
          status: data.status || APPLICATION_STATUSES.APPLIED,
          submittedAt: data.submittedAt || '',
          updatedAt: data.updatedAt || '',
          passportPhoto: data.passportPhoto || '',
          academicDocuments: Array.isArray(data.academicDocuments)
            ? data.academicDocuments
            : (data.academicDocuments ? [data.academicDocuments] : []),
          identificationDocument: data.identificationDocument || '',
          sponsorTelephone: data.sponsorTelephone || '',
          sponsorEmail: data.sponsorEmail || '',
          howDidYouHear: data.howDidYouHear || '',
          additionalNotes: data.additionalNotes || '',
        });
      });

      // Sort by submittedAt desc client-side
      applications.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
      return applications;

    } catch (error: unknown) {
      // Suppress noisy console errors; set a short cooldown on permission-denied
      const code = (error && typeof error === 'object' && 'code' in error) ? (error as { code?: string }).code : undefined;
      if (code === 'permission-denied') {
        const key = auth.currentUser?.email?.toLowerCase() || 'unknown';
        // 2-minute cooldown
        this.applicationsFetchCooldown[key] = Date.now() + 2 * 60 * 1000;
        if (!this.hasLoggedApplicationsPermissionDenied) {
          // Log once as info to aid debugging without spamming the console
          console.info('ℹ️ Applications query denied by Firestore rules. Falling back to empty list.');
          this.hasLoggedApplicationsPermissionDenied = true;
        }
      }
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
        
      case 'missing_document':
        completedSteps = 1;
        progressPercentage = 20; // Same as APPLIED (20%)
        status = 'Missing Documents';
        statusColor = 'text-red-800';
        statusBgColor = 'bg-red-100';
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
        dateOfBirth: data.dateOfBirth || null,
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
        dateOfBirth: data.dateOfBirth || null,
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
