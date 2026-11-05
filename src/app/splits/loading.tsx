export default function SplitsLoading() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 sm:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="h-8 w-56 bg-slate-200 rounded-lg animate-pulse" />
        <div className="bg-white rounded-xl border border-slate-200 p-8 space-y-6">
          <div className="h-5 w-40 bg-slate-200 rounded animate-pulse" />
          <div className="h-12 w-full bg-slate-100 rounded-lg animate-pulse" />
          <div className="h-5 w-36 bg-slate-200 rounded animate-pulse" />
          <div className="h-12 w-full bg-slate-100 rounded-lg animate-pulse" />
          <div className="h-12 w-40 bg-slate-200 rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  );
}
