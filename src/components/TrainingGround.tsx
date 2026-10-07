import React, { useState, useEffect, useRef } from 'react';
import { PlayerCard as IPlayerCard } from '../types/game';
import { Target, Zap, RotateCcw, ArrowRight, Sparkles } from 'lucide-react';
import { sound } from '../services/soundService';

interface TrainingGroundProps {
  player: IPlayerCard;
}

export const TrainingGround: React.FC<TrainingGroundProps> = ({ player }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [drill, setDrill] = useState<'free_kick' | 'stunning_shots' | 'penalty'>('free_kick');
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [feedback, setFeedback] = useState<string>("Aim with mouse/touch and click to shoot!");
  const [isCharging, setIsCharging] = useState(false);
  const [chargePower, setChargePower] = useState(0);

  // Free kick physics state
  const targetX = useRef(200);
  const targetY = useRef(140);
  const ballPos = useRef({ x: 300, y: 340, vx: 0, vy: 0, z: 0, vz: 0, active: false });
  const gkPos = useRef({ x: 300, y: 150, vx: 1.5 });

  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      // 1. Clear
      ctx.clearRect(0, 0, 600, 400);

      // 2. Pitch grass
      ctx.fillStyle = '#1e4620';
      ctx.fillRect(0, 0, 600, 400);

      // Penalty box lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 3;
      ctx.strokeRect(100, 60, 400, 200);

      // Goal post (width 240, height 90 at top y = 60)
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 6;
      ctx.strokeRect(180, 60, 240, 80);

      // Net pattern
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fillRect(180, 60, 240, 80);

      // 3. Targets in top bins
      if (drill === 'stunning_shots' || drill === 'free_kick') {
        // Top right bin
        ctx.fillStyle = 'rgba(239, 68, 68, 0.7)';
        ctx.beginPath();
        ctx.arc(395, 80, 20, 0, Math.PI * 2);
        ctx.fill();
        // Top left bin
        ctx.fillStyle = 'rgba(59, 130, 246, 0.7)';
        ctx.beginPath();
        ctx.arc(205, 80, 20, 0, Math.PI * 2);
        ctx.fill();
      }

      // 4. Defensive Wall (3 dummies) for free kicks
      if (drill === 'free_kick') {
        ctx.fillStyle = '#0f172a';
        for (let i = 0; i < 3; i++) {
          const wx = 260 + i * 26;
          ctx.fillRect(wx, 210, 20, 40);
          ctx.beginPath();
          ctx.arc(wx + 10, 200, 8, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 5. Goalkeeper AI
      gkPos.current.x += gkPos.current.vx;
      if (gkPos.current.x < 220 || gkPos.current.x > 380) {
        gkPos.current.vx *= -1;
      }
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.arc(gkPos.current.x, 115, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText('GK', gkPos.current.x - 7, 119);

      // 6. Ball motion
      const b = ballPos.current;
      if (b.active) {
        b.x += b.vx;
        b.y += b.vy;
        b.z += b.vz;
        b.vz -= 0.15; // gravity

        // Check goal contact
        if (b.y <= 110) {
          b.active = false;
          // Check if scored in goal bounds: x in 185..415 and z < 75
          if (b.x >= 185 && b.x <= 415) {
            // Check if saved by keeper
            if (Math.abs(b.x - gkPos.current.x) < 25) {
              setFeedback("🧤 SAVED by the Goalkeeper!");
              sound.playPostHit();
            } else {
              setScore(s => s + 1);
              setFeedback("⚽ INCREDIBLE TOP BINS GOAL!");
              sound.playGoal();
            }
          } else {
            setFeedback("❌ Off Target!");
          }
        }
      }

      // Draw Ball
      const renderY = b.y - Math.max(0, b.z);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(b.x, renderY, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [drill]);

  const handleShoot = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (ballPos.current.active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 600;
    const clickY = ((e.clientY - rect.top) / rect.height) * 400;

    setAttempts(a => a + 1);

    // Aim calculation
    const dx = clickX - 300;
    const dy = clickY - 340;
    const dist = Math.hypot(dx, dy);

    ballPos.current.x = 300;
    ballPos.current.y = 340;
    ballPos.current.z = 0;

    const speed = drill === 'stunning_shots' ? 14 : 11;
    ballPos.current.vx = (dx / dist) * speed;
    ballPos.current.vy = (dy / dist) * speed;
    ballPos.current.vz = drill === 'stunning_shots' ? 3.5 : 4.5;
    ballPos.current.active = true;

    if (drill === 'stunning_shots') {
      sound.playStunningShot();
    } else {
      sound.playKick(0.7);
    }
  };

  const handleReset = () => {
    ballPos.current = { x: 300, y: 340, vx: 0, vy: 0, z: 0, vz: 0, active: false };
    setFeedback("Aim at goal and click to shoot!");
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 flex flex-col gap-5 select-none">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-volt text-xs font-black uppercase tracking-wider">
            <Target className="w-4 h-4" /> Training Ground & Skills Arena
          </div>
          <h2 className="text-xl font-black text-white mt-1 uppercase tracking-wider">
            Practice Drills with {player.shortName}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Master stunning shot windup timing, free-kick trajectory curving, and penalty shootouts.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-slate-950 px-4 py-2 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Goals:</span>
            <div className="text-lg font-mono font-black text-volt">{score} / {attempts}</div>
          </div>
        </div>
      </div>

      {/* Drill Selector Tabs */}
      <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl w-fit">
        <button
          onClick={() => { setDrill('free_kick'); handleReset(); }}
          className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-colors ${
            drill === 'free_kick' ? 'bg-volt text-slate-950' : 'text-slate-400 hover:text-white'
          }`}
        >
          Free Kick Curler
        </button>
        <button
          onClick={() => { setDrill('stunning_shots'); handleReset(); }}
          className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-colors ${
            drill === 'stunning_shots' ? 'bg-fuchsia-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 inline mr-1" /> Stunning Shot Practice
        </button>
        <button
          onClick={() => { setDrill('penalty'); handleReset(); }}
          className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-colors ${
            drill === 'penalty' ? 'bg-volt text-slate-950' : 'text-slate-400 hover:text-white'
          }`}
        >
          Penalty Shootout
        </button>
      </div>

      {/* Canvas Practice Arena */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 flex flex-col items-center gap-3 shadow-2xl">
        <div className="text-xs font-bold text-slate-300 py-1 bg-slate-950 px-4 rounded-full border border-slate-800">
          {feedback}
        </div>

        <div className="relative w-full max-w-2xl aspect-[3/2] rounded-2xl overflow-hidden border-2 border-slate-700">
          <canvas
            ref={canvasRef}
            width={600}
            height={400}
            onClick={handleShoot}
            className="w-full h-full cursor-crosshair"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Ball
          </button>
        </div>
      </div>
    </div>
  );
};
