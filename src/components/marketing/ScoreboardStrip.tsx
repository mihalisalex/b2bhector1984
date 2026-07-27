const STATS = [
  { label: "Founded", value: "1984" },
  { label: "Styles this season", value: "14" },
  { label: "Categories", value: "3" },
  { label: "Wholesale terms", value: "NET 30/60" },
  { label: "Active retailers", value: "310+" },
];

interface Tile {
  ch: string;
  delayIndex: number;
}

function buildStatTiles(): { label: string; value: string; tiles: Tile[] }[] {
  let cursor = 0;
  const rows: { label: string; value: string; tiles: Tile[] }[] = [];
  for (const stat of STATS) {
    const tiles = stat.value.split("").map((ch) => {
      const tile = { ch, delayIndex: cursor };
      cursor += 1;
      return tile;
    });
    rows.push({ ...stat, tiles });
  }
  return rows;
}

const STAT_ROWS = buildStatTiles();

export function ScoreboardStrip() {
  return (
    <div className="border-y border-white/10 bg-ink py-8">
      <div className="mx-auto flex max-w-[1440px] flex-wrap justify-center gap-x-12 gap-y-6 px-6 lg:px-10">
        {STAT_ROWS.map((stat) => (
          <div key={stat.label} className="flex flex-col items-center gap-2">
            <div className="flex gap-[3px]" aria-label={stat.value}>
              {stat.tiles.map((tile, i) => (
                <span
                  key={i}
                  className="flap-tile font-mono-tab flex h-11 w-8 items-center justify-center bg-[#26292f] text-lg font-semibold tabular-nums text-white shadow-[inset_0_-1px_0_rgba(255,255,255,0.08)] sm:h-14 sm:w-10 sm:text-2xl"
                  style={{ animationDelay: `${tile.delayIndex * 45}ms` }}
                  aria-hidden
                >
                  {tile.ch === " " ? "" : tile.ch}
                </span>
              ))}
            </div>
            <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-stone-300/60">
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
