import React, { useEffect, useState } from 'react';
import { Droplet, Paperclip, Radio, Rocket, Scale, Send, ShieldCheck, Snowflake, Sun, Thermometer, X } from 'lucide-react';
import { t } from '../i18n/translations';
import type { Language } from '../types/game';

interface SpaceCalculatorModalProps {
  lang: Language;
  onClose: () => void;
}

export const SpaceCalculatorModal: React.FC<SpaceCalculatorModalProps> = ({ lang, onClose }) => {
  const [earthWeight, setEarthWeight] = useState(36);
  const [crewCount, setCrewCount] = useState<2 | 4>(2);
  const [signalProgress, setSignalProgress] = useState<number | null>(null);
  const [arcSeed, setArcSeed] = useState(0);
  const [replyReady, setReplyReady] = useState(false);

  const moonWeight = (earthWeight * 0.165).toFixed(1);
  const jumpHeightCm = Math.round(35 * 6);
  const waterSavedLiters = crewCount === 4 ? 34 : 18;
  const weightRatio = (earthWeight - 20) / (95 - 20); // 0..1
  const moonLeapOffset = Math.round(28 - weightRatio * 10);

  useEffect(() => {
    if (signalProgress === null) return;
    if (signalProgress >= 100) {
      setReplyReady(true);
      return;
    }
    const timer = window.setTimeout(() => {
      setSignalProgress((prev) => (prev === null ? null : Math.min(100, prev + 8)));
    }, 180);
    return () => window.clearTimeout(timer);
  }, [signalProgress]);

  const sendHelloSignal = () => {
    setReplyReady(false);
    setArcSeed((prev) => prev + 1);
    setSignalProgress(0);
  };

  // Compute paper-airplane position & rotation along quadratic Bezier arc
  const prog = (signalProgress ?? 0) / 100;
  const goingToEarth = prog <= 0.5;
  const legT = goingToEarth ? prog * 2 : (prog - 0.5) * 2;
  const p0 = goingToEarth ? { x: 46, y: 66 } : { x: 254, y: 66 };
  const ctrlY = arcSeed % 2 === 0 ? 14 : 26;
  const p1 = { x: 150, y: goingToEarth ? ctrlY : 104 };
  const p2 = goingToEarth ? { x: 254, y: 66 } : { x: 46, y: 66 };

  const planeX = (1 - legT) * (1 - legT) * p0.x + 2 * (1 - legT) * legT * p1.x + legT * legT * p2.x;
  const planeY = (1 - legT) * (1 - legT) * p0.y + 2 * (1 - legT) * legT * p1.y + legT * legT * p2.y;
  const dx = 2 * (1 - legT) * (p1.x - p0.x) + 2 * legT * (p2.x - p1.x);
  const dy = 2 * (1 - legT) * (p1.y - p0.y) + 2 * legT * (p2.y - p1.y);
  const planeAngle = (Math.atan2(dy, dx) * 180) / Math.PI;

  return (
    <div className="fixed inset-0 z-40 bg-[#040813]/85 flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-[#081022] border border-cyan-500/40 rounded-2xl p-5 md:p-6 shadow-2xl my-auto max-h-[92vh] overflow-y-auto">
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
          {/* 1. Dynamic Weight & Jump Astronaut Silhouette Comparator */}
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

            {/* Dynamic Silhouettes SVG */}
            <svg viewBox="0 0 300 105" className="w-full h-28 bg-[#081020] rounded-xl border border-slate-700">
              {/* Earth Side (Heavy / Grounded) */}
              <rect x="0" y="88" width="150" height="17" fill="#1e3a8a" opacity="0.55" />
              <line x1="150" y1="8" x2="150" y2="97" stroke="#334155" strokeDasharray="3 3" />
              <g transform={`translate(75, ${56 + weightRatio * 7}) scale(${1 + weightRatio * 0.16}, ${1 - weightRatio * 0.1})`}>
                <circle cx="0" cy="-16" r="8" fill="#e2e8f0" />
                <rect x="-5" y="-19" width="10" height="6" rx="3" fill="#38bdf8" />
                <rect x="-9" y="-6" width="18" height="20" rx="5" fill="#cbd5e1" />
                <rect x="-8" y="14" width="6" height="12" rx="2" fill="#94a3b8" />
                <rect x="2" y="14" width="6" height="12" rx="2" fill="#94a3b8" />
              </g>
              <text x="16" y="18" fill="#94a3b8" fontSize="9" fontWeight="bold">
                1G {t(lang, 'calc.earth').toUpperCase()}
              </text>

              {/* Moon Side (High Leaping Silhouette) */}
              <rect x="150" y="88" width="150" height="17" fill="#334155" opacity="0.6" />
              <path d="M 225 86 L 225 46" stroke="#22d3ee" strokeWidth="1.5" strokeDasharray="3 3" />
              <g transform={`translate(225, ${50 - moonLeapOffset})`}>
                <circle cx="0" cy="-14" r="7.5" fill="#f8fafc" />
                <rect x="-4.5" y="-17" width="9" height="5.5" rx="2.5" fill="#facc15" />
                <rect x="-7" y="-5" width="14" height="18" rx="4.5" fill="#e2e8f0" />
                <line x1="-7" y1="-2" x2="-15" y2="-9" stroke="#e2e8f0" strokeWidth="3.5" strokeLinecap="round" />
                <line x1="7" y1="-2" x2="15" y2="-9" stroke="#e2e8f0" strokeWidth="3.5" strokeLinecap="round" />
                <line x1="-4" y1="13" x2="-8" y2="23" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" />
                <line x1="4" y1="13" x2="8" y2="23" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" />
              </g>
              <text x="164" y="18" fill="#22d3ee" fontSize="9" fontWeight="bold">
                1/6 G {t(lang, 'calc.moon').toUpperCase()}
              </text>
            </svg>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-[#081020] border border-slate-700 rounded-xl p-2.5 text-center">
                <div className="text-[11px] text-slate-400">{t(lang, 'calc.earth')}</div>
                <div className="text-xl font-black text-white tabular-nums">{earthWeight} kg</div>
                <div className="text-[11px] text-slate-300">{t(lang, 'calc.jumpEarth')}: 35 cm</div>
              </div>
              <div className="bg-cyan-950/45 border border-cyan-500/45 rounded-xl p-2.5 text-center">
                <div className="text-[11px] text-cyan-300">{t(lang, 'calc.moon')} (1/6)</div>
                <div className="text-xl font-black text-cyan-300 tabular-nums">{moonWeight} kg</div>
                <div className="text-[11px] text-emerald-300 font-bold">
                  {t(lang, 'calc.jumpMoon')}: ~{jumpHeightCm} cm
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed">{t(lang, 'calc.weight.fact')}</p>
          </div>

          {/* 2. Light-Speed Paper-Airplane Radio Curve */}
          <div className="bg-[#0c162d] border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-violet-300 mb-1.5">
                <Radio className="w-4 h-4" />
                {t(lang, 'calc.radio.title')}
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{t(lang, 'calc.radio.desc')}</p>
            </div>

            <div className="bg-[#081020] border border-slate-700 rounded-xl p-3 space-y-2">
              <div className="flex justify-between text-[11px] font-bold text-slate-300">
                <span>{t(lang, 'calc.moon')}</span>
                <span className="text-cyan-300">384,400 km</span>
                <span>{t(lang, 'calc.earth')}</span>
              </div>

              <svg viewBox="0 0 300 116" className="w-full h-28 select-none" aria-label={t(lang, 'calc.radio.paperPlaneHint')}>
                {/* Outbound & return radio arcs */}
                <path
                  d={`M 46 66 Q 150 ${ctrlY} 254 66`}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  opacity="0.55"
                />
                <path
                  d="M 254 66 Q 150 104 46 66"
                  fill="none"
                  stroke="#a78bfa"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  opacity="0.55"
                />
                {/* Moon Orb */}
                <circle cx="38" cy="66" r="18" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1.5" />
                <circle cx="33" cy="61" r="4" fill="#94a3b8" />
                <circle cx="43" cy="72" r="3" fill="#94a3b8" />
                {/* Earth Orb */}
                <circle cx="262" cy="66" r="21" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.5" />
                <path d="M 254 57 Q 264 62 259 73 Q 270 76 273 63 Z" fill="#4ade80" opacity="0.85" />

                {/* Flying Paper Airplane Messenger */}
                {signalProgress !== null && (
                  <g transform={`translate(${planeX}, ${planeY}) rotate(${planeAngle})`}>
                    <polygon points="-10,-6 12,0 -10,6 -5,0" fill="#f8fafc" stroke="#38bdf8" strokeWidth="1.2" />
                    <line x1="-5" y1="0" x2="12" y2="0" stroke="#0284c7" strokeWidth="1" />
                  </g>
                )}
              </svg>

              <div className="text-[11px] text-center text-slate-400 flex items-center justify-center gap-1">
                <Paperclip className="w-3 h-3 text-cyan-400" />
                <span>{t(lang, 'calc.radio.paperPlaneHint')}</span>
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

          {/* 3. Visual Water Recycling Tank & Rocket Comparison */}
          <div className="bg-[#0c162d] border border-slate-800 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-cyan-300">
                <Droplet className="w-4 h-4" />
                {t(lang, 'calc.water.title')}
              </div>
              <div className="flex gap-1">
                {([2, 4] as const).map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setCrewCount(sz)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border cursor-pointer ${
                      crewCount === sz
                        ? 'bg-cyan-400 text-slate-950 border-cyan-300'
                        : 'bg-slate-900 text-slate-300 border-slate-700'
                    }`}
                  >
                    {sz} crew
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 bg-[#081020] border border-slate-700 rounded-xl p-3">
              {/* Closed Loop Tank SVG */}
              <svg viewBox="0 0 64 64" className="w-16 h-16 shrink-0">
                <rect x="12" y="8" width="40" height="48" rx="8" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
                <rect x="14" y={crewCount === 4 ? 14 : 24} width="36" height={crewCount === 4 ? 40 : 30} rx="5" fill="#0284c7" opacity="0.8" />
                <path d="M 16 28 Q 32 23 48 28" fill="none" stroke="#7dd3fc" strokeWidth="2" />
                <text x="32" y="42" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">
                  90%
                </text>
              </svg>
              <div>
                <div className="text-2xl font-black text-emerald-300 tabular-nums">
                  {waterSavedLiters} L / {lang === 'es' ? 'día' : 'day'}
                </div>
                <div className="text-[11px] font-semibold text-cyan-200">{t(lang, 'calc.water.tankLabel')}</div>
                <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                  <Rocket className="w-3 h-3 text-amber-300" />
                  <span>
                    {waterSavedLiters * 7} L / {lang === 'es' ? 'semana' : 'week'} · {t(lang, 'calc.water.rocketSaved')}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">{t(lang, 'calc.water.fact')}</p>
          </div>

          {/* 4. Illustrated Hot vs Freezing Lunar Temperatures */}
          <div className="bg-[#0c162d] border border-slate-800 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-amber-300">
              <Thermometer className="w-4 h-4" />
              {t(lang, 'calc.temp.title')}
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-2.5 flex items-center gap-2.5">
                <Sun className="w-7 h-7 text-yellow-300 shrink-0" />
                <div>
                  <div className="text-base font-black text-amber-200 tabular-nums">+120 °C</div>
                  <div className="text-[10px] font-semibold text-amber-300">{t(lang, 'calc.temp.hotSide')}</div>
                </div>
              </div>
              <div className="bg-sky-950/40 border border-sky-500/40 rounded-xl p-2.5 flex items-center gap-2.5">
                <Snowflake className="w-7 h-7 text-sky-300 shrink-0" />
                <div>
                  <div className="text-base font-black text-sky-200 tabular-nums">-175 °C</div>
                  <div className="text-[10px] font-semibold text-sky-300">{t(lang, 'calc.temp.coldSide')}</div>
                </div>
              </div>
            </div>

            <div className="bg-[#081020] border border-slate-700 rounded-lg px-3 py-1.5 flex items-center gap-2 text-[11px] text-emerald-300 font-semibold">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>MOONSTAR Habitat Thermal Insulation: +21 °C Stable</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">{t(lang, 'calc.temp.fact')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
