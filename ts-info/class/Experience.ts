import { Pane } from "tweakpane";
import { IExperienceConfig, IExperienceContructor } from "../types/Experience";
import Sizes from "./Sizes";
import Stats from "./Stats";
import Time from "./Time";
import * as THREE from "three";
import Camera from "./Camera";
import Renderer from "./Renderer";
import Resources from "./Resources";
import ASSETS from "./Assets";
import Microphone from "./Microphone";
import World from "./World";

class Experience {
  targetElement: HTMLElement | Element;
  time: Time;
  sizes: Sizes;
  config: IExperienceConfig;

  stats: Stats | null = null;
  debug: Pane | null = null;
  scene: THREE.Scene | null = null;
  camera: Camera | null = null;
  renderer: Renderer | null = null;
  resources: Resources | null = null;
  microphone: Microphone | null = null;
  world: World | null = null;

  constructor({ target }: IExperienceContructor) {
    this.targetElement = target;
    this.time = new Time();
    this.sizes = new Sizes();
    this.config = {
      debug: false,
      pixelRatio: 1,
      width: 0,
      height: 0,
    };

    this.setConfig();
    this.setStats();
    this.setStats();
    this.setDebug();
    this.setScene();
    this.setCamera();
    this.setRenderer();
    this.setResources();
    this.setMicrohopne();
    this.setWorld();

    this.sizes.on("resize", () => {
      this.resize();
    });

    this.update();
  }

  setConfig(): void {
    const debug = window.location.hash === "#debug";
    const pixelRatio = Math.min(Math.max(window.devicePixelRatio, 1), 2);
    const { width, height } = this.targetElement.getBoundingClientRect();
    this.config = {
      debug,
      pixelRatio,
      width,
      height: height ?? window.innerHeight,
    };
  }

  setStats(): void {
    if (this.config.debug) {
      this.stats = new Stats(true);
    }
  }

  setDebug(): void {
    if (this.config.debug) {
      this.debug = new Pane();
      const container = this.debug.element;
      container.style.width = "320px";
    }
  }

  setScene(): void {
    this.scene = new THREE.Scene();
  }

  setCamera(): void {
    this.camera = new Camera(this);
  }

  setRenderer(): void {
    this.renderer = new Renderer(this);
    if (this.renderer.instance) {
      this.targetElement.appendChild(this.renderer.instance.domElement);
    }
  }

  setResources() {
    this.resources = new Resources(ASSETS, this);
  }

  setMicrohopne() {
    this.microphone = new Microphone(this);
  }

  setWorld() {
    this.world = new World(this);
  }

  update() {
    if (this.stats) this.stats.update();
    if (this.camera) this.camera.update();
    if (this.microphone) this.microphone.update();
    if (this.world) this.world.update();
    if (this.renderer) this.renderer.update();
    window.requestAnimationFrame(() => {
      this.update();
    });
  }

  resize() {
    // Config
    const boundings = this.targetElement.getBoundingClientRect();
    this.config.width = boundings.width;
    this.config.height = boundings.height;
    this.config.pixelRatio = Math.min(Math.max(window.devicePixelRatio, 1), 2);
    if (this.camera) this.camera.resize();
    if (this.renderer) this.renderer.resize();
    if (this.world) this.world.resize();
    if (this.world) this.world.resize();
  }

  destroy() {}
}

export default Experience;
