import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Globe, Radio, Sparkles, Zap } from 'lucide-react';
import { soundEngine } from '../../audio/soundEngine';
import { createPrng } from '../../engine/minigames';
import { t } from '../../i18n/translations';
import { MiniGameFrame } from './MiniGameFrame';
import type { MiniGameComponentProps } from './types';

interface WaveObstacle {
  id: number;
  kind: 'static' | 'boost';
  xPct: number; // 100 -> 0
  yPct: number; // 14 - 86
  halfHeightPct: number;
  speed: number;
}

export const CommsMiniGame: React.FC<MiniGameComponentProps> = ({
  lang,
  difficulty,
  paused,
  timeLeft,
  seed,
  onPenaltySeconds,
  onWin,
}) => {
  const rngRef = useRef(createPrng(seed + 71));
  const nextIdRef = useRef(1);
  const wonRef = useRef(false);
  const stageRef = useRef<HTMLDivElement | null>(null);

  const [beamY, setBeamY] = useState(50);
  const beamYRef = useRef(50);
  const [uploadPct, setUploadPct] = useState(0);
  const uploadRef = useRef(0);
  const [invulnMs, setInvulnMs] = useState(0);
  const invulnRef = useRef(0);
  const [obstacles, setObstacles] = useState<WaveObstacle[]>(() => {
    const rng = createPrng(seed + 19);
    return [
      { id: 7001, kind: 'static', xPct: 68, yPct: 24 + rng() * 52, halfHeightPct: 12, speed: 32 },
      { id: 7002, kind: 'boost', xPct: 88, yPct: 22 + rng() * 56, halfHeightPct: 9, speed: 30 },
    ];
  });
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'warning' | 'info'; text: string } | null>(null);

  const steerBeam = useCallback(
    (nextY: number) => {
      if (paused || wonRef.current) return;
      const clamped = Math.max(12, Math.min(88, nextY));
      beamYRef.current = clamped;
      setBeamY(clamped);
    },
    [paused],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (paused || wonRef.current) return;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        steerBeam(beamYRef.current - 9);
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        steerBeam(beamYRef.current + 9);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [paused, steerBeam]);

  useEffect(() => {
    if (paused || wonRef.current) return;

    const dtSec = 0.05;
    const baseSpeed = difficulty === 'easy' ? 28 : difficulty === 'normal' ? 35 : 43;
    const spawnChance = difficulty === 'easy' ? 0.08 : difficulty === 'normal' ? 0.11 : 0.14;
    const uploadPerSec = difficulty === 'easy' ? 8.2 : difficulty === 'normal' ? 7.2 : 6.4;

    const id = window.setInterval(() => {
      if (invulnRef.current > 0) {
        invulnRef.current = Math.max(0, invulnRef.current - 50);
        setInvulnMs(invulnRef.current);
      }

      let hitStatic = false;
      let hitBoost = false;

      setObstacles((prev) => {
        const surviving: WaveObstacle[] = [];
        const by = beamYRef.current;

        for (const obs of prev) {
          const nx = obs.xPct - obs.speed * dtSec;
          const nearEmitter = nx >= 12 && nx <= 22;
          const overlapY = Math.abs(obs.yPct - by) <= obs.halfHeightPct + 5;

          if (nearEmitter && overlapY) {
            if (obs.kind === 'boost') {
              hitBoost = true;
              continue;
            } else if (invulnRef.current <= 0) {
              hitStatic = true;
              invulnRef.current = 800;
              setInvulnMs(800);
              continue;
            }
          }

          if (nx > -6) {
            surviving.push({ ...obs, xPct: nx });
          }
        }

        if (surviving.length < 7 && (surviving.length < 2 || rngRef.current() < spawnChance)) {
          const isBoost = rngRef.current() < 0.28;
          surviving.push({
            id: nextIdRef.current++,
            kind: isBoost ? 'boost' : 'static',
            xPct: 102,
            yPct: 14 + rngRef.current() * 72,
            halfHeightPct: isBoost ? 9 : difficulty === 'hard' ? 14 : 11,
            speed: baseSpeed + rngRef.current() * 10,
          });
        }

        return surviving;
      });

      let nextUpload = uploadRef.current + uploadPerSec * dtSec;
      if (hitBoost) {
        soundEngine.playActionSuccess();
        nextUpload += 10;
        setFeedback({ tone: 'success', text: t(lang, 'mg.comms.hitBoost') });
      }
      if (hitStatic) {
        soundEngine.playAlert();
        nextUpload = Math.max(0, nextUpload - 5);
        setFeedback({ tone: 'warning', text: t(lang, 'mg.comms.hitStatic') });
        onPenaltySeconds(2);
      }

      nextUpload = Math.min(100, nextUpload);
      uploadRef.current = nextUpload;
      setUploadPct(nextUpload);

      if (nextUpload >= 100 && !wonRef.current) {
        wonRef.current = true;
        soundEngine.playActionSuccess();
        onWin(Math.min(100, Math.round(72 + timeLeft * 0.85)));
      }
    }, 50);

    return () => window.clearInterval(id);
  }, [paused, difficulty, lang, onPenaltySeconds, onWin, timeLeft]);

  const handlePointer = (clientY: number) => {
    const el = stageRef.current;
    if (!el || paused || wonRef.current) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientY - rect.top) / Math.max(1, rect.height)) * 100;
    steerBeam(pct);
  };

  return (
    <MiniGameFrame
      icon={<Radio className="w-4 h-4 text-cyan-300" />}
      instruction={t(lang, 'mg.comms_tune.desc')}
      progressPct={uploadPct}
      progressTone="cyan"
      stats={[
        { label: t(lang, 'mg.comms.upload'), value: `${Math.round(uploadPct)}%`, tone: 'emerald' },
        { label: t(lang, 'mg.comms.altitude'), value: `${Math.round(100 - beamY)} MHz`, tone: 'cyan' },
      ]}
      feedback={feedback}
      footer={
        <div className="flex items-center justify-between gap-3">
          <div className="text-[11px] text-slate-400 font-semibold flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-cyan-300" />
            <span>{lang === 'es' ? 'LUNA → TIERRA (1.3s)' : 'MOON → EARTH (1.3s)'}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => steerBeam(beamY - 12)}
              aria-label={t(lang, 'mg.comms.moveUp')}
              className="px-4 py-2 rounded-lg bg-[#0b152a] hover:bg-slate-800 border border-slate-700 text-white flex items-center gap-1 text-xs font-bold cursor-pointer"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => steerBeam(beamY + 12)}
              aria-label={t(lang, 'mg.comms.moveDown')}
              className="px-4 py-2 rounded-lg bg-[#0b152a] hover:bg-slate-800 border border-slate-700 text-white flex items-center gap-1 text-xs font-bold cursor-pointer"
            >
              <ArrowDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      }
    >
      {/* Wave Tunnel Stage */}
      <div
        ref={stageRef}
        onPointerMove={(e) => {
          if (e.buttons > 0 || e.pointerType === 'mouse') handlePointer(e.clientY);
        }}
        onPointerDown={(e) => handlePointer(e.clientY)}
        className="relative h-60 rounded-lg bg-gradient-to-r from-[#040916] via-[#09142c] to-[#081b36] border border-slate-800 overflow-hidden select-none touch-none cursor-ns-resize"
      >
        {/* Horizontal Frequency Guide Grid */}
        {[25, 50, 75].map((y) => (
          <div key={y} style={{ top: `${y}%` }} className="absolute inset-x-0 border-t border-slate-800/70" />
        ))}

        {/* Continuous Signal Path SVG */}
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
          <path
            d={`M 4 ${beamY} Q 11 ${Math.max(10, beamY - 6)} 17 ${beamY} T 96 ${beamY}`}
            fill="none"
            stroke={invulnMs > 0 ? '#fb7185' : '#22d3ee'}
            strokeWidth="0.9"
            strokeDasharray="2 1.5"
            opacity="0.6"
          />
        </svg>

        {/* Earth Target Icon on Right */}
        <div
          style={{ top: `${beamY}%`, right: '10px', transform: 'translateY(-50%)' }}
          className="absolute w-8 h-8 rounded-full bg-sky-500/20 border border-sky-300/60 flex items-center justify-center text-sky-300 pointer-events-none"
        >
          <Globe className="w-4 h-4" />
        </div>

        {/* Player Radio Dish / Signal Node on Left */}
        <div
          style={{ left: '16%', top: `${beamY}%`, transform: 'translate(-50%, -50%)' }}
          className={`absolute w-9 h-9 rounded-full border-2 flex items-center justify-center shadow-lg pointer-events-none transition-opacity ${
            invulnMs > 0
              ? 'bg-rose-500/35 border-rose-300 text-rose-100 opacity-70'
              : 'bg-cyan-400/25 border-cyan-300 text-cyan-100'
          }`}
        >
          <Radio className="w-4 h-4" />
        </div>

        {/* Solar Static Blocks & Relay Boosters */}
        {obstacles.map((obs) =>
          obs.kind === 'boost' ? (
            <div
              key={obs.id}
              style={{ left: `${obs.xPct}%`, top: `${obs.yPct}%`, transform: 'translate(-50%, -50%)' }}
              className="absolute w-8 h-8 rounded-full bg-amber-400/25 border-2 border-amber-300 text-amber-200 flex items-center justify-center pointer-events-none"
            >
              <Sparkles className="w-4 h-4" />
            </div>
          ) : (
            <div
              key={obs.id}
              style={{
                left: `${obs.xPct}%`,
                top: `${obs.yPct}%`,
                height: `${obs.halfHeightPct * 2}%`,
                transform: 'translate(-50%, -50%)',
              }}
              className="absolute w-7 rounded-lg bg-rose-950/90 border border-rose-400 text-rose-300 flex items-center justify-center pointer-events-none"
            >
              <Zap className="w-4 h-4" />
            </div>
          ),
        )}
      </div>
    </MiniGameFrame>
  );
};
