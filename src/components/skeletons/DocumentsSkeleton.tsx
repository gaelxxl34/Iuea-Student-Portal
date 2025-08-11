import { Skeleton } from "@/components/ui/Skeleton";

export function DocumentsSkeleton() {
  return (
    <div className="pb-20 md:pb-0">
      {/* Page Header Skeleton */}
      <div className="mb-6">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Document Requirements Info Skeleton */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <Skeleton className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <Skeleton className="h-5 w-40 mb-2" />
            <div className="space-y-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-3 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Documents Status Summary Skeleton */}
      <div className="bg-white rounded-lg p-3 md:p-4 border border-slate-200 mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="text-center sm:text-left">
              <Skeleton className="h-4 w-16 mb-1" />
              <div className="mt-1">
                <Skeleton className="h-8 w-8 mb-1" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
        
        {/* Progress bar skeleton */}
        <div className="mt-4">
          <div className="flex justify-between mb-1">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="w-full h-2.5 rounded-full" />
        </div>
      </div>

      {/* Document Categories Tabs Skeleton */}
      <div className="bg-white rounded-lg overflow-hidden mb-6">
        <div className="flex overflow-x-auto scrollbar-hide">
          {[1, 2, 3].map((i) => (
            <div key={i} className="px-4 md:px-6 py-3">
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </div>

      {/* Documents List Skeleton */}
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg p-3 md:p-4 border border-slate-200">
            <div className="flex flex-col gap-3">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-16 rounded-lg" />
                    <Skeleton className="h-8 w-20 rounded-lg" />
                  </div>
                </div>
                
                <Skeleton className="h-4 w-full mb-2" />
                
                {/* File requirements skeleton */}
                <div className="bg-slate-50 rounded-lg p-2 mb-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="flex items-center">
                      <Skeleton className="h-3 w-3 mr-1" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <div className="flex items-center">
                      <Skeleton className="h-3 w-3 mr-1" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                </div>
                
                {/* Status info skeleton */}
                <div className="flex items-center bg-green-50 rounded-lg p-2">
                  <Skeleton className="h-3 w-3 mr-2" />
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-3 w-24 ml-2" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Submit Documents Button Section Skeleton */}
      <div className="mt-6">
        {/* Requirements completion status skeleton */}
        <div className="bg-slate-50 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Skeleton className="w-4 h-4 rounded-full mr-3" />
              <div>
                <Skeleton className="h-4 w-48 mb-1" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
          <Skeleton className="h-9 w-32 rounded-lg" />
          <Skeleton className="h-9 w-48 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
