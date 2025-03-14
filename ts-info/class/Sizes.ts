import { IViewport } from "../types/Sizes";
import EventEmitter from "./EventEmitter";

class Sizes extends EventEmitter {
  viewport: IViewport;
  $sizeViewport: HTMLElement;
  width: number;
  height: number;

  constructor() {
    super();

    // Viewport size
    this.viewport = {
      width: 0,
      height: 0,
    };
    this.$sizeViewport = document.createElement("div");
    this.$sizeViewport.style.width = "100vw";
    this.$sizeViewport.style.height = "100vh";
    this.$sizeViewport.style.position = "absolute";
    this.$sizeViewport.style.top = "0";
    this.$sizeViewport.style.left = "0";
    this.$sizeViewport.style.pointerEvents = "none";

    // Window size
    this.width = 0;
    this.height = 0;

    // Resize event
    this.resize = this.resize.bind(this);
    window.addEventListener("resize", this.resize);

    this.resize();
  }

  resize() {
    document.body.appendChild(this.$sizeViewport);
    this.viewport.width = this.$sizeViewport.offsetWidth;
    this.viewport.height = this.$sizeViewport.offsetHeight;
    document.body.removeChild(this.$sizeViewport);

    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.trigger("resize");
  }
}

export default Sizes;
