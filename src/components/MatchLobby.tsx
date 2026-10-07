import React, { useState } from 'react';
import { MatchSettings, Team } from '../types/game';
import { OPPONENT_TEAMS } from '../data/initialData';
import { Play, Shield, CloudRain, Sun, Moon, Sunset, Settings, Gamepad2, Smartphone, Sparkles } from 'lucide-react';
import { sound } from '../services/soundService';

interface MatchLobbyProps {
  userTeam: Team;
  onKickoff: (opponent: Team, settings: MatchSettings) => void;
}

export const MatchLobby: React.FC<MatchLobbyProps> = ({ userTeam, onKickoff }) => {
  const [selectedOpponent, setSelectedOpponent] = useState<Team>(OPPONENT_TEAMS[0]);
  const [stadium, setStadium] = useState<string>("eFootball Stadium");
  const [weather, setWeather] = useState<MatchSettings['weather']>("Night (Floodlights)");
  const [difficulty, setDifficulty] = useState<MatchSettings['difficulty']>("Top Player");
  const [halfLengthSec, setHalfLengthSec] = useState<number>(120);
  const [smartAssist, setSmartAssist] = useState<boolean>(true);
  const [controlMode, setControlMode] = useState<MatchSettings['controlMode']>("classic_touch");

  const handleStart = () => {
    sound.playWhistle(true);
    onKickoff(selectedOpponent, {
      stadium,
      weather,
      difficulty,
      halfLengthSec,
      smartAssist,
      controlMode
    });
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 flex flex-col gap-6 select-none">
      {/* 1. Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-wrap items-center justify-between gap-5 shadow-2xl relative overflow-hidden">
        <div>
          <div className="flex items-center gap-2 text-volt text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-4 h-4" /> Unreal-Engine Simulation Match
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1 uppercase tracking-wider">
            Exhibition Match & Fixtures
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Experience cross-platform football simulation with realistic ball physics, stunning shots, match-up defending, and dynamic stadium lighting.
          </p>
        </div>

        <button
          onClick={handleStart}
          className="py-4 px-8 bg-volt hover:bg-yellow-300 text-slate-950 font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-volt/20 transition-transform active:scale-95 flex items-center gap-2.5"
        >
          <Play className="w-5 h-5 fill-slate-950" /> Kick Off Match
        </button>
      </div>

      {/* 2. Team Clash Matchup Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        {/* Home Team (User's Dream Team) */}
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-700 flex items-center justify-center text-3xl shadow-lg border-2 border-white/40">
            {userTeam.crest}
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
              YOUR DREAM TEAM
            </span>
            <h3 className="text-xl font-black text-white mt-1">{userTeam.name}</h3>
            <div className="text-xs text-slate-400">
              Playstyle: <strong className="text-white">{userTeam.playstyle}</strong> · Chem: <strong className="text-volt">{userTeam.teamChemistry}</strong>
            </div>
          </div>
        </div>

        {/* VS Badge */}
        <div className="flex flex-col items-center">
          <span className="font-mono font-black text-2xl text-slate-500">VS</span>
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">REGULAR 90'</span>
        </div>

        {/* Away Team (Opponent) */}
        <div className="flex items-center justify-end gap-4 w-full md:w-auto text-right">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-400 bg-rose-950 px-2 py-0.5 rounded border border-rose-800">
              OPPONENT CLUB
            </span>
            <h3 className="text-xl font-black text-white mt-1">{selectedOpponent.name}</h3>
            <div className="text-xs text-slate-400">
              Playstyle: <strong className="text-white">{selectedOpponent.playstyle}</strong> · Rating: <strong className="text-volt">96</strong>
            </div>
          </div>
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-700 flex items-center justify-center text-3xl shadow-lg border-2 border-slate-600">
            {selectedOpponent.crest}
          </div>
        </div>
      </div>

      {/* 3. Opponent Selector Carousel */}
      <div className="flex flex-col gap-2.5">
        <span className="text-xs font-black uppercase tracking-wider text-slate-400">
          Select Rival Club
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
          {OPPONENT_TEAMS.map(team => (
            <button
              key={team.id}
              onClick={() => { sound.playClick(); setSelectedOpponent(team); }}
              className={`p-3 rounded-2xl border flex flex-col items-center text-center gap-2 transition-all ${
                selectedOpponent.id === team.id
                  ? 'bg-slate-900 border-volt ring-2 ring-volt/40 shadow-lg'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <span className="text-2xl">{team.crest}</span>
              <div>
                <div className="text-xs font-bold text-white leading-tight">{team.name}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{team.playstyle}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 4. Match Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Weather & Atmosphere */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
          <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Sun className="w-4 h-4 text-amber-400" /> Stadium Atmosphere
          </span>
          <div className="grid grid-cols-2 gap-2">
            {(['Night (Floodlights)', 'Day (Clear)', 'Sunset', 'Rain (Wet Pitch)'] as MatchSettings['weather'][]).map(w => (
              <button
                key={w}
                onClick={() => { sound.playClick(); setWeather(w); }}
                className={`p-2 rounded-xl text-xs font-bold border text-left transition-colors ${
                  weather === w
                    ? 'bg-volt text-slate-950 border-volt'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                {w}
              </button>
            ))}
          </div>
        </div>

        {/* Match Duration & Difficulty */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
          <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Settings className="w-4 h-4 text-cyan-400" /> Match Rules
          </span>
          <div>
            <div className="text-[11px] text-slate-400 mb-1">Difficulty:</div>
            <div className="flex gap-1.5">
              {(['Regular', 'Top Player', 'Legend'] as MatchSettings['difficulty'][]).map(d => (
                <button
                  key={d}
                  onClick={() => { sound.playClick(); setDifficulty(d); }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-colors ${
                    difficulty === d
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[11px] text-slate-400 mb-1">Half Duration:</div>
            <div className="flex gap-1.5">
              {[
                { sec: 60, label: '1 Min' },
                { sec: 120, label: '2 Mins' },
                { sec: 180, label: '3 Mins' }
              ].map(h => (
                <button
                  key={h.sec}
                  onClick={() => { sound.playClick(); setHalfLengthSec(h.sec); }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-colors ${
                    halfLengthSec === h.sec
                      ? 'bg-amber-400 text-slate-950 border-amber-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {h.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Controls & Smart Assist */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between gap-3">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Gamepad2 className="w-4 h-4 text-volt" /> Control Layout & Assistance
            </span>
            <div className="text-xs text-slate-400 mt-2">
              Physical Gamepads (DualSense/Xbox) and Keyboard are actively detected.
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-white">Smart Assist</div>
              <div className="text-[10px] text-slate-400">Automated pass steering & auto-block</div>
            </div>
            <button
              onClick={() => { sound.playClick(); setSmartAssist(!smartAssist); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                smartAssist
                  ? 'bg-volt text-slate-950 border-volt'
                  : 'bg-slate-900 text-slate-500 border-slate-700'
              }`}
            >
              {smartAssist ? 'ENABLED' : 'DISABLED'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
