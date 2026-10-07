import React from 'react';
import { PlayerCard as IPlayerCard, getEffectiveOVR, getPositionProficiency } from '../types/game';
import { Sparkles, Zap, Shield, Flame, AlertTriangle, ArrowDown } from 'lucide-react';

interface PlayerCardProps {
  card: IPlayerCard;
  onClick?: () => void;
  selected?: boolean;
  compact?: boolean;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  card,
  onClick,
  selected = false,
  compact = false
}) => {
  // Check effective OVR considering position familiarity
  const { effectiveOvr, drop, familiarity, isPlaystyleActive } = getEffectiveOVR(card, card.position);
  const isOutOfPosition = drop > 0;

  // Tier styles
  const getTierStyles = () => {
    switch (card.tier) {
      case 'Epic':
        return {
          border: 'border-amber-400/80 shadow-amber-500/20',
          bg: 'bg-gradient-to-b from-amber-950/80 via-slate-900 to-amber-950/90',
          accent: 'text-amber-400',
          badgeBg: 'bg-amber-400 text-slate-950',
          ribbon: 'EPIC'
        };
      case 'Big Time':
        return {
          border: 'border-rose-500/80 shadow-rose-500/20',
          bg: 'bg-gradient-to-b from-rose-950/80 via-slate-900 to-red-950/90',
          accent: 'text-rose-400',
          badgeBg: 'bg-rose-500 text-white',
          ribbon: 'BIG TIME'
        };
      case 'Show Time':
        return {
          border: 'border-cyan-400/80 shadow-cyan-500/20',
          bg: 'bg-gradient-to-b from-cyan-950/80 via-slate-900 to-blue-950/90',
          accent: 'text-cyan-400',
          badgeBg: 'bg-cyan-400 text-slate-950',
          ribbon: 'SHOW TIME'
        };
      case 'Highlight':
        return {
          border: 'border-emerald-400/80 shadow-emerald-500/20',
          bg: 'bg-gradient-to-b from-emerald-950/70 via-slate-900 to-slate-950',
          accent: 'text-emerald-400',
          badgeBg: 'bg-emerald-500 text-white',
          ribbon: 'HIGHLIGHT'
        };
      default:
        return {
          border: 'border-slate-700 shadow-slate-900/40',
          bg: 'bg-gradient-to-b from-slate-900 to-slate-950',
          accent: 'text-slate-300',
          badgeBg: 'bg-slate-700 text-slate-100',
          ribbon: 'STANDARD'
        };
    }
  };

  const style = getTierStyles();

  if (compact) {
    return (
      <div
        onClick={onClick}
        className={`cursor-pointer relative rounded-xl border p-2 flex items-center justify-between transition-all select-none ${style.bg} ${style.border} ${
          selected ? 'ring-2 ring-volt scale-[1.02]' : 'hover:border-slate-500'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-black px-1.5 py-0.5 rounded ${style.badgeBg}`}>
            {card.position}
          </span>
          <div>
            <div className="text-xs font-bold text-white leading-tight flex items-center gap-1">
              <span>{card.shortName}</span>
              {isOutOfPosition && (
                <span className="text-[9px] text-rose-400 font-mono font-bold">
                  ↓-{drop}
                </span>
              )}
            </div>
            <div className="text-[10px] text-slate-400">{card.club}</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {card.craftableBooster && (
            <span className="text-[9px] text-fuchsia-400 font-bold px-1 rounded bg-fuchsia-950/80 border border-fuchsia-800">
              ⚡
            </span>
          )}
          <span className={`text-base font-black font-mono ${isOutOfPosition ? 'text-rose-400' : style.accent}`}>
            {effectiveOvr}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`group cursor-pointer relative w-full rounded-2xl border p-3.5 flex flex-col justify-between transition-all duration-200 select-none shadow-xl ${
        style.bg
      } ${style.border} ${
        selected ? 'ring-2 ring-volt ring-offset-2 ring-offset-slate-950 scale-[1.02]' : 'hover:scale-[1.01] hover:border-slate-400'
      }`}
    >
      {/* Top Header: OVR, Position, Ribbon */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col">
          <div className="flex items-baseline gap-1.5">
            <span className={`text-3xl font-black font-mono tracking-tight leading-none ${isOutOfPosition ? 'text-rose-400' : style.accent}`}>
              {effectiveOvr}
            </span>
            {isOutOfPosition ? (
              <span className="text-xs font-mono font-bold text-rose-400 flex items-center">
                <ArrowDown className="w-3 h-3 inline" />-{drop} <span className="text-slate-500 font-normal ml-0.5">({card.currentOvr})</span>
              </span>
            ) : (
              <span className="text-xs font-mono text-slate-500 font-semibold">
                /{card.baseOvr}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 mt-1">
            <span className={`text-[11px] font-black tracking-wider uppercase px-2 py-0.5 rounded w-fit ${style.badgeBg}`}>
              {card.position}
            </span>
            {card.registeredPosition && card.registeredPosition !== card.position && (
              <span className="text-[10px] text-slate-400 font-mono">
                (Reg: {card.registeredPosition})
              </span>
            )}
          </div>
        </div>

        {/* Ribbon & Booster Icons */}
        <div className="flex flex-col items-end gap-1">
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-950/60 px-2 py-0.5 rounded border border-slate-800">
            {style.ribbon}
          </span>
          {card.fixedBooster && (
            <div className="flex items-center gap-1 text-[10px] text-amber-300 font-bold bg-amber-950/60 border border-amber-800/80 px-1.5 py-0.5 rounded">
              <Sparkles className="w-3 h-3" />
              <span>Booster</span>
            </div>
          )}
        </div>
      </div>

      {/* OUT OF POSITION RATING DROP WARNING */}
      {isOutOfPosition && (
        <div className="mt-2 bg-rose-950/70 border border-rose-800/80 rounded-xl p-1.5 flex items-center gap-1.5 text-[10px] text-rose-300">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          <span>
            {familiarity === 'Partial'
              ? `Partial Familiarity: -${drop} OVR penalty applied.`
              : `Zero Familiarity: -${drop} OVR, -20% stats, stamina drain & playstyle off!`}
          </span>
        </div>
      )}

      {/* Center: Jersey Art / Silhouette & Player Name */}
      <div className="my-2.5 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-slate-700/80 flex items-center justify-center shadow-inner relative group-hover:scale-105 transition-transform">
          <span className="font-mono font-black text-2xl text-slate-200">{card.number}</span>
          {card.craftableBooster && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-fuchsia-600 border border-white flex items-center justify-center text-[10px] text-white">
              ⚡
            </div>
          )}
        </div>
        <div className="mt-2 text-base font-black tracking-wider text-white uppercase font-sans">
          {card.name}
        </div>
        <div className="text-[11px] text-slate-400 font-medium">{card.club} · {card.nationality}</div>
        
        {/* Playstyle active/deactivated badge */}
        {card.playerPlaystyle && (
          <div className="mt-1 flex items-center gap-1 text-[10px]">
            <span className="text-slate-400">Playstyle:</span>
            <span className={`font-bold ${isPlaystyleActive ? 'text-cyan-300' : 'text-rose-400 line-through'}`}>
              {card.playerPlaystyle}
            </span>
            <span className={`text-[9px] px-1 rounded uppercase font-black ${
              isPlaystyleActive 
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' 
                : 'bg-rose-950 text-rose-400 border border-rose-800'
            }`}>
              {isPlaystyleActive ? 'ACTIVE' : 'DEACTIVATED'}
            </span>
          </div>
        )}
      </div>

      {/* Bottom: Core Stats Grid */}
      <div className="grid grid-cols-3 gap-1.5 pt-2.5 border-t border-slate-800/80 text-[11px]">
        <div className="flex flex-col items-center bg-slate-950/50 p-1 rounded border border-slate-800/60">
          <span className="text-[9px] text-slate-500 font-semibold uppercase">Finishing</span>
          <span className={`font-mono font-bold ${card.baseStats.finishing >= 90 ? 'text-emerald-400' : 'text-slate-200'}`}>
            {card.baseStats.finishing}
          </span>
        </div>
        <div className="flex flex-col items-center bg-slate-950/50 p-1 rounded border border-slate-800/60">
          <span className="text-[9px] text-slate-500 font-semibold uppercase">Dribble</span>
          <span className={`font-mono font-bold ${card.baseStats.dribbling >= 90 ? 'text-emerald-400' : 'text-slate-200'}`}>
            {card.baseStats.dribbling}
          </span>
        </div>
        <div className="flex flex-col items-center bg-slate-950/50 p-1 rounded border border-slate-800/60">
          <span className="text-[9px] text-slate-500 font-semibold uppercase">Speed</span>
          <span className={`font-mono font-bold ${card.baseStats.speed >= 90 ? 'text-emerald-400' : 'text-slate-200'}`}>
            {card.baseStats.speed}
          </span>
        </div>
      </div>

      {/* Level bar */}
      <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-400">
        <span>Lv. {card.currentLevel}/{card.maxLevel}</span>
        <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            style={{ width: `${(card.currentLevel / card.maxLevel) * 100}%` }}
            className="h-full bg-cyan-400 rounded-full"
          />
        </div>
      </div>
    </div>
  );
};
