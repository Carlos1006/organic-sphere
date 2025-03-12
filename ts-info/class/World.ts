import * as THREE from "three";
import { IExperienceConfig } from "../types/Experience";
import Experience from "./Experience";
import Resources from "./Resources";
import Sphere from "./Sphere";

class World {
  experience: Experience;
  config: IExperienceConfig;
  scene: THREE.Scene;
  resources: Resources;
  sphere: Sphere | null = null;

  constructor(experience: Experience) {
    {
      this.experience = experience;
      this.config = this.experience.config;
      this.scene = this.experience.scene as THREE.Scene;
      this.resources = this.experience.resources as Resources;

      this.resources.on("groupEnd", (_group) => {
        if (_group.name === "base") {
          this.setSphere();
        }
      });
    }
  }

  setSphere(): void {
    this.sphere = new Sphere(this.experience);
  }

  update(): void {
    if (this.sphere) this.sphere.update();
  }

  resize() {}

  destroy() {}
}

export default World;
