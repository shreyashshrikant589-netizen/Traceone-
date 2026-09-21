type SkeletonProps = { className?: string };

export function Skeleton({ className = '' }: SkeletonProps) {
  return <span className={`block animate-pulse rounded-lg bg-slate-200 ${className}`} aria-hidden="true" />;
}

export function TableSkeleton({ rows = 4, columns = 5 }: { rows?: number; columns?: number }) {
  return <div className="space-y-3" role="status" aria-label="Loading table"><span className="sr-only">Loading table</span>{Array.from({ length: rows }).map((_, row) => <div key={row} className="flex gap-4">{Array.from({ length: columns }).map((__, column) => <Skeleton key={column} className="h-4 flex-1" />)}</div>)}</div>;
}
