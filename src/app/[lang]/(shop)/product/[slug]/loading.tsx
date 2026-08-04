export default function ProductLoading() {
  return (
    <div className="mx-auto max-w-[1600px] animate-pulse px-6 py-8 lg:px-10">
      <div className="mb-6 h-3 w-48 bg-stone-100" />
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,440px)_1fr]">
        <div className="aspect-[4/3] w-full bg-stone-200" />
        <div>
          <div className="h-3 w-24 bg-stone-100" />
          <div className="mt-3 h-9 w-2/3 bg-stone-200" />
          <div className="mt-2 h-4 w-1/2 bg-stone-100" />
          <div className="mt-5 h-64 w-full border border-stone-200 bg-stone-100" />
        </div>
      </div>
    </div>
  );
}
