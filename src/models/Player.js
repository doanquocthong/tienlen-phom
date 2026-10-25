export default class Player {
  constructor(id, name, avatar, lastRank = 0, currentScore = 0) {
    this.id = id;
    this.name = name;
    this.avatar = avatar;
    this.lastRank = lastRank;
    this.currentScore = currentScore;
  }

  applyRoundScore({ rankPoints, rank, heos, heoPoints }) {
    const score = scoreRound({ rankPoints, rank, heos, heoPoints });
    this.currentScore += score;
    this.lastRank = rank;
    return score;
  }
}

export function scoreRound({ rankPoints, rank, heos, heoPoints }) {
  const scoreRank = rank ? Number(rankPoints?.[rank]) : 0;
  let score = Number.isFinite(scoreRank) ? scoreRank : 0;

  for (const suit of ["co", "ro", "chuon", "bich"]) {
    const count = Number(heos?.[suit]) || 0;
    const value = Number(heoPoints?.[suit]);
    score += count * (Number.isFinite(value) ? value : 0);
  }

  return score;
}
