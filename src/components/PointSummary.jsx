import { HEO_SUITS, RANK_LABELS, formatPoint, pointClass } from "../storage/tienlenSession";

function Bits({ bits }) {
  return bits.map((bit, index) => (
    <span key={bit.key}>
      {index > 0 && " · "}
      <span className={bit.tone}>{bit.label}</span>{" "}
      <span className={pointClass(bit.value)}>{formatPoint(bit.value)}</span>
    </span>
  ));
}

export function RankSummary({ rules }) {
  return (
    <Bits
      bits={[1, 2, 3, 4].map((rank) => ({
        key: rank,
        label: RANK_LABELS[rank],
        tone: `tone-text tone-${rank}`,
        value: rules?.[rank],
      }))}
    />
  );
}

export function HeoPointSummary({ heo }) {
  return (
    <Bits
      bits={HEO_SUITS.map((suit) => ({
        key: suit.id,
        label: suit.short,
        value: heo?.[suit.id],
      }))}
    />
  );
}
