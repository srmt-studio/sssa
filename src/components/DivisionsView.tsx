import React from 'react';
import { DivisionInfo, MatchSettings, Team } from '../types/game';
import { OPPONENT_TEAMS } from '../data/initialData';
import { Trophy, Award, Play, ChevronRight, ShieldCheck, Flame } from 'lucide-react';
import { sound } from '../services/soundService';

interface DivisionsViewProps {
  divisionInfo: DivisionInfo;
  userTeam: Team;
  onStartMatch: (opponent: Team, settings: Partial<MatchSettings>) => void;
}

export const DivisionsView: React.FC<DivisionsViewProps> = ({
  divisionInfo,
  userTeam,
  onStartMatch
}) => {
  // Opponent based on division
  const opponentIdx = (10 - divisionInfo.division) % OPPONENT_TEAMS.length;
  const nextOpponent = OPPONENT_TEAMS[opponentIdx];

  const handlePlayDivisionMatch = () => {
    sound.playClick();
    onStartMatch(nextOpponent, {
      difficulty: divisionInfo.division <= 3 ? 'Legend' : divisionInfo.division <= 6 ? 'Top Player' : 'Regular'
    });
  };

  const progressPct = Math.min(100, (divisionInfo.points / divisionInfo.targetPoints) * 100);

  return (
    <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 flex flex-col gap-6 select-none">
      {/* Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-wrap items-center justify-between gap-5 shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-volt text-xs font-black uppercase tracking-wider">
            <Trophy className="w-4 h-4" /> eFootball League Championship
          </div>
          <h2 className="text-3xl font-black text-white mt-1 uppercase tracking-wider">
            Division {divisionInfo.division}
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-md">
            Climb through competitive tiers. Reach the required points before your 10 match season concludes to secure promotion.
          </p>
        </div>

        {/* Division Badge */}
        <div className="relative z-10 w-24 h-24 rounded-2xl bg-gradient-to-tr from-amber-500 via-yellow-300 to-amber-600 border-2 border-white flex flex-col items-center justify-center text-slate-950 font-black shadow-2xl">
          <span className="text-[10px] uppercase tracking-wider">TIER</span>
          <span className="text-3xl font-mono leading-none">DIV {divisionInfo.division}</span>
        </div>
      </div>

      {/* Season Campaign Progress Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col gap-5 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-volt" />
            <span className="text-sm font-black text-white uppercase tracking-wider">Season Progression</span>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {divisionInfo.matchesRemaining} Matches Remaining (Season Limit: 10)
          </span>
        </div>

        {/* Points Bar */}
        <div>
          <div className="flex justify-between text-xs font-bold text-slate-300 mb-1.5">
            <span>Points: <strong className="text-volt text-sm font-mono">{divisionInfo.points}</strong> / {divisionInfo.targetPoints} required</span>
            <span className="text-cyan-400">{Math.round(progressPct)}%</span>
          </div>
          <div className="w-full h-3.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
            <div
              style={{ width: `${progressPct}%` }}
              className="h-full bg-gradient-to-r from-cyan-400 via-volt to-emerald-400 rounded-full transition-all duration-500"
            />
          </div>
        </div>

        {/* Season Rewards & Next Fixture */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between gap-2">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
              Promotion Clearance Rewards
            </span>
            <div className="flex items-center gap-4">
              <div className="text-volt font-mono font-black text-lg">
                +{divisionInfo.rewardGP.toLocaleString()} GP
              </div>
              <div className="text-amber-400 font-mono font-black text-lg">
                +{divisionInfo.rewardCoins} Coins
              </div>
            </div>
            <span className="text-[10px] text-emerald-400">
              Includes: 1x Select Booster Token upon Division 1 Ascent
            </span>
          </div>

          {/* Next Match Matchup Card */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl">
                {nextOpponent.crest}
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">Upcoming Rival</span>
                <div className="text-sm font-black text-white">{nextOpponent.name}</div>
                <div className="text-[10px] text-cyan-400">{nextOpponent.playstyle}</div>
              </div>
            </div>

            <button
              onClick={handlePlayDivisionMatch}
              className="py-3 px-5 bg-volt hover:bg-yellow-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-transform active:scale-95 flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-slate-950" /> Play Match
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
