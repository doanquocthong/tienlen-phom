const STORAGE_KEY = "tienlen-session";

export const RANK_LABELS = {
  1: "Nhất",
  2: "Nhì",
  3: "Ba",
  4: "Chót",
};

export const DEFAULT_RULES = { 1: "2", 2: "1", 3: "-1", 4: "-2" };

export const HEO_SUITS = [
  { id: "co", label: "Heo cơ", short: "Cơ", symbol: "♥" },
  { id: "ro", label: "Heo rô", short: "Rô", symbol: "♦" },
  { id: "chuon", label: "Heo chuồn", short: "Chuồn", symbol: "♣" },
  { id: "bich", label: "Heo bích", short: "Bích", symbol: "♠" },
];

export const DEFAULT_HEO = { co: "4", ro: "3", chuon: "2", bich: "1" };

export function emptyHeos() {
  return { co: 0, ro: 0, chuon: 0, bich: 0 };
}

export function parseRule(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && /^-?\d+$/.test(value.trim())) {
    return Number(value.trim());
  }
  return null;
}

export function formatPoint(value) {
  const n = parseRule(value);
  if (n === null) return "…";
  return n > 0 ? `+${n}` : String(n);
}

export function pointClass(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n === 0) return "point-zero";
  return n < 0 ? "point-negative" : "point-positive";
}

export function standingRows(players) {
  const sorted = [...players].sort((a, b) => {
    if (b.currentScore !== a.currentScore) return b.currentScore - a.currentScore;
    return a.id - b.id;
  });
  const allTied = sorted.every((player) => player.currentScore === sorted[0].currentScore);
  let place = 0;
  let lastScore = null;

  return sorted.map((player) => {
    if (!allTied && player.currentScore !== lastScore) {
      place += 1;
      lastScore = player.currentScore;
    }
    return { player, place: allTied ? 0 : place };
  });
}

export function leadersOf(players) {
  const topScore = Math.max(...players.map((player) => player.currentScore));
  return players.filter((player) => player.currentScore === topScore);
}

function emptyPlayers() {
  return [1, 2, 3, 4].map((id) => ({
    id,
    name: "",
    avatar: "",
    lastRank: 0,
    currentScore: 0,
  }));
}

export function createEmptySession() {
  return {
    phase: "players",
    players: emptyPlayers(),
    rules: { ...DEFAULT_RULES },
    heo: { ...DEFAULT_HEO },
    goal: "",
    history: [],
  };
}

function cleanHistory(raw) {
  if (!Array.isArray(raw)) return [];

  return raw.flatMap((round) => {
    if (!Array.isArray(round?.lines)) return [];
    const lines = round.lines.flatMap((line) => {
      const playerId = parseRule(line?.playerId);
      const rank = parseRule(line?.rank);
      if (!playerId || !rank) return [];
      const heos = emptyHeos();
      for (const suit of HEO_SUITS) {
        heos[suit.id] = parseRule(line?.heos?.[suit.id]) ?? 0;
      }
      return [{
        playerId,
        name: String(line?.name ?? "").slice(0, 40),
        rank,
        heos,
        heoDo: parseRule(line?.heoDo) ?? 0,
        heoDen: parseRule(line?.heoDen) ?? 0,
        delta: parseRule(line?.delta) ?? 0,
        scoreBefore: parseRule(line?.scoreBefore) ?? 0,
        lastRankBefore: parseRule(line?.lastRankBefore) ?? 0,
      }];
    });
    if (lines.length !== 4) return [];
    return [{ lines }];
  });
}

function cleanAvatar(value) {
  return typeof value === "string" && value.startsWith("data:image/") ? value : "";
}

function cleanPointMap(raw, defaults, keys) {
  const points = { ...defaults };
  if (!raw || typeof raw !== "object") return points;

  for (const key of keys) {
    const value = raw[key] ?? raw[String(key)];
    if (typeof value === "string" && (value === "" || value === "-" || parseRule(value) !== null)) {
      points[key] = value;
    } else if (parseRule(value) !== null) {
      points[key] = String(parseRule(value));
    }
  }

  return points;
}

function cleanRules(raw) {
  return cleanPointMap(raw, DEFAULT_RULES, [1, 2, 3, 4]);
}

function cleanHeo(raw) {
  return cleanPointMap(raw, DEFAULT_HEO, HEO_SUITS.map((suit) => suit.id));
}

function cleanGoal(value) {
  if (typeof value === "number" && Number.isInteger(value) && value > 0 && value <= 9999) return value;
  if (typeof value === "string" && /^\d{1,4}$/.test(value.trim())) {
    const n = Number(value.trim());
    return n > 0 ? value.trim() : "";
  }
  return "";
}

export function loadTienLenSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const data = JSON.parse(raw);
    if (!Array.isArray(data?.players) || data.players.length !== 4) return null;

    const players = data.players.map((entry, index) => ({
      id: index + 1,
      name: String(entry?.name ?? "").slice(0, 40),
      avatar: cleanAvatar(entry?.avatar),
      lastRank: parseRule(entry?.lastRank) ?? 0,
      currentScore: parseRule(entry?.currentScore) ?? 0,
    }));

    const phase = data.phase === "rules" || data.phase === "playing" ? data.phase : "players";
    const named = players.every((player) => player.name.trim());
    const rules = cleanRules(data.rules);
    const heo = cleanHeo(data.heo);
    const rulesReady = [1, 2, 3, 4].every((rank) => parseRule(rules[rank]) !== null)
      && HEO_SUITS.every((suit) => parseRule(heo[suit.id]) !== null);
    const playing = phase === "playing" && named && rulesReady;
    const goal = cleanGoal(data.goal);

    return {
      phase: playing ? "playing" : phase === "players" || !named ? "players" : "rules",
      players,
      rules,
      heo,
      goal: playing ? (goal === "" ? null : Number(goal)) : goal,
      history: cleanHistory(data.history),
    };
  } catch {
    return null;
  }
}

export function saveTienLenSession(session) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearTienLenSession() {
  localStorage.removeItem(STORAGE_KEY);
}
