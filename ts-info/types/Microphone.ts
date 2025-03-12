export interface ISpectrum {
  width: number;
  height: number;
  halfHeight: number;
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  update: () => void;
}
