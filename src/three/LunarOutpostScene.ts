import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { LANDING_SITES } from '../data/missionData';
import type { BuildingId, BuildingState, LandingSiteId } from '../types/game';
import {
  createEarthTexture,
  createHullPanelTexture,
  createLunarRegolithTextures,
  createRadialShadowTexture,
  createSolarCellTexture,
  groundHeightAt,
} from './proceduralAssets';

export interface SceneCallbacks {
  onSelectBuilding: (id: BuildingId | null) => void;
  onHoverBuilding: (id: BuildingId | null) => void;
}

export interface SceneSyncState {
  mode: 'title' | 'prep' | 'playing' | 'gameover';
  landingSite?: LandingSiteId;
  crewSize: number;
  crewSheltered: boolean;
  radiationRisk: number;
  selectedBuilding: BuildingId | null;
  buildings: Record<BuildingId, BuildingState>;
}

const BUILDING_LAYOUT: Record<BuildingId, { x: number; z: number; rotY: number; radius: number }> = {
  habitat: { x: 0, z: 0, rotY: 0.2, radius: 4.2 },
  solar: { x: -11.5, z: -6.5, rotY: 0.5, radius: 3.8 },
  greenhouse: { x: 9.5, z: -3.5, rotY: -0.35, radius: 3.4 },
  water: { x: 7.5, z: 6.5, rotY: 0.8, radius: 2.8 },
  oxygen: { x: -6.5, z: 7.2, rotY: -0.4, radius: 2.8 },
  comms: { x: -10.5, z: 2.5, rotY: 0.25, radius: 2.6 },
  shelter: { x: 1.5, z: -10.5, rotY: 0, radius: 3.4 },
  rover: { x: 12.5, z: 8.5, rotY: 0, radius: 2.2 },
  research: { x: -2.0, z: 10.8, rotY: 0.4, radius: 2.8 },
};

// Scratch math objects outside animation loop (Zero-GC)
const _vec3A = new THREE.Vector3();
const _vec3B = new THREE.Vector3();
const _mat4 = new THREE.Matrix4();
const _quat = new THREE.Quaternion();
const _scale = new THREE.Vector3();
const _color = new THREE.Color();

export class LunarOutpostScene {
  private container: HTMLElement;
  private callbacks: SceneCallbacks;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private isSoftwareGl: boolean;

  private frameId = 0;
  private disposed = false;
  private lastTime = performance.now();
  private elapsed = 0;

  private syncState: SceneSyncState = {
    mode: 'title',
    crewSize: 2,
    crewSheltered: false,
    radiationRisk: 18,
    selectedBuilding: null,
    buildings: {
      habitat: { id: 'habitat', efficiency: 1, upgraded: false, dustLevel: 5, powered: true, activeBoost: false },
      solar: { id: 'solar', efficiency: 1, upgraded: false, dustLevel: 12, powered: true, activeBoost: false },
      greenhouse: { id: 'greenhouse', efficiency: 1, upgraded: false, dustLevel: 0, powered: true, activeBoost: false },
      water: { id: 'water', efficiency: 1, upgraded: false, dustLevel: 0, powered: true, activeBoost: false },
      oxygen: { id: 'oxygen', efficiency: 1, upgraded: false, dustLevel: 0, powered: true, activeBoost: false },
      comms: { id: 'comms', efficiency: 1, upgraded: false, dustLevel: 0, powered: true, activeBoost: false },
      shelter: { id: 'shelter', efficiency: 1, upgraded: false, dustLevel: 0, powered: true, activeBoost: false },
      rover: { id: 'rover', efficiency: 1, upgraded: false, dustLevel: 8, powered: true, activeBoost: false },
      research: { id: 'research', efficiency: 1, upgraded: false, dustLevel: 0, powered: true, activeBoost: false },
    },
  };

  private buildingGroups = new Map<BuildingId, THREE.Group>();
  private hitboxes: THREE.Mesh[] = [];
  private selectionRing: THREE.Mesh;
  private hoverRing: THREE.Mesh;
  private solarWings: THREE.Object3D[] = [];
  private commsDish: THREE.Object3D | null = null;
  private drillHead: THREE.Object3D | null = null;
  private roverGroup: THREE.Group | null = null;
  private roverWheels: THREE.Object3D[] = [];
  private astronauts: Array<{ group: THREE.Group; phase: number; radius: number; speed: number; leftArm: THREE.Object3D; rightArm: THREE.Object3D; leftLeg: THREE.Object3D; rightLeg: THREE.Object3D }> = [];
  private beaconMeshes: THREE.Mesh[] = [];
  private sunLight: THREE.DirectionalLight;
  private terrainMat: THREE.MeshStandardMaterial | null = null;

  // Camera transition targets (exponential damping)
  private camGoalPos: THREE.Vector3 | null = null;
  private camGoalTarget: THREE.Vector3 | null = null;
  private keysPressed = new Set<string>();

  // Raycasting
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private pointerDownPos = { x: 0, y: 0 };
  private lastHoverCheck = 0;
  private hoveredId: BuildingId | null = null;

  // Disposable resources
  private geometries: THREE.BufferGeometry[] = [];
  private materials: THREE.Material[] = [];
  private textures: THREE.Texture[] = [];
  private envRenderTarget: THREE.WebGLRenderTarget;

  constructor(container: HTMLElement, callbacks: SceneCallbacks) {
    this.container = container;
    this.callbacks = callbacks;

    this.isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize(container.clientWidth || window.innerWidth, container.clientHeight || window.innerHeight);

    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x050812);
    this.scene.fog = new THREE.FogExp2(0x050812, 0.0085);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.envRenderTarget = pmrem.fromScene(new RoomEnvironment(), 0.04);
    this.scene.environment = this.envRenderTarget.texture;
    pmrem.dispose();

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(48, width / height, 0.3, 380);
    this.camera.position.set(29, 12.5, 0);
    this.camera.lookAt(0, 2.2, 0);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = !this.isSoftwareGl;
    this.controls.dampingFactor = 0.07;
    this.controls.minDistance = 9;
    this.controls.maxDistance = 54;
    this.controls.maxPolarAngle = Math.PI * 0.45;
    this.controls.minPolarAngle = 0.2;
    this.controls.target.set(0, 1.5, 0);

    // Cancel scripted fly-to when user drags/zooms
    this.controls.addEventListener('start', () => {
      this.camGoalPos = null;
      this.camGoalTarget = null;
    });

    // Studio & Polar Sunlight Rig (Warm key + Cool Hemisphere fill)
    this.sunLight = new THREE.DirectionalLight(0xfff1d6, 2.35);
    this.sunLight.position.set(34, 21, 18); // Low polar sun angle
    this.sunLight.castShadow = !this.isSoftwareGl;
    this.sunLight.shadow.mapSize.width = 1024;
    this.sunLight.shadow.mapSize.height = 1024;
    this.sunLight.shadow.camera.near = 2;
    this.sunLight.shadow.camera.far = 95;
    this.sunLight.shadow.camera.left = -28;
    this.sunLight.shadow.camera.right = 28;
    this.sunLight.shadow.camera.top = 28;
    this.sunLight.shadow.camera.bottom = -28;
    this.sunLight.shadow.bias = -0.0005;
    this.sunLight.shadow.normalBias = 0.02;
    this.scene.add(this.sunLight);

    const hemi = new THREE.HemisphereLight(0x7fb4ff, 0x1e2432, 0.72);
    this.scene.add(hemi);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.65);
    rimLight.position.set(-28, 12, -26);
    this.scene.add(rimLight);

    // Selection & Hover Rings
    const ringGeo = new THREE.RingGeometry(2.6, 2.95, 48);
    ringGeo.rotateX(-Math.PI / 2);
    this.geometries.push(ringGeo);

    const selMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee, side: THREE.DoubleSide, transparent: true, opacity: 0.9 });
    const hovMat = new THREE.MeshBasicMaterial({ color: 0x7dd3fc, side: THREE.DoubleSide, transparent: true, opacity: 0.55 });
    this.materials.push(selMat, hovMat);

    this.selectionRing = new THREE.Mesh(ringGeo, selMat);
    this.selectionRing.visible = false;
    this.scene.add(this.selectionRing);

    this.hoverRing = new THREE.Mesh(ringGeo, hovMat);
    this.hoverRing.visible = false;
    this.scene.add(this.hoverRing);

    // Build World
    this.buildSkyAndEarth();
    this.buildLunarTerrain();
    this.buildOutpostStructures();
    this.buildAstronauts();

    this.raycaster.layers.set(1);

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    this.renderer.render(this.scene, this.camera);
    this.bindEvents();
    this.tick();
  }

  private trackGeo<T extends THREE.BufferGeometry>(g: T): T {
    this.geometries.push(g);
    return g;
  }

  private trackMat<T extends THREE.Material>(m: T): T {
    this.materials.push(m);
    return m;
  }

  private trackTex<T extends THREE.Texture>(t: T): T {
    this.textures.push(t);
    return t;
  }

  private buildSkyAndEarth(): void {
    // Starfield Points
    const starCount = 950;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 0.92 + 0.05); // Mostly upper hemisphere
      const r = 155 + Math.random() * 35;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi);
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      const tint = 0.78 + Math.random() * 0.22;
      colors[i * 3] = tint;
      colors[i * 3 + 1] = tint;
      colors[i * 3 + 2] = 1.0;
    }
    const starGeo = this.trackGeo(new THREE.BufferGeometry());
    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const starMat = this.trackMat(
      new THREE.PointsMaterial({ size: 0.75, vertexColors: true, transparent: true, opacity: 0.9, fog: false }),
    );
    const stars = new THREE.Points(starGeo, starMat);
    this.scene.add(stars);

    // Distant Earth hanging over the lunar horizon
    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
    const earthTex = this.trackTex(createEarthTexture(maxAniso));
    const earthGeo = this.trackGeo(new THREE.SphereGeometry(9.5, 32, 24));
    const earthMat = this.trackMat(
      new THREE.MeshStandardMaterial({
        map: earthTex,
        color: 0xffffff,
        roughness: 0.65,
        metalness: 0.05,
        emissive: 0x0b2550,
        emissiveIntensity: 0.45,
        fog: false,
      }),
    );
    const earth = new THREE.Mesh(earthGeo, earthMat);
    earth.position.set(-76, 10, -24);
    earth.scale.setScalar(0.85);
    earth.rotation.z = 0.4;
    this.scene.add(earth);

    // Atmospheric halo around Earth
    const haloGeo = this.trackGeo(new THREE.SphereGeometry(10.1, 24, 18));
    const haloMat = this.trackMat(
      new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.16,
        side: THREE.BackSide,
        fog: false,
      }),
    );
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.position.copy(earth.position);
    halo.scale.setScalar(0.85);
    this.scene.add(halo);
  }

  private buildLunarTerrain(): void {
    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
    const { albedoMap, bumpMap } = createLunarRegolithTextures(maxAniso);
    this.trackTex(albedoMap);
    this.trackTex(bumpMap);

    const terrainGeo = this.trackGeo(new THREE.PlaneGeometry(180, 180, 68, 68));
    terrainGeo.rotateX(-Math.PI / 2);
    const pos = terrainGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      pos.setY(i, groundHeightAt(x, z));
    }
    terrainGeo.computeVertexNormals();

    const terrainMat = this.trackMat(
      new THREE.MeshStandardMaterial({
        map: albedoMap,
        bumpMap,
        bumpScale: 0.25,
        color: 0xffffff,
        roughness: 0.92,
        metalness: 0.04,
      }),
    );
    this.terrainMat = terrainMat;
    const terrain = new THREE.Mesh(terrainGeo, terrainMat);
    terrain.receiveShadow = !this.isSoftwareGl;
    this.scene.add(terrain);

    // Landing pad markings & rover path ring (offset >= 0.02 on Y)
    const padGeo = this.trackGeo(new THREE.RingGeometry(15.2, 16.0, 64));
    padGeo.rotateX(-Math.PI / 2);
    const padMat = this.trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x334155,
        roughness: 0.8,
        metalness: 0.2,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      }),
    );
    const padRing = new THREE.Mesh(padGeo, padMat);
    padRing.position.y = 0.03;
    padRing.receiveShadow = !this.isSoftwareGl;
    this.scene.add(padRing);

    // Instanced Lunar Rocks (85 boulders with subtle scale & tint variation)
    const rockGeo = this.trackGeo(new THREE.DodecahedronGeometry(0.65, 1));
    const rockMat = this.trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x7b8391,
        roughness: 0.9,
        metalness: 0.08,
        flatShading: true,
      }),
    );
    const rockCount = 85;
    const rocks = new THREE.InstancedMesh(rockGeo, rockMat, rockCount);
    rocks.castShadow = !this.isSoftwareGl;
    rocks.receiveShadow = !this.isSoftwareGl;

    for (let i = 0; i < rockCount; i++) {
      const angle = (i * 2.39996) % (Math.PI * 2);
      const dist = 18.5 + ((i * 7.3) % 44);
      const rx = Math.cos(angle) * dist;
      const rz = Math.sin(angle) * dist;
      const ry = groundHeightAt(rx, rz);
      const s = 0.55 + ((i * 19) % 10) * 0.14;
      _vec3A.set(rx, ry + s * 0.22, rz);
      _quat.setFromAxisAngle(_vec3B.set(0.3, 1, 0.2).normalize(), i * 0.8);
      _scale.set(s * 1.2, s * 0.72, s);
      _mat4.compose(_vec3A, _quat, _scale);
      rocks.setMatrixAt(i, _mat4);
      const shade = 0.75 + ((i * 13) % 10) * 0.04;
      _color.setRGB(shade, shade * 0.98, shade * 1.03);
      rocks.setColorAt(i, _color);
    }
    rocks.instanceMatrix.needsUpdate = true;
    if (rocks.instanceColor) rocks.instanceColor.needsUpdate = true;
    rocks.computeBoundingSphere();
    this.scene.add(rocks);
  }

  private addContactShadow(parent: THREE.Group, radius: number, shadowTex: THREE.Texture): void {
    const geo = this.trackGeo(new THREE.CircleGeometry(radius, 24));
    geo.rotateX(-Math.PI / 2);
    const mat = this.trackMat(
      new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        opacity: 0.6,
        depthWrite: false,
      }),
    );
    const disc = new THREE.Mesh(geo, mat);
    disc.position.y = 0.025;
    parent.add(disc);
  }

  private addHitbox(parent: THREE.Group, id: BuildingId, width: number, height: number, depth: number): void {
    const geo = this.trackGeo(new THREE.BoxGeometry(width, height, depth));
    const mat = this.trackMat(new THREE.MeshBasicMaterial({ visible: false }));
    const box = new THREE.Mesh(geo, mat);
    box.position.y = height / 2;
    box.layers.set(1);
    box.userData.buildingId = id;
    parent.add(box);
    this.hitboxes.push(box);
  }

  private buildOutpostStructures(): void {
    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
    const hullTex = this.trackTex(createHullPanelTexture(maxAniso));
    const solarTex = this.trackTex(createSolarCellTexture(maxAniso));
    const shadowTex = this.trackTex(createRadialShadowTexture());

    // Shared PBR materials with calibrated roughness/metalness contrast
    const whiteHullMat = this.trackMat(
      new THREE.MeshStandardMaterial({ map: hullTex, color: 0xffffff, roughness: 0.58, metalness: 0.25 }),
    );
    const darkFrameMat = this.trackMat(
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.45, metalness: 0.72 }),
    );
    const brushedGoldMat = this.trackMat(
      new THREE.MeshPhysicalMaterial({ color: 0xf5b041, roughness: 0.2, metalness: 0.92, clearcoat: 0.4 }),
    );
    const copperMat = this.trackMat(
      new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.28, metalness: 0.85 }),
    );
    const cyanGlowMat = this.trackMat(
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0ea5e9, emissiveIntensity: 1.4, roughness: 0.2 }),
    );
    const greenGlowMat = this.trackMat(
      new THREE.MeshStandardMaterial({ color: 0x4ade80, emissive: 0x22c55e, emissiveIntensity: 1.1, roughness: 0.3 }),
    );
    const glassMat = this.trackMat(
      new THREE.MeshPhysicalMaterial({
        color: 0xa5f3fc,
        roughness: 0.08,
        metalness: 0.05,
        transparent: true,
        opacity: 0.38,
        depthWrite: false,
      }),
    );
    const solarMat = this.trackMat(
      new THREE.MeshStandardMaterial({ map: solarTex, color: 0xffffff, roughness: 0.18, metalness: 0.65 }),
    );
    const regolithMat = this.trackMat(
      new THREE.MeshStandardMaterial({ color: 0x646b77, roughness: 0.92, metalness: 0.04 }),
    );
    const hazardMat = this.trackMat(
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.5, metalness: 0.3 }),
    );

    const setShadow = (obj: THREE.Object3D) => {
      obj.traverse((c) => {
        if ((c as THREE.Mesh).isMesh && !this.hitboxes.includes(c as THREE.Mesh)) {
          c.castShadow = !this.isSoftwareGl;
          c.receiveShadow = !this.isSoftwareGl;
        }
      });
    };

    // 1. MAIN HABITAT (8-part composite)
    {
      const g = new THREE.Group();
      const baseRing = new THREE.Mesh(this.trackGeo(new THREE.CylinderGeometry(3.4, 3.7, 0.5, 16)), darkFrameMat);
      baseRing.position.y = 0.25;
      const body = new THREE.Mesh(this.trackGeo(new THREE.CylinderGeometry(3.15, 3.3, 2.3, 16)), whiteHullMat);
      body.position.y = 1.65;
      const dome = new THREE.Mesh(
        this.trackGeo(new THREE.SphereGeometry(3.15, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.45)),
        whiteHullMat,
      );
      dome.position.y = 2.75;
      const cupola = new THREE.Mesh(this.trackGeo(new THREE.CylinderGeometry(1.1, 1.35, 0.55, 12)), darkFrameMat);
      cupola.position.y = 4.25;
      const airlock = new THREE.Mesh(this.trackGeo(new THREE.BoxGeometry(1.6, 1.8, 1.9)), darkFrameMat);
      airlock.position.set(0, 1.15, 3.25);
      const airlockDoor = new THREE.Mesh(this.trackGeo(new THREE.BoxGeometry(1.0, 1.35, 0.15)), hazardMat);
      airlockDoor.position.set(0, 1.05, 4.2);
      const win1 = new THREE.Mesh(this.trackGeo(new THREE.BoxGeometry(1.3, 0.55, 0.2)), cyanGlowMat);
      win1.position.set(1.85, 1.9, 2.55);
      win1.rotation.y = 0.62;
      const win2 = win1.clone();
      win2.position.set(-1.85, 1.9, 2.55);
      win2.rotation.y = -0.62;
      const radiator = new THREE.Mesh(this.trackGeo(new THREE.BoxGeometry(0.12, 1.4, 2.2)), brushedGoldMat);
      radiator.position.set(3.4, 2.1, 0);
      const beacon = new THREE.Mesh(this.trackGeo(new THREE.SphereGeometry(0.18, 10, 10)), cyanGlowMat);
      beacon.position.set(0, 4.7, 0);
      this.beaconMeshes.push(beacon);

      g.add(baseRing, body, dome, cupola, airlock, airlockDoor, win1, win2, radiator, beacon);
      this.addContactShadow(g, 4.5, shadowTex);
      this.addHitbox(g, 'habitat', 7.5, 5.2, 8.2);
      setShadow(g);
      this.placeBuilding('habitat', g);
    }

    // 2. SOLAR PANEL ARRAYS (7-part composite)
    {
      const g = new THREE.Group();
      const plinth = new THREE.Mesh(this.trackGeo(new THREE.BoxGeometry(3.4, 0.4, 2.2)), darkFrameMat);
      plinth.position.y = 0.2;
      const junction = new THREE.Mesh(this.trackGeo(new THREE.BoxGeometry(1.1, 0.9, 0.9)), brushedGoldMat);
      junction.position.set(0, 0.75, 0);

      for (const offsetX of [-2.4, 2.4]) {
        const mast = new THREE.Mesh(this.trackGeo(new THREE.CylinderGeometry(0.16, 0.24, 2.8, 10)), darkFrameMat);
        mast.position.set(offsetX, 1.5, 0);
        const wingPivot = new THREE.Group();
        wingPivot.position.set(offsetX, 2.8, 0);
        const frame = new THREE.Mesh(this.trackGeo(new THREE.BoxGeometry(4.2, 0.1, 2.4)), darkFrameMat);
        const panel = new THREE.Mesh(this.trackGeo(new THREE.BoxGeometry(4.0, 0.12, 2.2)), solarMat);
        panel.position.y = 0.02;
        wingPivot.add(frame, panel);
        wingPivot.rotation.x = 0.48;
        this.solarWings.push(wingPivot);
        g.add(mast, wingPivot);
      }

      g.add(plinth, junction);
      this.addContactShadow(g, 4.6, shadowTex);
      this.addHitbox(g, 'solar', 9.2, 4.2, 4.2);
      setShadow(g);
      this.placeBuilding('solar', g);
    }

    // 3. GREENHOUSE MODULE (8-part composite with transparent glass & hydroponic plants)
    {
      const g = new THREE.Group();
      const base = new THREE.Mesh(this.trackGeo(new THREE.BoxGeometry(4.6, 0.65, 6.2)), darkFrameMat);
      base.position.y = 0.325;
      const bed1 = new THREE.Mesh(this.trackGeo(new THREE.BoxGeometry(1.4, 0.4, 4.8)), whiteHullMat);
      bed1.position.set(-1.1, 0.85, 0);
      const bed2 = bed1.clone();
      bed2.position.set(1.1, 0.85, 0);

      const foliageMat = this.trackMat(new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.65, metalness: 0.05 }));
      for (let i = -2; i <= 2; i++) {
        const plantL = new THREE.Mesh(this.trackGeo(new THREE.ConeGeometry(0.32, 0.65, 7)), foliageMat);
        plantL.position.set(-1.1, 1.35, i * 0.9);
        const plantR = plantL.clone();
        plantR.position.set(1.1, 1.35, i * 0.9);
        g.add(plantL, plantR);
      }

      const domeGeo = this.trackGeo(new THREE.CylinderGeometry(2.25, 2.25, 5.8, 16, 1, false, 0, Math.PI));
      domeGeo.rotateZ(Math.PI / 2);
      domeGeo.rotateY(Math.PI / 2);
      const dome = new THREE.Mesh(domeGeo, glassMat);
      dome.position.y = 0.65;
      dome.renderOrder = 2;

      const ledStrip = new THREE.Mesh(this.trackGeo(new THREE.BoxGeometry(0.25, 0.1, 5.2)), greenGlowMat);
      ledStrip.position.set(0, 2.65, 0);

      const arch1 = new THREE.Mesh(this.trackGeo(new THREE.TorusGeometry(2.3, 0.09, 8, 20, Math.PI)), darkFrameMat);
      arch1.position.set(0, 0.65, -2.85);
      const arch2 = arch1.clone();
      arch2.position.set(0, 0.65, 2.85);

      g.add(base, bed1, bed2, dome, ledStrip, arch1, arch2);
      this.addContactShadow(g, 4.2, shadowTex);
      this.addHitbox(g, 'greenhouse', 5.2, 3.6, 6.8);
      setShadow(g);
      this.placeBuilding('greenhouse', g);
    }

    // 4. WATER RECYCLING MODULE (6-part composite)
    {
      const g = new THREE.Group();
      const pad = new THREE.Mesh(this.trackGeo(new THREE.CylinderGeometry(2.4, 2.6, 0.35, 14)), darkFrameMat);
      pad.position.y = 0.175;
      const tank1 = new THREE.Mesh(this.trackGeo(new THREE.CylinderGeometry(0.85, 0.85, 2.6, 14)), whiteHullMat);
      tank1.position.set(-0.85, 1.65, 0.3);
      const tank2 = new THREE.Mesh(this.trackGeo(new THREE.SphereGeometry(0.95, 14, 12)), copperMat);
      tank2.position.set(0.95, 1.35, -0.2);
      const tower = new THREE.Mesh(this.trackGeo(new THREE.CylinderGeometry(0.45, 0.55, 3.3, 12)), darkFrameMat);
      tower.position.set(0.2, 1.95, 0.9);
      const ring = new THREE.Mesh(this.trackGeo(new THREE.TorusGeometry(0.88, 0.08, 8, 20)), cyanGlowMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(-0.85, 2.2, 0.3);
      const pipeCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.85, 2.5, 0.3),
        new THREE.Vector3(0, 2.9, 0.6),
        new THREE.Vector3(0.95, 2.1, -0.2),
      ]);
      const pipe = new THREE.Mesh(this.trackGeo(new THREE.TubeGeometry(pipeCurve, 12, 0.1, 8, false)), brushedGoldMat);

      g.add(pad, tank1, tank2, tower, ring, pipe);
      this.addContactShadow(g, 3.0, shadowTex);
      this.addHitbox(g, 'water', 4.6, 3.8, 4.6);
      setShadow(g);
      this.placeBuilding('water', g);
    }

    // 5. OXYGEN PRODUCTION UNIT (6-part composite)
    {
      const g = new THREE.Group();
      const deck = new THREE.Mesh(this.trackGeo(new THREE.BoxGeometry(3.6, 0.35, 3.2)), darkFrameMat);
      deck.position.y = 0.175;
      const reactor = new THREE.Mesh(this.trackGeo(new THREE.BoxGeometry(1.4, 2.1, 1.8)), whiteHullMat);
      reactor.position.set(-0.75, 1.4, 0);
      const o2Sphere1 = new THREE.Mesh(this.trackGeo(new THREE.SphereGeometry(0.75, 14, 12)), cyanGlowMat);
      o2Sphere1.position.set(0.95, 1.25, -0.6);
      const o2Sphere2 = new THREE.Mesh(this.trackGeo(new THREE.SphereGeometry(0.75, 14, 12)), whiteHullMat);
      o2Sphere2.position.set(0.95, 1.25, 0.8);
      const stack = new THREE.Mesh(this.trackGeo(new THREE.CylinderGeometry(0.22, 0.28, 1.6, 10)), brushedGoldMat);
      stack.position.set(-0.75, 3.0, 0);

      g.add(deck, reactor, o2Sphere1, o2Sphere2, stack);
      this.addContactShadow(g, 2.9, shadowTex);
      this.addHitbox(g, 'oxygen', 4.2, 3.8, 3.8);
      setShadow(g);
      this.placeBuilding('oxygen', g);
    }

    // 6. COMMUNICATIONS ANTENNA (6-part composite)
    {
      const g = new THREE.Group();
      const base = new THREE.Mesh(this.trackGeo(new THREE.CylinderGeometry(1.3, 1.7, 0.5, 10)), darkFrameMat);
      base.position.y = 0.25;
      const pylon = new THREE.Mesh(this.trackGeo(new THREE.CylinderGeometry(0.32, 0.55, 3.2, 10)), whiteHullMat);
      pylon.position.y = 2.1;

      const dishPivot = new THREE.Group();
      dishPivot.position.set(0, 3.7, 0);
      const dishPoints = [
        new THREE.Vector2(0.05, 0),
        new THREE.Vector2(0.8, 0.18),
        new THREE.Vector2(1.45, 0.55),
        new THREE.Vector2(1.75, 0.92),
      ];
      const dishGeo = this.trackGeo(new THREE.LatheGeometry(dishPoints, 20));
      const dishMat = this.trackMat(
        new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.3, metalness: 0.6, side: THREE.DoubleSide }),
      );
      const dish = new THREE.Mesh(dishGeo, dishMat);
      dish.rotation.x = -Math.PI * 0.32;
      const horn = new THREE.Mesh(this.trackGeo(new THREE.CylinderGeometry(0.08, 0.14, 1.35, 8)), brushedGoldMat);
      horn.position.set(0, 0.55, 0.55);
      horn.rotation.x = Math.PI * 0.18;
      const tip = new THREE.Mesh(this.trackGeo(new THREE.SphereGeometry(0.15, 10, 10)), cyanGlowMat);
      tip.position.set(0, 1.05, 0.85);
      this.beaconMeshes.push(tip);

      dishPivot.add(dish, horn, tip);
      this.commsDish = dishPivot;

      g.add(base, pylon, dishPivot);
      this.addContactShadow(g, 2.5, shadowTex);
      this.addHitbox(g, 'comms', 3.6, 5.4, 3.6);
      setShadow(g);
      this.placeBuilding('comms', g);
    }

    // 7. RADIATION SHELTER (5-part regolith-bermed bunker)
    {
      const g = new THREE.Group();
      const berm = new THREE.Mesh(
        this.trackGeo(new THREE.SphereGeometry(3.1, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.45)),
        regolithMat,
      );
      berm.scale.set(1.15, 0.78, 1.0);
      const tunnel = new THREE.Mesh(this.trackGeo(new THREE.BoxGeometry(1.7, 1.65, 2.2)), darkFrameMat);
      tunnel.position.set(0, 0.85, 2.35);
      const blastDoor = new THREE.Mesh(this.trackGeo(new THREE.BoxGeometry(1.2, 1.3, 0.2)), hazardMat);
      blastDoor.position.set(0, 0.8, 3.45);
      const sensorPole = new THREE.Mesh(this.trackGeo(new THREE.CylinderGeometry(0.07, 0.09, 1.6, 8)), darkFrameMat);
      sensorPole.position.set(0, 2.8, 0);
      const radLight = new THREE.Mesh(this.trackGeo(new THREE.SphereGeometry(0.18, 10, 10)), hazardMat);
      radLight.position.set(0, 3.65, 0);
      this.beaconMeshes.push(radLight);

      g.add(berm, tunnel, blastDoor, sensorPole, radLight);
      this.addContactShadow(g, 4.0, shadowTex);
      this.addHitbox(g, 'shelter', 6.8, 3.8, 6.8);
      setShadow(g);
      this.placeBuilding('shelter', g);
    }

    // 8. LUNAR ROVER (9-part articulated rover driving on patrol perimeter)
    {
      const g = new THREE.Group();
      const chassis = new THREE.Mesh(this.trackGeo(new THREE.BoxGeometry(1.7, 0.55, 2.5)), brushedGoldMat);
      chassis.position.y = 0.72;
      const cabin = new THREE.Mesh(this.trackGeo(new THREE.BoxGeometry(1.45, 0.85, 1.35)), whiteHullMat);
      cabin.position.set(0, 1.35, 0.25);
      const visor = new THREE.Mesh(this.trackGeo(new THREE.BoxGeometry(1.25, 0.45, 0.15)), cyanGlowMat);
      visor.position.set(0, 1.42, 0.94);
      const solarDeck = new THREE.Mesh(this.trackGeo(new THREE.BoxGeometry(1.4, 0.08, 0.95)), solarMat);
      solarDeck.position.set(0, 1.05, -0.82);
      const camMast = new THREE.Mesh(this.trackGeo(new THREE.CylinderGeometry(0.06, 0.08, 0.95, 8)), darkFrameMat);
      camMast.position.set(0.45, 2.05, 0.55);
      const camHead = new THREE.Mesh(this.trackGeo(new THREE.BoxGeometry(0.38, 0.22, 0.24)), whiteHullMat);
      camHead.position.set(0.45, 2.55, 0.55);

      const wheelGeo = this.trackGeo(new THREE.CylinderGeometry(0.36, 0.36, 0.26, 12));
      wheelGeo.rotateZ(Math.PI / 2);
      const wheelMat = this.trackMat(new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.75, metalness: 0.5 }));
      const wheelPositions: Array<[number, number, number]> = [
        [-1.0, 0.36, -0.9],
        [1.0, 0.36, -0.9],
        [-1.0, 0.36, 0],
        [1.0, 0.36, 0],
        [-1.0, 0.36, 0.9],
        [1.0, 0.36, 0.9],
      ];
      for (const [wx, wy, wz] of wheelPositions) {
        const w = new THREE.Mesh(wheelGeo, wheelMat);
        w.position.set(wx, wy, wz);
        this.roverWheels.push(w);
        g.add(w);
      }

      g.add(chassis, cabin, visor, solarDeck, camMast, camHead);
      this.addContactShadow(g, 2.2, shadowTex);
      this.addHitbox(g, 'rover', 2.6, 2.8, 3.2);
      setShadow(g);
      this.roverGroup = g;
      this.placeBuilding('rover', g);
    }

    // 9. RESEARCH STATION (7-part geological core drill & lab)
    {
      const g = new THREE.Group();
      const labPod = new THREE.Mesh(this.trackGeo(new THREE.CylinderGeometry(1.4, 1.6, 1.85, 8)), whiteHullMat);
      labPod.position.set(-0.7, 0.925, 0);
      const labCap = new THREE.Mesh(this.trackGeo(new THREE.ConeGeometry(1.45, 0.7, 8)), darkFrameMat);
      labCap.position.set(-0.7, 2.2, 0);
      const derrick = new THREE.Mesh(this.trackGeo(new THREE.BoxGeometry(0.8, 3.1, 0.8)), darkFrameMat);
      derrick.position.set(1.1, 1.55, 0);
      const drill = new THREE.Mesh(this.trackGeo(new THREE.ConeGeometry(0.24, 1.6, 8)), brushedGoldMat);
      drill.rotation.x = Math.PI;
      drill.position.set(1.1, 0.95, 0);
      this.drillHead = drill;
      const sampleRack = new THREE.Mesh(this.trackGeo(new THREE.BoxGeometry(1.1, 0.75, 0.6)), copperMat);
      sampleRack.position.set(0.2, 0.375, 1.15);
      const labWindow = new THREE.Mesh(this.trackGeo(new THREE.BoxGeometry(0.95, 0.45, 0.15)), cyanGlowMat);
      labWindow.position.set(-0.7, 1.25, 1.48);

      g.add(labPod, labCap, derrick, drill, sampleRack, labWindow);
      this.addContactShadow(g, 3.0, shadowTex);
      this.addHitbox(g, 'research', 4.6, 3.6, 4.0);
      setShadow(g);
      this.placeBuilding('research', g);
    }
  }

  private placeBuilding(id: BuildingId, group: THREE.Group): void {
    const cfg = BUILDING_LAYOUT[id];
    group.position.set(cfg.x, groundHeightAt(cfg.x, cfg.z), cfg.z);
    group.rotation.y = cfg.rotY;
    this.scene.add(group);
    this.buildingGroups.set(id, group);
  }

  private buildAstronauts(): void {
    const suitMat = this.trackMat(new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.55, metalness: 0.1 }));
    const packMat = this.trackMat(new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.4, metalness: 0.35 }));
    const visorMat = this.trackMat(new THREE.MeshPhysicalMaterial({ color: 0xf59e0b, roughness: 0.12, metalness: 0.95, clearcoat: 1 }));
    const shadowTex = this.trackTex(createRadialShadowTexture());

    for (let i = 0; i < 4; i++) {
      const g = new THREE.Group();
      const torso = new THREE.Mesh(this.trackGeo(new THREE.BoxGeometry(0.42, 0.56, 0.28)), suitMat);
      torso.position.y = 0.85;
      const backpack = new THREE.Mesh(this.trackGeo(new THREE.BoxGeometry(0.36, 0.48, 0.2)), packMat);
      backpack.position.set(0, 0.88, -0.22);
      const helmet = new THREE.Mesh(this.trackGeo(new THREE.SphereGeometry(0.24, 12, 10)), suitMat);
      helmet.position.y = 1.32;
      const visor = new THREE.Mesh(this.trackGeo(new THREE.SphereGeometry(0.19, 10, 8)), visorMat);
      visor.position.set(0, 1.32, 0.09);

      const limbGeo = this.trackGeo(new THREE.CylinderGeometry(0.08, 0.07, 0.48, 8));
      const leftArm = new THREE.Mesh(limbGeo, suitMat);
      leftArm.position.set(-0.28, 0.82, 0);
      const rightArm = new THREE.Mesh(limbGeo, suitMat);
      rightArm.position.set(0.28, 0.82, 0);
      const leftLeg = new THREE.Mesh(limbGeo, suitMat);
      leftLeg.position.set(-0.12, 0.3, 0);
      const rightLeg = new THREE.Mesh(limbGeo, suitMat);
      rightLeg.position.set(0.12, 0.3, 0);

      g.add(torso, backpack, helmet, visor, leftArm, rightArm, leftLeg, rightLeg);
      this.addContactShadow(g, 0.45, shadowTex);
      g.traverse((c) => {
        if ((c as THREE.Mesh).isMesh) {
          c.castShadow = !this.isSoftwareGl;
        }
      });

      this.scene.add(g);
      this.astronauts.push({
        group: g,
        phase: i * 1.65,
        radius: 5.5 + i * 1.4,
        speed: 0.18 + i * 0.03,
        leftArm,
        rightArm,
        leftLeg,
        rightLeg,
      });
    }
  }

  public updateSyncState(next: SceneSyncState): void {
    const prevSelected = this.syncState.selectedBuilding;
    this.syncState = next;

    // Apply landing site terrain tint & sunlight contrast
    const site = LANDING_SITES.find((s) => s.id === next.landingSite);
    if (site && this.terrainMat) {
      this.terrainMat.color.setHex(site.terrainTintHex);
      this.sunLight.intensity = 2.0 + site.solarMult * 0.4;
    }

    // Update astronauts count & sheltered visibility
    this.astronauts.forEach((astro, idx) => {
      astro.group.visible = idx < next.crewSize && !next.crewSheltered;
    });

    // Update selection ring
    if (next.selectedBuilding) {
      const grp = this.buildingGroups.get(next.selectedBuilding);
      if (grp) {
        const rad = BUILDING_LAYOUT[next.selectedBuilding].radius / 2.6;
        this.selectionRing.position.set(grp.position.x, grp.position.y + 0.05, grp.position.z);
        this.selectionRing.scale.set(rad, rad, 1);
        this.selectionRing.visible = true;

        if (prevSelected !== next.selectedBuilding && next.mode === 'playing') {
          this.focusOnBuilding(next.selectedBuilding);
        }
      }
    } else {
      this.selectionRing.visible = false;
    }
  }

  public focusOnBuilding(id: BuildingId): void {
    const grp = this.buildingGroups.get(id);
    if (!grp) return;
    this.camGoalTarget = new THREE.Vector3(grp.position.x, grp.position.y + 1.4, grp.position.z);
    this.camGoalPos = new THREE.Vector3(grp.position.x + 11.5, grp.position.y + 8.0, grp.position.z + 12.5);
  }

  public resetCamera(): void {
    this.camGoalTarget = new THREE.Vector3(0, 1.5, 0);
    this.camGoalPos = new THREE.Vector3(24, 15, 25);
  }

  private bindEvents(): void {
    const canvas = this.renderer.domElement;

    const onPointerDown = (e: PointerEvent) => {
      this.pointerDownPos = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = (e: PointerEvent) => {
      if (this.syncState.mode !== 'playing') return;
      const dist = Math.hypot(e.clientX - this.pointerDownPos.x, e.clientY - this.pointerDownPos.y);
      if (dist > 6) return; // Dragged camera, not a click

      const rect = canvas.getBoundingClientRect();
      this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      this.raycaster.setFromCamera(this.pointer, this.camera);
      const hits = this.raycaster.intersectObjects(this.hitboxes, false);
      if (hits.length > 0) {
        const id = hits[0].object.userData.buildingId as BuildingId;
        this.callbacks.onSelectBuilding(id);
      } else {
        this.callbacks.onSelectBuilding(null);
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (this.syncState.mode !== 'playing') return;
      const now = performance.now();
      if (now - this.lastHoverCheck < 55) return;
      this.lastHoverCheck = now;

      const rect = canvas.getBoundingClientRect();
      this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      this.raycaster.setFromCamera(this.pointer, this.camera);
      const hits = this.raycaster.intersectObjects(this.hitboxes, false);
      const nextHover = hits.length > 0 ? (hits[0].object.userData.buildingId as BuildingId) : null;
      if (nextHover !== this.hoveredId) {
        this.hoveredId = nextHover;
        this.callbacks.onHoverBuilding(nextHover);
        canvas.style.cursor = nextHover ? 'pointer' : 'grab';
      }
      if (nextHover) {
        const grp = this.buildingGroups.get(nextHover);
        if (grp) {
          const rad = BUILDING_LAYOUT[nextHover].radius / 2.6;
          this.hoverRing.position.set(grp.position.x, grp.position.y + 0.04, grp.position.z);
          this.hoverRing.scale.set(rad, rad, 1);
          this.hoverRing.visible = true;
        }
      } else {
        this.hoverRing.visible = false;
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      this.keysPressed.add(e.code);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      this.keysPressed.delete(e.code);
    };
    const onBlur = () => {
      this.keysPressed.clear();
    };
    const onResize = () => {
      if (this.disposed) return;
      const w = this.container.clientWidth || window.innerWidth;
      const h = this.container.clientHeight || window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
      this.renderer.render(this.scene, this.camera);
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointermove', onPointerMove);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    window.addEventListener('resize', onResize);

    this.cleanupListeners = () => {
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('resize', onResize);
    };
  }

  private cleanupListeners: () => void = () => {};

  private afterDraw(cb: () => void): void {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync ? gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0) : null;
    gl.flush();
    if (!sync) {
      this.frameId = window.setTimeout(cb, 80);
      return;
    }
    const poll = () => {
      if (this.disposed) return;
      const state = gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private tick = (): void => {
    if (this.disposed) return;
    const now = performance.now();
    const rawDt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    const dt = Math.min(Math.max(rawDt, 0.001), 0.05);
    this.elapsed += dt;

    // 1. Camera Mode Behavior
    if (this.syncState.mode === 'title' || this.syncState.mode === 'prep') {
      const orbitAngle = this.elapsed * 0.09;
      const camR = 29;
      _vec3A.set(Math.cos(orbitAngle) * camR, 12.5 + Math.sin(this.elapsed * 0.22) * 1.5, Math.sin(orbitAngle) * camR);
      const damp = 1 - Math.exp(-3.5 * dt);
      this.camera.position.lerp(_vec3A, damp);
      _vec3B.set(0, 2.2, 0);
      this.controls.target.lerp(_vec3B, damp);
      this.controls.enabled = false;
      this.camera.lookAt(this.controls.target);
    } else {
      this.controls.enabled = true;

      // Smooth WASD / Arrow panning in world XZ
      const panSpeed = 14 * dt;
      let moveX = 0;
      let moveZ = 0;
      if (this.keysPressed.has('KeyW') || this.keysPressed.has('ArrowUp')) moveZ -= 1;
      if (this.keysPressed.has('KeyS') || this.keysPressed.has('ArrowDown')) moveZ += 1;
      if (this.keysPressed.has('KeyA') || this.keysPressed.has('ArrowLeft')) moveX -= 1;
      if (this.keysPressed.has('KeyD') || this.keysPressed.has('ArrowRight')) moveX += 1;

      if (moveX !== 0 || moveZ !== 0) {
        this.camGoalPos = null;
        this.camGoalTarget = null;
        this.camera.getWorldDirection(_vec3A);
        _vec3A.y = 0;
        _vec3A.normalize();
        _vec3B.set(-_vec3A.z, 0, _vec3A.x); // Right vector

        const dx = (_vec3B.x * moveX - _vec3A.x * moveZ) * panSpeed;
        const dz = (_vec3B.z * moveX - _vec3A.z * moveZ) * panSpeed;
        this.controls.target.x = THREE.MathUtils.clamp(this.controls.target.x + dx, -22, 22);
        this.controls.target.z = THREE.MathUtils.clamp(this.controls.target.z + dz, -22, 22);
        this.camera.position.x += dx;
        this.camera.position.z += dz;
      }

      if (this.camGoalPos && this.camGoalTarget) {
        const damp = 1 - Math.exp(-4.5 * dt);
        this.camera.position.lerp(this.camGoalPos, damp);
        this.controls.target.lerp(this.camGoalTarget, damp);
        if (this.camera.position.distanceTo(this.camGoalPos) < 0.25) {
          this.camGoalPos = null;
          this.camGoalTarget = null;
        }
      }

      this.controls.update();
    }

    // 2. Solar wings gently track sun angle
    for (const wing of this.solarWings) {
      wing.rotation.z = Math.sin(this.elapsed * 0.25) * 0.08;
    }

    // 3. Comms dish gently tracks Earth
    if (this.commsDish) {
      this.commsDish.rotation.y = -0.55 + Math.sin(this.elapsed * 0.35) * 0.12;
    }

    // 4. Drill head spins when powered
    if (this.drillHead && this.syncState.buildings.research.powered) {
      this.drillHead.rotation.y += dt * 2.2;
    }

    // 5. Rover drives smoothly on outer perimeter loop when powered
    if (this.roverGroup && this.syncState.buildings.rover.powered) {
      const t = this.elapsed * 0.16;
      const rx = Math.cos(t) * 14.8;
      const rz = Math.sin(t) * 14.8;
      this.roverGroup.position.set(rx, groundHeightAt(rx, rz), rz);
      this.roverGroup.rotation.y = -t;
      for (const w of this.roverWheels) {
        w.rotation.x += dt * 3.5;
      }
    }

    // 6. Astronauts walk along base paths
    for (const astro of this.astronauts) {
      if (!astro.group.visible) continue;
      const t = this.elapsed * astro.speed + astro.phase;
      const ax = Math.cos(t) * astro.radius;
      const az = Math.sin(t) * astro.radius;
      astro.group.position.set(ax, groundHeightAt(ax, az), az);
      astro.group.rotation.y = -t;
      const swing = Math.sin(this.elapsed * 4.2 + astro.phase) * 0.45;
      astro.leftLeg.rotation.x = swing;
      astro.rightLeg.rotation.x = -swing;
      astro.leftArm.rotation.x = -swing * 0.7;
      astro.rightArm.rotation.x = swing * 0.7;
    }

    // 7. Subtle beacon pulse
    const pulse = 0.7 + 0.5 * Math.sin(this.elapsed * 3.0);
    for (const b of this.beaconMeshes) {
      const m = b.material as THREE.MeshStandardMaterial;
      if (m && typeof m.emissiveIntensity === 'number') {
        m.emissiveIntensity = pulse;
      }
    }

    // 8. Selection ring gentle rotation & rover tracking
    if (this.selectionRing.visible) {
      this.selectionRing.rotation.z += dt * 0.6;
      if (this.syncState.selectedBuilding === 'rover' && this.roverGroup) {
        this.selectionRing.position.set(
          this.roverGroup.position.x,
          this.roverGroup.position.y + 0.05,
          this.roverGroup.position.z,
        );
      }
    }

    this.renderer.render(this.scene, this.camera);

    if (this.isSoftwareGl) {
      this.afterDraw(this.tick);
    } else {
      this.frameId = requestAnimationFrame(this.tick);
    }
  };

  public dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    this.cleanupListeners();
    this.controls.dispose();
    this.envRenderTarget.dispose();
    this.geometries.forEach((g) => g.dispose());
    this.materials.forEach((m) => m.dispose());
    this.textures.forEach((t) => t.dispose());
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
