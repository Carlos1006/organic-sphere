import * as THREE from "three";

export interface IVariation {
  target: number;
  current: number;
  upEasing: number;
  downEasing: number;
  getValue: () => number;
  getDefault: () => number;
}

export interface IVariations {
  volume: IVariation;
  lowLevel: IVariation;
  mediumLevel: IVariation;
  highLevel: IVariation;
}

export interface IColor {
  value: string;
  instance: THREE.Color;
}

export interface ILight {
  intensity: number;
  color: IColor;
  spherical: THREE.Spherical;
}

export interface ILights {
  a: ILight;
  b: ILight;
}

export interface IOffset {
  spherical: THREE.Spherical;
  direction: THREE.Vector3;
}
