import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { soundEngine } from './audio/soundEngine';
import { AcademyModal } from './components/AcademyModal';
import { EventModal } from './components/EventModal';
import { GameHUD } from './components/GameHUD';
import { MiniGameModal } from './components/MiniGameModal';
import { MissionPrepModal } from './components/MissionPrepModal';
import { MissionReportModal } from './components/MissionReportModal';
import { NasaDataModal } from './components/NasaDataModal';
import { PassportModal } from './components/PassportModal';
import { SettingsModal } from './components/SettingsModal';
import { SpaceCalculatorModal } from './components/SpaceCalculatorModal';
import { TitleScreen } from './components/TitleScreen';
import {
  advanceMissionDay,
  applyMiniGameReward,
  clearMissionFromStorage,
  createInitialMission,
  evaluateBadges,
  generateMissionReport,
  loadMissionFromStorage,
  loadPassportBadges,
  markNasaDataUsed,
  performBuildingAction,
  queueEarthMessage,
  resolveEventChoice,
  saveMissionToStorage,
  startOperationsPhase,
  tickEarthComms,
  toggleBuildingPower,
  triggerDailyEvent,
  triggerRealNasaSpaceWeatherEvent,
  upgradeBuilding,
} from './engine/simulation';
import { LunarOutpostScene } from './three/LunarOutpostScene';
import type {
  BuildingId,
  DonkiEventItem,
  Language,
  MiniGameKind,
  MiniGameOutcome,
  MissionConfig,
  MissionState,
  ScreenMode,
} from './types/game';

export default function App() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<LunarOutpostScene | null>(null);

  const [lang, setLang] = useState<Language>('es');
  const [screen, setScreen] = useState<ScreenMode>('title');
  const [mission, setMission] = useState<MissionState | null>(null);
  const [hasSaved, setHasSaved] = useState<boolean>(() => loadMissionFromStorage() !== null);

  const [selectedBuilding, setSelectedBuilding] = useState<BuildingId | null>(null);
  const [hoveredBuilding, setHoveredBuilding] = useState<BuildingId | null>(null);

  const [showAcademy, setShowAcademy] = useState(false);
  const [showNasa, setShowNasa] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showPassport, setShowPassport] = useState(false);
  const [activeMiniGame, setActiveMiniGame] = useState<MiniGameKind | null>(null);
  const [muted, setMuted] = useState(false);

  // Sync document.body.dataset.state for clean Game Shell state tracking
  useEffect(() => {
    document.body.dataset.state = screen;
  }, [screen]);

  // Support ?autostart=1 to jump directly into active gameplay
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      const initial = startOperationsPhase(
        createInitialMission({
          landingSite: 'shackleton',
          commanderRole: 'engineer',
          priority: 'survival',
          duration: 5,
          crewSize: 2,
          difficulty: 'explorer',
          equipment: ['extra_battery', 'water_filter'],
        }),
      );
      setMission(initial);
      setScreen('playing');
    }
  }, []);

  // Mount Three.js scene once outside React HUD re-renders
  const handleSelectBuilding = useCallback((id: BuildingId | null) => {
    setSelectedBuilding(id);
    if (id) soundEngine.playSelectModule();
  }, []);

  const callbacksRef = useRef({
    onSelectBuilding: handleSelectBuilding,
    onHoverBuilding: setHoveredBuilding,
  });
  callbacksRef.current = {
    onSelectBuilding: handleSelectBuilding,
    onHoverBuilding: setHoveredBuilding,
  };

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    const outpost = new LunarOutpostScene(el, {
      onSelectBuilding: (id) => callbacksRef.current.onSelectBuilding(id),
      onHoverBuilding: (id) => callbacksRef.current.onHoverBuilding(id),
    });
    sceneRef.current = outpost;

    return () => {
      outpost.dispose();
      sceneRef.current = null;
    };
  }, []);

  // Push lightweight state sync to Three.js scene
  useEffect(() => {
    if (!sceneRef.current) return;
    sceneRef.current.updateSyncState({
      mode: screen,
      landingSite: mission?.config.landingSite ?? 'shackleton',
      crewSize: mission?.config.crewSize ?? 2,
      crewSheltered: mission?.crewSheltered ?? false,
      radiationRisk: mission?.radiationRisk ?? 18,
      selectedBuilding,
      buildings:
        mission?.buildings ?? {
          habitat: { id: 'habitat', efficiency: 1, upgraded: false, dustLevel: 5, powered: true, activeBoost: false },
          solar: { id: 'solar', efficiency: 1, upgraded: false, dustLevel: 12, powered: true, activeBoost: false },
          greenhouse: { id: 'greenhouse', efficiency: 1, upgraded: false, dustLevel: 0, powered: true, activeBoost: false },
          water: { id: 'water', efficiency: 1, upgraded: false, dustLevel: 0, powered: true, activeBoost: false },
          oxygen: { id: 'oxygen', efficiency: 1, upgraded: false, dustLevel: 0, powered: true, activeBoost: false },
          comms: { id: 'comms', efficiency: 1, upgraded: false, dustLevel: 0, powered: true, activeBoost: false },
          shelter: { id: 'shelter', efficiency: 1, upgraded: false, dustLevel: 0, powered: true, activeBoost: false },
          rover: { id: 'rover', efficiency: 1, upgraded: false, dustLevel: 8, powered: true, activeBoost: false },
          research: { id: 'research', efficiency: 1, upgraded: false, dustLevel: 0, powered: true, activeBoost: false },
        },
    });
  }, [screen, mission, selectedBuilding]);

  // Persist active mission to localStorage
  useEffect(() => {
    if (mission && mission.status === 'active') {
      saveMissionToStorage(mission);
      setHasSaved(true);
    }
  }, [mission]);

  // Tick Earth–Moon light-speed communication queue every 1s when playing
  useEffect(() => {
    if (screen !== 'playing' || !mission) return;
    const hasPending = mission.commsLog.some((m) => !m.delivered);
    if (!hasPending) return;
    const timer = window.setInterval(() => {
      setMission((prev) => (prev ? tickEarthComms(prev, 1) : prev));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [screen, mission?.commsLog]);

  // Enter / Space shortcut on Title screen
  useEffect(() => {
    if (screen !== 'title' || showAcademy || showNasa || showSettings || showCalculator || showPassport) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        soundEngine.startAmbient();
        soundEngine.playClick();
        setScreen('prep');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [screen, showAcademy, showNasa, showSettings, showCalculator, showPassport]);

  const handleToggleMute = () => {
    const next = !muted;
    setMuted(next);
    soundEngine.setMuted(next);
  };

  const handleLaunchMission = (config: MissionConfig) => {
    soundEngine.startAmbient();
    soundEngine.playLaunch();
    const initial = createInitialMission(config);
    setMission(initial);
    setSelectedBuilding(null);
    setScreen('playing');
  };

  const handleContinueMission = () => {
    const saved = loadMissionFromStorage();
    if (!saved) return;
    soundEngine.startAmbient();
    soundEngine.playClick();
    setMission(saved);
    setSelectedBuilding(null);
    setScreen(saved.status === 'active' ? 'playing' : 'gameover');
  };

  const handleBuildingAction = (id: BuildingId) => {
    soundEngine.playActionSuccess();
    setMission((prev) => (prev ? performBuildingAction(prev, id) : prev));
  };

  const handleBuildingUpgrade = (id: BuildingId) => {
    soundEngine.playActionSuccess();
    setMission((prev) => (prev ? upgradeBuilding(prev, id) : prev));
  };

  const handleBuildingTogglePower = (id: BuildingId) => {
    soundEngine.playClick();
    setMission((prev) => (prev ? toggleBuildingPower(prev, id) : prev));
  };

  const handleEndDay = () => {
    soundEngine.playAlert();
    setSelectedBuilding(null);
    setMission((prev) => (prev ? triggerDailyEvent(prev) : prev));
  };

  const handleSelectChoice = (choiceId: 'A' | 'B' | 'C') => {
    soundEngine.playClick();
    setMission((prev) => (prev ? resolveEventChoice(prev, choiceId) : prev));
  };

  const handleAdvanceDay = () => {
    soundEngine.playActionSuccess();
    setMission((prev) => {
      if (!prev) return prev;
      const next = advanceMissionDay(prev);
      if (next.status !== 'active') {
        clearMissionFromStorage();
        setHasSaved(false);
        setScreen('gameover');
      }
      return next;
    });
  };

  const handleSendComms = (kind: 'status' | 'advice') => {
    soundEngine.playClick();
    setMission((prev) => (prev ? queueEarthMessage(prev, kind) : prev));
  };

  const handleOpenNasaCenter = () => {
    soundEngine.playClick();
    setMission((prev) => markNasaDataUsed(prev));
    setShowNasa(true);
  };

  const handleSimulateRealWeather = (ev: DonkiEventItem) => {
    soundEngine.playAlert();
    setShowNasa(false);
    setSelectedBuilding(null);
    setMission((prev) => (prev ? triggerRealNasaSpaceWeatherEvent(prev, ev) : prev));
  };

  const handleCompleteMiniGame = (outcome: MiniGameOutcome) => {
    if (outcome.won) soundEngine.playActionSuccess();
    else soundEngine.playAlert();
    setActiveMiniGame(null);
    setMission((prev) => (prev ? applyMiniGameReward(prev, outcome) : prev));
  };

  const report = useMemo(() => {
    if (!mission || mission.status === 'active') return null;
    return generateMissionReport(mission);
  }, [mission]);

  const passportBadges = useMemo(() => {
    const stored = loadPassportBadges();
    const fromMission = mission?.unlockedBadges ?? [];
    return Array.from(new Set([...stored, ...fromMission]));
  }, [mission?.unlockedBadges, showPassport, showAcademy]);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#050812]">
      {/* Isolated Three.js WebGL Mount */}
      <div
        ref={mountRef}
        data-testid="lunar-outpost-canvas"
        className="absolute inset-0 w-full h-full"
      />

      {screen === 'title' && (
        <TitleScreen
          lang={lang}
          onChangeLang={setLang}
          hasSavedMission={hasSaved}
          onStartNew={() => {
            soundEngine.startAmbient();
            soundEngine.playClick();
            setScreen('prep');
          }}
          onContinue={handleContinueMission}
          onOpenAcademy={() => {
            soundEngine.playClick();
            setShowAcademy(true);
          }}
          onOpenNasa={handleOpenNasaCenter}
          onOpenCalculator={() => {
            soundEngine.playClick();
            setShowCalculator(true);
          }}
          onOpenPassport={() => {
            soundEngine.playClick();
            setShowPassport(true);
          }}
          onOpenSettings={() => {
            soundEngine.playClick();
            setShowSettings(true);
          }}
          muted={muted}
          onToggleMute={handleToggleMute}
        />
      )}

      {screen === 'prep' && (
        <MissionPrepModal
          lang={lang}
          onBack={() => {
            soundEngine.playClick();
            setScreen('title');
          }}
          onLaunch={handleLaunchMission}
        />
      )}

      {screen === 'playing' && mission && (
        <>
          <GameHUD
            lang={lang}
            state={mission}
            selectedBuilding={selectedBuilding}
            hoveredBuilding={hoveredBuilding}
            onSelectBuilding={handleSelectBuilding}
            onBuildingAction={handleBuildingAction}
            onBuildingUpgrade={handleBuildingUpgrade}
            onBuildingTogglePower={handleBuildingTogglePower}
            onOpenMiniGame={(kind) => {
              soundEngine.playClick();
              setActiveMiniGame(kind);
            }}
            onEndDay={handleEndDay}
            onSendComms={handleSendComms}
            onOpenNasa={handleOpenNasaCenter}
            onOpenAcademy={() => {
              soundEngine.playClick();
              setShowAcademy(true);
            }}
            onOpenCalculator={() => {
              soundEngine.playClick();
              setShowCalculator(true);
            }}
            onOpenPassport={() => {
              soundEngine.playClick();
              setShowPassport(true);
            }}
            onOpenMenu={() => {
              soundEngine.playClick();
              setScreen('title');
            }}
            onResetCamera={() => {
              soundEngine.playClick();
              setSelectedBuilding(null);
              sceneRef.current?.resetCamera();
            }}
            muted={muted}
            onToggleMute={handleToggleMute}
          />

          <EventModal
            lang={lang}
            state={mission}
            onStartOperations={() => {
              soundEngine.playClick();
              setMission((prev) => (prev ? startOperationsPhase(prev) : prev));
            }}
            onSelectChoice={handleSelectChoice}
            onAdvanceDay={handleAdvanceDay}
          />
        </>
      )}

      {screen === 'gameover' && report && (
        <MissionReportModal
          lang={lang}
          report={report}
          onPlayAgain={() => {
            soundEngine.playClick();
            setMission(null);
            setScreen('prep');
          }}
          onMainMenu={() => {
            soundEngine.playClick();
            setMission(null);
            setScreen('title');
          }}
        />
      )}

      {showNasa && (
        <NasaDataModal
          lang={lang}
          canSimulateInMission={screen === 'playing' && Boolean(mission && mission.status === 'active')}
          onSimulateWeather={handleSimulateRealWeather}
          onClose={() => setShowNasa(false)}
        />
      )}
      {showAcademy && (
        <AcademyModal
          lang={lang}
          onClose={() => {
            setShowAcademy(false);
            setMission((prev) => (prev ? evaluateBadges(prev) : prev));
          }}
        />
      )}
      {showCalculator && <SpaceCalculatorModal lang={lang} onClose={() => setShowCalculator(false)} />}
      {showPassport && (
        <PassportModal
          lang={lang}
          unlockedBadges={passportBadges}
          currentCode={mission?.config.challengeCode}
          onClose={() => setShowPassport(false)}
        />
      )}
      {activeMiniGame && (
        <MiniGameModal
          lang={lang}
          kind={activeMiniGame}
          onComplete={handleCompleteMiniGame}
          onClose={() => setActiveMiniGame(null)}
        />
      )}
      {showSettings && (
        <SettingsModal
          lang={lang}
          onChangeLang={setLang}
          muted={muted}
          onToggleMute={handleToggleMute}
          onClearSave={() => {
            clearMissionFromStorage();
            setHasSaved(false);
          }}
          onClose={() => setShowSettings(false)}
        />
      )}
    </main>
  );
}
