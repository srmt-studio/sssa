import { MatchSettings, PlayerCard, Team, getPositionProficiency } from '../types/game';
import { sound } from '../services/soundService';

export interface SimPlayer {
  id: string;
  name: string;
  shortName: string;
  number: number;
  position: string;
  teamSide: 'home' | 'away';
  isGK: boolean;
  x: number; // Pitch coordinates: 0 to 1200
  y: number; // 0 to 800
  vx: number;
  vy: number;
  angle: number;
  targetX: number;
  targetY: number;
  speed: number;
  maxSpeed: number;
  stamina: number; // 0 to 100
  maxStamina: number;
  staminaDrainedRate: number;
  isSprinting: boolean;
  isMatchUp: boolean; // Match-up defensive stance
  isSliding: boolean;
  slideTimer: number;
  hasBall: boolean;
  chargingShot: boolean;
  chargeTime: number; // 0 to 1
  isStunningAction: boolean; // purple gauge
  actionType: 'none' | 'shot' | 'pass' | 'through' | 'lofted';
  celebrating: boolean;
  outOfPositionPenalty: 'Full' | 'Partial' | 'None';
  isPlaystyleDeactivated: boolean;
  cardData?: PlayerCard;
}

export interface SimBall {
  x: number;
  y: number;
  z: number; // height off pitch
  vx: number;
  vy: number;
  vz: number;
  spinX: number;
  spinY: number;
  lastTouchPlayer: SimPlayer | null;
  lastTouchTeam: 'home' | 'away' | null;
  trail: { x: number; y: number; z: number; isStun: boolean; alpha: number }[];
}

export interface ReplayFrame {
  ball: { x: number; y: number; z: number };
  players: { id: string; x: number; y: number; angle: number; hasBall: boolean }[];
}

export interface MatchStats {
  homeScore: number;
  awayScore: number;
  homeShots: number;
  awayShots: number;
  homeShotsOnTarget: number;
  awayShotsOnTarget: number;
  homePossessionSec: number;
  awayPossessionSec: number;
  homePasses: number;
  awayPasses: number;
  homePassesCompleted: number;
  awayPassesCompleted: number;
  homeFouls: number;
  awayFouls: number;
  scorers: { name: string; minute: number; team: 'home' | 'away'; isStunning: boolean }[];
}

export type MatchPhase = 
  | 'kickoff' 
  | 'active' 
  | 'goal_celebration' 
  | 'corner' 
  | 'goal_kick' 
  | 'throw_in' 
  | 'halftime' 
  | 'fulltime';

export class MatchEngine {
  public width = 1200;
  public height = 800;
  public goalHeight = 160;
  public goalYMin = 320;
  public goalYMax = 480;

  public homeTeam: Team;
  public awayTeam: Team;
  public settings: MatchSettings;
  public players: SimPlayer[] = [];
  public ball: SimBall;
  
  public phase: MatchPhase = 'kickoff';
  public matchTimeSec = 0;
  public totalHalfSec = 120; // 2 minutes per half scaled to 45 mins
  public currentHalf = 1;
  public matchMinute = 0;
  public stats: MatchStats;

  public controlledPlayerId: string = '';
  public secondManPressId: string = '';

  // Input state
  public inputDirection = { x: 0, y: 0 };
  public isSprintHeld = false;
  public isMatchUpHeld = false;
  public isStunModifier = false;
  public isCharging = false;
  public currentChargeAction: 'shot' | 'pass' | 'through' | 'lofted' = 'shot';
  public chargeAmount = 0; // 0 to 1

  // Replay
  public replayBuffer: ReplayFrame[] = [];
  public isReplaying = false;
  public replayFrameIndex = 0;

  // Visual effects
  public turfParticles: { x: number; y: number; vx: number; vy: number; life: number; color: string }[] = [];

  constructor(homeTeam: Team, awayTeam: Team, settings: MatchSettings) {
    this.homeTeam = homeTeam;
    this.awayTeam = awayTeam;
    this.settings = settings;
    this.totalHalfSec = settings.halfLengthSec;

    this.ball = {
      x: 600,
      y: 400,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      spinX: 0,
      spinY: 0,
      lastTouchPlayer: null,
      lastTouchTeam: null,
      trail: []
    };

    this.stats = {
      homeScore: 0,
      awayScore: 0,
      homeShots: 0,
      awayShots: 0,
      homeShotsOnTarget: 0,
      awayShotsOnTarget: 0,
      homePossessionSec: 0,
      awayPossessionSec: 0,
      homePasses: 0,
      awayPasses: 0,
      homePassesCompleted: 0,
      awayPassesCompleted: 0,
      homeFouls: 0,
      awayFouls: 0,
      scorers: []
    };

    this.initPlayers();
  }

  public initPlayers() {
    this.players = [];

    // Home Team (Starts on left, attacks right)
    const homeStarters = this.homeTeam.players.filter(p => p.isStarter);
    // Chemistry bonus calculation
    const managerProficiency = this.homeTeam.manager.proficiencies[this.homeTeam.playstyle] || 80;
    const chemBonus = managerProficiency >= 88 ? 2 : managerProficiency >= 80 ? 1 : 0;

    homeStarters.forEach((p) => {
      const isGK = p.position === 'GK';
      const familiarity = getPositionProficiency(p, p.position);
      // Stat reductions: 10% for partial, 20% for zero familiarity
      const statMult = familiarity === 'Full' ? 1.0 : familiarity === 'Partial' ? 0.90 : 0.80;
      // Faster stamina drain: 1.25x or 1.50x burn rate
      const staminaDrainMult = familiarity === 'Full' ? 1.0 : familiarity === 'Partial' ? 1.25 : 1.50;

      const effSpeed = (((p.baseStats.speed * statMult) + chemBonus) / 100) * 4.4 + 1.2;
      const baseStaminaRate = p.baseStats.stamina > 90 ? 0.05 : 0.08;

      const simP: SimPlayer = {
        id: `home_${p.id}`,
        name: p.name,
        shortName: p.shortName,
        number: p.number,
        position: p.position,
        teamSide: 'home',
        isGK,
        x: (p.pitchX / 100) * (this.width / 2) + 40,
        y: (p.pitchY / 100) * this.height,
        vx: 0,
        vy: 0,
        angle: 0,
        targetX: (p.pitchX / 100) * (this.width / 2) + 40,
        targetY: (p.pitchY / 100) * this.height,
        speed: 0,
        maxSpeed: effSpeed,
        stamina: 100,
        maxStamina: 100,
        staminaDrainedRate: baseStaminaRate * staminaDrainMult,
        isSprinting: false,
        isMatchUp: false,
        isSliding: false,
        slideTimer: 0,
        hasBall: false,
        chargingShot: false,
        chargeTime: 0,
        isStunningAction: false,
        actionType: 'none',
        celebrating: false,
        outOfPositionPenalty: familiarity,
        isPlaystyleDeactivated: familiarity !== 'Full',
        cardData: p
      };
      this.players.push(simP);
    });

    // Away Team (Starts on right, attacks left)
    // Generate standard balanced opposition players
    const awayPositions = [
      { pos: 'GK', x: 92, y: 50, name: 'T. Courtois', num: 1 },
      { pos: 'RB', x: 74, y: 82, name: 'D. Carvajal', num: 2 },
      { pos: 'CB', x: 78, y: 62, name: 'A. Rüdiger', num: 22 },
      { pos: 'CB', x: 78, y: 38, name: 'E. Militão', num: 3 },
      { pos: 'LB', x: 74, y: 18, name: 'F. Mendy', num: 23 },
      { pos: 'DMF', x: 62, y: 50, name: 'A. Tchouaméni', num: 14 },
      { pos: 'CMF', x: 55, y: 34, name: 'F. Valverde', num: 15 },
      { pos: 'CMF', x: 55, y: 66, name: 'J. Bellingham', num: 5 },
      { pos: 'RWF', x: 38, y: 76, name: 'Rodrygo', num: 11 },
      { pos: 'CF', x: 32, y: 50, name: 'K. Mbappé', num: 9 },
      { pos: 'LWF', x: 38, y: 24, name: 'Vinícius Jr.', num: 7 }
    ];

    awayPositions.forEach((ap, idx) => {
      const isGK = ap.pos === 'GK';
      const simP: SimPlayer = {
        id: `away_${idx}`,
        name: ap.name,
        shortName: ap.name.split(' ').pop() || ap.name,
        number: ap.num,
        position: ap.pos,
        teamSide: 'away',
        isGK,
        x: (ap.x / 100) * this.width,
        y: (ap.y / 100) * this.height,
        vx: 0,
        vy: 0,
        angle: Math.PI,
        targetX: (ap.x / 100) * this.width,
        targetY: (ap.y / 100) * this.height,
        speed: 0,
        maxSpeed: 4.8,
        stamina: 100,
        maxStamina: 100,
        staminaDrainedRate: 0.06,
        isSprinting: false,
        isMatchUp: false,
        isSliding: false,
        slideTimer: 0,
        hasBall: false,
        chargingShot: false,
        chargeTime: 0,
        isStunningAction: false,
        actionType: 'none',
        celebrating: false,
        outOfPositionPenalty: 'Full',
        isPlaystyleDeactivated: false
      };
      this.players.push(simP);
    });

    // Set initial user controlled player to midfield/striker
    const firstAttacker = this.players.find(p => p.teamSide === 'home' && (p.position === 'CF' || p.position === 'AMF' || p.position === 'CMF')) || this.players[0];
    this.controlledPlayerId = firstAttacker.id;
  }

  public resetToKickoff(scoringSide?: 'home' | 'away') {
    this.phase = 'kickoff';
    this.ball.x = 600;
    this.ball.y = 400;
    this.ball.z = 0;
    this.ball.vx = 0;
    this.ball.vy = 0;
    this.ball.vz = 0;
    this.ball.lastTouchPlayer = null;

    // Reset positions to kickoff defaults
    this.players.forEach(p => {
      p.hasBall = false;
      p.isSliding = false;
      p.chargingShot = false;
      p.celebrating = false;
      if (p.teamSide === 'home') {
        const starter = p.cardData;
        const defaultX = starter ? (starter.pitchX / 100) * (this.width / 2) + 40 : 400;
        const defaultY = starter ? (starter.pitchY / 100) * this.height : 400;
        p.x = defaultX;
        p.y = defaultY;
        p.targetX = defaultX;
        p.targetY = defaultY;
      } else {
        p.x = Math.max(650, p.x);
        p.targetX = p.x;
      }
    });

    // Give ball to kicking team
    const kickoffTeam = scoringSide ? (scoringSide === 'home' ? 'away' : 'home') : 'home';
    const kickoffPlayer = this.players.find(p => p.teamSide === kickoffTeam && (p.position === 'CF' || p.position === 'AMF')) || this.players[0];
    kickoffPlayer.x = 590;
    kickoffPlayer.y = 400;
    kickoffPlayer.hasBall = true;
    this.ball.lastTouchPlayer = kickoffPlayer;
    this.ball.lastTouchTeam = kickoffTeam;
    if (kickoffTeam === 'home') {
      this.controlledPlayerId = kickoffPlayer.id;
    }
  }

  // Handle user inputs
  public setJoystickVector(vx: number, vy: number) {
    this.inputDirection = { x: vx, y: vy };
  }

  public setSprint(held: boolean) {
    this.isSprintHeld = held;
  }

  public setMatchUp(held: boolean) {
    this.isMatchUpHeld = held;
  }

  public toggleStunModifier(val?: boolean) {
    this.isStunModifier = val !== undefined ? val : !this.isStunModifier;
  }

  public startCharge(action: 'shot' | 'pass' | 'through' | 'lofted') {
    const controlled = this.getControlledPlayer();
    if (!controlled || !controlled.hasBall) return;
    this.isCharging = true;
    this.currentChargeAction = action;
    this.chargeAmount = 0;
    controlled.chargingShot = true;
    controlled.actionType = action;
    controlled.isStunningAction = this.isStunModifier;
  }

  public releaseCharge() {
    if (!this.isCharging) return;
    const controlled = this.getControlledPlayer();
    if (controlled && controlled.hasBall) {
      this.executeAction(controlled, this.currentChargeAction, this.chargeAmount, controlled.isStunningAction);
      controlled.chargingShot = false;
      controlled.isStunningAction = false;
      controlled.actionType = 'none';
    }
    this.isCharging = false;
    this.chargeAmount = 0;
  }

  public quickAction(action: 'shot' | 'pass' | 'through' | 'lofted') {
    const controlled = this.getControlledPlayer();
    if (!controlled) return;
    if (controlled.hasBall) {
      this.executeAction(controlled, action, 0.45, this.isStunModifier);
    } else {
      // Defensive actions
      if (action === 'pass') {
        // Switch player to closest to ball
        this.switchControlledToClosest();
      } else if (action === 'lofted') {
        // Slide tackle!
        this.triggerSlideTackle(controlled);
      }
    }
  }

  public triggerSlideTackle(p: SimPlayer) {
    if (p.isSliding) return;
    p.isSliding = true;
    p.slideTimer = 35; // frames
    const angle = p.angle;
    p.vx = Math.cos(angle) * (this.settings.weather.includes('Rain') ? 11 : 8.5);
    p.vy = Math.sin(angle) * (this.settings.weather.includes('Rain') ? 11 : 8.5);
    sound.playKick(0.3);

    // Spawn turf particles
    for (let i = 0; i < 12; i++) {
      this.turfParticles.push({
        x: p.x,
        y: p.y,
        vx: (Math.random() - 0.5) * 4 - p.vx * 0.3,
        vy: (Math.random() - 0.5) * 4 - p.vy * 0.3,
        life: 25,
        color: this.settings.weather.includes('Rain') ? '#a5f3fc' : '#4ade80'
      });
    }
  }

  public getControlledPlayer(): SimPlayer | null {
    return this.players.find(p => p.id === this.controlledPlayerId) || null;
  }

  public switchControlledToClosest() {
    let closest: SimPlayer | null = null;
    let minDist = Infinity;
    this.players.filter(p => p.teamSide === 'home' && !p.isGK).forEach(p => {
      const d = Math.hypot(p.x - this.ball.x, p.y - this.ball.y);
      if (d < minDist) {
        minDist = d;
        closest = p;
      }
    });
    if (closest) {
      this.controlledPlayerId = (closest as SimPlayer).id;
    }
  }

  public executeAction(player: SimPlayer, action: 'shot' | 'pass' | 'through' | 'lofted', powerRatio: number, isStun: boolean) {
    const power = Math.max(0.2, Math.min(1.0, powerRatio));
    player.hasBall = false;

    // Smart Assist helper
    let aimX = Math.cos(player.angle);
    let aimY = Math.sin(player.angle);
    if (this.inputDirection.x !== 0 || this.inputDirection.y !== 0) {
      aimX = this.inputDirection.x;
      aimY = this.inputDirection.y;
    }

    if (isStun) {
      sound.playStunningShot();
    } else {
      sound.playKick(power);
    }

    if (action === 'shot') {
      this.stats.homeShots++;
      // Aim at opponent goal (x = 1200, y between 340 and 460)
      const targetGoalX = player.teamSide === 'home' ? 1200 : 0;
      // Smart assist aims into corner of goal
      const cornerTargetY = player.y < 400 ? 350 : 450;
      const targetY = this.settings.smartAssist ? cornerTargetY + (Math.random() - 0.5) * 30 : player.y + aimY * 300;

      const dx = targetGoalX - player.x;
      const dy = targetY - player.y;
      const dist = Math.hypot(dx, dy);

      const baseVel = isStun ? 26 + power * 9 : 17 + power * 8;
      this.ball.vx = (dx / dist) * baseVel;
      this.ball.vy = (dy / dist) * baseVel;
      this.ball.vz = isStun ? 1.5 + power * 2 : 2.5 + power * 3;
      this.ball.spinY = (Math.random() - 0.5) * (isStun ? 0.35 : 0.15);

      if (Math.abs(targetY - 400) < 70) {
        this.stats.homeShotsOnTarget++;
      }
    } else if (action === 'pass') {
      this.stats.homePasses++;
      // Find best teammate in passing cone
      const teammates = this.players.filter(p => p.teamSide === player.teamSide && p.id !== player.id && !p.isGK);
      let bestTeammate: SimPlayer | null = null;
      let bestScore = -Infinity;

      teammates.forEach(tm => {
        const dx = tm.x - player.x;
        const dy = tm.y - player.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 500) return;
        const dot = (dx * aimX + dy * aimY) / dist;
        if (dot > 0.4) {
          const score = dot * 100 - dist * 0.1;
          if (score > bestScore) {
            bestScore = score;
            bestTeammate = tm;
          }
        }
      });

      const speedMult = isStun ? 18 : 12 + power * 4;
      if (bestTeammate && (this.settings.smartAssist || bestScore > 50)) {
        const tm = bestTeammate as SimPlayer;
        const dx = tm.x - player.x;
        const dy = tm.y - player.y;
        const dist = Math.hypot(dx, dy);
        this.ball.vx = (dx / dist) * speedMult;
        this.ball.vy = (dy / dist) * speedMult;
        this.ball.vz = 0;
        this.stats.homePassesCompleted++;
      } else {
        this.ball.vx = aimX * speedMult;
        this.ball.vy = aimY * speedMult;
        this.ball.vz = 0;
      }
    } else if (action === 'through') {
      this.stats.homePasses++;
      // Lead the runner into forward space
      const forwardX = player.teamSide === 'home' ? 120 : -120;
      const speedMult = isStun ? 20 : 14 + power * 5;
      this.ball.vx = (aimX * 0.7 + (player.teamSide === 'home' ? 0.5 : -0.5)) * speedMult;
      this.ball.vy = aimY * speedMult;
      this.ball.vz = 0;
      this.stats.homePassesCompleted++;
    } else if (action === 'lofted') {
      // High parabolic cross or clearance
      const speedMult = isStun ? 19 : 13 + power * 6;
      this.ball.vx = aimX * speedMult;
      this.ball.vy = aimY * speedMult;
      this.ball.vz = isStun ? 5.5 + power * 4 : 7.0 + power * 4;
    }

    this.ball.lastTouchPlayer = player;
    this.ball.lastTouchTeam = player.teamSide;
    this.phase = 'active';
  }

  // Main simulation tick (called 60 times per second)
  public update(dt: number) {
    if (this.isReplaying) {
      this.updateReplay();
      return;
    }

    // Match Clock
    if (this.phase === 'active' || this.phase === 'kickoff') {
      this.matchTimeSec += dt;
      // Map half duration to 45 minutes
      const matchHalfProgression = (this.matchTimeSec % this.totalHalfSec) / this.totalHalfSec;
      if (this.matchTimeSec >= this.totalHalfSec && this.currentHalf === 1) {
        this.currentHalf = 2;
        this.phase = 'halftime';
        sound.playWhistle(true);
      } else if (this.matchTimeSec >= this.totalHalfSec * 2 && this.currentHalf === 2) {
        this.phase = 'fulltime';
        sound.playWhistle(true);
      }
      this.matchMinute = this.currentHalf === 1 
        ? Math.floor(matchHalfProgression * 45) 
        : Math.min(90, 45 + Math.floor(matchHalfProgression * 45));
    }

    // Update charging bar
    if (this.isCharging) {
      this.chargeAmount = Math.min(1.0, this.chargeAmount + dt * 1.6);
      const controlled = this.getControlledPlayer();
      if (controlled) {
        controlled.chargeTime = this.chargeAmount;
      }
    }

    // Update Ball Physics
    this.updateBall(dt);

    // Update Players
    this.updatePlayers(dt);

    // Update Particles
    this.updateParticles(dt);

    // Record Replay Buffer (keep 400 frames ~ 6.5s)
    this.recordReplayFrame();

    // Check Goal Condition
    this.checkGoal();
  }

  private updateBall(dt: number) {
    // Wet pitch slows ball less on turf but adds spray
    const friction = this.settings.weather.includes('Rain') ? 0.988 : 0.982;
    const gravity = 18;

    this.ball.x += this.ball.vx * dt * 60;
    this.ball.y += this.ball.vy * dt * 60;
    this.ball.z += this.ball.vz * dt * 60;

    // Apply curve spin
    this.ball.vx += this.ball.spinY * 0.4;
    this.ball.vy += this.ball.spinX * 0.4;

    // Ground friction
    if (this.ball.z <= 0) {
      this.ball.z = 0;
      this.ball.vz = -this.ball.vz * 0.65; // bounce restitution
      if (Math.abs(this.ball.vz) < 0.6) this.ball.vz = 0;
      this.ball.vx *= friction;
      this.ball.vy *= friction;

      // Wet spray when rolling fast
      if (this.settings.weather.includes('Rain') && Math.hypot(this.ball.vx, this.ball.vy) > 6) {
        this.turfParticles.push({
          x: this.ball.x,
          y: this.ball.y,
          vx: (Math.random() - 0.5) * 3,
          vy: (Math.random() - 0.5) * 3,
          life: 15,
          color: '#bae6fd'
        });
      }
    } else {
      // Gravity and air drag
      this.ball.vz -= gravity * dt;
      this.ball.vx *= 0.994;
      this.ball.vy *= 0.994;
    }

    // Ball trail for stunning shots or fast balls
    const speed = Math.hypot(this.ball.vx, this.ball.vy);
    const isStun = (this.ball.lastTouchPlayer?.isStunningAction || speed > 22);
    if (speed > 8) {
      this.ball.trail.push({
        x: this.ball.x,
        y: this.ball.y,
        z: this.ball.z,
        isStun: !!isStun,
        alpha: 1.0
      });
    }

    // Fade trail
    for (let i = this.ball.trail.length - 1; i >= 0; i--) {
      this.ball.trail[i].alpha -= dt * 4.5;
      if (this.ball.trail[i].alpha <= 0) {
        this.ball.trail.splice(i, 1);
      }
    }

    // Pitch boundaries (pitch margins: x: 40..1160, y: 30..770)
    // Goal lines: outside goal mouth bounces or goes out
    if (this.ball.x < 40) {
      if (this.ball.y >= this.goalYMin && this.ball.y <= this.goalYMax && this.ball.z <= this.goalHeight) {
        // Inside left goal!
      } else {
        this.ball.x = 45;
        this.ball.vx = -this.ball.vx * 0.7;
      }
    } else if (this.ball.x > 1160) {
      if (this.ball.y >= this.goalYMin && this.ball.y <= this.goalYMax && this.ball.z <= this.goalHeight) {
        // Inside right goal!
      } else {
        this.ball.x = 1155;
        this.ball.vx = -this.ball.vx * 0.7;
      }
    }

    if (this.ball.y < 30) {
      this.ball.y = 35;
      this.ball.vy = -this.ball.vy * 0.7;
    } else if (this.ball.y > 770) {
      this.ball.y = 765;
      this.ball.vy = -this.ball.vy * 0.7;
    }

    // Post collisions (x: 1160, y: 320 or 480) and (x: 40, y: 320 or 480)
    const checkPost = (px: number, py: number) => {
      if (Math.hypot(this.ball.x - px, this.ball.y - py) < 18 && this.ball.z <= this.goalHeight) {
        sound.playPostHit();
        this.ball.vx = -this.ball.vx * 0.9;
        this.ball.vy = -this.ball.vy * 0.9;
      }
    };
    checkPost(1160, 320);
    checkPost(1160, 480);
    checkPost(40, 320);
    checkPost(40, 480);
  }

  private updatePlayers(dt: number) {
    const controlled = this.getControlledPlayer();

    this.players.forEach(p => {
      // Stamina drain and recovery
      if (p.isSprinting) {
        p.stamina = Math.max(10, p.stamina - p.staminaDrainedRate);
      } else {
        p.stamina = Math.min(p.maxStamina, p.stamina + 0.03);
      }
      const staminaFactor = 0.75 + (p.stamina / 100) * 0.25;

      // Sliding tackle timer
      if (p.isSliding) {
        p.slideTimer--;
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.92;
        p.vy *= 0.92;
        if (p.slideTimer <= 0) {
          p.isSliding = false;
        }

        // Slide tackle contact with ball
        const distToBall = Math.hypot(p.x - this.ball.x, p.y - this.ball.y);
        if (distToBall < 30 && this.ball.z < 25) {
          this.ball.vx = p.vx * 1.5;
          this.ball.vy = p.vy * 1.5;
          this.ball.lastTouchPlayer = p;
          this.ball.lastTouchTeam = p.teamSide;
          sound.playKick(0.5);
        }
        return;
      }

      // USER CONTROLLED PLAYER
      if (p.id === this.controlledPlayerId) {
        p.isMatchUp = this.isMatchUpHeld;
        p.isSprinting = this.isSprintHeld && (this.inputDirection.x !== 0 || this.inputDirection.y !== 0);

        let targetVx = this.inputDirection.x;
        let targetVy = this.inputDirection.y;

        // Finesse vs Sprint vs MatchUp
        let currentMaxSpeed = p.maxSpeed * staminaFactor;
        if (p.isMatchUp) {
          currentMaxSpeed *= 0.65; // crab walk match-up stance
        } else if (p.isSprinting) {
          currentMaxSpeed *= 1.45;
        } else if (p.hasBall) {
          currentMaxSpeed *= 0.92;
        }

        p.vx = targetVx * currentMaxSpeed;
        p.vy = targetVy * currentMaxSpeed;

        if (targetVx !== 0 || targetVy !== 0) {
          p.angle = Math.atan2(targetVy, targetVx);
        }

        p.x += p.vx;
        p.y += p.vy;
      } else {
        // AI / TEAMMATES LOGIC
        this.updateAIPlayer(p, dt, staminaFactor);
      }

      // Pitch boundary bounds
      p.x = Math.max(30, Math.min(1170, p.x));
      p.y = Math.max(30, Math.min(770, p.y));

      // Dribbling ball magnet if player has ball
      if (p.hasBall) {
        this.phase = 'active';
        // Position ball slightly in front of player
        const ballDist = p.isSprinting ? 22 : 14;
        this.ball.x = p.x + Math.cos(p.angle) * ballDist;
        this.ball.y = p.y + Math.sin(p.angle) * ballDist;
        this.ball.z = 0;
        this.ball.vx = p.vx;
        this.ball.vy = p.vy;
        this.ball.lastTouchPlayer = p;
        this.ball.lastTouchTeam = p.teamSide;

        if (p.teamSide === 'home') {
          this.stats.homePossessionSec += dt;
        } else {
          this.stats.awayPossessionSec += dt;
        }
      } else {
        // Collision / Interception detection with loose ball
        const distToBall = Math.hypot(p.x - this.ball.x, p.y - this.ball.y);
        // Match-up expands interception radius significantly!
        const catchRadius = p.isMatchUp ? 38 : (p.isGK ? 45 : 24);

        if (distToBall < catchRadius && this.ball.z < 35 && !this.ball.lastTouchPlayer?.hasBall) {
          // Take possession or touch
          if (p.isGK && (p.x < 180 || p.x > 1020)) {
            // GK catches ball
            p.hasBall = true;
            this.ball.vx = 0;
            this.ball.vy = 0;
            this.ball.vz = 0;
            sound.playKick(0.3);
            if (p.teamSide === 'home') {
              this.controlledPlayerId = p.id;
            }
          } else {
            p.hasBall = true;
            this.ball.vx = 0;
            this.ball.vy = 0;
            if (p.teamSide === 'home') {
              this.controlledPlayerId = p.id;
            }
          }
        }
      }
    });

    // Auto switch user controlled player when user team doesn't have ball and ball moves
    if (controlled && !controlled.hasBall && this.settings.smartAssist) {
      const distFromControlled = Math.hypot(controlled.x - this.ball.x, controlled.y - this.ball.y);
      if (distFromControlled > 350) {
        this.switchControlledToClosest();
      }
    }
  }

  private updateAIPlayer(p: SimPlayer, dt: number, staminaFactor: number) {
    const ballCarrier = this.players.find(pl => pl.hasBall);
    const isTeammateOfBall = ballCarrier && ballCarrier.teamSide === p.teamSide;

    // GOALKEEPER AI
    if (p.isGK) {
      const goalCenterX = p.teamSide === 'home' ? 60 : 1140;
      // Position along goal arc tracking ball Y
      const targetY = Math.max(330, Math.min(470, this.ball.y));
      p.targetX = goalCenterX;
      p.targetY = targetY;

      // GK diving towards approaching fast shot
      const distToBall = Math.hypot(p.x - this.ball.x, p.y - this.ball.y);
      if (distToBall < 120 && Math.hypot(this.ball.vx, this.ball.vy) > 10) {
        p.targetX = this.ball.x;
        p.targetY = this.ball.y;
      }

      const dx = p.targetX - p.x;
      const dy = p.targetY - p.y;
      p.x += Math.sign(dx) * Math.min(Math.abs(dx), 3.2);
      p.y += Math.sign(dy) * Math.min(Math.abs(dy), 3.2);
      p.angle = p.teamSide === 'home' ? 0 : Math.PI;

      // If GK has ball, clearance pass
      if (p.hasBall) {
        setTimeout(() => {
          if (p.hasBall) {
            this.executeAction(p, 'lofted', 0.8, false);
          }
        }, 800);
      }
      return;
    }

    // FIELD PLAYERS AI
    const playstyle = p.teamSide === 'home' ? this.homeTeam.playstyle : this.awayTeam.playstyle;

    if (p.teamSide === 'away') {
      // OPPONENT AI BEHAVIOR
      if (p.hasBall) {
        // AI ball carrier: Attack home goal (x = 40, y = 400)
        p.angle = Math.atan2(400 - p.y, 40 - p.x);
        p.vx = Math.cos(p.angle) * 3.4 * staminaFactor;
        p.vy = Math.sin(p.angle) * 3.4 * staminaFactor;
        p.x += p.vx;
        p.y += p.vy;

        // Shoot if within 280 units of goal
        if (p.x < 320 && Math.abs(p.y - 400) < 180) {
          const isStunning = Math.random() < 0.35;
          this.executeAction(p, 'shot', 0.7 + Math.random() * 0.25, isStunning);
        } else if (Math.random() < 0.02) {
          // AI pass to teammate
          this.executeAction(p, 'pass', 0.5, false);
        }
      } else {
        // AI defending or making attacking runs
        if (isTeammateOfBall) {
          // Support runs forward
          p.targetX = (p.cardData?.pitchX ? (100 - p.cardData.pitchX) / 100 * this.width : 500) - 80;
          p.targetY = p.targetY || 400;
        } else {
          // Press the ball carrier or track back
          const distToBall = Math.hypot(p.x - this.ball.x, p.y - this.ball.y);
          if (distToBall < 200) {
            p.targetX = this.ball.x;
            p.targetY = this.ball.y;
          }
        }

        const dx = p.targetX - p.x;
        const dy = p.targetY - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 5) {
          p.vx = (dx / dist) * Math.min(dist, 3.6 * staminaFactor);
          p.vy = (dy / dist) * Math.min(dist, 3.6 * staminaFactor);
          p.angle = Math.atan2(dy, dx);
          p.x += p.vx;
          p.y += p.vy;
        }
      }
    } else {
      // HOME TEAMMATES AI (Tactical Playstyle driven)
      if (isTeammateOfBall) {
        // Offensive Tactical Positioning
        if (playstyle === 'Quick Counter') {
          // Fast vertical forward runs into space!
          p.targetX = Math.min(1080, p.x + 150);
        } else if (playstyle === 'Possession Game') {
          // Come short for support triangles
          const dx = ballCarrier ? ballCarrier.x - p.x : 0;
          const dy = ballCarrier ? ballCarrier.y - p.y : 0;
          const dist = Math.hypot(dx, dy);
          if (dist > 280) {
            p.targetX = ballCarrier!.x - 120;
          }
        }
      } else {
        // Defensive Positioning: Compactness & Press
        const distToBall = Math.hypot(p.x - this.ball.x, p.y - this.ball.y);
        if (distToBall < 180 && !p.cardData?.instruction?.includes('Defensive')) {
          p.targetX = this.ball.x;
          p.targetY = this.ball.y;
        }
      }

      const dx = p.targetX - p.x;
      const dy = p.targetY - p.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 15) {
        p.vx = (dx / dist) * Math.min(dist, 3.2 * staminaFactor);
        p.vy = (dy / dist) * Math.min(dist, 3.2 * staminaFactor);
        p.angle = Math.atan2(dy, dx);
        p.x += p.vx;
        p.y += p.vy;
      }
    }
  }

  private updateParticles(dt: number) {
    for (let i = this.turfParticles.length - 1; i >= 0; i--) {
      const pt = this.turfParticles[i];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.life--;
      if (pt.life <= 0) {
        this.turfParticles.splice(i, 1);
      }
    }
  }

  private recordReplayFrame() {
    this.replayBuffer.push({
      ball: { x: this.ball.x, y: this.ball.y, z: this.ball.z },
      players: this.players.map(p => ({
        id: p.id,
        x: p.x,
        y: p.y,
        angle: p.angle,
        hasBall: p.hasBall
      }))
    });
    if (this.replayBuffer.length > 400) {
      this.replayBuffer.shift();
    }
  }

  private checkGoal() {
    if (this.phase === 'goal_celebration') return;

    // Away goal line (Home scores on right side x > 1160)
    if (this.ball.x >= 1160 && this.ball.y >= this.goalYMin && this.ball.y <= this.goalYMax && this.ball.z <= this.goalHeight) {
      this.onGoalScored('home');
    }
    // Home goal line (Away scores on left side x <= 40)
    else if (this.ball.x <= 40 && this.ball.y >= this.goalYMin && this.ball.y <= this.goalYMax && this.ball.z <= this.goalHeight) {
      this.onGoalScored('away');
    }
  }

  private onGoalScored(scoringTeam: 'home' | 'away') {
    this.phase = 'goal_celebration';
    sound.playGoal();
    sound.playWhistle(true);

    const scorer = this.ball.lastTouchPlayer || this.getControlledPlayer();
    const isStun = !!scorer?.isStunningAction || (this.ball.trail.length > 0 && this.ball.trail[0].isStun);

    if (scoringTeam === 'home') {
      this.stats.homeScore++;
    } else {
      this.stats.awayScore++;
    }

    this.stats.scorers.push({
      name: scorer ? scorer.name : (scoringTeam === 'home' ? 'Team Home' : 'Team Away'),
      minute: this.matchMinute,
      team: scoringTeam,
      isStunning: isStun
    });

    if (scorer) {
      scorer.celebrating = true;
    }

    // Auto reset kickoff after celebration
    setTimeout(() => {
      this.resetToKickoff(scoringTeam);
    }, 4500);
  }

  public startInstantReplay() {
    if (this.replayBuffer.length < 30) return;
    this.isReplaying = true;
    this.replayFrameIndex = 0;
  }

  public stopInstantReplay() {
    this.isReplaying = false;
  }

  private updateReplay() {
    if (!this.isReplaying) return;
    const frame = this.replayBuffer[this.replayFrameIndex];
    if (frame) {
      this.ball.x = frame.ball.x;
      this.ball.y = frame.ball.y;
      this.ball.z = frame.ball.z;
      frame.players.forEach(fp => {
        const pl = this.players.find(p => p.id === fp.id);
        if (pl) {
          pl.x = fp.x;
          pl.y = fp.y;
          pl.angle = fp.angle;
          pl.hasBall = fp.hasBall;
        }
      });
    }

    this.replayFrameIndex++;
    if (this.replayFrameIndex >= this.replayBuffer.length) {
      this.replayFrameIndex = 0;
    }
  }

  // Substitutions in match
  public makeSubstitution(starterId: string, benchCard: PlayerCard): boolean {
    const starterIdx = this.players.findIndex(p => p.id === starterId && p.teamSide === 'home');
    if (starterIdx === -1) return false;

    const oldStarter = this.players[starterIdx];
    const familiarity = getPositionProficiency(benchCard, benchCard.position);
    const statMult = familiarity === 'Full' ? 1.0 : familiarity === 'Partial' ? 0.90 : 0.80;
    const staminaDrainMult = familiarity === 'Full' ? 1.0 : familiarity === 'Partial' ? 1.25 : 1.50;

    const newPlayer: SimPlayer = {
      id: `home_${benchCard.id}`,
      name: benchCard.name,
      shortName: benchCard.shortName,
      number: benchCard.number,
      position: benchCard.position,
      teamSide: 'home',
      isGK: benchCard.position === 'GK',
      x: oldStarter.x,
      y: oldStarter.y,
      vx: 0,
      vy: 0,
      angle: 0,
      targetX: oldStarter.targetX,
      targetY: oldStarter.targetY,
      speed: 0,
      maxSpeed: ((benchCard.baseStats.speed * statMult) / 100) * 4.4 + 1.2,
      stamina: 100, // Fresh legs!
      maxStamina: 100,
      staminaDrainedRate: 0.05 * staminaDrainMult,
      isSprinting: false,
      isMatchUp: false,
      isSliding: false,
      slideTimer: 0,
      hasBall: false,
      chargingShot: false,
      chargeTime: 0,
      isStunningAction: false,
      actionType: 'none',
      celebrating: false,
      outOfPositionPenalty: familiarity,
      isPlaystyleDeactivated: familiarity !== 'Full',
      cardData: benchCard
    };

    this.players[starterIdx] = newPlayer;
    if (this.controlledPlayerId === starterId) {
      this.controlledPlayerId = newPlayer.id;
    }
    return true;
  }
}
