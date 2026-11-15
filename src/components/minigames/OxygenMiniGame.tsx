import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, CloudOff, Wind } from 'lucide-react';
import { soundEngine } from '../../audio/soundEngine';
import { createPrng } from '../../engine/minigames';
import { t } from '../../i18n/translations';
import { MiniGameFrame } from './MiniGameFrame';
import type { MiniGameComponentProps } from './types';

type BubbleKind = 'o2' | 'co2' | 'smoke';

interface RisingBubble {
  id: number;
  kind: BubbleKind;
  xPct: number; // 12 - 88
  yPct: number; // 100 bottom -> 0 top
  speed: number; // pct per second
}

export const OxygenMiniGame: React.FC<MiniGameComponentProps> = ({
  lang,
  difficulty,
  paused,
  timeLeft,
  seed,
  onPenaltySeconds,
  onWin,
}) => {
  const goalO2 = difficulty === 'easy' ? 8 : difficulty === 'normal' ? 11 : 14;
  const rngRef = useRef(createPrng(seed + 53));
  const nextIdRef = useRef(1);
  const wonRef = useRef(false);

  const [bubbles, setBubbles] = useState<RisingBubble[]>(() => {
    const rng = createPrng(seed + 17);
    return [
      { id: 8001, kind: 'o2', xPct: 24 + rng() * 52, yPct: 76, speed: 24 },
      { id: 8002, kind: 'co2', xPct: 20 + rng() * 60, yPct: 54, speed: 22 },
      { id: 8003, kind: 'o2', xPct: 20 + rng() * 60, yPct: 88, speed: 25 },
    ];
  });

  const [captured, setCaptured] = useState(0);
  const [purity, setPurity] = useState(100);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'warning' | 'info'; text: string } | null>(null);

  useEffect(() => {
    if (paused || wonRef.current) return;

    const dtSec = 0.05;
    const speedBase = difficulty === 'easy' ? 22 : difficulty === 'normal' ? 28 : 34;
    const spawnChance = difficulty === 'easy' ? 0.11 : difficulty === 'normal' ? 0.14 : 0.17;

    const id = window.setInterval(() => {
      let smokeEscaped = false;

      setBubbles((prev) => {
        const next: RisingBubble[] = [];
        for (const b of prev) {
          const ny = b.yPct - b.speed * dtSec;
          if (ny <= 4) {
            if (b.kind === 'smoke') {
              smokeEscaped = true;
            }
            continue;
          }
          next.push({ ...b, yPct: ny });
        }

        if (next.length < 8 && (next.length < 3 || rngRef.current() < spawnChance)) {
          const r = rngRef.current();
          const kind: BubbleKind = r < 0.56 ? 'o2' : r < 0.8 ? 'co2' : 'smoke';
          next.push({
            id: nextIdRef.current++,
            kind,
            xPct: 12 + rngRef.current() * 76,
            yPct: 96,
            speed: speedBase + rngRef.current() * 10,
          });
        }

        return next;
      });

      if (smokeEscaped) {
        soundEngine.playAlert();
        setPurity((p) => Math.max(40, p - 8));
        setFeedback({ tone: 'warning', text: t(lang, 'mg.oxy.smokeEscaped') });
        onPenaltySeconds(2);
      }
    }, 50);

    return () => window.clearInterval(id);
  }, [paused, difficulty, lang, onPenaltySeconds]);

  const handlePopBubble = (bubble: RisingBubble) => {
    if (paused || wonRef.current) return;
    setBubbles((prev) => prev.filter((b) => b.id !== bubble.id));

    if (bubble.kind === 'o2') {
      soundEngine.playActionSuccess();
      const nextCount = captured + 1;
      setCaptured(nextCount);
      setPurity((p) => Math.min(100, p + 2));
      setFeedback({ tone: 'success', text: t(lang, 'mg.oxy.goodO2') });
      if (nextCount >= goalO2) {
        wonRef.current = true;
        onWin(Math.min(100, Math.round((70 + timeLeft * 0.7) * (0.8 + purity / 500))));
      }
    } else if (bubble.kind === 'smoke') {
      soundEngine.playClick();
      setFeedback({ tone: 'success', text: t(lang, 'mg.oxy.goodSmoke') });
    } else {
      soundEngine.playAlert();
      setPurity((p) => Math.max(40, p - 10));
      setFeedback({ tone: 'warning', text: t(lang, 'mg.oxy.hitCo2') });
      onPenaltySeconds(2);
    }
  };

  return (
    <MiniGameFrame
      icon={<Wind className="w-4 h-4 text-cyan-300" />}
      instruction={t(lang, 'mg.oxygen_mix.desc')}
      progressPct={(captured / goalO2) * 100}
      progressTone="cyan"
      stats={[
        { label: t(lang, 'mg.oxy.captured'), value: `${captured}/${goalO2}`, tone: 'cyan' },
        { label: t(lang, 'mg.oxy.purity'), value: `${purity}%`, tone: purity < 75 ? 'rose' : 'emerald' },
      ]}
      feedback={feedback}
      footer={
        <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] font-bold text-slate-300">
          <span className="inline-flex items-center gap-1 text-cyan-300">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {lang === 'es' ? 'O₂: Tocar' : 'O₂: Tap'}
          </span>
          <span className="inline-flex items-center gap-1 text-rose-300">
            <AlertTriangle className="w-3.5 h-3.5" />
            {lang === 'es' ? `${t(lang, 'mg.oxy.smokeTag')}: Tocar` : `${t(lang, 'mg.oxy.smokeTag')}: Tap`}
          </span>
          <span className="inline-flex items-center gap-1 text-violet-300">
            <CloudOff className="w-3.5 h-3.5" />
            {lang === 'es' ? 'CO₂: Dejar pasar' : 'CO₂: Ignore'}
          </span>
        </div>
      }
    >
      {/* Electrolysis Glass Column */}
      <div className="relative h-64 rounded-lg bg-gradient-to-t from-[#07152e] via-[#091a38] to-[#0b2349] border border-cyan-500/30 overflow-hidden select-none">
        {/* Top Intake Duct */}
        <div className="absolute inset-x-0 top-0 h-5 bg-cyan-950/80 border-b border-cyan-500/40 flex items-center justify-center text-[10px] font-mono font-bold text-cyan-300 tracking-wider">
          O2 HABITAT DUCT
        </div>

        {/* Rising Bubbles */}
        {bubbles.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => handlePopBubble(b)}
            style={{
              left: `${b.xPct}%`,
              top: `${b.yPct}%`,
              transform: 'translate(-50%, -50%)',
            }}
            className={`absolute w-12 h-12 rounded-full border-2 font-mono font-black text-[11px] flex flex-col items-center justify-center shadow-lg cursor-pointer transition-transform active:scale-90 ${
              b.kind === 'o2'
                ? 'bg-cyan-400/25 hover:bg-cyan-400/40 border-cyan-300 text-cyan-100'
                : b.kind === 'co2'
                  ? 'bg-violet-500/25 hover:bg-violet-500/35 border-violet-400 text-violet-200'
                  : 'bg-rose-500/30 hover:bg-rose-500/50 border-rose-400 text-rose-100'
            }`}
          >
            {b.kind === 'smoke' ? (
              <>
                <AlertTriangle className="w-3.5 h-3.5" />
                <span className="text-[9px]">{t(lang, 'mg.oxy.smokeTag')}</span>
              </>
            ) : b.kind === 'o2' ? (
              <span>O₂</span>
            ) : (
              <span>CO₂</span>
            )}
          </button>
        ))}

        {/* Bottom Electrodes */}
        <div className="absolute inset-x-0 bottom-0 h-4 bg-[#071022] border-t border-slate-700 flex items-center justify-around">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="w-10 h-1.5 rounded-full bg-cyan-500/50" />
          ))}
        </div>
      </div>
    </MiniGameFrame>
  );
};
