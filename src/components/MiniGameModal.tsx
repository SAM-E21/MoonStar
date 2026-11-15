import React, { useEffect, useState } from 'react';
import { CheckCircle2, Lightbulb, Pause, Play, RefreshCw, Sparkles, X } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';
import { createRandomMiniGameSeed, getMiniGameTimeLimit } from '../engine/minigames';
import { t } from '../i18n/translations';
import type { Language, MiniGameDifficulty, MiniGameKind, MiniGameOutcome } from '../types/game';
import { CommsMiniGame } from './minigames/CommsMiniGame';
import { GreenhouseMiniGame } from './minigames/GreenhouseMiniGame';
import { HabitatMiniGame } from './minigames/HabitatMiniGame';
import { OxygenMiniGame } from './minigames/OxygenMiniGame';
import { ResearchMiniGame } from './minigames/ResearchMiniGame';
import { RoverMiniGame } from './minigames/RoverMiniGame';
import { ShelterMiniGame } from './minigames/ShelterMiniGame';
import { SolarMiniGame } from './minigames/SolarMiniGame';
import { WaterPipesMiniGame } from './minigames/WaterPipesMiniGame';

interface MiniGameModalProps {
  lang: Language;
  kind: MiniGameKind;
  onComplete: (outcome: MiniGameOutcome) => void;
  onClose: () => void;
}

export const MiniGameModal: React.FC<MiniGameModalProps> = ({ lang, kind, onComplete, onClose }) => {
  const [difficulty, setDifficulty] = useState<MiniGameDifficulty>('normal');
  const [runKey, setRunKey] = useState(1);
  const [seed, setSeed] = useState(() => createRandomMiniGameSeed());
  const [paused, setPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(() => getMiniGameTimeLimit(kind, 'normal'));
  const [result, setResult] = useState<{ won: boolean; scorePct: number } | null>(null);

  const rerollChallenge = () => {
    soundEngine.playClick();
    setTimeLeft(getMiniGameTimeLimit(kind, difficulty));
    setResult(null);
    setPaused(false);
    setSeed(createRandomMiniGameSeed());
    setRunKey((k) => k + 1);
  };

  useEffect(() => {
    setTimeLeft(getMiniGameTimeLimit(kind, difficulty));
    setResult(null);
    setPaused(false);
    setSeed(createRandomMiniGameSeed());
    setRunKey((k) => k + 1);
  }, [kind, difficulty]);

  useEffect(() => {
    if (result !== null || paused) return;
    const timer = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          soundEngine.playAlert();
          setResult({ won: false, scorePct: 0 });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [result, paused]);

  const handlePenaltySeconds = (sec: number) => {
    setTimeLeft((prev) => {
      const next = Math.max(0, prev - sec);
      if (next === 0 && result === null) {
        soundEngine.playAlert();
        setResult({ won: false, scorePct: 0 });
      }
      return next;
    });
  };

  const handleWin = (scorePct: number) => {
    if (result !== null) return;
    setResult({ won: true, scorePct });
  };

  const handleFail = () => {
    if (result !== null) return;
    soundEngine.playAlert();
    setResult({ won: false, scorePct: 0 });
  };

  const commonProps = {
    lang,
    difficulty,
    paused: paused || result !== null,
    timeLeft,
    seed,
    onPenaltySeconds: handlePenaltySeconds,
    onWin: handleWin,
    onFail: handleFail,
  };

  return (
    <div className="fixed inset-0 z-40 bg-[#040813]/85 flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-[#081022] border border-cyan-500/45 rounded-2xl p-5 md:p-6 shadow-2xl my-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3 mb-3">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-amber-300">
              <span>{t(lang, 'mg.badge')}</span>
              <span>·</span>
              <span className={`font-mono tabular-nums ${timeLeft <= 6 ? 'text-rose-400 font-black' : 'text-cyan-300 font-black'}`}>
                {timeLeft}s
              </span>
            </div>
            <h2 className="text-lg md:text-xl font-extrabold text-white mt-0.5">{t(lang, `mg.${kind}.title`)}</h2>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {result === null && (
              <>
                <button
                  type="button"
                  onClick={rerollChallenge}
                  aria-label={t(lang, 'mg.newRandom')}
                  title={t(lang, 'mg.newRandom')}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-cyan-200 flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t(lang, 'mg.newRandom')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaused((p) => !p)}
                  aria-label={paused ? t(lang, 'mg.resume') : t(lang, 'mg.pause')}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1 cursor-pointer"
                >
                  {paused ? <Play className="w-3.5 h-3.5 text-emerald-300" /> : <Pause className="w-3.5 h-3.5 text-amber-300" />}
                  {paused ? t(lang, 'mg.resume') : t(lang, 'mg.pause')}
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label={t(lang, 'bld.close')}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Difficulty Selector */}
        {result === null && (
          <div className="flex items-center justify-between gap-2 mb-3 bg-[#0c162d] border border-slate-800 rounded-xl px-3 py-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {t(lang, 'mg.diff.label')}:
            </span>
            <div className="flex gap-1.5">
              {(['easy', 'normal', 'hard'] as MiniGameDifficulty[]).map((diff) => (
                <button
                  key={diff}
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setDifficulty(diff);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold border cursor-pointer transition-colors ${
                    difficulty === diff
                      ? diff === 'hard'
                        ? 'bg-amber-400 text-slate-950 border-amber-300'
                        : 'bg-cyan-400 text-slate-950 border-cyan-300'
                      : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
                  }`}
                >
                  {t(lang, `mg.diff.${diff}`)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Active Module Mini-Game Surface */}
        <div className="relative">
          {paused && result === null && (
            <div className="absolute inset-0 z-10 bg-[#050814]/85 rounded-xl flex flex-col items-center justify-center gap-2 border border-amber-400/40">
              <div className="text-sm font-extrabold text-amber-300">{t(lang, 'mg.pausedBanner')}</div>
              <button
                type="button"
                onClick={() => setPaused(false)}
                className="px-4 py-2 rounded-xl bg-emerald-400 text-slate-950 text-xs font-extrabold cursor-pointer"
              >
                {t(lang, 'mg.resume')}
              </button>
            </div>
          )}

          <div key={runKey}>
            {kind === 'habitat_systems' && <HabitatMiniGame {...commonProps} />}
            {kind === 'solar_align' && <SolarMiniGame {...commonProps} />}
            {kind === 'greenhouse_balance' && <GreenhouseMiniGame {...commonProps} />}
            {kind === 'water_pipes' && <WaterPipesMiniGame {...commonProps} />}
            {kind === 'oxygen_mix' && <OxygenMiniGame {...commonProps} />}
            {kind === 'comms_tune' && <CommsMiniGame {...commonProps} />}
            {kind === 'shelter_prep' && <ShelterMiniGame {...commonProps} />}
            {kind === 'rover_ice' && <RoverMiniGame {...commonProps} />}
            {kind === 'research_lab' && <ResearchMiniGame {...commonProps} />}
          </div>
        </div>

        {/* Result + Educational Takeaway Footer */}
        {result !== null && (
          <div
            className={`mt-4 p-4 rounded-xl border flex flex-col gap-3 ${
              result.won ? 'bg-emerald-950/50 border-emerald-400/60' : 'bg-amber-950/45 border-amber-500/50'
            }`}
          >
            <div className="flex items-start gap-2 text-sm font-extrabold text-white">
              {result.won ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <Sparkles className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
              )}
              <div>
                <div>{result.won ? t(lang, `mg.${kind}.win`) : t(lang, `mg.${kind}.fail`)}</div>
                {result.won && (
                  <div className="text-xs text-emerald-300 font-bold mt-0.5">
                    {t(lang, `mg.diff.${difficulty}`)} · {result.scorePct}%
                  </div>
                )}
              </div>
            </div>

            <div className="bg-[#081022]/80 border border-slate-700/80 rounded-lg p-2.5 flex items-start gap-2 text-xs text-cyan-200">
              <Lightbulb className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
              <span>{t(lang, `mg.${kind}.learn`)}</span>
            </div>

            <button
              type="button"
              onClick={() =>
                onComplete({
                  kind,
                  won: result.won,
                  difficulty,
                  scorePct: result.scorePct,
                })
              }
              className="w-full py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-extrabold text-xs cursor-pointer"
            >
              {t(lang, 'mg.claim')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
