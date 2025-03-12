import StatsJs from "stats.js";
import { IRender } from "../types/Stats";

class Stats {
  instance: StatsJs;
  active: boolean;
  max: number;
  ignoreMax: boolean;
  render: IRender | null = null;

  constructor(active: boolean) {
    this.instance = new StatsJs();
    this.instance.showPanel(3);

    this.active = false;
    this.max = 40;
    this.ignoreMax = true;

    if (active) {
      this.activate();
    }

    document.body.appendChild(this.instance.dom);
  }

  activate(): void {
    this.active = true;
    document.body.appendChild(this.instance.dom);
  }

  deactivate(): void {
    this.active = false;
    document.body.removeChild(this.instance.dom);
  }

  update(): void {
    if (!this.active) return;
    this.instance.update();
  }

  // TODO: Implement setRenderePanel
  setRenderPanel(
    _context: WebGLRenderingContext | WebGL2RenderingContext
  ): void {
    const context = _context;
    const extension = context.getExtension("EXT_disjoint_timer_query_webgl2");
    const panel = this.instance.addPanel(
      new StatsJs.Panel("Render (ms)", "#f8f", "#212")
    );

    const webGL2 =
      typeof WebGL2RenderingContext !== "undefined" &&
      _context instanceof WebGL2RenderingContext;

    this.render = {
      context,
      panel,
      extension,
    };

    if (!webGL2 || !this.render.extension) {
      this.deactivate();
    }
  }

  // TODO: Implement setMode
  beforeRender(): void {}

  // TODO: Implement afterRender
  afterRender(): void {}

  destroy(): void {
    this.deactivate();
  }
}

export default Stats;
