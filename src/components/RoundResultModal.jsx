import React, { useState } from "react";
import "../App.css";
import Avatar from "./Avatar";
import { HEO_SUITS, emptyHeos, formatPoint, pointClass } from "../storage/tienlenSession";
import { HeoPointSummary, RankSummary } from "./PointSummary";

export default function RoundResultModal({ players, rules, heo, onClose, onSubmit }) {
  const [error, setError] = useState("");
  const [results, setResults] = useState(
    players.reduce((acc, p) => {
      acc[p.id] = {
        rank: null,
        heos: emptyHeos(),
      };
      return acc;
    }, {})
  );

  function NumberStepper({ value, min = 0, max = 10, onChange }) {
    const decrease = () => {
      if (value > min) onChange(value - 1);
    };

    const increase = () => {
      if (value < max) onChange(value + 1);
    };

    return (
      <div className="number-stepper">
        <button type="button" onClick={decrease}>
          –
        </button>
        <span className={pointClass(value)}>{value}</span>
        <button type="button" onClick={increase}>
          +
        </button>
      </div>
    );
  }

  const takenRanks = Object.values(results)
    .map((r) => r.rank)
    .filter((r) => r !== null);

  const updateField = (id, field, value) => {
    // ép kiểu number cho chắc chắn
    const numericValue = typeof value === "number" ? value : Number(value);
    setError("");
    setResults((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: numericValue,
      },
    }));
  };

  const chooseRank = (playerId, rank) => {
    setError("");
    const currentRank = results[playerId].rank;
    if (currentRank === rank) {
      updateField(playerId, "rank", null);
      return;
    }
    if (takenRanks.includes(rank)) return;
    updateField(playerId, "rank", rank);
  };


  const updateHeo = (id, suit, value) => {
    setError("");
    setResults((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        heos: { ...prev[id].heos, [suit]: value },
      },
    }));
  };

const submit = () => {
  const unbalanced = HEO_SUITS.filter((suit) => {
    const total = Object.values(results).reduce(
      (sum, row) => sum + (Number(row.heos?.[suit.id]) || 0),
      0
    );
    return total !== 0;
  });

  if (unbalanced.length) {
    setError(`${unbalanced.map((suit) => suit.label).join(", ")} của bốn người phải cộng lại bằng 0.`);
    return;
  }

  const allRanked = Object.values(results).every(r => r.rank !== null);

  if (!allRanked) {
    setError("Chọn đủ hạng nhất, nhì, ba và chót.");
    return;
  }




  // Nếu đúng thì gửi dữ liệu
  onSubmit({ results });
  onClose();
};

  return (
    <div className="modal-overlay">
      <div className="modal-box result-modal">
        <h2 className="modal-title">Kết quả ván đấu</h2>
        <p className="rule-summary"><RankSummary rules={rules} /></p>
        <p className="rule-summary"><HeoPointSummary heo={heo} /></p>

        <div className="result-grid">
          {players.map((p) => (
            <article key={p.id} className="result-card">
              <div className="result-head">
                <Avatar name={p.name} src={p.avatar} size={36} />
                <span>{p.name}</span>
              </div>

              <div className="result-ranks">
                {[1, 2, 3, 4].map((r) => {
                  const isMine = results[p.id].rank === r;
                  const isTaken = takenRanks.includes(r) && !isMine;
                  return (
                    <button
                      key={r}
                      type="button"
                      className={`rank-item tone-${r} ${isMine ? "rank-selected" : ""} ${isTaken ? "rank-disabled" : ""}`}
                      onClick={() => {
                        if (!isTaken || isMine) chooseRank(p.id, r);
                      }}
                    >
                      {r}
                    </button>
                  );
                })}
              </div>

              <div className="result-heos">
                {HEO_SUITS.map((suit) => (
                  <div key={suit.id} className={`heo-field suit-${suit.id}`}>
                    <span>
                      {suit.symbol} {suit.short}{" "}
                      <span className={pointClass(heo?.[suit.id])}>{formatPoint(heo?.[suit.id])}</span>
                    </span>
                    <NumberStepper
                      value={results[p.id].heos[suit.id]}
                      min={-10}
                      max={10}
                      onChange={(val) => updateHeo(p.id, suit.id, val)}
                    />
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>

        {error && <p className="setup-error">{error}</p>}
        <div className="btn-row">
          <button onClick={onClose} className="cancel-btn">
            Hủy
          </button>
          <button onClick={submit} className="confirm-btn">
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
}
