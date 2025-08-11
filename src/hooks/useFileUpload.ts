import { useState, useCallback } from 'react';
import { storageService, UploadProgress, UploadResult, ALLOWED_ALL_TYPES } from '../lib/storageService';

interface UseFileUploadOptions {
  maxSizeInMB?: number;
  allowedTypes?: string[];
  onSuccess?: (result: UploadResult) => void;
  onError?: (error: Error) => void;
}

interface UseFileUploadReturn {
  uploading: boolean;
  progress: UploadProgress | null;
  error: string | null;
  uploadFile: (file: File, path: string) => Promise<UploadResult | null>;
  uploadApplicationDocument: (
    file: File,
    applicationId: string,
    documentType: string,
    userEmail: string
  ) => Promise<UploadResult | null>;
  uploadProfileImage: (file: File, userId: string) => Promise<UploadResult | null>;
  reset: () => void;
}

export const useFileUpload = (options: UseFileUploadOptions = {}): UseFileUploadReturn => {
  const {
    maxSizeInMB = 10,
    allowedTypes = ALLOWED_ALL_TYPES,
    onSuccess,
    onError
  } = options;

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setUploading(false);
    setProgress(null);
    setError(null);
  }, []);

  const handleUpload = useCallback(async (
    uploadFn: () => Promise<UploadResult>
  ): Promise<UploadResult | null> => {
    try {
      setUploading(true);
      setError(null);
      setProgress(null);

      const result = await uploadFn();
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      
      if (onError) {
        onError(err instanceof Error ? err : new Error(errorMessage));
      }
      
      return null;
    } finally {
      setUploading(false);
    }
  }, [onSuccess, onError]);

  const uploadFile = useCallback(async (
    file: File,
    path: string
  ): Promise<UploadResult | null> => {
    return handleUpload(async () => {
      // Validate file
      storageService.validateFile(file, maxSizeInMB, allowedTypes);
      
      // Upload with progress tracking
      return await storageService.uploadFile(file, path, setProgress);
    });
  }, [handleUpload, maxSizeInMB, allowedTypes]);

  const uploadApplicationDocument = useCallback(async (
    file: File,
    applicationId: string,
    documentType: string,
    userEmail: string
  ): Promise<UploadResult | null> => {
    return handleUpload(async () => {
      // Validate file
      storageService.validateFile(file, maxSizeInMB, allowedTypes);
      
      // Upload application document
      return await storageService.uploadApplicationDocument(
        file,
        applicationId,
        documentType,
        userEmail,
        setProgress
      );
    });
  }, [handleUpload, maxSizeInMB, allowedTypes]);

  const uploadProfileImage = useCallback(async (
    file: File,
    userId: string
  ): Promise<UploadResult | null> => {
    return handleUpload(async () => {
      // Validate file (images only for profile)
      const imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      storageService.validateFile(file, 5, imageTypes); // 5MB max for images
      
      // Upload profile image
      return await storageService.uploadProfileImage(file, userId, setProgress);
    });
  }, [handleUpload]);

  return {
    uploading,
    progress,
    error,
    uploadFile,
    uploadApplicationDocument,
    uploadProfileImage,
    reset
  };
};

export default useFileUpload;
