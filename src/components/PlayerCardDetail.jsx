import Avatar from "./Avatar";
import { RANK_LABELS, pointClass } from "../storage/tienlenSession";

export default function PlayerCardDetail({ player, place = 0 }) {
  const lastRank =
    typeof player.lastRank === "number" && player.lastRank > 0 ? player.lastRank : 0;
  const score =
    typeof player.currentScore === "number" && !Number.isNaN(player.currentScore)
      ? player.currentScore
      : 0;
  const tone = place ? `tone-${place}` : "tone-none";

  return (
    <div className={`player-box-detail ${tone}`}>
      <span className="rank-badge">{place ? RANK_LABELS[place] : "Hòa"}</span>
      <Avatar name={player.name} src={player.avatar} size={44} />

      <div className="detail-copy">
        <div className="detail-name">{player.name}</div>
        <div className="detail-meta">
          <span>
            Hạng trước:{" "}
            {lastRank ? (
              <span className={`tone-text tone-${lastRank}`}>{RANK_LABELS[lastRank]}</span>
            ) : (
              "—"
            )}
          </span>
        </div>
      </div>

      <strong className={`detail-score ${pointClass(score)}`}>{score}</strong>
    </div>
  );
}
