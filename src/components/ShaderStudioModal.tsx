import React, { useState } from 'react';
import { 
  ShaderRenderConfig, 
  DEFAULT_SHADER_CONFIG, 
  GLSL_VERTEX_SHADER_SOURCE, 
  GLSL_FRAGMENT_SHADER_SOURCE 
} from '../shaders/ShaderConfigEngine';
import { 
  Sparkles, Sliders, Zap, Shield, Eye, X, Activity, 
  Layers, Droplets, Sun, CheckCircle2, RotateCcw, Cpu, Code
} from 'lucide-react';
import { sound } from '../services/soundService';

interface ShaderStudioModalProps {
  config: ShaderRenderConfig;
  onUpdateConfig: (newConfig: ShaderRenderConfig) => void;
  onClose: () => void;
  currentFps?: number;
}

export const ShaderStudioModal: React.FC<ShaderStudioModalProps> = ({
  config,
  onUpdateConfig,
  onClose,
  currentFps = 60
}) => {
  const [activeTab, setActiveTab] = useState<'controls' | 'glsl_vertex' | 'glsl_fragment'>('controls');

  const handleSliderChange = (key: keyof ShaderRenderConfig, value: number) => {
    onUpdateConfig({
      ...config,
      [key]: value
    });
  };

  const handleResetToOptimal = () => {
    sound.playClick();
    onUpdateConfig(DEFAULT_SHADER_CONFIG);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 select-none">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 font-black text-sm shadow">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wider">
                  Unreal Player Shaders & Fabric Physics Engine
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1">
                  <Activity className="w-3 h-3 animate-pulse" />
                  <span>{currentFps} FPS LOCKED</span>
                </span>
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                Micro-Skin SSS · Facial Perspiration · Skeletal Tension · Cloth Aerodynamics · Contact Shadows
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

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-950 px-5 pt-3 border-b border-slate-800 gap-2">
          <button
            onClick={() => setActiveTab('controls')}
            className={`pb-2.5 px-3 text-xs font-black uppercase tracking-wider transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'controls'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Interactive Shader Parameters</span>
          </button>

          <button
            onClick={() => setActiveTab('glsl_vertex')}
            className={`pb-2.5 px-3 text-xs font-black uppercase tracking-wider transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'glsl_vertex'
                ? 'border-volt text-volt'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>GLSL Vertex Shader (Tension & Cloth)</span>
          </button>

          <button
            onClick={() => setActiveTab('glsl_fragment')}
            className={`pb-2.5 px-3 text-xs font-black uppercase tracking-wider transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'glsl_fragment'
                ? 'border-fuchsia-400 text-fuchsia-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>GLSL Fragment Shader (SSS & Sweat)</span>
          </button>
        </div>

        {/* Tab 1: Interactive Parameters */}
        {activeTab === 'controls' && (
          <div className="p-5 overflow-y-auto space-y-5 flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Group 1: Micro-Skin & SSS Texturing */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-xs font-black text-amber-300 uppercase tracking-wider border-b border-slate-850 pb-2">
                  <Droplets className="w-4 h-4 text-amber-400" />
                  <span>1. Micro-Skin & Perspiration Accumulation</span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div>
                    <div className="flex justify-between text-slate-300">
                      <span>Subsurface Scattering Radius (SSS)</span>
                      <span className="font-mono text-amber-400 font-bold">{config.sssScatteringRadius.toFixed(2)} mm</span>
                    </div>
                    <input
                      type="range"
                      min="0.2"
                      max="2.5"
                      step="0.05"
                      value={config.sssScatteringRadius}
                      onChange={(e) => handleSliderChange('sssScatteringRadius', parseFloat(e.target.value))}
                      className="w-full accent-amber-400 mt-1 cursor-pointer"
                    />
                    <span className="text-[10px] text-slate-500">Controls subdermal red-shift irradiance across the shadow terminator.</span>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-300">
                      <span>Dynamic Sweat Accumulation Rate</span>
                      <span className="font-mono text-cyan-400 font-bold">{config.sweatAccumulationMultiplier.toFixed(2)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="3.0"
                      step="0.1"
                      value={config.sweatAccumulationMultiplier}
                      onChange={(e) => handleSliderChange('sweatAccumulationMultiplier', parseFloat(e.target.value))}
                      className="w-full accent-cyan-400 mt-1 cursor-pointer"
                    />
                    <span className="text-[10px] text-slate-500">Sweat accumulation intensity as match minutes progress and stamina depletes.</span>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-300">
                      <span>Sweat Droplet Specular Reflectivity</span>
                      <span className="font-mono text-volt font-bold">{(config.sweatDropletReflectivity * 100).toFixed(0)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.04"
                      max="0.20"
                      step="0.01"
                      value={config.sweatDropletReflectivity}
                      onChange={(e) => handleSliderChange('sweatDropletReflectivity', parseFloat(e.target.value))}
                      className="w-full accent-volt mt-1 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Group 2: Muscle & Physique Skeletal Tension */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-xs font-black text-cyan-300 uppercase tracking-wider border-b border-slate-850 pb-2">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  <span>2. Muscle & Skeletal Tension Deformation</span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div>
                    <div className="flex justify-between text-slate-300">
                      <span>Muscle Flex Contraction Intensity</span>
                      <span className="font-mono text-cyan-400 font-bold">{config.muscleFlexIntensity.toFixed(2)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.0"
                      max="2.0"
                      step="0.05"
                      value={config.muscleFlexIntensity}
                      onChange={(e) => handleSliderChange('muscleFlexIntensity', parseFloat(e.target.value))}
                      className="w-full accent-cyan-400 mt-1 cursor-pointer"
                    />
                    <span className="text-[10px] text-slate-500">Expands deltoid, bicep, and quad mesh volume under sprint and tight shielding.</span>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-300">
                      <span>Normal Tension Bias (Fiber Striations)</span>
                      <span className="font-mono text-fuchsia-400 font-bold">{config.normalTensionBias.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={config.normalTensionBias}
                      onChange={(e) => handleSliderChange('normalTensionBias', parseFloat(e.target.value))}
                      className="w-full accent-fuchsia-400 mt-1 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-300">
                      <span>Vascularity & Vein Prominence</span>
                      <span className="font-mono text-volt font-bold">{config.vascularityEmphasis.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.0"
                      max="1.0"
                      step="0.05"
                      value={config.vascularityEmphasis}
                      onChange={(e) => handleSliderChange('vascularityEmphasis', parseFloat(e.target.value))}
                      className="w-full accent-volt mt-1 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Group 3: Kit and Fabric Cloth Physics */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-xs font-black text-fuchsia-300 uppercase tracking-wider border-b border-slate-850 pb-2">
                  <Layers className="w-4 h-4 text-fuchsia-400" />
                  <span>3. Kit Fabric & Cloth Simulation Physics</span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div>
                    <div className="flex justify-between text-slate-300">
                      <span>Aerodynamic Wind Wrinkle Drag</span>
                      <span className="font-mono text-fuchsia-400 font-bold">{config.aerodynamicDragWrinkles.toFixed(2)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.2"
                      max="2.0"
                      step="0.05"
                      value={config.aerodynamicDragWrinkles}
                      onChange={(e) => handleSliderChange('aerodynamicDragWrinkles', parseFloat(e.target.value))}
                      className="w-full accent-fuchsia-400 mt-1 cursor-pointer"
                    />
                    <span className="text-[10px] text-slate-500">Simulates real-time cloth ripples opposing player movement velocity.</span>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-300">
                      <span>Fabric Polyester Sheen (Anisotropy)</span>
                      <span className="font-mono text-cyan-400 font-bold">{config.fabricAnisotropy.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={config.fabricAnisotropy}
                      onChange={(e) => handleSliderChange('fabricAnisotropy', parseFloat(e.target.value))}
                      className="w-full accent-cyan-400 mt-1 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-300">
                      <span>Wet Sweat / Rain Fabric Cling</span>
                      <span className="font-mono text-amber-400 font-bold">{config.wetFabricClingFactor.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={config.wetFabricClingFactor}
                      onChange={(e) => handleSliderChange('wetFabricClingFactor', parseFloat(e.target.value))}
                      className="w-full accent-amber-400 mt-1 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Group 4: Dynamic Lighting & Contact Shadows */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-xs font-black text-emerald-300 uppercase tracking-wider border-b border-slate-850 pb-2">
                  <Sun className="w-4 h-4 text-emerald-400" />
                  <span>4. Dynamic Stadium Lighting & 60 FPS Ray-Tracing</span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div>
                    <div className="flex justify-between text-slate-300">
                      <span>Floodlight Contact Shadow Sharpness</span>
                      <span className="font-mono text-emerald-400 font-bold">{config.floodlightShadowSharpness.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.05"
                      value={config.floodlightShadowSharpness}
                      onChange={(e) => handleSliderChange('floodlightShadowSharpness', parseFloat(e.target.value))}
                      className="w-full accent-emerald-400 mt-1 cursor-pointer"
                    />
                    <span className="text-[10px] text-slate-500">Casts sharp directional contact shadows beneath boot-to-grass interface.</span>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-300">
                      <span>Contact Ambient Occlusion (AO)</span>
                      <span className="font-mono text-cyan-400 font-bold">{config.contactAmbientOcclusion.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.2"
                      max="1.0"
                      step="0.05"
                      value={config.contactAmbientOcclusion}
                      onChange={(e) => handleSliderChange('contactAmbientOcclusion', parseFloat(e.target.value))}
                      className="w-full accent-cyan-400 mt-1 cursor-pointer"
                    />
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-[11px]">
                    <span className="text-slate-300 font-bold">Target Framerate Lock:</span>
                    <span className="font-mono font-black text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                      60 FPS FIXED
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Reset & Status bar */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={handleResetToOptimal}
                className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to eFootball Ultra Defaults</span>
              </button>

              <button
                onClick={onClose}
                className="py-2.5 px-6 bg-volt hover:bg-yellow-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-colors shadow-lg"
              >
                Apply & Return to Match
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: GLSL Vertex Shader Source */}
        {activeTab === 'glsl_vertex' && (
          <div className="p-4 flex-1 flex flex-col gap-2 overflow-hidden bg-slate-950">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-bold text-white">GLSL Vertex Shader: Skeletal Strain & Cloth Displacement</span>
              <span className="font-mono text-[10px] text-cyan-400">#version 300 es · High Performance</span>
            </div>
            <pre className="flex-1 p-3 bg-slate-900 rounded-xl border border-slate-800 text-[11px] font-mono text-cyan-300 overflow-y-auto leading-relaxed selection:bg-cyan-900">
              {GLSL_VERTEX_SHADER_SOURCE.trim()}
            </pre>
          </div>
        )}

        {/* Tab 3: GLSL Fragment Shader Source */}
        {activeTab === 'glsl_fragment' && (
          <div className="p-4 flex-1 flex flex-col gap-2 overflow-hidden bg-slate-950">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-bold text-white">GLSL Fragment Shader: Subsurface Scattering & Dual-Lobe Sweat Specular</span>
              <span className="font-mono text-[10px] text-amber-400">#version 300 es · Kelemen-Szirmay-Kalos Model</span>
            </div>
            <pre className="flex-1 p-3 bg-slate-900 rounded-xl border border-slate-800 text-[11px] font-mono text-amber-300 overflow-y-auto leading-relaxed selection:bg-amber-900">
              {GLSL_FRAGMENT_SHADER_SOURCE.trim()}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
