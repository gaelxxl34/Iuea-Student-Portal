import { storage, auth } from './firebase';
import { 
  ref, 
  getDownloadURL, 
  deleteObject,
  listAll,
  uploadBytesResumable,
  getMetadata
} from 'firebase/storage';
import { signInAnonymously, User } from 'firebase/auth';

export interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  percentage: number;
}

export interface UploadResult {
  downloadURL: string;
  fullPath: string;
  name: string;
  size: number;
  contentType: string;
}

export class StorageService {
  private static instance: StorageService;
  
  private constructor() {}
  
  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  /**
   * Ensure user is authenticated before performing storage operations
   */
  private async ensureAuthenticated(): Promise<User> {
    if (!auth.currentUser) {
      // If no user is signed in, sign in anonymously with elevated permissions
      const userCredential = await signInAnonymously(auth);
      return userCredential.user;
    }
    return auth.currentUser;
  }

  /**
   * Upload a file to Firebase Storage with progress tracking
   */
  public async uploadFile(
    file: File,
    path: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    try {
      // Ensure user is authenticated
      await this.ensureAuthenticated();
      
      // Create storage reference
      const storageRef = ref(storage, path);
      
      // Create upload task with progress tracking
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            // Progress tracking
            const progress: UploadProgress = {
              bytesTransferred: snapshot.bytesTransferred,
              totalBytes: snapshot.totalBytes,
              percentage: (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            };
            
            if (onProgress) {
              onProgress(progress);
            }
          },
          (error) => {
            console.error('Upload error:', error);
            reject(error);
          },
          async () => {
            try {
              // Upload completed successfully
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              const metadata = await getMetadata(uploadTask.snapshot.ref);
              
              const result: UploadResult = {
                downloadURL,
                fullPath: uploadTask.snapshot.ref.fullPath,
                name: uploadTask.snapshot.ref.name,
                size: metadata.size,
                contentType: metadata.contentType || file.type
              };
              
              resolve(result);
            } catch (error) {
              reject(error);
            }
          }
        );
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  /**
   * Upload application document
   */
  public async uploadApplicationDocument(
    file: File,
    applicationId: string,
    documentType: string,
    userEmail: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const sanitizedEmail = userEmail.replace(/[@.]/g, '_');
    const fileExtension = file.name.split('.').pop();
    const fileName = `${documentType}_${applicationId}_${sanitizedEmail}_${timestamp}.${fileExtension}`;
    
    const path = `applications/${applicationId}/documents/${fileName}`;
    
    return this.uploadFile(file, path, onProgress);
  }

  /**
   * Upload profile image
   */
  public async uploadProfileImage(
    file: File,
    userId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `profile_${userId}_${timestamp}.${fileExtension}`;
    
    const path = `users/${userId}/profile/${fileName}`;
    
    return this.uploadFile(file, path, onProgress);
  }

  /**
   * Upload temporary file
   */
  public async uploadTempFile(
    file: File,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    const timestamp = Date.now();
    const fileName = `temp_${timestamp}_${file.name}`;
    
    const path = `temp/${fileName}`;
    
    return this.uploadFile(file, path, onProgress);
  }

  /**
   * Delete a file from storage
   */
  public async deleteFile(filePath: string): Promise<void> {
    try {
      await this.ensureAuthenticated();
      const fileRef = ref(storage, filePath);
      await deleteObject(fileRef);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  /**
   * Get download URL for a file
   */
  public async getDownloadURL(filePath: string): Promise<string> {
    try {
      await this.ensureAuthenticated();
      const fileRef = ref(storage, filePath);
      return await getDownloadURL(fileRef);
    } catch (error) {
      console.error('Error getting download URL:', error);
      throw error;
    }
  }

  /**
   * List all files in a directory
   */
  public async listFiles(directoryPath: string): Promise<string[]> {
    try {
      await this.ensureAuthenticated();
      const dirRef = ref(storage, directoryPath);
      const result = await listAll(dirRef);
      return result.items.map(item => item.fullPath);
    } catch (error) {
      console.error('Error listing files:', error);
      throw error;
    }
  }

  /**
   * Get file metadata
   */
  public async getFileMetadata(filePath: string) {
    try {
      await this.ensureAuthenticated();
      const fileRef = ref(storage, filePath);
      return await getMetadata(fileRef);
    } catch (error) {
      console.error('Error getting file metadata:', error);
      throw error;
    }
  }

  /**
   * Validate file before upload
   */
  public validateFile(file: File, maxSizeInMB: number = 10, allowedTypes: string[] = []): boolean {
    // Check file size
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      throw new Error(`File size must be less than ${maxSizeInMB}MB`);
    }

    // Check file type if specified
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      throw new Error(`File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`);
    }

    return true;
  }

  /**
   * Batch upload multiple files
   */
  public async uploadMultipleFiles(
    files: File[],
    basePath: string,
    onProgress?: (fileIndex: number, progress: UploadProgress) => void
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const path = `${basePath}/${fileName}`;
      
      const result = await this.uploadFile(file, path, (progress) => {
        if (onProgress) {
          onProgress(i, progress);
        }
      });
      
      results.push(result);
    }
    
    return results;
  }
}

// Export singleton instance
export const storageService = StorageService.getInstance();

// Export common file type constants
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
export const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
export const ALLOWED_ALL_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES];
