import React from 'react';
import { Award, BookOpen, Calculator, Database, Play, RotateCcw, Settings, Volume2, VolumeX } from 'lucide-react';
import type { Language } from '../types/game';
import { t } from '../i18n/translations';

interface TitleScreenProps {
  lang: Language;
  onChangeLang: (lang: Language) => void;
  hasSavedMission: boolean;
  onStartNew: () => void;
  onContinue: () => void;
  onOpenAcademy: () => void;
  onOpenNasa: () => void;
  onOpenCalculator: () => void;
  onOpenPassport: () => void;
  onOpenSettings: () => void;
  muted: boolean;
  onToggleMute: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  lang,
  onChangeLang,
  hasSavedMission,
  onStartNew,
  onContinue,
  onOpenAcademy,
  onOpenNasa,
  onOpenCalculator,
  onOpenPassport,
  onOpenSettings,
  muted,
  onToggleMute,
}) => {
  return (
    <div className="fixed inset-0 z-20 pointer-events-none flex flex-col justify-between p-6 md:p-10">
      {/* Top utility bar */}
      <div className="flex items-center justify-between">
        <div className="pointer-events-auto flex items-center gap-2 bg-[#070d1b]/90 border border-cyan-500/30 rounded-lg px-3 py-1.5 text-xs text-cyan-200 tracking-wider uppercase">
          <span>NASA Space Apps 2026</span>
          <span className="text-slate-600">·</span>
          <span>{lang === 'es' ? 'Equipo Mech Robotix' : 'Team Mech Robotix'}</span>
        </div>

        <div className="pointer-events-auto flex items-center gap-2">
          <div className="flex rounded-lg overflow-hidden border border-slate-700 bg-[#070d1b]/90">
            <button
              type="button"
              onClick={() => onChangeLang('es')}
              className={`px-3 py-1.5 text-xs font-bold cursor-pointer transition-colors ${
                lang === 'es' ? 'bg-cyan-500 text-slate-950' : 'text-slate-300 hover:text-white'
              }`}
              aria-label="Cambiar idioma a Español"
            >
              ES
            </button>
            <button
              type="button"
              onClick={() => onChangeLang('en')}
              className={`px-3 py-1.5 text-xs font-bold cursor-pointer transition-colors ${
                lang === 'en' ? 'bg-cyan-500 text-slate-950' : 'text-slate-300 hover:text-white'
              }`}
              aria-label="Switch language to English"
            >
              EN
            </button>
          </div>

          <button
            type="button"
            onClick={onToggleMute}
            aria-label={muted ? t(lang, 'hud.unmute') : t(lang, 'hud.mute')}
            className="p-2 rounded-lg bg-[#070d1b]/90 border border-slate-700 text-slate-200 hover:border-cyan-400 hover:text-cyan-300 cursor-pointer"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Left-third Title Lockup & Menu Actions over calm dark space */}
      <div className="pointer-events-auto max-w-md bg-[#060b18]/88 border border-cyan-500/25 rounded-2xl p-6 md:p-7 shadow-2xl">
        {/* Bespoke Inline SVG Title Crest */}
        <div className="flex items-center gap-3.5 mb-3">
          <svg
            viewBox="0 0 64 64"
            className="w-14 h-14 shrink-0"
            aria-hidden="true"
          >
            <circle cx="32" cy="32" r="29" fill="#09152b" stroke="#38bdf8" strokeWidth="2" />
            <path d="M12 42 Q32 28 52 42" fill="none" stroke="#94a3b8" strokeWidth="2" />
            <circle cx="44" cy="18" r="5" fill="#38bdf8" />
            <path d="M20 38 L32 16 L44 38 Z" fill="none" stroke="#e2e8f0" strokeWidth="2.4" strokeLinejoin="round" />
            <circle cx="32" cy="29" r="3" fill="#facc15" />
          </svg>
          <div>
            <h1 className="text-4xl md:text-5xl font-black tracking-[0.14em] text-white leading-none">
              MOONSTAR
            </h1>
            <p className="text-cyan-300 text-sm font-semibold tracking-wide mt-1">
              {t(lang, 'app.subtitle')}
            </p>
            <p className="text-[11px] font-bold tracking-wider uppercase text-amber-300 mt-1">
              {lang === 'es' ? 'Equipo Mech Robotix' : 'Team Mech Robotix'}
            </p>
          </div>
        </div>

        <p className="text-slate-300 text-sm mb-6 border-l-2 border-cyan-400/60 pl-3">
          {t(lang, 'app.tagline')}
        </p>

        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            data-start="true"
            onClick={onStartNew}
            className="w-full py-3.5 px-5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-extrabold text-base flex items-center justify-center gap-2.5 transition-colors cursor-pointer shadow-lg"
          >
            <Play className="w-5 h-5 fill-current" />
            {t(lang, 'menu.start')}
          </button>

          <button
            type="button"
            disabled={!hasSavedMission}
            onClick={onContinue}
            className={`w-full py-2.5 px-4 rounded-xl border font-semibold text-sm flex items-center justify-center gap-2 transition-colors ${
              hasSavedMission
                ? 'bg-slate-800/90 hover:bg-slate-700 border-cyan-500/40 text-white cursor-pointer'
                : 'bg-slate-900/50 border-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            {t(lang, 'menu.continue')}
          </button>

          <div className="grid grid-cols-3 gap-2 pt-1">
            <button
              type="button"
              onClick={onOpenAcademy}
              className="py-2.5 px-2 rounded-xl bg-[#0d162c] hover:bg-slate-800 border border-slate-700 text-slate-100 text-xs font-semibold flex flex-col items-center gap-1 cursor-pointer transition-colors"
            >
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <span className="text-center leading-tight">{t(lang, 'menu.academy')}</span>
            </button>

            <button
              type="button"
              onClick={onOpenNasa}
              className="py-2.5 px-2 rounded-xl bg-[#0d162c] hover:bg-slate-800 border border-slate-700 text-slate-100 text-xs font-semibold flex flex-col items-center gap-1 cursor-pointer transition-colors"
            >
              <Database className="w-4 h-4 text-cyan-400" />
              <span className="text-center leading-tight">{t(lang, 'menu.nasa')}</span>
            </button>

            <button
              type="button"
              onClick={onOpenCalculator}
              className="py-2.5 px-2 rounded-xl bg-[#0d162c] hover:bg-slate-800 border border-slate-700 text-slate-100 text-xs font-semibold flex flex-col items-center gap-1 cursor-pointer transition-colors"
            >
              <Calculator className="w-4 h-4 text-violet-400" />
              <span className="text-center leading-tight">{t(lang, 'menu.calculator')}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onOpenPassport}
              className="py-2 px-3 rounded-xl bg-[#0d162c] hover:bg-slate-800 border border-slate-700 text-slate-100 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Award className="w-4 h-4 text-amber-400" />
              <span>{t(lang, 'menu.passport')}</span>
            </button>

            <button
              type="button"
              onClick={onOpenSettings}
              className="py-2 px-3 rounded-xl bg-[#0d162c] hover:bg-slate-800 border border-slate-700 text-slate-100 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Settings className="w-4 h-4 text-slate-300" />
              <span>{t(lang, 'menu.settings')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Single flat bottom control hint */}
      <div className="text-center text-xs text-slate-400 tracking-wide">
        {t(lang, 'menu.hint')}
      </div>
    </div>
  );
};
