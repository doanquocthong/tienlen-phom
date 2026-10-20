import Avatar from "./Avatar";

export default function PlayerSetup({ players, onRename, onPhoto, onClearPhoto, onNext, photoError }) {
  const missingName = players.some((player) => !player.name.trim());

  return (
    <div className="setup-scroll">
      <h1 className="setup-title">Bốn người chơi</h1>
      <p className="setup-hint">Nhập tên. Bấm ảnh để mở máy ảnh, không bắt buộc.</p>

      <div className="setup-grid">
        {players.map((player, index) => (
          <div key={player.id} className="setup-card">
            <label className="avatar-picker">
              <Avatar name={player.name} src={player.avatar} size={72} placeholder="📷" />
              <span>Chụp ảnh</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (file) onPhoto(player.id, file);
                }}
              />
            </label>

            <div className="setup-fields">
              <label className="field-label" htmlFor={`name-${player.id}`}>
                Người {index + 1}
              </label>
              <input
                id={`name-${player.id}`}
                className="name-input"
                value={player.name}
                maxLength={40}
                placeholder="Tên"
                autoComplete="off"
                autoCorrect="off"
                enterKeyHint={index === players.length - 1 ? "done" : "next"}
                onChange={(event) => onRename(player.id, event.target.value)}
              />
              {player.avatar && (
                <button type="button" className="text-btn" onClick={() => onClearPhoto(player.id)}>
                  Bỏ ảnh
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {photoError && <p className="setup-error">{photoError}</p>}
      <button type="button" className="primary-btn" disabled={missingName} onClick={onNext}>
        Tiếp tục
      </button>
    </div>
  );
}
