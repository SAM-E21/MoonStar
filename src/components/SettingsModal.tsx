import React, { useState } from 'react';
import { Trash2, Volume2, VolumeX, X } from 'lucide-react';
import { t } from '../i18n/translations';
import type { Language } from '../types/game';

interface SettingsModalProps {
  lang: Language;
  onChangeLang: (lang: Language) => void;
  muted: boolean;
  onToggleMute: () => void;
  onClearSave: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  lang,
  onChangeLang,
  muted,
  onToggleMute,
  onClearSave,
  onClose,
}) => {
  const [cleared, setCleared] = useState(false);

  return (
    <div className="fixed inset-0 z-40 bg-[#040813]/82 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#081022] border border-cyan-500/40 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <h2 className="text-lg font-extrabold text-white">{t(lang, 'settings.title')}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t(lang, 'settings.close')}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between bg-[#0d162c] border border-slate-800 rounded-xl p-3.5">
            <span className="text-sm font-semibold text-white">{t(lang, 'menu.language')}</span>
            <div className="flex rounded-lg overflow-hidden border border-slate-700">
              <button
                type="button"
                onClick={() => onChangeLang('es')}
                className={`px-3 py-1.5 text-xs font-bold cursor-pointer ${
                  lang === 'es' ? 'bg-cyan-400 text-slate-950' : 'bg-slate-900 text-slate-300'
                }`}
              >
                Español
              </button>
              <button
                type="button"
                onClick={() => onChangeLang('en')}
                className={`px-3 py-1.5 text-xs font-bold cursor-pointer ${
                  lang === 'en' ? 'bg-cyan-400 text-slate-950' : 'bg-slate-900 text-slate-300'
                }`}
              >
                English
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between bg-[#0d162c] border border-slate-800 rounded-xl p-3.5">
            <span className="text-sm font-semibold text-white">{t(lang, 'settings.audio')}</span>
            <button
              type="button"
              onClick={onToggleMute}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer"
            >
              {muted ? <VolumeX className="w-4 h-4 text-amber-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
              {muted ? 'OFF' : 'ON'}
            </button>
          </div>

          <div className="flex items-center justify-between bg-[#0d162c] border border-slate-800 rounded-xl p-3.5">
            <span className="text-sm font-semibold text-white">{t(lang, 'settings.resetSave')}</span>
            <button
              type="button"
              onClick={() => {
                onClearSave();
                setCleared(true);
              }}
              className="px-3 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900/70 border border-red-500/40 text-xs font-bold text-red-200 flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {cleared ? t(lang, 'settings.saveCleared') : 'Reset'}
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full mt-5 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-extrabold text-sm cursor-pointer"
        >
          {t(lang, 'settings.close')}
        </button>
      </div>
    </div>
  );
};
