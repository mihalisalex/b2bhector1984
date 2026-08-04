export default function CatalogueLoading() {
  return (
    <div className="mx-auto max-w-[1600px] animate-pulse px-6 py-8 lg:px-10">
      <div className="mb-6 border-b border-stone-300 pb-6">
        <div className="h-7 w-40 bg-stone-200" />
        <div className="mt-2 h-4 w-72 bg-stone-100" />
      </div>
      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="hidden lg:block lg:w-64 lg:shrink-0">
          <div className="h-9 w-full bg-stone-200" />
          <div className="mt-6 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 w-full bg-stone-100" />
            ))}
          </div>
        </div>
        <div className="grid flex-1 grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="border border-stone-300 bg-white">
              <div className="aspect-[4/3] w-full bg-stone-200" />
              <div className="space-y-2 p-4">
                <div className="h-3 w-16 bg-stone-100" />
                <div className="h-4 w-3/4 bg-stone-200" />
                <div className="h-3 w-1/2 bg-stone-100" />
                <div className="mt-2 h-5 w-20 bg-stone-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
