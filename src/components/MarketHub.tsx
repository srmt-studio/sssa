import React, { useState } from 'react';
import { Manager, PlayerCard as IPlayerCard, UserWallet } from '../types/game';
import { MANAGERS_LIST, createProficiencyMap } from '../data/initialData';
import { PlayerCard } from './PlayerCard';
import { Users, Briefcase, Check, Sparkles, Coins } from 'lucide-react';
import { sound } from '../services/soundService';

interface MarketHubProps {
  wallet: UserWallet;
  currentManager: Manager;
  onSelectManager: (manager: Manager) => void;
  onSignPlayer: (player: IPlayerCard) => void;
  onUpdateWallet: (updatedWallet: UserWallet) => void;
}

const MARKET_STANDARD_PLAYERS: IPlayerCard[] = [
  {
    id: `mkt_salah_${Date.now()}`,
    name: "Mohamed Salah",
    shortName: "M. SALAH",
    number: 11,
    position: "RWF",
    registeredPosition: "RWF",
    positionProficiencies: createProficiencyMap("RWF", ["CF", "SS"]),
    playerPlaystyle: "Roaming Flank",
    trainedPositions: [],
    nationality: "Egypt",
    club: "Merseyside Red",
    age: 32,
    height: 175,
    tier: "Standard",
    colorTheme: "#64748b",
    baseOvr: 92,
    currentOvr: 92,
    baseStats: {
      finishing: 93,
      kickingPower: 86,
      dribbling: 91,
      ballControl: 90,
      tightPossession: 90,
      lowPass: 84,
      loftedPass: 80,
      speed: 92,
      acceleration: 92,
      defensiveAwareness: 45,
      tackling: 42,
      defensiveEngagement: 48,
      physicalContact: 78,
      balance: 90,
      stamina: 88
    },
    currentLevel: 1,
    maxLevel: 28,
    exp: 0,
    progressionPoints: 0,
    allocatedPoints: { shooting: 0, dribbling: 0, dexterity: 0, lowerBody: 0, defending: 0 },
    skills: ["Long-Range Curler", "First-time Shot", "Through Passing", "Cut Behind & Turn"],
    maxExtraSkills: 5,
    extraSkills: [],
    hasBoosterSlots: false,
    instruction: "None",
    pitchX: 74,
    pitchY: 26,
    isStarter: false
  },
  {
    id: `mkt_vinicius_${Date.now()}`,
    name: "Vinícius Jr.",
    shortName: "VINÍCIUS JR.",
    number: 7,
    position: "LWF",
    registeredPosition: "LWF",
    positionProficiencies: createProficiencyMap("LWF", ["CF", "SS", "LMF"]),
    playerPlaystyle: "Prolific Winger",
    trainedPositions: [],
    nationality: "Brazil",
    club: "Madrid Chamartin",
    age: 24,
    height: 176,
    tier: "Standard",
    colorTheme: "#64748b",
    baseOvr: 93,
    currentOvr: 93,
    baseStats: {
      finishing: 88,
      kickingPower: 82,
      dribbling: 96,
      ballControl: 94,
      tightPossession: 95,
      lowPass: 81,
      loftedPass: 78,
      speed: 98,
      acceleration: 98,
      defensiveAwareness: 42,
      tackling: 40,
      defensiveEngagement: 46,
      physicalContact: 76,
      balance: 93,
      stamina: 89
    },
    currentLevel: 1,
    maxLevel: 32,
    exp: 0,
    progressionPoints: 0,
    allocatedPoints: { shooting: 0, dribbling: 0, dexterity: 0, lowerBody: 0, defending: 0 },
    skills: ["Double Touch", "Flip Flap", "Sole Control", "Acrobatic Finishing"],
    maxExtraSkills: 5,
    extraSkills: [],
    hasBoosterSlots: false,
    instruction: "None",
    pitchX: 74,
    pitchY: 74,
    isStarter: false
  },
  {
    id: `mkt_ruben_dias_${Date.now()}`,
    name: "Rúben Dias",
    shortName: "R. DIAS",
    number: 3,
    position: "CB",
    registeredPosition: "CB",
    positionProficiencies: createProficiencyMap("CB"),
    playerPlaystyle: "Build Up",
    trainedPositions: [],
    nationality: "Portugal",
    club: "Manchester Blue",
    age: 27,
    height: 187,
    tier: "Standard",
    colorTheme: "#64748b",
    baseOvr: 92,
    currentOvr: 92,
    baseStats: {
      finishing: 45,
      kickingPower: 82,
      dribbling: 70,
      ballControl: 78,
      tightPossession: 75,
      lowPass: 84,
      loftedPass: 82,
      speed: 82,
      acceleration: 80,
      defensiveAwareness: 97,
      tackling: 96,
      defensiveEngagement: 96,
      physicalContact: 95,
      balance: 82,
      stamina: 89
    },
    currentLevel: 1,
    maxLevel: 28,
    exp: 0,
    progressionPoints: 0,
    allocatedPoints: { shooting: 0, dribbling: 0, dexterity: 0, lowerBody: 0, defending: 0 },
    skills: ["Interception", "Man Marking", "Blocker", "Heading"],
    maxExtraSkills: 5,
    extraSkills: [],
    hasBoosterSlots: false,
    instruction: "Defensive",
    pitchX: 25,
    pitchY: 50,
    isStarter: false
  }
];

export const MarketHub: React.FC<MarketHubProps> = ({
  wallet,
  currentManager,
  onSelectManager,
  onSignPlayer,
  onUpdateWallet
}) => {
  const [tab, setTab] = useState<'players' | 'managers'>('players');
  const [signedPlayerIds, setSignedPlayerIds] = useState<string[]>([]);

  const handleSignPlayer = (player: IPlayerCard, costGP: number) => {
    if (wallet.gp < costGP) return;
    sound.playPackReveal();

    const updatedWallet: UserWallet = {
      ...wallet,
      gp: wallet.gp - costGP
    };
    onUpdateWallet(updatedWallet);
    onSignPlayer(player);
    setSignedPlayerIds(prev => [...prev, player.id]);
  };

  const handleHireManager = (mgr: Manager) => {
    if (mgr.id === currentManager.id) return;
    if (wallet.gp < mgr.costGP) return;

    sound.playPackReveal();
    const updatedWallet: UserWallet = {
      ...wallet,
      gp: wallet.gp - mgr.costGP
    };
    onUpdateWallet(updatedWallet);
    onSelectManager(mgr);
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 flex flex-col gap-5 select-none">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-volt text-xs font-black uppercase tracking-wider">
            <Coins className="w-4 h-4" /> Transfer Market & Manager Recruitment
          </div>
          <h2 className="text-xl font-black text-white mt-1 uppercase tracking-wider">
            Contract Signing (GP)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Spend Game Points (GP) earned through match victories to hire tactical managers and sign standard superstars.
          </p>
        </div>

        <div className="bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800 flex items-center gap-3">
          <span className="text-xs text-slate-400 font-bold uppercase">Balance:</span>
          <span className="text-lg font-mono font-black text-volt">
            {wallet.gp.toLocaleString()} GP
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl w-fit">
        <button
          onClick={() => setTab('players')}
          className={`px-5 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1.5 ${
            tab === 'players' ? 'bg-volt text-slate-950' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" /> Standard Players
        </button>
        <button
          onClick={() => setTab('managers')}
          className={`px-5 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1.5 ${
            tab === 'managers' ? 'bg-volt text-slate-950' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Briefcase className="w-4 h-4" /> Managers List
        </button>
      </div>

      {/* TAB 1: PLAYERS */}
      {tab === 'players' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {MARKET_STANDARD_PLAYERS.map(player => {
            const cost = 250000;
            const alreadySigned = signedPlayerIds.includes(player.id);
            return (
              <div key={player.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between gap-4 shadow-xl">
                <PlayerCard card={player} />
                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <div className="text-xs font-mono font-bold text-slate-300">
                    {cost.toLocaleString()} GP
                  </div>
                  <button
                    disabled={alreadySigned || wallet.gp < cost}
                    onClick={() => handleSignPlayer(player, cost)}
                    className="py-2 px-4 bg-volt hover:bg-yellow-300 disabled:opacity-40 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-colors"
                  >
                    {alreadySigned ? "Signed" : "Sign Player"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: MANAGERS */}
      {tab === 'managers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {MANAGERS_LIST.map(mgr => {
            const isHired = mgr.id === currentManager.id;
            return (
              <div
                key={mgr.id}
                className={`bg-slate-900 border rounded-2xl p-4 flex flex-col justify-between gap-4 transition-all ${
                  isHired ? 'border-volt shadow-lg shadow-volt/10' : 'border-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                      {mgr.nationality} · {mgr.club}
                    </span>
                    {isHired && (
                      <span className="text-[10px] font-black text-volt flex items-center gap-1">
                        <Check className="w-3 h-3" /> ACTIVE
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-black text-white mt-2">{mgr.name}</h3>
                  <p className="text-xs text-slate-400 mt-1">{mgr.tacticalNotes}</p>
                </div>

                {/* Proficiencies Grid */}
                <div className="grid grid-cols-2 gap-1.5 text-[11px] bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Possession:</span>
                    <strong className="text-white font-mono">{mgr.proficiencies['Possession Game']}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Quick Counter:</span>
                    <strong className="text-white font-mono">{mgr.proficiencies['Quick Counter']}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Long Ball Ctr:</span>
                    <strong className="text-white font-mono">{mgr.proficiencies['Long Ball Counter']}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Out Wide:</span>
                    <strong className="text-white font-mono">{mgr.proficiencies['Out Wide']}</strong>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <div className="text-xs font-mono font-bold text-slate-300">
                    {mgr.costGP.toLocaleString()} GP
                  </div>
                  <button
                    disabled={isHired || wallet.gp < mgr.costGP}
                    onClick={() => handleHireManager(mgr)}
                    className={`py-2 px-4 font-black text-xs uppercase tracking-wider rounded-xl transition-colors ${
                      isHired
                        ? 'bg-slate-800 text-slate-500'
                        : 'bg-volt hover:bg-yellow-300 text-slate-950'
                    }`}
                  >
                    {isHired ? "Appointed" : "Hire Manager"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
