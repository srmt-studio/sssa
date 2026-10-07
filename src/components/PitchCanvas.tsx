import React, { useEffect, useRef, useState } from 'react';
import { MatchEngine, SimPlayer } from '../engine/MatchEngine';
import { 
  ShaderRenderConfig, 
  DEFAULT_SHADER_CONFIG, 
  calculatePhysiologicalState 
} from '../shaders/ShaderConfigEngine';
import { ShaderStudioModal } from './ShaderStudioModal';
import { Cpu, Activity, Sparkles, Sliders } from 'lucide-react';

interface PitchCanvasProps {
  engine: MatchEngine;
  onCanvasClick?: (x: number, y: number) => void;
}

export const PitchCanvas: React.FC<PitchCanvasProps> = ({ engine, onCanvasClick }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [shaderConfig, setShaderConfig] = useState<ShaderRenderConfig>(DEFAULT_SHADER_CONFIG);
  const [showShaderStudio, setShowShaderStudio] = useState(false);
  const [fps, setFps] = useState(60);

  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();
    let frameCount = 0;
    let fpsLastTime = performance.now();

    const render = (time: number) => {
      const dt = Math.min(0.05, (time - lastTime) / 1000);
      lastTime = time;

      // Track FPS
      frameCount++;
      if (time - fpsLastTime >= 1000) {
        setFps(Math.round((frameCount * 1000) / (time - fpsLastTime)));
        frameCount = 0;
        fpsLastTime = time;
      }

      // Update Engine
      engine.update(dt);

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          drawScene(ctx, engine, canvas.width, canvas.height, shaderConfig, time);
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [engine, shaderConfig]);

  const drawScene = (
    ctx: CanvasRenderingContext2D, 
    eng: MatchEngine, 
    cw: number, 
    ch: number,
    cfg: ShaderRenderConfig,
    now: number
  ) => {
    const scale = cw < 800 ? cw / 1200 : 1.0;

    ctx.save();
    ctx.clearRect(0, 0, cw, ch);

    ctx.scale(scale, scale);

    // 1. Draw Pitch Grass & Patterns
    drawPitch(ctx, eng);

    // 2. Weather Atmosphere Lighting (Day, Night Floodlights, Sunset, Rain)
    drawAtmosphere(ctx, eng);

    // 3. Goal Nets
    drawGoals(ctx, eng);

    // 4. Turf Particles & Skid Marks
    drawParticles(ctx, eng);

    // 5. Draw Players with Next-Gen Shader Pipeline (SSS, Muscle Flex, Cloth Physics)
    eng.players.forEach(p => {
      drawPlayerWithShaders(ctx, p, eng, cfg, now);
    });

    // 6. Draw Ball & Stunning Trails
    drawBall(ctx, eng);

    // 7. Raindrops Overlay
    if (eng.settings.weather.includes('Rain')) {
      drawRain(ctx, cw, ch);
    }

    ctx.restore();
  };

  const drawPitch = (ctx: CanvasRenderingContext2D, eng: MatchEngine) => {
    const w = eng.width;
    const h = eng.height;
    const numStripes = 15;
    const stripeWidth = w / numStripes;

    const isRain = eng.settings.weather.includes('Rain');
    const isNight = eng.settings.weather.includes('Night');

    for (let i = 0; i < numStripes; i++) {
      let color1 = '#1c4a25';
      let color2 = '#23572d';
      if (isNight) {
        color1 = '#13351a';
        color2 = '#194220';
      } else if (isRain) {
        color1 = '#163f23';
        color2 = '#1a4c2a';
      }
      ctx.fillStyle = i % 2 === 0 ? color1 : color2;
      ctx.fillRect(i * stripeWidth, 0, stripeWidth, h);
    }

    // Pitch Lines & Markings
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.lineWidth = 2.5;

    // Outer boundary
    ctx.strokeRect(40, 40, w - 80, h - 80);

    // Halfway line
    ctx.beginPath();
    ctx.moveTo(w / 2, 40);
    ctx.lineTo(w / 2, h - 40);
    ctx.stroke();

    // Center circle & spot
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 85, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Penalty Areas (Left & Right)
    const penW = 160;
    const penH = 340;
    const penY = (h - penH) / 2;
    ctx.strokeRect(40, penY, penW, penH);
    ctx.strokeRect(w - 40 - penW, penY, penW, penH);

    // 6-yard Goal Areas
    const gBoxW = 60;
    const gBoxH = 170;
    const gBoxY = (h - gBoxH) / 2;
    ctx.strokeRect(40, gBoxY, gBoxW, gBoxH);
    ctx.strokeRect(w - 40 - gBoxW, gBoxY, gBoxW, gBoxH);

    // Penalty spots
    ctx.beginPath();
    ctx.arc(40 + 115, h / 2, 3.5, 0, Math.PI * 2);
    ctx.arc(w - 40 - 115, h / 2, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Corner arcs
    const cornerR = 18;
    ctx.beginPath();
    ctx.arc(40, 40, cornerR, 0, Math.PI * 0.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(40, h - 40, cornerR, Math.PI * 1.5, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(w - 40, 40, cornerR, Math.PI * 0.5, Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(w - 40, h - 40, cornerR, Math.PI, Math.PI * 1.5);
    ctx.stroke();
  };

  const drawAtmosphere = (ctx: CanvasRenderingContext2D, eng: MatchEngine) => {
    const w = eng.width;
    const h = eng.height;

    if (eng.settings.weather.includes('Night')) {
      // 4 Powerful Floodlights Casting Radiance & Specular Sheen
      const lightGrad = ctx.createRadialGradient(w / 2, h / 2, 100, w / 2, h / 2, 700);
      lightGrad.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
      lightGrad.addColorStop(0.7, 'rgba(20, 45, 80, 0.25)');
      lightGrad.addColorStop(1, 'rgba(2, 6, 23, 0.45)');
      ctx.fillStyle = lightGrad;
      ctx.fillRect(0, 0, w, h);

      // Corner Floodlight Beams
      const corners = [
        { x: 0, y: 0 }, { x: w, y: 0 }, { x: 0, y: h }, { x: w, y: h }
      ];
      corners.forEach(c => {
        const beam = ctx.createRadialGradient(c.x, c.y, 10, c.x, c.y, 350);
        beam.addColorStop(0, 'rgba(255, 255, 220, 0.12)');
        beam.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = beam;
        ctx.fillRect(0, 0, w, h);
      });
    } else if (eng.settings.weather.includes('Sunset')) {
      const sunset = ctx.createLinearGradient(0, 0, w, h);
      sunset.addColorStop(0, 'rgba(249, 115, 22, 0.14)');
      sunset.addColorStop(0.5, 'rgba(217, 70, 239, 0.08)');
      sunset.addColorStop(1, 'rgba(30, 58, 138, 0.18)');
      ctx.fillStyle = sunset;
      ctx.fillRect(0, 0, w, h);
    } else if (eng.settings.weather.includes('Rain')) {
      ctx.fillStyle = 'rgba(10, 30, 50, 0.20)';
      ctx.fillRect(0, 0, w, h);
    }
  };

  const drawGoals = (ctx: CanvasRenderingContext2D, eng: MatchEngine) => {
    const h = eng.height;
    const w = eng.width;
    const gTop = eng.goalYMin;
    const gBottom = eng.goalYMax;
    const netDepth = 35;

    // Left Goal
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(40 - netDepth, gTop, netDepth, gBottom - gTop);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.strokeRect(40 - netDepth, gTop, netDepth, gBottom - gTop);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(38, gTop - 4, 6, 8);
    ctx.fillRect(38, gBottom - 4, 6, 8);

    // Right Goal
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(w - 40, gTop, netDepth, gBottom - gTop);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.strokeRect(w - 40, gTop, netDepth, gBottom - gTop);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(w - 44, gTop - 4, 6, 8);
    ctx.fillRect(w - 44, gBottom - 4, 6, 8);
  };

  const drawParticles = (ctx: CanvasRenderingContext2D, eng: MatchEngine) => {
    eng.turfParticles.forEach(pt => {
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 2.5 * (pt.life / 25), 0, Math.PI * 2);
      ctx.fill();
    });
  };

  /**
   * HIGH-FIDELITY PLAYER RENDERING:
   * 1. Multi-Floodlight Contact Shadows (Boot-to-Turf Interface)
   * 2. Muscle & Skeletal Tension Deformation (Deltoid, Quad, and Bicep Expansion)
   * 3. Micro-Skin Subsurface Scattering (SSS) & Dynamic Perspiration/Sweat Accumulation
   * 4. Kit & Fabric Cloth Physics (Aerodynamic Wrinkles & Polyester Anisotropic Sheen)
   */
  const drawPlayerWithShaders = (
    ctx: CanvasRenderingContext2D, 
    p: SimPlayer, 
    eng: MatchEngine,
    cfg: ShaderRenderConfig,
    now: number
  ) => {
    const isControlled = p.id === eng.controlledPlayerId;
    const isRain = eng.settings.weather.includes('Rain');
    const isNight = eng.settings.weather.includes('Night');

    // Calculate Real-Time Physiological & Cloth State
    const phys = calculatePhysiologicalState({
      stamina: p.stamina,
      isSprinting: p.isSprinting,
      isMatchUp: p.isMatchUp,
      isStunningAction: p.isStunningAction,
      matchElapsedSec: eng.matchTimeSec,
      isRain
    });

    const primaryColor = p.teamSide === 'home' ? eng.homeTeam.primaryColor : eng.awayTeam.primaryColor;
    const secondaryColor = p.teamSide === 'home' ? eng.homeTeam.secondaryColor : eng.awayTeam.secondaryColor;

    // Dynamic Muscle Tension scaling factor
    const muscleFlex = 1.0 + (phys.muscleTension * 0.22 * cfg.muscleFlexIntensity);
    const baseR = p.isGK ? 15 : 13;
    const r = baseR * muscleFlex;

    // -------------------------------------------------------------
    // SPEC 4: SHARP RAY-TRACED CONTACT SHADOWS & TURF AO
    // -------------------------------------------------------------
    ctx.save();
    // Multi-directional contact shadow beneath feet
    const shadowOffsetX = Math.cos(p.angle) * -3;
    const shadowOffsetY = 6 * cfg.floodlightShadowSharpness;
    const shadowGrad = ctx.createRadialGradient(
      p.x + shadowOffsetX, p.y + shadowOffsetY, 2,
      p.x + shadowOffsetX, p.y + shadowOffsetY, r * 1.35
    );
    shadowGrad.addColorStop(0, `rgba(5, 10, 15, ${0.75 * cfg.contactAmbientOcclusion})`);
    shadowGrad.addColorStop(0.4, `rgba(10, 20, 25, ${0.45 * cfg.contactAmbientOcclusion})`);
    shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = shadowGrad;
    ctx.beginPath();
    ctx.ellipse(p.x + shadowOffsetX, p.y + shadowOffsetY, r * 1.4, r * 0.75, 0, 0, Math.PI * 2);
    ctx.fill();

    // Secondary directional floodlight soft shadow
    if (isNight) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
      ctx.beginPath();
      ctx.ellipse(p.x - 5, p.y + 7, r * 1.2, r * 0.5, -0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // -------------------------------------------------------------
    // BODY & KIT ORIENTATION
    // -------------------------------------------------------------
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);

    // Defensive Match-Up Stance Aura
    if (p.isMatchUp) {
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(0, 0, r + 5, -Math.PI * 0.75, Math.PI * 0.75);
      ctx.stroke();

      // Shielding shockwave arc
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, r + 9, -Math.PI * 0.7, Math.PI * 0.7);
      ctx.stroke();
    }

    // -------------------------------------------------------------
    // SPEC 2: MUSCULAR SKELETAL SHOULDERS & DELTOIDS (FIBER CONTRACTION)
    // -------------------------------------------------------------
    // Left & Right Deltoids expanding outwards under sprint/shielding
    const deltoidW = 8 * muscleFlex;
    const deltoidH = 11 * muscleFlex;
    
    // Skin Tone with Subsurface Scattering Warmth
    const sssSkinTone = p.teamSide === 'home' ? '#f5cfb3' : '#d8a47f';
    const sssUnderTone = '#e28766'; // Subdermal red-shifted hemoglobin

    // Left Arm / Deltoid
    ctx.fillStyle = sssSkinTone;
    ctx.beginPath();
    ctx.ellipse(-2, -r + 2, deltoidW * 0.6, deltoidH * 0.55, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Right Arm / Deltoid
    ctx.beginPath();
    ctx.ellipse(-2, r - 2, deltoidW * 0.6, deltoidH * 0.55, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Muscular striation normal highlights when strain is high
    if (phys.muscleTension > 0.6) {
      ctx.strokeStyle = sssUnderTone;
      ctx.lineWidth = 1.0 * cfg.normalTensionBias;
      ctx.beginPath();
      ctx.moveTo(-1, -r + 1);
      ctx.lineTo(2, -r + 3);
      ctx.moveTo(-1, r - 1);
      ctx.lineTo(2, r - 3);
      ctx.stroke();
    }

    // -------------------------------------------------------------
    // SPEC 3: KIT FABRIC CLOTH PHYSICS & WRINKLES (AERODYNAMIC RIPPLES)
    // -------------------------------------------------------------
    // Torso Kit Geometry
    const kitWidth = r * 1.05;
    const kitHeight = r * 0.85;

    // Base Jersey Color with Anisotropic Sheen Gradient
    const jerseyGrad = ctx.createLinearGradient(-kitWidth, 0, kitWidth, 0);
    jerseyGrad.addColorStop(0, primaryColor);
    jerseyGrad.addColorStop(0.5, p.isGK ? '#facc15' : primaryColor);
    jerseyGrad.addColorStop(1, p.isGK ? '#ca8a04' : primaryColor);

    ctx.fillStyle = p.isGK ? '#eab308' : jerseyGrad;
    ctx.beginPath();
    ctx.roundRect(-kitWidth * 0.85, -kitHeight, kitWidth * 1.6, kitHeight * 2, 7);
    ctx.fill();

    // Wet Fabric Cling Patches (Darker saturated sweat zones on back & chest)
    if (phys.isWetCling) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
      ctx.beginPath();
      ctx.ellipse(-2, 0, kitWidth * 0.5, kitHeight * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Dynamic Cloth Wrinkles (Reacting to velocity drag & movement)
    const velocitySpeed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
    if (velocitySpeed > 0.5 || phys.muscleTension > 0.5) {
      const flutterPhase = Math.sin(now * 0.012 + p.x * 0.05) * 1.5 * cfg.aerodynamicDragWrinkles;
      ctx.strokeStyle = secondaryColor;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      // Lateral kit tension folds
      ctx.moveTo(-kitWidth * 0.6, -kitHeight * 0.4 + flutterPhase);
      ctx.quadraticCurveTo(0, -kitHeight * 0.2, kitWidth * 0.4, -kitHeight * 0.5);
      ctx.moveTo(-kitWidth * 0.6, kitHeight * 0.4 - flutterPhase);
      ctx.quadraticCurveTo(0, kitHeight * 0.2, kitWidth * 0.4, kitHeight * 0.5);
      ctx.stroke();
    }

    // Kit Trim & Collar Accent
    ctx.strokeStyle = secondaryColor;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(0, 0, kitWidth * 0.82, -Math.PI * 0.6, Math.PI * 0.6);
    ctx.stroke();

    // Team Crest Badge on Chest
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(kitWidth * 0.35, -kitHeight * 0.35, 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Jersey Player Number on Back
    ctx.font = 'bold 8px "Chakra Petch", sans-serif';
    ctx.fillStyle = secondaryColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${p.number}`, -kitWidth * 0.25, 0);

    // -------------------------------------------------------------
    // SPEC 1: MICRO-SKIN SUBSURFACE SCATTERING & DYNAMIC SWEAT ACCUMULATION
    // -------------------------------------------------------------
    // Anatomical Head Profile
    const headX = r * 0.55;
    const headR = 5.2;

    // Subsurface Scattering Hemoglobin Rim
    ctx.fillStyle = sssUnderTone;
    ctx.beginPath();
    ctx.arc(headX - 0.5, 0, headR + 1.2 * cfg.sssScatteringRadius, 0, Math.PI * 2);
    ctx.fill();

    // Epidermal Skin Surface
    ctx.fillStyle = sssSkinTone;
    ctx.beginPath();
    ctx.arc(headX, 0, headR, 0, Math.PI * 2);
    ctx.fill();

    // Hairline / Cap
    ctx.fillStyle = p.number % 2 === 0 ? '#1e293b' : '#334155';
    ctx.beginPath();
    ctx.arc(headX - 1.2, 0, headR * 0.85, Math.PI * 0.6, Math.PI * 1.4);
    ctx.fill();

    // Facial Directional Gaze
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(headX + 2.8, -1.5, 1.0, 0, Math.PI * 2);
    ctx.arc(headX + 2.8, 1.5, 1.0, 0, Math.PI * 2);
    ctx.fill();

    // Dynamic Facial Sweat Droplets & Specular Gloss (Accumulates with fatigue & time)
    if (phys.sweatLevel > 0.3) {
      // High-Gloss Specular Sweat Sheen on Forehead and Temples
      const sweatSpecular = Math.min(1.0, phys.sweatLevel * cfg.sweatAccumulationMultiplier);
      ctx.fillStyle = `rgba(255, 255, 255, ${0.75 * sweatSpecular})`;
      ctx.beginPath();
      // Forehead droplet
      ctx.arc(headX + 2.0, -1.0, 1.2, 0, Math.PI * 2);
      // Temple sweat droplet
      ctx.arc(headX + 0.8, -3.2, 1.0, 0, Math.PI * 2);
      ctx.arc(headX + 0.8, 3.2, 1.0, 0, Math.PI * 2);
      // Shoulder sweat highlight
      ctx.arc(0, -r + 1.5, 1.4, 0, Math.PI * 2);
      ctx.arc(0, r - 1.5, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // -------------------------------------------------------------
    // OVERHEAD UI: Controlled Arrow & Stamina
    // -------------------------------------------------------------
    if (isControlled) {
      const cursorY = p.y - 30;
      ctx.fillStyle = '#d4ff00'; // Volt Neon
      ctx.beginPath();
      ctx.moveTo(p.x, cursorY);
      ctx.lineTo(p.x - 7, cursorY - 11);
      ctx.lineTo(p.x + 7, cursorY - 11);
      ctx.closePath();
      ctx.fill();

      // Mini Stamina Meter with Dynamic Color
      const barW = 34;
      const barH = 4;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(p.x - barW / 2, cursorY - 18, barW, barH);
      const staminaColor = p.stamina > 50 ? '#22c55e' : p.stamina > 25 ? '#eab308' : '#ef4444';
      ctx.fillStyle = staminaColor;
      ctx.fillRect(p.x - barW / 2, cursorY - 18, (p.stamina / 100) * barW, barH);
    }

    // Power Charging Bar (Yellow Normal / Electric Purple-Magenta for Stunning)
    if (p.chargingShot) {
      const barW = 44;
      const barH = 6;
      const barY = p.y - 44;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(p.x - barW / 2 - 1, barY - 1, barW + 2, barH + 2);

      if (p.isStunningAction) {
        const stunGrad = ctx.createLinearGradient(p.x - barW / 2, barY, p.x + barW / 2, barY);
        stunGrad.addColorStop(0, '#8b5cf6');
        stunGrad.addColorStop(1, '#ec4899');
        ctx.fillStyle = stunGrad;
      } else {
        ctx.fillStyle = '#eab308';
      }
      ctx.fillRect(p.x - barW / 2, barY, p.chargeTime * barW, barH);

      ctx.font = 'bold 9px "Chakra Petch", sans-serif';
      ctx.fillStyle = p.isStunningAction ? '#f472b6' : '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(p.isStunningAction ? 'STUNNING' : 'POWER', p.x, barY - 3);
    }

    // Goal Celebration
    if (p.celebrating) {
      ctx.font = 'bold 13px "Teko", sans-serif';
      ctx.fillStyle = '#facc15';
      ctx.textAlign = 'center';
      ctx.fillText('⚽ GOAL!', p.x, p.y - 34);
    }
  };

  const drawBall = (ctx: CanvasRenderingContext2D, eng: MatchEngine) => {
    const b = eng.ball;

    // 1. Ball Trail (Stunning shots leave radiant neon purple ribbons!)
    if (b.trail.length > 1) {
      for (let i = 0; i < b.trail.length - 1; i++) {
        const t1 = b.trail[i];
        const t2 = b.trail[i + 1];
        ctx.beginPath();
        ctx.moveTo(t1.x, t1.y - t1.z);
        ctx.lineTo(t2.x, t2.y - t2.z);

        if (t1.isStun) {
          ctx.strokeStyle = `rgba(236, 72, 153, ${t1.alpha * 0.8})`;
          ctx.lineWidth = 5 * t1.alpha;
        } else {
          ctx.strokeStyle = `rgba(255, 255, 255, ${t1.alpha * 0.4})`;
          ctx.lineWidth = 3 * t1.alpha;
        }
        ctx.stroke();
      }
    }

    // 2. Ball Shadow on ground with height scaling
    const shadowScale = Math.max(0.3, 1 - b.z / 120);
    ctx.fillStyle = `rgba(0, 0, 0, ${0.45 * shadowScale})`;
    ctx.beginPath();
    ctx.ellipse(b.x, b.y + 2, 7 * shadowScale, 4 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();

    // 3. Ball Body
    const renderY = b.y - b.z;
    const ballR = 6.5;

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(b.x, renderY, ballR, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(b.x, renderY, ballR, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(b.x, renderY, 2.2, 0, Math.PI * 2);
    ctx.fill();

    if (b.z > 20) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(b.x, renderY);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  };

  const drawRain = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.strokeStyle = 'rgba(200, 230, 255, 0.28)';
    ctx.lineWidth = 1.2;
    const count = 75;
    const t = performance.now() * 0.003;
    for (let i = 0; i < count; i++) {
      const rx = (Math.sin(i * 99 + t * 4) * 0.5 + 0.5) * w;
      const ry = ((i * 19 + t * 700) % h);
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx - 4, ry + 16);
      ctx.stroke();
    }
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-slate-950 select-none overflow-hidden touch-none">
      {/* 60 FPS & Shaders Engine Toggle Widget */}
      <div className="absolute top-3 left-4 z-30 flex items-center gap-2">
        <button
          onClick={() => setShowShaderStudio(true)}
          className="px-3 py-1.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-white text-xs font-bold flex items-center gap-2 shadow-xl backdrop-blur-md transition-all active:scale-95 group"
          title="Open Shaders, SSS Skin, Sweat & Fabric Physics Studio"
        >
          <Cpu className="w-3.5 h-3.5 text-cyan-400 group-hover:rotate-45 transition-transform" />
          <span className="hidden sm:inline">Shaders & Physics Studio</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-black bg-emerald-950 text-emerald-400 border border-emerald-800">
            {fps} FPS
          </span>
        </button>
      </div>

      <canvas
        ref={canvasRef}
        width={1200}
        height={800}
        onClick={(e) => {
          if (!onCanvasClick || !canvasRef.current) return;
          const rect = canvasRef.current.getBoundingClientRect();
          const scaleX = 1200 / rect.width;
          const scaleY = 800 / rect.height;
          onCanvasClick((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY);
        }}
        className="w-full h-auto max-h-[88vh] object-contain shadow-2xl rounded-sm cursor-crosshair border border-slate-800"
      />

      {/* Interactive Shader Configuration Studio Modal */}
      {showShaderStudio && (
        <ShaderStudioModal
          config={shaderConfig}
          onUpdateConfig={setShaderConfig}
          onClose={() => setShowShaderStudio(false)}
          currentFps={fps}
        />
      )}
    </div>
  );
};
