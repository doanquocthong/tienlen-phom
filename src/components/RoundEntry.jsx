import Avatar from "./Avatar";
import { scoreRound } from "../models/Player";
import { HEO_SUITS, RANK_LABELS, emptyHeos, formatPoint, pointClass } from "../storage/tienlenSession";

export function emptyEntry() {
  return { order: [], cuts: [], pending: null, nextId: 1 };
}

export function rankOf(order, playerId) {
  const index = order.indexOf(playerId);
  if (index >= 0) return index + 1;
  if (order.length >= 3) return 4;
  return 0;
}

export function heosFromCuts(cuts, playerId) {
  const heos = emptyHeos();
  for (const cut of cuts) {
    if (cut.winnerId === playerId) heos[cut.suitId] += 1;
    if (cut.loserId === playerId) heos[cut.suitId] -= 1;
  }
  return heos;
}

export function resultsFromEntry(players, entry) {
  if (!entry || entry.pending || entry.order.length < 3) return null;

  const results = {};
  for (const player of players) {
    const rank = rankOf(entry.order, player.id);
    if (!rank) return null;
    results[player.id] = { rank, heos: heosFromCuts(entry.cuts, player.id) };
  }
  return results;
}

export function entryView(player, entry, rules, heo) {
  const rank = rankOf(entry.order, player.id);
  const heos = heosFromCuts(entry.cuts, player.id);
  return {
    rank,
    heos,
    delta: scoreRound({ rankPoints: rules, rank, heos, heoPoints: heo }),
    showPreview: rank > 0,
    suitsOpen: entry.order.length >= 3,
    pendingSuit: entry.pending?.winnerId === player.id ? entry.pending.suitId : "",
    isTarget: Boolean(entry.pending && entry.pending.winnerId !== player.id),
    isWinner: Boolean(entry.pending?.winnerId === player.id),
  };
}

export function entryHint(entry, players) {
  if (entry.pending) {
    const winner = players.find((player) => player.id === entry.pending.winnerId);
    const suit = HEO_SUITS.find((item) => item.id === entry.pending.suitId);
    return {
      text: `${winner?.name ?? ""} đang ăn ${suit?.symbol ?? ""} ${suit?.short ?? ""}. Bấm người thua.`,
      note: "",
    };
  }
  if (entry.order.length === 0) return { text: "Bấm người về nhất.", note: "" };
  if (entry.order.length === 1) return { text: "Bấm người về nhì.", note: "" };
  if (entry.order.length === 2) return { text: "Bấm người về ba. Người còn lại là chót.", note: "" };
  return {
    text: "Bấm chất ở người ăn, rồi bấm người thua.",
    note: "Bấm hạng đã chọn nếu muốn sửa.",
  };
}

export function tapPlayer(entry, playerId) {
  if (entry.pending) {
    if (entry.pending.winnerId === playerId) return entry;
    return {
      ...entry,
      pending: null,
      nextId: entry.nextId + 1,
      cuts: [
        ...entry.cuts,
        {
          id: entry.nextId,
          winnerId: entry.pending.winnerId,
          loserId: playerId,
          suitId: entry.pending.suitId,
        },
      ],
    };
  }

  const index = entry.order.indexOf(playerId);
  if (index >= 0) return { ...entry, order: entry.order.slice(0, index) };
  if (entry.order.length >= 3) return { ...entry, order: entry.order.slice(0, -1) };
  return { ...entry, order: [...entry.order, playerId] };
}

export function tapSuit(entry, playerId, suitId) {
  if (entry.order.length < 3) return entry;
  if (entry.pending && entry.pending.winnerId !== playerId) return tapPlayer(entry, playerId);
  const same = entry.pending?.winnerId === playerId && entry.pending?.suitId === suitId;
  return { ...entry, pending: same ? null : { winnerId: playerId, suitId } };
}

export function EntryHint({ entry, players }) {
  const hint = entryHint(entry, players);
  return (
    <p className="entry-hint">
      {hint.text}
      {hint.note && <span className="entry-note">{hint.note}</span>}
    </p>
  );
}

export function RoundCutList({ cuts, players, onRemove }) {
  if (!cuts.length) return null;

  return (
    <div className="cut-list">
      {cuts.map((cut) => {
        const winner = players.find((player) => player.id === cut.winnerId);
        const loser = players.find((player) => player.id === cut.loserId);
        const suit = HEO_SUITS.find((item) => item.id === cut.suitId);
        return (
          <button
            key={cut.id}
            type="button"
            className="cut-chip"
            onClick={() => onRemove(cut.id)}
            aria-label={`Bỏ ${winner?.name ?? ""} ăn ${suit?.label ?? ""} của ${loser?.name ?? ""}`}
          >
            <span>{winner?.name}</span>
            <span className={`suit-${suit?.id}`}>{suit?.symbol}</span>
            <span>{loser?.name}</span>
            <span aria-hidden="true">×</span>
          </button>
        );
      })}
    </div>
  );
}

export default function RoundEntryCard({
  player,
  rank,
  heos,
  delta,
  showPreview,
  suitsOpen,
  pendingSuit,
  isTarget,
  isWinner,
  onTapPlayer,
  onTapSuit,
}) {
  const tone = rank ? `tone-${rank}` : "tone-none";
  const state = isWinner ? "is-winner" : isTarget ? "is-target" : "";

  return (
    <article className={`player-box-detail entry-card ${tone} ${state}`}>
      <button type="button" className="entry-rank" onClick={() => onTapPlayer(player.id)}>
        <span className="rank-badge">{rank ? RANK_LABELS[rank] : "Hạng"}</span>
        <Avatar name={player.name} src={player.avatar} size={40} />
        <div className="detail-copy">
          <div className="detail-name">{player.name}</div>
          {(showPreview || isTarget || isWinner) && (
            <div className="detail-meta">
              {showPreview && (
                <span>
                  Ván <strong className={pointClass(delta)}>{formatPoint(delta)}</strong>
                </span>
              )}
              {isTarget && <span className="entry-lose">Chịu</span>}
              {isWinner && <span className="entry-eat">Đang ăn</span>}
            </div>
          )}
        </div>
        <strong className={`detail-score ${pointClass(player.currentScore)}`}>{player.currentScore}</strong>
      </button>

      <div className={`entry-suits ${suitsOpen ? "" : "is-locked"}`}>
        {HEO_SUITS.map((suit) => {
          const count = heos[suit.id] || 0;
          const times = Math.abs(count);
          return (
            <button
              key={suit.id}
              type="button"
              className={`suit-pick suit-${suit.id} ${pendingSuit === suit.id ? "is-pending" : ""} ${count < 0 ? "is-loss" : ""}`}
              disabled={!suitsOpen}
              onClick={() => onTapSuit(player.id, suit.id)}
              aria-label={
                !suitsOpen
                  ? `${suit.label}. Chọn đủ hạng trước${times ? `. Đang ${count > 0 ? "ăn" : "chịu"} ${times} lần` : ""}`
                  : count > 0
                    ? `${player.name} ăn ${suit.label} ${times} lần`
                    : count < 0
                      ? `${player.name} chịu ${suit.label} ${times} lần`
                      : `${player.name} ăn ${suit.label}`
              }
            >
              <span>{suit.symbol}</span>
              {count !== 0 && (
                <strong className="suit-times">×{times}</strong>
              )}
            </button>
          );
        })}
      </div>
    </article>
  );
}
