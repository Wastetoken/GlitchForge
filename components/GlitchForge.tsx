
import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Label } from './ui/Label';
import { Slider } from './ui/Slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/Tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/Select';
import { Card } from './ui/Card';
import { Download, Plus, Trash2, Upload, Type, Palette, Zap, Layers, Grid3x3 } from 'lucide-react';

interface Layer {
  id: string;
  type: 'text' | 'button';
  text: string;
  x: number;
  y: number;
  size: number;
  font: string;
  weight: number;
  opacity: number;
  rotation: number;
  color: string;
  textAlign?: string;
  letterSpacing?: number;
  lineHeight?: number;
  textShadow?: string;
  gradient?: { enabled: boolean; colors: string[]; type: string };
  animation?: { type: string; speed: number };
  buttonProps?: {
    width: number;
    height: number;
    bgColor: string;
    borderRadius: number;
    borderWidth: number;
    borderColor: string;
    url: string;
    target: string;
  };
}

interface ShaderParams {
  colors: string[];
  complexity: number;
  zoom: number;
  speed: number;
  distortion: number;
  customParams?: Record<string, number>;
}

interface Animation {
  id: string;
  name: string;
  fragmentShader: string;
  customParams?: Array<{ name: string; label: string; min: number; max: number; default: number; uniform: string }>;
}

const animations: Animation[] = [
  {
    id: 'glitch',
    name: 'Psychedelic Glitch',
    fragmentShader: `#version 300 es
precision highp float;
uniform vec2 r;
uniform float t;
uniform vec3 u_c1, u_c2, u_c3, u_c4, u_c5;
uniform float u_zoom, u_complexity, u_speed, u_distortion;
out vec4 fragColor;
void main() {
  vec2 p = (gl_FragCoord.xy * 2.0 - r) / min(r.x, r.y) * u_zoom;
  float time = t * u_speed;
  vec3 col = vec3(0.0);
  for(int i = 0; i < 150; i++) {
    if(float(i) >= u_complexity) break;
    float fi = float(i);
    p = abs(p) / dot(p, p) - vec2(cos(time * 0.1 + fi * 0.1), sin(time * 0.15 + fi * 0.05)) * u_distortion * 0.1;
    float idx = mod(fi + time * 0.5, 5.0);
    vec3 c = idx < 1.0 ? u_c1 : idx < 2.0 ? u_c2 : idx < 3.0 ? u_c3 : idx < 4.0 ? u_c4 : u_c5;
    col += c * 0.01 / (length(p) + 0.1);
  }
  fragColor = vec4(col, 1.0);
}`,
  },
  {
    id: 'plasma',
    name: 'Plasma Waves',
    fragmentShader: `#version 300 es
precision highp float;
uniform vec2 r;
uniform float t;
uniform vec3 u_c1, u_c2, u_c3, u_c4, u_c5;
uniform float u_zoom, u_complexity, u_speed, u_distortion;
uniform float u_frequency;
out vec4 fragColor;
void main() {
  vec2 p = gl_FragCoord.xy / r * u_zoom;
  float time = t * u_speed;
  float v = 0.0;
  v += sin((p.x + time) * u_frequency);
  v += sin((p.y + time) * u_frequency * 0.5);
  v += sin((p.x + p.y + time) * u_frequency * 0.3);
  v += cos(sqrt(p.x * p.x + p.y * p.y + 1.0) * u_frequency + time);
  v *= 0.5 + u_distortion * 0.1;
  float idx = mod(v * u_complexity * 0.1, 5.0);
  vec3 c = idx < 1.0 ? u_c1 : idx < 2.0 ? u_c2 : idx < 3.0 ? u_c3 : idx < 4.0 ? u_c4 : u_c5;
  fragColor = vec4(c * (0.5 + 0.5 * sin(v * 3.14159)), 1.0);
}`,
    customParams: [{ name: 'frequency', label: 'Wave Frequency', min: 0.5, max: 10, default: 3, uniform: 'u_frequency' }],
  },
  {
    id: 'neon-circuits',
    name: 'Neon Circuits',
    fragmentShader: `#version 300 es
precision highp float;
uniform vec2 r;
uniform float t;
uniform vec3 u_c1, u_c2, u_c3, u_c4, u_c5;
uniform float u_zoom, u_complexity, u_speed, u_distortion;
uniform float u_gridSize;
out vec4 fragColor;
void main() {
  vec2 p = gl_FragCoord.xy / r * u_zoom * 10.0;
  float time = t * u_speed;
  vec2 grid = fract(p * u_gridSize) - 0.5;
  float d = min(abs(grid.x), abs(grid.y));
  float line = smoothstep(0.02, 0.0, d);
  float pulse = sin(time * 2.0 + p.x + p.y) * 0.5 + 0.5;
  float spark = sin(time * 5.0 + p.x * 10.0) * sin(time * 3.0 + p.y * 10.0);
  spark = smoothstep(0.9, 1.0, spark);
  float idx = mod(floor(p.x + p.y + time), 5.0);
  vec3 c = idx < 1.0 ? u_c1 : idx < 2.0 ? u_c2 : idx < 3.0 ? u_c3 : idx < 4.0 ? u_c4 : u_c5;
  vec3 col = c * line * pulse + u_c1 * spark * 2.0;
  fragColor = vec4(col * (1.0 + u_distortion * 0.1), 1.0);
}`,
    customParams: [{ name: 'gridSize', label: 'Grid Size', min: 1, max: 20, default: 5, uniform: 'u_gridSize' }],
  },
  {
    id: 'blobs',
    name: 'Organic Blobs',
    fragmentShader: `#version 300 es
precision highp float;
uniform vec2 r;
uniform float t;
uniform vec3 u_c1, u_c2, u_c3, u_c4, u_c5;
uniform float u_zoom, u_complexity, u_speed, u_distortion;
uniform float u_blobSize;
out vec4 fragColor;
void main() {
  vec2 p = gl_FragCoord.xy / r;
  float time = t * u_speed;
  vec3 col = vec3(0.0);
  for(float i = 0.0; i < 10.0; i++) {
    if(i >= u_complexity * 0.1) break;
    vec2 blobPos = vec2(
      0.5 + sin(time * 0.5 + i * 2.0) * 0.3 * u_distortion,
      0.5 + cos(time * 0.3 + i * 1.5) * 0.3 * u_distortion
    );
    float dist = length(p - blobPos) * u_zoom;
    float blob = smoothstep(u_blobSize, 0.0, dist);
    float idx = mod(i, 5.0);
    vec3 c = idx < 1.0 ? u_c1 : idx < 2.0 ? u_c2 : idx < 3.0 ? u_c3 : idx < 4.0 ? u_c4 : u_c5;
    col += c * blob;
  }
  fragColor = vec4(col, 1.0);
}`,
    customParams: [{ name: 'blobSize', label: 'Blob Size', min: 0.1, max: 1, default: 0.5, uniform: 'u_blobSize' }],
  },
  {
    id: 'noise-gradient',
    name: 'Noise Gradient',
    fragmentShader: `#version 300 es
precision highp float;
uniform vec2 r;
uniform float t;
uniform vec3 u_c1, u_c2, u_c3, u_c4, u_c5;
uniform float u_zoom, u_complexity, u_speed, u_distortion;
uniform float u_noiseScale;
out vec4 fragColor;
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
void main() {
  vec2 p = gl_FragCoord.xy / r;
  float time = t * u_speed;
  float n = 0.0;
  float amp = 1.0;
  for(float i = 0.0; i < 6.0; i++) {
    if(i >= u_complexity * 0.06) break;
    n += noise(p * u_noiseScale * pow(2.0, i) + time * 0.1) * amp;
    amp *= 0.5;
  }
  n = n * 0.5 + 0.5 + u_distortion * 0.1;
  vec3 col = mix(u_c1, u_c2, p.y);
  col = mix(col, u_c3, n);
  fragColor = vec4(col * u_zoom * 0.5, 1.0);
}`,
    customParams: [{ name: 'noiseScale', label: 'Noise Scale', min: 1, max: 20, default: 5, uniform: 'u_noiseScale' }],
  },
  {
    id: 'spotlight',
    name: 'Spotlight Gradient',
    fragmentShader: `#version 300 es
precision highp float;
uniform vec2 r;
uniform float t;
uniform vec3 u_c1, u_c2, u_c3, u_c4, u_c5;
uniform float u_zoom, u_complexity, u_speed, u_distortion;
uniform float u_spotSize;
uniform float u_spotIntensity;
uniform float u_spotPosX;
out vec4 fragColor;
void main() {
  vec2 p = gl_FragCoord.xy / r;
  float time = t * u_speed;
  vec2 spotPos = vec2(u_spotPosX, 0.0 + sin(time * 0.2) * 0.05 * u_distortion);
  float dist = length(p - spotPos);
  float spotlight = exp(-dist * (10.0 / u_spotSize)) * u_spotIntensity;
  vec3 bg = mix(u_c1, u_c2, p.y);
  vec3 light = u_c3 * spotlight;
  vec3 col = bg + light;
  fragColor = vec4(col * u_zoom * 0.5, 1.0);
}`,
    customParams: [
      { name: 'spotSize', label: 'Spot Size', min: 0.5, max: 5, default: 2, uniform: 'u_spotSize' },
      { name: 'spotIntensity', label: 'Spot Intensity', min: 0.1, max: 3, default: 1.5, uniform: 'u_spotIntensity' },
      { name: 'spotPosX', label: 'Spot Position X', min: 0, max: 1, default: 0.5, uniform: 'u_spotPosX' },
    ],
  },
  {
    id: 'perlin-flow',
    name: 'Perlin Flow',
    fragmentShader: `#version 300 es
precision highp float;
uniform vec2 r;
uniform float t;
uniform vec3 u_c1, u_c2, u_c3, u_c4, u_c5;
uniform float u_zoom, u_complexity, u_speed, u_distortion;
uniform float u_flowSpeed;
out vec4 fragColor;
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289_2(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289_2(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m; m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}
void main() {
  vec2 p = gl_FragCoord.xy / r * u_zoom;
  float time = t * u_speed * u_flowSpeed;
  float n1 = snoise(p * 2.0 + vec2(time, 0.0));
  float n2 = snoise(p * 3.0 - vec2(0.0, time));
  float n = (n1 + n2) * 0.5 + u_distortion * 0.1;
  n = n * 0.5 + 0.5;
  float idx = mod(n * u_complexity * 0.05, 5.0);
  vec3 c = idx < 1.0 ? u_c1 : idx < 2.0 ? u_c2 : idx < 3.0 ? u_c3 : idx < 4.0 ? u_c4 : u_c5;
  fragColor = vec4(c * smoothstep(0.3, 0.7, n), 1.0);
}`,
    customParams: [{ name: 'flowSpeed', label: 'Flow Speed', min: 0.1, max: 2, default: 0.5, uniform: 'u_flowSpeed' }],
  },
  {
    id: 'radial-burst',
    name: 'Radial Burst',
    fragmentShader: `#version 300 es
precision highp float;
uniform vec2 r;
uniform float t;
uniform vec3 u_c1, u_c2, u_c3, u_c4, u_c5;
uniform float u_zoom, u_complexity, u_speed, u_distortion;
uniform float u_rayCount;
out vec4 fragColor;
void main() {
  vec2 p = (gl_FragCoord.xy * 2.0 - r) / min(r.x, r.y) * u_zoom;
  float time = t * u_speed;
  float angle = atan(p.y, p.x);
  float radius = length(p);
  float rays = sin(angle * u_rayCount + time) * 0.5 + 0.5;
  rays *= smoothstep(2.0, 0.0, radius);
  rays += smoothstep(0.5, 0.0, radius) * (sin(time * 2.0) * 0.5 + 0.5);
  rays *= 1.0 + u_distortion * 0.1;
  float idx = mod(rays * u_complexity * 0.05, 5.0);
  vec3 c = idx < 1.0 ? u_c1 : idx < 2.0 ? u_c2 : idx < 3.0 ? u_c3 : idx < 4.0 ? u_c4 : u_c5;
  fragColor = vec4(c * rays, 1.0);
}`,
    customParams: [{ name: 'rayCount', label: 'Ray Count', min: 3, max: 32, default: 12, uniform: 'u_rayCount' }],
  },
  {
    id: 'digital-rain',
    name: 'Digital Rain',
    fragmentShader: `#version 300 es
precision highp float;
uniform vec2 r;
uniform float t;
uniform vec3 u_c1, u_c2, u_c3, u_c4, u_c5;
uniform float u_zoom, u_complexity, u_speed, u_distortion;
uniform float u_density;
out vec4 fragColor;
void main() {
  vec2 p = gl_FragCoord.xy / r;
  float time = t * u_speed;
  float col = 0.0;
  for(float i = 0.0; i < 50.0; i++) {
    if(i >= u_complexity * 0.5) break;
    float x = fract(sin(i * 12.9898) * 43758.5453);
    float y = fract(time * (0.5 + x * 0.5) + i * 0.1);
    float dist = abs(p.x - x) * u_density;
    if(dist < 0.02 && p.y < y && p.y > y - 0.3) {
      col += (1.0 - (y - p.y) / 0.3) * smoothstep(0.02, 0.0, dist);
    }
  }
  vec3 c = mix(u_c1, u_c2, col);
  fragColor = vec4(c * col * (1.0 + u_distortion * 0.1), 1.0);
}`,
    customParams: [{ name: 'density', label: 'Column Density', min: 10, max: 100, default: 50, uniform: 'u_density' }],
  },
  {
    id: 'fractal',
    name: 'Fractal Mandelbrot',
    fragmentShader: `#version 300 es
precision highp float;
uniform vec2 r;
uniform float t;
uniform vec3 u_c1, u_c2, u_c3, u_c4, u_c5;
uniform float u_zoom, u_complexity, u_speed, u_distortion;
out vec4 fragColor;
void main() {
  vec2 c = (gl_FragCoord.xy * 2.0 - r) / min(r.x, r.y) / u_zoom + vec2(cos(t * u_speed * 0.1), sin(t * u_speed * 0.1)) * u_distortion * 0.1;
  vec2 z = vec2(0.0);
  float iter = 0.0;
  for(int i = 0; i < 150; i++) {
    if(float(i) >= u_complexity) break;
    z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
    if(length(z) > 2.0) break;
    iter += 1.0;
  }
  float idx = mod(iter * 0.2, 5.0);
  vec3 col = idx < 1.0 ? u_c1 : idx < 2.0 ? u_c2 : idx < 3.0 ? u_c3 : idx < 4.0 ? u_c4 : u_c5;
  fragColor = vec4(col * (iter / u_complexity), 1.0);
}`,
  },
  {
    id: 'vaporwave',
    name: 'Vaporwave Grid',
    fragmentShader: `#version 300 es
precision highp float;
uniform vec2 r;
uniform float t;
uniform vec3 u_c1, u_c2, u_c3, u_c4, u_c5;
uniform float u_zoom, u_complexity, u_speed, u_distortion;
uniform float u_perspective;
out vec4 fragColor;
void main() {
  vec2 p = (gl_FragCoord.xy * 2.0 - r) / r.y;
  float time = t * u_speed;
  p.y += u_perspective;
  vec2 grid = fract(vec2(p.x * u_zoom, (p.y + time) * u_zoom * 2.0)) - 0.5;
  float d = min(abs(grid.x), abs(grid.y));
  float line = smoothstep(0.05, 0.0, d) / (p.y + 1.0);
  vec3 sky = mix(u_c1, u_c2, p.y * 0.5 + 0.5);
  vec3 grid_col = mix(u_c3, u_c4, sin(time + p.x) * 0.5 + 0.5);
  vec3 col = mix(sky, grid_col, line * (1.0 + u_distortion * 0.1));
  fragColor = vec4(col, 1.0);
}`,
    customParams: [{ name: 'perspective', label: 'Perspective', min: 0, max: 2, default: 0.5, uniform: 'u_perspective' }],
  },
  {
    id: 'particles',
    name: 'Particle Storm',
    fragmentShader: `#version 300 es
precision highp float;
uniform vec2 r;
uniform float t;
uniform vec3 u_c1, u_c2, u_c3, u_c4, u_c5;
uniform float u_zoom, u_complexity, u_speed, u_distortion;
uniform float u_gravity;
out vec4 fragColor;
void main() {
  vec2 p = gl_FragCoord.xy / r;
  float time = t * u_speed;
  vec3 col = vec3(0.0);
  for(float i = 0.0; i < 100.0; i++) {
    if(i >= u_complexity) break;
    float seed = i * 0.1;
    vec2 pos = vec2(fract(sin(seed) * 43758.5453), fract(time * 0.5 + cos(seed) * 0.5));
    pos.y = fract(pos.y - time * 0.3 * (1.0 + u_gravity * 0.1));
    float dist = length(p - pos) * u_zoom * 50.0;
    float brightness = smoothstep(1.0, 0.0, dist);
    float idx = mod(i, 5.0);
    vec3 c = idx < 1.0 ? u_c1 : idx < 2.0 ? u_c2 : idx < 3.0 ? u_c3 : idx < 4.0 ? u_c4 : u_c5;
    col += c * brightness * (1.0 + u_distortion * 0.1);
  }
  fragColor = vec4(col, 1.0);
}`,
    customParams: [{ name: 'gravity', label: 'Gravity', min: -2, max: 2, default: 0, uniform: 'u_gravity' }],
  },
  {
    id: 'holographic',
    name: 'Holographic Interference',
    fragmentShader: `#version 300 es
precision highp float;
uniform vec2 r;
uniform float t;
uniform vec3 u_c1, u_c2, u_c3, u_c4, u_c5;
uniform float u_zoom, u_complexity, u_speed, u_distortion;
uniform float u_phase;
out vec4 fragColor;
void main() {
  vec2 p = gl_FragCoord.xy / r * u_zoom;
  float time = t * u_speed;
  float wave1 = sin(p.x * u_complexity * 0.5 + time + u_phase);
  float wave2 = sin(p.y * u_complexity * 0.5 - time * 0.7);
  float wave3 = sin((p.x + p.y) * u_complexity * 0.3 + time * 0.5);
  float interference = (wave1 + wave2 + wave3) * 0.333 * (1.0 + u_distortion * 0.1);
  float idx = mod(interference * 2.5 + 2.5, 5.0);
  vec3 c = idx < 1.0 ? u_c1 : idx < 2.0 ? u_c2 : idx < 3.0 ? u_c3 : idx < 4.0 ? u_c4 : u_c5;
  fragColor = vec4(c * (0.5 + interference * 0.5), 1.0);
}`,
    customParams: [{ name: 'phase', label: 'Phase Shift', min: 0, max: 6.28, default: 0, uniform: 'u_phase' }],
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Glitch',
    fragmentShader: `#version 300 es
precision highp float;
uniform vec2 r;
uniform float t;
uniform vec3 u_c1, u_c2, u_c3, u_c4, u_c5;
uniform float u_zoom, u_complexity, u_speed, u_distortion;
uniform float u_glitchIntensity;
out vec4 fragColor;
void main() {
  vec2 p = gl_FragCoord.xy / r;
  float time = t * u_speed;
  float glitch = step(0.95, fract(sin(floor(p.y * 100.0 + time * 10.0)) * 43758.5453)) * u_glitchIntensity;
  p.x += glitch * (sin(time * 50.0) * 0.1);
  float scanline = sin(p.y * r.y * 2.0) * 0.1;
  float noise = fract(sin(dot(p, vec2(12.9898, 78.233)) + time) * 43758.5453) * u_distortion * 0.1;
  vec3 col = mix(u_c1, u_c2, p.y);
  col = mix(col, u_c3, glitch);
  col += vec3(noise + scanline);
  fragColor = vec4(col, 1.0);
}`,
    customParams: [{ name: 'glitchIntensity', label: 'Glitch Intensity', min: 0, max: 1, default: 0.5, uniform: 'u_glitchIntensity' }],
  },
  {
    id: 'aurora',
    name: 'Aurora Borealis',
    fragmentShader: `#version 300 es
precision highp float;
uniform vec2 r;
uniform float t;
uniform vec3 u_c1, u_c2, u_c3, u_c4, u_c5;
uniform float u_zoom, u_complexity, u_speed, u_distortion;
uniform float u_windSpeed;
out vec4 fragColor;
void main() {
  vec2 p = gl_FragCoord.xy / r;
  float time = t * u_speed;
  float wave = 0.0;
  for(float i = 1.0; i <= 5.0; i++) {
    if(i > u_complexity * 0.05) break;
    wave += sin(p.x * i * u_zoom + time * u_windSpeed + i) * cos(p.y * i * 0.5 + time * 0.5) / i;
  }
  wave = wave * 0.5 + 0.5 + u_distortion * 0.1;
  float idx = mod(wave * 4.0, 5.0);
  vec3 c = idx < 1.0 ? u_c1 : idx < 2.0 ? u_c2 : idx < 3.0 ? u_c3 : idx < 4.0 ? u_c4 : u_c5;
  vec3 col = c * smoothstep(0.3, 0.7, wave);
  fragColor = vec4(col, 1.0);
}`,
    customParams: [{ name: 'windSpeed', label: 'Wind Speed', min: 0.1, max: 3, default: 1, uniform: 'u_windSpeed' }],
  },
  {
    id: 'quantum',
    name: 'Quantum Foam',
    fragmentShader: `#version 300 es
precision highp float;
uniform vec2 r;
uniform float t;
uniform vec3 u_c1, u_c2, u_c3, u_c4, u_c5;
uniform float u_zoom, u_complexity, u_speed, u_distortion;
out vec4 fragColor;
void main() {
  vec2 p = (gl_FragCoord.xy * 2.0 - r) / min(r.x, r.y) * u_zoom;
  float time = t * u_speed;
  vec3 col = vec3(0.0);
  for(int i = 0; i < 100; i++) {
    if(float(i) >= u_complexity) break;
    float fi = float(i);
    vec2 offset = vec2(sin(time * 0.5 + fi), cos(time * 0.3 + fi)) * u_distortion * 0.5;
    float bubble = length(p - offset);
    bubble = smoothstep(0.3, 0.0, bubble);
    float idx = mod(fi, 5.0);
    vec3 c = idx < 1.0 ? u_c1 : idx < 2.0 ? u_c2 : idx < 3.0 ? u_c3 : idx < 4.0 ? u_c4 : u_c5;
    col += c * bubble * 0.1;
  }
  fragColor = vec4(col, 1.0);
}`,
  },
  {
    id: 'neural',
    name: 'Neural Network',
    fragmentShader: `#version 300 es
precision highp float;
uniform vec2 r;
uniform float t;
uniform vec3 u_c1, u_c2, u_c3, u_c4, u_c5;
uniform float u_zoom, u_complexity, u_speed, u_distortion;
uniform float u_nodeCount;
out vec4 fragColor;
void main() {
  vec2 p = gl_FragCoord.xy / r;
  float time = t * u_speed;
  vec3 col = vec3(0.0);
  for(float i = 0.0; i < 30.0; i++) {
    if(i >= u_nodeCount) break;
    vec2 node = vec2(fract(sin(i * 12.9898) * 43758.5453), fract(cos(i * 78.233) * 43758.5453));
    node += vec2(sin(time + i), cos(time * 0.7 + i)) * 0.1 * u_distortion;
    float dist = length(p - node) * u_zoom * 10.0;
    float node_glow = smoothstep(0.5, 0.0, dist);
    for(float j = i + 1.0; j < 30.0; j++) {
      if(j >= u_nodeCount) break;
      vec2 node2 = vec2(fract(sin(j * 12.9898) * 43758.5453), fract(cos(j * 78.233) * 43758.5453));
      node2 += vec2(sin(time + j), cos(time * 0.7 + j)) * 0.1 * u_distortion;
      float line_dist = length(node - node2);
      if(line_dist < 0.3) {
        float connection = 1.0 - smoothstep(0.0, 0.3, line_dist);
        col += u_c2 * connection * 0.01;
      }
    }
    float idx = mod(i, 5.0);
    vec3 c = idx < 1.0 ? u_c1 : idx < 2.0 ? u_c2 : idx < 3.0 ? u_c3 : idx < 4.0 ? u_c4 : u_c5;
    col += c * node_glow;
  }
  fragColor = vec4(col, 1.0);
}`,
    customParams: [{ name: 'nodeCount', label: 'Node Count', min: 5, max: 30, default: 15, uniform: 'u_nodeCount' }],
  },
  {
    id: 'liquid-metal',
    name: 'Liquid Metal',
    fragmentShader: `#version 300 es
precision highp float;
uniform vec2 r;
uniform float t;
uniform vec3 u_c1, u_c2, u_c3, u_c4, u_c5;
uniform float u_zoom, u_complexity, u_speed, u_distortion;
uniform float u_viscosity;
out vec4 fragColor;
void main() {
  vec2 p = (gl_FragCoord.xy * 2.0 - r) / min(r.x, r.y) * u_zoom;
  float time = t * u_speed;
  vec2 flow = p;
  for(int i = 0; i < 50; i++) {
    if(float(i) >= u_complexity * 0.5) break;
    flow = abs(flow) / dot(flow, flow) - vec2(sin(time * u_viscosity), cos(time * u_viscosity * 0.7));
  }
  float metal = length(flow) * (1.0 + u_distortion * 0.1);
  float idx = mod(metal * 5.0, 5.0);
  vec3 c = idx < 1.0 ? u_c1 : idx < 2.0 ? u_c2 : idx < 3.0 ? u_c3 : idx < 4.0 ? u_c4 : u_c5;
  vec3 col = c * smoothstep(2.0, 0.0, metal);
  fragColor = vec4(col, 1.0);
}`,
    customParams: [{ name: 'viscosity', label: 'Viscosity', min: 0.1, max: 2, default: 0.5, uniform: 'u_viscosity' }],
  },
  {
    id: 'smoke',
    name: 'Smoke Simulation',
    fragmentShader: `#version 300 es
precision highp float;
uniform vec2 r;
uniform float t;
uniform vec3 u_c1, u_c2, u_c3, u_c4, u_c5;
uniform float u_zoom, u_complexity, u_speed, u_distortion;
uniform float u_turbulence;
out vec4 fragColor;
void main() {
  vec2 p = gl_FragCoord.xy / r * u_zoom;
  float time = t * u_speed;
  float smoke = 0.0;
  for(float i = 1.0; i <= 10.0; i++) {
    if(i > u_complexity * 0.1) break;
    vec2 offset = vec2(sin(time * 0.5 + i), cos(time * 0.3 + i)) * u_turbulence;
    smoke += sin(p.x * i + offset.x) * cos(p.y * i + offset.y) / i;
  }
  smoke = smoke * 0.5 + 0.5 + u_distortion * 0.1;
  float idx = mod(smoke * 4.0, 5.0);
  vec3 c = idx < 1.0 ? u_c1 : idx < 2.0 ? u_c2 : idx < 3.0 ? u_c3 : idx < 4.0 ? u_c4 : u_c5;
  vec3 col = c * smoothstep(0.2, 0.8, smoke);
  fragColor = vec4(col, 1.0);
}`,
    customParams: [{ name: 'turbulence', label: 'Turbulence', min: 0, max: 5, default: 1, uniform: 'u_turbulence' }],
  },
  {
    id: 'kaleidoscope',
    name: 'Kaleidoscope',
    fragmentShader: `#version 300 es
precision highp float;
uniform vec2 r;
uniform float t;
uniform vec3 u_c1, u_c2, u_c3, u_c4, u_c5;
uniform float u_zoom, u_complexity, u_speed, u_distortion;
uniform float u_segments;
out vec4 fragColor;
void main() {
  vec2 p = (gl_FragCoord.xy * 2.0 - r) / min(r.x, r.y) * u_zoom;
  float time = t * u_speed;
  float angle = atan(p.y, p.x);
  float radius = length(p);
  angle = mod(angle, 6.28318 / u_segments);
  p = vec2(cos(angle), sin(angle)) * radius;
  vec3 col = vec3(0.0);
  for(int i = 0; i < 50; i++) {
    if(float(i) >= u_complexity * 0.5) break;
    float fi = float(i);
    p = abs(p) / dot(p, p) - vec2(sin(time + fi * 0.1), cos(time * 0.7 + fi * 0.1)) * u_distortion * 0.1;
    float idx = mod(fi, 5.0);
    vec3 c = idx < 1.0 ? u_c1 : idx < 2.0 ? u_c2 : idx < 3.0 ? u_c3 : idx < 4.0 ? u_c4 : u_c5;
    col += c * 0.02 / (length(p) + 0.1);
  }
  fragColor = vec4(col, 1.0);
}`,
    customParams: [{ name: 'segments', label: 'Segments', min: 2, max: 12, default: 6, uniform: 'u_segments' }],
  },
  {
    id: 'tunnel',
    name: 'Infinite Tunnel',
    fragmentShader: `#version 300 es
precision highp float;
uniform vec2 r;
uniform float t;
uniform vec3 u_c1, u_c2, u_c3, u_c4, u_c5;
uniform float u_zoom, u_complexity, u_speed, u_distortion;
uniform float u_depth;
out vec4 fragColor;
void main() {
  vec2 p = (gl_FragCoord.xy * 2.0 - r) / min(r.x, r.y);
  float time = t * u_speed;
  float angle = atan(p.y, p.x);
  float radius = length(p);
  float depth = u_depth / radius + time;
  float tunnel = sin(depth * u_complexity * 0.1 + angle * 5.0) * 0.5 + 0.5;
  tunnel *= 1.0 + u_distortion * 0.1;
  float idx = mod(tunnel * 4.0, 5.0);
  vec3 c = idx < 1.0 ? u_c1 : idx < 2.0 ? u_c2 : idx < 3.0 ? u_c3 : idx < 4.0 ? u_c4 : u_c5;
  vec3 col = c * tunnel / (radius * u_zoom + 0.5);
  fragColor = vec4(col, 1.0);
}`,
    customParams: [{ name: 'depth', label: 'Depth', min: 0.5, max: 5, default: 2, uniform: 'u_depth' }],
  },
  {
    id: 'voronoi',
    name: 'Voronoi Cells',
    fragmentShader: `#version 300 es
precision highp float;
uniform vec2 r;
uniform float t;
uniform vec3 u_c1, u_c2, u_c3, u_c4, u_c5;
uniform float u_zoom, u_complexity, u_speed, u_distortion;
uniform float u_cellSize;
out vec4 fragColor;
void main() {
  vec2 p = gl_FragCoord.xy / r * u_zoom * u_cellSize;
  float time = t * u_speed;
  vec2 cell = floor(p);
  float minDist = 10.0;
  float secondDist = 10.0;
  for(float i = -1.0; i <= 1.0; i++) {
    for(float j = -1.0; j <= 1.0; j++) {
      vec2 neighbor = cell + vec2(i, j);
      vec2 point = neighbor + vec2(sin(neighbor.x + time), cos(neighbor.y + time)) * 0.5 * u_distortion;
      float dist = length(p - point);
      if(dist < minDist) {
        secondDist = minDist;
        minDist = dist;
      } else if(dist < secondDist) {
        secondDist = dist;
      }
    }
  }
  float edge = secondDist - minDist;
  float idx = mod(minDist * u_complexity * 0.1, 5.0);
  vec3 c = idx < 1.0 ? u_c1 : idx < 2.0 ? u_c2 : idx < 3.0 ? u_c3 : idx < 4.0 ? u_c4 : u_c5;
  vec3 col = c * (1.0 - smoothstep(0.0, 0.1, edge));
  fragColor = vec4(col, 1.0);
}`,
    customParams: [{ name: 'cellSize', label: 'Cell Size', min: 1, max: 10, default: 5, uniform: 'u_cellSize' }],
  },
  {
    id: 'dna',
    name: 'DNA Helix',
    fragmentShader: `#version 300 es
precision highp float;
uniform vec2 r;
uniform float t;
uniform vec3 u_c1, u_c2, u_c3, u_c4, u_c5;
uniform float u_zoom, u_complexity, u_speed, u_distortion;
uniform float u_helixTwist;
out vec4 fragColor;
void main() {
  vec2 p = (gl_FragCoord.xy * 2.0 - r) / r.y * u_zoom;
  float time = t * u_speed;
  float y = p.y + time;
  float helix1 = sin(y * u_helixTwist) * 0.3;
  float helix2 = sin(y * u_helixTwist + 3.14159) * 0.3;
  float dist1 = length(vec2(p.x - helix1, 0.0));
  float dist2 = length(vec2(p.x - helix2, 0.0));
  float strand1 = smoothstep(0.05, 0.0, dist1);
  float strand2 = smoothstep(0.05, 0.0, dist2);
  float connection = 0.0;
  if(mod(y * u_complexity * 0.1, 1.0) < 0.1) {
    float line = smoothstep(0.02, 0.0, abs(p.x - mix(helix1, helix2, 0.5)));
    connection = line;
  }
  vec3 col = u_c1 * strand1 + u_c2 * strand2 + u_c3 * connection;
  col *= 1.0 + u_distortion * 0.1;
  fragColor = vec4(col, 1.0);
}`,
    customParams: [{ name: 'helixTwist', label: 'Helix Twist', min: 1, max: 10, default: 5, uniform: 'u_helixTwist' }],
  },
  {
    id: 'crystal',
    name: 'Crystal Formation',
    fragmentShader: `#version 300 es
precision highp float;
uniform vec2 r;
uniform float t;
uniform vec3 u_c1, u_c2, u_c3, u_c4, u_c5;
uniform float u_zoom, u_complexity, u_speed, u_distortion;
uniform float u_facets;
out vec4 fragColor;
void main() {
  vec2 p = (gl_FragCoord.xy * 2.0 - r) / min(r.x, r.y) * u_zoom;
  float time = t * u_speed;
  float angle = atan(p.y, p.x);
  float radius = length(p);
  angle = floor(angle * u_facets) / u_facets;
  vec2 crystal = vec2(cos(angle), sin(angle)) * radius;
  float pattern = sin(crystal.x * u_complexity * 0.1 + time) * cos(crystal.y * u_complexity * 0.1 - time);
  pattern = pattern * 0.5 + 0.5 + u_distortion * 0.1;
  float idx = mod(pattern * 4.0, 5.0);
  vec3 c = idx < 1.0 ? u_c1 : idx < 2.0 ? u_c2 : idx < 3.0 ? u_c3 : idx < 4.0 ? u_c4 : u_c5;
  vec3 col = c * pattern / (radius + 0.5);
  fragColor = vec4(col, 1.0);
}`,
    customParams: [{ name: 'facets', label: 'Facets', min: 3, max: 20, default: 8, uniform: 'u_facets' }],
  },
  {
    id: 'warp',
    name: 'Warp Speed',
    fragmentShader: `#version 300 es
precision highp float;
uniform vec2 r;
uniform float t;
uniform vec3 u_c1, u_c2, u_c3, u_c4, u_c5;
uniform float u_zoom, u_complexity, u_speed, u_distortion;
uniform float u_warpFactor;
out vec4 fragColor;
void main() {
  vec2 p = (gl_FragCoord.xy * 2.0 - r) / min(r.x, r.y);
  float time = t * u_speed;
  float angle = atan(p.y, p.x);
  float radius = length(p);
  float star = fract(radius * u_complexity * 0.1 - time * u_warpFactor);
  star = smoothstep(0.9, 1.0, star) / (radius * u_zoom + 0.1);
  float idx = mod(angle * 5.0, 5.0);
  vec3 c = idx < 1.0 ? u_c1 : idx < 2.0 ? u_c2 : idx < 3.0 ? u_c3 : idx < 4.0 ? u_c4 : u_c5;
  vec3 col = c * star * (1.0 + u_distortion * 0.1);
  fragColor = vec4(col, 1.0);
}`,
    customParams: [{ name: 'warpFactor', label: 'Warp Factor', min: 0.5, max: 5, default: 2, uniform: 'u_warpFactor' }],
  },
  {
    id: 'fire',
    name: 'Fire Flames',
    fragmentShader: `#version 300 es
precision highp float;
uniform vec2 r;
uniform float t;
uniform vec3 u_c1, u_c2, u_c3, u_c4, u_c5;
uniform float u_zoom, u_complexity, u_speed, u_distortion;
uniform float u_intensity;
out vec4 fragColor;
void main() {
  vec2 p = gl_FragCoord.xy / r;
  float time = t * u_speed;
  float fire = 0.0;
  for(float i = 1.0; i <= 10.0; i++) {
    if(i > u_complexity * 0.1) break;
    fire += sin(p.x * i * u_zoom + time * i * 0.5) * cos((1.0 - p.y) * i + time * i) / i;
  }
  fire = fire * 0.5 + 0.5;
  fire *= (1.0 - p.y) * u_intensity * (1.0 + u_distortion * 0.1);
  float idx = mod(fire * 3.0, 5.0);
  vec3 c = idx < 1.0 ? u_c1 : idx < 2.0 ? u_c2 : idx < 3.0 ? u_c3 : idx < 4.0 ? u_c4 : u_c5;
  vec3 col = c * smoothstep(0.0, 1.0, fire);
  fragColor = vec4(col, 1.0);
}`,
    customParams: [{ name: 'intensity', label: 'Intensity', min: 0.5, max: 3, default: 1.5, uniform: 'u_intensity' }],
  },
  {
    id: 'hexagon',
    name: 'Hexagon Grid',
    fragmentShader: `#version 300 es
precision highp float;
uniform vec2 r;
uniform float t;
uniform vec3 u_c1, u_c2, u_c3, u_c4, u_c5;
uniform float u_zoom, u_complexity, u_speed, u_distortion;
uniform float u_hexSize;
out vec4 fragColor;
void main() {
  vec2 p = gl_FragCoord.xy / r * u_zoom * u_hexSize;
  float time = t * u_speed;
  vec2 hex = vec2(p.x * 1.732, p.y + p.x * 0.577);
  vec2 hexId = floor(hex);
  vec2 hexPos = fract(hex);
  float dist = min(min(hexPos.x, hexPos.y), min(1.0 - hexPos.x, 1.0 - hexPos.y));
  float edge = smoothstep(0.05, 0.0, dist);
  float pulse = sin(time + hexId.x + hexId.y) * 0.5 + 0.5;
  float idx = mod(hexId.x + hexId.y + time * 0.5, 5.0);
  vec3 c = idx < 1.0 ? u_c1 : idx < 2.0 ? u_c2 : idx < 3.0 ? u_c3 : idx < 4.0 ? u_c4 : u_c5;
  vec3 col = c * edge * pulse * (1.0 + u_distortion * 0.1);
  fragColor = vec4(col, 1.0);
}`,
    customParams: [{ name: 'hexSize', label: 'Hex Size', min: 1, max: 20, default: 10, uniform: 'u_hexSize' }],
  },
  {
    id: 'galaxy',
    name: 'Spiral Galaxy',
    fragmentShader: `#version 300 es
precision highp float;
uniform vec2 r;
uniform float t;
uniform vec3 u_c1, u_c2, u_c3, u_c4, u_c5;
uniform float u_zoom, u_complexity, u_speed, u_distortion;
uniform float u_arms;
out vec4 fragColor;
void main() {
  vec2 p = (gl_FragCoord.xy * 2.0 - r) / min(r.x, r.y) * u_zoom;
  float time = t * u_speed;
  float angle = atan(p.y, p.x);
  float radius = length(p);
  float spiral = sin(angle * u_arms - radius * 5.0 + time) * 0.5 + 0.5;
  float stars = fract(sin(dot(p, vec2(12.9898, 78.233)) + time * 0.1) * 43758.5453);
  stars = smoothstep(0.98, 1.0, stars);
  float galaxy = spiral / (radius * 2.0 + 0.5) * (1.0 + u_distortion * 0.1);
  float idx = mod(galaxy * u_complexity * 0.1, 5.0);
  vec3 c = idx < 1.0 ? u_c1 : idx < 2.0 ? u_c2 : idx < 3.0 ? u_c3 : idx < 4.0 ? u_c4 : u_c5;
  vec3 col = c * galaxy + u_c1 * stars;
  fragColor = vec4(col, 1.0);
}`,
    customParams: [{ name: 'arms', label: 'Spiral Arms', min: 1, max: 8, default: 3, uniform: 'u_arms' }],
  },
  {
    id: 'waves',
    name: 'Ocean Waves',
    fragmentShader: `#version 300 es
precision highp float;
uniform vec2 r;
uniform float t;
uniform vec3 u_c1, u_c2, u_c3, u_c4, u_c5;
uniform float u_zoom, u_complexity, u_speed, u_distortion;
uniform float u_amplitude;
out vec4 fragColor;
void main() {
  vec2 p = gl_FragCoord.xy / r;
  float time = t * u_speed;
  float wave = 0.0;
  for(float i = 1.0; i <= 10.0; i++) {
    if(i > u_complexity * 0.1) break;
    wave += sin(p.x * i * u_zoom + time * i * 0.5) * cos(p.y * i * 0.5 + time * i * 0.3) * u_amplitude / i;
  }
  wave = wave * 0.5 + 0.5 + u_distortion * 0.1;
  float idx = mod(wave * 4.0, 5.0);
  vec3 c = idx < 1.0 ? u_c1 : idx < 2.0 ? u_c2 : idx < 3.0 ? u_c3 : idx < 4.0 ? u_c4 : u_c5;
  vec3 col = c * smoothstep(0.3, 0.7, wave);
  fragColor = vec4(col, 1.0);
}`,
    customParams: [{ name: 'amplitude', label: 'Amplitude', min: 0.1, max: 2, default: 0.5, uniform: 'u_amplitude' }],
  },
  {
    id: 'mosaic',
    name: 'Mosaic Tiles',
    fragmentShader: `#version 300 es
precision highp float;
uniform vec2 r;
uniform float t;
uniform vec3 u_c1, u_c2, u_c3, u_c4, u_c5;
uniform float u_zoom, u_complexity, u_speed, u_distortion;
uniform float u_tileSize;
out vec4 fragColor;
void main() {
  vec2 p = gl_FragCoord.xy / r * u_zoom * u_tileSize;
  float time = t * u_speed;
  vec2 tile = floor(p);
  vec2 tilePos = fract(p);
  float pattern = sin(tile.x * u_complexity * 0.1 + time) * cos(tile.y * u_complexity * 0.1 - time);
  pattern = pattern * 0.5 + 0.5;
  float border = smoothstep(0.1, 0.0, min(min(tilePos.x, tilePos.y), min(1.0 - tilePos.x, 1.0 - tilePos.y)));
  float idx = mod(tile.x + tile.y + pattern * 5.0, 5.0);
  vec3 c = idx < 1.0 ? u_c1 : idx < 2.0 ? u_c2 : idx < 3.0 ? u_c3 : idx < 4.0 ? u_c4 : u_c5;
  vec3 col = c * (1.0 - border * 0.5) * (1.0 + u_distortion * 0.1);
  fragColor = vec4(col, 1.0);
}`,
    customParams: [{ name: 'tileSize', label: 'Tile Size', min: 2, max: 20, default: 10, uniform: 'u_tileSize' }],
  },
  {
    id: 'electric',
    name: 'Electric Field',
    fragmentShader: `#version 300 es
precision highp float;
uniform vec2 r;
uniform float t;
uniform vec3 u_c1, u_c2, u_c3, u_c4, u_c5;
uniform float u_zoom, u_complexity, u_speed, u_distortion;
out vec4 fragColor;
void main() {
  vec2 p = (gl_FragCoord.xy * 2.0 - r) / min(r.x, r.y) * u_zoom;
  float time = t * u_speed;
  vec3 col = vec3(0.0);
  for(int i = 0; i < 80; i++) {
    if(float(i) >= u_complexity * 0.8) break;
    float fi = float(i);
    vec2 charge = vec2(sin(fi * 2.0 + time), cos(fi * 1.5 + time)) * u_distortion * 0.5;
    float dist = length(p - charge);
    float field = 0.01 / (dist * dist);
    float idx = mod(fi, 5.0);
    vec3 c = idx < 1.0 ? u_c1 : idx < 2.0 ? u_c2 : idx < 3.0 ? u_c3 : idx < 4.0 ? u_c4 : u_c5;
    col += c * field;
  }
  fragColor = vec4(tanh(col * 0.5), 1.0);
}`,
  },
  {
    id: 'prism',
    name: 'Prism Refraction',
    fragmentShader: `#version 300 es
precision highp float;
uniform vec2 r;
uniform float t;
uniform vec3 u_c1, u_c2, u_c3, u_c4, u_c5;
uniform float u_zoom, u_complexity, u_speed, u_distortion;
out vec4 fragColor;
void main() {
  vec2 p = (gl_FragCoord.xy * 2.0 - r) / min(r.x, r.y) * u_zoom;
  float time = t * u_speed;
  vec3 col = vec3(0.0);
  float offset = u_distortion * 0.02;
  for(int i = 0; i < 5; i++) {
    vec2 refract = p + vec2(sin(time + float(i)), cos(time + float(i))) * offset * float(i);
    float pattern = sin(refract.x * u_complexity * 0.1 + time) * cos(refract.y * u_complexity * 0.1);
    pattern = pattern * 0.5 + 0.5;
    if(i == 0) col.r += pattern * 0.4;
    if(i == 1) col.g += pattern * 0.4;
    if(i == 2) col.b += pattern * 0.4;
  }
  fragColor = vec4(col, 1.0);
}`,
  },
  {
    id: 'nebula',
    name: 'Cosmic Nebula',
    fragmentShader: `#version 300 es
precision highp float;
uniform vec2 r;
uniform float t;
uniform vec3 u_c1, u_c2, u_c3, u_c4, u_c5;
uniform float u_zoom, u_complexity, u_speed, u_distortion;
out vec4 fragColor;
void main() {
  vec2 p = (gl_FragCoord.xy * 2.0 - r) / min(r.x, r.y) * u_zoom;
  float time = t * u_speed;
  vec3 col = vec3(0.0);
  for(int i = 0; i < 120; i++) {
    if(float(i) >= u_complexity) break;
    float fi = float(i);
    float angle = fi * 0.1 + time * 0.5;
    vec2 swirl = vec2(sin(angle), cos(angle)) * (fi * 0.01);
    p += swirl * u_distortion * 0.001;
    p = abs(p) / dot(p, p) - 0.5;
    float idx = mod(fi, 5.0);
    vec3 c = idx < 1.0 ? u_c1 : idx < 2.0 ? u_c2 : idx < 3.0 ? u_c3 : idx < 4.0 ? u_c4 : u_c5;
    col += c * 0.005 / length(p);
  }
  fragColor = vec4(col, 1.0);
}`,
  },
  {
    id: 'tron',
    name: 'Tron Grid',
    fragmentShader: `#version 300 es
precision highp float;
uniform vec2 r;
uniform float t;
uniform vec3 u_c1, u_c2, u_c3, u_c4, u_c5;
uniform float u_zoom, u_complexity, u_speed, u_distortion;
out vec4 fragColor;
void main() {
  vec2 p = gl_FragCoord.xy / r * u_zoom * 20.0;
  float time = t * u_speed;
  vec2 grid = abs(fract(p) - 0.5);
  float lines = min(grid.x, grid.y);
  lines = smoothstep(0.05, 0.0, lines);
  float pulse = sin(p.x + p.y - time * 5.0) * 0.5 + 0.5;
  lines *= pulse * (1.0 + u_distortion * 0.1);
  vec3 col = u_c1 * lines + u_c2 * (1.0 - lines) * 0.1;
  fragColor = vec4(col, 1.0);
}`,
  },
  {
    id: 'fiber',
    name: 'Fiber Optics',
    fragmentShader: `#version 300 es
precision highp float;
uniform vec2 r;
uniform float t;
uniform vec3 u_c1, u_c2, u_c3, u_c4, u_c5;
uniform float u_zoom, u_complexity, u_speed, u_distortion;
out vec4 fragColor;
void main() {
  vec2 p = gl_FragCoord.xy / r;
  float time = t * u_speed;
  vec3 col = vec3(0.0);
  for(float i = 0.0; i < 40.0; i++) {
    if(i >= u_complexity * 0.4) break;
    float y = i / 40.0;
    float wave = sin(p.x * 20.0 + i * 0.5 + time * 2.0) * 0.02 * u_distortion;
    float fiber = smoothstep(0.005, 0.0, abs(p.y - y - wave));
    float pulse = sin(time * 3.0 - i * 0.2) * 0.5 + 0.5;
    float idx = mod(i, 5.0);
    vec3 c = idx < 1.0 ? u_c1 : idx < 2.0 ? u_c2 : idx < 3.0 ? u_c3 : idx < 4.0 ? u_c4 : u_c5;
    col += c * fiber * pulse;
  }
  fragColor = vec4(col, 1.0);
}`,
  },
  {
    id: 'mirror',
    name: 'Mirror Kaleidoscope',
    fragmentShader: `#version 300 es
precision highp float;
uniform vec2 r;
uniform float t;
uniform vec3 u_c1, u_c2, u_c3, u_c4, u_c5;
uniform float u_zoom, u_complexity, u_speed, u_distortion;
out vec4 fragColor;
void main() {
  vec2 p = (gl_FragCoord.xy * 2.0 - r) / min(r.x, r.y) * u_zoom;
  float time = t * u_speed;
  p = abs(p);
  vec3 col = vec3(0.0);
  for(int i = 0; i < 60; i++) {
    if(float(i) >= u_complexity * 0.6) break;
    float fi = float(i);
    p = abs(p) / dot(p, p) - vec2(sin(time * 0.2 + fi * 0.05), cos(time * 0.3 + fi * 0.07)) * u_distortion * 0.1;
    float idx = mod(fi, 5.0);
    vec3 c = idx < 1.0 ? u_c1 : idx < 2.0 ? u_c2 : idx < 3.0 ? u_c3 : idx < 4.0 ? u_c4 : u_c5;
    col += c * 0.015 / length(p);
  }
  fragColor = vec4(col, 1.0);
}`,
  },
  {
    id: 'lava',
    name: 'Lava Lamp',
    fragmentShader: `#version 300 es
precision highp float;
uniform vec2 r;
uniform float t;
uniform vec3 u_c1, u_c2, u_c3, u_c4, u_c5;
uniform float u_zoom, u_complexity, u_speed, u_distortion;
out vec4 fragColor;
void main() {
  vec2 p = gl_FragCoord.xy / r * u_zoom;
  float time = t * u_speed;
  vec3 col = vec3(0.0);
  for(float i = 0.0; i < 8.0; i++) {
    if(i >= u_complexity * 0.08) break;
    vec2 blob = vec2(
      0.5 + sin(time * 0.3 + i) * 0.3,
      0.3 + sin(time * 0.2 + i * 0.7) * 0.4 + i * 0.1
    ) * u_distortion;
    float dist = length(p - blob);
    float bubble = smoothstep(0.3, 0.0, dist) * u_zoom;
    float idx = mod(i, 5.0);
    vec3 c = idx < 1.0 ? u_c1 : idx < 2.0 ? u_c2 : idx < 3.0 ? u_c3 : idx < 4.0 ? u_c4 : u_c5;
    col += c * bubble;
  }
  fragColor = vec4(col, 1.0);
}`,
  },
  {
    id: 'spiral',
    name: 'Hypnotic Spiral',
    fragmentShader: `#version 300 es
precision highp float;
uniform vec2 r;
uniform float t;
uniform vec3 u_c1, u_c2, u_c3, u_c4, u_c5;
uniform float u_zoom, u_complexity, u_speed, u_distortion;
out vec4 fragColor;
void main() {
  vec2 p = (gl_FragCoord.xy * 2.0 - r) / min(r.x, r.y) * u_zoom;
  float time = t * u_speed;
  float angle = atan(p.y, p.x);
  float radius = length(p);
  float spiral = mod(angle + radius * u_complexity * 0.1 - time, 0.5);
  spiral = smoothstep(0.45, 0.5, spiral);
  spiral *= (1.0 + u_distortion * 0.1) / (radius + 0.5);
  float idx = mod(radius * 10.0, 5.0);
  vec3 c = idx < 1.0 ? u_c1 : idx < 2.0 ? u_c2 : idx < 3.0 ? u_c3 : idx < 4.0 ? u_c4 : u_c5;
  fragColor = vec4(c * spiral, 1.0);
}`,
  },
  {
    id: 'glowsticks',
    name: 'Glowstick Dance',
    fragmentShader: `#version 300 es
precision highp float;
uniform vec2 r;
uniform float t;
uniform vec3 u_c1, u_c2, u_c3, u_c4, u_c5;
uniform float u_zoom, u_complexity, u_speed, u_distortion;
out vec4 fragColor;
void main() {
  vec2 p = gl_FragCoord.xy / r;
  float time = t * u_speed;
  vec3 col = vec3(0.0);
  for(float i = 0.0; i < 20.0; i++) {
    if(i >= u_complexity * 0.2) break;
    float angle = time + i * 0.5;
    vec2 pos = vec2(0.5 + sin(angle) * 0.3, 0.5 + cos(angle * 0.7) * 0.3) * u_distortion;
    float trail = length(p - pos) * u_zoom * 20.0;
    trail = smoothstep(1.0, 0.0, trail);
    float idx = mod(i, 5.0);
    vec3 c = idx < 1.0 ? u_c1 : idx < 2.0 ? u_c2 : idx < 3.0 ? u_c3 : idx < 4.0 ? u_c4 : u_c5;
    col += c * trail;
  }
  fragColor = vec4(col, 1.0);
}`,
  },
  {
    id: 'matrix-code',
    name: 'Matrix Code',
    fragmentShader: `#version 300 es
precision highp float;
uniform vec2 r;
uniform float t;
uniform vec3 u_c1, u_c2, u_c3, u_c4, u_c5;
uniform float u_zoom, u_complexity, u_speed, u_distortion;
out vec4 fragColor;
void main() {
  vec2 p = gl_FragCoord.xy / r;
  float time = t * u_speed;
  vec2 grid = floor(p * 30.0 * u_zoom);
  float symbol = fract(sin(dot(grid, vec2(12.9898, 78.233)) + time * 0.5 * u_distortion) * 43758.5453);
  symbol = step(0.7, symbol);
  float fade = fract(time * 0.2 + grid.y * 0.1);
  fade = 1.0 - fade;
  vec3 col = u_c1 * symbol * fade;
  fragColor = vec4(col, 1.0);
}`,
  },
  {
    id: 'constellation',
    name: 'Star Constellation',
    fragmentShader: `#version 300 es
precision highp float;
uniform vec2 r;
uniform float t;
uniform vec3 u_c1, u_c2, u_c3, u_c4, u_c5;
uniform float u_zoom, u_complexity, u_speed, u_distortion;
out vec4 fragColor;
void main() {
  vec2 p = gl_FragCoord.xy / r;
  float time = t * u_speed;
  vec3 col = vec3(0.0);
  for(float i = 0.0; i < 50.0; i++) {
    if(i >= u_complexity * 0.5) break;
    vec2 star = vec2(fract(sin(i * 12.9898) * 43758.5453), fract(cos(i * 78.233) * 43758.5453));
    star += vec2(sin(time * 0.1 + i), cos(time * 0.1 + i)) * 0.02 * u_distortion;
    float dist = length(p - star) * u_zoom * 100.0;
    float brightness = smoothstep(2.0, 0.0, dist);
    float twinkle = sin(time * 2.0 + i) * 0.3 + 0.7;
    float idx = mod(i, 5.0);
    vec3 c = idx < 1.0 ? u_c1 : idx < 2.0 ? u_c2 : idx < 3.0 ? u_c3 : idx < 4.0 ? u_c4 : u_c5;
    col += c * brightness * twinkle;
  }
  fragColor = vec4(col, 1.0);
}`,
  },
  {
    id: 'ripple',
    name: 'Water Ripples',
    fragmentShader: `#version 300 es
precision highp float;
uniform vec2 r;
uniform float t;
uniform vec3 u_c1, u_c2, u_c3, u_c4, u_c5;
uniform float u_zoom, u_complexity, u_speed, u_distortion;
out vec4 fragColor;
void main() {
  vec2 p = gl_FragCoord.xy / r;
  float time = t * u_speed;
  vec3 col = vec3(0.0);
  for(float i = 0.0; i < 10.0; i++) {
    if(i >= u_complexity * 0.1) break;
    vec2 center = vec2(0.5 + sin(time + i * 2.0) * 0.2, 0.5 + cos(time + i * 1.5) * 0.2) * u_distortion;
    float dist = length(p - center) * u_zoom * 5.0;
    float ripple = sin(dist * 10.0 - time * 3.0) * 0.5 + 0.5;
    ripple *= smoothstep(2.0, 0.0, dist);
    float idx = mod(i, 5.0);
    vec3 c = idx < 1.0 ? u_c1 : idx < 2.0 ? u_c2 : idx < 3.0 ? u_c3 : idx < 4.0 ? u_c4 : u_c5;
    col += c * ripple;
  }
  fragColor = vec4(col, 1.0);
}`,
  },
  {
    id: 'bokeh',
    name: 'Bokeh Lights',
    fragmentShader: `#version 300 es
precision highp float;
uniform vec2 r;
uniform float t;
uniform vec3 u_c1, u_c2, u_c3, u_c4, u_c5;
uniform float u_zoom, u_complexity, u_speed, u_distortion;
out vec4 fragColor;
void main() {
  vec2 p = gl_FragCoord.xy / r;
  float time = t * u_speed;
  vec3 col = vec3(0.0);
  for(float i = 0.0; i < 30.0; i++) {
    if(i >= u_complexity * 0.3) break;
    vec2 pos = vec2(
      fract(sin(i * 12.9898) * 43758.5453 + time * 0.1),
      fract(cos(i * 78.233) * 43758.5453 + time * 0.15)
    );
    float dist = length(p - pos) * u_zoom * 10.0;
    float bokeh = smoothstep(1.0, 0.0, dist) * (1.0 + u_distortion * 0.1);
    float idx = mod(i, 5.0);
    vec3 c = idx < 1.0 ? u_c1 : idx < 2.0 ? u_c2 : idx < 3.0 ? u_c3 : idx < 4.0 ? u_c4 : u_c5;
    col += c * bokeh;
  }
  fragColor = vec4(col, 1.0);
}`,
  },
  {
    id: 'circuit-board',
    name: 'Circuit Board',
    fragmentShader: `#version 300 es
precision highp float;
uniform vec2 r;
uniform float t;
uniform vec3 u_c1, u_c2, u_c3, u_c4, u_c5;
uniform float u_zoom, u_complexity, u_speed, u_distortion;
out vec4 fragColor;
void main() {
  vec2 p = gl_FragCoord.xy / r * u_zoom * 15.0;
  float time = t * u_speed;
  vec2 grid = fract(p) - 0.5;
  float circuit = step(0.45, max(abs(grid.x), abs(grid.y)));
  vec2 id = floor(p);
  float data = fract(sin(dot(id, vec2(12.9898, 78.233)) + time * 0.5) * 43758.5453);
  float pulse = step(0.8, data) * (sin(time * 5.0) * 0.5 + 0.5);
  circuit += pulse * (1.0 + u_distortion * 0.1);
  vec3 col = mix(u_c1 * 0.1, u_c2, circuit);
  fragColor = vec4(col, 1.0);
}`,
  },
  {
    id: 'aurora-3d',
    name: '3D Aurora',
    fragmentShader: `#version 300 es
precision highp float;
uniform vec2 r;
uniform float t;
uniform vec3 u_c1, u_c2, u_c3, u_c4, u_c5;
uniform float u_zoom, u_complexity, u_speed, u_distortion;
out vec4 fragColor;
void main() {
  vec2 p = (gl_FragCoord.xy * 2.0 - r) / r.y * u_zoom;
  float time = t * u_speed;
  vec3 col = vec3(0.0);
  for(float i = 0.0; i < 8.0; i++) {
    if(i >= u_complexity * 0.08) break;
    float layer = i / 8.0;
    vec2 wave = p;
    wave.y += sin(p.x * 3.0 + time + i) * 0.1 * u_distortion;
    float curtain = smoothstep(0.3, 0.0, abs(wave.y - layer * 2.0 + 1.0));
    float shimmer = sin(p.x * 10.0 + time * 2.0 + i) * 0.5 + 0.5;
    float idx = mod(i, 5.0);
    vec3 c = idx < 1.0 ? u_c1 : idx < 2.0 ? u_c2 : idx < 3.0 ? u_c3 : idx < 4.0 ? u_c4 : u_c5;
    col += c * curtain * shimmer;
  }
  fragColor = vec4(col, 1.0);
}`,
  },
  {
    id: 'fractal-tree',
    name: 'Fractal Tree',
    fragmentShader: `#version 300 es
precision highp float;
uniform vec2 r;
uniform float t;
uniform vec3 u_c1, u_c2, u_c3, u_c4, u_c5;
uniform float u_zoom, u_complexity, u_speed, u_distortion;
out vec4 fragColor;
void main() {
  vec2 p = (gl_FragCoord.xy * 2.0 - r) / r.y * u_zoom;
  float time = t * u_speed;
  p.y -= 0.5;
  vec3 col = vec3(0.0);
  float angle = 1.57;
  for(int i = 0; i < 100; i++) {
    if(float(i) >= u_complexity) break;
    angle += sin(time * 0.5 + float(i) * 0.1) * u_distortion * 0.5;
    p = abs(p);
    p = p * 1.2 - vec2(0.3, 0.5);
    p *= mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
    float idx = mod(float(i) * 0.5, 5.0);
    vec3 c = idx < 1.0 ? u_c1 : idx < 2.0 ? u_c2 : idx < 3.0 ? u_c3 : idx < 4.0 ? u_c4 : u_c5;
    col += c * 0.01 / (length(p) + 0.1);
  }
  fragColor = vec4(col, 1.0);
}`,
  },
  {
    id: 'magnetic',
    name: 'Magnetic Field',
    fragmentShader: `#version 300 es
precision highp float;
uniform vec2 r;
uniform float t;
uniform vec3 u_c1, u_c2, u_c3, u_c4, u_c5;
uniform float u_zoom, u_complexity, u_speed, u_distortion;
out vec4 fragColor;
void main() {
  vec2 p = (gl_FragCoord.xy * 2.0 - r) / min(r.x, r.y) * u_zoom;
  float time = t * u_speed;
  vec3 col = vec3(0.0);
  vec2 mag1 = vec2(-0.5 + sin(time) * 0.1, 0.0);
  vec2 mag2 = vec2(0.5 - sin(time) * 0.1, 0.0);
  for(float i = 0.0; i < 60.0; i++) {
    if(i >= u_complexity * 0.6) break;
    float fi = float(i);
    vec2 field = normalize(p - mag1) / length(p - mag1) - normalize(p - mag2) / length(p - mag2);
    p += field * 0.01 * u_distortion;
    float idx = mod(fi, 5.0);
    vec3 c = idx < 1.0 ? u_c1 : idx < 2.0 ? u_c2 : idx < 3.0 ? u_c3 : idx < 4.0 ? u_c4 : u_c5;
    col += c * 0.01 / length(field);
  }
  fragColor = vec4(col, 1.0);
}`,
  },
  {
    id: 'crystal-cave',
    name: 'Crystal Cave',
    fragmentShader: `#version 300 es
precision highp float;
uniform vec2 r;
uniform float t;
uniform vec3 u_c1, u_c2, u_c3, u_c4, u_c5;
uniform float u_zoom, u_complexity, u_speed, u_distortion;
out vec4 fragColor;
void main() {
  vec2 p = (gl_FragCoord.xy * 2.0 - r) / min(r.x, r.y) * u_zoom;
  float time = t * u_speed;
  vec3 col = vec3(0.0);
  for(int i = 0; i < 80; i++) {
    if(float(i) >= u_complexity * 0.8) break;
    float fi = float(i);
    float angle = fi * 0.5 + time * 0.1;
    p = abs(p);
    p = p * 1.1 - vec2(sin(angle) * 0.3, cos(angle) * 0.3) * u_distortion;
    float idx = mod(fi, 5.0);
    vec3 c = idx < 1.0 ? u_c1 : idx < 2.0 ? u_c2 : idx < 3.0 ? u_c3 : idx < 4.0 ? u_c4 : u_c5;
    col += c * 0.008 / (length(p) + 0.05);
  }
  fragColor = vec4(col, 1.0);
}`,
  },
  {
    id: 'dissolve',
    name: 'Pixel Dissolve',
    fragmentShader: `#version 300 es
precision highp float;
uniform vec2 r;
uniform float t;
uniform vec3 u_c1, u_c2, u_c3, u_c4, u_c5;
uniform float u_zoom, u_complexity, u_speed, u_distortion;
out vec4 fragColor;
void main() {
  vec2 p = gl_FragCoord.xy / r;
  float time = t * u_speed;
  vec2 pixelated = floor(p * 50.0 * u_zoom) / (50.0 * u_zoom);
  float noise = fract(sin(dot(pixelated, vec2(12.9898, 78.233)) + time) * 43758.5453);
  float dissolve = smoothstep(0.3, 0.7, sin(time * 2.0 + noise * 6.28) * 0.5 + 0.5);
  dissolve *= 1.0 + u_distortion * 0.1;
  float idx = mod(noise * 5.0, 5.0);
  vec3 c = idx < 1.0 ? u_c1 : idx < 2.0 ? u_c2 : idx < 3.0 ? u_c3 : idx < 4.0 ? u_c4 : u_c5;
  vec3 col = c * dissolve;
  fragColor = vec4(col, 1.0);
}`,
  },
];

const vertexShaderSource = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}`;

const GlitchForge: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedAnimation, setSelectedAnimation] = useState<Animation>(animations[0]);
  const [params, setParams] = useState<ShaderParams>({
    colors: ['#ccff00', '#ff00ff', '#00ffff', '#ff6600', '#0066ff'],
    complexity: 80,
    zoom: 1.5,
    speed: 1,
    distortion: 1,
    customParams: {},
  });
  const [layers, setLayers] = useState<Layer[]>([
    {
      id: '1',
      type: 'text',
      text: 'GLITCH // FORGE',
      x: 50,
      y: 50,
      size: 48,
      font: 'monospace',
      weight: 700,
      opacity: 1,
      rotation: 0,
      color: '#ccff00',
      textAlign: 'center',
      letterSpacing: 2,
      lineHeight: 1.2,
      textShadow: '0 0 10px rgba(204, 255, 0, 0.5)',
    },
  ]);
  const [selectedLayerId, setSelectedLayerId] = useState<string>('1');
  const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const [showGrid, setShowGrid] = useState<boolean>(false);
  const [customFontUrl, setCustomFontUrl] = useState<string>('');
  const [loadedFontName, setLoadedFontName] = useState<string>('');
  const glRef = useRef<WebGL2RenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const animationFrameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl2');
    if (!gl) {
      alert('WebGL2 not supported');
      return;
    }
    glRef.current = gl;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const gl = glRef.current;
    if (!gl) return;

    if (programRef.current) {
      gl.deleteProgram(programRef.current);
    }

    const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fragmentShader, selectedAnimation.fragmentShader);
    gl.compileShader(fragmentShader);

    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
      console.error('Fragment shader error:', gl.getShaderInfoLog(fragmentShader));
      return;
    }

    const program = gl.createProgram()!;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    programRef.current = program;

    const positions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const positionLoc = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    const render = () => {
      if (!gl || !programRef.current) return;

      gl.useProgram(programRef.current);

      const time = (Date.now() - startTimeRef.current) / 1000;
      const canvas = canvasRef.current!;

      gl.uniform2f(gl.getUniformLocation(programRef.current, 'r'), canvas.width, canvas.height);
      gl.uniform1f(gl.getUniformLocation(programRef.current, 't'), time);

      const hexToRgb = (hex: string) => {
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;
        return [r, g, b];
      };

      params.colors.forEach((color, i) => {
        const rgb = hexToRgb(color);
        gl.uniform3f(gl.getUniformLocation(programRef.current!, `u_c${i + 1}`), rgb[0], rgb[1], rgb[2]);
      });

      gl.uniform1f(gl.getUniformLocation(programRef.current, 'u_zoom'), params.zoom);
      gl.uniform1f(gl.getUniformLocation(programRef.current, 'u_complexity'), params.complexity);
      gl.uniform1f(gl.getUniformLocation(programRef.current, 'u_speed'), params.speed);
      gl.uniform1f(gl.getUniformLocation(programRef.current, 'u_distortion'), params.distortion);

      selectedAnimation.customParams?.forEach((param) => {
        const value = params.customParams?.[param.name] ?? param.default;
        gl.uniform1f(gl.getUniformLocation(programRef.current!, param.uniform), value);
      });

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [selectedAnimation, params]);

  const handlePointerDown = (e: React.PointerEvent, layerId: string) => {
    const layer = layers.find((l) => l.id === layerId);
    if (!layer) return;

    e.preventDefault();
    e.stopPropagation();

    const rect = e.currentTarget.getBoundingClientRect();
    setDragging({
      id: layerId,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
    });
    setSelectedLayerId(layerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;

    const x = ((e.clientX - dragging.offsetX) / window.innerWidth) * 100;
    const y = ((e.clientY - dragging.offsetY) / window.innerHeight) * 100;

    setLayers((prev) =>
      prev.map((layer) =>
        layer.id === dragging.id ? { ...layer, x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) } : layer
      )
    );
  };

  const handlePointerUp = () => {
    setDragging(null);
  };

  const addLayer = (type: 'text' | 'button') => {
    const newLayer: Layer = {
      id: Date.now().toString(),
      type,
      text: type === 'text' ? 'NEW_LAYER' : 'CLICK_ME',
      x: 50,
      y: 50,
      size: type === 'text' ? 32 : 16,
      font: 'monospace',
      weight: 700,
      opacity: 1,
      rotation: 0,
      color: '#ffffff',
      textAlign: 'center',
      letterSpacing: 1,
      lineHeight: 1.2,
      textShadow: '0 0 5px rgba(255, 255, 255, 0.5)',
      ...(type === 'button' && {
        buttonProps: {
          width: 200,
          height: 50,
          bgColor: '#ccff00',
          borderRadius: 5,
          borderWidth: 2,
          borderColor: '#000000',
          url: '',
          target: '_self',
        },
      }),
    };
    setLayers([...layers, newLayer]);
    setSelectedLayerId(newLayer.id);
  };

  const deleteLayer = () => {
    if (layers.length <= 1) return;
    setLayers(layers.filter((l) => l.id !== selectedLayerId));
    setSelectedLayerId(layers[0].id);
  };

  const updateLayer = (updates: Partial<Layer>) => {
    setLayers((prev) => prev.map((layer) => (layer.id === selectedLayerId ? { ...layer, ...updates } : layer)));
  };

  const applyButtonPreset = (preset: string) => {
    const selectedLayer = layers.find((l) => l.id === selectedLayerId);
    if (!selectedLayer || selectedLayer.type !== 'button') return;

    const presets: Record<string, Partial<Layer>> = {
      neon: {
        buttonProps: {
          ...selectedLayer.buttonProps!,
          bgColor: '#ccff00',
          borderRadius: 25,
          borderWidth: 3,
          borderColor: '#ccff00',
        },
        color: '#000000',
        textShadow: '0 0 20px rgba(204, 255, 0, 0.8)',
      },
      glitch: {
        buttonProps: {
          ...selectedLayer.buttonProps!,
          bgColor: '#ff00ff',
          borderRadius: 0,
          borderWidth: 4,
          borderColor: '#00ffff',
        },
        color: '#ffffff',
        textShadow: '2px 2px 0 #00ffff, -2px -2px 0 #ff00ff',
      },
      minimal: {
        buttonProps: {
          ...selectedLayer.buttonProps!,
          bgColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: 8,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.3)',
        },
        color: '#ffffff',
        textShadow: 'none',
      },
      gradient: {
        buttonProps: {
          ...selectedLayer.buttonProps!,
          bgColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 12,
          borderWidth: 0,
          borderColor: 'transparent',
        },
        color: '#ffffff',
        textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
      },
    };

    if (presets[preset]) {
      updateLayer(presets[preset]);
    }
  };

  // ROBUST FONT LOADER: Correctly handles Google Fonts (via CSS injection) and direct file URLs (via FontFace API)
  const loadFontFromCDN = async () => {
    if (!customFontUrl.trim()) return;

    try {
      const isGoogleFont = customFontUrl.includes('fonts.googleapis.com');
      const isCSS = isGoogleFont || customFontUrl.toLowerCase().split('?')[0].endsWith('.css');
      
      if (isCSS) {
        // Inject a link tag for CSS-based font providers
        const linkId = 'glitch-forge-custom-font';
        let link = document.getElementById(linkId) as HTMLLinkElement;
        if (!link) {
          link = document.createElement('link');
          link.id = linkId;
          link.rel = 'stylesheet';
          document.head.appendChild(link);
        }
        link.href = customFontUrl;

        // Extract family name using URL API for robustness
        let guessedName = 'External Font';
        try {
          const urlObj = new URL(customFontUrl);
          const family = urlObj.searchParams.get('family');
          if (family) {
            guessedName = family.split(':')[0].replace(/\+/g, ' ');
          }
        } catch (e) {
          // Fallback if URL parsing fails
          const match = customFontUrl.match(/family=([^&:]+)/);
          if (match) guessedName = decodeURIComponent(match[1].replace(/\+/g, ' '));
        }
        
        setLoadedFontName(guessedName);
        updateLayer({ font: guessedName });
      } else {
        // Direct font file loading (woff, ttf, etc)
        const fontName = `CustomFont-${Date.now()}`;
        const font = new FontFace(fontName, `url(${customFontUrl})`);
        const loadedFont = await font.load();
        document.fonts.add(loadedFont);
        setLoadedFontName(fontName);
        updateLayer({ font: fontName });
      }
    } catch (error) {
      console.error('Failed to load font:', error);
      alert('Failed to load font from CDN. Please check the URL and ensure it allows CORS access.');
    }
  };

  const exportHTML = () => {
    const isCSS = customFontUrl && (customFontUrl.includes('fonts.googleapis.com') || customFontUrl.toLowerCase().includes('.css'));
    const fontLinkTag = isCSS ? `  <link rel="stylesheet" href="${customFontUrl}">` : '';
    const fontFaceStyle = (!isCSS && customFontUrl && loadedFontName) 
      ? `\n    @font-face { font-family: '${loadedFontName}'; src: url('${customFontUrl}'); }`
      : '';

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GLITCH // FORGE Export</title>
${fontLinkTag}
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { overflow: hidden; background: #000; font-family: sans-serif; touch-action: none; }
    canvas { position: fixed; top: 0; left: 0; width: 100%; height: 100%; }
    .layer { position: fixed; user-select: none; white-space: pre-wrap; z-index: 10; transform-origin: center; }
    .button-layer { display: flex; align-items: center; justify-content: center; cursor: pointer; text-decoration: none; }${fontFaceStyle}
  </style>
</head>
<body>
  <canvas id="canvas"></canvas>
  ${layers
    .map((layer) => {
      if (layer.type === 'text') {
        return `<div class="layer" style="left: ${layer.x}%; top: ${layer.y}%; font-size: ${layer.size}px; font-weight: ${layer.weight}; opacity: ${layer.opacity}; transform: translate(-50%, -50%) rotate(${layer.rotation}deg); color: ${layer.color}; text-align: ${layer.textAlign}; letter-spacing: ${layer.letterSpacing}px; line-height: ${layer.lineHeight}; text-shadow: ${layer.textShadow}; font-family: ${layer.font};">${layer.text}</div>`;
      } else {
        return `<a class="layer button-layer" href="${layer.buttonProps?.url || '#'}" target="${layer.buttonProps?.target || '_self'}" style="left: ${layer.x}%; top: ${layer.y}%; width: ${layer.buttonProps?.width}px; height: ${layer.buttonProps?.height}px; font-size: ${layer.size}px; font-weight: ${layer.weight}; opacity: ${layer.opacity}; transform: translate(-50%, -50%) rotate(${layer.rotation}deg); color: ${layer.color}; background: ${layer.buttonProps?.bgColor}; border-radius: ${layer.buttonProps?.borderRadius}px; border: ${layer.buttonProps?.borderWidth}px solid ${layer.buttonProps?.borderColor}; font-family: ${layer.font};">${layer.text}</a>`;
      }
    })
    .join('\n  ')}
  <script>
    const canvas = document.getElementById('canvas');
    const gl = canvas.getContext('webgl2');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, \`${vertexShaderSource}\`);
    gl.compileShader(vertexShader);
    
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, \`${selectedAnimation.fragmentShader}\`);
    gl.compileShader(fragmentShader);
    
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    const positions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    
    const positionLoc = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
    
    const startTime = Date.now();
    const colors = ${JSON.stringify(params.colors)};
    const complexity = ${params.complexity};
    const zoom = ${params.zoom};
    const speed = ${params.speed};
    const distortion = ${params.distortion};
    const customParams = ${JSON.stringify(params.customParams || {})};
    
    function hexToRgb(hex) {
      return [
        parseInt(hex.slice(1, 3), 16) / 255,
        parseInt(hex.slice(3, 5), 16) / 255,
        parseInt(hex.slice(5, 7), 16) / 255
      ];
    }
    
    function render() {
      gl.useProgram(program);
      const time = (Date.now() - startTime) / 1000;
      
      gl.uniform2f(gl.getUniformLocation(program, 'r'), canvas.width, canvas.height);
      gl.uniform1f(gl.getUniformLocation(program, 't'), time);
      
      colors.forEach((color, i) => {
        const rgb = hexToRgb(color);
        gl.uniform3f(gl.getUniformLocation(program, 'u_c' + (i + 1)), rgb[0], rgb[1], rgb[2]);
      });
      
      gl.uniform1f(gl.getUniformLocation(program, 'u_zoom'), zoom);
      gl.uniform1f(gl.getUniformLocation(program, 'u_complexity'), complexity);
      gl.uniform1f(gl.getUniformLocation(program, 'u_speed'), speed);
      gl.uniform1f(gl.getUniformLocation(program, 'u_distortion'), distortion);
      
      ${
        selectedAnimation.customParams
          ?.map((param) => {
            const value = params.customParams?.[param.name] ?? param.default;
            return `gl.uniform1f(gl.getUniformLocation(program, '${param.uniform}'), ${value});`;
          })
          .join('\n      ') || ''
      }
      
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      requestAnimationFrame(render);
    }
    
    render();
    
    window.addEventListener('resize', () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    });
  </script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'glitch-forge-export.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectedLayer = layers.find((l) => l.id === selectedLayerId);

  return (
    <div
      className="fixed inset-0 bg-black overflow-hidden touch-none"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <canvas ref={canvasRef} className="fixed inset-0" />

      {/* Design Grid Overlay */}
      {showGrid && (
        <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 10 }}>
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(204, 255, 0, 0.15)" strokeWidth="0.5" />
              </pattern>
              <pattern id="grid-major" width="100" height="100" patternUnits="userSpaceOnUse">
                <rect width="100" height="100" fill="url(#grid)" />
                <path d="M 100 0 L 0 0 0 100" fill="none" stroke="rgba(204, 255, 0, 0.25)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-major)" />
            <line x1="50%" y1="0" x2="50%" y2="100%" stroke="rgba(204, 255, 0, 0.3)" strokeWidth="1" strokeDasharray="5,5" />
            <line x1="0" y1="50%" x2="100%" y2="50%" stroke="rgba(204, 255, 0, 0.3)" strokeWidth="1" strokeDasharray="5,5" />
          </svg>
        </div>
      )}

      {/* UI Panels */}
      <div className="relative z-50 pointer-events-none h-full w-full">
        {/* Left Panel */}
        <Card className="absolute top-4 left-4 w-80 max-h-[calc(100vh-8rem)] bg-black/80 backdrop-blur-xl border-[#ccff00]/30 text-white p-4 overflow-y-auto pointer-events-auto shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-3 h-3 rounded-full bg-[#ccff00] animate-pulse" />
            <h1 className="text-sm font-black tracking-tighter uppercase italic">GLITCH // FORGE</h1>
          </div>

          <Tabs defaultValue="animations" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-neutral-900/50 mb-6">
              <TabsTrigger value="animations"><Zap className="w-3 h-3" /></TabsTrigger>
              <TabsTrigger value="visuals"><Palette className="w-3 h-3" /></TabsTrigger>
              <TabsTrigger value="palette"><Palette className="w-3 h-3" /></TabsTrigger>
              <TabsTrigger value="motion"><Zap className="w-3 h-3" /></TabsTrigger>
            </TabsList>

            <TabsContent value="animations" className="space-y-6">
              <div className="space-y-2">
                <Label>Animation Style</Label>
                <Select value={selectedAnimation.id} onValueChange={(id) => setSelectedAnimation(animations.find((a) => a.id === id)!)}>
                  {animations.map((anim) => (
                    <SelectItem key={anim.id} value={anim.id}>{anim.name}</SelectItem>
                  ))}
                </Select>
              </div>

              {selectedAnimation.customParams?.map((param) => (
                <div key={param.name} className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label>{param.label}</Label>
                    <span className="text-[10px] text-[#ccff00]">{(params.customParams?.[param.name] ?? param.default).toFixed(2)}</span>
                  </div>
                  <Slider
                    value={[params.customParams?.[param.name] ?? param.default]}
                    onValueChange={([value]) =>
                      setParams((prev) => ({
                        ...prev,
                        customParams: { ...prev.customParams, [param.name]: value },
                      }))
                    }
                    min={param.min}
                    max={param.max}
                    step={(param.max - param.min) / 100}
                  />
                </div>
              ))}
            </TabsContent>

            <TabsContent value="visuals" className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label>Complexity</Label>
                  <span className="text-[10px] text-[#ccff00]">{params.complexity}</span>
                </div>
                <Slider value={[params.complexity]} onValueChange={([v]) => setParams({ ...params, complexity: v })} min={10} max={150} />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label>Zoom</Label>
                  <span className="text-[10px] text-[#ccff00]">{params.zoom.toFixed(1)}</span>
                </div>
                <Slider value={[params.zoom]} onValueChange={([v]) => setParams({ ...params, zoom: v })} min={0.1} max={5} step={0.1} />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label>Distortion</Label>
                  <span className="text-[10px] text-[#ccff00]">{params.distortion.toFixed(1)}</span>
                </div>
                <Slider value={[params.distortion]} onValueChange={([v]) => setParams({ ...params, distortion: v })} min={-5} max={5} step={0.1} />
              </div>
            </TabsContent>

            <TabsContent value="palette" className="space-y-4">
              <Label>Core Palette</Label>
              <div className="grid grid-cols-5 gap-2">
                {params.colors.map((color, i) => (
                  <Input
                    key={i}
                    type="color"
                    value={color}
                    onChange={(e) => {
                      const newColors = [...params.colors];
                      newColors[i] = e.target.value;
                      setParams({ ...params, colors: newColors });
                    }}
                    className="h-10 w-10 p-1 border-none bg-transparent"
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="motion" className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label>Flow Speed</Label>
                  <span className="text-[10px] text-[#ccff00]">{params.speed.toFixed(1)}</span>
                </div>
                <Slider value={[params.speed]} onValueChange={([v]) => setParams({ ...params, speed: v })} min={0} max={3} step={0.1} />
              </div>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Right Panel: Layer Editor */}
        {selectedLayer && (
          <Card className="absolute top-4 right-4 w-80 max-h-[calc(100vh-8rem)] bg-black/80 backdrop-blur-xl border-[#ccff00]/30 text-white p-4 overflow-y-auto pointer-events-auto shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xs font-black tracking-widest uppercase">Layer Properties</h2>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={() => addLayer('text')}><Type className="w-3.5 h-3.5" /></Button>
                <Button size="icon" variant="ghost" onClick={() => addLayer('button')}><Plus className="w-3.5 h-3.5" /></Button>
                <Button size="icon" variant="ghost" onClick={deleteLayer} disabled={layers.length <= 1}><Trash2 className="w-3.5 h-3.5" /></Button>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Content</Label>
                <Input value={selectedLayer.text} onChange={(e) => updateLayer({ text: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Scale</Label>
                  <Input type="number" value={selectedLayer.size} onChange={(e) => updateLayer({ size: Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>Rotate</Label>
                  <Input type="number" value={selectedLayer.rotation} onChange={(e) => updateLayer({ rotation: Number(e.target.value) })} />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Opacity</Label>
                <Slider value={[selectedLayer.opacity]} onValueChange={([v]) => updateLayer({ opacity: v })} min={0} max={1} step={0.01} />
              </div>

              <div className="space-y-2">
                <Label>Tint</Label>
                <Input type="color" value={selectedLayer.color} onChange={(e) => updateLayer({ color: e.target.value })} className="h-10 p-1 border-none bg-transparent" />
              </div>

              <div className="space-y-2">
                <Label>External Font (URL)</Label>
                <div className="flex gap-2">
                  <Input
                    value={customFontUrl}
                    onChange={(e) => setCustomFontUrl(e.target.value)}
                    placeholder="Google Fonts CSS link"
                    className="text-[10px]"
                  />
                  <Button onClick={loadFontFromCDN} size="sm">LOAD</Button>
                </div>
                {loadedFontName && <p className="text-[10px] text-[#ccff00]">Loaded: {loadedFontName}</p>}
              </div>

              {selectedLayer.type === 'button' && selectedLayer.buttonProps && (
                <div className="pt-4 border-t border-white/10 space-y-6">
                   <Label className="text-[#ccff00]">Button Control</Label>
                   <div className="grid grid-cols-2 gap-2">
                    {['neon', 'glitch', 'minimal', 'gradient'].map(p => (
                      <Button key={p} onClick={() => applyButtonPreset(p)} variant="outline" size="sm" className="text-[9px]">{p}</Button>
                    ))}
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Width</Label>
                      <Input type="number" value={selectedLayer.buttonProps.width} onChange={e => updateLayer({ buttonProps: { ...selectedLayer.buttonProps!, width: Number(e.target.value) }})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Height</Label>
                      <Input type="number" value={selectedLayer.buttonProps.height} onChange={e => updateLayer({ buttonProps: { ...selectedLayer.buttonProps!, height: Number(e.target.value) }})} />
                    </div>
                   </div>

                   <div className="space-y-2">
                    <Label>Destination</Label>
                    <Input value={selectedLayer.buttonProps.url} onChange={e => updateLayer({ buttonProps: { ...selectedLayer.buttonProps!, url: e.target.value }})} placeholder="https://..." />
                   </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Floating Action Buttons */}
        <div className="absolute bottom-6 right-6 flex gap-4 pointer-events-auto">
          <Button onClick={() => setShowGrid(!showGrid)} variant="outline">
            <Grid3x3 className="w-4 h-4 mr-2" />
            GRID {showGrid ? 'OFF' : 'ON'}
          </Button>
          <Button onClick={exportHTML}>
            <Download className="w-4 h-4 mr-2" />
            EXPORT BUILD
          </Button>
        </div>
      </div>

      {/* Canvas Layers: Render the editable components */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 30 }}>
        {layers.map((layer) => (
          <div
            key={layer.id}
            onPointerDown={(e) => handlePointerDown(e, layer.id)}
            className="fixed cursor-move pointer-events-auto transition-shadow"
            style={{
              left: `${layer.x}%`,
              top: `${layer.y}%`,
              fontSize: `${layer.size}px`,
              fontWeight: layer.weight,
              opacity: layer.opacity,
              transform: `translate(-50%, -50%) rotate(${layer.rotation}deg)`,
              color: layer.color,
              textAlign: (layer.textAlign || 'center') as any,
              letterSpacing: `${layer.letterSpacing}px`,
              lineHeight: layer.lineHeight,
              textShadow: layer.textShadow,
              boxShadow: layer.id === selectedLayerId ? '0 0 0 2px #ccff00' : 'none',
              fontFamily: layer.font,
              width: layer.type === 'button' ? `${layer.buttonProps?.width}px` : 'auto',
              height: layer.type === 'button' ? `${layer.buttonProps?.height}px` : 'auto',
              background: layer.type === 'button' ? layer.buttonProps?.bgColor : 'transparent',
              borderRadius: layer.type === 'button' ? `${layer.buttonProps?.borderRadius}px` : '0',
              border: layer.type === 'button' ? `${layer.buttonProps?.borderWidth}px solid ${layer.buttonProps?.borderColor}` : 'none',
              display: layer.type === 'button' ? 'flex' : 'block',
              alignItems: 'center',
              justifyContent: 'center',
              userSelect: 'none',
              whiteSpace: 'pre-wrap',
            }}
          >
            {layer.text}
          </div>
        ))}
      </div>
    </div>
  );
};

export default GlitchForge;
