import { HEO_SUITS, RANK_LABELS, formatPoint, parseRule, pointClass } from "../storage/tienlenSession";

const PRESETS = [
  { id: "classic", label: "2, 1, −1, −2", rules: { 1: "2", 2: "1", 3: "-1", 4: "-2" } },
  { id: "positive", label: "3, 2, 1, 0", rules: { 1: "3", 2: "2", 3: "1", 4: "0" } },
];

function sanitizeRuleInput(raw) {
  const cleaned = raw.replace(/[^\d-]/g, "");
  if (cleaned.startsWith("-")) return `-${cleaned.slice(1).replace(/-/g, "")}`;
  return cleaned.replace(/-/g, "");
}

function sanitizeGoal(raw) {
  return raw.replace(/\D/g, "").slice(0, 4);
}

export default function ScoreRuleSetup({ rules, heo, goal, error, onChange, onHeoChange, onGoalChange, onPreset, onBack, onStart }) {
  const ranksReady = [1, 2, 3, 4].every((rank) => parseRule(rules[rank]) !== null);
  const heosReady = HEO_SUITS.every((suit) => parseRule(heo?.[suit.id]) !== null);
  return (
    <div className="setup-scroll">
      <h1 className="setup-title">Cách tính điểm</h1>
      <p className="setup-hint">Nhập điểm hạng và điểm từng chất heo. Không cộng thì ghi 0. Hai chất có thể cùng một số.</p>

      <div className="preset-row">
        {PRESETS.map((preset) => {
          const active = [1, 2, 3, 4].every(
            (rank) => String(rules[rank]) === preset.rules[rank]
          );
          return (
            <button
              key={preset.id}
              type="button"
              className={`preset-btn ${active ? "active" : ""}`}
              onClick={() => onPreset(preset.rules)}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      <div className="rule-list">
        {[1, 2, 3, 4].map((rank) => (
          <div key={rank} className="rule-row">
            <label htmlFor={`rule-${rank}`} className={`tone-text tone-${rank}`}>{RANK_LABELS[rank]}</label>
            <input
              id={`rule-${rank}`}
              className="rule-input"
              inputMode="text"
              value={rules[rank] ?? ""}
              placeholder="0"
              enterKeyHint="done"
              onChange={(event) => onChange(rank, sanitizeRuleInput(event.target.value))}
            />
            <span className={`rule-preview ${pointClass(rules[rank])}`}>{formatPoint(rules[rank])}</span>
          </div>
        ))}
      </div>

      <h2 className="setup-subtitle">Điểm heo</h2>
      <div className="rule-list">
        {HEO_SUITS.map((suit) => (
          <div key={suit.id} className="rule-row">
            <label htmlFor={`heo-${suit.id}`} className={`suit-name suit-${suit.id}`}>
              {suit.symbol} {suit.label}
            </label>
            <input
              id={`heo-${suit.id}`}
              className="rule-input"
              inputMode="text"
              value={heo?.[suit.id] ?? ""}
              placeholder="0"
              enterKeyHint="done"
              onChange={(event) => onHeoChange(suit.id, sanitizeRuleInput(event.target.value))}
            />
            <span className={`rule-preview ${pointClass(heo?.[suit.id])}`}>{formatPoint(heo?.[suit.id])}</span>
          </div>
        ))}
      </div>

      <h2 className="setup-subtitle">Mốc tổng kết</h2>
      <div className="rule-list">
        <div className="rule-row">
          <label htmlFor="goal-score">Đạt</label>
          <input
            id="goal-score"
            className="rule-input"
            inputMode="numeric"
            value={goal ?? ""}
            placeholder="Trống"
            enterKeyHint="done"
            onChange={(event) => onGoalChange(sanitizeGoal(event.target.value))}
          />
          <span className="rule-preview point-zero">{goal ? goal : "∞"}</span>
        </div>
      </div>
      <p className="setup-hint">Khi người dẫn đầu chạm mốc này, màn thắng tự mở. Để trống nếu chỉ tổng kết bằng tay.</p>

      {error && <p className="setup-error">{error}</p>}
      {(!ranksReady || !heosReady) && !error && (
        <p className="setup-hint">Mỗi ô cần một số nguyên.</p>
      )}

      <div className="setup-actions">
        <button type="button" className="secondary-btn" onClick={onBack}>
          Quay lại
        </button>
        <button type="button" className="primary-btn" onClick={onStart}>
          Bắt đầu
        </button>
      </div>
    </div>
  );
}
