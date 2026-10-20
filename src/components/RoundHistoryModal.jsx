import { HEO_SUITS, RANK_LABELS, formatPoint, pointClass } from "../storage/tienlenSession";

function heoText(line) {
  const parts = [];
  if (line.heos) {
    for (const suit of HEO_SUITS) {
      if (line.heos[suit.id]) parts.push(`${suit.short.toLowerCase()} ${line.heos[suit.id]}`);
    }
  }
  if (!parts.length) {
    if (line.heoDo) parts.push(`heo đỏ ${line.heoDo}`);
    if (line.heoDen) parts.push(`heo đen ${line.heoDen}`);
  }
  return parts.join(", ");
}

export default function RoundHistoryModal({ history, onClose }) {
  const rounds = [...history].reverse();

  return (
    <div className="modal-overlay">
      <div className="modal-box result-modal">
        <h2 className="modal-title">Nhật ký ván</h2>

        {rounds.length === 0 ? (
          <p className="setup-hint">Chưa có ván nào.</p>
        ) : (
          <div className="history-list">
            {rounds.map((round, index) => (
              <article key={`${round.lines.map((line) => line.playerId).join("-")}-${index}`} className="history-round">
                <h3>Ván {history.length - index}</h3>
                <ul>
                  {[...round.lines]
                    .sort((a, b) => a.rank - b.rank)
                    .map((line) => (
                      <li key={line.playerId}>
                        <span className="history-name">{line.name}</span>
                        <span className={`tone-text tone-${line.rank}`}>{RANK_LABELS[line.rank] || `Hạng ${line.rank}`}</span>
                        <strong className={pointClass(line.delta)}>{formatPoint(line.delta)}</strong>
                        {heoText(line) && <em>{heoText(line)}</em>}
                      </li>
                    ))}
                </ul>
              </article>
            ))}
          </div>
        )}

        <div className="btn-row">
          <button type="button" className="confirm-btn" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
