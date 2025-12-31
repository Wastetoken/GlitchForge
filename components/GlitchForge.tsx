import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { z } from 'zod';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Label } from './ui/Label';
import { Slider } from './ui/Slider';
import { Select, SelectItem } from './ui/Select';
import { Card } from './ui/Card';
import { Download, Plus, Trash2, Type, Palette, Zap, Grid3x3, Globe, ChevronLeft, ChevronRight, Maximize2, Code, ShieldCheck, AlertTriangle, FileCode, CheckCircle2 } from 'lucide-react';

/**
 * ELITE SCHEMA DEFINITIONS
 * Strict Zod schemas for all design data to ensure production-grade exports
 */
const LayerSchema = z.object({
  id: z.string(),
  type: z.enum(['text', 'button']),
  text: z.string().min(1),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  size: z.number().positive(),
  font: z.string(),
  weight: z.number().min(100).max(900),
  opacity: z.number().min(0).max(1),
  rotation: z.number(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$|^rgba?\(/),
  fontUrl: z.string().url().optional().or(z.literal('')),
  letterSpacing: z.number().optional(),
  buttonProps: z.object({
    width: z.number().positive(),
    height: z.number().positive(),
    bgColor: z.string(),
    borderRadius: z.number().min(0),
    borderWidth: z.number().min(0),
    borderColor: z.string(),
    url: z.string(),
    target: z.string(),
  }).optional(),
});

type Layer = z.infer<typeof LayerSchema>;

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

/**
 * CORE ASSETS
 */
const standardFonts = [
  { name: 'Monospace', value: 'monospace' },
  { name: 'Sans-Serif', value: 'sans-serif' },
  { name: 'Serif', value: 'serif' },
  { name: 'Inter', value: '"Inter", sans-serif' },
  { name: 'Impact', value: 'Impact, sans-serif' },
  { name: 'Courier New', value: '"Courier New", monospace' },
  { name: 'Syncopate', value: '"Syncopate", sans-serif' },
  { name: 'Bebas Neue', value: '"Bebas Neue", sans-serif' },
  { name: 'Orbitron', value: '"Orbitron", sans-serif' },
  { name: 'Space Mono', value: '"Space Mono", monospace' },
];

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
    p = abs(p) / dot(p, p) - vec2(sin(time + float(i) * 0.1)) * u_distortion * 0.1;
    float idx = mod(float(i), 5.0);
    vec3 c = idx < 1.0 ? u_c1 : idx < 2.0 ? u_c2 : idx < 3.0 ? u_c3 : idx < 4.0 ? u_c4 : u_c5;
    col += c * 0.02 / (length(p) + 0.1);
  }
  fragColor = vec4(col, 1.0);
}`,
    customParams: [{ name: 'segments', label: 'Segments', min: 2, max: 12, default: 6, uniform: 'u_segments' }],
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
    float dist = abs(p.x - x) * u_density * 0.001;
    if(dist < 0.02 && p.y < y && p.y > y - 0.3) {
      col += (1.0 - (y - p.y) / 0.3) * smoothstep(0.02, 0.0, dist);
    }
  }
  vec3 c = mix(u_c1, u_c2, col);
  fragColor = vec4(c * col * (1.0 + u_distortion * 0.1), 1.0);
}`,
    customParams: [{ name: 'density', label: 'Column Density', min: 10, max: 100, default: 50, uniform: 'u_density' }],
  },
];

const vertexShaderSource = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}`;

/**
 * ELITE COMPONENT EXPORTER
 * Handles validation, highly optimized code generation, and export pipeline
 */
class GlitchExporter {
  static async validate(layers: any[]): Promise<Layer[]> {
    try {
      return layers.map(l => LayerSchema.parse(l));
    } catch (e) {
      console.error('Validation Error:', e);
      throw e;
    }
  }

  static generate(
    componentName: string, 
    layers: Layer[], 
    shader: Animation, 
    params: ShaderParams
  ): string {
    const fontUrls = Array.from(new Set(layers.map(l => l.fontUrl).filter(Boolean)));
    const paletteJson = JSON.stringify(params.colors);
    const layersJson = JSON.stringify(layers, null, 2);

    // Pre-parse palette into RGB components for zero runtime overhead in loop
    const parsedPalette = params.colors.map(color => ({
      r: parseInt(color.slice(1, 3), 16) / 255,
      g: parseInt(color.slice(3, 5), 16) / 255,
      b: parseInt(color.slice(5, 7), 16) / 255,
    }));

    return `/**
 * @generated ${new Date().toISOString()}
 * @tool GlitchForge Elite v2.3
 * @compatibility React 18.x | Next.js 14.x
 * @strict true
 */

'use client';

import React, { useEffect, useRef, useMemo, useCallback, useState } from 'react';

/**
 * STANDALONE INTERFACES
 */
interface LayerData {
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
  letterSpacing?: number;
  fontUrl?: string;
}

/**
 * HIGH-PERFORMANCE CONSTANTS
 * Defined outside the component to prevent expensive recreation
 */
const VERTEX_SHADER_SOURCE = \`${vertexShaderSource}\`;
const FRAGMENT_SHADER_SOURCE = \`${shader.fragmentShader}\`;
const PALETTE_RGB = ${JSON.stringify(parsedPalette)} as const;

/**
 * ${componentName}
 * A strictly-typed, production-grade WebGL2 effect engine
 */
export const ${componentName}: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const requestRef = useRef<number>();
  const startTimeRef = useRef<number>(Date.now());
  const [webglSupported, setWebglSupported] = useState(true);

  // --- Optimized Resize Handler ---
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl2');
    if (!gl) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // --- Dynamic Asset Injection ---
    ${fontUrls.map(url => `
    if (!document.querySelector('link[href="${url}"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = '${url}';
      document.head.appendChild(link);
    }`).join('\n')}

    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // WebGL2 Initialization with performance flags
    const gl = canvas.getContext('webgl2', { 
      antialias: true, 
      alpha: false,
      preserveDrawingBuffer: false, // Set to false for maximum performance
      powerPreference: 'high-performance'
    });
    
    if (!gl) {
      setWebglSupported(false);
      return;
    }

    const compileShader = (type: number, src: string): WebGLShader | null => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader Compile Log:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    // State Persistence for WebGL Resources
    let program: WebGLProgram | null = null;
    let vs: WebGLShader | null = null;
    let fs: WebGLShader | null = null;
    let vao: WebGLVertexArrayObject | null = null;
    let vbo: WebGLBuffer | null = null;
    
    // Uniform Location Caching Object
    let locs: any = {};

    const setupResources = () => {
      vs = compileShader(gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE);
      fs = compileShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SOURCE);
      if (!vs || !fs) return;

      program = gl.createProgram();
      if (!program) return;
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Program Link Log:', gl.getProgramInfoLog(program));
        return;
      }
      gl.useProgram(program);

      // Geometry Buffers
      const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
      vao = gl.createVertexArray();
      vbo = gl.createBuffer();
      gl.bindVertexArray(vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
      
      const posLoc = gl.getAttribLocation(program, 'position');
      gl.enableVertexAttribArray(posLoc);
      gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

      // Elite Uniform Caching
      locs = {
        r: gl.getUniformLocation(program, 'r'),
        t: gl.getUniformLocation(program, 't'),
        zoom: gl.getUniformLocation(program, 'u_zoom'),
        comp: gl.getUniformLocation(program, 'u_complexity'),
        speed: gl.getUniformLocation(program, 'u_speed'),
        dist: gl.getUniformLocation(program, 'u_distortion'),
        colors: PALETTE_RGB.map((_, i) => gl.getUniformLocation(program!, \`u_c\${i + 1}\`))
      };
    };

    setupResources();

    // --- WebGL Context Loss Handling ---
    const onContextLost = (e: Event) => {
      e.preventDefault();
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      console.warn('WebGL context lost');
    };

    const onContextRestored = () => {
      console.log('WebGL context restored - recovering...');
      setupResources();
      render();
    };

    canvas.addEventListener('webglcontextlost', onContextLost);
    canvas.addEventListener('webglcontextrestored', onContextRestored);

    handleResize();
    window.addEventListener('resize', handleResize);

    // --- High-Frequency Animation Pipeline ---
    const render = () => {
      if (!gl || !program) return;
      gl.useProgram(program);
      const t = (Date.now() - startTimeRef.current) / 1000;
      gl.uniform2f(locs.r, canvas.width, canvas.height);
      gl.uniform1f(locs.t, t);
      
      gl.uniform1f(locs.zoom, ${params.zoom});
      gl.uniform1f(locs.comp, ${params.complexity});
      gl.uniform1f(locs.speed, ${params.speed});
      gl.uniform1f(locs.dist, ${params.distortion});

      // Use pre-cached uniform locations and pre-parsed colors
      PALETTE_RGB.forEach((rgb, i) => {
        if (locs.colors[i]) gl.uniform3f(locs.colors[i], rgb.r, rgb.g, rgb.b);
      });

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      requestRef.current = requestAnimationFrame(render);
    };
    render();

    // --- Rigorous Cleanup ---
    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      canvas.removeEventListener('webglcontextrestored', onContextRestored);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (program) gl.deleteProgram(program);
      if (vs) gl.deleteShader(vs);
      if (fs) gl.deleteShader(fs);
      if (vbo) gl.deleteBuffer(vbo);
      if (vao) gl.deleteVertexArray(vao);
    };
  }, [handleResize]);

  // Read-only Layout State
  const layers: LayerData[] = useMemo(() => ${layersJson}, []);

  if (!webglSupported) {
    return (
      <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', color: '#fff', textAlign: 'center', fontFamily: 'sans-serif' }}>
        <div style={{ maxWidth: '400px' }}>
          <h2 style={{ color: '#ff4444' }}>WebGL2 Not Supported</h2>
          <p>This psychedelic layout engine requires WebGL2 to render its high-performance shaders.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden', zIndex: 0 }}>
      <canvas 
        ref={canvasRef} 
        style={{ display: 'block', width: '100%', height: '100%' }} 
      />
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {layers.map(l => (
          <div 
            key={l.id} 
            style={{
              position: 'fixed',
              left: \`\${l.x}%\`,
              top: \`\${l.y}%\`,
              transform: \`translate(-50%, -50%) rotate(\${l.rotation}deg)\`,
              opacity: l.opacity,
              color: l.color,
              fontSize: \`\${l.size}px\`,
              fontFamily: l.font,
              letterSpacing: \`\${l.letterSpacing || 0}px\`,
              fontWeight: l.weight || 700,
              whiteSpace: 'pre',
              pointerEvents: 'none',
              zIndex: 1
            }}
          >
            {l.text}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ${componentName};
`;
  }
}

/**
 * MAIN COMPONENT
 */
const GlitchForge: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedAnimation, setSelectedAnimation] = useState<Animation>(animations[0]);
  const [params, setParams] = useState<ShaderParams>({
    colors: ['#ccff00', '#ff00ff', '#00ffff', '#ff6600', '#0066ff'],
    complexity: 80, zoom: 1.5, speed: 1, distortion: 1, customParams: {},
  });
  const [layers, setLayers] = useState<Layer[]>([
    { id: '1', type: 'text', text: 'GLITCH // FORGE', x: 50, y: 50, size: 48, font: 'monospace', weight: 700, opacity: 1, rotation: 0, color: '#ccff00', letterSpacing: 2 },
  ]);
  const [selectedLayerId, setSelectedLayerId] = useState<string>('1');
  const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const [showGrid, setShowGrid] = useState<boolean>(false);
  const [tempFontUrl, setTempFontUrl] = useState<string>('');
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const glRef = useRef<WebGL2RenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const animationFrameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(Date.now());

  const selectedLayer = layers.find((l) => l.id === selectedLayerId);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl2', { antialias: true });
    if (!gl) return;
    glRef.current = gl;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  useEffect(() => {
    const gl = glRef.current;
    if (!gl) return;
    if (programRef.current) gl.deleteProgram(programRef.current);
    const vs = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vs, vertexShaderSource);
    gl.compileShader(vs);
    const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fs, selectedAnimation.fragmentShader);
    gl.compileShader(fs);
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    programRef.current = prog;
    const positions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'position');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const render = () => {
      if (!gl || !programRef.current) return;
      gl.useProgram(programRef.current);
      const t = (Date.now() - startTimeRef.current) / 1000;
      gl.uniform2f(gl.getUniformLocation(programRef.current, 'r'), window.innerWidth, window.innerHeight);
      gl.uniform1f(gl.getUniformLocation(programRef.current, 't'), t);
      params.colors.forEach((c, i) => {
        const r = parseInt(c.slice(1, 3), 16) / 255;
        const g = parseInt(c.slice(3, 5), 16) / 255;
        const b = parseInt(c.slice(5, 7), 16) / 255;
        gl.uniform3f(gl.getUniformLocation(programRef.current!, `u_c${i + 1}`), r, g, b);
      });
      gl.uniform1f(gl.getUniformLocation(programRef.current, 'u_zoom'), params.zoom);
      gl.uniform1f(gl.getUniformLocation(programRef.current, 'u_complexity'), params.complexity);
      gl.uniform1f(gl.getUniformLocation(programRef.current, 'u_speed'), params.speed);
      gl.uniform1f(gl.getUniformLocation(programRef.current, 'u_distortion'), params.distortion);
      selectedAnimation.customParams?.forEach(p => {
        gl.uniform1f(gl.getUniformLocation(programRef.current!, p.uniform), params.customParams?.[p.name] ?? p.default);
      });
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animationFrameRef.current = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [selectedAnimation, params]);

  const handlePointerDown = (e: React.PointerEvent, id: string) => {
    const l = layers.find(x => x.id === id);
    if (!l) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setDragging({ id, offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top });
    setSelectedLayerId(id);
    setTempFontUrl(l.fontUrl || '');
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const x = (e.clientX - dragging.offsetX) / window.innerWidth * 100;
    const y = (e.clientY - dragging.offsetY) / window.innerHeight * 100;
    setLayers(prev => prev.map(l => l.id === dragging.id ? { ...l, x, y } : l));
  };

  const updateLayer = (upd: Partial<Layer>) => {
    setLayers(prev => prev.map(l => l.id === selectedLayerId ? { ...l, ...upd } : l));
  };

  const addLayer = (type: 'text' | 'button') => {
    const id = Date.now().toString();
    const newLayer: Layer = {
      id, type, text: type === 'text' ? 'NEW TEXT' : 'CLICK ME', x: 50, y: 50, size: type === 'text' ? 48 : 24, font: 'monospace', weight: 700, opacity: 1, rotation: 0, color: '#ccff00', letterSpacing: 2
    };
    setLayers(prev => [...prev, newLayer]);
    setSelectedLayerId(id);
  };

  const deleteLayer = () => {
    if (layers.length <= 1) return;
    const remaining = layers.filter(l => l.id !== selectedLayerId);
    setLayers(remaining);
    if (remaining.length > 0) setSelectedLayerId(remaining[remaining.length - 1].id);
  };

  const loadFont = async () => {
    if (!tempFontUrl.trim() || !selectedLayer) return;
    const url = tempFontUrl.trim();
    try {
      const isCSS = url.includes('fonts.googleapis.com') || url.toLowerCase().split('?')[0].endsWith('.css');
      if (isCSS) {
        const linkId = `font-${url.replace(/[^a-zA-Z0-9]/g, '-')}`;
        if (!document.getElementById(linkId)) {
          const l = document.createElement('link'); l.id = linkId; l.rel = 'stylesheet'; l.href = url; document.head.appendChild(l);
        }
        let family = 'External Font';
        const m = url.match(/family=([^&:]+)/);
        if (m) family = decodeURIComponent(m[1].replace(/\+/g, ' '));
        updateLayer({ font: family, fontUrl: url });
      } else {
        const name = `ForgeFont-${Date.now()}`;
        const f = new FontFace(name, `url(${url})`);
        const lf = await f.load(); document.fonts.add(lf);
        updateLayer({ font: name, fontUrl: url });
      }
    } catch (e) { alert('Load failed.'); }
  };

  const executeEliteExport = useCallback(async () => {
    setExportLoading(true);
    setExportSuccess(false);
    try {
      const validatedData = await GlitchExporter.validate(layers);
      const componentName = `Glitch${selectedAnimation.id.charAt(0).toUpperCase()}${selectedAnimation.id.slice(1)}`;
      const tsx = GlitchExporter.generate(componentName, validatedData, selectedAnimation, params);

      const blob = new Blob([tsx], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${componentName}.tsx`;
      link.click();
      URL.revokeObjectURL(url);
      
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (err) {
      console.error('Elite export failed:', err);
      alert('Elite export failed. Please check the design data for schema violations.');
    } finally {
      setExportLoading(false);
    }
  }, [layers, params, selectedAnimation]);

  return (
    <div className="fixed inset-0 bg-black overflow-hidden" onPointerMove={handlePointerMove} onPointerUp={() => setDragging(null)}>
      <canvas ref={canvasRef} className="fixed inset-0" />
      {showGrid && <div className="fixed inset-0 pointer-events-none opacity-10" style={{ backgroundSize: '40px 40px', backgroundImage: 'linear-gradient(#ccff00 1px, transparent 1px), linear-gradient(90deg, #ccff00 1px, transparent 1px)' }} />}

      <div className="relative z-50 h-full flex p-3 gap-3 pointer-events-none items-start">
        {/* Engine Panel */}
        <div className={`panel-transition flex flex-col h-auto max-h-screen ${leftCollapsed ? '-translate-x-[calc(100%-35px)]' : 'translate-x-0'}`}>
          <Card className="w-64 bg-black/80 backdrop-blur-md border-[#ccff00]/20 p-2 h-auto flex flex-col pointer-events-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-1.5 mb-2">
              <span className="text-[10px] font-black tracking-widest text-[#ccff00] uppercase italic flex items-center gap-1"><Zap className="w-3 h-3" /> ENGINE</span>
              <Button size="icon" variant="ghost" onClick={() => setLeftCollapsed(!leftCollapsed)} className="h-5 w-5">
                {leftCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
              </Button>
            </div>
            {!leftCollapsed && (
              <div className="overflow-y-auto space-y-3 pr-1">
                <div className="space-y-1">
                  <Label className="text-[9px]">Effect Mode</Label>
                  <Select value={selectedAnimation.id} onValueChange={id => setSelectedAnimation(animations.find(a => a.id === id)!)}>
                    {animations.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                  </Select>
                </div>
                <div className="space-y-2 pb-2">
                  <Slider value={[params.speed]} onValueChange={([v]) => setParams({ ...params, speed: v })} min={0} max={4} step={0.1} />
                  <Slider value={[params.complexity]} onValueChange={([v]) => setParams({ ...params, complexity: v })} min={10} max={150} />
                </div>
                <div className="grid grid-cols-5 gap-1">
                  {params.colors.map((c, i) => (
                    <input key={i} type="color" value={c} onChange={e => { const nc = [...params.colors]; nc[i] = e.target.value; setParams({ ...params, colors: nc }); }} className="w-full h-5 bg-transparent border border-white/10 cursor-pointer p-0 rounded-sm" />
                  ))}
                </div>
                <div className="pt-2 flex flex-col gap-1.5 border-t border-white/5 pt-3">
                  <Button onClick={() => setShowGrid(!showGrid)} variant="outline" size="sm" className="h-7 text-[8px]"><Grid3x3 className="w-3 h-3 mr-1" /> GRID VIEW</Button>
                  <Button 
                    onClick={executeEliteExport} 
                    disabled={exportLoading}
                    size="sm" 
                    className={`h-7 text-[8px] transition-all active:scale-95 disabled:opacity-50 border ${exportSuccess ? 'bg-green-600/20 text-green-400 border-green-500/30' : 'bg-blue-600/20 text-blue-400 border-blue-500/30 hover:bg-blue-600/30'}`}
                  >
                    {exportLoading ? <Zap className="w-3 h-3 animate-spin mr-1" /> : (exportSuccess ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <FileCode className="w-3 h-3 mr-1" />)}
                    {exportSuccess ? 'EXPORTED' : 'EXPORT .TSX (ELITE)'}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>

        <div className="flex-1" />

        {/* Inspector Panel */}
        <div className={`panel-transition flex flex-col h-auto max-h-screen ${rightCollapsed ? 'translate-x-[calc(100%-35px)]' : 'translate-x-0'}`}>
          <Card className="w-64 bg-black/80 backdrop-blur-md border-[#ccff00]/20 p-2 h-auto flex flex-col pointer-events-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-1.5 mb-2">
              <span className="text-[10px] font-black tracking-widest text-white/40 uppercase italic">INSPECTOR</span>
              <div className="flex gap-1">
                {!rightCollapsed && (
                  <>
                    <Button size="icon" variant="ghost" onClick={() => addLayer('text')} className="h-5 w-5"><Type className="w-3 h-3" /></Button>
                    <Button size="icon" variant="ghost" onClick={deleteLayer} className="h-5 w-5 text-red-500/50"><Trash2 className="w-3 h-3" /></Button>
                  </>
                )}
                <Button size="icon" variant="ghost" onClick={() => setRightCollapsed(!rightCollapsed)} className="h-5 w-5">
                  {rightCollapsed ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </Button>
              </div>
            </div>
            {!rightCollapsed && selectedLayer && (
              <div className="overflow-y-auto space-y-3 pr-1 pb-1">
                <Input value={selectedLayer.text} onChange={e => updateLayer({ text: e.target.value })} className="h-6 text-[10px] py-1" />
                <Select value={selectedLayer.font} onValueChange={f => updateLayer({ font: f })}>{standardFonts.map(f => <SelectItem key={f.value} value={f.value}>{f.name}</SelectItem>)}</Select>
                <div className="flex gap-1">
                  <Input value={tempFontUrl} onChange={e => setTempFontUrl(e.target.value)} placeholder="CDN URL" className="text-[8px] h-5 flex-1" />
                  <Button onClick={loadFont} className="h-5 text-[7px] px-1.5 bg-[#ccff00]/10 text-[#ccff00] border border-[#ccff00]/20">LOAD</Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input type="number" value={selectedLayer.size} onChange={e => updateLayer({ size: +e.target.value })} className="h-6 text-[10px]" />
                  <Input type="number" value={selectedLayer.rotation} onChange={e => updateLayer({ rotation: +e.target.value })} className="h-6 text-[10px]" />
                </div>
                <Slider value={[selectedLayer.opacity]} onValueChange={([v]) => updateLayer({ opacity: v })} min={0} max={1} step={0.01} className="h-3" />
                <input type="color" value={selectedLayer.color} onChange={e => updateLayer({ color: e.target.value })} className="w-full h-6 bg-transparent border border-white/10 rounded-sm cursor-pointer p-0" />
              </div>
            )}
          </Card>
        </div>
      </div>

      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 60 }}>
        {layers.map(l => {
          const sel = l.id === selectedLayerId;
          const s: React.CSSProperties = { position: 'fixed', left: `${l.x}%`, top: `${l.y}%`, transform: `translate(-50%,-50%) rotate(${l.rotation}deg)`, opacity: l.opacity, color: l.color, fontSize: `${l.size}px`, fontFamily: l.font, letterSpacing: `${l.letterSpacing}px`, pointerEvents: 'auto', cursor: dragging?.id === l.id ? 'grabbing' : 'grab', userSelect: 'none', outline: sel ? '1px dashed #ccff00' : 'none', outlineOffset: '8px', whiteSpace: 'pre', fontWeight: 700, touchAction: 'none' };
          return <div key={l.id} onPointerDown={e => handlePointerDown(e, l.id)} style={s}>{l.text}</div>;
        })}
      </div>
    </div>
  );
};

export default GlitchForge;