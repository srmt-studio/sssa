import React, { useState } from 'react';
import { BoosterEffect, PlayerCard as IPlayerCard, UserWallet } from '../types/game';
import { BOOSTER_LIBRARY } from '../data/initialData';
import { 
  X, Sparkles, Check, RefreshCw, Zap, Shield, Flame, ChevronRight, Lock 
} from 'lucide-react';
import { sound } from '../services/soundService';

interface BoosterCraftingModalProps {
  player: IPlayerCard;
  wallet: UserWallet;
  onClose: () => void;
  onUpdatePlayer: (updated: IPlayerCard) => void;
  onUpdateWallet: (updatedWallet: UserWallet) => void;
}

export const BoosterCraftingModal: React.FC<BoosterCraftingModalProps> = ({
  player,
  wallet,
  onClose,
  onUpdatePlayer,
  onUpdateWallet
}) => {
  const [craftMode, setCraftMode] = useState<'random' | 'select'>('random');
  const [selectedBooster, setSelectedBooster] = useState<BoosterEffect>(BOOSTER_LIBRARY[0]);
  const [isCrafting, setIsCrafting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Apply booster to card
  const applyBooster = (booster: BoosterEffect) => {
    // Stat boosts
    const updatedStats = { ...player.baseStats };
    Object.entries(booster.stats).forEach(([statKey, boostVal]) => {
      const key = statKey as keyof typeof updatedStats;
      if (typeof updatedStats[key] === 'number') {
        (updatedStats[key] as number) += boostVal;
      }
    });

    const updatedCard: IPlayerCard = {
      ...player,
      craftableBooster: booster,
      baseStats: updatedStats,
      currentOvr: player.currentOvr + 2
    };

    onUpdatePlayer(updatedCard);
    setSuccessMessage(`Crafted ${booster.name}!`);
    sound.playPackReveal();
  };

  // Craft via Random Token
  const handleRandomCraft = () => {
    if (wallet.randomBoosterTokens <= 0) return;
    setIsCrafting(true);
    sound.playPackReveal();

    setTimeout(() => {
      const rolled = BOOSTER_LIBRARY[Math.floor(Math.random() * BOOSTER_LIBRARY.length)];
      applyBooster(rolled);

      const updatedWallet: UserWallet = {
        ...wallet,
        randomBoosterTokens: wallet.randomBoosterTokens - 1
      };
      onUpdateWallet(updatedWallet);
      setIsCrafting(false);
    }, 1000);
  };

  // Craft via Select Token
  const handleSelectCraft = () => {
    if (wallet.selectBoosterTokens <= 0) return;
    setIsCrafting(true);
    sound.playPackReveal();

    setTimeout(() => {
      applyBooster(selectedBooster);

      const updatedWallet: UserWallet = {
        ...wallet,
        selectBoosterTokens: wallet.selectBoosterTokens - 1
      };
      onUpdateWallet(updatedWallet);
      setIsCrafting(false);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 select-none">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-black px-2 py-0.5 rounded bg-fuchsia-950 text-fuchsia-300 border border-fuchsia-800">
              BOOSTER LAB
            </span>
            <div>
              <h2 className="text-lg font-black text-white uppercase tracking-wider">{player.name}</h2>
              <div className="text-xs text-slate-400">
                Tier: <strong className="text-volt">{player.tier}</strong> · Dual-Booster Architecture
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* DUAL BOOSTER SLOTS VISUALIZER */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Slot 1: Fixed Pre-occupied Signature Booster */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-amber-500/60 flex flex-col justify-between gap-3 shadow-lg shadow-amber-500/10">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
                  Slot 1 · Fixed Signature
                </span>
                <Sparkles className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <div className="text-sm font-black text-white">
                  {player.fixedBooster?.name || "Signature Booster"}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {player.fixedBooster?.description || "Inherent card trait"}
                </div>
              </div>
              <div className="text-[10px] text-amber-300 font-mono font-bold pt-2 border-t border-slate-800">
                Locked Active
              </div>
            </div>

            {/* Slot 2: Craftable Open Slot */}
            <div className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 transition-all ${
              player.craftableBooster
                ? 'bg-slate-950 border-fuchsia-500/60 shadow-lg shadow-fuchsia-500/10'
                : 'bg-slate-950/40 border-dashed border-slate-700'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-fuchsia-400 bg-fuchsia-950 px-2 py-0.5 rounded border border-fuchsia-800">
                  Slot 2 · Craftable Slot
                </span>
                <Zap className="w-4 h-4 text-fuchsia-400" />
              </div>
              <div>
                <div className="text-sm font-black text-white">
                  {player.craftableBooster ? player.craftableBooster.name : "Open Booster Slot"}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {player.craftableBooster 
                    ? player.craftableBooster.description 
                    : "Use Booster Tokens below to synthesize a boost."}
                </div>
              </div>
              <div className="text-[10px] text-fuchsia-300 font-mono font-bold pt-2 border-t border-slate-800">
                {player.craftableBooster ? "Custom Crafted" : "Ready for Crafting"}
              </div>
            </div>
          </div>

          {/* TOKEN SELECTION TABS */}
          <div className="flex items-center bg-slate-950 border border-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setCraftMode('random')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${
                craftMode === 'random' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Random Token (Owned: {wallet.randomBoosterTokens})
            </button>
            <button
              onClick={() => setCraftMode('select')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${
                craftMode === 'select' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Select Token (Owned: {wallet.selectBoosterTokens})
            </button>
          </div>

          {/* METHOD 1: RANDOM TOKEN CRAFT */}
          {craftMode === 'random' && (
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col gap-3">
              <div>
                <h4 className="text-xs font-black text-white uppercase tracking-wider">Random Booster Token</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Synthesize the slot by rolling one of 17 authentic regular boosts at random.
                </p>
              </div>

              <button
                disabled={wallet.randomBoosterTokens <= 0 || isCrafting}
                onClick={handleRandomCraft}
                className="w-full py-3 bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 disabled:opacity-40 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
              >
                {isCrafting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-pink-300" />}
                {isCrafting ? "Crafting Booster..." : "Activate Slot with Random Token"}
              </button>
            </div>
          )}

          {/* METHOD 2: SELECT TOKEN CRAFT */}
          {craftMode === 'select' && (
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col gap-3">
              <div>
                <h4 className="text-xs font-black text-white uppercase tracking-wider">Select Booster Token</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Directly choose your desired booster from the 17 regular boosts.
                </p>
              </div>

              {/* Boosters Catalog */}
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {BOOSTER_LIBRARY.map(boost => (
                  <div
                    key={boost.name}
                    onClick={() => setSelectedBooster(boost)}
                    className={`p-2.5 rounded-xl border cursor-pointer flex items-center justify-between transition-colors ${
                      selectedBooster.name === boost.name
                        ? 'bg-slate-900 border-volt'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-white">{boost.name}</div>
                      <div className="text-[10px] text-slate-400">{boost.description}</div>
                    </div>
                    {selectedBooster.name === boost.name && (
                      <Check className="w-4 h-4 text-volt" />
                    )}
                  </div>
                ))}
              </div>

              <button
                disabled={wallet.selectBoosterTokens <= 0 || isCrafting}
                onClick={handleSelectCraft}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 disabled:opacity-40 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
              >
                {isCrafting ? <RefreshCw className="w-4 h-4 animate-spin text-slate-950" /> : <Sparkles className="w-4 h-4" />}
                {isCrafting ? "Crafting Specific Booster..." : `Craft ${selectedBooster.name}`}
              </button>
            </div>
          )}

          {successMessage && (
            <div className="bg-emerald-950/80 border border-emerald-800 text-emerald-300 p-3 rounded-xl text-xs font-bold text-center">
              ✨ {successMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
