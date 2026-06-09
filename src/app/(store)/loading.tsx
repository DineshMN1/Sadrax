export default function StoreLoading() {
  return (
    <div className="flex flex-col">
      {/* Header skeleton (mobile only — desktop has the persistent DesktopHeader) */}
      <div className="md:hidden sticky top-0 z-20 bg-white border-b border-gray-100 px-4 pt-4 pb-3 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 skeleton rounded-full" />
            <div className="h-4 w-20 skeleton rounded-lg" />
          </div>
          <div className="w-9 h-9 skeleton rounded-full" />
        </div>
        <div className="h-11 skeleton rounded-xl" />
      </div>

      <div className="px-4 py-4 space-y-7">
        {/* Hero banner */}
        <div className="h-32 skeleton rounded-3xl" />

        {/* Category grid */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="h-5 w-36 skeleton rounded-lg" />
            <div className="h-4 w-14 skeleton rounded-lg" />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {Array(8).fill(0).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5 p-2 bg-white rounded-2xl border border-gray-100">
                <div className="w-10 h-10 skeleton rounded-xl" />
                <div className="h-2 w-10 skeleton rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Product grid */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="h-5 w-28 skeleton rounded-lg" />
            <div className="h-4 w-16 skeleton rounded-lg" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="aspect-square skeleton" />
                <div className="p-2.5 space-y-2">
                  <div className="h-3 w-12 skeleton rounded" />
                  <div className="h-4 w-full skeleton rounded" />
                  <div className="h-4 w-3/4 skeleton rounded" />
                  <div className="h-8 w-full skeleton rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
