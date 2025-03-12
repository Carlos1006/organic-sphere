import * as THREE from "three";
import Experience from "./Experience";
import vertexShader from "../shaders/sphere/vertex.glsl?raw";
import fragmentShader from "../shaders/sphere/fragment.glsl?raw";
import { Pane } from "tweakpane";
import Time from "./Time";
import Microphone from "./Microphone";
import { IVariations, ILights, IOffset } from "../types/Sphere";

class Sphere {
  experience: Experience;
  debug: Pane;
  scene: THREE.Scene;
  timeFrequency: number;
  elapsedTime: number;
  time: Time;
  microphone: Microphone;
  geometry: THREE.SphereGeometry | null = null;
  material: THREE.ShaderMaterial | null = null;
  mesh: THREE.Mesh | null = null;
  variations: IVariations | null = null;
  lights: ILights | null = null;
  offset: IOffset | null = null;

  constructor(experience: Experience) {
    this.experience = experience;
    this.debug = this.experience.debug as Pane;
    this.scene = this.experience.scene as THREE.Scene;
    this.time = this.experience.time as Time;
    this.microphone = this.experience.microphone as Microphone;

    this.timeFrequency = 0.0003;
    this.elapsedTime = 0;

    if (this.debug) {
      // @ts-expect-error - Tweakpane types are incorrect
      this.debugFolder = this.debug.addFolder({
        title: "sphere",
        expanded: true,
      });

      // @ts-expect-error - Tweakpane types are incorrect
      this.debugFolder.addInput(this, "timeFrequency", {
        min: 0,
        max: 0.001,
        step: 0.000001,
      });
    }

    this.setVariations();
    this.setGeometry();
    this.setLights();
    this.setOffset();
    this.setMaterial();
    this.setMesh();
  }

  setVariations() {
    this.variations = {
      volume: {
        target: 0,
        current: 0,
        upEasing: 0.03,
        downEasing: 0.002,
        getValue: () => {
          const level0 = this.microphone.levels[0] || 0;
          const level1 = this.microphone.levels[1] || 0;
          const level2 = this.microphone.levels[2] || 0;
          return Math.max(level0, level1, level2) * 0.3;
        },
        getDefault: () => 0.152,
      },
      lowLevel: {
        target: 0,
        current: 0,
        upEasing: 0.005,
        downEasing: 0.002,
        getValue: () => {
          let value = this.microphone.levels[0] || 0;
          value *= 0.003;
          value += 0.0001;
          value = Math.max(0, value);
          return value;
        },
        getDefault: () => 0.0003,
      },
      mediumLevel: {
        target: 0,
        current: 0,
        upEasing: 0.008,
        downEasing: 0.004,
        getValue: () => {
          let value = this.microphone.levels[1] || 0;
          value *= 2;
          value += 3.587;
          value = Math.max(3.587, value);
          return value;
        },
        getDefault: () => 3.587,
      },
      highLevel: {
        target: 0,
        current: 0,
        upEasing: 0.02,
        downEasing: 0.001,
        getValue: () => {
          let value = this.microphone.levels[2] || 0;
          value *= 5;
          value += 0.5;
          value = Math.max(0.5, value);
          return value;
        },
        getDefault: () => 0.65,
      },
    };
  }

  setLights() {
    this.lights = {
      a: {
        intensity: 1.85,
        color: {
          value: "#ff3e00",
          instance: new THREE.Color("#ff3e00"),
        },
        spherical: new THREE.Spherical(1, 0.785, -2.356),
      },
      b: {
        intensity: 1.4,
        color: {
          value: "#0063ff",
          instance: new THREE.Color("#0063ff"),
        },
        spherical: new THREE.Spherical(1, 2.561, -1.844),
      },
    };

    if (this.debug) {
      for (const _lightName in this.lights) {
        const light = this.lights[_lightName as keyof ILights];

        // @ts-expect-error - Tweakpane types are incorrect
        const debugFolder = this.debugFolder.addFolder({
          title: _lightName,
          expanded: true,
        });

        debugFolder
          .addInput(light.color, "value", { view: "color", label: "color" })
          .on("change", () => {
            light.color.instance.set(light.color.value);
          });

        debugFolder
          .addInput(light, "intensity", { min: 0, max: 10 })
          .on("change", () => {
            if (this.material) {
              this.material.uniforms[
                `uLight${_lightName.toUpperCase()}Intensity`
              ].value = light.intensity;
            }
          });

        debugFolder
          .addInput(light.spherical, "phi", {
            label: "phi",
            min: 0,
            max: Math.PI,
            step: 0.001,
          })
          .on("change", () => {
            if (this.material) {
              this.material.uniforms[
                `uLight${_lightName.toUpperCase()}Position`
              ].value.setFromSpherical(light.spherical);
            }
          });

        debugFolder
          .addInput(light.spherical, "theta", {
            label: "theta",
            min: -Math.PI,
            max: Math.PI,
            step: 0.001,
          })
          .on("change", () => {
            if (this.material) {
              this.material.uniforms.uLightAPosition.value.setFromSpherical(
                light.spherical
              );
            }
          });
      }
    }
  }

  setOffset() {
    const spherical = new THREE.Spherical(
      1,
      Math.random() * Math.PI,
      Math.random() * Math.PI * 2
    );
    const direction = new THREE.Vector3();
    direction.setFromSpherical(spherical);

    this.offset = {
      spherical,
      direction,
    };
  }

  setGeometry() {
    this.geometry = new THREE.SphereGeometry(1, 512, 512);
    this.geometry.computeTangents();
  }

  setMaterial() {
    const lights = this.lights as ILights;
    const geometry = this.geometry as THREE.SphereGeometry;

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uLightAColor: { value: lights.a.color.instance },
        uLightAPosition: { value: new THREE.Vector3(1, 1, 0) },
        uLightAIntensity: { value: lights.a.intensity },

        uLightBColor: { value: lights.b.color.instance },
        uLightBPosition: { value: new THREE.Vector3(-1, -1, 0) },
        uLightBIntensity: { value: lights.b.intensity },

        uSubdivision: {
          value: new THREE.Vector2(
            geometry.parameters.widthSegments,
            geometry.parameters.heightSegments
          ),
        },

        uOffset: { value: new THREE.Vector3() },

        uDistortionFrequency: { value: 1.5 },
        uDistortionStrength: { value: 0.65 },
        uDisplacementFrequency: { value: 2.12 },
        uDisplacementStrength: { value: 0.152 },

        uFresnelOffset: { value: -1.609 },
        uFresnelMultiplier: { value: 3.587 },
        uFresnelPower: { value: 1.793 },

        uTime: { value: 0 },
      },
      defines: {
        USE_TANGENT: "",
      },
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
    });

    this.material.uniforms.uLightAPosition.value.setFromSpherical(
      lights.a.spherical
    );
    this.material.uniforms.uLightBPosition.value.setFromSpherical(
      lights.b.spherical
    );

    if (this.debug) {
      // @ts-expect-error - Tweakpane types are incorrect
      this.debugFolder.addInput(
        this.material.uniforms.uDistortionFrequency,
        "value",
        { label: "uDistortionFrequency", min: 0, max: 10, step: 0.001 }
      );
      // @ts-expect-error - Tweakpane types are incorrect
      this.debugFolder.addInput(
        this.material.uniforms.uDistortionStrength,
        "value",
        { label: "uDistortionStrength", min: 0, max: 10, step: 0.001 }
      );
      // @ts-expect-error - Tweakpane types are incorrect
      this.debugFolder.addInput(
        this.material.uniforms.uDisplacementFrequency,
        "value",
        { label: "uDisplacementFrequency", min: 0, max: 5, step: 0.001 }
      );
      // @ts-expect-error - Tweakpane types are incorrect
      this.debugFolder.addInput(
        this.material.uniforms.uDisplacementStrength,
        "value",
        { label: "uDisplacementStrength", min: 0, max: 1, step: 0.001 }
      );
      // @ts-expect-error - Tweakpane types are incorrect
      this.debugFolder.addInput(
        this.material.uniforms.uFresnelOffset,
        "value",
        { label: "uFresnelOffset", min: -2, max: 2, step: 0.001 }
      );
      // @ts-expect-error - Tweakpane types are incorrect
      this.debugFolder.addInput(
        this.material.uniforms.uFresnelMultiplier,
        "value",
        { label: "uFresnelMultiplier", min: 0, max: 5, step: 0.001 }
      );
      // @ts-expect-error - Tweakpane types are incorrect
      this.debugFolder.addInput(this.material.uniforms.uFresnelPower, "value", {
        label: "uFresnelPower",
        min: 0,
        max: 5,
        step: 0.001,
      });
    }
  }

  setMesh() {
    const geometry = this.geometry as THREE.SphereGeometry;
    const material = this.material as THREE.ShaderMaterial;

    this.mesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.mesh);
  }

  update() {
    // Update variations
    for (const _variationName in this.variations) {
      const variation = this.variations[_variationName as keyof IVariations];
      variation.target = this.microphone.ready
        ? variation.getValue()
        : variation.getDefault();

      const easing =
        variation.target > variation.current
          ? variation.upEasing
          : variation.downEasing;
      variation.current +=
        (variation.target - variation.current) * easing * this.time.delta;
    }

    // Time
    if (this.variations) {
      this.timeFrequency = this.variations.lowLevel.current;
      this.elapsedTime = this.time.delta * this.timeFrequency;
    }

    // Update material
    if (this.material && this.variations) {
      this.material.uniforms.uDisplacementStrength.value =
        this.variations.volume.current;
      this.material.uniforms.uDistortionStrength.value =
        this.variations.highLevel.current;
      this.material.uniforms.uFresnelMultiplier.value =
        this.variations.mediumLevel.current;
    }

    // Offset
    const offsetTime = this.elapsedTime * 0.3;
    if (this.offset) {
      this.offset.spherical.phi =
        (Math.sin(offsetTime * 0.001) * Math.sin(offsetTime * 0.00321) * 0.5 +
          0.5) *
        Math.PI;
      this.offset.spherical.theta =
        (Math.sin(offsetTime * 0.0001) * Math.sin(offsetTime * 0.000321) * 0.5 +
          0.5) *
        Math.PI *
        2;
      this.offset.direction.setFromSpherical(this.offset.spherical);
      this.offset.direction.multiplyScalar(this.timeFrequency * 2);

      if (this.material) {
        this.material.uniforms.uOffset.value.add(this.offset.direction);

        // Time
        this.material.uniforms.uTime.value += this.elapsedTime;
      }
    }
  }
}

export default Sphere;
