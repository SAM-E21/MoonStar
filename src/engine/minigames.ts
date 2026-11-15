import type { BuildingId, MiniGameDifficulty, MiniGameKind } from '../types/game';

export const BUILDING_TO_MINIGAME: Record<BuildingId, MiniGameKind> = {
  habitat: 'habitat_systems',
  solar: 'solar_align',
  greenhouse: 'greenhouse_balance',
  water: 'water_pipes',
  oxygen: 'oxygen_mix',
  comms: 'comms_tune',
  shelter: 'shelter_prep',
  rover: 'rover_ice',
  research: 'research_lab',
};

export const MINIGAME_TO_BUILDING: Record<MiniGameKind, BuildingId> = {
  habitat_systems: 'habitat',
  solar_align: 'solar',
  greenhouse_balance: 'greenhouse',
  water_pipes: 'water',
  oxygen_mix: 'oxygen',
  comms_tune: 'comms',
  shelter_prep: 'shelter',
  rover_ice: 'rover',
  research_lab: 'research',
};

export function createPrng(seed: number): () => number {
  let a = (seed >>> 0) || 1;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function getMiniGameTimeLimit(kind: MiniGameKind, difficulty: MiniGameDifficulty): number {
  const base: Record<MiniGameKind, number> = {
    habitat_systems: 32,
    solar_align: 30,
    greenhouse_balance: 28,
    water_pipes: 42,
    oxygen_mix: 26,
    comms_tune: 30,
    shelter_prep: 30,
    rover_ice: 35,
    research_lab: 45,
  };
  const offset = difficulty === 'easy' ? 8 : difficulty === 'hard' ? -6 : 0;
  return Math.max(18, base[kind] + offset);
}

// ============================================================
// 1. PROCEDURAL ROVER MAP GENERATOR + BFS SOLVABILITY CHECK
// ============================================================
export interface RoverMapConfig {
  cols: number;
  rows: number;
  start: { x: number; y: number };
  rocks: string[];
  hazards: string[]; // Dust traps / crater slopes (passable but cost bonus time or warning)
  crystals: string[];
  timeLimit: number;
}

const cellKey = (x: number, y: number) => `${x},${y}`;

export function getReachableCells(
  cols: number,
  rows: number,
  start: { x: number; y: number },
  blockedSet: Set<string>,
): Set<string> {
  const visited = new Set<string>();
  const startK = cellKey(start.x, start.y);
  if (blockedSet.has(startK)) return visited;

  const queue: Array<{ x: number; y: number }> = [start];
  visited.add(startK);

  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];

  while (queue.length > 0) {
    const cur = queue.shift()!;
    for (const [dx, dy] of dirs) {
      const nx = cur.x + dx;
      const ny = cur.y + dy;
      if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) continue;
      const k = cellKey(nx, ny);
      if (blockedSet.has(k) || visited.has(k)) continue;
      visited.add(k);
      queue.push({ x: nx, y: ny });
    }
  }
  return visited;
}

export function areAllCrystalsReachable(map: RoverMapConfig): boolean {
  const blocked = new Set(map.rocks);
  const reachable = getReachableCells(map.cols, map.rows, map.start, blocked);
  if (map.crystals.length === 0) return false;
  return map.crystals.every((c) => !blocked.has(c) && !map.hazards.includes(c) && reachable.has(c));
}

export function generateRoverMap(difficulty: MiniGameDifficulty, seed = Date.now()): RoverMapConfig {
  const rng = createPrng(seed);
  const cols = difficulty === 'easy' ? 5 : difficulty === 'normal' ? 6 : 7;
  const rows = difficulty === 'easy' ? 4 : 5;
  const crystalCount = difficulty === 'easy' ? 3 : difficulty === 'normal' ? 4 : 5;
  const rockCount = difficulty === 'easy' ? 4 : difficulty === 'normal' ? 7 : 9;
  const hazardCount = difficulty === 'easy' ? 0 : difficulty === 'normal' ? 2 : 4;
  const timeLimit = getMiniGameTimeLimit('rover_ice', difficulty);
  const start = { x: 0, y: 0 };

  const allKeys: string[] = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (x === 0 && y === 0) continue;
      allKeys.push(cellKey(x, y));
    }
  }

  for (let attempt = 0; attempt < 40; attempt++) {
    const pool = [...allKeys];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    const rocks = pool.slice(0, rockCount);
    const blocked = new Set(rocks);
    const reachable = getReachableCells(cols, rows, start, blocked);
    const openReachable = Array.from(reachable).filter((k) => k !== '0,0');

    // Also keep neighboring start tile open so player never feels boxed in
    const hasStartExit = reachable.has('1,0') || reachable.has('0,1');
    if (!hasStartExit || openReachable.length < crystalCount + hazardCount + 2) {
      continue;
    }

    // Spread crystals out by shuffling openReachable and prioritizing tiles at distance >= 2
    const farCells = openReachable.filter((k) => {
      const [cx, cy] = k.split(',').map(Number);
      return cx + cy >= 2;
    });
    const crystalPool = farCells.length >= crystalCount ? [...farCells] : [...openReachable];
    for (let i = crystalPool.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [crystalPool[i], crystalPool[j]] = [crystalPool[j], crystalPool[i]];
    }
    const crystals = crystalPool.slice(0, crystalCount);
    const crystalSet = new Set(crystals);

    const hazardCandidates = openReachable.filter((k) => !crystalSet.has(k) && k !== '1,0' && k !== '0,1');
    const hazards = hazardCandidates.slice(0, hazardCount);

    const candidate: RoverMapConfig = {
      cols,
      rows,
      start,
      rocks,
      hazards,
      crystals,
      timeLimit,
    };

    if (areAllCrystalsReachable(candidate)) {
      return candidate;
    }
  }

  // Guaranteed deterministic fallback layout
  const fallbackCrystals = Array.from({ length: crystalCount }, (_, idx) =>
    cellKey(Math.min(cols - 1, idx + 1), (idx * 2) % rows),
  );
  return {
    cols,
    rows,
    start,
    rocks: ['1,1', '3,2'].filter((k) => !fallbackCrystals.includes(k)),
    hazards: [],
    crystals: fallbackCrystals,
    timeLimit,
  };
}

// ============================================================
// 2. SOLAR PANEL ALIGNMENT & SHADOW MATH
// ============================================================
export interface SolarCaptureResult {
  efficiencyPct: number; // 0 - 100
  wattsPerSec: number; // 0 - 24 W/s
  angleDelta: number;
  inShadow: boolean;
}

export function computeSolarCapture(
  panelAngleDeg: number,
  sunAngleDeg: number,
  shadowZoneCenterDeg: number | null,
  shadowHalfWidthDeg: number,
  dustCleanlinessPct: number,
): SolarCaptureResult {
  const angleDelta = Math.abs(panelAngleDeg - sunAngleDeg);
  const cosAlign = Math.max(0, Math.cos((angleDelta * Math.PI) / 180));
  const sharpAlign = Math.pow(cosAlign, 1.45);

  const inShadow =
    shadowZoneCenterDeg !== null && Math.abs(panelAngleDeg - shadowZoneCenterDeg) <= shadowHalfWidthDeg;
  const shadowMult = inShadow ? 0.28 : 1.0;
  const dustMult = 0.45 + 0.55 * (Math.max(0, Math.min(100, dustCleanlinessPct)) / 100);

  const efficiencyPct = Math.round(sharpAlign * shadowMult * dustMult * 100);
  const wattsPerSec = Number(((efficiencyPct / 100) * 24).toFixed(1));

  return { efficiencyPct, wattsPerSec, angleDelta: Math.round(angleDelta), inShadow };
}

// ============================================================
// 3. WATER PIPES FILTRATION ROUTING PUZZLE + BFS FLOW SOLVER
// ============================================================
export type PipeShape = 'straight' | 'corner' | 'tee' | 'block';
export type PipeRotation = 0 | 90 | 180 | 270;

export interface PipeCell {
  x: number;
  y: number;
  shape: PipeShape;
  rotation: PipeRotation;
  role: 'normal' | 'intake' | 'filter' | 'tank';
  locked?: boolean;
}

export interface PipeNetworkState {
  cols: number;
  rows: number;
  cells: PipeCell[][]; // [y][x]
}

export interface PipeFlowResult {
  visitedKeys: string[];
  filterReached: boolean;
  tankReached: boolean;
}

// Bitmask directions: 0 = N, 1 = E, 2 = S, 3 = W
const BASE_PORTS: Record<PipeShape, number[]> = {
  straight: [1, 3], // E - W
  corner: [0, 1], // N - E
  tee: [0, 1, 3], // N - E - W
  block: [],
};

export function getOpenPorts(shape: PipeShape, rotation: PipeRotation): Set<number> {
  const steps = (rotation / 90) % 4;
  return new Set(BASE_PORTS[shape].map((d) => (d + steps) % 4));
}

export function solvePipeNetwork(net: PipeNetworkState): PipeFlowResult {
  const start = net.cells[0]?.[0];
  if (!start) return { visitedKeys: [], filterReached: false, tankReached: false };

  const visited = new Set<string>();
  const queue: PipeCell[] = [];
  // Intake receives water from West (3) externally
  if (getOpenPorts(start.shape, start.rotation).has(3)) {
    visited.add(cellKey(0, 0));
    queue.push(start);
  }

  let filterReached = false;
  let tankReached = false;

  const deltas: Array<{ dir: number; opp: number; dx: number; dy: number }> = [
    { dir: 0, opp: 2, dx: 0, dy: -1 },
    { dir: 1, opp: 3, dx: 1, dy: 0 },
    { dir: 2, opp: 0, dx: 0, dy: 1 },
    { dir: 3, opp: 1, dx: -1, dy: 0 },
  ];

  while (queue.length > 0) {
    const cur = queue.shift()!;
    if (cur.role === 'filter') filterReached = true;
    if (cur.role === 'tank') tankReached = true;

    const curPorts = getOpenPorts(cur.shape, cur.rotation);
    for (const { dir, opp, dx, dy } of deltas) {
      if (!curPorts.has(dir)) continue;
      const nx = cur.x + dx;
      const ny = cur.y + dy;
      if (nx < 0 || nx >= net.cols || ny < 0 || ny >= net.rows) continue;
      const k = cellKey(nx, ny);
      if (visited.has(k)) continue;
      const neighbor = net.cells[ny][nx];
      if (!getOpenPorts(neighbor.shape, neighbor.rotation).has(opp)) continue;
      visited.add(k);
      queue.push(neighbor);
    }
  }

  return {
    visitedKeys: Array.from(visited),
    filterReached,
    tankReached: tankReached && filterReached,
  };
}

function shapeAndRotForDirs(d1: number, d2: number): { shape: PipeShape; rotation: PipeRotation } {
  const pair = [d1, d2].sort((a, b) => a - b);
  if (pair[0] === 0 && pair[1] === 2) return { shape: 'straight', rotation: 90 };
  if (pair[0] === 1 && pair[1] === 3) return { shape: 'straight', rotation: 0 };
  if (pair[0] === 0 && pair[1] === 1) return { shape: 'corner', rotation: 0 };
  if (pair[0] === 1 && pair[1] === 2) return { shape: 'corner', rotation: 90 };
  if (pair[0] === 2 && pair[1] === 3) return { shape: 'corner', rotation: 180 };
  return { shape: 'corner', rotation: 270 }; // 0 and 3
}

export function createWaterPipePuzzle(difficulty: MiniGameDifficulty, seed = Date.now()): PipeNetworkState {
  const rng = createPrng(seed);
  const cols = 5;
  const rows = 4;

  // Build guaranteed monotone path from (0,0) -> filter -> (cols-1, rows-1)
  const filterX = 1 + Math.floor(rng() * 3); // 1, 2, or 3
  const filterY = 1 + Math.floor(rng() * 2); // 1 or 2

  const path: Array<{ x: number; y: number }> = [{ x: 0, y: 0 }];
  let cx = 0;
  let cy = 0;
  while (cx < filterX || cy < filterY) {
    if (cx < filterX && (cy === filterY || rng() < 0.55)) cx += 1;
    else cy += 1;
    path.push({ x: cx, y: cy });
  }
  while (cx < cols - 1 || cy < rows - 1) {
    if (cx < cols - 1 && (cy === rows - 1 || rng() < 0.55)) cx += 1;
    else cy += 1;
    path.push({ x: cx, y: cy });
  }

  const cells: PipeCell[][] = Array.from({ length: rows }, (_, y) =>
    Array.from({ length: cols }, (__, x) => ({
      x,
      y,
      shape: rng() < 0.45 ? 'straight' : rng() < 0.85 ? 'corner' : 'tee',
      rotation: ([0, 90, 180, 270] as PipeRotation[])[Math.floor(rng() * 4)],
      role: 'normal',
    })),
  );

  const dirBetween = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    if (b.x > a.x) return 1;
    if (b.x < a.x) return 3;
    if (b.y > a.y) return 2;
    return 0;
  };

  const pathSet = new Set(path.map((p) => cellKey(p.x, p.y)));
  for (let i = 0; i < path.length; i++) {
    const p = path[i];
    const prevDir = i === 0 ? 3 : dirBetween(p, path[i - 1]); // entry from West at (0,0)
    const nextDir = i === path.length - 1 ? 1 : dirBetween(p, path[i + 1]); // exit East at (4,3)
    const solved = shapeAndRotForDirs(prevDir, nextDir);

    const role: PipeCell['role'] =
      i === 0 ? 'intake' : p.x === filterX && p.y === filterY ? 'filter' : i === path.length - 1 ? 'tank' : 'normal';

    // Scramble rotation on normal/filter cells; keep intake & tank fixed so kids always know entry/exit!
    const randomRot = ([0, 90, 180, 270] as PipeRotation[])[(solved.rotation / 90 + 1 + Math.floor(rng() * 3)) % 4];
    cells[p.y][p.x] = {
      x: p.x,
      y: p.y,
      shape: solved.shape,
      rotation: role === 'intake' || role === 'tank' ? solved.rotation : randomRot,
      role,
      locked: role === 'intake' || role === 'tank',
    };
  }

  // Add 1-2 solid rock/block tiles off-path on hard difficulty
  if (difficulty === 'hard') {
    let added = 0;
    for (let y = 0; y < rows && added < 3; y++) {
      for (let x = 0; x < cols && added < 3; x++) {
        if (!pathSet.has(cellKey(x, y)) && rng() < 0.35) {
          cells[y][x] = { x, y, shape: 'block', rotation: 0, role: 'normal', locked: true };
          added++;
        }
      }
    }
  }

  return { cols, rows, cells };
}

export function rotatePipeAt(net: PipeNetworkState, x: number, y: number): PipeNetworkState {
  const target = net.cells[y]?.[x];
  if (!target || target.locked || target.shape === 'block') return net;
  const nextRot = ((target.rotation + 90) % 360) as PipeRotation;
  const nextCells = net.cells.map((row, ry) =>
    ry === y ? row.map((cell, cx) => (cx === x ? { ...cell, rotation: nextRot } : cell)) : row,
  );
  return { ...net, cells: nextCells };
}

// ============================================================
// 4. HABITAT SYSTEMS ANOMALY SCENARIOS
// ============================================================
export type HabitatToolId = 'sealant' | 'heater' | 'scrubber' | 'breaker';

export interface HabitatFaultNode {
  id: string;
  labelKey: string;
  requiredTool: HabitatToolId;
  fixed: boolean;
}

export function generateHabitatFaults(difficulty: MiniGameDifficulty, seed = Date.now()): HabitatFaultNode[] {
  const rng = createPrng(seed);
  const pool: Array<{ labelKey: string; requiredTool: HabitatToolId }> = [
    { labelKey: 'mg.hab.fault.seal', requiredTool: 'sealant' },
    { labelKey: 'mg.hab.fault.heater', requiredTool: 'heater' },
    { labelKey: 'mg.hab.fault.air', requiredTool: 'scrubber' },
    { labelKey: 'mg.hab.fault.power', requiredTool: 'breaker' },
    { labelKey: 'mg.hab.fault.hatch', requiredTool: 'sealant' },
    { labelKey: 'mg.hab.fault.valve', requiredTool: 'scrubber' },
  ];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const count = difficulty === 'easy' ? 4 : difficulty === 'normal' ? 5 : 6;
  return pool.slice(0, count).map((item, idx) => ({
    id: `hf-${idx}`,
    labelKey: item.labelKey,
    requiredTool: item.requiredTool,
    fixed: false,
  }));
}

// ============================================================
// 5. RADIATION SHELTER EMERGENCY PRIORITY PROTOCOL
// ============================================================
export interface ShelterStep {
  id: string;
  labelKey: string;
}

export const SHELTER_PROTOCOL_STEPS: ShelterStep[] = [
  { id: 'recall', labelKey: 'mg.she.step.recall' },
  { id: 'seal', labelKey: 'mg.she.step.seal' },
  { id: 'waterwall', labelKey: 'mg.she.step.waterwall' },
  { id: 'scrubbers', labelKey: 'mg.she.step.scrubbers' },
  { id: 'telemetry', labelKey: 'mg.she.step.telemetry' },
];

// ============================================================
// 6. RESEARCH LAB SCIENTIFIC INVESTIGATION CASES
// ============================================================
export type LabInstrumentId = 'spectrometer' | 'microscope' | 'cryo_probe' | 'biosensor';

export interface ResearchCase {
  id: string;
  sampleTitleKey: string;
  clueKey: string;
  correctInstrument: LabInstrumentId;
  targetFrequency: number; // 20 - 80
  questionKey: string;
  optionsKeys: [string, string, string];
  correctOptionIndex: number;
}

export function createRandomMiniGameSeed(): number {
  return Math.floor(Math.random() * 900000) + 100000;
}

export const RESEARCH_CASES: ResearchCase[] = [
  {
    id: 'ice_core',
    sampleTitleKey: 'mg.res.case.ice.title',
    clueKey: 'mg.res.case.ice.clue',
    correctInstrument: 'cryo_probe',
    targetFrequency: 64,
    questionKey: 'mg.res.case.ice.q',
    optionsKeys: ['mg.res.case.ice.o1', 'mg.res.case.ice.o2', 'mg.res.case.ice.o3'],
    correctOptionIndex: 1,
  },
  {
    id: 'basalt_dust',
    sampleTitleKey: 'mg.res.case.basalt.title',
    clueKey: 'mg.res.case.basalt.clue',
    correctInstrument: 'spectrometer',
    targetFrequency: 42,
    questionKey: 'mg.res.case.basalt.q',
    optionsKeys: ['mg.res.case.basalt.o1', 'mg.res.case.basalt.o2', 'mg.res.case.basalt.o3'],
    correctOptionIndex: 0,
  },
  {
    id: 'hydro_leaf',
    sampleTitleKey: 'mg.res.case.leaf.title',
    clueKey: 'mg.res.case.leaf.clue',
    correctInstrument: 'biosensor',
    targetFrequency: 72,
    questionKey: 'mg.res.case.leaf.q',
    optionsKeys: ['mg.res.case.leaf.o1', 'mg.res.case.leaf.o2', 'mg.res.case.leaf.o3'],
    correctOptionIndex: 2,
  },
  {
    id: 'regolith_grain',
    sampleTitleKey: 'mg.res.case.regolith.title',
    clueKey: 'mg.res.case.regolith.clue',
    correctInstrument: 'microscope',
    targetFrequency: 34,
    questionKey: 'mg.res.case.regolith.q',
    optionsKeys: ['mg.res.case.regolith.o1', 'mg.res.case.regolith.o2', 'mg.res.case.regolith.o3'],
    correctOptionIndex: 1,
  },
  {
    id: 'recycled_water',
    sampleTitleKey: 'mg.res.case.water.title',
    clueKey: 'mg.res.case.water.clue',
    correctInstrument: 'biosensor',
    targetFrequency: 56,
    questionKey: 'mg.res.case.water.q',
    optionsKeys: ['mg.res.case.water.o1', 'mg.res.case.water.o2', 'mg.res.case.water.o3'],
    correctOptionIndex: 0,
  },
];
