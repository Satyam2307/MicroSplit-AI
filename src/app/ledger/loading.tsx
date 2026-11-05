export default function LedgerLoading() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="h-8 w-40 bg-slate-200 rounded-lg animate-pulse mb-6" />
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
            ))}
          </div>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="p-4 border-b border-slate-50 flex gap-4">
              {[1, 2, 3, 4].map((j) => (
                <div key={j} className="h-4 w-24 bg-slate-100 rounded animate-pulse" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
