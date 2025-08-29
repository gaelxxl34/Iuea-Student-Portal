/**
 * File Compression Service
 * Handles client-side file compression to reduce upload times
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSizeKB?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  success: boolean;
  error?: string;
}

class FileCompressionService {
  private static instance: FileCompressionService;

  private constructor() {}

  public static getInstance(): FileCompressionService {
    if (!FileCompressionService.instance) {
      FileCompressionService.instance = new FileCompressionService();
    }
    return FileCompressionService.instance;
  }

  /**
   * Compress an image file
   */
  async compressImage(file: File, options: CompressionOptions = {}): Promise<CompressionResult> {
    const {
      maxWidth = 1920,
      maxHeight = 1080,
      quality = 0.8,
      maxSizeKB = 1024, // 1MB default
      format = 'jpeg'
    } = options;

    try {
      console.log(`🗜️ Compressing image: ${file.name} (${this.formatFileSize(file.size)})`);

      // If file is already small enough, return as-is
      if (file.size <= maxSizeKB * 1024) {
        console.log(`✅ File already small enough, skipping compression`);
        return {
          file,
          originalSize: file.size,
          compressedSize: file.size,
          compressionRatio: 1,
          success: true
        };
      }

      const compressedFile = await this.resizeAndCompressImage(file, {
        maxWidth,
        maxHeight,
        quality,
        format
      });

      const compressionRatio = compressedFile.size / file.size;
      
      console.log(`✅ Image compressed: ${this.formatFileSize(file.size)} → ${this.formatFileSize(compressedFile.size)} (${Math.round((1 - compressionRatio) * 100)}% reduction)`);

      return {
        file: compressedFile,
        originalSize: file.size,
        compressedSize: compressedFile.size,
        compressionRatio,
        success: true
      };

    } catch (error) {
      console.error('❌ Image compression failed:', error);
      return {
        file,
        originalSize: file.size,
        compressedSize: file.size,
        compressionRatio: 1,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown compression error'
      };
    }
  }

  /**
   * Compress multiple files in parallel
   */
  async compressMultipleFiles(
    files: File[], 
    options: CompressionOptions = {}
  ): Promise<CompressionResult[]> {
    console.log(`🗜️ Compressing ${files.length} files in parallel...`);

    const compressionPromises = files.map(file => 
      this.compressFile(file, options)
    );

    const results = await Promise.all(compressionPromises);
    
    const totalOriginalSize = results.reduce((sum, result) => sum + result.originalSize, 0);
    const totalCompressedSize = results.reduce((sum, result) => sum + result.compressedSize, 0);
    const overallRatio = totalCompressedSize / totalOriginalSize;
    
    console.log(`✅ Batch compression completed: ${this.formatFileSize(totalOriginalSize)} → ${this.formatFileSize(totalCompressedSize)} (${Math.round((1 - overallRatio) * 100)}% reduction)`);

    return results;
  }

  /**
   * Compress any file type
   */
  async compressFile(file: File, options: CompressionOptions = {}): Promise<CompressionResult> {
    // Check if it's an image
    if (file.type.startsWith('image/')) {
      return this.compressImage(file, options);
    }

    // For non-image files, return as-is (could implement PDF compression here)
    console.log(`ℹ️ Skipping compression for non-image file: ${file.name}`);
    return {
      file,
      originalSize: file.size,
      compressedSize: file.size,
      compressionRatio: 1,
      success: true
    };
  }

  /**
   * Resize and compress an image using Canvas API
   */
  private async resizeAndCompressImage(
    file: File,
    options: {
      maxWidth: number;
      maxHeight: number;
      quality: number;
      format: string;
    }
  ): Promise<File> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      img.onload = () => {
        // Calculate new dimensions
        const { width, height } = this.calculateNewDimensions(
          img.width,
          img.height,
          options.maxWidth,
          options.maxHeight
        );

        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to create blob from canvas'));
              return;
            }

            // Create new file with compressed data
            const compressedFile = new File(
              [blob],
              file.name,
              {
                type: `image/${options.format}`,
                lastModified: Date.now()
              }
            );

            resolve(compressedFile);
          },
          `image/${options.format}`,
          options.quality
        );
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      // Load the image
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Calculate new dimensions while maintaining aspect ratio
   */
  private calculateNewDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    let { width, height } = { width: originalWidth, height: originalHeight };

    // Calculate scaling factor
    const widthRatio = maxWidth / width;
    const heightRatio = maxHeight / height;
    const scalingFactor = Math.min(widthRatio, heightRatio, 1); // Don't upscale

    width = Math.round(width * scalingFactor);
    height = Math.round(height * scalingFactor);

    return { width, height };
  }

  /**
   * Format file size for display
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get compression recommendations based on file size and type
   */
  getCompressionRecommendations(file: File): CompressionOptions {
    const fileSizeKB = file.size / 1024;

    // Passport photo recommendations
    if (file.type.startsWith('image/')) {
      if (fileSizeKB > 2048) { // > 2MB
        return {
          maxWidth: 800,
          maxHeight: 800,
          quality: 0.7,
          maxSizeKB: 500,
          format: 'jpeg'
        };
      } else if (fileSizeKB > 1024) { // > 1MB
        return {
          maxWidth: 1200,
          maxHeight: 1200,
          quality: 0.8,
          maxSizeKB: 800,
          format: 'jpeg'
        };
      }
    }

    // Default settings for smaller files
    return {
      maxWidth: 1920,
      maxHeight: 1080,
      quality: 0.85,
      maxSizeKB: 1024,
      format: 'jpeg'
    };
  }

  /**
   * Estimate compression savings
   */
  estimateCompressionSavings(files: File[]): {
    originalTotalSize: number;
    estimatedCompressedSize: number;
    estimatedSavings: number;
    estimatedTimeReduction: number; // in seconds
  } {
    let originalTotalSize = 0;
    let estimatedCompressedSize = 0;

    files.forEach(file => {
      originalTotalSize += file.size;
      
      if (file.type.startsWith('image/')) {
        // Estimate 60-80% compression for images
        estimatedCompressedSize += file.size * 0.3;
      } else {
        // No compression for non-images
        estimatedCompressedSize += file.size;
      }
    });

    const estimatedSavings = originalTotalSize - estimatedCompressedSize;
    const estimatedTimeReduction = estimatedSavings / (100 * 1024); // Assume 100KB/s upload speed

    return {
      originalTotalSize,
      estimatedCompressedSize,
      estimatedSavings,
      estimatedTimeReduction
    };
  }
}

// Export singleton instance
export const fileCompressionService = FileCompressionService.getInstance();

// Utility functions
export const compressApplicationDocuments = async (files: {
  passportPhoto?: File;
  academicDocuments?: File[];
  identificationDocuments?: File[];
}): Promise<{
  passportPhoto?: File;
  academicDocuments: File[];
  identificationDocuments: File[];
  compressionResults: CompressionResult[];
}> => {
  console.log('🗜️ Starting file compression...', { 
    hasPassportPhoto: !!files.passportPhoto,
    academicDocsCount: Array.isArray(files.academicDocuments) ? files.academicDocuments.length : 0,
    identificationDocsCount: Array.isArray(files.identificationDocuments) ? files.identificationDocuments.length : 0
  });

  const allFiles: File[] = [];
  const compressionResults: CompressionResult[] = [];

  // Collect all files with safe array handling
  if (files.passportPhoto) allFiles.push(files.passportPhoto);
  
  // Safely handle academicDocuments array
  const academicDocs = Array.isArray(files.academicDocuments) ? files.academicDocuments : [];
  allFiles.push(...academicDocs);
  
  // Safely handle identificationDocuments array
  const identificationDocs = Array.isArray(files.identificationDocuments) ? files.identificationDocuments : [];
  allFiles.push(...identificationDocs);

  // Early return if no files to compress
  if (allFiles.length === 0) {
    console.log('ℹ️ No files to compress, returning empty results');
    return {
      academicDocuments: [],
      identificationDocuments: [],
      compressionResults: []
    };
  }

  // Compress all files
  const results = await fileCompressionService.compressMultipleFiles(allFiles);
  compressionResults.push(...results);

  // Reconstruct the file structure with guaranteed arrays
  let fileIndex = 0;
  const compressedFiles: {
    passportPhoto?: File;
    academicDocuments: File[];
    identificationDocuments: File[];
  } = {
    academicDocuments: [],
    identificationDocuments: []
  };

  if (files.passportPhoto && results[fileIndex]) {
    compressedFiles.passportPhoto = results[fileIndex].file;
    fileIndex++;
  }

  for (let i = 0; i < academicDocs.length; i++) {
    if (results[fileIndex]) {
      compressedFiles.academicDocuments.push(results[fileIndex].file);
      fileIndex++;
    }
  }

  for (let i = 0; i < identificationDocs.length; i++) {
    if (results[fileIndex]) {
      compressedFiles.identificationDocuments.push(results[fileIndex].file);
      fileIndex++;
    }
  }

  console.log('✅ File compression completed', {
    originalFiles: allFiles.length,
    compressedFiles: results.length,
    passportPhoto: !!compressedFiles.passportPhoto,
    academicDocuments: compressedFiles.academicDocuments.length,
    identificationDocuments: compressedFiles.identificationDocuments.length
  });

  return {
    ...compressedFiles,
    compressionResults
  };
};
