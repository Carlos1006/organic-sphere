import { IAsset } from "./Asset";
import * as THREE from "three";

export interface IAssetGroup {
  assets: IAsset[];
  current: IAsset | null;
  loaded: IAsset[];
}

export type PossibleTexture = TexImageSource | OffscreenCanvas | undefined;

export interface IItems {
  [key: string]: PossibleTexture | THREE.Texture;
}
