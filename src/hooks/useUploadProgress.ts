import { useState, useCallback, useRef } from 'react';

export interface UploadProgress {
  overall: number;
  files: Record<string, {
    name: string;
    progress: number;
    status: 'pending' | 'uploading' | 'completed' | 'error';
    error?: string;
  }>;
  stage: 'preparing' | 'compressing' | 'uploading' | 'finalizing' | 'completed' | 'error';
  message: string;
  estimatedTimeRemaining?: number;
}

export interface UseUploadProgressReturn {
  progress: UploadProgress;
  startProgress: (fileNames: string[]) => void;
  updateFileProgress: (fileName: string, progress: number, status?: 'uploading' | 'completed' | 'error', error?: string) => void;
  updateStage: (stage: UploadProgress['stage'], message: string) => void;
  calculateOverallProgress: () => void;
  reset: () => void;
}

/**
 * Hook for tracking application submission and file upload progress
 */
export const useUploadProgress = (): UseUploadProgressReturn => {
  const [progress, setProgress] = useState<UploadProgress>({
    overall: 0,
    files: {},
    stage: 'preparing',
    message: 'Preparing submission...',
  });

  const startTimeRef = useRef<number>(0);
  const progressHistoryRef = useRef<Array<{ time: number; progress: number }>>([]);

  const startProgress = useCallback((fileNames: string[]) => {
    startTimeRef.current = Date.now();
    progressHistoryRef.current = [];
    
    const files: UploadProgress['files'] = {};
    fileNames.forEach(name => {
      files[name] = {
        name,
        progress: 0,
        status: 'pending'
      };
    });

    setProgress({
      overall: 0,
      files,
      stage: 'preparing',
      message: 'Preparing files for upload...',
    });
  }, []);

  const updateFileProgress = useCallback((
    fileName: string, 
    fileProgress: number, 
    status: 'uploading' | 'completed' | 'error' = 'uploading',
    error?: string
  ) => {
    setProgress(prev => {
      const updatedFiles = {
        ...prev.files,
        [fileName]: {
          ...prev.files[fileName],
          progress: fileProgress,
          status,
          error
        }
      };

      // Calculate overall progress
      const totalFiles = Object.keys(updatedFiles).length;
      const totalProgress = Object.values(updatedFiles).reduce(
        (sum, file) => sum + file.progress, 
        0
      );
      const overall = totalFiles > 0 ? Math.round(totalProgress / totalFiles) : 0;

      // Calculate estimated time remaining
      const currentTime = Date.now();
      progressHistoryRef.current.push({ time: currentTime, progress: overall });

      let estimatedTimeRemaining: number | undefined;
      if (overall > 0 && overall < 100) {
        // Use last 5 progress points for estimation
        const recentHistory = progressHistoryRef.current.slice(-5);
        if (recentHistory.length >= 2) {
          const timeSpan = recentHistory[recentHistory.length - 1].time - recentHistory[0].time;
          const progressSpan = recentHistory[recentHistory.length - 1].progress - recentHistory[0].progress;
          
          if (progressSpan > 0) {
            const rate = progressSpan / timeSpan; // progress per ms
            const remainingProgress = 100 - overall;
            estimatedTimeRemaining = Math.round(remainingProgress / rate / 1000); // convert to seconds
          }
        }
      }

      return {
        ...prev,
        overall,
        files: updatedFiles,
        estimatedTimeRemaining
      };
    });
  }, []);

  const updateStage = useCallback((stage: UploadProgress['stage'], message: string) => {
    setProgress(prev => ({
      ...prev,
      stage,
      message
    }));
  }, []);

  const calculateOverallProgress = useCallback(() => {
    setProgress(prev => {
      const totalFiles = Object.keys(prev.files).length;
      if (totalFiles === 0) return prev;

      const totalProgress = Object.values(prev.files).reduce(
        (sum, file) => sum + file.progress,
        0
      );
      const overall = Math.round(totalProgress / totalFiles);

      return {
        ...prev,
        overall
      };
    });
  }, []);

  const reset = useCallback(() => {
    setProgress({
      overall: 0,
      files: {},
      stage: 'preparing',
      message: 'Preparing submission...',
    });
    progressHistoryRef.current = [];
  }, []);

  return {
    progress,
    startProgress,
    updateFileProgress,
    updateStage,
    calculateOverallProgress,
    reset
  };
};

/**
 * Helper function to format time remaining
 */
export const formatTimeRemaining = (seconds?: number): string => {
  if (!seconds || seconds <= 0) return '';
  
  if (seconds < 60) {
    return `${seconds}s remaining`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s remaining`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m remaining`;
  }
};

/**
 * Progress stages with user-friendly messages
 */
export const PROGRESS_STAGES = {
  preparing: 'Preparing your application...',
  compressing: 'Optimizing file sizes...',
  uploading: 'Uploading documents...',
  finalizing: 'Finalizing submission...',
  completed: 'Application submitted successfully!',
  error: 'An error occurred during submission'
} as const;
