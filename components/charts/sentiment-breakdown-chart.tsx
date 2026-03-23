"use client";

const SENTIMENT_STYLES = {
  Promoters: "bg-emerald-500",
  Passives: "bg-amber-400",
  Detractors: "bg-rose-500",
} as const;

export function SentimentBreakdownChart({
  data,
}: {
  data: Array<{ name: string; value: number }>;
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="space-y-5">
      <div className="flex h-5 overflow-hidden rounded-full bg-slate-100">
        {data.map((item) => (
          <div
            key={item.name}
            className={SENTIMENT_STYLES[item.name as keyof typeof SENTIMENT_STYLES] ?? "bg-slate-400"}
            style={{ width: total ? `${(item.value / total) * 100}%` : "0%" }}
          />
        ))}
      </div>
      <div className="grid gap-3">
        {data.map((item) => {
          const percentage = total ? Math.round((item.value / total) * 100) : 0;
          return (
            <div key={item.name} className="rounded-2xl border border-border/70 bg-white px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className={`h-3 w-3 rounded-full ${
                      SENTIMENT_STYLES[item.name as keyof typeof SENTIMENT_STYLES] ?? "bg-slate-400"
                    }`}
                  />
                  <span className="font-medium text-slate-800">{item.name}</span>
                </div>
                <span className="text-sm text-slate-500">{item.value}</span>
              </div>
              <p className="mt-2 text-sm text-slate-500">{percentage}% of received responses</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
