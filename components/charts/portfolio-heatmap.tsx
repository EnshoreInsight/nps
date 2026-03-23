"use client";

export function PortfolioHeatmap({
  data,
}: {
  data: Array<{ project: string; nps: number; openActions: number }>;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {data.map((item) => {
        const tone =
          item.nps >= 30 ? "bg-emerald-100 text-emerald-800" : item.nps >= 0 ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-700";
        return (
          <div key={item.project} className={`rounded-3xl p-5 ${tone}`}>
            <p className="text-sm font-medium">{item.project}</p>
            <p className="mt-2 text-3xl font-semibold">{item.nps}</p>
            <p className="mt-2 text-sm">Open actions: {item.openActions}</p>
          </div>
        );
      })}
    </div>
  );
}
