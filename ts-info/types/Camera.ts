import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/Addons.js";

export interface IMode {
  instance: THREE.PerspectiveCamera | THREE.OrthographicCamera | null;
  orbitControls: OrbitControls | null;
  active?: boolean;
}

export interface IModes {
  default: IMode;
  debug: IMode;
}
