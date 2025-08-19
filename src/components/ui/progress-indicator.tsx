import React from 'react';

interface UploadProgress {
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

interface ProgressIndicatorProps {
  progress: UploadProgress;
  showDetails?: boolean;
  className?: string;
}

const PROGRESS_STAGES = {
  preparing: 'Preparing submission...',
  compressing: 'Optimizing files...',
  uploading: 'Uploading files...',
  finalizing: 'Finalizing submission...',
  completed: 'Upload completed!',
  error: 'Upload failed'
};

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  progress,
  showDetails = true,
  className = '',
}) => {
  const getStageNumber = (stage: UploadProgress['stage']) => {
    const stages = ['preparing', 'compressing', 'uploading', 'finalizing', 'completed'];
    return stages.indexOf(stage) + 1;
  };

  const currentStep = getStageNumber(progress.stage);
  const totalSteps = 4; // preparing, compressing, uploading, finalizing

  return (
    <div className={`w-full max-w-sm mx-auto p-6 bg-white rounded-lg shadow-lg ${className}`}>
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          {progress.stage === 'completed' ? 'Upload Complete!' : 'Uploading Files'}
        </h3>
        <p className="text-sm text-gray-600">{PROGRESS_STAGES[progress.stage]}</p>
      </div>
      
      {/* Bottle Progress Indicator */}
      <div className="flex justify-center mb-4">
        <div className="relative">
          {/* Bottle outline */}
          <svg width="80" height="120" viewBox="0 0 80 120" className="drop-shadow-md">
            {/* Bottle neck */}
            <rect x="30" y="0" width="20" height="15" fill="#e5e7eb" stroke="#9ca3af" strokeWidth="2" rx="2"/>
            
            {/* Bottle body */}
            <path
              d="M20 15 L20 105 Q20 115 30 115 L50 115 Q60 115 60 105 L60 15 Z"
              fill="#f3f4f6"
              stroke="#9ca3af"
              strokeWidth="2"
            />
            
            {/* Liquid fill */}
            <defs>
              <linearGradient id="liquidGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor={progress.stage === 'error' ? '#ef4444' : progress.stage === 'completed' ? '#22c55e' : '#3b82f6'} stopOpacity="1" />
                <stop offset="50%" stopColor={progress.stage === 'error' ? '#f87171' : progress.stage === 'completed' ? '#4ade80' : '#60a5fa'} stopOpacity="0.8" />
                <stop offset="100%" stopColor={progress.stage === 'error' ? '#fca5a5' : progress.stage === 'completed' ? '#86efac' : '#93c5fd'} stopOpacity="0.6" />
              </linearGradient>
              <clipPath id="bottleClip">
                <path d="M22 17 L22 103 Q22 113 30 113 L50 113 Q58 113 58 103 L58 17 Z"/>
              </clipPath>
            </defs>
            
            {/* Animated liquid */}
            <rect
              x="22"
              y={115 - (96 * progress.overall / 100)}
              width="36"
              height={96 * progress.overall / 100}
              fill="url(#liquidGradient)"
              clipPath="url(#bottleClip)"
              className="transition-all duration-500 ease-out"
            />
            
            {/* Liquid surface animation */}
            {progress.overall > 0 && (
              <ellipse
                cx="40"
                cy={115 - (96 * progress.overall / 100)}
                rx="18"
                ry="2"
                fill={progress.stage === 'error' ? '#f87171' : progress.stage === 'completed' ? '#4ade80' : '#60a5fa'}
                opacity="0.8"
                clipPath="url(#bottleClip)"
                className="animate-pulse"
              />
            )}
          </svg>
          
          {/* Percentage display */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white font-bold text-lg drop-shadow-lg">
              {Math.round(progress.overall)}%
            </span>
          </div>
        </div>
      </div>
      
      {/* Step indicator */}
      {progress.stage !== 'completed' && progress.stage !== 'error' && (
        <div className="text-center mb-4">
          <div className="text-xs text-gray-500 mb-2">
            Step {currentStep} of {totalSteps}
          </div>
          
          {/* Step dots */}
          <div className="flex justify-center space-x-2">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                  i < currentStep
                    ? 'bg-blue-500'
                    : i === currentStep - 1
                    ? 'bg-blue-300'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Status Message */}
      <div className="text-center">
        <p className="text-sm text-gray-600">{progress.message}</p>
        
        {/* Time Remaining */}
        {progress.estimatedTimeRemaining && progress.stage === 'uploading' && (
          <p className="text-xs text-gray-500 mt-1">
            Estimated time remaining: {Math.ceil(progress.estimatedTimeRemaining / 1000)}s
          </p>
        )}
      </div>

      {/* File Details */}
      {showDetails && Object.keys(progress.files).length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-xs font-medium text-gray-700 border-t pt-3">
            Files ({Object.keys(progress.files).length})
          </h4>
          
          {Object.entries(progress.files).slice(0, 3).map(([fileName, file]) => (
            <div key={fileName} className="flex items-center justify-between text-xs">
              <div className="flex items-center">
                <div className={`h-1.5 w-1.5 rounded-full mr-2 ${
                  file.status === 'completed' ? 'bg-green-500' :
                  file.status === 'error' ? 'bg-red-500' :
                  file.status === 'uploading' ? 'bg-blue-500 animate-pulse' :
                  'bg-gray-300'
                }`}></div>
                <span className="text-gray-700 truncate max-w-[120px]">
                  {file.name}
                </span>
              </div>
              
              <span className="text-gray-500">
                {file.progress}%
              </span>
            </div>
          ))}
          
          {Object.keys(progress.files).length > 3 && (
            <p className="text-xs text-gray-500 text-center">
              +{Object.keys(progress.files).length - 3} more files
            </p>
          )}
        </div>
      )}

      {/* Success/Error Messages */}
      {progress.stage === 'completed' && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <div className="h-6 w-6 bg-green-100 rounded-full flex items-center justify-center mr-2">
              <span className="text-green-600 text-sm">✓</span>
            </div>
            <p className="text-sm text-green-700 font-medium">
              Application submitted successfully!
            </p>
          </div>
        </div>
      )}

      {progress.stage === 'error' && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <div className="h-6 w-6 bg-red-100 rounded-full flex items-center justify-center mr-2">
              <span className="text-red-600 text-sm">!</span>
            </div>
            <p className="text-sm text-red-700 font-medium">
              Upload failed - please try again
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressIndicator;
