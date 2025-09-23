import { useState, useEffect, useCallback, useMemo } from 'react';
import { documentAccessService, DocumentAccessOptions } from '../lib/documentAccessService';

interface UseDocumentAccessReturn {
  url: string | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook for accessing document URLs with caching and error handling
 */
export const useDocumentAccess = (
  filePath: string | null,
  options: DocumentAccessOptions = {}
): UseDocumentAccessReturn => {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stableOptions = useMemo(() => options, [options]);

  const fetchUrl = useCallback(async () => {
    if (!filePath) {
      setUrl(null);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const documentUrl = await documentAccessService.getDocumentUrl(filePath, stableOptions);
      setUrl(documentUrl);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get document URL';
      setError(errorMessage);
      setUrl(null);
    } finally {
      setLoading(false);
    }
  }, [filePath, stableOptions]);

  useEffect(() => {
    fetchUrl();
  }, [fetchUrl]);

  const refetch = useCallback(() => {
    fetchUrl();
  }, [fetchUrl]);

  return {
    url,
    loading,
    error,
    refetch
  };
};

/**
 * Hook for accessing multiple document URLs
 */
export const useMultipleDocumentAccess = (
  filePaths: string[],
  options: DocumentAccessOptions = {}
) => {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stableFilePaths = useMemo(() => filePaths, [filePaths]);
  const stableOptions = useMemo(() => options, [options]);

  const fetchUrls = useCallback(async () => {
    if (stableFilePaths.length === 0) {
      setUrls({});
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const documentUrls = await documentAccessService.getMultipleDocumentUrls(stableFilePaths, stableOptions);
      setUrls(documentUrls);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get document URLs';
      setError(errorMessage);
      setUrls({});
    } finally {
      setLoading(false);
    }
  }, [stableFilePaths, stableOptions]);

  useEffect(() => {
    fetchUrls();
  }, [fetchUrls]);

  const refetch = useCallback(() => {
    fetchUrls();
  }, [fetchUrls]);

  return {
    urls,
    loading,
    error,
    refetch
  };
};

/**
 * Hook specifically for application documents
 */
export const useApplicationDocuments = (application: {
  id: string;
  passportPhoto?: string;
  academicDocuments?: string | string[];
  identificationDocument?: string;
}) => {
  const [documents, setDocuments] = useState<{
    passportPhotoUrl?: string;
    academicDocumentsUrls?: string[];
    identificationDocumentUrl?: string;
  }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    // If no application ID, don't fetch anything
    if (!application?.id) {
      setDocuments({});
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const urls: {
        passportPhotoUrl?: string;
        academicDocumentsUrls?: string[];
        identificationDocumentUrl?: string;
      } = {};

      // Fetch all document URLs
      if (application.passportPhoto) {
        urls.passportPhotoUrl = await documentAccessService.getDocumentUrl(
          application.passportPhoto,
          { usePublicUrl: true }
        );
      }

      if (application.academicDocuments) {
        if (Array.isArray(application.academicDocuments)) {
          // Handle multiple academic documents
          const urlPromises = application.academicDocuments.map(doc => 
            documentAccessService.getDocumentUrl(doc, { usePublicUrl: true })
          );
          urls.academicDocumentsUrls = await Promise.all(urlPromises);
        } else {
          // Handle single academic document (backward compatibility)
          const singleUrl = await documentAccessService.getDocumentUrl(
            application.academicDocuments,
            { usePublicUrl: true }
          );
          urls.academicDocumentsUrls = [singleUrl];
        }
      }

      if (application.identificationDocument) {
        urls.identificationDocumentUrl = await documentAccessService.getDocumentUrl(
          application.identificationDocument,
          { usePublicUrl: true }
        );
      }

      setDocuments(urls);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load documents';
      setError(errorMessage);
      setDocuments({});
    } finally {
      setLoading(false);
    }
  }, [
    application?.id,
    application?.passportPhoto,
    application?.academicDocuments,
    application?.identificationDocument
  ]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const refetch = useCallback(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  return {
    documents,
    loading,
    error,
    refetch
  };
};

export default useDocumentAccess;
