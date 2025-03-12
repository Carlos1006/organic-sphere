import {
  EffectComposer,
  RenderPass,
  UnrealBloomPass,
} from "three/examples/jsm/Addons.js";

export interface IPostProcess {
  renderPass?: RenderPass;
  unrealBloomPass?: UnrealBloomPass;
  composer?: EffectComposer;
}
