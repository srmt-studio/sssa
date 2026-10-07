import React, { useState } from 'react';
import { CardTier, PlayerCard as IPlayerCard, UserWallet } from '../types/game';
import { PlayerCard } from './PlayerCard';
import { Sparkles, Zap, Award, Filter, Search } from 'lucide-react';
import { sound } from '../services/soundService';

interface MySquadViewProps {
  players: IPlayerCard[];
  wallet: UserWallet;
  onSelectPlayerForProgression: (p: IPlayerCard) => void;
  onSelectPlayerForBooster: (p: IPlayerCard) => void;
}

export const MySquadView: React.FC<MySquadViewProps> = ({
  players,
  wallet,
  onSelectPlayerForProgression,
  onSelectPlayerForBooster
}) => {
  const [filterTier, setFilterTier] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(players[0]?.id || '');

  const filtered = players.filter(p => {
    const matchesTier = filterTier === 'all' || p.tier === filterTier;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.club.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTier && matchesSearch;
  });

  const selectedPlayer = players.find(p => p.id === selectedPlayerId) || players[0];

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 flex flex-col gap-5 select-none">
      {/* Squad Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-volt text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-4 h-4" /> My Dream Team Squad
          </div>
          <h2 className="text-xl font-black text-white mt-1 uppercase tracking-wider">
            Player Development & Booster Lab
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Optimize card progression points, train random skill traits, and synthesize dual boosters for Epic cards.
          </p>
        </div>

        {/* Resources Badges */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <span className="text-slate-400">EXP Programs:</span>{' '}
            <strong className="text-cyan-400">{wallet.exp10000 + wallet.exp4000 + wallet.exp1000}</strong>
          </div>
          <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <span className="text-slate-400">Skill Tokens:</span>{' '}
            <strong className="text-volt">{wallet.skillPrograms}</strong>
          </div>
          <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <span className="text-slate-400">Booster Tokens:</span>{' '}
            <strong className="text-fuchsia-400">{wallet.randomBoosterTokens + wallet.selectBoosterTokens}</strong>
          </div>
          <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <span className="text-slate-400">Position Programs:</span>{' '}
            <strong className="text-emerald-400">{wallet.positionPrograms}</strong>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        {/* Tier filter tabs */}
        <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl overflow-x-auto">
          {['all', 'Epic', 'Big Time', 'Show Time', 'Highlight', 'Standard'].map(t => (
            <button
              key={t}
              onClick={() => { sound.playClick(); setFilterTier(t); }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors capitalize ${
                filterTier === t ? 'bg-volt text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search player, position..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-xs text-white pl-9 pr-3 py-2 rounded-xl outline-none focus:border-volt w-48 sm:w-64"
          />
        </div>
      </div>

      {/* Cards Grid & Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: Cards List (8 cols) */}
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
          {filtered.map(card => (
            <PlayerCard
              key={card.id}
              card={card}
              selected={card.id === selectedPlayerId}
              onClick={() => {
                sound.playClick();
                setSelectedPlayerId(card.id);
              }}
            />
          ))}
        </div>

        {/* Right: Selected Card Inspector (4 cols) */}
        {selectedPlayer && (
          <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-4 sticky top-20 shadow-xl">
            <div className="border-b border-slate-800 pb-2">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Player Development Hub</h3>
              <p className="text-xs text-slate-400 mt-0.5">{selectedPlayer.name}</p>
            </div>

            <PlayerCard card={selectedPlayer} />

            {/* Quick Actions */}
            <div className="flex flex-col gap-2">
              <button
                onClick={() => onSelectPlayerForProgression(selectedPlayer)}
                className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg transition-colors"
              >
                <Sparkles className="w-4 h-4 text-cyan-200" />
                Player Progression & Skills
              </button>

              {selectedPlayer.hasBoosterSlots ? (
                <button
                  onClick={() => onSelectPlayerForBooster(selectedPlayer)}
                  className="w-full py-2.5 bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg transition-colors"
                >
                  <Zap className="w-4 h-4 text-fuchsia-200" />
                  Booster Crafting Lab
                </button>
              ) : (
                <div className="text-[11px] text-slate-500 text-center py-2 bg-slate-950 rounded-xl border border-slate-800">
                  Booster Crafting available for Epic and Special tier cards.
                </div>
              )}
            </div>

            {/* In-depth Stats List */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-400 pb-1 border-b border-slate-800">
                <span>Detailed Stats</span>
                <span className="font-mono text-volt font-bold">OVR {selectedPlayer.currentOvr}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Finishing:</span>
                <strong className="font-mono text-white">{selectedPlayer.baseStats.finishing}</strong>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Kicking Power:</span>
                <strong className="font-mono text-white">{selectedPlayer.baseStats.kickingPower}</strong>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Dribbling & Ball Control:</span>
                <strong className="font-mono text-white">{selectedPlayer.baseStats.dribbling} / {selectedPlayer.baseStats.ballControl}</strong>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Speed & Acceleration:</span>
                <strong className="font-mono text-white">{selectedPlayer.baseStats.speed} / {selectedPlayer.baseStats.acceleration}</strong>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Defending:</span>
                <strong className="font-mono text-white">{selectedPlayer.baseStats.defensiveAwareness}</strong>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Stamina:</span>
                <strong className="font-mono text-white">{selectedPlayer.baseStats.stamina}</strong>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
