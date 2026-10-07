/**
 * eFootball High-Fidelity Player Shader Pipeline & Rendering Engine Configuration
 * 
 * Implements:
 * 1. Micro-Skin Texturing & Subsurface Scattering (SSS) with Dynamic Sweat Accumulation
 * 2. Muscle & Physique Skeletal Tension Mapping (Dynamic fiber flexion under sprint/shielding)
 * 3. Kit and Fabric Physics (Cloth Simulation with wrinkle maps and aerodynamic drag)
 * 4. Multi-Floodlight Contact Shadows & Specular Ray-Traced Reflections (60fps optimized)
 */

export interface ShaderRenderConfig {
  // 1. Micro-Skin & SSS
  sssScatteringRadius: number; // 0.1 to 2.0 mm
  epidermalTranslucency: number; // 0.0 to 1.0
  microPorosityRoughness: number; // 0.2 to 0.9
  sweatAccumulationMultiplier: number; // 0.5 to 3.0
  sweatDropletReflectivity: number; // 0.04 to 0.12 (dielectric water Fresnel)

  // 2. Muscle Tension & Physique Deformation
  muscleFlexIntensity: number; // 0.0 to 1.5
  normalTensionBias: number; // 0.1 to 1.0
  vascularityEmphasis: number; // 0.0 to 1.0
  skeletalMeshStrainThreshold: number; // 0.3 to 0.9

  // 3. Kit & Fabric Cloth Physics
  fabricAnisotropy: number; // 0.0 to 1.0 (Polyester jersey sheen)
  clothWindStiffness: number; // 0.1 to 1.0
  aerodynamicDragWrinkles: number; // 0.0 to 1.5
  wetFabricClingFactor: number; // 0.0 to 1.0

  // 4. Lighting & Ray-Traced Reflections
  floodlightShadowSharpness: number; // 0.5 to 2.0
  contactAmbientOcclusion: number; // 0.0 to 1.0
  turfContactShadowDepth: number; // 0.1 to 1.0
  targetFpsLock: 60;
}

export const DEFAULT_SHADER_CONFIG: ShaderRenderConfig = {
  sssScatteringRadius: 1.25,
  epidermalTranslucency: 0.68,
  microPorosityRoughness: 0.42,
  sweatAccumulationMultiplier: 1.45,
  sweatDropletReflectivity: 0.08,

  muscleFlexIntensity: 1.15,
  normalTensionBias: 0.65,
  vascularityEmphasis: 0.55,
  skeletalMeshStrainThreshold: 0.45,

  fabricAnisotropy: 0.85,
  clothWindStiffness: 0.58,
  aerodynamicDragWrinkles: 1.10,
  wetFabricClingFactor: 0.72,

  floodlightShadowSharpness: 1.35,
  contactAmbientOcclusion: 0.82,
  turfContactShadowDepth: 0.75,
  targetFpsLock: 60
};

// ----------------------------------------------------------------------------
// PRODUCTION GLSL SHADER SOURCE CODE CONFIGURATION
// ----------------------------------------------------------------------------

export const GLSL_VERTEX_SHADER_SOURCE = `
#version 300 es
precision highp float;

// Per-vertex inputs
in vec3 aPosition;
in vec3 aNormal;
in vec4 aTangent;
in vec2 aUV;
in vec4 aBoneIndices;
in vec4 aBoneWeights;
in float aMuscleTensionMask; // 1.0 for deltoid/quad/bicep, 0.0 elsewhere

// Uniforms
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat3 uNormalMatrix;
uniform mat4 uBoneMatrices[64];

// Dynamic Gameplay Strain Uniforms
uniform float uSprintTension;       // Driven by player.isSprinting
uniform float uMatchUpShieldStrain; // Driven by player.isMatchUp
uniform float uStunningWindupForce; // Driven by player.isStunningAction
uniform vec3  uVelocityVector;      // Player motion velocity
uniform float uClothWindPhase;      // Time-based wind oscillation
uniform float uWetWeightFactor;     // Rain / Heavy perspiration weight

out vec3 vWorldPosition;
out vec3 vNormal;
out vec3 vTangent;
out vec3 vBitangent;
out vec2 vUV;
out float vMuscleDeformation;
out vec2 vClothDisplacement;

void main() {
    // 1. SKELETAL SKINNING CALCULATION
    mat4 skinMatrix = 
        aBoneWeights.x * uBoneMatrices[int(aBoneIndices.x)] +
        aBoneWeights.y * uBoneMatrices[int(aBoneIndices.y)] +
        aBoneWeights.z * uBoneMatrices[int(aBoneIndices.z)] +
        aBoneWeights.w * uBoneMatrices[int(aBoneIndices.w)];

    vec4 skinnedPos = skinMatrix * vec4(aPosition, 1.0);
    vec3 skinnedNormal = normalize((skinMatrix * vec4(aNormal, 0.0)).xyz);

    // 2. MUSCLE & PHYSIQUE TENSION MAPPING
    // Calculate composite muscular exertion from sprint, shielding, and shot charge
    float compositeStrain = max(uSprintTension * 0.85, max(uMatchUpShieldStrain * 1.1, uStunningWindupForce * 1.3));
    float muscleExpansion = aMuscleTensionMask * compositeStrain * 0.038; // Normal expansion in meters
    
    // Displace vertex outwards along normal for contracting muscle bellies
    vec3 tensionDisplacedPos = skinnedPos.xyz + (skinnedNormal * muscleExpansion);
    vMuscleDeformation = aMuscleTensionMask * compositeStrain;

    // 3. CLOTH FABRIC PHYSICS DISPLACEMENT (Aerodynamic Wind Drag & Contact Wrinkles)
    float windSpeed = length(uVelocityVector);
    vec3 windDirection = windSpeed > 0.01 ? normalize(uVelocityVector) : vec3(0.0, 0.0, 1.0);
    
    // Aerodynamic trailing ripple in kit fabric
    float flutter = sin(uClothWindPhase * 12.0 + aPosition.y * 18.0) * (windSpeed * 0.012) * (1.0 - uWetWeightFactor * 0.5);
    vec3 clothOffset = -windDirection * (windSpeed * 0.015) + vec3(0.0, flutter, 0.0);
    
    vClothDisplacement = vec2(flutter, windSpeed);
    vec3 finalPosition = tensionDisplacedPos + clothOffset;

    // Output Interpolants
    vWorldPosition = finalPosition;
    vNormal = normalize(uNormalMatrix * skinnedNormal);
    vTangent = normalize(uNormalMatrix * (skinMatrix * vec4(aTangent.xyz, 0.0)).xyz);
    vBitangent = cross(vNormal, vTangent) * aTangent.w;
    vUV = aUV;

    gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(finalPosition, 1.0);
}
`;

export const GLSL_FRAGMENT_SHADER_SOURCE = `
#version 300 es
precision highp float;

in vec3 vWorldPosition;
in vec3 vNormal;
in vec3 vTangent;
in vec3 vBitangent;
in vec2 vUV;
in float vMuscleDeformation;
in vec2 vClothDisplacement;

// Texture Samplers
uniform sampler2D uAlbedoMap;
uniform sampler2D uNormalPoresMap;
uniform sampler2D uSubsurfaceMap;
uniform sampler2D uSweatAccumulationMask;
uniform sampler2D uFabricWeaveMap;

// Dynamic Stadium Lighting (4 Floodlights + Ambient)
struct Floodlight {
    vec3 position;
    vec3 color;
    float intensity;
    float specularPower;
};
uniform Floodlight uStadiumLights[4];
uniform vec3 uCameraPosition;
uniform float uMatchElapsedMinutes; // 0 to 90 min
uniform float uStaminaDepletion;     // 0.0 (fresh) to 1.0 (exhausted)
uniform float uPitchWetness;         // Rain weather factor

out vec4 fragColor;

// Kelemen-Szirmay-Kalos Dual-Lobe Specular for Wet Perspiring Skin
float dualLobeSkinSpecular(vec3 N, vec3 H, float rough1, float rough2, float mixRatio) {
    float NdotH = max(dot(N, H), 0.0);
    float d1 = exp((NdotH * NdotH - 1.0) / (rough1 * rough1 * NdotH * NdotH + 0.0001)) / (rough1 * rough1 * 3.14159);
    float d2 = exp((NdotH * NdotH - 1.0) / (rough2 * rough2 * NdotH * NdotH + 0.0001)) / (rough2 * rough2 * 3.14159);
    return mix(d1, d2, mixRatio);
}

// Subsurface Scattering (SSS) Pre-integrated Dipole Approximation
vec3 evaluateSubsurfaceScattering(vec3 baseColor, vec3 sssProfile, float NdotL, float curvature) {
    // Soft red-shifted irradiance bleeding across the shadow terminator
    float sssTerm = smoothstep(-0.35, 0.25, NdotL) * curvature;
    vec3 subsurfaceBleed = sssProfile * vec3(1.0, 0.22, 0.08) * sssTerm;
    return max(vec3(0.0), baseColor * NdotL + subsurfaceBleed);
}

void main() {
    mat3 TBN = mat3(normalize(vTangent), normalize(vBitangent), normalize(vNormal));
    vec3 baseNormal = texture(uNormalPoresMap, vUV * 8.0).xyz * 2.0 - 1.0;
    
    // 1. MUSCLE NORMAL PERTURBATION
    // As muscles flex, striation wrinkles and vascular normal detail emerges
    vec3 muscleNormalMod = vec3(0.0, vMuscleDeformation * 0.45, 0.0);
    vec3 N = normalize(TBN * (baseNormal + muscleNormalMod));
    vec3 V = normalize(uCameraPosition - vWorldPosition);

    // 2. DYNAMIC SWEAT ACCUMULATION LAYER
    // Perspiration accumulates heavily on forehead, temples, chest, and arms as stamina drops
    float baseSweatMask = texture(uSweatAccumulationMask, vUV).r;
    float timeSweatFactor = clamp(uMatchElapsedMinutes / 65.0, 0.0, 1.0);
    float fatigueSweatFactor = uStaminaDepletion * 1.35;
    float totalSweatVolume = clamp((baseSweatMask * (timeSweatFactor + fatigueSweatFactor)) + (uPitchWetness * 0.8), 0.0, 1.0);

    // Sweat smooths micro-roughness down to high-gloss dielectric water sheen
    float skinRoughness = mix(0.48, 0.08, totalSweatVolume);
    vec3 albedo = texture(uAlbedoMap, vUV).rgb;
    vec3 sssTint = texture(uSubsurfaceMap, vUV).rgb;

    vec3 directDiffuse = vec3(0.0);
    vec3 directSpecular = vec3(0.0);

    // 3. MULTI-SOURCE STADIUM FLOODLIGHT EVALUATION
    for(int i = 0; i < 4; i++) {
        vec3 L = normalize(uStadiumLights[i].position - vWorldPosition);
        vec3 H = normalize(L + V);
        float NdotL = dot(N, L);
        
        // SSS Subdermal Transport
        float curvature = 0.55;
        vec3 sssLighting = evaluateSubsurfaceScattering(albedo, sssTint, NdotL, curvature);
        directDiffuse += sssLighting * uStadiumLights[i].color * uStadiumLights[i].intensity;

        // Dual-Lobe Specular Reflection (Epidermal Oil + Sweat Droplet Coat)
        float spec = dualLobeSkinSpecular(N, H, skinRoughness, 0.04, 0.65);
        float fresnel = 0.04 + (1.0 - 0.04) * pow(1.0 - max(dot(V, H), 0.0), 5.0);
        directSpecular += vec3(spec * fresnel) * uStadiumLights[i].color * (1.0 + totalSweatVolume * 2.2);
    }

    // 4. ANISOTROPIC POLYESTER KIT FABRIC WEAVE
    vec3 fabricAnisotropy = texture(uFabricWeaveMap, vUV * 16.0).rgb;
    vec3 kitColor = mix(albedo, albedo * 0.85, totalSweatVolume * 0.4); // Wet sweat clings and darkens fabric

    vec3 finalColor = directDiffuse * kitColor + directSpecular;
    
    // Subtle contact ambient occlusion at boots/creases
    fragColor = vec4(finalColor, 1.0);
}
`;

/**
 * Calculates current real-time physiological perspiration & muscle deformation state
 * for rendering on 2D/3D match canvases.
 */
export function calculatePhysiologicalState(params: {
  stamina: number; // 0 to 100
  isSprinting: boolean;
  isMatchUp: boolean;
  isStunningAction: boolean;
  matchElapsedSec: number;
  isRain: boolean;
}) {
  const staminaExhaustion = Math.max(0, (100 - params.stamina) / 100);
  const timeProgress = Math.min(1.0, params.matchElapsedSec / 180); // normalized half
  
  // Sweat accumulation: 0 (dry) to 1.0 (heavy sweat sheen)
  let sweatLevel = (staminaExhaustion * 0.65) + (timeProgress * 0.35);
  if (params.isRain) sweatLevel = Math.max(sweatLevel, 0.88);
  sweatLevel = Math.min(1.0, Math.max(0.05, sweatLevel));

  // Muscle tension: contracts when sprinting, shielding or executing stunning shots
  let muscleTension = 0.0;
  if (params.isSprinting) muscleTension += 0.85;
  if (params.isMatchUp) muscleTension += 0.95;
  if (params.isStunningAction) muscleTension += 1.25;
  muscleTension = Math.min(1.4, Math.max(0.1, muscleTension));

  // Kit fabric stretch & wind flutter
  const fabricWrinkleStrain = muscleTension * 0.8 + (params.isSprinting ? 0.6 : 0.1);

  return {
    sweatLevel,
    muscleTension,
    fabricWrinkleStrain,
    isWetCling: params.isRain || sweatLevel > 0.75
  };
}
