export type Position = 
  | 'CF' | 'SS' | 'LWF' | 'RWF' 
  | 'AMF' | 'CMF' | 'LMF' | 'RMF' | 'DMF' 
  | 'CB' | 'LB' | 'RB' | 'GK';

export type CardTier = 'Epic' | 'Big Time' | 'Show Time' | 'Highlight' | 'Standard';

export type TeamPlaystyle = 
  | 'Possession Game' 
  | 'Quick Counter' 
  | 'Long Ball Counter' 
  | 'Out Wide' 
  | 'Long Ball';

export type IndividualInstruction = 
  | 'None' 
  | 'Defensive' 
  | 'Attacking' 
  | 'Deep-Lying' 
  | 'Counter Target' 
  | 'Anchoring';

export interface PlayerStats {
  finishing: number;
  kickingPower: number;
  dribbling: number;
  ballControl: number;
  tightPossession: number;
  lowPass: number;
  loftedPass: number;
  speed: number;
  acceleration: number;
  defensiveAwareness: number;
  tackling: number;
  defensiveEngagement: number;
  physicalContact: number;
  balance: number;
  stamina: number;
  // GK stats
  gkReflexes?: number;
  gkReach?: number;
}

export interface StatAllocation {
  shooting: number;
  dribbling: number;
  dexterity: number;
  lowerBody: number;
  defending: number;
}

export interface BoosterEffect {
  name: string;
  stats: Partial<Record<keyof PlayerStats, number>>;
  description: string;
}

export interface PlayerCard {
  id: string;
  name: string;
  shortName: string;
  number: number;
  position: Position;
  registeredPosition: Position; // Natural primary registered card position
  positionProficiencies: Record<Position, 'Full' | 'Partial' | 'None'>;
  playerPlaystyle: string; // e.g. Goal Poacher, Box-to-Box, Anchor Man, Extra Frontman
  trainedPositions?: Position[]; // Unlocked via Position Training Programs
  nationality: string;
  club: string;
  age: number;
  height: number;
  tier: CardTier;
  colorTheme: string;
  baseOvr: number;
  currentOvr: number;
  baseStats: PlayerStats;
  currentLevel: number;
  maxLevel: number;
  exp: number;
  progressionPoints: number;
  allocatedPoints: StatAllocation;
  skills: string[];
  maxExtraSkills: number;
  extraSkills: string[];
  // Booster Crafting
  hasBoosterSlots: boolean;
  fixedBooster?: BoosterEffect;
  craftableBooster?: BoosterEffect | null;
  // Tactics
  instruction: IndividualInstruction;
  // Formation coordinates relative to pitch percentage (0 to 100)
  pitchX: number;
  pitchY: number;
  isStarter: boolean;
}

export interface Manager {
  id: string;
  name: string;
  club: string;
  nationality: string;
  costGP: number;
  proficiencies: Record<TeamPlaystyle, number>;
  tacticalNotes: string;
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  crest: string;
  primaryColor: string;
  secondaryColor: string;
  formation: string;
  playstyle: TeamPlaystyle;
  manager: Manager;
  players: PlayerCard[];
  teamChemistry: number;
}

export interface MatchSettings {
  stadium: string;
  weather: 'Day (Clear)' | 'Night (Floodlights)' | 'Sunset' | 'Rain (Wet Pitch)';
  halfLengthSec: number; // e.g. 120 sec per half for mobile arcade feel
  difficulty: 'Beginner' | 'Regular' | 'Top Player' | 'Legend';
  controlMode: 'gamepad' | 'classic_touch' | 'touch_flick';
  smartAssist: boolean;
}

export interface UserWallet {
  gp: number;
  coins: number;
  exp10000: number;
  exp4000: number;
  exp1000: number;
  skillPrograms: number;
  randomBoosterTokens: number;
  selectBoosterTokens: number;
  positionPrograms: number; // Rare item: Position Training Program
  fillerLoyaltyTokens?: number; // Earned by pulling non-epic filler cards in 150-boxes
}

export interface BoxMilestone {
  spinsRequired: number;
  rewardTitle: string;
  rewardDescription: string;
  claimed: boolean;
}

export interface EpicBoxTheme {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  category: 'Attackers & Playmakers' | 'Defensive Titans & Guardians' | 'Flank Maestros & Universal Icons';
  epics: PlayerCard[];
  highlights: PlayerCard[];
  state: EpicBoxState;
  milestones: BoxMilestone[];
}

export interface PotwPackState {
  id: string;
  title: string;
  description: string;
  expiresInDays: number;
  cards: PlayerCard[];
  spinsRemaining: number;
  maxSpins: number;
  costCoins: number;
}

export function getPositionProficiency(player: PlayerCard, targetPosition: Position): 'Full' | 'Partial' | 'None' {
  if (player.registeredPosition === targetPosition) return 'Full';
  if (player.trainedPositions?.includes(targetPosition)) return 'Full';
  return player.positionProficiencies?.[targetPosition] || 'None';
}

export function getEffectiveOVR(player: PlayerCard, assignedPosition: Position): { 
  effectiveOvr: number; 
  drop: number; 
  familiarity: 'Full' | 'Partial' | 'None';
  isPlaystyleActive: boolean;
} {
  const familiarity = getPositionProficiency(player, assignedPosition);
  const isPlaystyleActive = familiarity === 'Full';

  if (familiarity === 'Full') {
    return { effectiveOvr: player.currentOvr, drop: 0, familiarity: 'Full', isPlaystyleActive: true };
  }
  if (familiarity === 'Partial') {
    // Partial familiarity: modest ~7% stat/OVR reduction
    const drop = Math.max(3, Math.round(player.currentOvr * 0.08));
    return { effectiveOvr: Math.max(40, player.currentOvr - drop), drop, familiarity: 'Partial', isPlaystyleActive: false };
  }
  // Zero familiarity: severe ~24% stat/OVR reduction (e.g. 96-rated CF at CB drops to ~73)
  const drop = Math.max(15, Math.round(player.currentOvr * 0.24));
  return { effectiveOvr: Math.max(40, player.currentOvr - drop), drop, familiarity: 'None', isPlaystyleActive: false };
}


export interface DivisionInfo {
  division: number;
  points: number;
  matchesPlayed: number;
  matchesRemaining: number;
  targetPoints: number;
  rewardGP: number;
  rewardCoins: number;
}

export type AutoPickCriterion = 'ovr' | 'playstyle' | 'event_league' | 'utility';

export interface EpicBoxState {
  totalRemaining: number;
  epicsRemaining: number;
  highlightsRemaining: number;
  standardsRemaining: number;
  totalSpun: number;
}
