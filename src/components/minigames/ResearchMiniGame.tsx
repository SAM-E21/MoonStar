import React, { useMemo, useState } from 'react';
import { CheckCircle2, Eye, Microscope, Search } from 'lucide-react';
import { soundEngine } from '../../audio/soundEngine';
import {
  createPrng,
  MICRO_SPECIMENS,
  type SpecimenTargetShape,
} from '../../engine/minigames';
import { t } from '../../i18n/translations';
import { MiniGameFrame } from './MiniGameFrame';
import type { MiniGameComponentProps } from './types';

interface SlideInclusion {
  id: string;
  xPct: number;
  yPct: number;
  isTarget: boolean;
  found: boolean;
  rotation: number;
}

const renderSpecimenGlyph = (
  shape: SpecimenTargetShape,
  isTarget: boolean,
  accentHex: string,
  decoyHex: string,
  size = 36,
) => {
  if (!isTarget) {
    return (
      <svg width={size} height={size} viewBox="0 0 40 40">
        <polygon points="8,24 14,10 28,12 34,26 20,33" fill={decoyHex} fillOpacity="0.55" stroke="#94a3b8" strokeWidth="2" />
      </svg>
    );
  }

  switch (shape) {
    case 'hex_ice':
      return (
        <svg width={size} height={size} viewBox="0 0 40 40">
          <polygon
            points="20,4 34,12 34,28 20,36 6,28 6,12"
            fill={accentHex}
            fillOpacity="0.3"
            stroke={accentHex}
            strokeWidth="2.5"
          />
          <circle cx="20" cy="20" r="4" fill="#e0f2fe" />
        </svg>
      );
    case 'titanium_prism':
      return (
        <svg width={size} height={size} viewBox="0 0 40 40">
          <polygon
            points="20,4 33,20 20,36 7,20"
            fill={accentHex}
            fillOpacity="0.35"
            stroke={accentHex}
            strokeWidth="2.5"
          />
          <line x1="20" y1="6" x2="20" y2="34" stroke="#ede9fe" strokeWidth="1.5" />
        </svg>
      );
    case 'glass_bead':
      return (
        <svg width={size} height={size} viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="13" fill={accentHex} fillOpacity="0.32" stroke={accentHex} strokeWidth="2.5" />
          <circle cx="15" cy="15" r="4" fill="#fef3c7" />
        </svg>
      );
    case 'bio_cell':
      return (
        <svg width={size} height={size} viewBox="0 0 40 40">
          <ellipse cx="20" cy="20" rx="14" ry="10" fill={accentHex} fillOpacity="0.28" stroke={accentHex} strokeWidth="2.5" />
          <ellipse cx="20" cy="20" rx="7" ry="4.5" fill="none" stroke="#a7f3d0" strokeWidth="2" />
        </svg>
      );
  }
};

export const ResearchMiniGame: React.FC<MiniGameComponentProps> = ({
  lang,
  difficulty,
  paused,
  timeLeft,
  seed,
  onPenaltySeconds,
  onWin,
}) => {
  const setup = useMemo(() => {
    const rng = createPrng(seed + 83);
    const specimen = MICRO_SPECIMENS[Math.floor(rng() * MICRO_SPECIMENS.length)];
    const targetFocus = Math.round(18 + rng() * 64); // 18..82
    const initialFocus = targetFocus > 50 ? Math.round(8 + rng() * 20) : Math.round(72 + rng() * 20);

    const totalDecoys = difficulty === 'easy' ? 4 : difficulty === 'normal' ? 5 : 7;
    const totalCount = 3 + totalDecoys;

    // Place items in well-separated grid-jittered slots inside the circular lens
    const slots: Array<{ x: number; y: number }> = [
      { x: 30, y: 28 },
      { x: 52, y: 22 },
      { x: 72, y: 31 },
      { x: 24, y: 51 },
      { x: 49, y: 49 },
      { x: 74, y: 53 },
      { x: 32, y: 74 },
      { x: 55, y: 76 },
      { x: 69, y: 69 },
      { x: 42, y: 36 },
    ];
    for (let i = slots.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [slots[i], slots[j]] = [slots[j], slots[i]];
    }

    const items: SlideInclusion[] = slots.slice(0, totalCount).map((pos, idx) => ({
      id: `inc-${idx}`,
      xPct: pos.x + (rng() - 0.5) * 6,
      yPct: pos.y + (rng() - 0.5) * 6,
      isTarget: idx < 3,
      found: false,
      rotation: Math.round(rng() * 35),
    }));

    return { specimen, targetFocus, initialFocus, items };
  }, [seed, difficulty]);

  const [focus, setFocus] = useState(setup.initialFocus);
  const [phase, setPhase] = useState<'focus' | 'hunt'>('focus');
  const [items, setItems] = useState<SlideInclusion[]>(setup.items);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'warning' | 'info'; text: string } | null>(null);

  const sharpnessPct = Math.max(0, Math.round(100 - Math.abs(focus - setup.targetFocus) * 2.4));
  const blurPx = phase === 'hunt' ? 0 : Math.max(0, Number(((100 - sharpnessPct) * 0.1).toFixed(1)));
  const foundCount = items.filter((i) => i.isTarget && i.found).length;

  const handleLockFocus = () => {
    if (paused || phase !== 'focus') return;
    if (sharpnessPct >= 88) {
      soundEngine.playActionSuccess();
      setPhase('hunt');
      setFeedback({ tone: 'success', text: t(lang, 'mg.res.phaseHunt') });
    } else {
      soundEngine.playAlert();
      setFeedback({ tone: 'warning', text: t(lang, 'mg.res.focusHint') });
    }
  };

  const handleClickInclusion = (item: SlideInclusion) => {
    if (paused || phase !== 'hunt' || item.found) return;
    if (item.isTarget) {
      soundEngine.playActionSuccess();
      const nextItems = items.map((x) => (x.id === item.id ? { ...x, found: true } : x));
      setItems(nextItems);
      const nextFound = nextItems.filter((x) => x.isTarget && x.found).length;
      if (nextFound >= 3) {
        onWin(Math.min(100, Math.round(74 + timeLeft * 0.7)));
      }
    } else {
      soundEngine.playAlert();
      setFeedback({ tone: 'warning', text: t(lang, 'mg.res.wrongSample') });
      onPenaltySeconds(2);
    }
  };

  return (
    <MiniGameFrame
      icon={<Microscope className="w-4 h-4 text-cyan-300" />}
      instruction={t(lang, 'mg.research_lab.desc')}
      progressPct={phase === 'focus' ? sharpnessPct * 0.4 : 40 + (foundCount / 3) * 60}
      progressTone={phase === 'focus' ? 'cyan' : 'emerald'}
      stats={[
        { label: t(lang, 'mg.res.sharpness'), value: `${phase === 'hunt' ? 100 : sharpnessPct}%`, tone: sharpnessPct >= 88 ? 'emerald' : 'amber' },
        { label: t(lang, 'mg.res.found'), value: `${foundCount}/3`, tone: 'cyan' },
      ]}
      feedback={feedback}
      footer={
        phase === 'focus' ? (
          <div className="bg-[#0b152a] border border-slate-800 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-200">
              <span>{t(lang, 'mg.res.phaseFocus')}</span>
              <span className="font-mono tabular-nums text-cyan-300">{focus} mm</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={5}
                max={95}
                value={focus}
                onChange={(e) => setFocus(Number(e.target.value))}
                className="flex-1 accent-cyan-400 cursor-pointer"
              />
              <button
                type="button"
                onClick={handleLockFocus}
                className={`px-3.5 py-2 rounded-lg text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  sharpnessPct >= 88
                    ? 'bg-emerald-400 hover:bg-emerald-300 text-slate-950'
                    : 'bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                {t(lang, 'mg.res.lockFocus')}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-[11px] font-semibold text-cyan-200 text-center flex items-center justify-center gap-1.5">
            <Search className="w-3.5 h-3.5" />
            <span>{t(lang, 'mg.res.phaseHunt')}</span>
          </div>
        )
      }
    >
      <div className="grid sm:grid-cols-[1.25fr_1fr] gap-3 items-center">
        {/* Circular Microscope Viewport */}
        <div className="flex items-center justify-center">
          <div className="relative w-56 h-56 rounded-full bg-gradient-to-br from-[#071126] via-[#0a1834] to-[#040914] border-2 border-cyan-500/45 overflow-hidden shadow-inner">
            {/* Crosshair Reticle */}
            <div className="absolute inset-x-0 top-1/2 border-t border-cyan-500/20 pointer-events-none" />
            <div className="absolute inset-y-0 left-1/2 border-l border-cyan-500/20 pointer-events-none" />
            <div className="absolute inset-6 rounded-full border border-cyan-500/15 pointer-events-none" />

            {/* Blurred / Focused Slide Layer */}
            <div
              className="absolute inset-0 transition-[filter] duration-75"
              style={{ filter: `blur(${blurPx}px)` }}
            >
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  disabled={phase !== 'hunt' || item.found}
                  onClick={() => handleClickInclusion(item)}
                  style={{
                    left: `${item.xPct}%`,
                    top: `${item.yPct}%`,
                    transform: `translate(-50%, -50%) rotate(${item.rotation}deg)`,
                  }}
                  className={`absolute w-10 h-10 rounded-full flex items-center justify-center transition-transform ${
                    phase !== 'hunt'
                      ? 'cursor-default'
                      : item.found
                        ? 'opacity-35 scale-90 cursor-default'
                        : 'hover:scale-110 cursor-pointer'
                  }`}
                >
                  {item.found ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  ) : (
                    renderSpecimenGlyph(
                      setup.specimen.shape,
                      item.isTarget,
                      setup.specimen.accentHex,
                      setup.specimen.decoyHex,
                      34,
                    )
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Lab Target Reference Guide */}
        <div className="bg-[#0b152a] border border-slate-800 rounded-xl p-3 space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
            {t(lang, 'mg.res.guideLabel')}
          </div>
          <div className="text-xs font-extrabold text-white">{t(lang, setup.specimen.titleKey)}</div>

          <div className="flex items-center gap-2.5 bg-[#060d1e] border border-slate-800 rounded-lg p-2.5">
            <div className="shrink-0">
              {renderSpecimenGlyph(
                setup.specimen.shape,
                true,
                setup.specimen.accentHex,
                setup.specimen.decoyHex,
                42,
              )}
            </div>
            <div>
              <div className="text-xs font-bold text-cyan-200">{t(lang, setup.specimen.targetNameKey)}</div>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{t(lang, setup.specimen.clueKey)}</p>
            </div>
          </div>
        </div>
      </div>
    </MiniGameFrame>
  );
};
