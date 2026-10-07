import React, { useEffect, useRef, useState } from 'react';
import { MatchEngine, MatchStats } from '../engine/MatchEngine';
import { PlayerCard } from '../types/game';
import { 
  Play, Pause, RotateCcw, Volume2, VolumeX, Shield, Zap, Sparkles, 
  Settings2, Users, Trophy, ChevronRight, X
} from 'lucide-react';
import { sound } from '../services/soundService';

interface MatchOverlayProps {
  engine: MatchEngine;
  onExitMatch: () => void;
  benchPlayers: PlayerCard[];
  onSubDone: (starterId: string, benchPlayer: PlayerCard) => void;
}

export const MatchOverlay: React.FC<MatchOverlayProps> = ({
  engine,
  onExitMatch,
  benchPlayers,
  onSubDone
}) => {
  const [stats, setStats] = useState<MatchStats>(engine.stats);
  const [phase, setPhase] = useState(engine.phase);
  const [matchMinute, setMatchMinute] = useState(engine.matchMinute);
  const [isPaused, setIsPaused] = useState(false);
  const [showSubModal, setShowSubModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [smartAssist, setSmartAssist] = useState(engine.settings.smartAssist);
  const [isStunActive, setIsStunActive] = useState(engine.isStunModifier);
  const [subsCount, setSubsCount] = useState(0);

  // Joystick touch state
  const joystickRef = useRef<HTMLDivElement | null>(null);
  const [joystickTouchId, setJoystickTouchId] = useState<number | null>(null);
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });

  // Gamepad loop & keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (['arrowup', 'w'].includes(key)) engine.inputDirection.y = -1;
      if (['arrowdown', 's'].includes(key)) engine.inputDirection.y = 1;
      if (['arrowleft', 'a'].includes(key)) engine.inputDirection.x = -1;
      if (['arrowright', 'd'].includes(key)) engine.inputDirection.x = 1;

      // Sprint
      if (e.shiftKey || key === 'shift') {
        engine.setSprint(true);
      }
      // Stunning modifier
      if (key === 'e' || key === 'r') {
        engine.toggleStunModifier(true);
        setIsStunActive(true);
      }
      // Match-up defensive stance
      if (key === 'q' || key === ' ') {
        engine.setMatchUp(true);
      }

      // Actions: J = Pass, K = Shoot, L = Through, I = Lofted/Slide
      if (key === 'j') {
        engine.startCharge('pass');
      } else if (key === 'k') {
        engine.startCharge('shot');
      } else if (key === 'l') {
        engine.startCharge('through');
      } else if (key === 'i') {
        engine.startCharge('lofted');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (['arrowup', 'w', 'arrowdown', 's'].includes(key)) engine.inputDirection.y = 0;
      if (['arrowleft', 'a', 'arrowright', 'd'].includes(key)) engine.inputDirection.x = 0;

      if (e.key === 'Shift') {
        engine.setSprint(false);
      }
      if (key === 'e' || key === 'r') {
        engine.toggleStunModifier(false);
        setIsStunActive(false);
      }
      if (key === 'q' || key === ' ') {
        engine.setMatchUp(false);
      }

      if (['j', 'k', 'l', 'i'].includes(key)) {
        engine.releaseCharge();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Sync interval for scoreboard
    const timer = setInterval(() => {
      setStats({ ...engine.stats });
      setPhase(engine.phase);
      setMatchMinute(engine.matchMinute);

      // Check physical gamepad (DualSense / Xbox)
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      const gp = gamepads[0];
      if (gp) {
        // Left stick
        const lx = Math.abs(gp.axes[0]) > 0.15 ? gp.axes[0] : 0;
        const ly = Math.abs(gp.axes[1]) > 0.15 ? gp.axes[1] : 0;
        engine.setJoystickVector(lx, ly);

        // R2 trigger (Sprint)
        const sprintBtn = gp.buttons[7]?.pressed || gp.buttons[5]?.pressed;
        engine.setSprint(!!sprintBtn);

        // L2 trigger (Match-up)
        const matchUpBtn = gp.buttons[6]?.pressed || gp.buttons[4]?.pressed;
        engine.setMatchUp(!!matchUpBtn);

        // R1 (Stunning modifier)
        const stunBtn = gp.buttons[5]?.pressed;
        if (stunBtn) {
          engine.toggleStunModifier(true);
          setIsStunActive(true);
        }

        // Face buttons: 0 = Bottom (A/Cross: Pass), 1 = Right (B/Circle: Shoot), 2 = Left (X/Square: Lofted), 3 = Top (Y/Triangle: Through)
        if (gp.buttons[0]?.pressed) engine.quickAction('pass');
        if (gp.buttons[1]?.pressed) engine.quickAction('shot');
        if (gp.buttons[2]?.pressed) engine.quickAction('lofted');
        if (gp.buttons[3]?.pressed) engine.quickAction('through');
      }
    }, 100);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      clearInterval(timer);
    };
  }, [engine]);

  // Touch joystick handlers
  const handleJoystickTouchStart = (e: React.TouchEvent) => {
    const touch = e.changedTouches[0];
    setJoystickTouchId(touch.identifier);
    updateJoystickPos(touch.clientX, touch.clientY);
  };

  const handleJoystickTouchMove = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === joystickTouchId) {
        updateJoystickPos(touch.clientX, touch.clientY);
        break;
      }
    }
  };

  const handleJoystickTouchEnd = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === joystickTouchId) {
        setJoystickTouchId(null);
        setJoystickPos({ x: 0, y: 0 });
        engine.setJoystickVector(0, 0);
        break;
      }
    }
  };

  const updateJoystickPos = (clientX: number, clientY: number) => {
    if (!joystickRef.current) return;
    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const maxR = 48;

    let dx = clientX - centerX;
    let dy = clientY - centerY;
    const dist = Math.hypot(dx, dy);

    if (dist > maxR) {
      dx = (dx / dist) * maxR;
      dy = (dy / dist) * maxR;
    }

    setJoystickPos({ x: dx, y: dy });
    engine.setJoystickVector(dx / maxR, dy / maxR);
  };

  const controlled = engine.getControlledPlayer();
  const controlledCard = controlled?.cardData;

  const totalPossession = Math.max(1, stats.homePossessionSec + stats.awayPossessionSec);
  const homePossessionPct = Math.round((stats.homePossessionSec / totalPossession) * 100);
  const awayPossessionPct = 100 - homePossessionPct;

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 select-none">
      {/* 1. TOP BROADCAST HEADER & SCOREBUG */}
      <div className="flex items-start justify-between w-full pointer-events-auto">
        {/* Scorebug */}
        <div className="flex items-stretch bg-slate-950/90 backdrop-blur-md rounded-lg border border-slate-800 shadow-2xl overflow-hidden">
          {/* Match Minute */}
          <div className="px-3 py-2 bg-slate-900 flex flex-col items-center justify-center border-r border-slate-800 min-w-[56px]">
            <span className="text-volt font-mono font-black text-sm tracking-widest">
              {matchMinute}'
            </span>
            <span className="text-[10px] text-slate-400 font-semibold uppercase">
              {engine.currentHalf === 1 ? '1ST' : '2ND'}
            </span>
          </div>

          {/* Home Team */}
          <div className="flex items-center gap-2.5 px-3.5 py-2">
            <span className="text-lg">{engine.homeTeam.crest}</span>
            <span className="font-bold text-sm tracking-wider text-white">
              {engine.homeTeam.shortName}
            </span>
            <span className="font-mono font-black text-lg text-white ml-1">
              {stats.homeScore}
            </span>
          </div>

          <div className="flex items-center text-slate-500 font-bold px-1">-</div>

          {/* Away Team */}
          <div className="flex items-center gap-2.5 px-3.5 py-2">
            <span className="font-mono font-black text-lg text-white mr-1">
              {stats.awayScore}
            </span>
            <span className="font-bold text-sm tracking-wider text-slate-200">
              {engine.awayTeam.shortName}
            </span>
            <span className="text-lg">{engine.awayTeam.crest}</span>
          </div>

          {/* Tactical Indicator */}
          <div className="hidden sm:flex items-center px-3 bg-slate-900/60 border-l border-slate-800 text-[11px] text-cyan-400 font-medium">
            <span>{engine.homeTeam.playstyle}</span>
          </div>
        </div>

        {/* Center Banner / Goal Celebration */}
        {phase === 'goal_celebration' && (
          <div className="animate-bounce bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500 text-white font-black text-xl sm:text-2xl px-6 py-2 rounded-full shadow-2xl border-2 border-yellow-300 uppercase tracking-widest">
            ⚽ GOOOAL!
          </div>
        )}

        {/* Top Right Action Tools */}
        <div className="flex items-center gap-2">
          {/* Smart Assist Toggle */}
          <button
            onClick={() => {
              const val = !smartAssist;
              setSmartAssist(val);
              engine.settings.smartAssist = val;
            }}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              smartAssist 
                ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300' 
                : 'bg-slate-900/80 border-slate-700 text-slate-400'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Assist:</span> {smartAssist ? 'ON' : 'OFF'}
          </button>

          {/* Match Stats */}
          <button
            onClick={() => setShowStatsModal(true)}
            className="p-2 bg-slate-900/80 hover:bg-slate-800 border border-slate-700 rounded-lg text-slate-200 transition-colors"
            title="Match Statistics"
          >
            <Trophy className="w-4 h-4" />
          </button>

          {/* Substitutions */}
          <button
            onClick={() => setShowSubModal(true)}
            className="p-2 bg-slate-900/80 hover:bg-slate-800 border border-slate-700 rounded-lg text-slate-200 transition-colors relative"
            title="Substitutions"
          >
            <Users className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 bg-volt text-slate-950 text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center">
              {5 - subsCount}
            </span>
          </button>

          {/* Pause / Exit */}
          <button
            onClick={onExitMatch}
            className="px-3 py-1.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-700 text-rose-200 text-xs font-bold rounded-lg transition-colors"
          >
            Exit
          </button>
        </div>
      </div>

      {/* 2. CENTER RADAR MINIMAP & CONTROLS HINT */}
      <div className="w-full flex items-center justify-between pointer-events-none">
        {/* Radar Pitch Minimap */}
        <div className="w-44 h-28 bg-slate-950/80 border border-slate-800 rounded-lg relative overflow-hidden backdrop-blur-sm pointer-events-auto hidden md:block">
          {/* Halfway line */}
          <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-slate-700/60" />
          {/* Center circle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border border-slate-700/60" />
          {/* Penalty boxes */}
          <div className="absolute top-1/2 -translate-y-1/2 left-0 w-6 h-12 border-r border-t border-b border-slate-700/60" />
          <div className="absolute top-1/2 -translate-y-1/2 right-0 w-6 h-12 border-l border-t border-b border-slate-700/60" />

          {/* Players Dots */}
          {engine.players.map(p => {
            const px = (p.x / engine.width) * 100;
            const py = (p.y / engine.height) * 100;
            const isHome = p.teamSide === 'home';
            const isMe = p.id === engine.controlledPlayerId;
            return (
              <div
                key={p.id}
                style={{ left: `${px}%`, top: `${py}%` }}
                className={`absolute w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full ${
                  isMe 
                    ? 'bg-volt ring-2 ring-white scale-125 z-10' 
                    : isHome 
                    ? 'bg-cyan-400' 
                    : 'bg-rose-500'
                }`}
              />
            );
          })}

          {/* Ball Dot */}
          <div
            style={{
              left: `${(engine.ball.x / engine.width) * 100}%`,
              top: `${(engine.ball.y / engine.height) * 100}%`
            }}
            className="absolute w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-sm ring-1 ring-yellow-400 z-20"
          />
        </div>

        {/* Keyboard Quick Guide for Desktop */}
        <div className="hidden lg:flex flex-col gap-1 bg-slate-950/70 p-2.5 rounded-lg border border-slate-800 text-[11px] text-slate-300">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Controls Guide</div>
          <div className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-volt font-mono text-[10px]">WASD</kbd> Move
            <span className="text-slate-600">·</span>
            <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-cyan-400 font-mono text-[10px]">SHIFT</kbd> Dash
            <span className="text-slate-600">·</span>
            <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-fuchsia-400 font-mono text-[10px]">E</kbd> Stunning
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-[10px]">J</kbd> Pass
            <span className="text-slate-600">·</span>
            <kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-[10px]">K</kbd> Shoot
            <span className="text-slate-600">·</span>
            <kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-[10px]">L</kbd> Through
            <span className="text-slate-600">·</span>
            <kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-[10px]">Q / Space</kbd> Match-Up
          </div>
        </div>
      </div>

      {/* 3. BOTTOM CONTROLS & PLAYER BANNER */}
      <div className="flex items-end justify-between w-full pointer-events-auto">
        {/* Left: Virtual Analog Joystick (Mobile / Touch) */}
        <div className="relative flex flex-col items-start gap-2">
          {/* Active Player Card Plate */}
          {controlled && (
            <div className="flex items-center gap-2.5 bg-slate-950/90 border border-slate-800 p-2 rounded-lg backdrop-blur-md shadow-xl min-w-[200px]">
              <div className="w-8 h-8 rounded bg-gradient-to-tr from-slate-800 to-slate-700 flex items-center justify-center font-black text-xs text-volt border border-slate-700">
                {controlled.number}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-white tracking-wide">
                    {controlled.shortName}
                  </span>
                  <span className="text-[10px] text-cyan-400 font-semibold px-1 rounded bg-cyan-950/80 border border-cyan-800">
                    {controlled.position}
                  </span>
                </div>
                {/* Stamina Meter */}
                <div className="w-28 h-1.5 bg-slate-800 rounded-full mt-1 overflow-hidden">
                  <div
                    style={{ width: `${controlled.stamina}%` }}
                    className={`h-full transition-all ${
                      controlled.stamina > 50 ? 'bg-emerald-400' : controlled.stamina > 25 ? 'bg-amber-400' : 'bg-rose-500'
                    }`}
                  />
                </div>
                {/* Out of Position Debuff Banner */}
                {controlled.outOfPositionPenalty !== 'Full' && (
                  <div className="flex items-center gap-1 mt-1 text-[9px] font-bold text-rose-400 bg-rose-950/80 px-1.5 py-0.5 rounded border border-rose-800">
                    <span>⚠️ {controlled.outOfPositionPenalty === 'Partial' ? 'Out of Pos (-10% Stats)' : 'Zero Familiarity (-20% Stats)'}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Floating Joystick Base */}
          <div
            ref={joystickRef}
            onTouchStart={handleJoystickTouchStart}
            onTouchMove={handleJoystickTouchMove}
            onTouchEnd={handleJoystickTouchEnd}
            className="w-28 h-28 rounded-full bg-slate-900/60 border-2 border-slate-700/80 backdrop-blur-sm relative flex items-center justify-center touch-none select-none cursor-pointer active:border-volt/60"
          >
            {/* Center Thumb */}
            <div
              style={{
                transform: `translate(${joystickPos.x}px, ${joystickPos.y}px)`
              }}
              className="w-12 h-12 rounded-full bg-gradient-to-tr from-slate-700 to-slate-600 border-2 border-volt shadow-lg flex items-center justify-center pointer-events-none transition-transform duration-75"
            >
              <div className="w-3 h-3 rounded-full bg-volt" />
            </div>
          </div>
        </div>

        {/* Right: Action Buttons Pad */}
        <div className="flex flex-col items-end gap-2.5">
          {/* Stunning Modifier Toggle Button */}
          <button
            onClick={() => {
              const next = !isStunActive;
              setIsStunActive(next);
              engine.toggleStunModifier(next);
            }}
            className={`px-4 py-2 rounded-xl font-black text-xs tracking-wider flex items-center gap-1.5 border transition-all shadow-lg ${
              isStunActive
                ? 'bg-gradient-to-r from-fuchsia-600 to-pink-600 border-pink-300 text-white shadow-pink-500/40 ring-2 ring-pink-400'
                : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:border-slate-500'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-pink-300" />
            STUNNING {isStunActive ? 'ACTIVE' : 'OFF'}
          </button>

          {/* Action Buttons Cluster */}
          <div className="grid grid-cols-3 gap-2 touch-none">
            {/* Match-Up / Shield */}
            <button
              onMouseDown={() => engine.setMatchUp(true)}
              onMouseUp={() => engine.setMatchUp(false)}
              onTouchStart={() => engine.setMatchUp(true)}
              onTouchEnd={() => engine.setMatchUp(false)}
              className="w-14 h-14 rounded-2xl bg-slate-900/90 border border-cyan-500/60 active:bg-cyan-900/80 text-cyan-300 flex flex-col items-center justify-center text-[10px] font-bold shadow-lg"
            >
              <Shield className="w-4 h-4 mb-0.5" />
              MATCH-UP
            </button>

            {/* Through Ball */}
            <button
              onMouseDown={() => engine.startCharge('through')}
              onMouseUp={() => engine.releaseCharge()}
              onTouchStart={() => engine.startCharge('through')}
              onTouchEnd={() => engine.releaseCharge()}
              className="w-14 h-14 rounded-2xl bg-slate-900/90 border border-slate-700 active:bg-slate-800 text-slate-200 flex flex-col items-center justify-center text-[10px] font-bold shadow-lg"
            >
              <ChevronRight className="w-4 h-4 mb-0.5 text-amber-400 rotate-[-45deg]" />
              THROUGH
            </button>

            {/* Dash / Sprint */}
            <button
              onMouseDown={() => engine.setSprint(true)}
              onMouseUp={() => engine.setSprint(false)}
              onTouchStart={() => engine.setSprint(true)}
              onTouchEnd={() => engine.setSprint(false)}
              className="w-14 h-14 rounded-2xl bg-slate-900/90 border border-volt/60 active:bg-volt/20 text-volt flex flex-col items-center justify-center text-[10px] font-black shadow-lg"
            >
              <Zap className="w-4 h-4 mb-0.5" />
              DASH
            </button>

            {/* Slide Tackle */}
            <button
              onClick={() => {
                const p = engine.getControlledPlayer();
                if (p) engine.triggerSlideTackle(p);
              }}
              className="w-14 h-14 rounded-2xl bg-slate-900/90 border border-rose-500/60 active:bg-rose-900 text-rose-300 flex flex-col items-center justify-center text-[10px] font-bold shadow-lg"
            >
              SLIDE
            </button>

            {/* Pass */}
            <button
              onMouseDown={() => engine.startCharge('pass')}
              onMouseUp={() => engine.releaseCharge()}
              onTouchStart={() => engine.startCharge('pass')}
              onTouchEnd={() => engine.releaseCharge()}
              className="w-14 h-14 rounded-2xl bg-slate-900/90 border border-slate-700 active:bg-slate-800 text-slate-200 flex flex-col items-center justify-center text-[10px] font-bold shadow-lg"
            >
              PASS
            </button>

            {/* Shoot */}
            <button
              onMouseDown={() => engine.startCharge('shot')}
              onMouseUp={() => engine.releaseCharge()}
              onTouchStart={() => engine.startCharge('shot')}
              onTouchEnd={() => engine.releaseCharge()}
              className={`w-14 h-14 rounded-2xl border flex flex-col items-center justify-center text-[10px] font-black shadow-lg transition-all ${
                isStunActive
                  ? 'bg-fuchsia-950 border-pink-400 text-pink-300 active:bg-pink-900'
                  : 'bg-slate-900/90 border-amber-400 active:bg-amber-950 text-amber-300'
              }`}
            >
              SHOOT
            </button>
          </div>
        </div>
      </div>

      {/* 4. SUBSTITUTION MODAL */}
      {showSubModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 pointer-events-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-wider">Tactical Substitutions</h3>
                <p className="text-xs text-slate-400">Available substitutions: {5 - subsCount} of 5</p>
              </div>
              <button
                onClick={() => setShowSubModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4">
              <div className="text-xs font-bold uppercase tracking-wider text-volt">Bench Substitutes</div>
              {benchPlayers.length === 0 ? (
                <div className="text-sm text-slate-400 py-6 text-center">No available bench substitutes.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {benchPlayers.map(bp => (
                    <div
                      key={bp.id}
                      className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                          {bp.position}
                        </span>
                        <div>
                          <div className="text-sm font-bold text-white">{bp.shortName}</div>
                          <div className="text-xs text-slate-400">OVR {bp.currentOvr} · Stamina 100%</div>
                        </div>
                      </div>
                      <button
                        disabled={subsCount >= 5}
                        onClick={() => {
                          const currentControlled = engine.getControlledPlayer();
                          if (currentControlled) {
                            engine.makeSubstitution(currentControlled.id, bp);
                            setSubsCount(prev => prev + 1);
                            onSubDone(currentControlled.id, bp);
                            setShowSubModal(false);
                            sound.playWhistle(false);
                          }
                        }}
                        className="px-3 py-1.5 bg-volt text-slate-950 font-black text-xs rounded-lg hover:bg-yellow-300 transition-colors disabled:opacity-50"
                      >
                        Sub In
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. MATCH STATS MODAL */}
      {showStatsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 pointer-events-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-5 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-black text-white uppercase tracking-wider">Match Statistics</h3>
              <button
                onClick={() => setShowStatsModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Score Summary */}
            <div className="flex items-center justify-around py-3 bg-slate-950 rounded-xl border border-slate-800">
              <div className="text-center">
                <div className="text-2xl font-black text-white">{stats.homeScore}</div>
                <div className="text-xs text-slate-400 font-bold">{engine.homeTeam.name}</div>
              </div>
              <div className="text-sm font-mono text-slate-500 font-bold">VS</div>
              <div className="text-center">
                <div className="text-2xl font-black text-white">{stats.awayScore}</div>
                <div className="text-xs text-slate-400 font-bold">{engine.awayTeam.name}</div>
              </div>
            </div>

            {/* Comparative Stat Bars */}
            <div className="space-y-3 text-xs">
              {/* Possession */}
              <div>
                <div className="flex justify-between text-slate-300 font-semibold mb-1">
                  <span>{homePossessionPct}%</span>
                  <span className="uppercase text-slate-400">Possession</span>
                  <span>{awayPossessionPct}%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden flex">
                  <div style={{ width: `${homePossessionPct}%` }} className="bg-cyan-400 h-full" />
                  <div style={{ width: `${awayPossessionPct}%` }} className="bg-rose-500 h-full" />
                </div>
              </div>

              {/* Total Shots */}
              <div className="flex justify-between py-1.5 border-b border-slate-800 text-slate-300">
                <span className="font-bold">{stats.homeShots}</span>
                <span className="uppercase text-slate-400">Total Shots</span>
                <span className="font-bold">{stats.awayShots}</span>
              </div>

              {/* Shots on Target */}
              <div className="flex justify-between py-1.5 border-b border-slate-800 text-slate-300">
                <span className="font-bold">{stats.homeShotsOnTarget}</span>
                <span className="uppercase text-slate-400">Shots on Target</span>
                <span className="font-bold">{stats.awayShotsOnTarget}</span>
              </div>

              {/* Passes Completed */}
              <div className="flex justify-between py-1.5 border-b border-slate-800 text-slate-300">
                <span className="font-bold">{stats.homePassesCompleted}</span>
                <span className="uppercase text-slate-400">Passes Completed</span>
                <span className="font-bold">{stats.awayPassesCompleted}</span>
              </div>
            </div>

            {/* Goalscorers List */}
            {stats.scorers.length > 0 && (
              <div className="mt-2">
                <div className="text-[11px] uppercase font-bold text-slate-400 mb-1.5">Goalscorers</div>
                <div className="space-y-1">
                  {stats.scorers.map((sc, i) => (
                    <div key={i} className="text-xs flex items-center justify-between text-slate-300 bg-slate-950/60 p-2 rounded">
                      <span className="flex items-center gap-1.5">
                        <span>⚽ {sc.name}</span>
                        {sc.isStunning && (
                          <span className="text-[10px] text-pink-400 font-bold px-1 rounded bg-pink-950/60 border border-pink-800">
                            STUNNING
                          </span>
                        )}
                      </span>
                      <span className="font-mono text-volt">{sc.minute}'</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Instant Replay Button */}
            <button
              onClick={() => {
                setShowStatsModal(false);
                engine.startInstantReplay();
              }}
              className="mt-2 w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <RotateCcw className="w-4 h-4" /> Watch Instant Replay
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
