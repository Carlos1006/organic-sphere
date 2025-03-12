import * as THREE from "three";
import { GLTF } from "three/examples/jsm/Addons.js";

export interface IResource {
  name: string;
  source: string;
  type: string;
  [key: string]: unknown;
}

export interface IItems {
  [key: string]: unknown;
}

export interface ILoader {
  extensions: string[];
  action: (_resouce: IResource) => void;
}

export type Data =
  | HTMLImageElement
  | GLTF
  | THREE.DataTexture
  | THREE.Group<THREE.Object3DEventMap>
  | THREE.BufferGeometry<THREE.NormalBufferAttributes>
  | unknown;
