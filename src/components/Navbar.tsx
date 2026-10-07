import React from 'react';
import { UserWallet } from '../types/game';
import { 
  Trophy, Shield, Users, Sparkles, ShoppingBag, Target, 
  Volume2, VolumeX, Play, Coins, Layers 
} from 'lucide-react';
import { sound } from '../services/soundService';

export type ActiveView = 
  | 'match' 
  | 'gameplan' 
  | 'myteam' 
  | 'divisions' 
  | 'packs' 
  | 'market' 
  | 'training';

interface NavbarProps {
  currentView: ActiveView;
  onSelectView: (view: ActiveView) => void;
  wallet: UserWallet;
  isMuted: boolean;
  onToggleMute: () => void;
  inMatch: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onSelectView,
  wallet,
  isMuted,
  onToggleMute,
  inMatch
}) => {
  const navItems: { id: ActiveView; label: string; icon: React.ReactNode }[] = [
    { id: 'match', label: 'Match', icon: <Play className="w-3.5 h-3.5 fill-current" /> },
    { id: 'gameplan', label: 'Game Plan', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'myteam', label: 'My Squad', icon: <Users className="w-3.5 h-3.5" /> },
    { id: 'divisions', label: 'Divisions', icon: <Trophy className="w-3.5 h-3.5" /> },
    { id: 'packs', label: 'Special Packs', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: 'market', label: 'Market (GP)', icon: <ShoppingBag className="w-3.5 h-3.5" /> },
    { id: 'training', label: 'Training Ground', icon: <Target className="w-3.5 h-3.5" /> }
  ];

  if (inMatch) {
    return null; // Don't show header inside live match
  }

  return (
    <header className="w-full bg-slate-950/95 border-b border-slate-800 backdrop-blur-md sticky top-0 z-40 select-none">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div 
          onClick={() => { sound.playClick(); onSelectView('match'); }}
          className="flex items-center gap-2.5 cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-volt p-0.5 shadow-lg shadow-blue-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center font-black text-sm text-volt tracking-tighter">
              eF
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-black text-base text-white tracking-wider flex items-center gap-1 font-sans">
              eFootball <span className="text-volt text-[10px] uppercase font-mono px-1 rounded bg-volt/10 border border-volt/30">PRO</span>
            </span>
            <span className="text-[9px] text-slate-400 font-mono tracking-widest uppercase">
              Championship Engine
            </span>
          </div>
        </div>

        {/* Center Nav Items */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800/80">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => {
                sound.playClick();
                onSelectView(item.id);
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
                currentView === item.id
                  ? 'bg-volt text-slate-950 shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Right: Currency & Audio controls */}
        <div className="flex items-center gap-3">
          {/* GP (Game Points) */}
          <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-800 text-xs font-mono font-bold">
            <span className="text-slate-400 text-[10px]">GP:</span>
            <span className="text-slate-200">{wallet.gp.toLocaleString()}</span>
          </div>

          {/* eFootball Coins */}
          <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-800 text-xs font-mono font-bold">
            <span className="text-amber-400">🪙</span>
            <span className="text-volt">{wallet.coins}</span>
          </div>

          {/* Mute button */}
          <button
            onClick={() => {
              sound.playClick();
              onToggleMute();
            }}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
            title={isMuted ? "Unmute Sound" : "Mute Sound"}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-slate-300" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav Bar */}
      <div className="lg:hidden flex items-center justify-between px-3 py-2 bg-slate-900/90 border-t border-slate-800/80 overflow-x-auto gap-2">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => {
              sound.playClick();
              onSelectView(item.id);
            }}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg whitespace-nowrap flex items-center gap-1 ${
              currentView === item.id
                ? 'bg-volt text-slate-950'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </header>
  );
};
