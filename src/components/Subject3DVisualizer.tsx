import React, { useEffect, useRef, useState, useCallback, memo } from 'react';
import * as THREE from 'three';
import { RotateCw, Atom, Orbit, Compass, Maximize2, Minimize2, Sparkles, Eye } from 'lucide-react';

export type Subject3DType = 'physics' | 'chemistry' | 'math';

interface Subject3DVisualizerProps {
  initialSubject?: Subject3DType;
  theme?: 'glass' | 'slate' | 'cyber' | 'light';
  className?: string;
  onSubjectChange?: (subject: Subject3DType) => void;
}

/**
 * Subject3DVisualizer: Interactive, hardware-accelerated WebGL Three.js scientific visualizer.
 * Renders procedural 3D models for JEE subjects:
 * - Physics: Quantum Gravitational Gyroscope & Orbital Ring Dynamics
 * - Chemistry: Luminous Multi-Shell Bohr Atom with Racing Electrons
 * - Mathematics: Faceted Icosahedron & Hyperbolic Torus Knot
 */
export const Subject3DVisualizer = memo(function Subject3DVisualizer({
  initialSubject = 'physics',
  theme = 'glass',
  className = '',
  onSubjectChange,
}: Subject3DVisualizerProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [activeSubject, setActiveSubject] = useState<Subject3DType>(initialSubject);
  const [isRotating, setIsRotating] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // References for Three.js internals
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const subjectGroupRef = useRef<THREE.Group | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());

  // Interaction tracking (drag to rotate with damping)
  const isDraggingRef = useRef(false);
  const prevMousePosRef = useRef({ x: 0, y: 0 });
  const targetRotationRef = useRef({ x: 0, y: 0 });
  const currentRotationRef = useRef({ x: 0, y: 0 });

  // Update state when initialSubject prop changes
  useEffect(() => {
    setActiveSubject(initialSubject);
  }, [initialSubject]);

  const changeSubject = useCallback((sub: Subject3DType) => {
    setActiveSubject(sub);
    onSubjectChange?.(sub);
  }, [onSubjectChange]);

  // Build the 3D procedural scenes
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 320;
    const height = container.clientHeight || 260;

    // 1. Initialize Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 4.8);
    cameraRef.current = camera;

    // 2. High-performance WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    rendererRef.current = renderer;

    // Clear previous children and mount canvas
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // 3. Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.8);
    dirLight1.position.set(5, 8, 6);
    scene.add(dirLight1);

    const pointLight = new THREE.PointLight(
      theme === 'cyber' ? 0x10b981 : theme === 'slate' ? 0x38bdf8 : 0x818cf8,
      2.5,
      12
    );
    pointLight.position.set(0, 0, 2);
    scene.add(pointLight);

    // 4. Subject Model Root Group
    const rootGroup = new THREE.Group();
    scene.add(rootGroup);
    subjectGroupRef.current = rootGroup;

    // Procedural Model Generators:
    const buildPhysicsModel = () => {
      const g = new THREE.Group();

      // Core Celestial Sphere (Singularity)
      const coreGeo = new THREE.SphereGeometry(0.48, 32, 32);
      const coreMat = new THREE.MeshStandardMaterial({
        color: 0x6366f1,
        emissive: 0x4f46e5,
        emissiveIntensity: 0.6,
        roughness: 0.2,
        metalness: 0.8,
      });
      const core = new THREE.Mesh(coreGeo, coreMat);
      g.add(core);

      // Gyroscope Ring 1 (Equatorial)
      const ringGeo1 = new THREE.TorusGeometry(1.05, 0.035, 24, 80);
      const ringMat1 = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 0.35,
        metalness: 0.9,
        roughness: 0.2,
      });
      const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
      ring1.name = 'gyroRing1';
      g.add(ring1);

      // Gyroscope Ring 2 (Polar)
      const ringGeo2 = new THREE.TorusGeometry(1.35, 0.032, 24, 80);
      const ringMat2 = new THREE.MeshStandardMaterial({
        color: 0x818cf8,
        emissive: 0x4338ca,
        emissiveIntensity: 0.35,
        metalness: 0.9,
        roughness: 0.2,
      });
      const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
      ring2.rotation.x = Math.PI / 2;
      ring2.name = 'gyroRing2';
      g.add(ring2);

      // Gyroscope Ring 3 (Tilted Precession)
      const ringGeo3 = new THREE.TorusGeometry(1.65, 0.028, 24, 80);
      const ringMat3 = new THREE.MeshStandardMaterial({
        color: 0xa855f7,
        emissive: 0x7e22ce,
        emissiveIntensity: 0.4,
        metalness: 0.95,
        roughness: 0.15,
      });
      const ring3 = new THREE.Mesh(ringGeo3, ringMat3);
      ring3.rotation.y = Math.PI / 4;
      ring3.name = 'gyroRing3';
      g.add(ring3);

      // Orbiting Quantum Particle / Satellite
      const satGroup = new THREE.Group();
      satGroup.name = 'satGroup';
      const satGeo = new THREE.SphereGeometry(0.1, 16, 16);
      const satMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const sat = new THREE.Mesh(satGeo, satMat);
      sat.position.set(1.05, 0, 0);
      satGroup.add(sat);
      g.add(satGroup);

      // Celestial Orbit dust points
      const dustGeo = new THREE.BufferGeometry();
      const count = 120;
      const positions = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        const theta = Math.random() * Math.PI * 2;
        const rad = 1.0 + Math.random() * 0.75;
        positions[i * 3] = Math.cos(theta) * rad;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 0.4;
        positions[i * 3 + 2] = Math.sin(theta) * rad;
      }
      dustGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const dustMat = new THREE.PointsMaterial({
        color: 0x93c5fd,
        size: 0.035,
        transparent: true,
        opacity: 0.75,
      });
      const dustPoints = new THREE.Points(dustGeo, dustMat);
      dustPoints.name = 'dustPoints';
      g.add(dustPoints);

      return g;
    };

    const buildChemistryModel = () => {
      const g = new THREE.Group();

      // Nucleus Cluster (Protons & Neutrons)
      const nucleusGroup = new THREE.Group();
      nucleusGroup.name = 'nucleusGroup';

      const protonMat = new THREE.MeshStandardMaterial({
        color: 0xef4444,
        emissive: 0xb91c1c,
        emissiveIntensity: 0.5,
        roughness: 0.3,
        metalness: 0.6,
      });
      const neutronMat = new THREE.MeshStandardMaterial({
        color: 0x3b82f6,
        emissive: 0x1d4ed8,
        emissiveIntensity: 0.5,
        roughness: 0.3,
        metalness: 0.6,
      });

      const sphereGeo = new THREE.SphereGeometry(0.14, 24, 24);
      const coords = [
        [0.1, 0.08, 0],
        [-0.09, 0.1, 0.08],
        [0.05, -0.12, 0.06],
        [-0.1, -0.06, -0.08],
        [0.12, -0.02, -0.1],
        [-0.04, 0.12, -0.08],
      ];

      coords.forEach((c, idx) => {
        const mesh = new THREE.Mesh(sphereGeo, idx % 2 === 0 ? protonMat : neutronMat);
        mesh.position.set(c[0] * 1.5, c[1] * 1.5, c[2] * 1.5);
        nucleusGroup.add(mesh);
      });
      g.add(nucleusGroup);

      // Electron Orbital Shells (3 elliptical tilted orbits)
      const orbitColors = [0x34d399, 0x38bdf8, 0xf43f5e];
      const orbitRotations = [
        [Math.PI / 3, 0, Math.PI / 6],
        [-Math.PI / 3, Math.PI / 4, 0],
        [0, Math.PI / 2.5, -Math.PI / 4],
      ];

      orbitRotations.forEach((rot, i) => {
        const shellGroup = new THREE.Group();
        shellGroup.name = `shellGroup${i}`;
        shellGroup.rotation.set(rot[0], rot[1], rot[2]);

        const orbitTrackGeo = new THREE.TorusGeometry(1.25 + i * 0.15, 0.016, 16, 80);
        const orbitTrackMat = new THREE.MeshBasicMaterial({
          color: orbitColors[i],
          transparent: true,
          opacity: 0.35,
        });
        const trackMesh = new THREE.Mesh(orbitTrackGeo, orbitTrackMat);
        shellGroup.add(trackMesh);

        // Fast-revolving Electron Sphere
        const electronGeo = new THREE.SphereGeometry(0.085, 16, 16);
        const electronMat = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          emissive: orbitColors[i],
          emissiveIntensity: 0.9,
          roughness: 0.1,
        });
        const electron = new THREE.Mesh(electronGeo, electronMat);
        electron.name = `electron${i}`;
        electron.position.set(1.25 + i * 0.15, 0, 0);
        shellGroup.add(electron);

        g.add(shellGroup);
      });

      return g;
    };

    const buildMathModel = () => {
      const g = new THREE.Group();

      // Outer Faceted Glowing Icosahedron Wireframe
      const icosaGeo = new THREE.IcosahedronGeometry(1.4, 0);
      const wireframeMat = new THREE.MeshStandardMaterial({
        color: 0xa855f7,
        emissive: 0x7e22ce,
        emissiveIntensity: 0.4,
        wireframe: true,
        roughness: 0.2,
        metalness: 0.8,
      });
      const icosaWire = new THREE.Mesh(icosaGeo, wireframeMat);
      icosaWire.name = 'icosaWire';
      g.add(icosaWire);

      // Inner Hyperbolic Torus Knot
      const knotGeo = new THREE.TorusKnotGeometry(0.72, 0.18, 128, 20, 2, 3);
      const knotMat = new THREE.MeshStandardMaterial({
        color: 0x06b6d4,
        emissive: 0x0e7490,
        emissiveIntensity: 0.35,
        roughness: 0.15,
        metalness: 0.85,
      });
      const knotMesh = new THREE.Mesh(knotGeo, knotMat);
      knotMesh.name = 'knotMesh';
      g.add(knotMesh);

      // Vertex Highlight Spheres on Icosahedron
      const posAttr = icosaGeo.attributes.position;
      const vGeo = new THREE.SphereGeometry(0.05, 12, 12);
      const vMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const verticesGroup = new THREE.Group();
      verticesGroup.name = 'verticesGroup';

      for (let i = 0; i < posAttr.count; i++) {
        const vMesh = new THREE.Mesh(vGeo, vMat);
        vMesh.position.set(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i));
        verticesGroup.add(vMesh);
      }
      g.add(verticesGroup);

      return g;
    };

    // Load active subject
    const rebuildModel = (subject: Subject3DType) => {
      while (rootGroup.children.length > 0) {
        const obj = rootGroup.children[0];
        rootGroup.remove(obj);
      }

      if (subject === 'physics') {
        rootGroup.add(buildPhysicsModel());
      } else if (subject === 'chemistry') {
        rootGroup.add(buildChemistryModel());
      } else {
        rootGroup.add(buildMathModel());
      }
    };

    rebuildModel(activeSubject);

    // 5. Animation Render Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      const delta = clockRef.current.getDelta();
      const elapsed = clockRef.current.getElapsedTime();

      // Apply drag rotation with smooth damping
      currentRotationRef.current.x += (targetRotationRef.current.x - currentRotationRef.current.x) * 0.1;
      currentRotationRef.current.y += (targetRotationRef.current.y - currentRotationRef.current.y) * 0.1;

      if (isRotating && !isDraggingRef.current) {
        targetRotationRef.current.y += 0.012;
      }

      rootGroup.rotation.x = currentRotationRef.current.x;
      rootGroup.rotation.y = currentRotationRef.current.y;

      // Internal animated kinematics based on active subject
      if (activeSubject === 'physics') {
        const ring1 = rootGroup.getObjectByName('gyroRing1');
        const ring2 = rootGroup.getObjectByName('gyroRing2');
        const ring3 = rootGroup.getObjectByName('gyroRing3');
        const sat = rootGroup.getObjectByName('satGroup');
        const dust = rootGroup.getObjectByName('dustPoints');

        if (ring1) ring1.rotation.z += 0.025;
        if (ring2) ring2.rotation.x += 0.035;
        if (ring3) ring3.rotation.y += 0.018;
        if (sat) sat.rotation.z -= 0.045;
        if (dust) dust.rotation.y += 0.005;
      } else if (activeSubject === 'chemistry') {
        const nGroup = rootGroup.getObjectByName('nucleusGroup');
        if (nGroup) {
          nGroup.rotation.y += 0.01;
          nGroup.rotation.x = Math.sin(elapsed * 2) * 0.08;
        }

        // Rotate individual electron orbits
        for (let i = 0; i < 3; i++) {
          const shell = rootGroup.getObjectByName(`shellGroup${i}`);
          if (shell) {
            shell.rotation.z += (0.04 + i * 0.02) * (i % 2 === 0 ? 1 : -1);
          }
        }
      } else if (activeSubject === 'math') {
        const icosa = rootGroup.getObjectByName('icosaWire');
        const knot = rootGroup.getObjectByName('knotMesh');
        const vertices = rootGroup.getObjectByName('verticesGroup');

        if (icosa) icosa.rotation.y -= 0.008;
        if (knot) {
          knot.rotation.x += 0.015;
          knot.rotation.y += 0.02;
        }
        if (vertices) vertices.rotation.y -= 0.008;
      }

      renderer.render(scene, camera);
    };

    animate();
    animationFrameIdRef.current = animId;

    // Handle container resize
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const newW = container.clientWidth || 320;
      const newH = container.clientHeight || 260;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      scene.clear();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [activeSubject, isRotating, theme]);

  // Pointer / Touch drag controls
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    prevMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - prevMousePosRef.current.x;
    const deltaY = e.clientY - prevMousePosRef.current.y;
    prevMousePosRef.current = { x: e.clientX, y: e.clientY };

    targetRotationRef.current.y += deltaX * 0.012;
    targetRotationRef.current.x += deltaY * 0.012;
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 0) return;
    isDraggingRef.current = true;
    prevMousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || e.touches.length === 0) return;
    const deltaX = e.touches[0].clientX - prevMousePosRef.current.x;
    const deltaY = e.touches[0].clientY - prevMousePosRef.current.y;
    prevMousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };

    targetRotationRef.current.y += deltaX * 0.014;
    targetRotationRef.current.x += deltaY * 0.014;
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
  };

  const resetCamera = () => {
    targetRotationRef.current = { x: 0, y: 0 };
  };

  return (
    <div
      className={`relative rounded-2xl overflow-hidden border border-white/10 bg-slate-950/40 backdrop-blur-xl shadow-2xl transition-all duration-300 ${
        isFullscreen ? 'fixed inset-4 z-50 flex flex-col md:inset-10' : className
      }`}
    >
      {/* Visualizer Top Bar & Subject Selectors */}
      <div className="relative z-10 flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/[0.02]">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse shadow-sm shadow-indigo-500/50" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            3D Science Lab
          </span>
        </div>

        {/* Quick Subject Tabs */}
        <div className="flex items-center space-x-1 bg-black/40 p-1 rounded-xl border border-white/5">
          <button
            type="button"
            onClick={() => changeSubject('physics')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all duration-200 ${
              activeSubject === 'physics'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Orbit className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Physics</span>
          </button>

          <button
            type="button"
            onClick={() => changeSubject('chemistry')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all duration-200 ${
              activeSubject === 'chemistry'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Atom className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Chemistry</span>
          </button>

          <button
            type="button"
            onClick={() => changeSubject('math')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all duration-200 ${
              activeSubject === 'math'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Math</span>
          </button>
        </div>

        {/* Viewport Action Controls */}
        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={() => setIsRotating(!isRotating)}
            title={isRotating ? 'Pause rotation' : 'Resume auto-rotation'}
            className={`p-1.5 rounded-lg border text-xs transition-colors ${
              isRotating
                ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300'
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRotating ? 'animate-spin' : ''}`} style={{ animationDuration: '8s' }} />
          </button>

          <button
            type="button"
            onClick={resetCamera}
            title="Reset view orientation"
            className="p-1.5 rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit full view' : 'Expand full view'}
            className="p-1.5 rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 3D Canvas Container */}
      <div
        ref={mountRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="w-full flex-1 min-h-[220px] cursor-grab active:cursor-grabbing touch-none select-none relative"
      />

      {/* Interactive Helper Hint Badge */}
      <div className="absolute bottom-3 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
        <span className="text-[10px] font-mono text-slate-400/80 bg-black/40 backdrop-blur-md px-2 py-1 rounded-md border border-white/10">
          {activeSubject === 'physics'
            ? '🪐 Planetary Orbit & Gyroscopic Precession'
            : activeSubject === 'chemistry'
            ? '⚛️ Multi-Shell Bohr Quantum Atom'
            : '📐 Hyperbolic Torus Knot & Icosahedron'}
        </span>
        <span className="text-[10px] text-slate-400/60 hidden sm:inline">
          Drag to orbit 3D space
        </span>
      </div>
    </div>
  );
});

export default Subject3DVisualizer;
