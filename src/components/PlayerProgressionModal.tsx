import React, { useState } from 'react';
import { 
  PlayerCard as IPlayerCard, Position, StatAllocation, UserWallet, 
  getPositionProficiency, getEffectiveOVR 
} from '../types/game';
import { SKILL_LIBRARY } from '../data/initialData';
import { 
  X, Plus, Minus, Sparkles, Zap, Award, Check, RefreshCw, 
  Layers, Shield, AlertCircle, ArrowUpCircle 
} from 'lucide-react';
import { sound } from '../services/soundService';

const ALL_POSITIONS: Position[] = [
  'CF', 'SS', 'LWF', 'RWF', 
  'AMF', 'CMF', 'LMF', 'RMF', 'DMF', 
  'CB', 'LB', 'RB', 'GK'
];

interface PlayerProgressionModalProps {
  player: IPlayerCard;
  wallet: UserWallet;
  onClose: () => void;
  onUpdatePlayer: (updated: IPlayerCard) => void;
  onUpdateWallet: (updatedWallet: UserWallet) => void;
}

export const PlayerProgressionModal: React.FC<PlayerProgressionModalProps> = ({
  player,
  wallet,
  onClose,
  onUpdatePlayer,
  onUpdateWallet
}) => {
  const [activeTab, setActiveTab] = useState<'progression' | 'level' | 'skills' | 'positions'>('progression');
  const [allocation, setAllocation] = useState<StatAllocation>({ ...player.allocatedPoints });
  const [pointsRemaining, setPointsRemaining] = useState<number>(player.progressionPoints);
  const [skillRolling, setSkillRolling] = useState(false);
  const [recentlyAddedSkill, setRecentlyAddedSkill] = useState<string | null>(null);
  const [positionTrainedMessage, setPositionTrainedMessage] = useState<string | null>(null);

  // 1. Level Training Logic (Pumping EXP)
  const handleApplyExp = (expAmount: number, type: '10k' | '4k' | '1k') => {
    if (type === '10k' && wallet.exp10000 <= 0) return;
    if (type === '4k' && wallet.exp4000 <= 0) return;
    if (type === '1k' && wallet.exp1000 <= 0) return;

    sound.playPackReveal();

    const newExp = player.exp + expAmount;
    const expNeededPerLevel = 1000;
    const levelsGained = Math.min(player.maxLevel - player.currentLevel, Math.floor(newExp / expNeededPerLevel));
    const newLevel = player.currentLevel + levelsGained;
    const remainingExp = newExp % expNeededPerLevel;
    const gainedPoints = levelsGained * 2;

    const updatedCard: IPlayerCard = {
      ...player,
      currentLevel: newLevel,
      exp: remainingExp,
      progressionPoints: player.progressionPoints + gainedPoints
    };

    const updatedWallet: UserWallet = {
      ...wallet,
      exp10000: type === '10k' ? wallet.exp10000 - 1 : wallet.exp10000,
      exp4000: type === '4k' ? wallet.exp4000 - 1 : wallet.exp4000,
      exp1000: type === '1k' ? wallet.exp1000 - 1 : wallet.exp1000
    };

    setPointsRemaining(prev => prev + gainedPoints);
    onUpdatePlayer(updatedCard);
    onUpdateWallet(updatedWallet);
  };

  // 2. Progression Points Allocation Logic
  const handleStepStat = (stat: keyof StatAllocation, delta: number) => {
    if (delta > 0 && pointsRemaining <= 0) return;
    if (delta < 0 && allocation[stat] <= 0) return;

    sound.playClick();
    const newAlloc = { ...allocation, [stat]: allocation[stat] + delta };
    setAllocation(newAlloc);
    setPointsRemaining(prev => prev - delta);
  };

  const handleAutoAllocate = () => {
    sound.playClick();
    let remaining = pointsRemaining;
    const newAlloc = { ...allocation };

    // Allocate according to position
    if (['CF', 'SS', 'LWF', 'RWF'].includes(player.position)) {
      while (remaining > 0) {
        if (remaining >= 1) { newAlloc.shooting += 1; remaining--; }
        if (remaining >= 1) { newAlloc.dexterity += 1; remaining--; }
        if (remaining >= 1) { newAlloc.dribbling += 1; remaining--; }
        if (remaining >= 1) { newAlloc.lowerBody += 1; remaining--; }
      }
    } else if (['CB', 'LB', 'RB'].includes(player.position)) {
      while (remaining > 0) {
        if (remaining >= 1) { newAlloc.defending += 1; remaining--; }
        if (remaining >= 1) { newAlloc.dexterity += 1; remaining--; }
        if (remaining >= 1) { newAlloc.lowerBody += 1; remaining--; }
      }
    } else {
      // Midfielders
      while (remaining > 0) {
        if (remaining >= 1) { newAlloc.dribbling += 1; remaining--; }
        if (remaining >= 1) { newAlloc.shooting += 1; remaining--; }
        if (remaining >= 1) { newAlloc.defending += 1; remaining--; }
        if (remaining >= 1) { newAlloc.lowerBody += 1; remaining--; }
      }
    }

    setAllocation(newAlloc);
    setPointsRemaining(0);
  };

  const handleSaveProgression = () => {
    sound.playPackReveal();
    const updatedStats = { ...player.baseStats };
    updatedStats.finishing += allocation.shooting * 2;
    updatedStats.kickingPower += allocation.shooting + allocation.lowerBody;
    updatedStats.dribbling += allocation.dribbling * 2;
    updatedStats.ballControl += allocation.dribbling;
    updatedStats.tightPossession += allocation.dribbling;
    updatedStats.speed += allocation.dexterity + allocation.lowerBody;
    updatedStats.acceleration += allocation.dexterity * 2;
    updatedStats.defensiveAwareness += allocation.defending * 2;
    updatedStats.tackling += allocation.defending * 2;
    updatedStats.stamina += allocation.lowerBody * 2;

    const ovrGain = Math.floor(
      (allocation.shooting + allocation.dribbling + allocation.dexterity + allocation.lowerBody + allocation.defending) / 4
    );

    const updatedCard: IPlayerCard = {
      ...player,
      baseStats: updatedStats,
      allocatedPoints: allocation,
      progressionPoints: pointsRemaining,
      currentOvr: player.baseOvr + ovrGain
    };

    onUpdatePlayer(updatedCard);
    onClose();
  };

  // 3. Skill Training Program (Add random skill up to 5 extra)
  const handleTrainSkill = () => {
    if (wallet.skillPrograms <= 0) return;
    if (player.extraSkills.length >= player.maxExtraSkills) return;

    sound.playPackReveal();
    setSkillRolling(true);

    setTimeout(() => {
      const existing = new Set([...player.skills, ...player.extraSkills]);
      const available = SKILL_LIBRARY.filter(s => !existing.has(s));
      const rolledSkill = available.length > 0 
        ? available[Math.floor(Math.random() * available.length)] 
        : "Double Touch";

      const updatedCard: IPlayerCard = {
        ...player,
        extraSkills: [...player.extraSkills, rolledSkill]
      };

      const updatedWallet: UserWallet = {
        ...wallet,
        skillPrograms: wallet.skillPrograms - 1
      };

      setRecentlyAddedSkill(rolledSkill);
      setSkillRolling(false);
      onUpdatePlayer(updatedCard);
      onUpdateWallet(updatedWallet);
    }, 900);
  };

  // 4. Position Training Program (Bypass out-of-position debuffs!)
  const handleTrainPosition = (targetPos: Position) => {
    if (wallet.positionPrograms <= 0) return;
    const currentProf = getPositionProficiency(player, targetPos);
    if (currentProf === 'Full') return;

    sound.playPackReveal();
    const updatedTrained = [...(player.trainedPositions || []), targetPos];
    const updatedCard: IPlayerCard = {
      ...player,
      trainedPositions: updatedTrained
    };

    const updatedWallet: UserWallet = {
      ...wallet,
      positionPrograms: wallet.positionPrograms - 1
    };

    onUpdatePlayer(updatedCard);
    onUpdateWallet(updatedWallet);
    setPositionTrainedMessage(`✨ Position Training Successful! Full Proficiency unlocked for ${targetPos}. Out-of-position OVR debuff and stat reductions are permanently removed.`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 select-none">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-black px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
              {player.position}
            </span>
            <div>
              <h2 className="text-lg font-black text-white uppercase tracking-wider">{player.name}</h2>
              <div className="text-xs text-slate-400">
                OVR <strong className="text-volt">{player.currentOvr}</strong> · Level {player.currentLevel}/{player.maxLevel}
                {player.registeredPosition && (
                  <span className="ml-2 text-slate-500">Natural: <strong className="text-slate-300">{player.registeredPosition}</strong></span>
                )}
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

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 p-1 flex-wrap">
          <button
            onClick={() => setActiveTab('progression')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-colors ${
              activeTab === 'progression' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Stat Allocation
          </button>
          <button
            onClick={() => setActiveTab('level')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-colors ${
              activeTab === 'level' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Level Training (EXP)
          </button>
          <button
            onClick={() => setActiveTab('skills')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-colors ${
              activeTab === 'skills' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Skill Training ({player.extraSkills.length}/5)
          </button>
          <button
            onClick={() => setActiveTab('positions')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-colors ${
              activeTab === 'positions' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60' : 'text-slate-400 hover:text-white'
            }`}
          >
            Position Training 🟢
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* TAB 1: STAT ALLOCATION */}
          {activeTab === 'progression' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Available Progression Points
                  </span>
                  <div className="text-2xl font-black font-mono text-volt">{pointsRemaining}</div>
                </div>
                <button
                  disabled={pointsRemaining <= 0}
                  onClick={handleAutoAllocate}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors border border-slate-700"
                >
                  <Sparkles className="w-3.5 h-3.5 text-volt" /> Auto-Allocate
                </button>
              </div>

              {/* Stat Sliders */}
              <div className="space-y-2.5">
                {[
                  { key: 'shooting', label: 'Shooting', affects: 'Finishing, Kicking Power' },
                  { key: 'dribbling', label: 'Dribbling', affects: 'Dribbling, Ball Control, Tight Possession' },
                  { key: 'dexterity', label: 'Dexterity', affects: 'Speed, Acceleration, Balance' },
                  { key: 'lowerBody', label: 'Lower Body Strength', affects: 'Kicking Power, Speed, Stamina' },
                  { key: 'defending', label: 'Defending', affects: 'Defensive Awareness, Tackling' }
                ].map(({ key, label, affects }) => {
                  const statKey = key as keyof StatAllocation;
                  const val = allocation[statKey];
                  return (
                    <div
                      key={key}
                      className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-black text-white">{label}</div>
                        <div className="text-[10px] text-slate-500">{affects}</div>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          disabled={val <= 0}
                          onClick={() => handleStepStat(statKey, -1)}
                          className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white flex items-center justify-center transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>

                        <span className="font-mono font-black text-base text-volt w-6 text-center">
                          {val}
                        </span>

                        <button
                          disabled={pointsRemaining <= 0}
                          onClick={() => handleStepStat(statKey, 1)}
                          className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white flex items-center justify-center transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={handleSaveProgression}
                className="w-full py-3 bg-volt hover:bg-yellow-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" /> Confirm Progression Build
              </button>
            </div>
          )}

          {/* TAB 2: LEVEL TRAINING */}
          {activeTab === 'level' && (
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 font-bold">Current Level</span>
                  <div className="text-xl font-black text-white">
                    Lv. {player.currentLevel} <span className="text-slate-500 text-sm">/ {player.maxLevel}</span>
                  </div>
                </div>
                <div className="w-48 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${(player.currentLevel / player.maxLevel) * 100}%` }}
                    className="h-full bg-cyan-400"
                  />
                </div>
              </div>

              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Available EXP Training Programs
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex flex-col justify-between gap-3">
                  <div>
                    <div className="text-xs font-black text-fuchsia-400">10,000 EXP Program</div>
                    <div className="text-[11px] text-slate-400">Owned: {wallet.exp10000}</div>
                  </div>
                  <button
                    disabled={wallet.exp10000 <= 0 || player.currentLevel >= player.maxLevel}
                    onClick={() => handleApplyExp(10000, '10k')}
                    className="w-full py-2 bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-40 text-white font-bold text-xs rounded-xl transition-colors"
                  >
                    Apply 10K EXP
                  </button>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex flex-col justify-between gap-3">
                  <div>
                    <div className="text-xs font-black text-cyan-400">4,000 EXP Program</div>
                    <div className="text-[11px] text-slate-400">Owned: {wallet.exp4000}</div>
                  </div>
                  <button
                    disabled={wallet.exp4000 <= 0 || player.currentLevel >= player.maxLevel}
                    onClick={() => handleApplyExp(4000, '4k')}
                    className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-bold text-xs rounded-xl transition-colors"
                  >
                    Apply 4K EXP
                  </button>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex flex-col justify-between gap-3">
                  <div>
                    <div className="text-xs font-black text-emerald-400">1,000 EXP Program</div>
                    <div className="text-[11px] text-slate-400">Owned: {wallet.exp1000}</div>
                  </div>
                  <button
                    disabled={wallet.exp1000 <= 0 || player.currentLevel >= player.maxLevel}
                    onClick={() => handleApplyExp(1000, '1k')}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs rounded-xl transition-colors"
                  >
                    Apply 1K EXP
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SKILL TRAINING */}
          {activeTab === 'skills' && (
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-400">Extra Skill Slots</div>
                  <div className="text-xl font-black text-white">
                    {player.extraSkills.length} <span className="text-slate-500 text-sm">/ {player.maxExtraSkills} Slots</span>
                  </div>
                </div>
                <div className="text-xs text-slate-400">
                  Skill Programs Owned: <strong className="text-volt">{wallet.skillPrograms}</strong>
                </div>
              </div>

              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Player Base Skills
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {player.skills.map(s => (
                    <span key={s} className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 font-semibold">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 mb-2">
                  Additional Trained Skills ({player.extraSkills.length}/5)
                </div>
                {player.extraSkills.length === 0 ? (
                  <div className="text-xs text-slate-500 p-4 text-center border border-dashed border-slate-800 rounded-xl">
                    No additional skills learned yet.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {player.extraSkills.map(s => (
                      <span key={s} className="px-2.5 py-1 rounded-lg bg-cyan-950/80 border border-cyan-800 text-xs text-cyan-300 font-bold flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-cyan-400" />
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <button
                disabled={wallet.skillPrograms <= 0 || player.extraSkills.length >= player.maxExtraSkills || skillRolling}
                onClick={handleTrainSkill}
                className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-40 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
              >
                {skillRolling ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <Sparkles className="w-4 h-4 text-cyan-300" />
                )}
                {skillRolling ? 'Rolling Random Skill...' : 'Use Skill Training Program'}
              </button>

              {recentlyAddedSkill && (
                <div className="bg-emerald-950/80 border border-emerald-800 text-emerald-300 p-3 rounded-xl text-xs font-bold text-center">
                  🎉 Successfully learned: {recentlyAddedSkill}!
                </div>
              )}
            </div>
          )}

          {/* TAB 4: POSITION TRAINING PROGRAMS (THE BYPASS ITEM!) */}
          {activeTab === 'positions' && (
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-2xl border border-emerald-800/60 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-400">Position Training Programs</div>
                  <div className="text-xl font-black text-emerald-400 font-mono">
                    {wallet.positionPrograms} Programs Owned
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 max-w-xs text-right">
                  Unlocks full position proficiency, restoring squad OVR and eliminating all live in-match penalties.
                </div>
              </div>

              {positionTrainedMessage && (
                <div className="bg-emerald-950/80 border border-emerald-800 text-emerald-300 p-3 rounded-xl text-xs font-bold text-center">
                  {positionTrainedMessage}
                </div>
              )}

              {/* Positions Grid */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Position Familiarity Grid
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {ALL_POSITIONS.map(pos => {
                    const prof = getPositionProficiency(player, pos);
                    const isRegistered = player.registeredPosition === pos;
                    const isTrained = player.trainedPositions?.includes(pos);

                    let statusBadge = (
                      <span className="text-[9px] font-bold text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded">
                        Zero Familiarity
                      </span>
                    );
                    if (prof === 'Full') {
                      statusBadge = (
                        <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950 border border-emerald-800 px-1.5 py-0.5 rounded">
                          {isRegistered ? 'Natural (Full)' : 'Trained (Full)'}
                        </span>
                      );
                    } else if (prof === 'Partial') {
                      statusBadge = (
                        <span className="text-[9px] font-bold text-amber-400 bg-amber-950 border border-amber-800 px-1.5 py-0.5 rounded">
                          Partial Familiarity
                        </span>
                      );
                    }

                    return (
                      <div
                        key={pos}
                        className={`p-3 rounded-2xl border flex flex-col justify-between gap-2.5 transition-colors ${
                          prof === 'Full'
                            ? 'bg-emerald-950/20 border-emerald-800/70'
                            : prof === 'Partial'
                            ? 'bg-amber-950/20 border-amber-800/70'
                            : 'bg-slate-950 border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-black text-white px-2 py-0.5 rounded bg-slate-900 border border-slate-700">
                            {pos}
                          </span>
                          {statusBadge}
                        </div>

                        {prof !== 'Full' ? (
                          <button
                            disabled={wallet.positionPrograms <= 0}
                            onClick={() => handleTrainPosition(pos)}
                            className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-[11px] rounded-xl flex items-center justify-center gap-1 transition-colors"
                          >
                            <ArrowUpCircle className="w-3.5 h-3.5" />
                            Train Position (1 item)
                          </button>
                        ) : (
                          <div className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 py-1">
                            <Check className="w-3 h-3" /> Full Proficiency
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
