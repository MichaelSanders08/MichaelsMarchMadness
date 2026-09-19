import {REGIONS, SEED_ORDER} from './field.js';
export const ROUND_NAMES = ['Round of 64', 'Round of 32', 'Sweet 16', 'Elite Eight', 'Final Four', 'Championship'];
export function validateField(value) {
  if (!Array.isArray(value) || value.length !== 64) throw new Error('The field needs exactly 64 teams.');
  const ids = new Set(), slots = new Set();
  return value.map(team => {
    if (!team || typeof team.id !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(team.id) || ids.has(team.id)) throw new Error('Every team needs a unique id using letters, numbers, - or _.');
    if (typeof team.name !== 'string' || !team.name.trim() || team.name.length > 80) throw new Error('Team names must contain 1–80 characters.');
    if (!REGIONS.includes(team.region) || !Number.isInteger(team.seed) || team.seed < 1 || team.seed > 16) throw new Error('Each team needs a region (South, West, East, Midwest) and seed 1–16.');
    const slot = `${team.region}-${team.seed}`;
    if (slots.has(slot)) throw new Error('Each region needs one team at each seed.');
    ids.add(team.id); slots.add(slot);
    return {id:team.id, name:team.name.trim(), region:team.region, seed:team.seed};
  });
}
export function games(field, picks={}) {
  const ordered = REGIONS.flatMap(region => SEED_ORDER.map(seed => field.find(t => t.region === region && t.seed === seed)));
  const rounds = [];
  for (let r=0; r<6; r++) {
    rounds[r] = Array.from({length:32 / 2**r}, (_, i) => {
      const teams = r === 0 ? ordered.slice(i*2, i*2+2) : [rounds[r-1][i*2].winner, rounds[r-1][i*2+1].winner];
      const id = `r${r}-${i}`;
      const winner = teams.every(Boolean) ? teams.find(t => t.id === picks[id]) || null : null;
      return {id, round:r, index:i, teams, winner};
    });
  }
  return rounds;
}
export function normalizePicks(field, picks) {
  if (!picks || typeof picks !== 'object' || Array.isArray(picks)) return {};
  return Object.fromEntries(games(field, picks).flat().filter(g => g.winner).map(g => [g.id, g.winner.id]));
}
export function choose(field, picks, gameId, teamId) {
  const game = games(field, picks).flat().find(g => g.id === gameId);
  if (!game || !game.teams.every(Boolean) || !game.teams.some(t => t.id === teamId)) throw new Error('Choose a team that is playing in this game.');
  return normalizePicks(field, {...picks, [gameId]:picks[gameId] === teamId ? null : teamId});
}
export function random(seed) {
  let state = 2166136261;
  for (const c of String(seed)) state = Math.imul(state ^ c.charCodeAt(0), 16777619);
  return () => {
    state += 0x6D2B79F5;
    let t = Math.imul(state ^ state >>> 15, 1 | state);
    t ^= t + Math.imul(t ^ t >>> 7, 61 | t);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
export function probability(a, b, chaos) {
  if (a.seed === b.seed) return 0.5;
  const chalk = a.seed < b.seed ? 1 : 0;
  const weighted = 1 / (1 + Math.exp((a.seed - b.seed)/4));
  return chaos <= 50 ? chalk + (weighted-chalk)*chaos/50 : weighted + (0.5-weighted)*(chaos-50)/50;
}
export function fill(field, picks={}, seed='michael-8', chaos=50) {
  if (!Number.isFinite(chaos) || chaos < 0 || chaos > 100) throw new Error('Chaos must be between 0 and 100.');
  const result = normalizePicks(field, picks), rng = random(seed);
  for (let r=0; r<6; r++) {
    for (const game of games(field, result)[r]) {
      const draw = rng(); // Consume one draw per slot even if it was manually picked.
      if (!result[game.id]) result[game.id] = game.teams[draw < probability(...game.teams, chaos) ? 0 : 1].id;
    }
  }
  return result;
}
export function statistics(field, picks) {
  const all = games(field, picks).flat();
  return {picked:all.filter(g => g.winner).length, upsets:all.filter(g => g.winner && g.winner.seed > Math.min(...g.teams.map(t=>t.seed))).length, champion:all.at(-1).winner};
}
export function restore(raw) {
  if (!raw || raw.version !== 1) throw new Error('Use a version 1 bracket export.');
  const field = validateField(raw.field);
  if (!Number.isFinite(raw.chaos) || raw.chaos < 0 || raw.chaos > 100 || typeof raw.seed !== 'string' || raw.seed.length > 100) throw new Error('Invalid seed or chaos setting.');
  return {version:1, field, label:typeof raw.label === 'string' ? raw.label.slice(0,100) : 'Custom field', picks:normalizePicks(field, raw.picks), seed:raw.seed, chaos:raw.chaos,...(raw.results!==undefined?{results:normalizePicks(field,raw.results)}:{})};
}
export function scoreBracket(field,picks,results={}) {
  const predicted=games(field,picks),actual=games(field,results);
  const eliminated=new Set(actual.flat().filter(g=>g.winner).flatMap(g=>g.teams.filter(t=>t.id!==g.winner.id).map(t=>t.id)));
  const rounds=predicted.map((round,r)=>{
    const entries=round.map((g,i)=>{
      const result=actual[r][i],points=2**r;
      const status=!g.winner?'unpicked':result.winner?(result.winner.id===g.winner.id?'correct':'missed'):eliminated.has(g.winner.id)?'eliminated':'alive';
      return {id:g.id,status,points,earned:status==='correct'?points:0,remaining:status==='alive'?points:0};
    });
    return {name:ROUND_NAMES[r],entries,earned:entries.reduce((n,e)=>n+e.earned,0),remaining:entries.reduce((n,e)=>n+e.remaining,0),correct:entries.filter(e=>e.status==='correct').length,recorded:actual[r].filter(g=>g.winner).length};
  });
  const earned=rounds.reduce((n,r)=>n+r.earned,0),remaining=rounds.reduce((n,r)=>n+r.remaining,0);
  return {rounds,earned,remaining,maximum:earned+remaining,recorded:actual.flat().filter(g=>g.winner).length};
}
