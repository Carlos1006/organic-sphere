import { Pane } from "tweakpane";
import Experience from "./Experience";
import { ISpectrum } from "../types/Microphone";

class Microphone {
  experience: Experience;
  debug: Pane;
  ready: boolean;
  volume: number;
  levels: number[];
  stream: MediaStream | null = null;
  audioContext: AudioContext | null = null;
  mediaStreamSourceNode: MediaStreamAudioSourceNode | null = null;
  analyserNode: AnalyserNode | null = null;
  floatTimeDomainData: Float32Array | null = null;
  byteFrequencyData: Uint8Array | null = null;
  spectrum: ISpectrum | null = null;

  constructor(experience: Experience) {
    this.experience = experience;
    this.debug = experience.debug as Pane;
    this.ready = false;
    this.volume = 0;
    this.levels = [];

    navigator.mediaDevices
      .getUserMedia({ audio: true, video: false })
      .then((_stream) => {
        this.stream = _stream;

        this.init();

        if (this.debug) {
          this.setSpectrum();
        }
      });
  }

  init(): void {
    this.audioContext = new AudioContext();

    if (this.stream) {
      this.mediaStreamSourceNode = this.audioContext.createMediaStreamSource(
        this.stream
      );
    }

    this.analyserNode = this.audioContext.createAnalyser();
    this.analyserNode.fftSize = 256;

    if (this.mediaStreamSourceNode) {
      this.mediaStreamSourceNode.connect(this.analyserNode);
    }

    this.floatTimeDomainData = new Float32Array(this.analyserNode.fftSize);
    this.byteFrequencyData = new Uint8Array(this.analyserNode.fftSize);

    this.ready = true;
  }

  setSpectrum(): void {
    const width = this.analyserNode?.fftSize ?? 0;
    const height = 128;
    const halfHeight = Math.round(height * 0.5);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.style.position = "fixed";
    canvas.style.left = "0";
    canvas.style.bottom = "0";

    document.body.append(canvas);

    const context: CanvasRenderingContext2D = this.spectrum?.canvas.getContext(
      "2d"
    ) as CanvasRenderingContext2D;
    context.fillStyle = "#ffffff";

    const update = (): void => {
      if (this.spectrum) {
        this.spectrum.context.clearRect(
          0,
          0,
          this.spectrum.width,
          this.spectrum.height
        );
      }

      if (
        this.spectrum &&
        this.analyserNode &&
        this.byteFrequencyData &&
        this.floatTimeDomainData
      ) {
        for (let i = 0; i < this.analyserNode.fftSize; i++) {
          // ? const floatTimeDomainValue = this.floatTimeDomainData[i];
          const byteFrequencyValue = this.byteFrequencyData[i];
          const normalizeByteFrequencyValue = byteFrequencyValue / 255;

          const x = i;
          const y =
            this.spectrum.height -
            normalizeByteFrequencyValue * this.spectrum.height;
          const width = 1;
          // const height = floatTimeDomainValue * this.spectrum.height
          const height = normalizeByteFrequencyValue * this.spectrum.height;

          this.spectrum.context.fillRect(x, y, width, height);
        }
      }
    };

    this.spectrum = {
      width,
      height,
      halfHeight,
      canvas,
      context,
      update,
    };
  }

  getLevels(): number[] {
    const bufferLength = this.analyserNode?.fftSize ?? 0;
    const levelCount = 8;
    const levelBins = Math.floor(bufferLength / levelCount);

    const levels = [];
    let max = 0;

    if (this.byteFrequencyData) {
      for (let i = 0; i < levelCount; i++) {
        let sum = 0;

        for (let j = 0; j < levelBins; j++) {
          sum += this.byteFrequencyData[i * levelBins + j];
        }

        const value = sum / levelBins / 256;
        levels[i] = value;

        if (value > max) max = value;
      }
    }

    return levels;
  }

  getVolume(): number {
    let sumSquares: number = 0.0;
    if (this.floatTimeDomainData) {
      for (const amplitude of this.floatTimeDomainData) {
        sumSquares += amplitude * amplitude;
      }
      return Math.sqrt(sumSquares / this.floatTimeDomainData.length);
    }
    return 0;
  }

  update() {
    if (!this.ready) return;

    // Retrieve audio data
    if (
      this.analyserNode &&
      this.byteFrequencyData &&
      this.floatTimeDomainData
    ) {
      this.analyserNode.getByteFrequencyData(this.byteFrequencyData);
      this.analyserNode.getFloatTimeDomainData(this.floatTimeDomainData);
    }

    this.volume = this.getVolume();
    this.levels = this.getLevels();

    // Spectrum
    if (this.spectrum) this.spectrum.update();
  }
}

export default Microphone;
