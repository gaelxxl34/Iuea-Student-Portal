import { Skeleton } from "@/components/ui/Skeleton";

export function DashboardSkeleton() {
  return (
    <div className="p-4 md:p-6">
      {/* Page Header Skeleton */}
      <div className="mb-6">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Application Status Skeleton */}
      <div className="bg-white rounded-lg p-3 md:p-4 border border-[#EDEDED] mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4 mb-4">
          <div>
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-6 w-20" />
        </div>
        
        {/* Progress bar skeleton */}
        <div className="mt-3 md:mt-4">
          <div className="flex justify-between mb-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="w-full h-2.5 rounded-full" />
        </div>
        
        {/* Next action skeleton */}
        <div className="mt-3 md:mt-4 p-3 bg-red-50 rounded-lg border-l-4 border-red-800 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div className="flex-1">
            <Skeleton className="h-5 w-48 mb-2" />
            <Skeleton className="h-4 w-36" />
          </div>
          <Skeleton className="h-8 w-32" />
        </div>
      </div>

      {/* Main Content - 2 Column Layout skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Programs Section Skeleton */}
          <div className="bg-white rounded-lg p-4 md:p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-6 w-40" />
            </div>
            <div className="space-y-3">
              <div className="p-3 border border-[#EDEDED] rounded-lg">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 gap-2">
                  <Skeleton className="h-5 w-64" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <Skeleton className="h-4 w-48 mb-2" />
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[#EDEDED] text-center">
              <Skeleton className="h-4 w-32 mx-auto" />
            </div>
          </div>
          
          {/* Documents Section Skeleton */}
          <div className="bg-white rounded-lg p-4 md:p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-6 w-36" />
              <Skeleton className="h-4 w-12" />
            </div>
            
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-3 border border-[#EDEDED] rounded-lg">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <div className="flex-1">
                      <Skeleton className="h-4 w-48 mb-1" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Right Column */}
        <div className="space-y-6">
          {/* Application Checklist Skeleton */}
          <div className="bg-white rounded-lg p-4 md:p-6 border border-slate-200">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-start">
                  <Skeleton className="mt-0.5 h-5 w-5 rounded-full" />
                  <div className="ml-3 flex-1">
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Announcements Skeleton */}
          <div className="bg-white rounded-lg p-4 md:p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-6 w-28" />
              <Skeleton className="h-4 w-16" />
            </div>
            
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-3 border border-[#EDEDED] rounded-lg">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 gap-1">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          </div>
          
          {/* Need Help Skeleton */}
          <div className="bg-[#780000]/5 rounded-lg p-3 md:p-4">
            <Skeleton className="h-5 w-20 mb-2" />
            <Skeleton className="h-4 w-full mb-3" />
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center">
                  <Skeleton className="w-4 h-4 mr-2" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </div>
            <Skeleton className="w-full h-8 mt-3 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
