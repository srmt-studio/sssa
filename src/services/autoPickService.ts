import { AutoPickCriterion, PlayerCard, Position, TeamPlaystyle, getPositionProficiency, getEffectiveOVR } from '../types/game';
import { FORMATIONS_COORDINATES } from '../data/initialData';

export interface AutoPickSlotReport {
  slotIndex: number;
  slotPosition: Position;
  playerName: string;
  playerId: string;
  registeredPosition: Position;
  assignedPosition: Position;
  matchType: 'Primary Match' | 'Secondary Familiarity' | 'Out of Position';
  naturalOvr: number;
  effectiveOvr: number;
  playstyle: string;
}

export interface AutoPickResult {
  updatedPlayers: PlayerCard[];
  squadValue: number;
  notice: string;
  slotReports: AutoPickSlotReport[];
  tacticalWarnings: string[];
}

export function executeAutoPick(
  allPlayers: PlayerCard[],
  formation: string,
  criterion: AutoPickCriterion,
  playstyle: TeamPlaystyle
): AutoPickResult {
  const formationSlots = FORMATIONS_COORDINATES[formation] || FORMATIONS_COORDINATES["4-3-3"];
  const unassigned = [...allPlayers];
  const starters: PlayerCard[] = [];
  const assignedIds = new Set<string>();
  const slotReports: AutoPickSlotReport[] = [];

  // Iterating through each slot on tactical board
  formationSlots.forEach((slot, idx) => {
    const targetSlotPos = slot.pos as Position;

    // STEP 1: Strict Compliance - Primary Registered Position Matching
    // Search pool for players whose registered primary position explicitly matches the slot
    const naturalCandidates = unassigned.filter(
      p => !assignedIds.has(p.id) && p.registeredPosition === targetSlotPos
    );

    let chosenPlayer: PlayerCard | null = null;
    let matchType: 'Primary Match' | 'Secondary Familiarity' | 'Out of Position' = 'Primary Match';

    if (naturalCandidates.length > 0) {
      // STEP 2: Overall Rating (OVR) Hierarchy
      // Sort strictly by raw numerical OVR descending (ignoring form, weak foot, stamina, playstyle)
      if (criterion === 'playstyle') {
        // Factor in playstyle synergy if user selected playstyle criterion
        naturalCandidates.sort((a, b) => {
          let scoreA = a.currentOvr;
          let scoreB = b.currentOvr;
          if (playstyle === 'Quick Counter') {
            scoreA += (a.baseStats.speed + a.baseStats.acceleration) * 0.05;
            scoreB += (b.baseStats.speed + b.baseStats.acceleration) * 0.05;
          } else if (playstyle === 'Possession Game') {
            scoreA += (a.baseStats.lowPass + a.baseStats.ballControl) * 0.05;
            scoreB += (b.baseStats.lowPass + b.baseStats.ballControl) * 0.05;
          }
          return scoreB - scoreA;
        });
      } else if (criterion === 'event_league') {
        // Prioritize players with European club affiliations, then OVR
        naturalCandidates.sort((a, b) => {
          const clubPriority = (b.club.includes('Manchester') || b.club.includes('Madrid') || b.club.includes('Barcelona') ? 5 : 0) -
                               (a.club.includes('Manchester') || a.club.includes('Madrid') || a.club.includes('Barcelona') ? 5 : 0);
          if (clubPriority !== 0) return clubPriority;
          return b.currentOvr - a.currentOvr;
        });
      } else {
        // Pure Numerical OVR hierarchy (Strict eFootball Auto-Pick logic)
        naturalCandidates.sort((a, b) => b.currentOvr - a.currentOvr);
      }
      chosenPlayer = naturalCandidates[0];
      matchType = 'Primary Match';
    } else {
      // STEP 3: Handling Out-of-Position and Utility Players via Position Proficiency
      // Check for players with secondary proficiency (Full unlocked or Partial)
      const secondaryCandidates = unassigned.filter(p => {
        if (assignedIds.has(p.id)) return false;
        const prof = getPositionProficiency(p, targetSlotPos);
        return prof === 'Full' || prof === 'Partial';
      });

      if (secondaryCandidates.length > 0) {
        // Sort by proficiency priority (Full > Partial) then OVR
        secondaryCandidates.sort((a, b) => {
          const profA = getPositionProficiency(a, targetSlotPos);
          const profB = getPositionProficiency(b, targetSlotPos);
          if (profA !== profB) {
            return profA === 'Full' ? -1 : 1;
          }
          return b.currentOvr - a.currentOvr;
        });
        chosenPlayer = secondaryCandidates[0];
        matchType = 'Secondary Familiarity';
      } else {
        // Extreme fallback: If club inventory is thin, system behaves erratically,
        // picking highest OVR player available even if completely zero-familiarity
        const remainingCandidates = unassigned.filter(p => !assignedIds.has(p.id));
        if (remainingCandidates.length > 0) {
          remainingCandidates.sort((a, b) => b.currentOvr - a.currentOvr);
          chosenPlayer = remainingCandidates[0];
          matchType = 'Out of Position';
        }
      }
    }

    if (chosenPlayer) {
      assignedIds.add(chosenPlayer.id);
      const configuredPlayer: PlayerCard = {
        ...chosenPlayer,
        isStarter: true,
        position: targetSlotPos,
        pitchX: slot.x,
        pitchY: slot.y
      };
      starters.push(configuredPlayer);

      const { effectiveOvr } = getEffectiveOVR(configuredPlayer, targetSlotPos);
      slotReports.push({
        slotIndex: idx,
        slotPosition: targetSlotPos,
        playerName: chosenPlayer.name,
        playerId: chosenPlayer.id,
        registeredPosition: chosenPlayer.registeredPosition,
        assignedPosition: targetSlotPos,
        matchType,
        naturalOvr: chosenPlayer.currentOvr,
        effectiveOvr,
        playstyle: chosenPlayer.playerPlaystyle
      });
    }
  });

  // STEP 4: Fill Substitutes / Reserves sorted by OVR
  const remainingBench = unassigned
    .filter(p => !assignedIds.has(p.id))
    .sort((a, b) => b.currentOvr - a.currentOvr)
    .map(p => ({
      ...p,
      isStarter: false
    }));

  const allUpdatedPlayers = [...starters, ...remainingBench];

  // Calculate Average Squad Rating using effective OVR
  const starterOvrSum = starters.reduce((acc, p) => {
    const { effectiveOvr } = getEffectiveOVR(p, p.position);
    return acc + effectiveOvr;
  }, 0);
  const avgOvr = Math.round(starterOvrSum / Math.max(1, starters.length));

  // STEP 5: Tactical Warnings & Nuance Generation
  const tacticalWarnings: string[] = [];

  // Check for dual Extra Frontmen in defense
  const extraFrontmen = starters.filter(p => p.playerPlaystyle === 'Extra Frontman' && (p.position === 'CB' || p.position === 'LB' || p.position === 'RB'));
  if (extraFrontmen.length >= 2) {
    tacticalWarnings.push(`Caution: Multiple 'Extra Frontman' defenders (${extraFrontmen.map(p => p.shortName).join(' & ')}) are paired. Both will aggressively step out of defensive lines, creating dangerous exposure.`);
  }

  // Check for players placed out of position
  const outOfPos = slotReports.filter(s => s.matchType === 'Out of Position');
  if (outOfPos.length > 0) {
    tacticalWarnings.push(`Severe Penalty: ${outOfPos.length} player(s) placed out of position (${outOfPos.map(p => `${p.playerName} at ${p.assignedPosition}`).join(', ')}). They suffer up to 24% stat reduction and disabled playstyles.`);
  }

  const secondaryPos = slotReports.filter(s => s.matchType === 'Secondary Familiarity');
  if (secondaryPos.length > 0) {
    tacticalWarnings.push(`Proficiency Notice: ${secondaryPos.length} player(s) placed in secondary positions with minor stat penalties.`);
  }

  // Check weak foot / stamina warnings
  const lowStaminaStarters = starters.filter(p => p.baseStats.stamina < 78);
  if (lowStaminaStarters.length > 0) {
    tacticalWarnings.push(`Stamina Alert: Auto-Pick ignored low stamina ratings on ${lowStaminaStarters.map(p => p.shortName).join(', ')}. Substitutions will be required by 60th minute.`);
  }

  let notice = `Auto-Pick Complete: Primary registered position matching applied. `;
  if (outOfPos.length > 0 || secondaryPos.length > 0) {
    notice += `Warning: ${outOfPos.length + secondaryPos.length} player(s) placed in secondary or out-of-position slots. Manual adjustment recommended!`;
  } else {
    notice += `All 11 slots filled with full position compliance. Raw OVR hierarchy prioritized.`;
  }

  return {
    updatedPlayers: allUpdatedPlayers,
    squadValue: avgOvr,
    notice,
    slotReports,
    tacticalWarnings
  };
}
