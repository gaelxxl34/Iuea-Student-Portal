import { Skeleton } from "@/components/ui/Skeleton";

export function ApplicationSkeleton() {
  return (
    <div className="pb-20 md:pb-0">
      {/* Page Header Skeleton */}
      <div className="mb-6">
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Application Progress Skeleton */}
      <div className="bg-white rounded-lg p-3 md:p-4 border border-slate-200 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="relative mb-1 md:mb-2">
                <Skeleton className="h-6 w-6 md:h-8 md:w-8 rounded-full" />
                {i < 3 && (
                  <Skeleton className="absolute top-1/2 left-full w-12 md:w-16 h-0.5 -translate-y-1/2" />
                )}
              </div>
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </div>

      {/* Form Layout Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left side: navigation skeleton */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg overflow-hidden border border-slate-200">
            <div className="p-3 bg-[#f7f7f7] border-b border-slate-200">
              <Skeleton className="h-5 w-32" />
            </div>
            <div>
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-full px-3 md:px-4 py-2 md:py-3 flex items-center justify-between border-b border-slate-200 last:border-b-0">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4 rounded-full" />
                </div>
              ))}
            </div>
          </div>

          {/* Application Tips Skeleton */}
          <div className="mt-4 bg-blue-50 rounded-lg p-3 md:p-4">
            <Skeleton className="h-5 w-12 mb-3" />
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex">
                  <Skeleton className="h-3 w-3 rounded-full mr-2 mt-1 flex-shrink-0" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right side: form section skeleton */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg p-4 md:p-6 border border-slate-200">
            {/* Section Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            
            {/* Form Fields Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className={i > 4 ? "sm:col-span-2" : ""}>
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="w-full h-10 rounded-lg" />
                  {i > 4 && <Skeleton className="h-3 w-48 mt-1" />}
                </div>
              ))}
            </div>
            
            {/* Action Buttons */}
            <div className="mt-6 flex justify-end">
              <Skeleton className="h-9 w-40 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Submit Application Section Skeleton */}
      <div className="mt-6 bg-white rounded-lg p-4 border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-36 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function ApplicationViewSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header with Application Status Skeleton */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
          <div>
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-4 w-48 mb-1" />
            <Skeleton className="h-3 w-40" />
          </div>
          
          <div className="flex flex-col sm:items-end gap-2">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-32 rounded-lg" />
          </div>
        </div>

        <Skeleton className="h-12 w-full rounded-lg mb-4" />

        <div className="mt-4 pt-4 border-t border-slate-200">
          <Skeleton className="h-8 w-40 rounded-lg" />
        </div>
      </div>

      {/* Personal Information Skeleton */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center mb-4">
          <Skeleton className="h-5 w-5 mr-2" />
          <Skeleton className="h-6 w-40" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i}>
              <Skeleton className="h-4 w-24 mb-1" />
              <Skeleton className="h-5 w-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Program Information Skeleton */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center mb-4">
          <Skeleton className="h-5 w-5 mr-2" />
          <Skeleton className="h-6 w-32" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i}>
              <Skeleton className="h-4 w-24 mb-1" />
              <Skeleton className="h-5 w-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Documents Status Skeleton */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center mb-4">
          <Skeleton className="h-5 w-5 mr-2" />
          <Skeleton className="h-6 w-32" />
        </div>
        
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center">
                <Skeleton className="h-4 w-4 mr-3" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-5 w-16 rounded" />
            </div>
          ))}
        </div>

        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex">
            <Skeleton className="h-4 w-4 mt-0.5 mr-3" />
            <div className="flex-1">
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Contact Information Skeleton */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center mb-2">
          <Skeleton className="h-5 w-5 mr-2" />
          <Skeleton className="h-6 w-20" />
        </div>
        <Skeleton className="h-4 w-full mb-4" />
        <div className="flex flex-wrap gap-4">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    </div>
  );
}
