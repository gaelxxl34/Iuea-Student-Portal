interface SkeletonProps {
  className?: string;
}

function Skeleton({ className = "", ...props }: SkeletonProps & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse rounded-md bg-slate-200 ${className}`}
      {...props}
    />
  );
}

export { Skeleton };
