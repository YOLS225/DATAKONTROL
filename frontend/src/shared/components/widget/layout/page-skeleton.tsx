function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className}`} />;
}

export function PageSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Chargement de la page">
      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-3">
            <SkeletonBlock className="h-4 w-24" />
            <SkeletonBlock className="h-8 w-64 max-w-[70vw]" />
          </div>
          <SkeletonBlock className="h-10 w-36" />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div className="rounded-lg border bg-card p-4 shadow-sm" key={index}>
            <div className="flex items-center justify-between">
              <SkeletonBlock className="h-4 w-28" />
              <SkeletonBlock className="size-4 rounded-full" />
            </div>
            <SkeletonBlock className="mt-4 h-8 w-20" />
            <SkeletonBlock className="mt-3 h-4 w-36" />
          </div>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">
        <PanelSkeleton />
        <PanelSkeleton />
      </section>

      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-3">
            <SkeletonBlock className="h-5 w-44" />
            <SkeletonBlock className="h-4 w-72 max-w-[70vw]" />
          </div>
          <SkeletonBlock className="h-9 w-24" />
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <SkeletonBlock className="h-16 w-full" key={index} />
          ))}
        </div>
      </section>
    </div>
  );
}

function PanelSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-5 shadow-sm">
      <SkeletonBlock className="h-5 w-56" />
      <SkeletonBlock className="mt-3 h-4 w-72 max-w-full" />
      <div className="mt-6 space-y-4">
        <SkeletonBlock className="h-12 w-full" />
        <SkeletonBlock className="h-12 w-full" />
        <SkeletonBlock className="h-12 w-4/5" />
      </div>
    </div>
  );
}
