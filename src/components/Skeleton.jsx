export function Skeleton({ className = "" }) {
  return <div aria-hidden="true" className={`animate-pulse rounded bg-raised2 ${className}`} />;
}

// Заглушка под VehicleCard
export function VehicleCardSkeleton() {
  return (
    <div className="rounded-lg border border-hair bg-panel overflow-hidden">
      <Skeleton className="h-36 rounded-none" />
      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex gap-1.5">
          <Skeleton className="h-2 w-2 rounded-full" />
          <Skeleton className="h-2 w-2 rounded-full" />
          <Skeleton className="h-2 w-2 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function VehicleGridSkeleton({ count = 6 }) {
  return (
    <div
      role="status"
      aria-label="Загрузка"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      {Array.from({ length: count }, (_, i) => (
        <VehicleCardSkeleton key={i} />
      ))}
    </div>
  );
}

// Заглушка под строки списков (админка, результаты поиска)
export function RowsSkeleton({ count = 5, className = "h-14" }) {
  return (
    <div role="status" aria-label="Загрузка" className="flex flex-col gap-2">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className={`${className} rounded-md border border-hair`} />
      ))}
    </div>
  );
}

// Заглушка под CreditCard
export function CreditsSkeleton() {
  return (
    <div role="status" aria-label="Загрузка" className="flex flex-col gap-10">
      {[3, 2].map((n, g) => (
        <div key={g}>
          <Skeleton className="h-7 w-64 mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: n }, (_, i) => (
              <div key={i} className="rounded-lg border border-hair bg-panel p-5 flex items-center gap-4">
                <Skeleton className="w-14 h-14 rounded-full shrink-0" />
                <div className="flex-1 flex flex-col gap-2">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Заглушка под страницу машины
export function VehicleDetailSkeleton() {
  return (
    <div role="status" aria-label="Загрузка" className="max-w-6xl mx-auto px-5 py-10">
      <Skeleton className="h-4 w-56 mb-6" />
      <Skeleton className="h-9 w-80 mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-14 w-full" />
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-4">
            {Array.from({ length: 8 }, (_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        </div>
        <Skeleton className="w-full aspect-[16/10]" />
      </div>
    </div>
  );
}

// Заглушка под страницу профиля (ProviderDetail)
export function ProviderSkeleton() {
  return (
    <div role="status" aria-label="Загрузка" className="max-w-6xl mx-auto px-5 py-10">
      <Skeleton className="h-4 w-56 mb-6" />
      <div className="mb-10 border border-hair rounded-lg bg-panel px-8 py-10 flex items-center gap-6">
        <Skeleton className="w-24 h-24 rounded-full shrink-0" />
        <div className="flex-1 flex flex-col gap-3">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-9 w-72" />
        </div>
      </div>
      <VehicleGridSkeleton count={3} />
    </div>
  );
}
