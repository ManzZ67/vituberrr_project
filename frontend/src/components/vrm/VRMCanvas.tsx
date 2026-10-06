'use client';

import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { VRM, VRMLoaderPlugin, VRMUtils, VRMExpressionPresetName } from '@pixiv/three-vrm';
import { VRMEmotion, CameraPreset, BackgroundTheme } from '@/types/vrm';

export interface VRMCanvasRef {
  playAudio: (audioSrc: string, onEnd?: () => void) => Promise<void>;
  setEmotion: (emotion: VRMEmotion) => void;
  setCameraPreset: (preset: CameraPreset) => void;
  loadModel: (urlOrFile: string | File) => Promise<void>;
  resetCamera: () => void;
  stopAudio: () => void;
}

interface VRMCanvasProps {
  modelUrl?: string;
  theme?: BackgroundTheme;
  currentEmotion?: VRMEmotion;
  onModelLoaded?: (name: string) => void;
  onLoadingProgress?: (progress: number) => void;
}

const CAMERA_POSITIONS = {
  face: { pos: new THREE.Vector3(0, 1.45, 0.7), target: new THREE.Vector3(0, 1.4, 0) },
  bust: { pos: new THREE.Vector3(0, 1.25, 1.3), target: new THREE.Vector3(0, 1.1, 0) },
  full: { pos: new THREE.Vector3(0, 0.9, 2.5), target: new THREE.Vector3(0, 0.8, 0) },
};

export const VRMCanvas = forwardRef<VRMCanvasRef, VRMCanvasProps>(({
  modelUrl = '/models/avatar.vrm',
  theme = 'cyberpunk',
  currentEmotion = 'happy',
  onModelLoaded,
  onLoadingProgress,
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Three.js instances
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const vrmRef = useRef<VRM | null>(null);
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());

  // Audio & Lip sync
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const isPlayingAudioRef = useRef<boolean>(false);

  // Expression & Animation state
  const targetEmotionRef = useRef<VRMEmotion>(currentEmotion);
  const blinkTimerRef = useRef<number>(0);
  const nextBlinkRef = useRef<number>(3.0);
  const mousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingPercent, setLoadingPercent] = useState<number>(0);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    playAudio: async (audioSrc: string, onEnd?: () => void) => {
      try {
        if (!audioRef.current) {
          audioRef.current = new Audio();
          audioRef.current.crossOrigin = 'anonymous';
        }

        // Initialize AudioContext on user gesture
        if (!audioContextRef.current) {
          const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          const ctx = new AudioContextClass();
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 512;
          analyser.smoothingTimeConstant = 0.5;

          const source = ctx.createMediaElementSource(audioRef.current);
          source.connect(analyser);
          analyser.connect(ctx.destination);

          audioContextRef.current = ctx;
          analyserRef.current = analyser;
          audioSourceRef.current = source;
        }

        if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
        }

        audioRef.current.src = audioSrc;
        audioRef.current.onended = () => {
          isPlayingAudioRef.current = false;
          if (onEnd) onEnd();
        };

        isPlayingAudioRef.current = true;
        await audioRef.current.play();
      } catch (err) {
        console.error('Audio playback failed:', err);
        isPlayingAudioRef.current = false;
        if (onEnd) onEnd();
      }
    },
    stopAudio: () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        isPlayingAudioRef.current = false;
      }
    },
    setEmotion: (emotion: VRMEmotion) => {
      targetEmotionRef.current = emotion;
    },
    setCameraPreset: (preset: CameraPreset) => {
      const config = CAMERA_POSITIONS[preset] || CAMERA_POSITIONS.bust;
      if (cameraRef.current && controlsRef.current) {
        cameraRef.current.position.copy(config.pos);
        controlsRef.current.target.copy(config.target);
        controlsRef.current.update();
      }
    },
    resetCamera: () => {
      if (cameraRef.current && controlsRef.current) {
        cameraRef.current.position.set(0, 1.35, 1.2);
        controlsRef.current.target.set(0, 1.25, 0);
        controlsRef.current.update();
      }
    },
    loadModel: async (urlOrFile: string | File) => {
      await loadVRMModel(urlOrFile);
    },
  }));

  // Update target emotion if prop changes
  useEffect(() => {
    targetEmotionRef.current = currentEmotion;
  }, [currentEmotion]);

  // Load VRM Model
  const loadVRMModel = async (source: string | File) => {
    if (!sceneRef.current) return;
    setIsLoading(true);
    setLoadError(null);
    setLoadingPercent(0);

    let modelUrl = '';
    let isObjectUrl = false;

    if (typeof source === 'string') {
      modelUrl = source;
    } else if (source instanceof File) {
      modelUrl = URL.createObjectURL(source);
      isObjectUrl = true;
    }

    try {
      const loader = new GLTFLoader();
      loader.register((parser) => new VRMLoaderPlugin(parser));

      loader.load(
        modelUrl,
        (gltf) => {
          // Remove old VRM
          if (vrmRef.current && sceneRef.current) {
            sceneRef.current.remove(vrmRef.current.scene);
            VRMUtils.deepDispose(vrmRef.current.scene);
            vrmRef.current = null;
          }

          const vrm = gltf.userData.vrm as VRM;
          if (!vrm) {
            throw new Error('File does not contain valid VRM data');
          }

          // Optimize VRM
          VRMUtils.removeUnnecessaryVertices(gltf.scene);
          VRMUtils.removeUnnecessaryJoints(gltf.scene);

          // Rotate VRM 1.0 models to face camera if needed
          VRMUtils.rotateVRM0(vrm);

          // Enable shadows
          vrm.scene.traverse((obj) => {
            obj.frustumCulled = false;
            if ((obj as THREE.Mesh).isMesh) {
              obj.castShadow = true;
              obj.receiveShadow = true;
            }
          });

          sceneRef.current?.add(vrm.scene);
          vrmRef.current = vrm;

          // Default initial pose
          if (vrm.humanoid) {
            const leftUpperArm = vrm.humanoid.getNormalizedBoneNode('leftUpperArm');
            const rightUpperArm = vrm.humanoid.getNormalizedBoneNode('rightUpperArm');
            if (leftUpperArm) leftUpperArm.rotation.z = THREE.MathUtils.degToRad(-65);
            if (rightUpperArm) rightUpperArm.rotation.z = THREE.MathUtils.degToRad(65);
          }

          setIsLoading(false);
          setLoadingPercent(100);
          if (onModelLoaded) onModelLoaded(typeof source === 'string' ? source.split('/').pop() || 'Avatar' : source.name);

          if (isObjectUrl) {
            URL.revokeObjectURL(modelUrl);
          }
        },
        (progress) => {
          if (progress.total > 0) {
            const pct = Math.round((progress.loaded / progress.total) * 100);
            setLoadingPercent(pct);
            if (onLoadingProgress) onLoadingProgress(pct);
          }
        },
        (error) => {
          console.error('Error loading VRM:', error);
          setLoadError('Gagal memuat model VRM. Pastikan file valid.');
          setIsLoading(false);
        }
      );
    } catch (err) {
      console.error('Failed to setup VRM loader:', err);
      setLoadError('Terjadi kesalahan saat memuat VRM.');
      setIsLoading(false);
    }
  };

  // Initialize Three.js Scene
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(30.0, width / height, 0.1, 50.0);
    camera.position.set(0, 1.35, 1.25);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // 4. Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.screenSpacePanning = true;
    controls.target.set(0, 1.25, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 0.4;
    controls.maxDistance = 5.0;
    controls.maxPolarAngle = Math.PI / 2 + 0.1;
    controlsRef.current = controls;

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.8);
    mainLight.position.set(1.5, 3.0, 2.0);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 1024;
    mainLight.shadow.mapSize.height = 1024;
    mainLight.shadow.bias = -0.0001;
    scene.add(mainLight);

    const rimLight = new THREE.DirectionalLight(0x70d6ff, 1.2);
    rimLight.position.set(-2.0, 2.0, -2.0);
    scene.add(rimLight);

    const fillLight = new THREE.DirectionalLight(0xff70a6, 0.8);
    fillLight.position.set(0, -1.0, 1.5);
    scene.add(fillLight);

    // Initial model load
    loadVRMModel(modelUrl);

    // Mouse move tracking
    const handleMouseMove = (e: MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mousePosRef.current = { x, y };
    };

    const container = containerRef.current;
    container.addEventListener('mousemove', handleMouseMove);

    // Resize handler
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const delta = clockRef.current.getDelta();
      const elapsed = clockRef.current.getElapsedTime();

      controls.update();

      const vrm = vrmRef.current;
      if (vrm) {
        // --- 1. Natural Idle Movement (Breathing & Head sway) ---
        if (vrm.humanoid) {
          const spine = vrm.humanoid.getNormalizedBoneNode('spine');
          const chest = vrm.humanoid.getNormalizedBoneNode('chest');
          const neck = vrm.humanoid.getNormalizedBoneNode('neck');
          const head = vrm.humanoid.getNormalizedBoneNode('head');

          const breath = Math.sin(elapsed * 2.0) * 0.02;
          const sway = Math.sin(elapsed * 0.8) * 0.03;

          if (spine) {
            spine.rotation.x = breath * 0.5;
            spine.rotation.y = sway * 0.3;
          }
          if (chest) {
            chest.rotation.x = breath * 0.8;
          }
          if (neck) {
            neck.rotation.y = sway * 0.5;
          }
          if (head) {
            // Subtle mouse tracking for head
            const targetHeadX = mousePosRef.current.y * -0.15 + (Math.sin(elapsed * 1.5) * 0.02);
            const targetHeadY = mousePosRef.current.x * 0.25 + sway;
            head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, targetHeadX, 0.08);
            head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, targetHeadY, 0.08);
          }
        }

        // --- 2. Blinking System ---
        blinkTimerRef.current += delta;
        if (blinkTimerRef.current > nextBlinkRef.current) {
          // Blink duration ~ 0.15s
          const blinkProgress = (blinkTimerRef.current - nextBlinkRef.current) / 0.15;
          if (blinkProgress <= 1.0) {
            const blinkValue = Math.sin(blinkProgress * Math.PI);
            vrm.expressionManager?.setValue('blink', blinkValue);
          } else {
            vrm.expressionManager?.setValue('blink', 0);
            blinkTimerRef.current = 0;
            nextBlinkRef.current = 2.0 + Math.random() * 4.0; // Random interval
          }
        }

        // --- 3. Lip Sync (Audio Analyser) ---
        let mouthOpen = 0;
        let mouthForm = 'aa';

        if (isPlayingAudioRef.current && analyserRef.current) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);

          // Calculate average loudness
          let sum = 0;
          for (let i = 0; i < 32; i++) {
            sum += dataArray[i];
          }
          const avgLoudness = sum / 32;

          if (avgLoudness > 15) {
            mouthOpen = Math.min(1.0, (avgLoudness - 15) / 70);
            // Alternate vowels based on frequency harmonics
            const midFreq = dataArray[10] || 0;
            const highFreq = dataArray[20] || 0;

            if (highFreq > midFreq) {
              mouthForm = 'ee';
            } else if (midFreq > 60) {
              mouthForm = 'oh';
            } else {
              mouthForm = 'aa';
            }
          }
        }

        // Apply mouth blendshapes with smooth lerp
        const vowels: VRMExpressionPresetName[] = ['aa', 'ih', 'ou', 'ee', 'oh'];
        vowels.forEach((v) => {
          const currentVal = vrm.expressionManager?.getValue(v) || 0;
          const targetVal = v === mouthForm ? mouthOpen : 0;
          vrm.expressionManager?.setValue(v, THREE.MathUtils.lerp(currentVal, targetVal, 0.25));
        });

        // --- 4. Emotions / Expressions ---
        const activeEmotion = targetEmotionRef.current;
        const emotionList: { name: VRMExpressionPresetName; target: number }[] = [
          { name: 'happy', target: activeEmotion === 'happy' ? 1.0 : 0 },
          { name: 'angry', target: activeEmotion === 'angry' ? 1.0 : 0 },
          { name: 'sad', target: activeEmotion === 'sad' ? 1.0 : 0 },
          { name: 'surprised', target: activeEmotion === 'surprised' ? 1.0 : 0 },
          { name: 'relaxed', target: activeEmotion === 'relaxed' ? 1.0 : 0 },
        ];

        emotionList.forEach(({ name, target }) => {
          const currentVal = vrm.expressionManager?.getValue(name) || 0;
          vrm.expressionManager?.setValue(name, THREE.MathUtils.lerp(currentVal, target, 0.1));
        });

        vrm.expressionManager?.update();
        vrm.update(delta);
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousemove', handleMouseMove);

      if (vrmRef.current && sceneRef.current) {
        sceneRef.current.remove(vrmRef.current.scene);
        VRMUtils.deepDispose(vrmRef.current.scene);
      }
      renderer.dispose();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Background Theme Styling
  const getBackgroundStyle = () => {
    switch (theme) {
      case 'cyberpunk':
        return 'bg-gradient-to-b from-[#0b0c16] via-[#120e29] to-[#080711]';
      case 'cozy':
        return 'bg-gradient-to-b from-[#1e1a2f] via-[#2d2244] to-[#171324]';
      case 'neon-dark':
        return 'bg-gradient-to-b from-[#050508] via-[#090a14] to-[#020204]';
      case 'chroma-green':
        return 'bg-[#00ff00]';
      case 'transparent':
        return 'bg-transparent';
      default:
        return 'bg-[#0a0a0f]';
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden select-none transition-colors duration-500 ${getBackgroundStyle()}`}
    >
      {/* 3D WebGL Canvas */}
      <canvas ref={canvasRef} className="w-full h-full block touch-none cursor-grab active:cursor-grabbing" />

      {/* Cyberpunk Background Grid & Glow (Hidden in OBS Chroma/Transparent) */}
      {theme !== 'chroma-green' && theme !== 'transparent' && (
        <>
          <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:32px_32px]" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/4 right-10 w-[400px] h-[400px] bg-fuchsia-500/10 rounded-full blur-3xl pointer-events-none" />
        </>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-md z-30 transition-opacity duration-300">
          <div className="relative w-20 h-20 mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20 animate-ping" />
            <div className="w-full h-full rounded-full border-4 border-t-cyan-400 border-r-fuchsia-500 border-b-transparent border-l-transparent animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center font-mono font-bold text-xs text-cyan-300">
              {loadingPercent}%
            </div>
          </div>
          <p className="text-white font-medium text-sm tracking-wider uppercase bg-gradient-to-r from-cyan-400 to-fuchsia-400 bg-clip-text text-transparent animate-pulse">
            Memuat Model 3D VRM...
          </p>
          <p className="text-zinc-400 text-xs mt-1">Menginisialisasi shader, blendshapes & rigging</p>
        </div>
      )}

      {/* Error Toast */}
      {loadError && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-red-500/90 text-white px-5 py-3 rounded-xl shadow-2xl backdrop-blur-md text-sm border border-red-400/30 flex items-center gap-3 z-40 animate-bounce">
          <span>⚠️ {loadError}</span>
          <button
            onClick={() => loadVRMModel(modelUrl)}
            className="px-2.5 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-semibold uppercase"
          >
            Coba Lagi
          </button>
        </div>
      )}
    </div>
  );
});

VRMCanvas.displayName = 'VRMCanvas';
