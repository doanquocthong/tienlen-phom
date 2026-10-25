import { useEffect, useLayoutEffect, useRef, useState } from "react";
import PlayerCardDetail from "../components/PlayerCardDetail";
import PlayerSetup from "../components/PlayerSetup";
import ScoreRuleSetup from "../components/ScoreRuleSetup";
import RoundEntryCard, {
  EntryHint,
  RoundCutList,
  emptyEntry,
  entryView,
  resultsFromEntry,
  tapPlayer,
  tapSuit,
} from "../components/RoundEntry";
import tableImg from "../assets/images/table.jpg";
import Player from "../models/Player";
import Congratulation from "../components/Congratulation";
import RoundHistoryModal from "../components/RoundHistoryModal";
import { HeoPointSummary, RankSummary } from "../components/PointSummary";
import { fileToAvatar } from "../utils/photo";
import { playCelebration } from "../utils/celebration";
import {
  clearTienLenSession,
  createEmptySession,
  leadersOf,
  loadTienLenSession,
  HEO_SUITS,
  parseRule,
  saveTienLenSession,
  standingRows,
} from "../storage/tienlenSession";

function applyRound(current, results) {
  const rankPoints = {};
  for (const rank of [1, 2, 3, 4]) rankPoints[rank] = Number(current.rules[rank]);
  const heoPoints = {};
  for (const suit of HEO_SUITS) heoPoints[suit.id] = Number(current.heo?.[suit.id]);

  const lines = [];
  const players = current.players.map((player) => {
    const round = results[player.id];
    if (!round) return player;

    const scored = new Player(
      player.id,
      player.name,
      player.avatar,
      player.lastRank,
      player.currentScore
    );
    const delta = scored.applyRoundScore({
      rankPoints,
      rank: round.rank,
      heos: round.heos,
      heoPoints,
    });

    lines.push({
      playerId: player.id,
      name: player.name,
      rank: round.rank,
      heos: { ...round.heos },
      delta,
      scoreBefore: player.currentScore,
      lastRankBefore: player.lastRank,
    });

    return {
      id: scored.id,
      name: scored.name,
      avatar: scored.avatar,
      lastRank: scored.lastRank,
      currentScore: scored.currentScore,
    };
  });

  return {
    ...current,
    players,
    history: [...(current.history || []), { lines }],
  };
}

function TienLenScreen({ goHome }) {
  const [session, setSession] = useState(() => loadTienLenSession() ?? createEmptySession());
  const [entry, setEntry] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [winners, setWinners] = useState(null);
  const [ruleError, setRuleError] = useState("");
  const [photoError, setPhotoError] = useState("");
  const rowRefs = useRef(new Map());
  const prevTops = useRef(new Map());

  useEffect(() => {
    saveTienLenSession(session);
  }, [session]);

  const updatePlayer = (id, patch) => {
    setSession((current) => ({
      ...current,
      players: current.players.map((player) =>
        player.id === id ? { ...player, ...patch } : player
      ),
    }));
  };

  const onPhoto = async (id, file) => {
    try {
      const avatar = await fileToAvatar(file);
      setPhotoError("");
      updatePlayer(id, { avatar });
    } catch {
      setPhotoError("Không đọc được ảnh. Hãy chụp lại.");
    }
  };

  const goRules = () => {
    setSession((current) => {
      const players = current.players.map((player) => ({
        ...player,
        name: player.name.trim(),
      }));
      if (players.some((player) => !player.name)) return current;
      return { ...current, players, phase: "rules" };
    });
  };

  const startGame = () => {
    const nextRules = {};
    for (const rank of [1, 2, 3, 4]) {
      const score = parseRule(session.rules[rank]);
      if (score === null) {
        setRuleError("Mỗi hạng cần một số. Chót không cộng thì nhập 0.");
        return;
      }
      nextRules[rank] = String(score);
    }

    const nextHeo = {};
    for (const suit of HEO_SUITS) {
      const score = parseRule(session.heo?.[suit.id]);
      if (score === null) {
        setRuleError("Mỗi con heo cần một số. Không tính thì nhập 0.");
        return;
      }
      nextHeo[suit.id] = String(score);
    }

    const rawGoal = String(session.goal ?? "").trim();
    let goal = null;
    if (rawGoal !== "") {
      const score = parseRule(rawGoal);
      if (score === null || score <= 0) {
        setRuleError("Mốc tổng kết là số lớn hơn 0, hoặc để trống.");
        return;
      }
      goal = score;
    }

    setRuleError("");
    setSession((current) => ({ ...current, rules: nextRules, heo: nextHeo, goal, phase: "playing" }));
  };

  const handleRoundResult = ({ results }) => {
    const before = Math.max(...session.players.map((player) => player.currentScore));
    const next = applyRound(session, results);
    const after = Math.max(...next.players.map((player) => player.currentScore));
    setSession(next);
    setEntry(null);
    if (session.goal && before < session.goal && after >= session.goal) {
      playCelebration();
      setWinners(leadersOf(next.players));
    }
  };

  const undoLastRound = () => {
    setSession((current) => {
      const history = current.history || [];
      const last = history[history.length - 1];
      if (!last) return current;

      const players = current.players.map((player) => {
        const line = last.lines.find((item) => item.playerId === player.id);
        if (!line) return player;
        return {
          ...player,
          currentScore: line.scoreBefore,
          lastRank: line.lastRankBefore,
        };
      });

      return { ...current, players, history: history.slice(0, -1) };
    });
    setWinners(null);
  };

  const resetSession = () => {
    if (!window.confirm("Xóa điểm và người chơi của ván này?")) return;
    clearTienLenSession();
    setSession(createEmptySession());
    setEntry(null);
    setShowHistory(false);
    setWinners(null);
    setRuleError("");
    setPhotoError("");
  };

  const showSummaryWinner = () => {
    const leaders = leadersOf(session.players);
    if (!leaders.length) return;
    playCelebration();
    setWinners(leaders);
  };

  const rows = standingRows(session.players);
  const orderKey = rows.map((row) => row.player.id).join(",");
  const topScore = Math.max(...session.players.map((player) => player.currentScore));

  useLayoutEffect(() => {
    if (session.phase !== "playing") return undefined;
    const next = new Map();
    rows.forEach(({ player }) => {
      const node = rowRefs.current.get(player.id);
      if (!node) return;
      const top = node.getBoundingClientRect().top;
      const previous = prevTops.current.get(player.id);
      if (previous != null && Math.abs(previous - top) > 1) {
        node.animate(
          [{ transform: `translateY(${previous - top}px)` }, { transform: "translateY(0)" }],
          { duration: 460, easing: "cubic-bezier(.2,.8,.2,1)" }
        );
      }
      next.set(player.id, top);
    });
    prevTops.current = next;
  }, [orderKey, session.phase, rows]);

  return (
    <div className="app-phone" style={{ backgroundImage: `url(${tableImg})` }}>
      <button className="back-btn" onClick={goHome}>◀ Trở về</button>
      <button className="reset-btn" onClick={resetSession}>Xóa điểm</button>

      {session.phase === "players" && (
        <PlayerSetup
          players={session.players}
          onRename={(id, name) => updatePlayer(id, { name })}
          onPhoto={onPhoto}
          onClearPhoto={(id) => updatePlayer(id, { avatar: "" })}
          photoError={photoError}
          onNext={goRules}
        />
      )}

      {session.phase === "rules" && (
        <ScoreRuleSetup
          rules={session.rules}
          heo={session.heo}
          goal={session.goal}
          error={ruleError}
          onChange={(rank, value) => {
            setRuleError("");
            setSession((current) => ({
              ...current,
              rules: { ...current.rules, [rank]: value },
            }));
          }}
          onHeoChange={(suit, value) => {
            setRuleError("");
            setSession((current) => ({
              ...current,
              heo: { ...current.heo, [suit]: value },
            }));
          }}
          onGoalChange={(goal) => {
            setRuleError("");
            setSession((current) => ({ ...current, goal }));
          }}
          onPreset={(rules) => {
            setRuleError("");
            setSession((current) => ({ ...current, rules }));
          }}
          onBack={() => setSession((current) => ({ ...current, phase: "players" }))}
          onStart={startGame}
        />
      )}

      {session.phase === "playing" && (
        <>
          <div className="play-board">
            <p className="rule-strip"><RankSummary rules={session.rules} /></p>
            <p className="rule-strip"><HeoPointSummary heo={session.heo} /></p>
            {session.goal ? (
              <div className="goal-meter">
                <span>Mục tiêu {session.goal}</span>
                <div className="goal-track">
                  <div style={{ width: `${Math.min(100, Math.max(0, topScore) / session.goal * 100)}%` }} />
                </div>
              </div>
            ) : null}
            {entry && <EntryHint entry={entry} players={session.players} />}
            {entry && (
              <RoundCutList
                cuts={entry.cuts}
                players={session.players}
                onRemove={(id) => {
                  setEntry((current) => current && ({
                    ...current,
                    cuts: current.cuts.filter((cut) => cut.id !== id),
                  }));
                }}
              />
            )}
            {rows.map(({ player, place }) => (
              <div
                key={player.id}
                className="player-slot"
                ref={(node) => {
                  if (node) rowRefs.current.set(player.id, node);
                  else rowRefs.current.delete(player.id);
                }}
              >
                {entry ? (
                  <RoundEntryCard
                    player={player}
                    {...entryView(player, entry, session.rules, session.heo)}
                    onTapPlayer={(id) => setEntry((current) => current && tapPlayer(current, id))}
                    onTapSuit={(id, suitId) => setEntry((current) => current && tapSuit(current, id, suitId))}
                  />
                ) : (
                  <PlayerCardDetail player={player} place={place} />
                )}
              </div>
            ))}
          </div>

          <div className="action-bar">
            {entry ? (
              <>
                <div className="action-secondary">
                  <button type="button" onClick={() => setEntry(null)}>
                    Hủy
                  </button>
                  <button
                    type="button"
                    disabled={!entry.order.length && !entry.cuts.length && !entry.pending}
                    onClick={() => setEntry(emptyEntry())}
                  >
                    Làm lại
                  </button>
                </div>
                <div className="action-primary">
                  <button
                    type="button"
                    className="summary-btn"
                    disabled={!resultsFromEntry(session.players, entry)}
                    onClick={() => {
                      const results = resultsFromEntry(session.players, entry);
                      if (results) handleRoundResult({ results });
                    }}
                  >
                    Chốt ván
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="action-secondary">
                  <button
                    type="button"
                    disabled={!session.history?.length}
                    onClick={undoLastRound}
                  >
                    Hoàn tác
                  </button>
                  <button type="button" onClick={() => setShowHistory(true)}>
                    Nhật ký{session.history?.length ? ` (${session.history.length})` : ""}
                  </button>
                </div>
                <div className="action-primary">
                  <button type="button" onClick={() => setEntry(emptyEntry())}>
                    Nhập ván
                  </button>
                  <button type="button" className="summary-btn" onClick={showSummaryWinner}>
                    Tổng kết
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {showHistory && (
        <RoundHistoryModal
          history={session.history || []}
          onClose={() => setShowHistory(false)}
        />
      )}

      {winners && (
        <Congratulation
          players={winners}
          goal={session.goal}
          onClose={() => setWinners(null)}
        />
      )}
    </div>
  );
}

export default TienLenScreen;
