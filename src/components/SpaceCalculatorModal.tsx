import React, { useEffect, useState } from 'react';
import { Droplet, Radio, Scale, Send, Thermometer, X } from 'lucide-react';
import { t } from '../i18n/translations';
import type { Language } from '../types/game';

interface SpaceCalculatorModalProps {
  lang: Language;
  onClose: () => void;
}

export const SpaceCalculatorModal: React.FC<SpaceCalculatorModalProps> = ({ lang, onClose }) => {
  const [earthWeight, setEarthWeight] = useState(36);
  const [signalProgress, setSignalProgress] = useState<number | null>(null);
  const [replyReady, setReplyReady] = useState(false);

  const moonWeight = (earthWeight * 0.165).toFixed(1);
  const jumpHeightCm = Math.round(35 * 6); // 35cm Earth jump -> ~210cm on Moon!
  const waterSavedLiters = 18; // Recycled daily for 2-4 crew closed loop

  useEffect(() => {
    if (signalProgress === null) return;
    if (signalProgress >= 100) {
      setReplyReady(true);
      return;
    }
    const timer = window.setTimeout(() => {
      setSignalProgress((prev) => (prev === null ? null : Math.min(100, prev + 8)));
    }, 200);
    return () => window.clearTimeout(timer);
  }, [signalProgress]);

  const sendHelloSignal = () => {
    setReplyReady(false);
    setSignalProgress(0);
  };

  return (
    <div className="fixed inset-0 z-40 bg-[#040813]/85 flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-3xl bg-[#081022] border border-cyan-500/40 rounded-2xl p-6 shadow-2xl my-auto">
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4 mb-5">
          <div>
            <h2 className="text-xl md:text-2xl font-extrabold text-white">{t(lang, 'calc.title')}</h2>
            <p className="text-xs md:text-sm text-cyan-300 mt-0.5">{t(lang, 'calc.subtitle')}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t(lang, 'bld.close')}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Weight & Jump Comparator */}
          <div className="bg-[#0c162d] border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-cyan-300">
              <Scale className="w-4 h-4" />
              {t(lang, 'calc.weight.title')}
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-200 mb-1">
                <span>{t(lang, 'calc.weight.slider')}</span>
                <span className="font-extrabold text-cyan-300 tabular-nums">{earthWeight} kg</span>
              </div>
              <input
                type="range"
                min={20}
                max={95}
                value={earthWeight}
                onChange={(e) => setEarthWeight(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div className="bg-[#081020] border border-slate-700 rounded-xl p-3 text-center">
                <div className="text-[11px] text-slate-400">{t(lang, 'calc.earth')}</div>
                <div className="text-2xl font-black text-white tabular-nums mt-0.5">{earthWeight} kg</div>
                <div className="text-[11px] text-slate-300 mt-1">{t(lang, 'calc.jumpEarth')}: 35 cm</div>
              </div>
              <div className="bg-cyan-950/45 border border-cyan-500/45 rounded-xl p-3 text-center">
                <div className="text-[11px] text-cyan-300">{t(lang, 'calc.moon')} (1/6)</div>
                <div className="text-2xl font-black text-cyan-300 tabular-nums mt-0.5">{moonWeight} kg</div>
                <div className="text-[11px] text-emerald-300 font-bold mt-1">
                  {t(lang, 'calc.jumpMoon')}: ~{jumpHeightCm} cm
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed">{t(lang, 'calc.weight.fact')}</p>
          </div>

          {/* Interactive Light-Speed Radio Delay Tester */}
          <div className="bg-[#0c162d] border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-violet-300 mb-2">
                <Radio className="w-4 h-4" />
                {t(lang, 'calc.radio.title')}
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{t(lang, 'calc.radio.desc')}</p>
            </div>

            <div className="bg-[#081020] border border-slate-700 rounded-xl p-3 space-y-2">
              <div className="flex justify-between text-[11px] font-bold text-slate-300">
                <span>🌕 {t(lang, 'calc.moon')}</span>
                <span className="text-cyan-300">384,400 km</span>
                <span>🌍 {t(lang, 'calc.earth')}</span>
              </div>
              <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-violet-400 transition-all duration-150"
                  style={{ width: `${signalProgress ?? 0}%` }}
                />
              </div>
              <div className="text-xs text-center font-semibold min-h-[20px]">
                {replyReady ? (
                  <span className="text-emerald-300">{t(lang, 'calc.radio.reply')}</span>
                ) : signalProgress !== null ? (
                  <span className="text-amber-300">{t(lang, 'calc.radio.traveling')}</span>
                ) : (
                  <span className="text-slate-400">{t(lang, 'calc.radio.ready')}</span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={sendHelloSignal}
              className="w-full py-2.5 px-4 rounded-xl bg-violet-400 hover:bg-violet-300 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Send className="w-4 h-4" />
              {t(lang, 'calc.radio.btn')}
            </button>
          </div>

          {/* Water Recycling & Temperature Extremes */}
          <div className="bg-[#0c162d] border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-cyan-300">
              <Droplet className="w-4 h-4" />
              {t(lang, 'calc.water.title')}
            </div>
            <div className="text-2xl font-black text-emerald-300 tabular-nums">
              {waterSavedLiters} L / {lang === 'es' ? 'día reciclados' : 'day recycled'}
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{t(lang, 'calc.water.fact')}</p>
          </div>

          <div className="bg-[#0c162d] border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-amber-300">
              <Thermometer className="w-4 h-4" />
              {t(lang, 'calc.temp.title')}
            </div>
            <div className="flex items-center justify-between gap-2 text-xs font-bold pt-1">
              <div className="flex-1 bg-amber-950/40 border border-amber-500/40 rounded-lg p-2 text-center text-amber-300">
                ☀️ +120 °C
              </div>
              <div className="flex-1 bg-sky-950/40 border border-sky-500/40 rounded-lg p-2 text-center text-sky-300">
                🌑 -175 °C
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{t(lang, 'calc.temp.fact')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
