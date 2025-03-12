import StatsJs from "stats.js";

export interface IRender {
  context: WebGLRenderingContext | WebGL2RenderingContext;
  panel: StatsJs.Panel;
  extension: ANGLE_instanced_arrays | null;
}
