import { 
  EpicBoxState, EpicBoxTheme, PlayerCard, Position, PotwPackState, BoxMilestone 
} from '../types/game';
import { createProficiencyMap } from '../data/initialData';

// -------------------------------------------------------------
// BOX 1: WORLDWIDE LEGENDS (Attackers & Playmakers)
// -------------------------------------------------------------
export const WORLDWIDE_LEGENDS_EPICS: PlayerCard[] = [
  {
    id: "box_epic_ronaldinho",
    name: "Ronaldinho Gaúcho (2005)",
    shortName: "RONALDINHO",
    number: 10,
    position: "AMF",
    registeredPosition: "AMF",
    // Enhanced Position Versatility: Full across AMF, LWF, SS, CMF
    positionProficiencies: createProficiencyMap("AMF", ["SS", "LWF", "CMF"]),
    playerPlaystyle: "Creative Playmaker",
    trainedPositions: [],
    nationality: "Brazil",
    club: "Barcelona Blaugrana",
    age: 25,
    height: 181,
    tier: "Epic",
    colorTheme: "#ffbf00",
    baseOvr: 97,
    currentOvr: 101,
    baseStats: {
      finishing: 92, kickingPower: 90, dribbling: 99, ballControl: 99, tightPossession: 99,
      lowPass: 94, loftedPass: 92, speed: 93, acceleration: 95, defensiveAwareness: 42,
      tackling: 40, defensiveEngagement: 45, physicalContact: 84, balance: 96, stamina: 88
    },
    currentLevel: 1, maxLevel: 36, exp: 0, progressionPoints: 0,
    allocatedPoints: { shooting: 0, dribbling: 0, dexterity: 0, lowerBody: 0, defending: 0 },
    skills: ["Flip Flap", "Double Touch", "No Look Pass", "Rabona", "Long-Range Curler"],
    maxExtraSkills: 5, extraSkills: [],
    hasBoosterSlots: true,
    fixedBooster: { name: "Technique & Ball Control +2", stats: { dribbling: 2, ballControl: 3, tightPossession: 2 }, description: "Samba magic." },
    craftableBooster: null,
    instruction: "None", pitchX: 65, pitchY: 50, isStarter: false
  },
  {
    id: "box_epic_cruyff",
    name: "Johan Cruyff (1974)",
    shortName: "J. CRUYFF",
    number: 14,
    position: "SS",
    registeredPosition: "SS",
    // Enhanced Position Versatility: Full across SS, CF, AMF, LWF
    positionProficiencies: createProficiencyMap("SS", ["CF", "AMF", "LWF"]),
    playerPlaystyle: "Hole Player",
    trainedPositions: [],
    nationality: "Netherlands",
    club: "Amsterdam White-Red",
    age: 27,
    height: 178,
    tier: "Epic",
    colorTheme: "#ffbf00",
    baseOvr: 96,
    currentOvr: 100,
    baseStats: {
      finishing: 94, kickingPower: 89, dribbling: 98, ballControl: 97, tightPossession: 97,
      lowPass: 93, loftedPass: 89, speed: 94, acceleration: 96, defensiveAwareness: 54,
      tackling: 50, defensiveEngagement: 58, physicalContact: 82, balance: 94, stamina: 91
    },
    currentLevel: 1, maxLevel: 35, exp: 0, progressionPoints: 0,
    allocatedPoints: { shooting: 0, dribbling: 0, dexterity: 0, lowerBody: 0, defending: 0 },
    skills: ["Double Touch", "One-touch Pass", "Outside Curler", "Through Passing", "Heel Trick"],
    maxExtraSkills: 5, extraSkills: [],
    hasBoosterSlots: true,
    fixedBooster: { name: "Striker's Sense +3", stats: { finishing: 3, acceleration: 2 }, description: "Total football mastery." },
    craftableBooster: null,
    instruction: "None", pitchX: 78, pitchY: 50, isStarter: false
  },
  {
    id: "box_epic_davids",
    name: "Edgar Davids (1998)",
    shortName: "E. DAVIDS",
    number: 26,
    position: "DMF",
    registeredPosition: "DMF",
    // Enhanced Position Versatility: Full DMF, CMF, and LB
    positionProficiencies: createProficiencyMap("DMF", ["CMF", "LB"]),
    playerPlaystyle: "Destroyer",
    trainedPositions: [],
    nationality: "Netherlands",
    club: "Torino Zebra",
    age: 26,
    height: 169,
    tier: "Epic",
    colorTheme: "#ffbf00",
    baseOvr: 95,
    currentOvr: 98,
    baseStats: {
      finishing: 76, kickingPower: 92, dribbling: 88, ballControl: 90, tightPossession: 89,
      lowPass: 90, loftedPass: 86, speed: 92, acceleration: 94, defensiveAwareness: 96,
      tackling: 97, defensiveEngagement: 99, physicalContact: 93, balance: 95, stamina: 99
    },
    currentLevel: 1, maxLevel: 32, exp: 0, progressionPoints: 0,
    allocatedPoints: { shooting: 0, dribbling: 0, dexterity: 0, lowerBody: 0, defending: 0 },
    skills: ["Interception", "Man Marking", "Fighting Spirit", "Sliding Tackle", "Blocker"],
    maxExtraSkills: 5, extraSkills: [],
    hasBoosterSlots: true,
    fixedBooster: { name: "Relentless Press +3", stats: { defensiveEngagement: 3, acceleration: 2 }, description: "The Pitbull midfield destroyer." },
    craftableBooster: null,
    instruction: "Deep-Lying", pitchX: 45, pitchY: 50, isStarter: false
  }
];

// -------------------------------------------------------------
// BOX 2: DEFENSIVE TITANS & GUARDIANS (Req #2: CB, Fullback, GK representation)
// -------------------------------------------------------------
export const DEFENSIVE_TITANS_EPICS: PlayerCard[] = [
  {
    id: "box_epic_maldini",
    name: "Paolo Maldini (1994)",
    shortName: "P. MALDINI",
    number: 3,
    position: "CB",
    registeredPosition: "CB",
    // Enhanced Position Versatility: Full proficiency CB, LB, Partial RB
    positionProficiencies: createProficiencyMap("CB", ["LB", "RB"]),
    playerPlaystyle: "Build Up",
    trainedPositions: [],
    nationality: "Italy",
    club: "Milano Rossoneri",
    age: 26,
    height: 186,
    tier: "Epic",
    colorTheme: "#ffbf00",
    baseOvr: 97,
    currentOvr: 101,
    baseStats: {
      finishing: 60, kickingPower: 86, dribbling: 80, ballControl: 85, tightPossession: 82,
      lowPass: 88, loftedPass: 87, speed: 90, acceleration: 88, defensiveAwareness: 99,
      tackling: 99, defensiveEngagement: 99, physicalContact: 92, balance: 88, stamina: 95
    },
    currentLevel: 1, maxLevel: 34, exp: 0, progressionPoints: 0,
    allocatedPoints: { shooting: 0, dribbling: 0, dexterity: 0, lowerBody: 0, defending: 0 },
    skills: ["Interception", "Man Marking", "Acrobatic Clearance", "Sliding Tackle", "Blocker", "Captaincy"],
    maxExtraSkills: 5, extraSkills: [],
    hasBoosterSlots: true,
    fixedBooster: { name: "Defensive Fortress +3", stats: { defensiveAwareness: 3, tackling: 3 }, description: "Impenetrable defensive wall." },
    craftableBooster: null,
    instruction: "Defensive", pitchX: 25, pitchY: 40, isStarter: false
  },
  {
    id: "box_epic_vieira",
    name: "Patrick Vieira (2004)",
    shortName: "P. VIEIRA",
    number: 4,
    position: "DMF",
    registeredPosition: "DMF",
    // Enhanced Position Versatility: Full DMF, Full CMF, Partial CB
    positionProficiencies: createProficiencyMap("DMF", ["CMF", "CB"]),
    playerPlaystyle: "Destroyer",
    trainedPositions: [],
    nationality: "France",
    club: "North London Red",
    age: 28,
    height: 192,
    tier: "Epic",
    colorTheme: "#ffbf00",
    baseOvr: 97,
    currentOvr: 101,
    baseStats: {
      finishing: 78, kickingPower: 90, dribbling: 86, ballControl: 89, tightPossession: 88,
      lowPass: 91, loftedPass: 88, speed: 91, acceleration: 90, defensiveAwareness: 98,
      tackling: 99, defensiveEngagement: 99, physicalContact: 99, balance: 89, stamina: 99
    },
    currentLevel: 1, maxLevel: 32, exp: 0, progressionPoints: 0,
    allocatedPoints: { shooting: 0, dribbling: 0, dexterity: 0, lowerBody: 0, defending: 0 },
    skills: ["Interception", "Man Marking", "Fighting Spirit", "Heading", "One-touch Pass", "Blocker"],
    maxExtraSkills: 5, extraSkills: [],
    hasBoosterSlots: true,
    fixedBooster: { name: "Midfield Colossus +3", stats: { physicalContact: 3, defensiveAwareness: 2, tackling: 2 }, description: "Unrivalled midfield authority." },
    craftableBooster: null,
    instruction: "Anchoring", pitchX: 42, pitchY: 50, isStarter: false
  },
  {
    id: "box_epic_casillas",
    name: "Iker Casillas (2010)",
    shortName: "I. CASILLAS",
    number: 1,
    position: "GK",
    registeredPosition: "GK",
    positionProficiencies: createProficiencyMap("GK"),
    playerPlaystyle: "Offensive Goalkeeper",
    trainedPositions: [],
    nationality: "Spain",
    club: "Madrid Chamartin",
    age: 29,
    height: 182,
    tier: "Epic",
    colorTheme: "#ffbf00",
    baseOvr: 96,
    currentOvr: 99,
    baseStats: {
      finishing: 40, kickingPower: 86, dribbling: 60, ballControl: 70, tightPossession: 68,
      lowPass: 78, loftedPass: 82, speed: 78, acceleration: 84, defensiveAwareness: 88,
      tackling: 65, defensiveEngagement: 85, physicalContact: 84, balance: 90, stamina: 82,
      gkReflexes: 99, gkReach: 96
    },
    currentLevel: 1, maxLevel: 32, exp: 0, progressionPoints: 0,
    allocatedPoints: { shooting: 0, dribbling: 0, dexterity: 0, lowerBody: 0, defending: 0 },
    skills: ["GK High Punt", "GK Low Punt", "Captaincy", "Fighting Spirit"],
    maxExtraSkills: 5, extraSkills: [],
    hasBoosterSlots: true,
    fixedBooster: { name: "San Iker Reflexes +3", stats: { gkReflexes: 3, gkReach: 2 }, description: "Miracle point-blank saves." },
    craftableBooster: null,
    instruction: "None", pitchX: 8, pitchY: 50, isStarter: false
  }
];

// -------------------------------------------------------------
// BOX 3: FLANK MAESTROS & UNIVERSAL ICONS (Req #1 & Req #4)
// -------------------------------------------------------------
export const FLANK_MAESTROS_EPICS: PlayerCard[] = [
  {
    id: "box_epic_roberto_carlos",
    name: "Roberto Carlos (2002)",
    shortName: "R. CARLOS",
    number: 6,
    position: "LB",
    registeredPosition: "LB",
    // Enhanced Position Versatility: Full LB, Full LMF, Partial LWF
    positionProficiencies: createProficiencyMap("LB", ["LMF", "LWF"]),
    playerPlaystyle: "Attacking Full-back",
    trainedPositions: [],
    nationality: "Brazil",
    club: "Madrid Chamartin",
    age: 29,
    height: 168,
    tier: "Epic",
    colorTheme: "#ffbf00",
    baseOvr: 96,
    currentOvr: 99,
    baseStats: {
      finishing: 85, kickingPower: 99, dribbling: 89, ballControl: 88, tightPossession: 87,
      lowPass: 88, loftedPass: 93, speed: 98, acceleration: 97, defensiveAwareness: 85,
      tackling: 87, defensiveEngagement: 92, physicalContact: 91, balance: 95, stamina: 99
    },
    currentLevel: 1, maxLevel: 33, exp: 0, progressionPoints: 0,
    allocatedPoints: { shooting: 0, dribbling: 0, dexterity: 0, lowerBody: 0, defending: 0 },
    skills: ["Long-Range Shooting", "Knuckle Shot", "Dipping Shot", "Pinpoint Crossing", "Fighting Spirit"],
    maxExtraSkills: 5, extraSkills: [],
    hasBoosterSlots: true,
    fixedBooster: { name: "Bullet Cannon +3", stats: { kickingPower: 3, speed: 2 }, description: "Devastating outside-curler power." },
    craftableBooster: null,
    instruction: "Attacking", pitchX: 28, pitchY: 16, isStarter: false
  },
  {
    id: "box_epic_cafu",
    name: "Cafu (2002)",
    shortName: "CAFU",
    number: 2,
    position: "RB",
    registeredPosition: "RB",
    // Enhanced Position Versatility: Full RB, Full RMF, Partial RWF
    positionProficiencies: createProficiencyMap("RB", ["RMF", "RWF"]),
    playerPlaystyle: "Offensive Full-back",
    trainedPositions: [],
    nationality: "Brazil",
    club: "Milano Rossoneri",
    age: 32,
    height: 176,
    tier: "Epic",
    colorTheme: "#ffbf00",
    baseOvr: 96,
    currentOvr: 99,
    baseStats: {
      finishing: 76, kickingPower: 86, dribbling: 90, ballControl: 91, tightPossession: 90,
      lowPass: 90, loftedPass: 94, speed: 96, acceleration: 95, defensiveAwareness: 89,
      tackling: 91, defensiveEngagement: 96, physicalContact: 88, balance: 92, stamina: 99
    },
    currentLevel: 1, maxLevel: 33, exp: 0, progressionPoints: 0,
    allocatedPoints: { shooting: 0, dribbling: 0, dexterity: 0, lowerBody: 0, defending: 0 },
    skills: ["Pinpoint Crossing", "Interception", "Man Marking", "Fighting Spirit", "Captaincy"],
    maxExtraSkills: 5, extraSkills: [],
    hasBoosterSlots: true,
    fixedBooster: { name: "Endless Motor +3", stats: { stamina: 3, acceleration: 2 }, description: "Non-stop box-to-box overlaps." },
    craftableBooster: null,
    instruction: "Attacking", pitchX: 28, pitchY: 84, isStarter: false
  },
  {
    id: "box_epic_gullit",
    name: "Ruud Gullit (1988)",
    shortName: "R. GULLIT",
    number: 10,
    position: "AMF",
    registeredPosition: "AMF",
    // Extreme Universal Versatility: Full AMF, CF, SS, CMF, Partial CB!
    positionProficiencies: createProficiencyMap("AMF", ["CF", "SS", "CMF", "CB"]),
    playerPlaystyle: "Classic No. 10",
    trainedPositions: [],
    nationality: "Netherlands",
    club: "Milano Rossoneri",
    age: 26,
    height: 191,
    tier: "Epic",
    colorTheme: "#ffbf00",
    baseOvr: 97,
    currentOvr: 101,
    baseStats: {
      finishing: 91, kickingPower: 93, dribbling: 93, ballControl: 94, tightPossession: 93,
      lowPass: 92, loftedPass: 90, speed: 93, acceleration: 91, defensiveAwareness: 82,
      tackling: 84, defensiveEngagement: 88, physicalContact: 98, balance: 93, stamina: 96
    },
    currentLevel: 1, maxLevel: 35, exp: 0, progressionPoints: 0,
    allocatedPoints: { shooting: 0, dribbling: 0, dexterity: 0, lowerBody: 0, defending: 0 },
    skills: ["Heading", "One-touch Pass", "Long-Range Curler", "Through Passing", "Fighting Spirit", "Aerial Dominance"],
    maxExtraSkills: 5, extraSkills: [],
    hasBoosterSlots: true,
    fixedBooster: { name: "Universal Dominance +3", stats: { physicalContact: 3, finishing: 2, defensiveAwareness: 2 }, description: "Master of every tactical position." },
    craftableBooster: null,
    instruction: "None", pitchX: 68, pitchY: 50, isStarter: false
  }
];

// Highlight cards used across boxes
export const BOX_HIGHLIGHT_CARDS: PlayerCard[] = [
  {
    id: "box_hl_saka",
    name: "Bukayo Saka",
    shortName: "B. SAKA",
    number: 7,
    position: "RWF",
    registeredPosition: "RWF",
    positionProficiencies: createProficiencyMap("RWF", ["LWF", "RMF"]),
    playerPlaystyle: "Roaming Flank",
    trainedPositions: [],
    nationality: "England",
    club: "North London Red",
    age: 23,
    height: 178,
    tier: "Highlight",
    colorTheme: "#38bdf8",
    baseOvr: 91,
    currentOvr: 94,
    baseStats: {
      finishing: 86, kickingPower: 85, dribbling: 93, ballControl: 91, tightPossession: 92,
      lowPass: 87, loftedPass: 84, speed: 92, acceleration: 94, defensiveAwareness: 58,
      tackling: 55, defensiveEngagement: 65, physicalContact: 78, balance: 91, stamina: 92
    },
    currentLevel: 1, maxLevel: 30, exp: 0, progressionPoints: 0,
    allocatedPoints: { shooting: 0, dribbling: 0, dexterity: 0, lowerBody: 0, defending: 0 },
    skills: ["Cut Behind & Turn", "Pinpoint Crossing", "First-time Shot"], maxExtraSkills: 5, extraSkills: [],
    hasBoosterSlots: false, instruction: "None", pitchX: 75, pitchY: 82, isStarter: false
  },
  {
    id: "box_hl_leao",
    name: "Rafael Leão",
    shortName: "R. LEÃO",
    number: 10,
    position: "LWF",
    registeredPosition: "LWF",
    positionProficiencies: createProficiencyMap("LWF", ["CF", "SS"]),
    playerPlaystyle: "Prolific Winger",
    trainedPositions: [],
    nationality: "Portugal",
    club: "Milano Rossoneri",
    age: 25,
    height: 188,
    tier: "Highlight",
    colorTheme: "#38bdf8",
    baseOvr: 92,
    currentOvr: 95,
    baseStats: {
      finishing: 88, kickingPower: 89, dribbling: 96, ballControl: 93, tightPossession: 92,
      lowPass: 82, loftedPass: 79, speed: 98, acceleration: 97, defensiveAwareness: 42,
      tackling: 38, defensiveEngagement: 45, physicalContact: 88, balance: 87, stamina: 84
    },
    currentLevel: 1, maxLevel: 30, exp: 0, progressionPoints: 0,
    allocatedPoints: { shooting: 0, dribbling: 0, dexterity: 0, lowerBody: 0, defending: 0 },
    skills: ["Step On Skill", "Double Touch", "Acrobatic Finishing"], maxExtraSkills: 5, extraSkills: [],
    hasBoosterSlots: false, instruction: "None", pitchX: 75, pitchY: 18, isStarter: false
  },
  {
    id: "box_hl_bellingham",
    name: "Jude Bellingham",
    shortName: "BELLINGHAM",
    number: 5,
    position: "AMF",
    registeredPosition: "AMF",
    positionProficiencies: createProficiencyMap("AMF", ["CMF", "SS"]),
    playerPlaystyle: "Hole Player",
    trainedPositions: [],
    nationality: "England",
    club: "Madrid Chamartin",
    age: 21,
    height: 186,
    tier: "Highlight",
    colorTheme: "#38bdf8",
    baseOvr: 93,
    currentOvr: 96,
    baseStats: {
      finishing: 89, kickingPower: 88, dribbling: 92, ballControl: 94, tightPossession: 92,
      lowPass: 91, loftedPass: 87, speed: 89, acceleration: 88, defensiveAwareness: 76,
      tackling: 78, defensiveEngagement: 85, physicalContact: 89, balance: 88, stamina: 96
    },
    currentLevel: 1, maxLevel: 30, exp: 0, progressionPoints: 0,
    allocatedPoints: { shooting: 0, dribbling: 0, dexterity: 0, lowerBody: 0, defending: 0 },
    skills: ["One-touch Pass", "Through Passing", "Fighting Spirit"], maxExtraSkills: 5, extraSkills: [],
    hasBoosterSlots: false, instruction: "None", pitchX: 62, pitchY: 50, isStarter: false
  },
  {
    id: "box_hl_saliba",
    name: "William Saliba",
    shortName: "W. SALIBA",
    number: 2,
    position: "CB",
    registeredPosition: "CB",
    positionProficiencies: createProficiencyMap("CB", ["RB"]),
    playerPlaystyle: "Build Up",
    trainedPositions: [],
    nationality: "France",
    club: "North London Red",
    age: 23,
    height: 192,
    tier: "Highlight",
    colorTheme: "#38bdf8",
    baseOvr: 92,
    currentOvr: 94,
    baseStats: {
      finishing: 50, kickingPower: 80, dribbling: 76, ballControl: 82, tightPossession: 80,
      lowPass: 84, loftedPass: 82, speed: 89, acceleration: 84, defensiveAwareness: 96,
      tackling: 96, defensiveEngagement: 95, physicalContact: 94, balance: 80, stamina: 89
    },
    currentLevel: 1, maxLevel: 30, exp: 0, progressionPoints: 0,
    allocatedPoints: { shooting: 0, dribbling: 0, dexterity: 0, lowerBody: 0, defending: 0 },
    skills: ["Interception", "Man Marking", "Blocker", "Heading"], maxExtraSkills: 5, extraSkills: [],
    hasBoosterSlots: false, instruction: "Defensive", pitchX: 25, pitchY: 62, isStarter: false
  },
  {
    id: "box_hl_nunez",
    name: "Darwin Núñez",
    shortName: "D. NÚÑEZ",
    number: 9,
    position: "CF",
    registeredPosition: "CF",
    positionProficiencies: createProficiencyMap("CF", ["LWF", "SS"]),
    playerPlaystyle: "Goal Poacher",
    trainedPositions: [],
    nationality: "Uruguay",
    club: "Merseyside Red",
    age: 25,
    height: 187,
    tier: "Highlight",
    colorTheme: "#38bdf8",
    baseOvr: 91,
    currentOvr: 92,
    baseStats: {
      finishing: 88, kickingPower: 92, dribbling: 84, ballControl: 82, tightPossession: 80,
      lowPass: 75, loftedPass: 72, speed: 94, acceleration: 92, defensiveAwareness: 50,
      tackling: 48, defensiveEngagement: 65, physicalContact: 89, balance: 82, stamina: 88
    },
    currentLevel: 1, maxLevel: 30, exp: 0, progressionPoints: 0,
    allocatedPoints: { shooting: 0, dribbling: 0, dexterity: 0, lowerBody: 0, defending: 0 },
    skills: ["Heading", "Rising Shot", "Acrobatic Finishing"], maxExtraSkills: 5, extraSkills: [],
    hasBoosterSlots: false, instruction: "None", pitchX: 82, pitchY: 50, isStarter: false
  }
];

// -------------------------------------------------------------
// FEATURED / POTW PACK (Player of the Week)
// -------------------------------------------------------------
// In eFootball, POTW cards have boosted stats, but strictly FIXED single-position familiarity!
export const POTW_WEEKLY_CARDS: PlayerCard[] = [
  {
    id: "potw_vinicius",
    name: "Vinícius Jr. (POTW)",
    shortName: "VINÍCIUS",
    number: 7,
    position: "LWF",
    registeredPosition: "LWF",
    // Note: Rigid position map (No CF or AMF familiarity - severe penalty if moved)
    positionProficiencies: createProficiencyMap("LWF"),
    playerPlaystyle: "Prolific Winger",
    trainedPositions: [],
    nationality: "Brazil",
    club: "Madrid Chamartin",
    age: 24, height: 176, tier: "Highlight", colorTheme: "#10b981",
    baseOvr: 94, currentOvr: 97,
    baseStats: {
      finishing: 92, kickingPower: 88, dribbling: 99, ballControl: 96, tightPossession: 97,
      lowPass: 85, loftedPass: 82, speed: 99, acceleration: 99, defensiveAwareness: 42,
      tackling: 38, defensiveEngagement: 45, physicalContact: 82, balance: 94, stamina: 92
    },
    currentLevel: 1, maxLevel: 25, exp: 0, progressionPoints: 0,
    allocatedPoints: { shooting: 0, dribbling: 0, dexterity: 0, lowerBody: 0, defending: 0 },
    skills: ["Double Touch", "First-time Shot", "Acrobatic Finishing"], maxExtraSkills: 5, extraSkills: [],
    hasBoosterSlots: false, instruction: "None", pitchX: 75, pitchY: 18, isStarter: false
  },
  {
    id: "potw_palmer",
    name: "Cole Palmer (POTW)",
    shortName: "C. PALMER",
    number: 20,
    position: "AMF",
    registeredPosition: "AMF",
    positionProficiencies: createProficiencyMap("AMF", ["RWF"]),
    playerPlaystyle: "Creative Playmaker",
    trainedPositions: [],
    nationality: "England",
    club: "West London Blue",
    age: 22, height: 189, tier: "Highlight", colorTheme: "#10b981",
    baseOvr: 93, currentOvr: 96,
    baseStats: {
      finishing: 92, kickingPower: 90, dribbling: 94, ballControl: 95, tightPossession: 94,
      lowPass: 94, loftedPass: 91, speed: 88, acceleration: 89, defensiveAwareness: 52,
      tackling: 48, defensiveEngagement: 58, physicalContact: 82, balance: 91, stamina: 89
    },
    currentLevel: 1, maxLevel: 25, exp: 0, progressionPoints: 0,
    allocatedPoints: { shooting: 0, dribbling: 0, dexterity: 0, lowerBody: 0, defending: 0 },
    skills: ["One-touch Pass", "Through Passing", "Long-Range Curler", "Sole Control"], maxExtraSkills: 5, extraSkills: [],
    hasBoosterSlots: false, instruction: "None", pitchX: 65, pitchY: 60, isStarter: false
  },
  {
    id: "potw_rodri",
    name: "Rodri (POTW)",
    shortName: "RODRI",
    number: 16,
    position: "DMF",
    registeredPosition: "DMF",
    positionProficiencies: createProficiencyMap("DMF"),
    playerPlaystyle: "Anchor Man",
    trainedPositions: [],
    nationality: "Spain",
    club: "Manchester Blue",
    age: 28, height: 191, tier: "Highlight", colorTheme: "#10b981",
    baseOvr: 94, currentOvr: 97,
    baseStats: {
      finishing: 80, kickingPower: 94, dribbling: 88, ballControl: 93, tightPossession: 92,
      lowPass: 96, loftedPass: 94, speed: 82, acceleration: 78, defensiveAwareness: 97,
      tackling: 97, defensiveEngagement: 98, physicalContact: 95, balance: 88, stamina: 96
    },
    currentLevel: 1, maxLevel: 25, exp: 0, progressionPoints: 0,
    allocatedPoints: { shooting: 0, dribbling: 0, dexterity: 0, lowerBody: 0, defending: 0 },
    skills: ["One-touch Pass", "Weighted Pass", "Interception", "Blocker", "Dipping Shot"], maxExtraSkills: 5, extraSkills: [],
    hasBoosterSlots: false, instruction: "Deep-Lying", pitchX: 42, pitchY: 50, isStarter: false
  },
  {
    id: "potw_martinez",
    name: "Lautaro Martínez (POTW)",
    shortName: "L. MARTÍNEZ",
    number: 10,
    position: "CF",
    registeredPosition: "CF",
    positionProficiencies: createProficiencyMap("CF"),
    playerPlaystyle: "Goal Poacher",
    trainedPositions: [],
    nationality: "Argentina",
    club: "Milano Nerazzurri",
    age: 27, height: 174, tier: "Highlight", colorTheme: "#10b981",
    baseOvr: 93, currentOvr: 96,
    baseStats: {
      finishing: 95, kickingPower: 90, dribbling: 89, ballControl: 90, tightPossession: 88,
      lowPass: 81, loftedPass: 76, speed: 90, acceleration: 92, defensiveAwareness: 65,
      tackling: 60, defensiveEngagement: 80, physicalContact: 91, balance: 93, stamina: 92
    },
    currentLevel: 1, maxLevel: 25, exp: 0, progressionPoints: 0,
    allocatedPoints: { shooting: 0, dribbling: 0, dexterity: 0, lowerBody: 0, defending: 0 },
    skills: ["Acrobatic Finishing", "Heading", "First-time Shot", "Fighting Spirit"], maxExtraSkills: 5, extraSkills: [],
    hasBoosterSlots: false, instruction: "None", pitchX: 82, pitchY: 50, isStarter: false
  }
];

// 25 realistic base templates used to generate the 135 standard filler cards
export const STANDARD_FILLER_TEMPLATES = [
  { name: "Sean Longstaff", pos: "CMF", club: "Tyneside Black-White", ovr: 76, nat: "England", playstyle: "Box-to-Box" },
  { name: "Divock Origi", pos: "CF", club: "Milano Rossoneri", ovr: 77, nat: "Belgium", playstyle: "Target Man" },
  { name: "Francis Coquelin", pos: "DMF", club: "Villarreal Yellow", ovr: 76, nat: "France", playstyle: "Anchor Man" },
  { name: "Chris Wood", pos: "CF", club: "Nottingham Red", ovr: 78, nat: "New Zealand", playstyle: "Target Man" },
  { name: "Mikkel Damsgaard", pos: "LMF", club: "Brentford Red-White", ovr: 76, nat: "Denmark", playstyle: "Creative Playmaker" },
  { name: "Danny Welbeck", pos: "CF", club: "Brighton Blue", ovr: 77, nat: "England", playstyle: "Goal Poacher" },
  { name: "Bertrand Traoré", pos: "RWF", club: "Amsterdam White-Red", ovr: 76, nat: "Burkina Faso", playstyle: "Roaming Flank" },
  { name: "Gerónimo Rulli", pos: "GK", club: "Marseille Blue", ovr: 78, nat: "Argentina", playstyle: "Offensive Goalkeeper" },
  { name: "Eric Dier", pos: "CB", club: "Bayern Munich", ovr: 78, nat: "England", playstyle: "Build Up" },
  { name: "Jonjo Shelvey", pos: "CMF", club: "Çaykur Green", ovr: 74, nat: "England", playstyle: "Orchestrator" },
  { name: "Ayoze Pérez", pos: "SS", club: "Villarreal Yellow", ovr: 78, nat: "Spain", playstyle: "Hole Player" },
  { name: "Joel Ward", pos: "RB", club: "South London Eagles", ovr: 74, nat: "England", playstyle: "Defensive Full-back" },
  { name: "Arthur Cabral", pos: "CF", club: "Lisbon Eagles", ovr: 77, nat: "Brazil", playstyle: "Goal Poacher" },
  { name: "Marten de Roon", pos: "DMF", club: "Bergamo Blue-Black", ovr: 78, nat: "Netherlands", playstyle: "Anchor Man" },
  { name: "Rob Holding", pos: "CB", club: "South London Eagles", ovr: 74, nat: "England", playstyle: "Extra Frontman" },
  { name: "Emil Krafth", pos: "RB", club: "Tyneside Black-White", ovr: 75, nat: "Sweden", playstyle: "Defensive Full-back" },
  { name: "Matt Targett", pos: "LB", club: "Tyneside Black-White", ovr: 76, nat: "England", playstyle: "Full-back Finisher" },
  { name: "Jefferson Lerma", pos: "DMF", club: "South London Eagles", ovr: 78, nat: "Colombia", playstyle: "Destroyer" },
  { name: "Mark Flekken", pos: "GK", club: "Brentford Red-White", ovr: 78, nat: "Netherlands", playstyle: "Defensive Goalkeeper" },
  { name: "Bryan Gil", pos: "LWF", club: "Girona Red", ovr: 77, nat: "Spain", playstyle: "Prolific Winger" },
  { name: "Oliver Skipp", pos: "CMF", club: "Leicester Blue", ovr: 75, nat: "England", playstyle: "Box-to-Box" },
  { name: "Ben Godfrey", pos: "CB", club: "Bergamo Blue-Black", ovr: 76, nat: "England", playstyle: "Build Up" },
  { name: "Adam Lallana", pos: "AMF", club: "Southampton Red", ovr: 75, nat: "England", playstyle: "Creative Playmaker" },
  { name: "Carlos Vinícius", pos: "CF", club: "West London White", ovr: 76, nat: "Brazil", playstyle: "Target Man" },
  { name: "Fraser Forster", pos: "GK", club: "North London White", ovr: 76, nat: "England", playstyle: "Defensive Goalkeeper" }
];

export function generateStandardFillerCard(index: number): PlayerCard {
  const template = STANDARD_FILLER_TEMPLATES[index % STANDARD_FILLER_TEMPLATES.length];
  const uniqueId = `box_filler_${template.name.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}_${index}`;
  const targetPos = template.pos as Position;

  return {
    id: uniqueId,
    name: template.name,
    shortName: template.name.split(' ').pop()?.toUpperCase() || template.name.toUpperCase(),
    number: Math.floor(Math.random() * 30) + 12,
    position: targetPos,
    registeredPosition: targetPos,
    positionProficiencies: createProficiencyMap(targetPos),
    playerPlaystyle: template.playstyle,
    trainedPositions: [],
    nationality: template.nat,
    club: template.club,
    age: 25 + (index % 8),
    height: 180 + (index % 12),
    tier: "Standard",
    colorTheme: "#64748b",
    baseOvr: template.ovr,
    currentOvr: template.ovr,
    baseStats: {
      finishing: targetPos === 'CF' ? 76 : 64,
      kickingPower: 76,
      dribbling: 74,
      ballControl: 75,
      tightPossession: 73,
      lowPass: 74,
      loftedPass: 72,
      speed: 76,
      acceleration: 75,
      defensiveAwareness: targetPos === 'CB' ? 78 : 55,
      tackling: targetPos === 'CB' ? 78 : 52,
      defensiveEngagement: 65,
      physicalContact: 76,
      balance: 74,
      stamina: 78
    },
    currentLevel: 1,
    maxLevel: 24,
    exp: 0,
    progressionPoints: 0,
    allocatedPoints: { shooting: 0, dribbling: 0, dexterity: 0, lowerBody: 0, defending: 0 },
    skills: ["First-time Shot"],
    maxExtraSkills: 5,
    extraSkills: [],
    hasBoosterSlots: false,
    instruction: "None",
    pitchX: 50,
    pitchY: 50,
    isStarter: false
  };
}

// -------------------------------------------------------------
// DEFAULT THEMES MANIFEST
// -------------------------------------------------------------
export const INITIAL_EPIC_BOX_THEMES: EpicBoxTheme[] = [
  {
    id: "worldwide_legends",
    title: "Worldwide Legends",
    subtitle: "Ronaldinho (101) · Cruyff (100) · Davids (98)",
    description: "Iconic historical attackers and box-to-box midfield anchors with signature dual boosters.",
    category: "Attackers & Playmakers",
    epics: WORLDWIDE_LEGENDS_EPICS,
    highlights: BOX_HIGHLIGHT_CARDS,
    state: {
      totalRemaining: 150,
      epicsRemaining: 3,
      highlightsRemaining: 12,
      standardsRemaining: 135,
      totalSpun: 0
    },
    milestones: [
      { spinsRequired: 15, rewardTitle: "50,000 GP & 10k EXP", rewardDescription: "Starter booster package", claimed: false },
      { spinsRequired: 30, rewardTitle: "Guaranteed Highlight Contract", rewardDescription: "Free Highlight superstar pick", claimed: false },
      { spinsRequired: 50, rewardTitle: "Random Booster Token + Position Program", rewardDescription: "Crafting upgrade bundle", claimed: false },
      { spinsRequired: 100, rewardTitle: "Select Booster Token", rewardDescription: "100% custom booster crafting token", claimed: false }
    ]
  },
  {
    id: "defensive_titans",
    title: "Defensive Titans & Guardians",
    subtitle: "Maldini (101) · Vieira (101) · Casillas (99)",
    description: "Balanced defensive representation: World-class CB/LB, elite midfield anchor DMF, and legendary GK.",
    category: "Defensive Titans & Guardians",
    epics: DEFENSIVE_TITANS_EPICS,
    highlights: BOX_HIGHLIGHT_CARDS,
    state: {
      totalRemaining: 150,
      epicsRemaining: 3,
      highlightsRemaining: 12,
      standardsRemaining: 135,
      totalSpun: 0
    },
    milestones: [
      { spinsRequired: 15, rewardTitle: "50,000 GP & 10k EXP", rewardDescription: "Defensive training fund", claimed: false },
      { spinsRequired: 30, rewardTitle: "Guaranteed Highlight Defender", rewardDescription: "Direct defensive reinforcement", claimed: false },
      { spinsRequired: 50, rewardTitle: "Random Booster Token", rewardDescription: "Defensive stat booster", claimed: false },
      { spinsRequired: 100, rewardTitle: "Select Booster Token", rewardDescription: "Direct booster crafting token", claimed: false }
    ]
  },
  {
    id: "flank_maestros",
    title: "Flank Maestros & Universal Icons",
    subtitle: "R. Carlos (99) · Cafu (99) · Gullit (101)",
    description: "Legendary attacking full-backs with maximum speed and Ruud Gullit's total positional versatility.",
    category: "Flank Maestros & Universal Icons",
    epics: FLANK_MAESTROS_EPICS,
    highlights: BOX_HIGHLIGHT_CARDS,
    state: {
      totalRemaining: 150,
      epicsRemaining: 3,
      highlightsRemaining: 12,
      standardsRemaining: 135,
      totalSpun: 0
    },
    milestones: [
      { spinsRequired: 15, rewardTitle: "50,000 GP & 10k EXP", rewardDescription: "Sprint & stamina drills", claimed: false },
      { spinsRequired: 30, rewardTitle: "Position Training Program x2", rewardDescription: "Unlock secondary roles", claimed: false },
      { spinsRequired: 50, rewardTitle: "Random Booster Token", rewardDescription: "Speed & Curve booster", claimed: false },
      { spinsRequired: 100, rewardTitle: "Select Booster Token", rewardDescription: "Universal stat allocation token", claimed: false }
    ]
  }
];

// Helper to draw from a specific 150 Epic Box theme
export function drawFromThemedEpicBox(
  theme: EpicBoxTheme,
  spinCount: 1 | 10 | 50
): {
  drawnCards: PlayerCard[];
  newState: EpicBoxState;
  hasEpic: boolean;
  epicCount: number;
  highlightCount: number;
  standardFillerCount: number;
  loyaltyTokensEarned: number;
} {
  const currentState = theme.state;
  const count = Math.min(spinCount, currentState.totalRemaining);
  const drawnCards: PlayerCard[] = [];
  let epicsLeft = currentState.epicsRemaining;
  let highlightsLeft = currentState.highlightsRemaining;
  let standardsLeft = currentState.standardsRemaining;
  let totalLeft = currentState.totalRemaining;
  let epicCount = 0;
  let highlightCount = 0;
  let standardFillerCount = 0;

  for (let i = 0; i < count; i++) {
    if (totalLeft <= 0) break;

    const roll = Math.random() * totalLeft;

    if (roll < epicsLeft && epicsLeft > 0) {
      // Pulled Marquee Epic!
      const epicCard = theme.epics[(3 - epicsLeft) % theme.epics.length];
      const clonedEpic = { ...epicCard, id: `box_pull_epic_${Date.now()}_${i}` };
      drawnCards.push(clonedEpic);
      epicsLeft--;
      epicCount++;
    } else if (roll < epicsLeft + highlightsLeft && highlightsLeft > 0) {
      // Pulled Highlight!
      const hlCard = theme.highlights[Math.floor(Math.random() * theme.highlights.length)];
      const clonedHl = { ...hlCard, id: `box_pull_hl_${Date.now()}_${i}` };
      drawnCards.push(clonedHl);
      highlightsLeft--;
      highlightCount++;
    } else {
      // Pulled Standard "Filler" Card!
      const fillerCard = generateStandardFillerCard(currentState.totalSpun + i);
      drawnCards.push(fillerCard);
      standardsLeft = Math.max(0, standardsLeft - 1);
      standardFillerCount++;
    }

    totalLeft--;
  }

  const newState: EpicBoxState = {
    totalRemaining: totalLeft,
    epicsRemaining: epicsLeft,
    highlightsRemaining: highlightsLeft,
    standardsRemaining: standardsLeft,
    totalSpun: currentState.totalSpun + drawnCards.length
  };

  // Upgraded integration with standard cards: each filler awards +10 Loyalty Tokens
  const loyaltyTokensEarned = standardFillerCount * 10;

  return {
    drawnCards,
    newState,
    hasEpic: epicCount > 0,
    epicCount,
    highlightCount,
    standardFillerCount,
    loyaltyTokensEarned
  };
}

// Draw from POTW Pack
export function drawFromPotwPack(
  potwCards: PlayerCard[]
): PlayerCard {
  const randomIndex = Math.floor(Math.random() * potwCards.length);
  const card = potwCards[randomIndex];
  return {
    ...card,
    id: `potw_pull_${Date.now()}_${Math.random()}`
  };
}

/**
 * Calculates remaining coins needed to completely clear the 150-box
 */
export function calculateClearBoxCost(remainingCards: number): number {
  const tenPacks = Math.floor(remainingCards / 10);
  const singlePacks = remainingCards % 10;
  return (tenPacks * 900) + (singlePacks * 100);
}
