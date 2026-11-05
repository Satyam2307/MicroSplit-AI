export default function StatementsLoading() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="h-8 w-52 bg-slate-200 rounded-lg animate-pulse mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
              <div className="flex justify-between">
                <div className="h-5 w-32 bg-slate-200 rounded animate-pulse" />
                <div className="h-5 w-24 bg-slate-100 rounded animate-pulse" />
              </div>
              <div className="h-4 w-full bg-slate-100 rounded animate-pulse" />
              <div className="h-4 w-3/4 bg-slate-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
