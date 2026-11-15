import React from 'react';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';

export interface TelemetryStat {
  label: string;
  value: string | number;
  tone?: 'cyan' | 'amber' | 'emerald' | 'rose' | 'slate';
}

interface MiniGameFrameProps {
  icon: React.ReactNode;
  instruction: string;
  stats: TelemetryStat[];
  progressPct?: number;
  progressTone?: 'cyan' | 'amber' | 'emerald' | 'violet';
  feedback?: { tone: 'success' | 'warning' | 'info'; text: string } | null;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const STAT_TONE_CLASS: Record<NonNullable<TelemetryStat['tone']>, string> = {
  cyan: 'text-cyan-300',
  amber: 'text-amber-300',
  emerald: 'text-emerald-300',
  rose: 'text-rose-300',
  slate: 'text-slate-200',
};

const PROGRESS_BAR_CLASS: Record<NonNullable<MiniGameFrameProps['progressTone']>, string> = {
  cyan: 'bg-cyan-400',
  amber: 'bg-amber-400',
  emerald: 'bg-emerald-400',
  violet: 'bg-violet-400',
};

export const MiniGameFrame: React.FC<MiniGameFrameProps> = ({
  icon,
  instruction,
  stats,
  progressPct,
  progressTone = 'cyan',
  feedback,
  children,
  footer,
}) => {
  const clampedPct = progressPct !== undefined ? Math.max(0, Math.min(100, Math.round(progressPct))) : null;

  return (
    <div className="space-y-3">
      {/* Unified Aerospace Telemetry Header */}
      <div className="bg-[#0b152a] border border-slate-800 rounded-xl px-3.5 py-2.5 space-y-2">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-7 h-7 rounded-lg bg-[#071022] border border-slate-700 flex items-center justify-center shrink-0">
              {icon}
            </div>
            <p className="text-xs font-bold text-slate-200 leading-snug">{instruction}</p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {stats.map((st) => (
              <div key={st.label} className="text-right">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{st.label}</div>
                <div className={`text-xs font-black font-mono tabular-nums ${STAT_TONE_CLASS[st.tone ?? 'cyan']}`}>
                  {st.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {clampedPct !== null && (
          <div className="h-2 bg-[#060d1c] border border-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-150 rounded-full ${PROGRESS_BAR_CLASS[progressTone]}`}
              style={{ width: `${clampedPct}%` }}
            />
          </div>
        )}
      </div>

      {/* Unified Arena / Board Stage */}
      <div className="bg-[#060d1e] border border-slate-800 rounded-xl p-3">{children}</div>

      {/* Unified Status Feedback & Controls Footer */}
      {(feedback || footer) && (
        <div className="space-y-2">
          {feedback && (
            <div
              className={`px-3 py-2 rounded-lg border text-xs font-bold flex items-center gap-2 ${
                feedback.tone === 'success'
                  ? 'bg-emerald-950/55 border-emerald-500/45 text-emerald-200'
                  : feedback.tone === 'warning'
                    ? 'bg-rose-950/55 border-rose-500/45 text-rose-200'
                    : 'bg-[#0b152a] border-slate-700 text-cyan-200'
              }`}
            >
              {feedback.tone === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : feedback.tone === 'warning' ? (
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              ) : (
                <Info className="w-4 h-4 text-cyan-300 shrink-0" />
              )}
              <span>{feedback.text}</span>
            </div>
          )}
          {footer}
        </div>
      )}
    </div>
  );
};
