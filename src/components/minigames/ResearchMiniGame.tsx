import React, { useMemo, useState } from 'react';
import { CheckCircle2, Dna, FlaskConical, Microscope, Snowflake, Waves } from 'lucide-react';
import { soundEngine } from '../../audio/soundEngine';
import { createPrng, type LabInstrumentId, RESEARCH_CASES } from '../../engine/minigames';
import { t } from '../../i18n/translations';
import type { MiniGameComponentProps } from './types';

const INSTRUMENTS: Array<{ id: LabInstrumentId; icon: React.ReactNode }> = [
  { id: 'spectrometer', icon: <Waves className="w-4 h-4 text-violet-300" /> },
  { id: 'microscope', icon: <Microscope className="w-4 h-4 text-cyan-300" /> },
  { id: 'cryo_probe', icon: <Snowflake className="w-4 h-4 text-sky-300" /> },
  { id: 'biosensor', icon: <Dna className="w-4 h-4 text-emerald-300" /> },
];

export const ResearchMiniGame: React.FC<MiniGameComponentProps> = ({
  lang,
  difficulty,
  paused,
  timeLeft,
  seed,
  onPenaltySeconds,
  onWin,
}) => {
  const { activeCase, shuffledInstruments, shuffledOptions, correctOptionId, targetFreq, startWavelength } =
    useMemo(() => {
      const rng = createPrng(seed + 53);
      const chosen = RESEARCH_CASES[Math.floor(rng() * RESEARCH_CASES.length)];
      const instCopy = [...INSTRUMENTS];
      for (let i = instCopy.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [instCopy[i], instCopy[j]] = [instCopy[j], instCopy[i]];
      }
      const indexedOpts = chosen.optionsKeys.map((key, idx) => ({ key, origIdx: idx }));
      for (let i = indexedOpts.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [indexedOpts[i], indexedOpts[j]] = [indexedOpts[j], indexedOpts[i]];
      }
      const jitter = Math.round((rng() - 0.5) * 14);
      const tFreq = Math.max(22, Math.min(78, chosen.targetFrequency + jitter));
      const startW = tFreq > 50 ? Math.round(14 + rng() * 20) : Math.round(62 + rng() * 22);
      return {
        activeCase: chosen,
        shuffledInstruments: instCopy,
        shuffledOptions: indexedOpts,
        correctOptionId: chosen.correctOptionIndex,
        targetFreq: tFreq,
        startWavelength: startW,
      };
    }, [seed]);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [wavelength, setWavelength] = useState(startWavelength);
  const [feedbackErr, setFeedbackErr] = useState(false);

  const tol = difficulty === 'hard' ? 5 : difficulty === 'normal' ? 7 : 10;
  const calibrated = Math.abs(wavelength - targetFreq) <= tol;

  const pickInstrument = (id: LabInstrumentId) => {
    if (paused) return;
    if (id === activeCase.correctInstrument) {
      soundEngine.playActionSuccess();
      setFeedbackErr(false);
      setStep(2);
    } else {
      soundEngine.playAlert();
      setFeedbackErr(true);
      onPenaltySeconds(2);
    }
  };

  const lockCalibration = () => {
    if (paused) return;
    if (calibrated) {
      soundEngine.playActionSuccess();
      setFeedbackErr(false);
      setStep(3);
    } else {
      soundEngine.playAlert();
      setFeedbackErr(true);
      onPenaltySeconds(2);
    }
  };

  const pickConclusion = (origIdx: number) => {
    if (paused) return;
    if (origIdx === correctOptionId) {
      soundEngine.playActionSuccess();
      onWin(Math.min(100, Math.round(70 + timeLeft * 0.9)));
    } else {
      soundEngine.playAlert();
      setFeedbackErr(true);
      onPenaltySeconds(3);
    }
  };

  return (
    <div className="space-y-3">
      <div className="bg-[#0c162d] border border-purple-500/40 rounded-xl p-3">
        <div className="flex items-center gap-2 text-xs font-extrabold text-purple-300">
          <FlaskConical className="w-4 h-4" />
          {t(lang, activeCase.sampleTitleKey)}
        </div>
        <p className="text-xs text-slate-200 mt-1">{t(lang, activeCase.clueKey)}</p>
      </div>

      {/* Step 1: Instrument */}
      <div className={`rounded-xl border p-3 ${step === 1 ? 'bg-[#0c162d] border-cyan-400/50' : 'bg-[#091224] border-slate-800 opacity-75'}`}>
        <div className="flex items-center justify-between text-xs font-bold text-cyan-300 mb-2">
          <span>{t(lang, 'mg.res.step1')}</span>
          {step > 1 && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
        </div>
        {step === 1 && (
          <div className="grid grid-cols-2 gap-2">
            {shuffledInstruments.map((inst) => (
              <button
                key={inst.id}
                type="button"
                onClick={() => pickInstrument(inst.id)}
                className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-cyan-400 text-xs font-bold text-white flex items-center gap-2 cursor-pointer"
              >
                {inst.icon}
                <span>{t(lang, `mg.res.inst.${inst.id}`)}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Step 2: Wavelength Calibration */}
      {step >= 2 && (
        <div className={`rounded-xl border p-3 ${step === 2 ? 'bg-[#0c162d] border-cyan-400/50' : 'bg-[#091224] border-slate-800 opacity-75'}`}>
          <div className="flex items-center justify-between text-xs font-bold text-cyan-300 mb-2">
            <span>{t(lang, 'mg.res.step2')}</span>
            {step > 2 && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          </div>
          {step === 2 && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-200 tabular-nums">
                <span>
                  {wavelength} nm ({t(lang, 'mg.comms_tune.target')}: ~{targetFreq} nm)
                </span>
                <span className={calibrated ? 'text-emerald-300 font-bold' : 'text-amber-300'}>
                  {calibrated ? 'OK' : '...'}
                </span>
              </div>
              <input
                type="range"
                min={10}
                max={90}
                value={wavelength}
                onChange={(e) => setWavelength(Number(e.target.value))}
                className="w-full accent-purple-400 cursor-pointer"
              />
              <button
                type="button"
                onClick={lockCalibration}
                className={`w-full py-2 rounded-xl font-extrabold text-xs cursor-pointer ${
                  calibrated ? 'bg-emerald-400 text-slate-950' : 'bg-slate-800 text-slate-300'
                }`}
              >
                {lang === 'es' ? 'Calibrar Sensor' : 'Calibrate Sensor'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Interpret Result */}
      {step === 3 && (
        <div className="rounded-xl border border-emerald-400/50 bg-[#0c162d] p-3 space-y-2">
          <div className="text-xs font-bold text-emerald-300">{t(lang, 'mg.res.step3')}</div>
          <p className="text-xs font-semibold text-white">{t(lang, activeCase.questionKey)}</p>
          <div className="flex flex-col gap-1.5">
            {shuffledOptions.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => pickConclusion(opt.origIdx)}
                className="text-left px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-emerald-400 text-xs font-semibold text-slate-200 cursor-pointer"
              >
                {t(lang, opt.key)}
              </button>
            ))}
          </div>
        </div>
      )}

      {feedbackErr && (
        <div className="text-[11px] font-bold text-amber-300 text-center">(-2s / -3s)</div>
      )}
    </div>
  );
};
