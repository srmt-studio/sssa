import React, { useState } from 'react';
import { 
  EpicBoxTheme, EpicBoxState, PlayerCard as IPlayerCard, UserWallet, PotwPackState 
} from '../types/game';
import { 
  INITIAL_EPIC_BOX_THEMES, 
  POTW_WEEKLY_CARDS, 
  drawFromThemedEpicBox, 
  drawFromPotwPack, 
  calculateClearBoxCost, 
  STANDARD_FILLER_TEMPLATES 
} from '../services/epicBoxService';
import { PlayerCard } from './PlayerCard';
import { 
  X, Sparkles, Trophy, Award, ArrowRight, RotateCcw, 
  AlertCircle, Layers, Coins, Info, CheckCircle2, Eye, PlusCircle, 
  ShieldCheck, HelpCircle, Gift, ArrowRightLeft, RefreshCw, Star, Shield
} from 'lucide-react';
import { sound } from '../services/soundService';

interface PackOpeningModalProps {
  wallet: UserWallet;
  boxThemes?: EpicBoxTheme[];
  onClose: () => void;
  onAddPlayersToSquad: (players: IPlayerCard[]) => void;
  onUpdateWallet: (updatedWallet: UserWallet) => void;
  onNavigateToMarket?: () => void;
}

export const PackOpeningModal: React.FC<PackOpeningModalProps> = ({
  wallet,
  onClose,
  onAddPlayersToSquad,
  onUpdateWallet,
  onNavigateToMarket
}) => {
  // Tabs: Epic Boxes, Featured POTW, Standard GP Market info, Auto-Pick Guide
  const [activePackTab, setActivePackTab] = useState<'epic_boxes' | 'potw' | 'standard_info' | 'guide'>('epic_boxes');
  
  // Multiple Epic Boxes state
  const [epicThemes, setEpicThemes] = useState<EpicBoxTheme[]>(INITIAL_EPIC_BOX_THEMES);
  const [selectedThemeId, setSelectedThemeId] = useState<string>('worldwide_legends');
  
  // POTW pack state
  const [potwSpinsRemaining, setPotwSpinsRemaining] = useState<number>(3);
  
  // Animation / Draw state
  const [packStage, setPackStage] = useState<'select' | 'animating' | 'revealed'>('select');
  const [pulledCards, setPulledCards] = useState<IPlayerCard[]>([]);
  const [hasPulledEpic, setHasPulledEpic] = useState(false);
  const [currentDrawType, setCurrentDrawType] = useState<string>('');
  const [pullStats, setPullStats] = useState<{ epicCount: number; highlightCount: number; standardFillerCount: number; loyaltyEarned: number }>({
    epicCount: 0,
    highlightCount: 0,
    standardFillerCount: 0,
    loyaltyEarned: 0
  });

  const [showProbabilities, setShowProbabilities] = useState(false);
  const [showBoxInspector, setShowBoxInspector] = useState(false);
  const [showFillerExchangeModal, setShowFillerExchangeModal] = useState(false);

  const currentTheme = epicThemes.find(t => t.id === selectedThemeId) || epicThemes[0];
  const boxState = currentTheme.state;

  // Spin Themed Epic Box (1x, 10x, 50x)
  const handleOpenEpicPack = (count: 1 | 10 | 50, costCoins: number) => {
    if (wallet.coins < costCoins) return;
    if (boxState.totalRemaining <= 0) return;

    sound.playPackReveal();
    setCurrentDrawType(`${count}x Special Box Draw (${currentTheme.title})`);
    setPackStage('animating');

    const result = drawFromThemedEpicBox(currentTheme, count);

    // Update Box state within themes
    const updatedThemes = epicThemes.map(t => {
      if (t.id === currentTheme.id) {
        return {
          ...t,
          state: result.newState
        };
      }
      return t;
    });
    setEpicThemes(updatedThemes);

    // Update wallet: coins deducted, loyalty tokens awarded for filler cards pulled!
    const loyaltyTokens = (wallet.fillerLoyaltyTokens || 0) + result.loyaltyTokensEarned;
    const updatedWallet: UserWallet = {
      ...wallet,
      coins: wallet.coins - costCoins,
      exp10000: wallet.exp10000 + (result.hasEpic ? 2 : count >= 10 ? 1 : 0),
      randomBoosterTokens: wallet.randomBoosterTokens + (result.hasEpic ? 1 : 0),
      selectBoosterTokens: wallet.selectBoosterTokens + (result.hasEpic && result.epicCount >= 2 ? 1 : 0),
      fillerLoyaltyTokens: loyaltyTokens
    };
    onUpdateWallet(updatedWallet);

    setPullStats({
      epicCount: result.epicCount,
      highlightCount: result.highlightCount,
      standardFillerCount: result.standardFillerCount,
      loyaltyEarned: result.loyaltyTokensEarned
    });

    const animDuration = count === 50 ? 2500 : count === 10 ? 2000 : 1500;
    setTimeout(() => {
      setPulledCards(result.drawnCards);
      setHasPulledEpic(result.hasEpic);
      setPackStage('revealed');
      if (result.hasEpic) {
        sound.playGoal();
      } else {
        sound.playClick();
      }
    }, animDuration);
  };

  // Spin POTW Pack
  const handleOpenPotwPack = () => {
    if (wallet.coins < 100 || potwSpinsRemaining <= 0) return;

    sound.playPackReveal();
    setCurrentDrawType('POTW Worldwide Special Draw');
    setPackStage('animating');

    const card = drawFromPotwPack(POTW_WEEKLY_CARDS);
    setPotwSpinsRemaining(prev => Math.max(0, prev - 1));

    const updatedWallet: UserWallet = {
      ...wallet,
      coins: wallet.coins - 100,
      exp4000: wallet.exp4000 + 1
    };
    onUpdateWallet(updatedWallet);

    setPullStats({
      epicCount: 0,
      highlightCount: 1,
      standardFillerCount: 0,
      loyaltyEarned: 0
    });

    setTimeout(() => {
      setPulledCards([card]);
      setHasPulledEpic(false);
      setPackStage('revealed');
      sound.playClick();
    }, 1500);
  };

  // Claim Milestone Reward
  const handleClaimMilestone = (milestoneIndex: number) => {
    sound.playGoal();
    const milestone = currentTheme.milestones[milestoneIndex];
    if (!milestone || milestone.claimed) return;

    const updatedThemes = epicThemes.map(t => {
      if (t.id === currentTheme.id) {
        const nextMilestones = [...t.milestones];
        nextMilestones[milestoneIndex] = { ...milestone, claimed: true };
        return { ...t, milestones: nextMilestones };
      }
      return t;
    });
    setEpicThemes(updatedThemes);

    // Award bonus items based on milestone index
    onUpdateWallet({
      ...wallet,
      gp: wallet.gp + 50000,
      positionPrograms: wallet.positionPrograms + (milestoneIndex >= 1 ? 1 : 0),
      randomBoosterTokens: wallet.randomBoosterTokens + (milestoneIndex >= 2 ? 1 : 0),
      selectBoosterTokens: wallet.selectBoosterTokens + (milestoneIndex >= 3 ? 1 : 0)
    });
  };

  // Exchange Filler Loyalty Tokens
  const handleExchangeLoyalty = (cost: number, type: 'position' | 'booster' | 'gp') => {
    const currentTokens = wallet.fillerLoyaltyTokens || 0;
    if (currentTokens < cost) return;

    sound.playClick();
    let updated = { ...wallet, fillerLoyaltyTokens: currentTokens - cost };
    if (type === 'position') {
      updated.positionPrograms += 1;
    } else if (type === 'booster') {
      updated.randomBoosterTokens += 1;
    } else if (type === 'gp') {
      updated.gp += 75000;
    }
    onUpdateWallet(updated);
  };

  // Add Practice Coins
  const handleAddTestingCoins = (amount: number) => {
    sound.playClick();
    onUpdateWallet({
      ...wallet,
      coins: wallet.coins + amount
    });
  };

  // Reset Box
  const handleResetCurrentBox = () => {
    sound.playClick();
    const updatedThemes = epicThemes.map(t => {
      if (t.id === currentTheme.id) {
        return {
          ...t,
          state: {
            totalRemaining: 150,
            epicsRemaining: 3,
            highlightsRemaining: 12,
            standardsRemaining: 135,
            totalSpun: 0
          }
        };
      }
      return t;
    });
    setEpicThemes(updatedThemes);
  };

  const handleClaimAll = () => {
    if (pulledCards.length > 0) {
      onAddPlayersToSquad(pulledCards);
    }
    onClose();
  };

  const total = Math.max(1, boxState.totalRemaining);
  const epicPct = ((boxState.epicsRemaining / total) * 100).toFixed(1);
  const hlPct = ((boxState.highlightsRemaining / total) * 100).toFixed(1);
  const stdPct = ((boxState.standardsRemaining / total) * 100).toFixed(1);
  const coinsToClear = calculateClearBoxCost(boxState.totalRemaining);
  const loyaltyTokens = wallet.fillerLoyaltyTokens || 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-lg flex items-center justify-center p-3 sm:p-5 select-none">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-4xl max-h-[94vh] overflow-hidden shadow-2xl flex flex-col relative">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 flex items-center justify-center text-slate-950 font-black text-sm shadow-md">
              ⚡
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                <span>eFootball Pack Hub & Special Agents</span>
              </h2>
              <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                <span>Balance: <strong className="text-volt font-mono font-bold">🪙 {wallet.coins.toLocaleString()} Coins</strong></span>
                <span>·</span>
                <span>GP: <strong className="text-cyan-400 font-mono font-bold">{wallet.gp.toLocaleString()}</strong></span>
                <span>·</span>
                <span>Loyalty Tokens: <strong className="text-amber-300 font-mono font-bold">🪙 {loyaltyTokens}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleAddTestingCoins(3000)}
              title="Add 3,000 Coins to test box draws"
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-volt text-xs font-bold rounded-xl flex items-center gap-1 transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+3,000 🪙</span>
            </button>

            {packStage !== 'animating' && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* SUB-NAV TABS: Pack Types & Guide */}
        <div className="flex items-center bg-slate-950 px-5 pt-3 border-b border-slate-800 overflow-x-auto gap-2">
          <button
            onClick={() => setActivePackTab('epic_boxes')}
            className={`pb-2.5 px-3 text-xs font-black uppercase tracking-wider transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activePackTab === 'epic_boxes'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>150-Player Epic Boxes (3 Themes)</span>
          </button>

          <button
            onClick={() => setActivePackTab('potw')}
            className={`pb-2.5 px-3 text-xs font-black uppercase tracking-wider transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activePackTab === 'potw'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Featured / POTW Packs</span>
          </button>

          <button
            onClick={() => setActivePackTab('standard_info')}
            className={`pb-2.5 px-3 text-xs font-black uppercase tracking-wider transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activePackTab === 'standard_info'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Standard Player List (GP)</span>
          </button>

          <button
            onClick={() => setActivePackTab('guide')}
            className={`pb-2.5 px-3 text-xs font-black uppercase tracking-wider transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activePackTab === 'guide'
                ? 'border-volt text-volt'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Auto-Pick & Drop Rates Impact</span>
          </button>
        </div>

        {/* STAGE 1: PACK SELECTOR BODY */}
        {packStage === 'select' && (
          <div className="p-5 overflow-y-auto space-y-4 flex-1">
            
            {/* ------------------------------------------------------------- */}
            {/* TAB 1: 150-PLAYER EPIC BOXES */}
            {/* ------------------------------------------------------------- */}
            {activePackTab === 'epic_boxes' && (
              <div className="space-y-4">
                {/* 1. Epic Theme Switcher Tabs (3 Themes: Req #1 & #2) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {epicThemes.map(theme => {
                    const isSelected = theme.id === selectedThemeId;
                    return (
                      <div
                        key={theme.id}
                        onClick={() => {
                          sound.playClick();
                          setSelectedThemeId(theme.id);
                        }}
                        className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-amber-950/40 border-amber-400 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400/50'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300">
                            {theme.category}
                          </span>
                          <span className="text-[10px] font-mono text-volt font-bold">
                            {theme.state.epicsRemaining}/3 Epics Left
                          </span>
                        </div>
                        <div className="text-xs font-black text-white mt-1.5 uppercase tracking-wide">
                          {theme.title}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                          {theme.subtitle}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 2. Selected Box Marquee Showcase */}
                <div className="relative rounded-2xl overflow-hidden bg-gradient-to-tr from-amber-950 via-slate-950 to-amber-900 border-2 border-amber-500/60 p-4 sm:p-5 flex flex-col justify-between shadow-2xl">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-400 text-slate-950 tracking-wider">
                      3 MARQUEE EPICS (150 POOL)
                    </span>
                    <span className="text-xs font-mono font-bold text-amber-300">
                      Remaining in Box: {boxState.totalRemaining} / 150
                    </span>
                  </div>

                  <div className="text-center my-3">
                    <div className="text-2xl sm:text-3xl font-black text-white tracking-widest uppercase">
                      {currentTheme.title}
                    </div>
                    <div className="text-xs text-amber-200/90 mt-1 font-semibold">
                      {currentTheme.subtitle}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      {currentTheme.description}
                    </div>
                  </div>

                  {/* 3 Epics Preview Badges */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 my-2">
                    {currentTheme.epics.map(epic => (
                      <div key={epic.id} className="p-2.5 rounded-xl bg-slate-950/80 border border-amber-500/40 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span>{epic.shortName}</span>
                            <span className="text-[9px] px-1 rounded bg-amber-400/20 text-amber-300 font-mono">
                              {epic.position}
                            </span>
                          </div>
                          <div className="text-[10px] text-amber-300 font-medium">
                            {epic.fixedBooster?.name}
                          </div>
                        </div>
                        <span className="font-mono font-black text-amber-400 text-sm">
                          OVR {epic.currentOvr}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-300 border-t border-amber-800/60 pt-2 flex-wrap gap-2">
                    <span>Pool: <strong>3 Epics</strong> + <strong>12 Highlights</strong> + <strong>135 Standard Fillers</strong></span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setShowBoxInspector(!showBoxInspector)}
                        className="text-cyan-400 hover:underline flex items-center gap-1 font-bold"
                      >
                        <Eye className="w-3.5 h-3.5" /> {showBoxInspector ? 'Hide Pool' : 'Inspect 150 Roster'}
                      </button>
                      <button
                        onClick={() => setShowProbabilities(!showProbabilities)}
                        className="text-volt hover:underline flex items-center gap-1 font-bold"
                      >
                        <Info className="w-3.5 h-3.5" /> Odds & Guarantees
                      </button>
                    </div>
                  </div>
                </div>

                {/* 3. Live Box Remaining Metrics */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="bg-slate-950 p-3 rounded-xl border border-amber-500/40 text-center">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Marquee Epics</div>
                    <div className="text-xl font-black font-mono text-amber-400 mt-0.5">
                      {boxState.epicsRemaining} <span className="text-xs text-slate-600">/ 3</span>
                    </div>
                    <div className="text-[10px] text-amber-300 font-mono mt-0.5">{epicPct}% odds</div>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-cyan-500/40 text-center">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Highlights</div>
                    <div className="text-xl font-black font-mono text-cyan-400 mt-0.5">
                      {boxState.highlightsRemaining} <span className="text-xs text-slate-600">/ 12</span>
                    </div>
                    <div className="text-[10px] text-cyan-300 font-mono mt-0.5">{hlPct}% odds</div>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-700 text-center">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Standard Fillers</div>
                    <div className="text-xl font-black font-mono text-slate-400 mt-0.5">
                      {boxState.standardsRemaining} <span className="text-xs text-slate-600">/ 135</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">{stdPct}% odds</div>
                  </div>
                </div>

                {/* 4. Guaranteed Milestone Rewards / Pity System Track (Req #3) */}
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-black text-white uppercase tracking-wider">
                      <Gift className="w-4 h-4 text-volt" />
                      <span>Guaranteed Milestone Rewards & Pity System</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Spun in this box: <strong className="text-volt">{boxState.totalSpun} / 150</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    {currentTheme.milestones.map((m, idx) => {
                      const isReached = boxState.totalSpun >= m.spinsRequired;
                      return (
                        <div
                          key={idx}
                          className={`p-2.5 rounded-xl border flex flex-col justify-between text-xs transition-colors ${
                            m.claimed
                              ? 'bg-slate-900 border-slate-800 opacity-60'
                              : isReached
                              ? 'bg-emerald-950/60 border-emerald-500 shadow-lg shadow-emerald-500/10'
                              : 'bg-slate-900/60 border-slate-800'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="font-mono font-bold text-slate-400">{m.spinsRequired} Spins</span>
                              {m.claimed ? (
                                <span className="text-emerald-400 font-bold">Claimed ✓</span>
                              ) : isReached ? (
                                <span className="text-emerald-400 font-bold animate-pulse">Ready!</span>
                              ) : (
                                <span className="text-slate-500">{boxState.totalSpun}/{m.spinsRequired}</span>
                              )}
                            </div>
                            <div className="font-bold text-white mt-1 text-[11px] leading-tight">
                              {m.rewardTitle}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {m.rewardDescription}
                            </div>
                          </div>

                          {isReached && !m.claimed && (
                            <button
                              onClick={() => handleClaimMilestone(idx)}
                              className="mt-2 py-1 px-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[10px] uppercase rounded-lg transition-transform active:scale-95"
                            >
                              Claim Reward
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 5. Standard Filler Card Loyalty Token Exchange (Req #3) */}
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 font-black text-sm">
                      🪙
                    </div>
                    <div>
                      <div className="text-xs font-black text-white uppercase tracking-wider">
                        Filler Loyalty Tokens: {loyaltyTokens}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Earn +10 tokens every time you pull a standard filler card. Non-epic pulls reward your progress!
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      disabled={loyaltyTokens < 50}
                      onClick={() => handleExchangeLoyalty(50, 'position')}
                      className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 disabled:opacity-40 text-xs font-bold text-emerald-300 rounded-xl transition-colors"
                      title="50 Tokens -> 1 Position Training Program"
                    >
                      Pos Program (50 🪙)
                    </button>

                    <button
                      disabled={loyaltyTokens < 100}
                      onClick={() => handleExchangeLoyalty(100, 'booster')}
                      className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 disabled:opacity-40 text-xs font-bold text-fuchsia-300 rounded-xl transition-colors"
                      title="100 Tokens -> 1 Random Booster Token"
                    >
                      Booster Token (100 🪙)
                    </button>

                    <button
                      disabled={loyaltyTokens < 40}
                      onClick={() => handleExchangeLoyalty(40, 'gp')}
                      className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 disabled:opacity-40 text-xs font-bold text-cyan-300 rounded-xl transition-colors"
                      title="40 Tokens -> 75,000 GP"
                    >
                      +75k GP (40 🪙)
                    </button>
                  </div>
                </div>

                {/* Pool Inspector Drawer */}
                {showBoxInspector && (
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-black text-white uppercase tracking-wider">
                        {currentTheme.title} — Full 150-Player Manifest
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {boxState.totalRemaining} of 150 remaining in this box
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-amber-400 uppercase">3 Marquee Epics (Enhanced Versatility & Boosters)</span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {currentTheme.epics.map(epic => (
                          <div key={epic.id} className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-500/50 flex items-center justify-between text-xs">
                            <div>
                              <div className="font-bold text-white">{epic.shortName}</div>
                              <div className="text-[10px] text-amber-300">{epic.position} · {epic.playerPlaystyle}</div>
                            </div>
                            <span className="font-mono font-black text-amber-400 text-sm">OVR {epic.currentOvr}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] font-bold text-cyan-400 uppercase">12 Highlight Superstars</span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                        {currentTheme.highlights.map(hl => (
                          <div key={hl.id} className="p-1.5 rounded-lg bg-slate-900 border border-cyan-800/60 flex items-center justify-between text-[11px]">
                            <span className="font-bold text-slate-200">{hl.shortName}</span>
                            <span className="font-mono text-cyan-300 font-bold">{hl.position} {hl.currentOvr}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        135 Standard Filler Cards ({boxState.standardsRemaining} remaining)
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 max-h-24 overflow-y-auto pr-1">
                        {STANDARD_FILLER_TEMPLATES.map((tmpl, idx) => (
                          <div key={idx} className="p-1.5 rounded bg-slate-900/60 border border-slate-800 text-[10px] flex items-center justify-between text-slate-400">
                            <span>{tmpl.name}</span>
                            <span className="font-mono text-slate-500">{tmpl.pos} {tmpl.ovr}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Odds Details Accordion */}
                {showProbabilities && (
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs space-y-2">
                    <div className="font-black text-white uppercase text-[11px]">Detailed Probability & Guarantees</div>
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-amber-400 font-bold">Marquee Epic Cards (3 Cards):</span>
                      <span className="font-mono text-amber-400 font-bold">{boxState.epicsRemaining} left ({epicPct}%)</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-cyan-400 font-bold">Highlight Superstars (12 Cards):</span>
                      <span className="font-mono text-cyan-400 font-bold">{boxState.highlightsRemaining} left ({hlPct}%)</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">Standard / Base Fillers (135 Cards):</span>
                      <span className="font-mono text-slate-400 font-bold">{boxState.standardsRemaining} left ({stdPct}%)</span>
                    </div>
                    <div className="text-[10px] text-slate-400 pt-1 leading-relaxed">
                      Coins required to guarantee clearing all remaining cards in this box: <strong className="text-volt">~{coinsToClear.toLocaleString()} Coins</strong>.
                    </div>
                  </div>
                )}

                {/* Multi-Draw Controls */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-bold">Box Controls:</span>
                    {boxState.totalRemaining < 150 && (
                      <button
                        onClick={handleResetCurrentBox}
                        className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-xl flex items-center gap-1 transition-colors"
                        title="Reset this box back to 150/150"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset Box</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                    <button
                      disabled={wallet.coins < 100 || boxState.totalRemaining <= 0}
                      onClick={() => handleOpenEpicPack(1, 100)}
                      className="py-2.5 px-3.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white font-black text-xs uppercase tracking-wider rounded-xl border border-slate-600 transition-transform active:scale-95"
                    >
                      Draw x1 (100 🪙)
                    </button>

                    <button
                      disabled={wallet.coins < 900 || boxState.totalRemaining < 10}
                      onClick={() => handleOpenEpicPack(10, 900)}
                      className="py-2.5 px-4 bg-gradient-to-r from-amber-400 to-yellow-300 hover:from-amber-300 hover:to-yellow-200 disabled:opacity-40 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-transform active:scale-95"
                    >
                      Draw x10 (900 🪙)
                    </button>

                    <button
                      disabled={wallet.coins < 4500 || boxState.totalRemaining < 50}
                      onClick={() => handleOpenEpicPack(50, 4500)}
                      className="py-2.5 px-4 bg-gradient-to-r from-fuchsia-600 to-rose-600 hover:from-fuchsia-500 hover:to-rose-500 disabled:opacity-40 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-transform active:scale-95"
                      title="Draw 50 cards to simulate clearing 1/3 of the box"
                    >
                      Draw x50 (4.5k 🪙)
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB 2: FEATURED / POTW PACKS */}
            {/* ------------------------------------------------------------- */}
            {activePackTab === 'potw' && (
              <div className="space-y-4">
                <div className="relative rounded-2xl overflow-hidden bg-gradient-to-tr from-emerald-950 via-slate-950 to-teal-950 border-2 border-emerald-500/60 p-5 flex flex-col justify-between shadow-2xl">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-400 text-slate-950 tracking-wider">
                      PLAYER OF THE WEEK (POTW)
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-300">
                      Spins Left: {potwSpinsRemaining} / 3 Max Weekly
                    </span>
                  </div>

                  <div className="text-center my-4">
                    <div className="text-2xl sm:text-3xl font-black text-white tracking-widest uppercase">
                      WORLDWIDE POTW SELECTION
                    </div>
                    <div className="text-xs text-emerald-200 mt-1 font-semibold">
                      Vinícius Jr. (97) · Rodri (97) · Cole Palmer (96) · Lautaro Martínez (96)
                    </div>
                  </div>

                  {/* Tactical Characteristic Callout from user prompt */}
                  <div className="bg-slate-950/80 p-3 rounded-xl border border-emerald-800/80 text-xs text-emerald-200/90 flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-emerald-300 font-bold block uppercase text-[11px]">
                        Featured / POTW Card Characteristics & Auto-Pick Catch:
                      </strong>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        POTW cards feature heavily boosted live match stats, but typically possess <strong>strictly fixed position proficiency maps</strong> without secondary flexibility. If Auto-Pick or your manual tactics place them out of position, they suffer severe live-match stat penalties!
                      </p>
                    </div>
                  </div>
                </div>

                {/* POTW Cards Showcase */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Available In-Form Stars:
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {POTW_WEEKLY_CARDS.map(card => (
                      <div key={card.id} className="p-3 rounded-2xl bg-slate-950 border border-emerald-500/40 flex flex-col justify-between shadow-lg">
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                              {card.position}
                            </span>
                            <span className="text-base font-black font-mono text-emerald-400">
                              {card.currentOvr}
                            </span>
                          </div>
                          <div className="font-bold text-white text-xs mt-2 truncate">
                            {card.name}
                          </div>
                          <div className="text-[10px] text-slate-400">{card.club}</div>
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 flex items-center justify-between">
                          <span>Playstyle:</span>
                          <span className="text-emerald-300 font-bold">{card.playerPlaystyle}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Draw POTW Button */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div className="text-xs text-slate-400">
                    Cost: <strong className="text-volt font-mono font-bold">100 Coins</strong> per pull (Limit 3 pulls per week).
                  </div>

                  <button
                    disabled={wallet.coins < 100 || potwSpinsRemaining <= 0}
                    onClick={handleOpenPotwPack}
                    className="py-3 px-6 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 disabled:opacity-40 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-transform active:scale-95"
                  >
                    Draw POTW (100 🪙)
                  </button>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB 3: STANDARD PLAYER LIST (GP) */}
            {/* ------------------------------------------------------------- */}
            {activePackTab === 'standard_info' && (
              <div className="space-y-4">
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">
                      Standard Player List — Strategic Utility for Events
                    </h3>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    While Epic and Featured cards dominate competitive matches, the <strong>Standard Player List</strong> (purchasable with GP) plays a critical foundational role in your club:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1">
                      <strong className="text-cyan-300 font-bold block">1. Themed Event Eligibility:</strong>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        In club-themed or league-specific events (e.g., Spanish League or English Clubs Tournaments), special cards are often barred or carry squad eligibility caps. Signing standard base players ensures exact eligibility compliance.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1">
                      <strong className="text-volt font-bold block">2. Exact Position Compliance for Auto-Pick:</strong>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        When building an event squad, Auto-Pick relies on exact primary registered positions. If your roster lacks natural full-backs or defensive anchors, Auto-Pick is forced to place players out of position. Standard players give Auto-Pick exact matches with 0% stat penalties.
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-mono">
                      Your Available GP: <strong className="text-volt">{wallet.gp.toLocaleString()} GP</strong>
                    </span>

                    {onNavigateToMarket && (
                      <button
                        onClick={() => {
                          onClose();
                          onNavigateToMarket();
                        }}
                        className="py-2.5 px-5 bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-transform active:scale-95 flex items-center gap-1.5"
                      >
                        <span>Open GP Player Market</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB 4: COMPREHENSIVE GUIDE & COMPARISON TABLE (From User Brief) */}
            {/* ------------------------------------------------------------- */}
            {activePackTab === 'guide' && (
              <div className="space-y-4">
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-volt" />
                      <span>How Packs and Drop Rates Impact Auto-Pick and Squad Building</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      The types of packs you open directly dictate your player pool, which in turn changes how the <strong>Auto-Pick</strong> feature behaves and how severely your team suffers from <strong>out-of-position penalties</strong>.
                    </p>
                  </div>

                  {/* Comparison Table */}
                  <div className="overflow-x-auto rounded-xl border border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900 border-b border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider font-mono">
                        <tr>
                          <th className="p-3">Pack Type</th>
                          <th className="p-3">Pool Size</th>
                          <th className="p-3">Composition & Filler</th>
                          <th className="p-3">Impact on Auto-Pick & Squads</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80 text-[11px] text-slate-300">
                        <tr>
                          <td className="p-3 font-bold text-amber-400">Epic / Special Boxes</td>
                          <td className="p-3 font-mono">150 players</td>
                          <td className="p-3 text-slate-400">3 Epics + 147 Highlight/Standard filler cards</td>
                          <td className="p-3 leading-relaxed">
                            Rapidly floods your club with mid-tier Highlight players who have high OVRs, often tricking Auto-Pick into prioritizing them over lower-rated players with better custom skills.
                          </td>
                        </tr>
                        <tr>
                          <td className="p-3 font-bold text-emerald-400">Featured / POTW Packs</td>
                          <td className="p-3 font-mono">50–110 players (or 11 weekly)</td>
                          <td className="p-3 text-slate-400">Special themed cards with boosted stats</td>
                          <td className="p-3 leading-relaxed">
                            Provides high-rated alternatives, but many cards lack secondary position familiarity, causing severe stat drops if Auto-Pick or you force them into different positions.
                          </td>
                        </tr>
                        <tr>
                          <td className="p-3 font-bold text-cyan-400">Standard Player List</td>
                          <td className="p-3 font-mono">Unlimited</td>
                          <td className="p-3 text-slate-400">Base cards purchasable with GP</td>
                          <td className="p-3 leading-relaxed">
                            Essential for filling out specialized club or league event requirements where special cards aren't allowed, giving Auto-Pick exact position matches to work with.
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Why Card Types Matter for Out-of-Position Penalties */}
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <div className="text-xs font-black text-white uppercase tracking-wider">
                      Why Card Types Matter for Out-of-Position Penalties
                    </div>
                    <div className="space-y-2 text-[11px] text-slate-300 leading-relaxed">
                      <p>
                        <strong>Standard Base Cards:</strong> Usually have very rigid, fixed proficiency maps. A standard central midfielder pulled from the GP list will rarely have high proficiency anywhere else, meaning Auto-Pick or manual shifting will heavily penalize their live match stats.
                      </p>
                      <p>
                        <strong>Featured / Epic Cards:</strong> Often come with slightly more flexible position proficiency or are targeted targets for <strong>Position Training Programs</strong>. However, if you rely on Auto-Pick during a themed event (like a Spanish League challenge) and your pack inventory is thin, the system will grab random standard/featured cards from your club, dump them into unfamiliar slots, and tank their live match performance with severe stat debuffs.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STAGE 2: DRAW ANIMATION (Walkout glow) */}
        {packStage === 'animating' && (
          <div className="py-24 px-6 flex flex-col items-center justify-center text-center gap-6 flex-1">
            <div className="relative">
              <div className="w-32 h-44 rounded-2xl bg-gradient-to-br from-amber-400 via-yellow-200 to-amber-600 animate-pulse shadow-2xl shadow-yellow-500/50 flex items-center justify-center border-4 border-white">
                <Sparkles className="w-12 h-12 text-slate-950 animate-spin" />
              </div>
              <div className="absolute inset-0 bg-white/30 rounded-2xl blur-xl animate-ping" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white tracking-widest uppercase">
                {currentDrawType}
              </h3>
              <p className="text-xs text-amber-300 mt-1">
                Spinning pack agents · Simulating eFootball box probability & filler dilution...
              </p>
            </div>
          </div>
        )}

        {/* STAGE 3: CARDS REVEALED */}
        {packStage === 'revealed' && (
          <div className="p-5 overflow-y-auto flex flex-col items-center gap-4 flex-1">
            {/* Header banner */}
            <div className="text-center">
              {hasPulledEpic ? (
                <div className="text-xs font-black text-amber-400 uppercase tracking-widest flex items-center justify-center gap-1.5 animate-bounce">
                  <Trophy className="w-5 h-5 text-amber-400" /> ✨ MARQUEE EPIC ACQUIRED FROM THE 150 BOX!
                </div>
              ) : (
                <div className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center justify-center gap-1.5">
                  <Layers className="w-4 h-4 text-slate-500" />
                  <span>Cards Acquired from Agent Draw</span>
                </div>
              )}
              <h2 className="text-xl font-black text-white mt-1 uppercase tracking-wider">
                {hasPulledEpic ? "Legendary Acquisition!" : "Draw Complete"}
              </h2>

              {/* Pull breakdown stats banner */}
              <div className="flex items-center justify-center gap-3 mt-2 text-xs flex-wrap">
                {pullStats.epicCount > 0 && (
                  <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-black">
                    ⭐ {pullStats.epicCount} Epics
                  </span>
                )}
                {pullStats.highlightCount > 0 && (
                  <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">
                    🔹 {pullStats.highlightCount} Highlights
                  </span>
                )}
                {pullStats.standardFillerCount > 0 && (
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                    ⚪ {pullStats.standardFillerCount} Standard Fillers
                  </span>
                )}
                {pullStats.loyaltyEarned > 0 && (
                  <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-bold">
                    🪙 +{pullStats.loyaltyEarned} Loyalty Tokens
                  </span>
                )}
              </div>
            </div>

            {/* Revealed Cards Display */}
            {pulledCards.length === 1 ? (
              <div className="w-full max-w-xs">
                <PlayerCard card={pulledCards[0]} />
                {pulledCards[0].tier === 'Standard' && (
                  <div className="mt-2 text-center text-[11px] text-slate-400 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-amber-400 font-bold block mb-0.5">Standard Filler Pulled:</span>
                    {pulledCards[0].name} ({pulledCards[0].currentOvr} OVR). Awarded +10 Loyalty Tokens.
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full grid grid-cols-2 sm:grid-cols-5 gap-2.5 max-h-[48vh] overflow-y-auto p-1">
                {pulledCards.map((card, idx) => (
                  <div key={idx} className="relative">
                    <PlayerCard card={card} compact={true} />
                    {card.tier === 'Standard' && (
                      <span className="absolute -top-1.5 -right-1 text-[8px] bg-slate-800 text-slate-400 border border-slate-700 px-1 rounded font-bold">
                        FILLER (+10 🪙)
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="w-full flex items-center justify-between gap-3 pt-3 border-t border-slate-800 flex-wrap">
              <span className="text-xs text-slate-400">
                Box Progress: <strong className="text-volt">{boxState.totalRemaining} / 150</strong> (Epics: <strong className="text-amber-400">{boxState.epicsRemaining}</strong>)
              </span>

              <div className="flex gap-2">
                <button
                  onClick={() => setPackStage('select')}
                  className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-colors"
                >
                  Spin Again
                </button>

                <button
                  onClick={handleClaimAll}
                  className="py-2.5 px-6 bg-volt hover:bg-yellow-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-colors flex items-center gap-1.5"
                >
                  <span>Claim to Squad</span> <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
