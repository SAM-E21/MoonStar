import test from 'node:test';
import assert from 'node:assert/strict';
import { BUILDING_ORDER } from '../data/missionData';
import {
  areAllCrystalsReachable,
  BUILDING_TO_MINIGAME,
  computeSolarCapture,
  createWaterPipePuzzle,
  generateHabitatFaults,
  generateRoverMap,
  rotatePipeAt,
  solvePipeNetwork,
} from './minigames';
import { applyMiniGameReward, createInitialMission, startOperationsPhase } from './simulation';
import type { MiniGameDifficulty, MissionConfig } from '../types/game';

const BASE_CONFIG: MissionConfig = {
  landingSite: 'shackleton',
  commanderRole: 'engineer',
  priority: 'survival',
  duration: 5,
  crewSize: 2,
  difficulty: 'engineer',
  equipment: [],
};

test('every existing outpost module has a unique dedicated minigame kind', () => {
  const mappedKinds = BUILDING_ORDER.map((id) => BUILDING_TO_MINIGAME[id]);
  assert.equal(mappedKinds.length, 9);
  assert.equal(new Set(mappedKinds).size, 9);
});

test('procedural rover map generator guarantees solvable BFS paths and varied layouts across difficulties', () => {
  const layouts = new Set<string>();
  const difficulties: MiniGameDifficulty[] = ['easy', 'normal', 'hard'];

  for (const diff of difficulties) {
    for (let s = 1; s <= 25; s++) {
      const map = generateRoverMap(diff, s * 97 + diff.length * 13);
      assert.ok(areAllCrystalsReachable(map), `Map failed solvability check for ${diff} seed ${s}`);
      assert.ok(!map.rocks.includes('0,0'));
      assert.ok(!map.crystals.includes('0,0'));
      layouts.add(`${diff}:${map.crystals.join('|')}:${map.rocks.join('|')}`);
    }
  }

  assert.ok(layouts.size >= 60);
});

test('solar alignment physics penalizes misaligned angles, crater shadow, and lunar dust', () => {
  const optimal = computeSolarCapture(30, 30, -40, 12, 100);
  const misaligned = computeSolarCapture(-20, 30, -40, 12, 100);
  const shadowed = computeSolarCapture(30, 30, 28, 12, 100);
  const dusty = computeSolarCapture(30, 30, -40, 12, 0);

  assert.equal(optimal.efficiencyPct, 100);
  assert.ok(misaligned.efficiencyPct < optimal.efficiencyPct);
  assert.ok(shadowed.inShadow);
  assert.ok(shadowed.efficiencyPct < 40);
  assert.ok(dusty.efficiencyPct < 60);
});

test('water pipe network generator starts uncompleted and supports BFS connectivity solver', () => {
  const net = createWaterPipePuzzle('normal', 12345);
  const initialFlow = solvePipeNetwork(net);
  assert.equal(initialFlow.tankReached, false);

  const rotated = rotatePipeAt(net, 1, 1);
  assert.notEqual(rotated.cells[1][1].rotation, net.cells[1][1].rotation);

  // Build deterministic straight solvable row across y=0 with filter at x=2, tank at x=4
  const manualNet = {
    cols: 5,
    rows: 2,
    cells: [
      [
        { x: 0, y: 0, shape: 'straight' as const, rotation: 0 as const, role: 'intake' as const, locked: true },
        { x: 1, y: 0, shape: 'straight' as const, rotation: 0 as const, role: 'normal' as const },
        { x: 2, y: 0, shape: 'straight' as const, rotation: 0 as const, role: 'filter' as const },
        { x: 3, y: 0, shape: 'straight' as const, rotation: 0 as const, role: 'normal' as const },
        { x: 4, y: 0, shape: 'straight' as const, rotation: 0 as const, role: 'tank' as const, locked: true },
      ],
      [
        { x: 0, y: 1, shape: 'block' as const, rotation: 0 as const, role: 'normal' as const },
        { x: 1, y: 1, shape: 'block' as const, rotation: 0 as const, role: 'normal' as const },
        { x: 2, y: 1, shape: 'block' as const, rotation: 0 as const, role: 'normal' as const },
        { x: 3, y: 1, shape: 'block' as const, rotation: 0 as const, role: 'normal' as const },
        { x: 4, y: 1, shape: 'block' as const, rotation: 0 as const, role: 'normal' as const },
      ],
    ],
  };
  const solved = solvePipeNetwork(manualNet);
  assert.equal(solved.filterReached, true);
  assert.equal(solved.tankReached, true);
  assert.equal(solved.visitedKeys.length, 5);
});

test('habitat fault generator scales with difficulty', () => {
  assert.equal(generateHabitatFaults('easy', 101).length, 4);
  assert.equal(generateHabitatFaults('normal', 101).length, 5);
  assert.equal(generateHabitatFaults('hard', 101).length, 6);
});

test('all 9 minigame outcomes update real simulation modules on both victory and failure', () => {
  for (const bId of BUILDING_ORDER) {
    const kind = BUILDING_TO_MINIGAME[bId];
    let state = startOperationsPhase(createInitialMission(BASE_CONFIG));
    state = {
      ...state,
      energy: { ...state.energy, current: 55 },
      water: { ...state.water, current: 55 },
      oxygen: { ...state.oxygen, current: 55 },
      food: { ...state.food, current: 55 },
      crewHealth: 80,
      radiationRisk: 30,
      commsQuality: 70,
    };

    const wonState = applyMiniGameReward(state, {
      kind,
      won: true,
      difficulty: 'hard',
      scorePct: 95,
    });
    assert.equal(wonState.miniGamesWon, 1, `Expected miniGamesWon=1 for ${kind}`);
    assert.equal(wonState.buildings[bId].activeBoost, true, `Expected activeBoost for ${bId}`);
    assert.ok(
      wonState.buildings[bId].efficiency > state.buildings[bId].efficiency,
      `Expected efficiency increase for ${bId}`,
    );

    const lostState = applyMiniGameReward(state, {
      kind,
      won: false,
      difficulty: 'normal',
      scorePct: 20,
    });
    assert.equal(lostState.miniGamesWon, 0, `Expected miniGamesWon unchanged on fail for ${kind}`);
  }
});
