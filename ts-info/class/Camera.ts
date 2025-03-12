import { Pane } from "tweakpane";
import { IExperienceConfig } from "../types/Experience";
import Experience from "./Experience";
import Time from "./Time";
import Sizes from "./Sizes";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import { IModes } from "../types/Camera";

class Camera {
  experience: Experience;
  config: IExperienceConfig;
  debug: Pane;
  time: Time;
  sizes: Sizes;
  targetElement: HTMLElement;
  scene: THREE.Scene;
  mode: "default" | "debug" = "debug";
  instance: THREE.PerspectiveCamera | THREE.OrthographicCamera | null = null;
  modes: IModes;

  constructor(_experience: Experience) {
    this.experience = _experience;
    this.config = this.experience.config;
    this.debug = this.experience.debug as Pane;
    this.time = this.experience.time;
    this.sizes = this.experience.sizes;
    this.targetElement = this.experience.targetElement;
    this.scene = this.experience.scene as THREE.Scene;

    this.modes = {
      default: {
        instance: null,
        orbitControls: null,
      },
      debug: {
        instance: null,
        orbitControls: null,
      },
    };

    this.mode = "debug";
    this.setInstance();
    this.setModes();
  }

  setInstance(): void {
    this.instance = new THREE.PerspectiveCamera(
      25,
      this.config.width / this.config.height,
      0.1,
      15
    );
    this.instance.rotation.reorder("YXZ");
    this.scene.add(this.instance);
  }

  setModes(): void {
    if (!this.instance) return;

    // Default
    this.modes.default = {
      instance: this.instance.clone(),
      orbitControls: null,
    };
    if (this.modes.default.instance) {
      this.modes.default.instance.rotation.reorder("YXZ");
    }

    // Debug
    this.modes.debug.instance = this.instance.clone();
    this.modes.debug.instance.rotation.reorder("YXZ");
    this.modes.debug.instance.position.set(0, 0, 7);

    this.modes.debug.orbitControls = new OrbitControls(
      this.modes.debug.instance,
      this.targetElement
    );
    this.modes.debug.orbitControls.enabled = this.modes.debug.active ?? false;
    this.modes.debug.orbitControls.screenSpacePanning = true;
    // @ts-expect-error Property 'enableKeys' does not exist on type 'OrbitControls'.
    this.modes.debug.orbitControls.enableKeys = false;
    this.modes.debug.orbitControls.zoomSpeed = 0.25;
    this.modes.debug.orbitControls.enableDamping = true;
    this.modes.debug.orbitControls.update();
  }

  resize() {
    if (!this.instance) return;

    if ("aspect" in this.instance) {
      this.instance.aspect = this.config.width / this.config.height;
    }
    this.instance.updateProjectionMatrix();

    if (!this.modes.default.instance) return;
    if ("aspect" in this.modes.default.instance) {
      this.modes.default.instance.aspect =
        this.config.width / this.config.height;
    }
    this.modes.default.instance.updateProjectionMatrix();

    if (!this.modes.debug.instance) return;
    if ("aspect" in this.modes.debug.instance) {
      this.modes.debug.instance.aspect = this.config.width / this.config.height;
    }
    this.modes.debug.instance.updateProjectionMatrix();
  }

  update() {
    // Update debug orbit controls
    if (this.modes.debug.orbitControls) {
      this.modes.debug.orbitControls.update();
    }

    // Apply coordinates
    if (this.instance) {
      const mode = this.modes[this.mode].instance;
      if (mode !== null) {
        this.instance.position.copy(mode.position);
        this.instance.quaternion.copy(mode.quaternion);
      }
      this.instance.updateMatrixWorld(); // To be used in projection
    }
  }

  destroy() {
    if (this.modes.default.instance && this.modes.debug.orbitControls) {
      if ("destroy" in this.modes.debug.orbitControls) {
        // @ts-expect-error Property 'destroy' does not exist on type 'OrbitControls'.
        this.modes.debug.orbitControls.destroy();
      }
    }
  }
}

export default Camera;
