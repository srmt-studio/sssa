import React, { useState } from 'react';
import { 
  Team, PlayerCard as IPlayerCard, TeamPlaystyle, 
  IndividualInstruction, Manager, Position, AutoPickCriterion, getEffectiveOVR, getPositionProficiency 
} from '../types/game';
import { FORMATIONS_COORDINATES, MANAGERS_LIST } from '../data/initialData';
import { executeAutoPick, AutoPickResult } from '../services/autoPickService';
import { PlayerCard } from './PlayerCard';
import { 
  Shield, Users, Crosshair, Sparkles, ChevronRight, CheckCircle2, 
  Settings2, RefreshCw, Move, HelpCircle, Wand2, AlertTriangle, 
  ArrowUpDown, X, ArrowUpCircle, AlertCircle, ArrowRightLeft, Zap, Info
} from 'lucide-react';
import { sound } from '../services/soundService';

const POSITION_CATEGORIES: { name: string; positions: Position[] }[] = [
  { name: 'Attackers (FW)', positions: ['CF', 'SS', 'LWF', 'RWF'] },
  { name: 'Midfielders (MF)', positions: ['AMF', 'CMF', 'LMF', 'RMF', 'DMF'] },
  { name: 'Defenders (DF)', positions: ['CB', 'LB', 'RB'] },
  { name: 'Goalkeeper (GK)', positions: ['GK'] }
];

const ALL_POSITIONS: Position[] = [
  'CF', 'SS', 'LWF', 'RWF', 
  'AMF', 'CMF', 'LMF', 'RMF', 'DMF', 
  'CB', 'LB', 'RB', 'GK'
];

interface GamePlanProps {
  team: Team;
  onUpdateTeam: (updatedTeam: Team) => void;
  onSelectPlayerForProgression: (player: IPlayerCard) => void;
  onSelectPlayerForBooster: (player: IPlayerCard) => void;
}

export const GamePlan: React.FC<GamePlanProps> = ({
  team,
  onUpdateTeam,
  onSelectPlayerForProgression,
  onSelectPlayerForBooster
}) => {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(team.players[0]?.id || '');
  const [draggingPlayerId, setDraggingPlayerId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'formation' | 'instructions' | 'manager'>('formation');
  const [showAutoPickModal, setShowAutoPickModal] = useState<boolean>(false);
  const [selectedAutoPickCriterion, setSelectedAutoPickCriterion] = useState<AutoPickCriterion>('ovr');
  const [autoPickNotice, setAutoPickNotice] = useState<string | null>(null);
  const [autoPickResultDetails, setAutoPickResultDetails] = useState<AutoPickResult | null>(null);
  const [showAutoPickReportModal, setShowAutoPickReportModal] = useState<boolean>(false);
  const [quickPosMenuPlayerId, setQuickPosMenuPlayerId] = useState<string | null>(null);
  const [showPositionExplainer, setShowPositionExplainer] = useState<boolean>(false);

  const selectedPlayer = team.players.find(p => p.id === selectedPlayerId) || team.players[0];

  // Change formation preset
  const handleFormationChange = (formationName: string) => {
    sound.playClick();
    const coords = FORMATIONS_COORDINATES[formationName];
    if (!coords) return;

    const starters = team.players.filter(p => p.isStarter);
    const updatedPlayers = team.players.map(p => {
      if (!p.isStarter) return p;
      const starterIdx = starters.findIndex(sp => sp.id === p.id);
      if (starterIdx !== -1 && coords[starterIdx]) {
        return {
          ...p,
          pitchX: coords[starterIdx].x,
          pitchY: coords[starterIdx].y,
          position: coords[starterIdx].pos as Position
        };
      }
      return p;
    });

    onUpdateTeam({
      ...team,
      formation: formationName,
      players: updatedPlayers
    });
  };

  // Dragging player coordinates on tactical pitch grid
  const handlePitchClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!draggingPlayerId) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const yPct = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    const clampedX = Math.max(8, Math.min(92, xPct));
    const clampedY = Math.max(10, Math.min(90, yPct));

    const updatedPlayers = team.players.map(p => {
      if (p.id === draggingPlayerId) {
        return { ...p, pitchX: clampedX, pitchY: clampedY };
      }
      return p;
    });

    onUpdateTeam({ ...team, players: updatedPlayers });
    setDraggingPlayerId(null);
    sound.playClick();
  };

  // Change decided player to ANY other position
  const handleChangePlayerPosition = (playerId: string, newPosition: Position) => {
    sound.playClick();
    const updatedPlayers = team.players.map(p => {
      if (p.id === playerId) {
        return {
          ...p,
          position: newPosition
        };
      }
      return p;
    });

    onUpdateTeam({
      ...team,
      players: updatedPlayers
    });
    setQuickPosMenuPlayerId(null);
  };

  // Swap positions & coordinates between two starters on the pitch
  const handleSwapStarterPositions = (playerId1: string, playerId2: string) => {
    sound.playClick();
    const p1 = team.players.find(p => p.id === playerId1);
    const p2 = team.players.find(p => p.id === playerId2);
    if (!p1 || !p2) return;

    const updatedPlayers = team.players.map(p => {
      if (p.id === playerId1) {
        return {
          ...p,
          position: p2.position,
          pitchX: p2.pitchX,
          pitchY: p2.pitchY
        };
      }
      if (p.id === playerId2) {
        return {
          ...p,
          position: p1.position,
          pitchX: p1.pitchX,
          pitchY: p1.pitchY
        };
      }
      return p;
    });

    onUpdateTeam({ ...team, players: updatedPlayers });
  };

  // Reset decided position back to player's natural registered position
  const handleResetToNaturalPosition = (playerId: string) => {
    sound.playClick();
    const targetPlayer = team.players.find(p => p.id === playerId);
    if (!targetPlayer) return;

    handleChangePlayerPosition(playerId, targetPlayer.registeredPosition);
  };

  // Change Manager & Playstyle
  const handlePlaystyleChange = (style: TeamPlaystyle) => {
    sound.playClick();
    const managerProf = team.manager.proficiencies[style] || 70;
    const chem = Math.min(100, Math.round(managerProf * 1.12));
    onUpdateTeam({
      ...team,
      playstyle: style,
      teamChemistry: chem
    });
  };

  // Change Individual Instruction
  const handleInstructionChange = (playerId: string, instruction: IndividualInstruction) => {
    sound.playClick();
    const updated = team.players.map(p => {
      if (p.id === playerId) {
        return { ...p, instruction };
      }
      return p;
    });
    onUpdateTeam({ ...team, players: updated });
  };

  // Swap Starter and Bench player
  const handleSwapPlayer = (starterId: string, benchId: string) => {
    sound.playClick();
    const starter = team.players.find(p => p.id === starterId);
    const benchPlayer = team.players.find(p => p.id === benchId);
    if (!starter || !benchPlayer) return;

    const updated = team.players.map(p => {
      if (p.id === starterId) {
        return {
          ...benchPlayer,
          isStarter: true,
          pitchX: starter.pitchX,
          pitchY: starter.pitchY,
          position: starter.position
        };
      }
      if (p.id === benchId) {
        return {
          ...starter,
          isStarter: false
        };
      }
      return p;
    });

    onUpdateTeam({ ...team, players: updated });
    setSelectedPlayerId(benchPlayer.id);
  };

  // Execute Auto-Pick feature
  const handleApplyAutoPick = () => {
    sound.playPackReveal();
    const result = executeAutoPick(
      team.players,
      team.formation,
      selectedAutoPickCriterion,
      team.playstyle
    );

    onUpdateTeam({
      ...team,
      players: result.updatedPlayers
    });

    setAutoPickResultDetails(result);
    setAutoPickNotice(result.notice);
    setShowAutoPickModal(false);
  };

  const starters = team.players.filter(p => p.isStarter);
  const bench = team.players.filter(p => !p.isStarter);

  const managerRating = team.manager.proficiencies[team.playstyle];
  const isHighProficiency = managerRating >= 88;

  const selectedPlayerProficiency = selectedPlayer 
    ? getPositionProficiency(selectedPlayer, selectedPlayer.position) 
    : 'Full';
  const selectedPlayerOvrEffect = selectedPlayer 
    ? getEffectiveOVR(selectedPlayer, selectedPlayer.position) 
    : { effectiveOvr: 0, drop: 0, familiarity: 'Full', isPlaystyleActive: true };

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-5 p-4 sm:p-6 select-none">
      {/* 1. TOP TEAM TACTICAL STATUS BANNER */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl shadow-inner">
            {team.crest}
          </div>
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-wider">{team.name}</h2>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
              <span>Manager: <strong className="text-slate-200">{team.manager.name}</strong></span>
              <span>·</span>
              <span>Playstyle: <strong className="text-cyan-400">{team.playstyle}</strong></span>
            </div>
          </div>
        </div>

        {/* Auto-Pick Trigger & Chemistry Display */}
        <div className="flex items-center gap-4 flex-wrap">
          {/* Auto-Pick Button */}
          <button
            onClick={() => {
              sound.playClick();
              setShowAutoPickModal(true);
            }}
            className="px-3.5 py-2 bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-transform active:scale-95 border border-cyan-400/40"
          >
            <Wand2 className="w-4 h-4 text-cyan-200" />
            <span>Auto-Pick</span>
          </button>

          <div className="flex items-center gap-6 border-l border-slate-800 pl-4">
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Team Playstyle Level</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-2xl font-black font-mono text-volt">{team.teamChemistry}</span>
                <span className="text-xs text-slate-500 font-mono">/100</span>
              </div>
            </div>

            <div className="flex flex-col items-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Stat Boost</span>
              <div className="flex items-center gap-1 mt-0.5">
                <span className={`text-sm font-black px-2 py-0.5 rounded ${isHighProficiency ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-800 text-slate-300'}`}>
                  {isHighProficiency ? '+3 ALL STATS' : '+1 STATS'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Auto-Pick Banner Notice & Diagnostic Link */}
      {autoPickNotice && (
        <div className="bg-slate-900/90 border border-cyan-500/50 p-3 rounded-xl flex items-center justify-between text-xs text-cyan-200 gap-2 shadow-lg">
          <div className="flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-volt shrink-0" />
            <span>{autoPickNotice}</span>
          </div>
          <div className="flex items-center gap-2">
            {autoPickResultDetails && (
              <button
                onClick={() => setShowAutoPickReportModal(true)}
                className="px-2.5 py-1 bg-cyan-950 hover:bg-cyan-900 border border-cyan-700 text-cyan-300 font-bold text-[11px] rounded-lg transition-colors flex items-center gap-1"
              >
                <Info className="w-3.5 h-3.5" />
                <span>View Assembly Breakdown</span>
              </button>
            )}
            <button
              onClick={() => setAutoPickNotice(null)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2. MAIN TACTICAL WORKBENCH */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT / CENTER: INTERACTIVE TACTICAL PITCH GRID (7 COLS) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-4 shadow-xl">
          {/* Controls: Formations & Modes */}
          <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Formation:</span>
              <div className="flex items-center gap-1">
                {Object.keys(FORMATIONS_COORDINATES).map(f => (
                  <button
                    key={f}
                    onClick={() => handleFormationChange(f)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
                      team.formation === f
                        ? 'bg-volt text-slate-950 font-black'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPositionExplainer(!showPositionExplainer)}
                className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
              >
                <HelpCircle className="w-3.5 h-3.5" /> Position Rules
              </button>
            </div>
          </div>

          {/* Position Rules Explainer Dropdown */}
          {showPositionExplainer && (
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-700 text-xs text-slate-300 space-y-1">
              <div className="font-bold text-white flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-volt" />
                <span>eFootball Position Familiarity Mechanics</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                You can change any player into <strong>any position</strong> (e.g. CF to CB, or DMF to AMF).
              </p>
              <div className="grid grid-cols-3 gap-2 pt-1 text-[10px]">
                <div className="p-1.5 rounded bg-emerald-950/40 border border-emerald-800 text-emerald-300">
                  <strong>Full (Green):</strong> 100% stats, player playstyle active.
                </div>
                <div className="p-1.5 rounded bg-amber-950/40 border border-amber-800 text-amber-300">
                  <strong>Partial (Yellow):</strong> ~8% stat reduction, playstyle inactive.
                </div>
                <div className="p-1.5 rounded bg-rose-950/40 border border-rose-800 text-rose-300">
                  <strong>None (Red):</strong> ~24% severe stat penalty, playstyle inactive!
                </div>
              </div>
            </div>
          )}

          {/* Interactive Tactical Pitch */}
          <div
            onClick={handlePitchClick}
            className="relative w-full aspect-[4/3] bg-gradient-to-b from-[#184422] to-[#12351a] rounded-xl border-2 border-slate-700 overflow-hidden cursor-pointer shadow-inner"
          >
            {/* Pitch Lines */}
            <div className="absolute inset-4 border-2 border-white/40 pointer-events-none" />
            <div className="absolute top-4 bottom-4 left-1/2 -translate-x-1/2 w-[2px] bg-white/40 pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full border-2 border-white/40 pointer-events-none" />
            <div className="absolute top-1/2 -translate-y-1/2 left-4 w-20 h-44 border-r-2 border-t-2 border-b-2 border-white/40 pointer-events-none" />
            <div className="absolute top-1/2 -translate-y-1/2 right-4 w-20 h-44 border-l-2 border-t-2 border-b-2 border-white/40 pointer-events-none" />

            {/* Tactical Grid coordinates */}
            {starters.map(player => {
              const isSelected = player.id === selectedPlayerId;
              const isDragging = player.id === draggingPlayerId;
              const isPosMenuOpen = quickPosMenuPlayerId === player.id;
              const { effectiveOvr, drop, familiarity } = getEffectiveOVR(player, player.position);
              const isOutOfPos = drop > 0;

              return (
                <div
                  key={player.id}
                  style={{
                    left: `${player.pitchX}%`,
                    top: `${player.pitchY}%`
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    sound.playClick();
                    setSelectedPlayerId(player.id);
                    setDraggingPlayerId(player.id);
                  }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-grab active:cursor-grabbing z-20 transition-transform ${
                    isDragging ? 'scale-125 z-30' : isSelected ? 'scale-110 z-25' : 'hover:scale-105'
                  }`}
                >
                  {/* Position badge with 1-click change button */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        sound.playClick();
                        setQuickPosMenuPlayerId(isPosMenuOpen ? null : player.id);
                        setSelectedPlayerId(player.id);
                      }}
                      title="Click to change decided position"
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black font-mono shadow-md flex items-center gap-1 border transition-colors ${
                        isSelected
                          ? 'bg-volt text-slate-950 border-white ring-2 ring-volt/60'
                          : isOutOfPos
                          ? 'bg-slate-900/90 text-rose-300 border-rose-500/80 ring-1 ring-rose-500/40'
                          : 'bg-slate-900/90 text-white border-slate-700 hover:border-volt'
                      }`}
                    >
                      <span>{player.position}</span>
                      <span className={isOutOfPos ? 'text-rose-400 font-bold' : 'text-cyan-400'}>
                        {effectiveOvr}
                        {isOutOfPos && '↓'}
                      </span>
                      <ArrowUpDown className="w-2.5 h-2.5 ml-0.5 opacity-70" />
                    </button>

                    {/* Quick Position Selector Dropdown on Pitch Token */}
                    {isPosMenuOpen && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-slate-950 border border-slate-700 rounded-2xl p-2 shadow-2xl z-50 min-w-[220px]"
                      >
                        <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 mb-1.5 text-[10px]">
                          <span className="font-bold text-slate-300">Change Position for {player.shortName}:</span>
                          <button
                            onClick={() => setQuickPosMenuPlayerId(null)}
                            className="text-slate-500 hover:text-white"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="space-y-1.5">
                          {POSITION_CATEGORIES.map(cat => (
                            <div key={cat.name}>
                              <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                                {cat.name}
                              </div>
                              <div className="grid grid-cols-4 gap-1">
                                {cat.positions.map(pos => {
                                  const preview = getEffectiveOVR(player, pos);
                                  const isCurrent = player.position === pos;
                                  const badgeColor = preview.familiarity === 'Full' 
                                    ? 'text-emerald-400' 
                                    : preview.familiarity === 'Partial' 
                                    ? 'text-amber-400' 
                                    : 'text-rose-400';

                                  return (
                                    <button
                                      key={pos}
                                      onClick={() => handleChangePlayerPosition(player.id, pos)}
                                      className={`px-1.5 py-1 text-[10px] font-mono rounded flex flex-col items-center justify-center transition-colors ${
                                        isCurrent
                                          ? 'bg-volt text-slate-950 font-black'
                                          : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800'
                                      }`}
                                    >
                                      <span className="font-bold">{pos}</span>
                                      <span className={`text-[8px] font-black ${isCurrent ? 'text-slate-950' : badgeColor}`}>
                                        {preview.effectiveOvr}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Player Dot Circle */}
                  <div
                    className={`w-7 h-7 rounded-full border-2 flex items-center justify-center font-black text-xs shadow-lg mt-0.5 ${
                      isSelected
                        ? 'bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 border-white'
                        : 'bg-gradient-to-tr from-slate-800 to-slate-700 text-slate-100 border-slate-500'
                    }`}
                  >
                    {player.number}
                  </div>

                  {/* Player Name */}
                  <span className="text-[10px] font-bold text-white bg-slate-950/80 px-1.5 rounded mt-0.5 tracking-tight whitespace-nowrap shadow">
                    {player.shortName}
                  </span>

                  {/* Individual Instruction Tag */}
                  {player.instruction !== 'None' && (
                    <span className="text-[8px] font-bold text-amber-300 bg-amber-950/90 px-1 rounded border border-amber-800">
                      {player.instruction}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bench / Substitutes Row */}
          <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Bench Substitutes ({bench.length})
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {bench.map(bp => (
                <div
                  key={bp.id}
                  onClick={() => {
                    sound.playClick();
                    setSelectedPlayerId(bp.id);
                  }}
                  className={`p-2 rounded-xl bg-slate-950 border cursor-pointer flex items-center justify-between transition-colors ${
                    bp.id === selectedPlayerId
                      ? 'border-volt bg-slate-900'
                      : 'border-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                      {bp.position}
                    </span>
                    <span className="text-xs font-bold text-slate-200">{bp.shortName}</span>
                  </div>
                  <span className="text-xs font-mono font-black text-slate-400">{bp.currentOvr}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: INSPECTOR & SQUAD MANAGEMENT (5 COLS) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Tactical Tabs */}
          <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('formation')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                activeTab === 'formation' ? 'bg-slate-800 text-white font-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              Player Details & Position
            </button>
            <button
              onClick={() => setActiveTab('instructions')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                activeTab === 'instructions' ? 'bg-slate-800 text-white font-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              Instructions
            </button>
            <button
              onClick={() => setActiveTab('manager')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                activeTab === 'manager' ? 'bg-slate-800 text-white font-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              Manager Style
            </button>
          </div>

          {/* TAB 1: PLAYER DETAILS & POSITION EDITOR */}
          {activeTab === 'formation' && selectedPlayer && (
            <div className="flex flex-col gap-3">
              {/* COMPREHENSIVE POSITION CHANGER & FAMILIARITY MODULE */}
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex flex-col gap-3 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                      <ArrowRightLeft className="w-3.5 h-3.5 text-volt" />
                      <span>Change Decided Position</span>
                    </span>
                    <div className="text-xs text-white font-bold mt-0.5 flex items-center gap-2">
                      <span>Playing Position:</span>
                      <span className="text-volt font-mono font-black text-sm px-1.5 py-0.5 rounded bg-slate-900 border border-volt/40">
                        {selectedPlayer.position}
                      </span>
                      {selectedPlayer.registeredPosition && selectedPlayer.registeredPosition !== selectedPlayer.position && (
                        <button
                          onClick={() => handleResetToNaturalPosition(selectedPlayer.id)}
                          title="Reset to natural position"
                          className="text-[10px] text-cyan-400 hover:underline flex items-center gap-0.5"
                        >
                          <RefreshCw className="w-2.5 h-2.5" /> Reset (Reg: {selectedPlayer.registeredPosition})
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Familiarity Badge */}
                  <div className="text-right">
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                      selectedPlayerProficiency === 'Full'
                        ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                        : selectedPlayerProficiency === 'Partial'
                        ? 'bg-amber-950 text-amber-400 border-amber-800'
                        : 'bg-rose-950 text-rose-400 border-rose-800'
                    }`}>
                      {selectedPlayerProficiency === 'Full' ? 'Full Proficiency' : selectedPlayerProficiency === 'Partial' ? 'Partial Debuff' : 'Out of Position'}
                    </span>
                    <div className="text-[10px] font-mono mt-0.5 text-slate-400">
                      Effective OVR: <strong className={selectedPlayerOvrEffect.drop > 0 ? 'text-rose-400 font-bold' : 'text-volt font-bold'}>{selectedPlayerOvrEffect.effectiveOvr}</strong>
                    </div>
                  </div>
                </div>

                {/* 1-Click Position Switcher Buttons (Grouped by Category) */}
                <div className="space-y-2">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Select Any Decided Position:
                  </div>

                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                    {ALL_POSITIONS.map(pos => {
                      const eff = getEffectiveOVR(selectedPlayer, pos);
                      const isCurrent = selectedPlayer.position === pos;
                      const isNatural = selectedPlayer.registeredPosition === pos;
                      const famColor = eff.familiarity === 'Full' 
                        ? 'border-emerald-600/60 bg-emerald-950/20 text-emerald-300' 
                        : eff.familiarity === 'Partial' 
                        ? 'border-amber-600/60 bg-amber-950/20 text-amber-300' 
                        : 'border-rose-900/60 bg-rose-950/20 text-rose-300';

                      return (
                        <button
                          key={pos}
                          onClick={() => handleChangePlayerPosition(selectedPlayer.id, pos)}
                          className={`p-1.5 rounded-xl border text-center flex flex-col items-center justify-center transition-all ${
                            isCurrent
                              ? 'bg-volt text-slate-950 font-black border-white ring-2 ring-volt/60 scale-105 shadow-lg'
                              : `${famColor} hover:border-slate-500 hover:scale-105`
                          }`}
                        >
                          <div className="flex items-center gap-0.5">
                            <span className="text-[11px] font-black font-mono">{pos}</span>
                            {isNatural && !isCurrent && (
                              <span className="text-[8px] text-cyan-400 font-bold">★</span>
                            )}
                          </div>
                          <span className={`text-[9px] font-mono font-bold ${isCurrent ? 'text-slate-950' : 'opacity-80'}`}>
                            {eff.effectiveOvr}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Swap Position with Another Starter */}
                {selectedPlayer.isStarter && starters.length > 1 && (
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Swap Role With Teammate:
                    </span>
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          handleSwapStarterPositions(selectedPlayer.id, e.target.value);
                          e.target.value = '';
                        }
                      }}
                      defaultValue=""
                      className="bg-slate-900 border border-slate-700 text-slate-200 text-[11px] rounded-lg px-2 py-1 outline-none focus:border-volt"
                    >
                      <option value="" disabled>Choose starter to swap...</option>
                      {starters.filter(s => s.id !== selectedPlayer.id).map(s => (
                        <option key={s.id} value={s.id}>
                          Swap with {s.shortName} ({s.position})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Player Card Visual */}
              <PlayerCard card={selectedPlayer} />

              {/* Action Buttons: Progression & Boosters */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => onSelectPlayerForProgression(selectedPlayer)}
                  className="py-2.5 px-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 shadow-lg transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Progression
                </button>

                <button
                  onClick={() => onSelectPlayerForProgression(selectedPlayer)}
                  className="py-2.5 px-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 shadow-lg transition-colors"
                >
                  <ArrowUpCircle className="w-3.5 h-3.5 text-emerald-200" /> Pos Training
                </button>

                <button
                  onClick={() => onSelectPlayerForBooster(selectedPlayer)}
                  className="py-2.5 px-1.5 bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 shadow-lg transition-colors"
                >
                  <Zap className="w-3.5 h-3.5" /> Boosters
                </button>
              </div>

              {/* Swap with bench if selected is starter */}
              {selectedPlayer.isStarter && bench.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Swap with Bench Substitute
                  </span>
                  <div className="grid grid-cols-1 gap-1.5 max-h-36 overflow-y-auto">
                    {bench.map(bp => (
                      <button
                        key={bp.id}
                        onClick={() => handleSwapPlayer(selectedPlayer.id, bp.id)}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs text-left"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono px-1 rounded bg-slate-800 text-cyan-300">
                            {bp.position}
                          </span>
                          <span className="font-bold text-slate-200">{bp.name}</span>
                        </div>
                        <span className="font-mono text-volt font-bold">OVR {bp.currentOvr}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: INDIVIDUAL TACTICAL INSTRUCTIONS */}
          {activeTab === 'instructions' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-4">
              <div className="border-b border-slate-800 pb-2">
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Individual Tactical Instructions</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Assign custom roles to restrain or amplify player movement on pitch.
                </p>
              </div>

              <div className="space-y-3">
                {starters.slice(0, 6).map(player => (
                  <div key={player.id} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span className="font-mono text-cyan-400">{player.position}</span>
                        <span>{player.shortName}</span>
                      </div>
                      <div className="text-[10px] text-slate-500">Current: {player.instruction}</div>
                    </div>

                    <select
                      value={player.instruction}
                      onChange={(e) => handleInstructionChange(player.id, e.target.value as IndividualInstruction)}
                      className="bg-slate-900 border border-slate-700 text-xs font-bold text-slate-200 rounded-lg px-2 py-1 outline-none focus:border-volt"
                    >
                      <option value="None">None</option>
                      <option value="Defensive">Defensive (Stay Back)</option>
                      <option value="Attacking">Attacking (Join Attack)</option>
                      <option value="Counter Target">Counter Target (No Press)</option>
                      <option value="Deep-Lying">Deep-Lying (Anchor)</option>
                      <option value="Anchoring">Anchoring (Hold Pos)</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: MANAGER & PLAYSTYLE PROFICIENCY */}
          {activeTab === 'manager' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-4">
              <div className="border-b border-slate-800 pb-2">
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Team Playstyle & Manager</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  High proficiency unlocks spatial AI coordination and stat increases.
                </p>
              </div>

              {/* Playstyles List */}
              <div className="space-y-2">
                {(['Possession Game', 'Quick Counter', 'Long Ball Counter', 'Out Wide', 'Long Ball'] as TeamPlaystyle[]).map(style => {
                  const rating = team.manager.proficiencies[style] || 60;
                  const isActive = team.playstyle === style;
                  return (
                    <div
                      key={style}
                      onClick={() => handlePlaystyleChange(style)}
                      className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                        isActive
                          ? 'bg-slate-950 border-volt shadow-lg shadow-volt/10'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-black text-white">{style}</div>
                        <div className="text-[10px] text-slate-400">
                          Manager Proficiency: <strong className="text-slate-200">{rating}</strong>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {rating >= 88 && (
                          <span className="text-[10px] text-emerald-400 bg-emerald-950 border border-emerald-800 px-1.5 py-0.5 rounded font-bold">
                            BOOST +3
                          </span>
                        )}
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isActive ? 'border-volt bg-volt text-slate-950' : 'border-slate-600'}`}>
                          {isActive && <CheckCircle2 className="w-3 h-3" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Manager Profile card */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center gap-3 mt-2">
                <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300">
                  👔
                </div>
                <div>
                  <div className="text-xs font-bold text-white">{team.manager.name}</div>
                  <div className="text-[10px] text-slate-400">{team.manager.tacticalNotes}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. AUTO-PICK CRITERIA SELECTION MODAL */}
      {showAutoPickModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-xl p-6 shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-volt text-xs font-black uppercase tracking-wider">
                <Wand2 className="w-4 h-4" /> eFootball Auto-Pick Assembly Algorithm
              </div>
              <button
                onClick={() => setShowAutoPickModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-wider">
                Select Auto-Pick Criterion
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Automatically populates your starting eleven and substitutes through the three-phase eFootball positioning algorithm.
              </p>
            </div>

            {/* Criteria Options */}
            <div className="space-y-2.5">
              {[
                {
                  id: 'ovr',
                  label: '1. Overall Rating (OVR) Hierarchy (Strict eFootball Logic)',
                  desc: 'Filters by registered position, then strictly sorts by raw numerical OVR (ignoring form, stamina, weak foot, or tactical fit).'
                },
                {
                  id: 'playstyle',
                  label: `2. Team Playstyle Synergy (${team.playstyle})`,
                  desc: `Prioritizes players with key stats suited for ${team.playstyle} (e.g. speed for Quick Counter, passing for Possession).`
                },
                {
                  id: 'event_league',
                  label: '3. Event Eligibility & Club Theme',
                  desc: 'Prioritizes players belonging to European powerhouse clubs to satisfy themed event conditions and squad value multipliers.'
                },
                {
                  id: 'utility',
                  label: '4. Positional Flexibility & Tactical Balance',
                  desc: 'Selects players with versatile secondary position proficiencies to prevent defensive mismatches.'
                }
              ].map(opt => (
                <div
                  key={opt.id}
                  onClick={() => setSelectedAutoPickCriterion(opt.id as AutoPickCriterion)}
                  className={`p-3.5 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                    selectedAutoPickCriterion === opt.id
                      ? 'bg-slate-950 border-volt shadow-lg shadow-volt/10'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="text-xs font-black text-white">{opt.label}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{opt.desc}</div>
                  </div>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ml-3 ${
                    selectedAutoPickCriterion === opt.id ? 'border-volt bg-volt text-slate-950' : 'border-slate-600'
                  }`}>
                    {selectedAutoPickCriterion === opt.id && <CheckCircle2 className="w-3 h-3" />}
                  </div>
                </div>
              ))}
            </div>

            {/* THE CATCH (Community Nuance Callout as described in prompt) */}
            <div className="bg-amber-950/40 border border-amber-600/40 rounded-2xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-300">
                  Why Competitive Players Never Rely Purely On Auto-Pick
                </span>
                <p className="text-[11px] text-amber-200/90 leading-relaxed">
                  <strong>The Catch:</strong> Auto-Pick prioritizes raw overall ratings (OVR) over hidden attributes, weak foot accuracy, form, or stamina. Furthermore, it completely ignores <strong>Player Playstyles</strong>—for instance, pairing two <em>Extra Frontman</em> centre-backs who simultaneously vacate defensive lines, leaving you totally exposed.
                </p>
                <p className="text-[11px] text-amber-300/80">
                  <strong>Pack Pool Impact:</strong> Epic Boxes flood your roster with high-OVR filler cards that trick Auto-Pick, while POTW cards lack secondary familiarity. Using versatile Legends or standard base cards gives Auto-Pick exact positional matches to avoid penalties.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowAutoPickModal(false)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyAutoPick}
                className="flex-1 py-3 bg-volt hover:bg-yellow-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
              >
                <Wand2 className="w-4 h-4" /> Run Auto-Pick
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. AUTO-PICK BREAKDOWN REPORT MODAL */}
      {showAutoPickReportModal && autoPickResultDetails && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-volt text-xs font-black uppercase tracking-wider">
                <Wand2 className="w-4 h-4" /> Auto-Pick Algorithm Assembly Report
              </div>
              <button
                onClick={() => setShowAutoPickReportModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-between bg-slate-950 p-3 rounded-2xl border border-slate-800">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">Squad Rating</span>
                <div className="text-xl font-black font-mono text-volt">OVR {autoPickResultDetails.squadValue}</div>
              </div>
              <div className="text-right text-xs text-slate-400">
                <span>11 Starters Configured</span>
              </div>
            </div>

            {/* Tactical Warnings from Algorithm */}
            {autoPickResultDetails.tacticalWarnings.length > 0 && (
              <div className="bg-amber-950/40 border border-amber-600/50 rounded-2xl p-3.5 space-y-1.5">
                <span className="text-xs font-black text-amber-300 uppercase flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Tactical Awareness Warnings (Human Refinement Needed):
                </span>
                <ul className="text-[11px] text-amber-200/90 space-y-1 list-disc list-inside">
                  {autoPickResultDetails.tacticalWarnings.map((warning, i) => (
                    <li key={i}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Slot-by-Slot Breakdown */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-white uppercase tracking-wider">
                Positional Slot Resolution (11 Starters):
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {autoPickResultDetails.slotReports.map((slot) => {
                  const isExact = slot.matchType === 'Primary Match';
                  const isSecondary = slot.matchType === 'Secondary Familiarity';

                  return (
                    <div
                      key={slot.slotIndex}
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-xs px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-volt">
                          {slot.slotPosition}
                        </span>
                        <div>
                          <div className="font-bold text-white leading-tight">{slot.playerName}</div>
                          <div className="text-[10px] text-slate-400">
                            Reg: {slot.registeredPosition} · {slot.playstyle}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                          isExact
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : isSecondary
                            ? 'bg-amber-950 text-amber-400 border border-amber-800'
                            : 'bg-rose-950 text-rose-400 border border-rose-800'
                        }`}>
                          {slot.matchType}
                        </span>
                        <div className="font-mono text-xs font-bold text-slate-300 mt-0.5">
                          {slot.effectiveOvr} OVR
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowAutoPickReportModal(false)}
                className="py-2.5 px-6 bg-volt hover:bg-yellow-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-colors"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
