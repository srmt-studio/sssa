import React, { useState } from 'react';
import { 
  DivisionInfo, MatchSettings, PlayerCard as IPlayerCard, 
  Team, UserWallet, Manager, EpicBoxState 
} from './types/game';
import { 
  INITIAL_PLAYERS, MANAGERS_LIST, OPPONENT_TEAMS, FORMATIONS_COORDINATES 
} from './data/initialData';
import { MatchEngine } from './engine/MatchEngine';
import { PitchCanvas } from './components/PitchCanvas';
import { MatchOverlay } from './components/MatchOverlay';
import { Navbar, ActiveView } from './components/Navbar';
import { GamePlan } from './components/GamePlan';
import { MySquadView } from './components/MySquadView';
import { MatchLobby } from './components/MatchLobby';
import { DivisionsView } from './components/DivisionsView';
import { PackOpeningModal } from './components/PackOpeningModal';
import { MarketHub } from './components/MarketHub';
import { TrainingGround } from './components/TrainingGround';
import { PlayerProgressionModal } from './components/PlayerProgressionModal';
import { BoosterCraftingModal } from './components/BoosterCraftingModal';
import { sound } from './services/soundService';

export default function App() {
  const [currentView, setCurrentView] = useState<ActiveView>('match');
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // User Wallet & Resources
  const [wallet, setWallet] = useState<UserWallet>({
    gp: 850000,
    coins: 1200,
    exp10000: 4,
    exp4000: 6,
    exp1000: 12,
    skillPrograms: 4,
    randomBoosterTokens: 2,
    selectBoosterTokens: 1,
    positionPrograms: 3
  });

  // 150-Player Epic Box State
  const [boxState, setBoxState] = useState<EpicBoxState>({
    totalRemaining: 150,
    epicsRemaining: 3,
    highlightsRemaining: 12,
    standardsRemaining: 135,
    totalSpun: 0
  });

  // User's Dream Team
  const [userTeam, setUserTeam] = useState<Team>({
    id: "user_dream_team",
    name: "eFootball Dream XI",
    shortName: "EFD",
    crest: "⚡",
    primaryColor: "#0284c7",
    secondaryColor: "#d4ff00",
    formation: "4-3-3",
    playstyle: "Possession Game",
    manager: MANAGERS_LIST[0], // Pep Guardiola
    players: INITIAL_PLAYERS,
    teamChemistry: 98
  });

  // eFootball League Division Info
  const [divisionInfo, setDivisionInfo] = useState<DivisionInfo>({
    division: 7,
    points: 7,
    matchesPlayed: 3,
    matchesRemaining: 7,
    targetPoints: 12,
    rewardGP: 150000,
    rewardCoins: 50
  });

  // Active Match state
  const [activeEngine, setActiveEngine] = useState<MatchEngine | null>(null);
  const [isDivisionFixture, setIsDivisionFixture] = useState(false);

  // Modals state
  const [selectedProgressionPlayer, setSelectedProgressionPlayer] = useState<IPlayerCard | null>(null);
  const [selectedBoosterPlayer, setSelectedBoosterPlayer] = useState<IPlayerCard | null>(null);
  const [showPackModal, setShowPackModal] = useState<boolean>(false);

  // Toggle sound
  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    sound.setMuted(nextMuted);
  };

  // Kickoff match
  const handleKickoff = (opponent: Team, settings: MatchSettings, isDivision: boolean = false) => {
    sound.startCrowd();
    const engine = new MatchEngine(userTeam, opponent, settings);
    setActiveEngine(engine);
    setIsDivisionFixture(isDivision);
  };

  // Exit match and award match earnings
  const handleExitMatch = () => {
    sound.stopCrowd();
    if (activeEngine) {
      const stats = activeEngine.stats;
      const isWin = stats.homeScore > stats.awayScore;
      const isDraw = stats.homeScore === stats.awayScore;

      // Calculate rewards
      const earnedGP = isWin ? 40000 : isDraw ? 20000 : 10000;
      const earnedCoins = isWin ? 20 : 5;

      setWallet(prev => ({
        ...prev,
        gp: prev.gp + earnedGP,
        coins: prev.coins + earnedCoins,
        exp4000: prev.exp4000 + (isWin ? 1 : 0)
      }));

      // Update division stats if this was a division game
      if (isDivisionFixture) {
        const pts = isWin ? 3 : isDraw ? 1 : 0;
        setDivisionInfo(prev => {
          const newPts = prev.points + pts;
          const newRem = Math.max(0, prev.matchesRemaining - 1);
          // Check promotion
          if (newPts >= prev.targetPoints && prev.division > 1) {
            return {
              ...prev,
              division: prev.division - 1,
              points: 0,
              matchesPlayed: 0,
              matchesRemaining: 10,
              targetPoints: 14,
              rewardGP: prev.rewardGP + 50000,
              rewardCoins: prev.rewardCoins + 20
            };
          }
          return {
            ...prev,
            points: newPts,
            matchesPlayed: prev.matchesPlayed + 1,
            matchesRemaining: newRem
          };
        });
      }
    }

    setActiveEngine(null);
  };

  // Update squad player
  const handleUpdatePlayer = (updatedPlayer: IPlayerCard) => {
    setUserTeam(prev => ({
      ...prev,
      players: prev.players.map(p => p.id === updatedPlayer.id ? updatedPlayer : p)
    }));
  };

  // Add new player to squad from packs or market
  const handleAddPlayer = (newPlayer: IPlayerCard) => {
    setUserTeam(prev => ({
      ...prev,
      players: [...prev.players, newPlayer]
    }));
  };

  // Switch active manager
  const handleSelectManager = (mgr: Manager) => {
    setUserTeam(prev => {
      const mgrProf = mgr.proficiencies[prev.playstyle] || 70;
      const chem = Math.min(100, Math.round(mgrProf * 1.12));
      return {
        ...prev,
        manager: mgr,
        teamChemistry: chem
      };
    });
  };

  // Bench sub completed in live match
  const handleInMatchSub = (starterId: string, benchCard: IPlayerCard) => {
    setUserTeam(prev => ({
      ...prev,
      players: prev.players.map(p => {
        if (p.id === starterId) return { ...p, isStarter: false };
        if (p.id === benchCard.id) return { ...p, isStarter: true };
        return p;
      })
    }));
  };

  const benchPlayers = userTeam.players.filter(p => !p.isStarter);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none antialiased">
      {/* Top Navigation */}
      <Navbar
        currentView={currentView}
        onSelectView={(v) => {
          if (v === 'packs') {
            setShowPackModal(true);
          } else {
            setCurrentView(v);
          }
        }}
        wallet={wallet}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        inMatch={!!activeEngine}
      />

      {/* MAIN VIEW CONTAINER */}
      <main className="flex-1 flex flex-col">
        {/* 1. ACTIVE LIVE MATCH */}
        {activeEngine ? (
          <div className="relative w-full h-[100vh] bg-black overflow-hidden flex items-center justify-center">
            <PitchCanvas engine={activeEngine} />
            <MatchOverlay
              engine={activeEngine}
              onExitMatch={handleExitMatch}
              benchPlayers={benchPlayers}
              onSubDone={handleInMatchSub}
            />
          </div>
        ) : (
          /* 2. MENU / SQUAD / LEAGUE VIEWS */
          <div className="flex-1 py-4 sm:py-6">
            {currentView === 'match' && (
              <MatchLobby
                userTeam={userTeam}
                onKickoff={(opp, settings) => handleKickoff(opp, settings, false)}
              />
            )}

            {currentView === 'gameplan' && (
              <GamePlan
                team={userTeam}
                onUpdateTeam={setUserTeam}
                onSelectPlayerForProgression={(p) => setSelectedProgressionPlayer(p)}
                onSelectPlayerForBooster={(p) => setSelectedBoosterPlayer(p)}
              />
            )}

            {currentView === 'myteam' && (
              <MySquadView
                players={userTeam.players}
                wallet={wallet}
                onSelectPlayerForProgression={(p) => setSelectedProgressionPlayer(p)}
                onSelectPlayerForBooster={(p) => setSelectedBoosterPlayer(p)}
              />
            )}

            {currentView === 'divisions' && (
              <DivisionsView
                divisionInfo={divisionInfo}
                userTeam={userTeam}
                onStartMatch={(opp, settings) => {
                  handleKickoff(opp, {
                    stadium: 'eFootball Stadium',
                    weather: 'Night (Floodlights)',
                    halfLengthSec: 120,
                    smartAssist: true,
                    controlMode: 'classic_touch',
                    difficulty: settings.difficulty || 'Regular',
                    ...settings
                  }, true);
                }}
              />
            )}

            {currentView === 'market' && (
              <MarketHub
                wallet={wallet}
                currentManager={userTeam.manager}
                onSelectManager={handleSelectManager}
                onSignPlayer={handleAddPlayer}
                onUpdateWallet={setWallet}
              />
            )}

            {currentView === 'training' && (
              <TrainingGround player={userTeam.players[0]} />
            )}
          </div>
        )}
      </main>

      {/* MODAL 1: PLAYER PROGRESSION & SKILLS */}
      {selectedProgressionPlayer && (
        <PlayerProgressionModal
          player={selectedProgressionPlayer}
          wallet={wallet}
          onClose={() => setSelectedProgressionPlayer(null)}
          onUpdatePlayer={handleUpdatePlayer}
          onUpdateWallet={setWallet}
        />
      )}

      {/* MODAL 2: BOOSTER CRAFTING */}
      {selectedBoosterPlayer && (
        <BoosterCraftingModal
          player={selectedBoosterPlayer}
          wallet={wallet}
          onClose={() => setSelectedBoosterPlayer(null)}
          onUpdatePlayer={handleUpdatePlayer}
          onUpdateWallet={setWallet}
        />
      )}

      {/* MODAL 3: SPECIAL PLAYER PACKS (150 POOL) */}
      {showPackModal && (
        <PackOpeningModal
          wallet={wallet}
          onClose={() => setShowPackModal(false)}
          onAddPlayersToSquad={(players) => {
            setUserTeam(prev => ({
              ...prev,
              players: [...prev.players, ...players]
            }));
          }}
          onUpdateWallet={setWallet}
          onNavigateToMarket={() => setCurrentView('market')}
        />
      )}
    </div>
  );
}
