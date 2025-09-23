import React, { useState } from 'react';
import { fileCompressionService } from '../lib/fileCompressionService';

interface FileSizePreviewProps {
  files: {
    passportPhoto?: File;
    academicDocuments: File[];
    identificationDocument?: File; // Changed from array to single file
  };
  className?: string;
}

export const FileSizePreview: React.FC<FileSizePreviewProps> = ({
  files,
  className = ''
}) => {
  const [compressionEstimate, setCompressionEstimate] = useState<{
    originalTotalSize: number;
    estimatedCompressedSize: number;
    estimatedSavings: number;
    estimatedTimeReduction: number;
  } | null>(null);

  const [showDetails, setShowDetails] = useState(false);

  // Calculate compression estimate
  React.useEffect(() => {
    const allFiles: File[] = [];
    if (files.passportPhoto) allFiles.push(files.passportPhoto);
    
    // Safely handle arrays that might be undefined
    if (Array.isArray(files.academicDocuments)) {
      allFiles.push(...files.academicDocuments);
    }
    if (files.identificationDocument) {
      allFiles.push(files.identificationDocument);
    }

    if (allFiles.length > 0) {
      const estimate = fileCompressionService.estimateCompressionSavings(allFiles);
      setCompressionEstimate(estimate);
    } else {
      setCompressionEstimate(null);
    }
  }, [files]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 1) return '< 1s';
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.round(seconds % 60);
      return `${minutes}m ${remainingSeconds}s`;
    }
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.round((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getAllFiles = (): { file: File; type: string }[] => {
    const allFiles: { file: File; type: string }[] = [];
    
    if (files.passportPhoto) {
      allFiles.push({ file: files.passportPhoto, type: 'Passport Photo' });
    }
    
    // Safely handle academic documents array
    if (Array.isArray(files.academicDocuments)) {
      files.academicDocuments.forEach((file, index) => {
        allFiles.push({ 
          file, 
          type: `Academic Document ${files.academicDocuments.length > 1 ? index + 1 : ''}`.trim() 
        });
      });
    }
    
    // Handle single identification document
    if (files.identificationDocument) {
      allFiles.push({ 
        file: files.identificationDocument, 
        type: 'ID Document' 
      });
    }
    
    return allFiles;
  };

  if (!compressionEstimate) {
    return null;
  }

  const savingsPercent = Math.round((compressionEstimate.estimatedSavings / compressionEstimate.originalTotalSize) * 100);
  const hasSignificantSavings = savingsPercent > 10;

  return (
    <div className={`bg-slate-50 border border-slate-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <i className="ri-file-reduce-line text-slate-600 mr-2"></i>
          <h4 className="text-sm font-medium text-slate-700">File Upload Summary</h4>
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs text-slate-500 hover:text-slate-700 transition-colors"
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-3">
        <div>
          <p className="text-xs text-slate-500 mb-1">Original Size</p>
          <p className="text-sm font-medium text-slate-700">
            {formatFileSize(compressionEstimate.originalTotalSize)}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-1">Optimized Size</p>
          <p className="text-sm font-medium text-green-600">
            {formatFileSize(compressionEstimate.estimatedCompressedSize)}
          </p>
        </div>
      </div>

      {hasSignificantSavings && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
          <div className="flex items-start">
            <i className="ri-speed-up-line text-green-600 mr-2 mt-0.5"></i>
            <div>
              <p className="text-sm text-green-700 font-medium">
                Estimated {savingsPercent}% size reduction
              </p>
              <p className="text-xs text-green-600 mt-1">
                Upload time reduced by ~{formatTime(compressionEstimate.estimatedTimeReduction)}
              </p>
            </div>
          </div>
        </div>
      )}

      {showDetails && (
        <div className="space-y-2">
          <h5 className="text-xs font-medium text-slate-600 border-t pt-3">File Details</h5>
          {getAllFiles().map(({ file, type }, index) => {
            const isImage = file.type.startsWith('image/');
            const estimatedCompression = isImage ? 0.3 : 1; // 70% compression for images
            const estimatedSize = file.size * estimatedCompression;
            const individualSavings = Math.round((1 - estimatedCompression) * 100);

            return (
              <div key={index} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-b-0">
                <div className="flex items-center min-w-0 flex-1">
                  <div className={`h-2 w-2 rounded-full mr-2 ${
                    isImage ? 'bg-blue-500' : 'bg-gray-500'
                  }`}></div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-700 truncate">{file.name}</p>
                    <p className="text-xs text-slate-500">{type}</p>
                  </div>
                </div>
                <div className="text-right ml-2">
                  <p className="text-xs text-slate-600">
                    {formatFileSize(file.size)}
                    {isImage && (
                      <span className="text-green-600 ml-1">
                        → {formatFileSize(estimatedSize)}
                      </span>
                    )}
                  </p>
                  {isImage && individualSavings > 0 && (
                    <p className="text-xs text-green-600">
                      -{individualSavings}%
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-3 text-xs text-slate-500">
        <i className="ri-information-line mr-1"></i>
        Images will be automatically optimized for faster upload while maintaining quality.
      </div>
    </div>
  );
};

export default FileSizePreview;
