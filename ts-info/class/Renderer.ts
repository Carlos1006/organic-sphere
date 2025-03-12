import { Pane } from "tweakpane";
import { IExperienceConfig } from "../types/Experience";
import Experience from "./Experience";
import Sizes from "./Sizes";
import Time from "./Time";
import Camera from "./Camera";
import Stats from "./Stats";
import * as THREE from "three";
import {
  EffectComposer,
  RenderPass,
  UnrealBloomPass,
} from "three/examples/jsm/Addons.js";
import { IPostProcess } from "../types/Renderer";

class Renderer {
  experience: Experience;
  config: IExperienceConfig;
  debug: Pane;
  time: Time;
  sizes: Sizes;
  stats: Stats;
  scene: THREE.Scene;
  camera: Camera;
  debugFolder: unknown;

  usePostprocess: boolean;
  instance: THREE.WebGLRenderer | null = null;
  clearColor: string | null = null;
  context: WebGLRenderingContext | WebGL2RenderingContext | null = null;

  postProcess: IPostProcess | null = null;
  renderTarget: THREE.WebGLRenderTarget | null = null;

  constructor(_experience: Experience) {
    this.experience = _experience;
    this.config = this.experience.config;
    this.debug = this.experience.debug as Pane;
    this.stats = this.experience.stats as Stats;
    this.time = this.experience.time;
    this.sizes = this.experience.sizes;
    this.scene = this.experience.scene as THREE.Scene;
    this.camera = this.experience.camera as Camera;
    this.usePostprocess = true;

    if (this.debug) {
      // @ts-expect-error - Property 'addFolder' does not exist on type 'Pane'.
      this.debugFolder = this.debug.addFolder({
        title: "renderer",
      });
    }

    this.setInstance();
    this.setPostProcess();
  }

  setInstance(): void {
    this.clearColor = "#010101";

    // Renderer
    this.instance = new THREE.WebGLRenderer({
      alpha: false,
      antialias: true,
    });

    this.instance.domElement.style.position = "absolute";
    this.instance.domElement.style.top = "0";
    this.instance.domElement.style.left = "0";
    this.instance.domElement.style.width = "100%";
    this.instance.domElement.style.height = "100%";

    // this.instance.setClearColor(0x414141, 1)
    this.instance.setClearColor(this.clearColor, 1);
    this.instance.setSize(this.config.width, this.config.height);
    this.instance.setPixelRatio(this.config.pixelRatio);

    // this.instance.physicallyCorrectLights = true
    // this.instance.gammaOutPut = true
    // this.instance.outputEncoding = THREE.sRGBEncoding
    // this.instance.shadowMap.type = THREE.PCFSoftShadowMap
    // this.instance.shadowMap.enabled = false
    // this.instance.toneMapping = THREE.ReinhardToneMapping
    // this.instance.toneMapping = THREE.ReinhardToneMapping
    // this.instance.toneMappingExposure = 1.3

    this.context = this.instance.getContext();

    // Add stats panel
    if (this.stats) {
      this.stats.setRenderPanel(this.context);
    }
  }

  setPostProcess(): void {
    this.postProcess = {};

    /**
     * Passes
     */
    // Render pass
    if (this.camera.instance) {
      this.postProcess.renderPass = new RenderPass(
        this.scene,
        this.camera.instance
      );
    }

    // Bloom pass
    this.postProcess.unrealBloomPass = new UnrealBloomPass(
      new THREE.Vector2(this.sizes.width, this.sizes.height),
      0.8,
      0.315,
      0
    );
    this.postProcess.unrealBloomPass.enabled = true;

    // @ts-expect-error - Property 'tintColor' does not exist on type 'UnrealBloomPass'.
    this.postProcess.unrealBloomPass.tintColor = {};
    // @ts-expect-error - Property 'compositeMaterial' does not exist on type 'UnrealBloomPass'.
    this.postProcess.unrealBloomPass.tintColor.value = "#7f00ff";

    const color = new THREE.Color(
      // @ts-expect-error - Property 'compositeMaterial' does not exist on type 'UnrealBloomPass'.
      this.postProcess.unrealBloomPass.tintColor.value ?? "#7f00ff"
    );
    // @ts-expect-error - Property 'compositeMaterial' does not exist on type 'UnrealBloomPass'.
    this.postProcess.unrealBloomPass.tintColor.instance = color;

    this.postProcess.unrealBloomPass.compositeMaterial.uniforms.uTintColor = {
      value: color,
    };
    this.postProcess.unrealBloomPass.compositeMaterial.uniforms.uTintStrength =
      { value: 0.15 };
    this.postProcess.unrealBloomPass.compositeMaterial.fragmentShader = `
varying vec2 vUv;
uniform sampler2D blurTexture1;
uniform sampler2D blurTexture2;
uniform sampler2D blurTexture3;
uniform sampler2D blurTexture4;
uniform sampler2D blurTexture5;
uniform sampler2D dirtTexture;
uniform float bloomStrength;
uniform float bloomRadius;
uniform float bloomFactors[NUM_MIPS];
uniform vec3 bloomTintColors[NUM_MIPS];
uniform vec3 uTintColor;
uniform float uTintStrength;

float lerpBloomFactor(const in float factor) {
  float mirrorFactor = 1.2 - factor;
  return mix(factor, mirrorFactor, bloomRadius);
}

void main() {
  vec4 color = bloomStrength * ( lerpBloomFactor(bloomFactors[0]) * vec4(bloomTintColors[0], 1.0) * texture2D(blurTexture1, vUv) +
      lerpBloomFactor(bloomFactors[1]) * vec4(bloomTintColors[1], 1.0) * texture2D(blurTexture2, vUv) +
      lerpBloomFactor(bloomFactors[2]) * vec4(bloomTintColors[2], 1.0) * texture2D(blurTexture3, vUv) +
      lerpBloomFactor(bloomFactors[3]) * vec4(bloomTintColors[3], 1.0) * texture2D(blurTexture4, vUv) +
      lerpBloomFactor(bloomFactors[4]) * vec4(bloomTintColors[4], 1.0) * texture2D(blurTexture5, vUv) );

  color.rgb = mix(color.rgb, uTintColor, uTintStrength);
  gl_FragColor = color;
}
      `;

    if (this.debug) {
      // @ts-expect-error - Property 'addFolder' does not exist on type 'Pane'.
      const debugFolder = this.debugFolder.addFolder({
        title: "UnrealBloomPass",
      });

      debugFolder.addInput(this.postProcess.unrealBloomPass, "enabled", {});

      debugFolder.addInput(this.postProcess.unrealBloomPass, "strength", {
        min: 0,
        max: 3,
        step: 0.001,
      });

      debugFolder.addInput(this.postProcess.unrealBloomPass, "radius", {
        min: 0,
        max: 1,
        step: 0.001,
      });

      debugFolder.addInput(this.postProcess.unrealBloomPass, "threshold", {
        min: 0,
        max: 1,
        step: 0.001,
      });

      debugFolder
        .addInput(color, "value", {
          view: "uTintColor",
          label: "color",
        })
        .on("change", () => {
          // @ts-expect-error - Property 'tintColor' does not exist on type 'UnrealBloomPass'.
          this.postProcess.unrealBloomPass.tintColor.instance.set(
            // @ts-expect-error - Property 'tintColor' does not exist on type 'UnrealBloomPass'.
            this.postProcess.unrealBloomPass.tintColor.value
          );
        });

      debugFolder.addInput(
        this.postProcess.unrealBloomPass.compositeMaterial.uniforms
          .uTintStrength,
        "value",
        { label: "uTintStrength", min: 0, max: 1, step: 0.001 }
      );
    }

    /**
     * Effect composer
     */
    // const RenderTargetClass = THREE.WebGLRenderTarget
    this.renderTarget = new THREE.WebGLRenderTarget(
      this.config.width,
      this.config.height,
      {
        generateMipmaps: false,
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBFormat,
        samples: this.config.pixelRatio,
        // @ts-expect-error - Property 'outputEncoding' does not exist on type 'WebGLRenderTarget'.
        encoding: THREE.sRGBEncoding,
      }
    );
    this.postProcess.composer = new EffectComposer(
      this.instance as THREE.WebGLRenderer,
      this.renderTarget
    );
    this.postProcess.composer.setSize(this.config.width, this.config.height);
    this.postProcess.composer.setPixelRatio(this.config.pixelRatio);

    if (this.postProcess.renderPass) {
      this.postProcess.composer.addPass(this.postProcess.renderPass);
    }
    this.postProcess.composer.addPass(this.postProcess.unrealBloomPass);
  }

  resize(): void {
    // Instance
    if (this.instance) {
      this.instance.setSize(this.config.width, this.config.height);
      this.instance.setPixelRatio(this.config.pixelRatio);
    }

    // Post process
    if (this.postProcess && this.postProcess.composer) {
      this.postProcess.composer.setSize(this.config.width, this.config.height);
      this.postProcess.composer.setPixelRatio(this.config.pixelRatio);
    }
  }

  update() {
    if (this.stats) {
      this.stats.beforeRender();
    }

    if (this.usePostprocess) {
      if (this.postProcess && this.postProcess.composer) {
        this.postProcess.composer.render();
      }
    } else {
      if (this.instance && this.scene && this.camera.instance) {
        this.instance.render(this.scene, this.camera.instance);
      }
    }

    if (this.stats) {
      this.stats.afterRender();
    }
  }

  destroy() {
    if (this.instance) {
      this.instance.renderLists.dispose();
      this.instance.dispose();
    }
    if (this.renderTarget) {
      this.renderTarget.dispose();
    }
    if (this.postProcess && this.postProcess.composer) {
      this.postProcess.composer.renderTarget1.dispose();
      this.postProcess.composer.renderTarget2.dispose();
    }
  }
}

export default Renderer;
