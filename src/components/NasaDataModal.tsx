import React, { useEffect, useState } from 'react';
import { Activity, AlertCircle, Dna, ExternalLink, Lightbulb, Play, RefreshCw, Search, Sun, X } from 'lucide-react';
import { t } from '../i18n/translations';
import type { DonkiEventItem, DonkiResponse, Language, OsdrResponse, RadLabResponse } from '../types/game';

interface NasaDataModalProps {
  lang: Language;
  canSimulateInMission?: boolean;
  onSimulateWeather?: (ev: DonkiEventItem) => void;
  onClose: () => void;
}

export const NasaDataModal: React.FC<NasaDataModalProps> = ({
  lang,
  canSimulateInMission = false,
  onSimulateWeather,
  onClose,
}) => {
  const [tab, setTab] = useState<'donki' | 'osdr' | 'radlab'>('donki');
  const [donki, setDonki] = useState<DonkiResponse | null>(null);
  const [osdr, setOsdr] = useState<OsdrResponse | null>(null);
  const [radlab, setRadlab] = useState<RadLabResponse | null>(null);
  const [osdrQuery, setOsdrQuery] = useState('spaceflight OR arabidopsis OR bone OR radiation');
  const [loading, setLoading] = useState(false);

  const loadAll = async (forceRefresh = false, customOsdrQuery?: string) => {
    setLoading(true);
    const refreshParam = forceRefresh ? '&refresh=1' : '';
    const q = customOsdrQuery ?? osdrQuery;
    try {
      const [dRes, oRes, rRes] = await Promise.all([
        fetch(`/api/nasa/donki?${forceRefresh ? 'refresh=1' : ''}`),
        fetch(`/api/nasa/osdr?q=${encodeURIComponent(q)}${refreshParam}`),
        fetch(`/api/nasa/radlab?${forceRefresh ? 'refresh=1' : ''}`),
      ]);
      if (dRes.ok) {
        setDonki((await dRes.json()) as DonkiResponse);
      }
      if (oRes.ok) {
        setOsdr((await oRes.json()) as OsdrResponse);
      }
      if (rRes.ok) {
        setRadlab((await rRes.json()) as RadLabResponse);
      }
    } catch {
      // Handled gracefully by empty/retry UI
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll(false);
  }, []);

  const handleOsdrSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!osdrQuery.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/nasa/osdr?q=${encodeURIComponent(osdrQuery.trim())}&refresh=1`);
      if (res.ok) {
        setOsdr((await res.json()) as OsdrResponse);
      }
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 bg-[#040813]/85 flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-[#081022] border border-cyan-500/40 rounded-2xl p-6 shadow-2xl my-auto max-h-[90vh] flex flex-col">
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-xl md:text-2xl font-extrabold text-white">{t(lang, 'nasa.title')}</h2>
            <p className="text-xs md:text-sm text-cyan-300 mt-0.5">{t(lang, 'nasa.subtitle')}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void loadAll(true)}
              disabled={loading}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-cyan-300 flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              {t(lang, 'nasa.refresh')}
            </button>
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

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 my-4">
          <button
            type="button"
            onClick={() => setTab('donki')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border cursor-pointer ${
              tab === 'donki'
                ? 'bg-cyan-400 text-slate-950 border-cyan-300'
                : 'bg-[#0d162c] text-slate-200 border-slate-700 hover:border-slate-500'
            }`}
          >
            <Sun className="w-4 h-4" />
            {t(lang, 'nasa.tab.donki')}
          </button>
          <button
            type="button"
            onClick={() => setTab('osdr')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border cursor-pointer ${
              tab === 'osdr'
                ? 'bg-emerald-400 text-slate-950 border-emerald-300'
                : 'bg-[#0d162c] text-slate-200 border-slate-700 hover:border-slate-500'
            }`}
          >
            <Dna className="w-4 h-4" />
            {t(lang, 'nasa.tab.osdr')}
          </button>
          <button
            type="button"
            onClick={() => setTab('radlab')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border cursor-pointer ${
              tab === 'radlab'
                ? 'bg-amber-400 text-slate-950 border-amber-300'
                : 'bg-[#0d162c] text-slate-200 border-slate-700 hover:border-slate-500'
            }`}
          >
            <Activity className="w-4 h-4" />
            {t(lang, 'nasa.tab.radlab')}
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto pr-1 flex-1 space-y-3">
          {tab === 'donki' && (
            <>
              {loading && !donki && <div className="text-sm text-slate-300 py-8 text-center">{t(lang, 'nasa.loading')}</div>}
              {donki && (
                <>
                  <div className="bg-[#0d162c] border border-slate-700 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span
                        className={`text-xs font-extrabold px-2 py-0.5 rounded ${
                          donki.sourceType === 'live'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {donki.sourceType === 'live' ? t(lang, 'nasa.source.live') : t(lang, 'nasa.source.archived')}
                      </span>
                      <p className="text-xs text-slate-300 mt-1">{donki.note}</p>
                      {donki.endpoint && (
                        <p className="text-[10px] text-slate-400 mt-0.5 break-all">
                          {t(lang, 'nasa.endpoint')}: {donki.endpoint}
                        </p>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400">{donki.sourceName}</span>
                  </div>

                  <div className="bg-cyan-950/35 border border-cyan-500/35 rounded-xl p-3.5 flex items-start gap-2.5">
                    <Lightbulb className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-extrabold text-cyan-200">{t(lang, 'nasa.kid.title')}</div>
                      <p className="text-xs text-slate-200 mt-0.5 leading-relaxed">{t(lang, 'nasa.kid.donki')}</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-3">
                    {donki.events.map((ev) => (
                      <div key={ev.id} className="bg-[#0c1528] border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between gap-2">
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-xs font-extrabold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                              {ev.type} {ev.classType ? `· ${ev.classType}` : ''}
                              {ev.speedKms ? `· ${ev.speedKms} km/s` : ''}
                              {ev.kpIndex ? `· Kp ${ev.kpIndex}` : ''}
                            </span>
                            <span className="text-[11px] text-slate-400 tabular-nums">{ev.date.slice(0, 16).replace('T', ' ')} UTC</span>
                          </div>
                          <p className="text-xs text-slate-200 mt-1.5 leading-relaxed">{ev.summary}</p>
                        </div>

                        <div className="space-y-2 pt-1">
                          <div className="flex items-center justify-between text-[11px] text-slate-400">
                            <span>{ev.sourceLocation}</span>
                            <a
                              href={ev.link}
                              target="_blank"
                              rel="noreferrer"
                              className="text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1"
                            >
                              NASA DONKI <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                          {canSimulateInMission && onSimulateWeather && (
                            <button
                              type="button"
                              onClick={() => onSimulateWeather(ev)}
                              className="w-full py-2 px-3 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                              {t(lang, 'nasa.simulateWeather')}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}

          {tab === 'osdr' && (
            <div className="space-y-3">
              <div className="bg-emerald-950/35 border border-emerald-500/35 rounded-xl p-3.5 flex items-start gap-2.5">
                <Lightbulb className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-extrabold text-emerald-200">{t(lang, 'nasa.kid.title')}</div>
                  <p className="text-xs text-slate-200 mt-0.5 leading-relaxed">{t(lang, 'nasa.kid.osdr')}</p>
                </div>
              </div>

              <form onSubmit={handleOsdrSearch} className="flex flex-wrap gap-2">
                <input
                  type="text"
                  value={osdrQuery}
                  onChange={(e) => setOsdrQuery(e.target.value)}
                  placeholder={t(lang, 'nasa.osdr.searchPlaceholder')}
                  className="flex-1 min-w-[220px] px-3 py-2 rounded-xl bg-[#0d162c] border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-400"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-3.5 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" />
                  {t(lang, 'nasa.osdr.searchBtn')}
                </button>
              </form>

              {loading && !osdr && <div className="text-sm text-slate-300 py-8 text-center">{t(lang, 'nasa.loading')}</div>}

              {osdr && (
                <>
                  <div className="bg-[#0d162c] border border-slate-700 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span
                        className={`text-xs font-extrabold px-2 py-0.5 rounded ${
                          osdr.sourceType === 'live'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {osdr.sourceType === 'live' ? t(lang, 'nasa.source.live') : t(lang, 'nasa.source.archived')}
                      </span>
                      <span className="ml-2 text-xs text-emerald-200 font-semibold tabular-nums">
                        {osdr.totalMatches} {t(lang, 'nasa.osdr.matches')}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-1 break-all">
                        {t(lang, 'nasa.endpoint')}: {osdr.endpoint}
                      </p>
                    </div>
                    <span className="text-[11px] text-slate-400">{osdr.sourceName}</span>
                  </div>

                  {osdr.studies.map((study) => (
                    <div key={study.accession} className="bg-[#0c1528] border border-slate-800 rounded-xl p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                              {study.accession}
                            </span>
                            <span className="text-[11px] text-cyan-300 font-semibold">{study.organism}</span>
                            <span className="text-[11px] text-slate-400">{study.center}</span>
                          </div>
                          <h3 className="text-sm font-bold text-white mt-1.5">{study.title}</h3>
                        </div>
                        <a
                          href={study.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1 shrink-0"
                        >
                          OSDR <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <div className="text-[11px] text-emerald-300 mt-1">{study.mission}</div>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">{study.description}</p>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {tab === 'radlab' && (
            <div className="space-y-3">
              <div className="bg-cyan-950/35 border border-cyan-500/35 rounded-xl p-3.5 flex items-start gap-2.5">
                <Lightbulb className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-extrabold text-cyan-200">{t(lang, 'nasa.kid.title')}</div>
                  <p className="text-xs text-slate-200 mt-0.5 leading-relaxed">{t(lang, 'nasa.kid.radlab')}</p>
                </div>
              </div>

              <div className="bg-amber-950/40 border border-amber-500/45 rounded-xl p-3.5 flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-100 leading-relaxed font-medium">
                  {t(lang, 'nasa.radlab.warning')}
                </p>
              </div>

              {loading && !radlab && <div className="text-sm text-slate-300 py-8 text-center">{t(lang, 'nasa.loading')}</div>}

              {radlab && (
                <div className="space-y-2.5">
                  <div className="bg-[#0d162c] border border-slate-700 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span
                        className={`text-xs font-extrabold px-2 py-0.5 rounded ${
                          radlab.sourceType === 'live'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {radlab.sourceType === 'live' ? t(lang, 'nasa.source.live') : t(lang, 'nasa.source.archived')}
                      </span>
                      {radlab.endpoint && (
                        <p className="text-[10px] text-slate-400 mt-1 break-all">
                          {t(lang, 'nasa.endpoint')}: {radlab.endpoint}
                        </p>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400">{radlab.sourceName}</span>
                  </div>

                  {radlab.measurements.map((m) => (
                    <div key={m.id} className="bg-[#0c1528] border border-slate-800 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-bold text-white">{m.instrument}</div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {m.date} · Orbit {m.orbitAltitudeKm} km
                        </div>
                        <p className="text-xs text-slate-300 mt-1">{m.notes}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-extrabold text-amber-300 tabular-nums">
                          {m.doseRate} {m.unit}
                        </div>
                        <div className="text-[10px] uppercase tracking-wider text-slate-400">ISS Orbit Only</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
