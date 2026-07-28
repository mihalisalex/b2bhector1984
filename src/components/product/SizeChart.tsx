import { EU_SIZES, getAvailableBoxTypes } from "@/lib/data/boxTypes";
import type { Style } from "@/lib/types";

export function SizeChart({ style }: { style: Style }) {
  const boxTypes = getAvailableBoxTypes(style);
  if (boxTypes.length === 0) return null;

  return (
    <div className="scroll-thin overflow-x-auto">
      <table className="w-full min-w-[420px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-stone-300 text-left text-[11px] uppercase tracking-wide text-ink-soft">
            <th className="px-3 py-2 font-semibold">Box</th>
            {EU_SIZES.map((size) => (
              <th key={size} className="px-3 py-2 text-right font-semibold">EU {size}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {boxTypes.map((box) => (
            <tr key={box.id} className="border-b border-stone-100 last:border-b-0">
              <td className="font-mono-tab px-3 py-2 text-ink">{box.label}</td>
              {EU_SIZES.map((size) => (
                <td key={size} className="font-mono-tab px-3 py-2 text-right text-ink-soft">
                  {box.sizeBreakdown[size] ?? "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
