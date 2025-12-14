import { cn } from "@/lib/utils"

interface LoadingSkeletonProps {
  className?: string
}

export function LoadingSkeleton({ className }: LoadingSkeletonProps) {
  return <div className={cn("skeleton-base animate-pulse rounded-lg bg-muted", className)} />
}

export function TicketCardSkeleton() {
  return (
    <div className="skeleton-ticket-card rounded-xl border border-border bg-card p-4">
      <div className="skeleton-ticket-card-header flex items-start justify-between gap-3">
        <div className="skeleton-ticket-card-content flex-1 space-y-2">
          <LoadingSkeleton className="h-5 w-20" />
          <LoadingSkeleton className="h-5 w-3/4" />
          <LoadingSkeleton className="h-4 w-1/2" />
        </div>
      </div>
      <div className="skeleton-ticket-card-footer mt-4 flex items-center justify-between">
        <LoadingSkeleton className="h-5 w-24" />
        <LoadingSkeleton className="h-9 w-24" />
      </div>
    </div>
  )
}

export function MemberCardSkeleton() {
  return (
    <div className="skeleton-member-card flex items-center gap-3 rounded-lg border border-border bg-card p-4">
      <LoadingSkeleton className="skeleton-member-card-avatar h-10 w-10 rounded-full" />
      <div className="skeleton-member-card-info flex-1 space-y-2">
        <LoadingSkeleton className="h-5 w-32" />
        <LoadingSkeleton className="h-4 w-48" />
      </div>
      <LoadingSkeleton className="skeleton-member-card-badge h-5 w-16" />
    </div>
  )
}
