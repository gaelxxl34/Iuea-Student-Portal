import { storageService } from './storageService';

/**
 * Document Access Utility
 * Handles different ways to access documents stored in Firebase Storage
 */

export interface DocumentAccessOptions {
  usePublicUrl?: boolean;
  forceRefresh?: boolean;
}

export class DocumentAccessService {
  private static instance: DocumentAccessService;
  private urlCache = new Map<string, { url: string; timestamp: number }>();
  private readonly CACHE_DURATION = 60 * 60 * 1000; // 1 hour

  private constructor() {}

  public static getInstance(): DocumentAccessService {
    if (!DocumentAccessService.instance) {
      DocumentAccessService.instance = new DocumentAccessService();
    }
    return DocumentAccessService.instance;
  }

  /**
   * Get document URL - handles both public and private access
   */
  public async getDocumentUrl(
    filePath: string, 
    options: DocumentAccessOptions = {}
  ): Promise<string> {
    const { usePublicUrl = true, forceRefresh = false } = options;

    try {
      // Check cache first (unless force refresh)
      if (!forceRefresh) {
        const cached = this.getCachedUrl(filePath);
        if (cached) {
          return cached;
        }
      }

      let url: string;

      if (usePublicUrl && this.isPublicDocument(filePath)) {
        // For public documents (application documents), construct public URL
        url = this.constructPublicUrl(filePath);
      } else {
        // For private documents, get authenticated download URL
        url = await storageService.getDownloadURL(filePath);
      }

      // Cache the URL
      this.cacheUrl(filePath, url);
      return url;

    } catch (error) {
      console.error('Error getting document URL:', error);
      throw error;
    }
  }

  /**
   * Get multiple document URLs efficiently
   */
  public async getMultipleDocumentUrls(
    filePaths: string[],
    options: DocumentAccessOptions = {}
  ): Promise<Record<string, string>> {
    const urls: Record<string, string> = {};
    
    // Process in parallel for better performance
    const urlPromises = filePaths.map(async (filePath) => {
      try {
        const url = await this.getDocumentUrl(filePath, options);
        return { filePath, url };
      } catch (error) {
        console.error(`Failed to get URL for ${filePath}:`, error);
        return { filePath, url: '' };
      }
    });

    const results = await Promise.all(urlPromises);
    
    results.forEach(({ filePath, url }) => {
      if (url) {
        urls[filePath] = url;
      }
    });

    return urls;
  }

  /**
   * Check if a document is publicly accessible
   */
  private isPublicDocument(filePath: string): boolean {
    // Application documents are public
    if (filePath.startsWith('applications/') && filePath.includes('/documents/')) {
      return true;
    }
    
    // Public assets
    if (filePath.startsWith('public/')) {
      return true;
    }

    return false;
  }

  /**
   * Construct public URL for Firebase Storage
   */
  private constructPublicUrl(filePath: string): string {
    // Get Firebase project ID from config
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    
    if (!projectId || !storageBucket) {
      throw new Error('Firebase configuration not found');
    }

    // Encode the file path for URL
    const encodedPath = encodeURIComponent(filePath);
    
    // Construct public URL
    return `https://firebasestorage.googleapis.com/v0/b/${storageBucket}/o/${encodedPath}?alt=media`;
  }

  /**
   * Cache URL with timestamp
   */
  private cacheUrl(filePath: string, url: string): void {
    this.urlCache.set(filePath, {
      url,
      timestamp: Date.now()
    });
  }

  /**
   * Get cached URL if still valid
   */
  private getCachedUrl(filePath: string): string | null {
    const cached = this.urlCache.get(filePath);
    
    if (!cached) {
      return null;
    }

    // Check if cache is still valid
    const isValid = Date.now() - cached.timestamp < this.CACHE_DURATION;
    
    if (!isValid) {
      this.urlCache.delete(filePath);
      return null;
    }

    return cached.url;
  }

  /**
   * Clear URL cache
   */
  public clearCache(): void {
    this.urlCache.clear();
  }

  /**
   * Clear expired cache entries
   */
  public clearExpiredCache(): void {
    const now = Date.now();
    
    for (const [filePath, cached] of this.urlCache.entries()) {
      if (now - cached.timestamp >= this.CACHE_DURATION) {
        this.urlCache.delete(filePath);
      }
    }
  }

  /**
   * Preload document URLs for better performance
   */
  public async preloadDocuments(filePaths: string[]): Promise<void> {
    try {
      await this.getMultipleDocumentUrls(filePaths);
      console.log(`Preloaded ${filePaths.length} document URLs`);
    } catch (error) {
      console.error('Error preloading documents:', error);
    }
  }

  /**
   * Get document thumbnail URL (for images)
   */
  public getDocumentThumbnail(filePath: string, size: number = 200): string {
    const publicUrl = this.constructPublicUrl(filePath);
    
    // For images, we can add resize parameters
    if (this.isImageFile(filePath)) {
      return `${publicUrl}&w=${size}&h=${size}&fit=crop`;
    }
    
    return publicUrl;
  }

  /**
   * Check if file is an image
   */
  private isImageFile(filePath: string): boolean {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const extension = filePath.toLowerCase().substring(filePath.lastIndexOf('.'));
    return imageExtensions.includes(extension);
  }

  /**
   * Download document as blob for local processing
   */
  public async downloadDocument(filePath: string): Promise<Blob> {
    try {
      const url = await this.getDocumentUrl(filePath);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to download document: ${response.statusText}`);
      }
      
      return await response.blob();
    } catch (error) {
      console.error('Error downloading document:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const documentAccessService = DocumentAccessService.getInstance();

// Utility functions for common use cases
export const getApplicationDocumentUrl = (
  applicationId: string,
  documentType: 'passportPhoto' | 'academicDocuments' | 'identificationDocument',
  fileName: string
): Promise<string> => {
  const filePath = `applications/${applicationId}/documents/${fileName}`;
  return documentAccessService.getDocumentUrl(filePath, { usePublicUrl: true });
};

export const getApplicationDocuments = async (
  applicationId: string,
  documents: { passportPhoto?: string; academicDocuments?: string; identificationDocument?: string }
): Promise<{
  passportPhotoUrl?: string;
  academicDocumentsUrl?: string;
  identificationDocumentUrl?: string;
}> => {
  const urls: {
    passportPhotoUrl?: string;
    academicDocumentsUrl?: string;
    identificationDocumentUrl?: string;
  } = {};
  
  if (documents.passportPhoto) {
    urls.passportPhotoUrl = await documentAccessService.getDocumentUrl(
      documents.passportPhoto, 
      { usePublicUrl: true }
    );
  }
  
  if (documents.academicDocuments) {
    urls.academicDocumentsUrl = await documentAccessService.getDocumentUrl(
      documents.academicDocuments,
      { usePublicUrl: true }
    );
  }
  
  if (documents.identificationDocument) {
    urls.identificationDocumentUrl = await documentAccessService.getDocumentUrl(
      documents.identificationDocument,
      { usePublicUrl: true }
    );
  }
  
  return urls;
};
