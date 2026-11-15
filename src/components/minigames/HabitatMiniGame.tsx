import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertOctagon,
  BedDouble,
  BellRing,
  CheckCircle2,
  DoorOpen,
  Fan,
  HeartPulse,
  Home,
  ShieldCheck,
  Utensils,
} from 'lucide-react';
import { soundEngine } from '../../audio/soundEngine';
import { createPrng } from '../../engine/minigames';
import { t } from '../../i18n/translations';
import { MiniGameFrame } from './MiniGameFrame';
import type { MiniGameComponentProps } from './types';

type SlotStatus = 'nominal' | 'leak' | 'false_alarm' | 'sealed';

interface CompartmentSlot {
  id: string;
  labelKey: string;
  status: SlotStatus;
  ttlMs: number;
  maxTtlMs: number;
}

const INITIAL_COMPARTMENTS: Array<{ id: string; labelKey: string }> = [
  { id: 'dome', labelKey: 'mg.hab.zone.dome' },
  { id: 'airlock', labelKey: 'mg.hab.zone.airlock' },
  { id: 'quarters', labelKey: 'mg.hab.zone.quarters' },
  { id: 'galley', labelKey: 'mg.hab.zone.galley' },
  { id: 'medbay', labelKey: 'mg.hab.zone.medbay' },
  { id: 'lifesupport', labelKey: 'mg.hab.zone.lifesupport' },
];

const renderZoneIcon = (id: string, status: SlotStatus) => {
  const cls =
    status === 'leak'
      ? 'w-5 h-5 text-rose-300'
      : status === 'false_alarm'
        ? 'w-5 h-5 text-amber-300'
        : status === 'sealed'
          ? 'w-5 h-5 text-emerald-300'
          : 'w-5 h-5 text-cyan-300';

  switch (id) {
    case 'dome':
      return <Home className={cls} />;
    case 'airlock':
      return <DoorOpen className={cls} />;
    case 'quarters':
      return <BedDouble className={cls} />;
    case 'galley':
      return <Utensils className={cls} />;
    case 'medbay':
      return <HeartPulse className={cls} />;
    default:
      return <Fan className={cls} />;
  }
};

export const HabitatMiniGame: React.FC<MiniGameComponentProps> = ({
  lang,
  difficulty,
  paused,
  timeLeft,
  seed,
  onPenaltySeconds,
  onWin,
}) => {
  const targetSeals = difficulty === 'easy' ? 7 : difficulty === 'normal' ? 10 : 13;
  const rngRef = useRef(createPrng(seed + 11));
  const wonRef = useRef(false);

  const [slots, setSlots] = useState<CompartmentSlot[]>(() => {
    const rng = createPrng(seed + 3);
    const firstLeakIdx = Math.floor(rng() * INITIAL_COMPARTMENTS.length);
    const baseTtl = difficulty === 'easy' ? 3200 : difficulty === 'normal' ? 2550 : 2050;
    return INITIAL_COMPARTMENTS.map((c, idx) => ({
      ...c,
      status: idx === firstLeakIdx ? 'leak' : 'nominal',
      ttlMs: idx === firstLeakIdx ? baseTtl : 0,
      maxTtlMs: baseTtl,
    }));
  });

  const [sealedCount, setSealedCount] = useState(0);
  const [pressureKpa, setPressureKpa] = useState(96);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'warning' | 'info'; text: string } | null>(null);

  const activeLeaks = useMemo(() => slots.filter((s) => s.status === 'leak').length, [slots]);

  useEffect(() => {
    if (paused || wonRef.current) return;

    const tickMs = 100;
    const spawnProb = difficulty === 'easy' ? 0.16 : difficulty === 'normal' ? 0.22 : 0.28;
    const maxConcurrent = difficulty === 'easy' ? 2 : difficulty === 'normal' ? 3 : 3;
    const baseTtl = difficulty === 'easy' ? 3200 : difficulty === 'normal' ? 2550 : 2050;

    let missedThisTick = false;

    const id = window.setInterval(() => {
      missedThisTick = false;

      setSlots((prev) => {
        const next = prev.map((s) => {
          if (s.status === 'nominal') return s;
          const rem = s.ttlMs - tickMs;
          if (rem <= 0) {
            if (s.status === 'leak') {
              missedThisTick = true;
            }
            return { ...s, status: 'nominal' as const, ttlMs: 0 };
          }
          return { ...s, ttlMs: rem };
        });

        const busyCount = next.filter((s) => s.status === 'leak' || s.status === 'false_alarm').length;
        const nominalIndices = next
          .map((s, idx) => (s.status === 'nominal' ? idx : -1))
          .filter((idx) => idx >= 0);

        if (nominalIndices.length > 0 && busyCount < maxConcurrent && (busyCount === 0 || rngRef.current() < spawnProb)) {
          const pick = nominalIndices[Math.floor(rngRef.current() * nominalIndices.length)];
          const isFalseAlarm = rngRef.current() < (difficulty === 'easy' ? 0.24 : 0.3);
          const ttl = isFalseAlarm ? Math.round(baseTtl * 0.85) : baseTtl;
          next[pick] = {
            ...next[pick],
            status: isFalseAlarm ? 'false_alarm' : 'leak',
            ttlMs: ttl,
            maxTtlMs: ttl,
          };
        }

        return next;
      });

      if (missedThisTick) {
        soundEngine.playAlert();
        setStreak(0);
        setPressureKpa((p) => Math.max(60, p - 4));
        setFeedback({ tone: 'warning', text: t(lang, 'mg.hab.missedLeak') });
        onPenaltySeconds(2);
      }
    }, tickMs);

    return () => window.clearInterval(id);
  }, [paused, difficulty, lang, onPenaltySeconds]);

  const handleCompartmentClick = (slotId: string) => {
    if (paused || wonRef.current) return;
    const clicked = slots.find((s) => s.id === slotId);
    if (!clicked) return;

    if (clicked.status === 'leak') {
      soundEngine.playActionSuccess();
      const nextSealed = sealedCount + 1;
      setSealedCount(nextSealed);
      setStreak((s) => s + 1);
      setPressureKpa((p) => Math.min(101, p + 2));
      setFeedback({ tone: 'success', text: t(lang, 'mg.hab.hitLeak') });
      setSlots((prev) =>
        prev.map((s) => (s.id === slotId ? { ...s, status: 'sealed', ttlMs: 450, maxTtlMs: 450 } : s)),
      );

      if (nextSealed >= targetSeals) {
        wonRef.current = true;
        const pct = Math.min(100, Math.round(70 + timeLeft * 0.8 + Math.min(10, streak * 2)));
        onWin(pct);
      }
    } else if (clicked.status === 'false_alarm') {
      soundEngine.playAlert();
      setStreak(0);
      setPressureKpa((p) => Math.max(60, p - 3));
      setFeedback({ tone: 'warning', text: t(lang, 'mg.hab.hitFalse') });
      setSlots((prev) => prev.map((s) => (s.id === slotId ? { ...s, status: 'nominal', ttlMs: 0 } : s)));
      onPenaltySeconds(2);
    } else {
      soundEngine.playClick();
    }
  };

  return (
    <MiniGameFrame
      icon={<ShieldCheck className="w-4 h-4 text-cyan-300" />}
      instruction={t(lang, 'mg.habitat_systems.desc')}
      progressPct={(sealedCount / targetSeals) * 100}
      progressTone="emerald"
      stats={[
        { label: t(lang, 'mg.hab.sealed'), value: `${sealedCount}/${targetSeals}`, tone: 'emerald' },
        {
          label: t(lang, 'mg.hab.pressure'),
          value: `${pressureKpa} kPa`,
          tone: pressureKpa < 82 ? 'rose' : 'cyan',
        },
        { label: t(lang, 'mg.hab.combo'), value: `x${streak}`, tone: 'amber' },
      ]}
      feedback={feedback}
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {slots.map((slot) => {
          const isLeak = slot.status === 'leak';
          const isFalse = slot.status === 'false_alarm';
          const isSealed = slot.status === 'sealed';
          const ttlPct = slot.maxTtlMs > 0 ? Math.max(0, Math.round((slot.ttlMs / slot.maxTtlMs) * 100)) : 0;

          return (
            <button
              key={slot.id}
              type="button"
              onClick={() => handleCompartmentClick(slot.id)}
              className={`relative min-h-[108px] p-3 rounded-xl border text-left flex flex-col justify-between transition-transform duration-150 cursor-pointer active:scale-[0.97] ${
                isLeak
                  ? 'bg-rose-950/65 border-rose-400 shadow-lg shadow-rose-950/40'
                  : isFalse
                    ? 'bg-amber-950/50 border-amber-400'
                    : isSealed
                      ? 'bg-emerald-950/55 border-emerald-400'
                      : 'bg-[#0b152a] hover:bg-[#101d39] border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="w-9 h-9 rounded-lg bg-[#060d1e] border border-slate-700/80 flex items-center justify-center shrink-0">
                  {renderZoneIcon(slot.id, slot.status)}
                </div>

                {isLeak && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500 text-white text-[10px] font-black tracking-wide">
                    <AlertOctagon className="w-3 h-3" />
                    {t(lang, 'mg.hab.leakBadge')}
                  </span>
                )}
                {isFalse && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-400 text-slate-950 text-[10px] font-black">
                    <BellRing className="w-3 h-3" />
                    {t(lang, 'mg.hab.falseBadge')}
                  </span>
                )}
                {isSealed && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-400 text-slate-950 text-[10px] font-black">
                    <CheckCircle2 className="w-3 h-3" />
                  </span>
                )}
              </div>

              <div>
                <div className="text-xs font-extrabold text-white">{t(lang, slot.labelKey)}</div>
                <div className="text-[11px] font-mono tabular-nums text-slate-400 mt-0.5">
                  {isLeak
                    ? `${(slot.ttlMs / 1000).toFixed(1)}s`
                    : isFalse
                      ? `Sensor? (${activeLeaks})`
                      : t(lang, 'mg.hab.nominal')}
                </div>
              </div>

              {(isLeak || isFalse) && (
                <div className="h-1.5 bg-[#060d1e] rounded-full overflow-hidden mt-1.5">
                  <div
                    className={`h-full transition-all duration-100 ${isLeak ? 'bg-rose-400' : 'bg-amber-400'}`}
                    style={{ width: `${ttlPct}%` }}
                  />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </MiniGameFrame>
  );
};
