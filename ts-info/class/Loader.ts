// import {
//   DRACOLoader,
//   FBXLoader,
//   GLTFLoader,
//   RGBELoader,
// } from "three/examples/jsm/Addons.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { Data, IItems, ILoader, IResource } from "../types/Loader";
import EventEmitter from "./EventEmitter";
import Experience from "./Experience";
import * as THREE from "three";
// @ts-expect-error - Property 'BasisTextureLoader' does not exist on type 'typeof import("three/examples/jsm/loaders/BasisTextureLoader")'.
import { BasisTextureLoader } from "./BasisTextureLoader";

class Loader extends EventEmitter {
  experience: Experience;
  renderer: THREE.WebGLRenderer | null;
  toLoad: number;
  loaded: number;
  items: IItems = {};
  loaders: ILoader[] = [];

  constructor(_experience: Experience) {
    super();
    this.experience = _experience;
    this.renderer = this.experience.renderer?.instance ?? null;

    this.setLoaders();

    this.toLoad = 0;
    this.loaded = 0;
    this.items = {};
  }

  setLoaders(): void {
    this.loaders = [];

    // Images
    this.loaders.push({
      extensions: ["jpg", "png"],
      action: (_resource: IResource): void => {
        const image = new Image();

        image.addEventListener("load", () => {
          this.fileLoadEnd(_resource, image);
        });

        image.addEventListener("error", () => {
          this.fileLoadEnd(_resource, image);
        });

        image.src = _resource.source;
      },
    });

    // Basis images
    const basisLoader = new BasisTextureLoader();
    basisLoader.setTranscoderPath("basis/");
    basisLoader.detectSupport(this.renderer);

    this.loaders.push({
      extensions: ["basis"],
      action: (_resource: IResource) => {
        basisLoader.load(_resource.source, (_data: unknown) => {
          this.fileLoadEnd(_resource, _data);
        });
      },
    });

    // Draco
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("draco/");
    dracoLoader.setDecoderConfig({ type: "js" });

    this.loaders.push({
      extensions: ["drc"],
      action: (_resource) => {
        dracoLoader.load(_resource.source, (_data) => {
          this.fileLoadEnd(_resource, _data);

          // @ts-expect-error - Property 'releaseDecoderModule' does not exist on type 'DRACOLoader'.
          DRACOLoader.releaseDecoderModule();
        });
      },
    });

    // GLTF
    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);

    this.loaders.push({
      extensions: ["glb", "gltf"],
      action: (_resource) => {
        gltfLoader.load(_resource.source, (_data) => {
          this.fileLoadEnd(_resource, _data);
        });
      },
    });

    // FBX
    const fbxLoader = new FBXLoader();

    this.loaders.push({
      extensions: ["fbx"],
      action: (_resource) => {
        fbxLoader.load(_resource.source, (_data) => {
          this.fileLoadEnd(_resource, _data);
        });
      },
    });

    // RGBE | HDR
    const rgbeLoader = new RGBELoader();

    this.loaders.push({
      extensions: ["hdr"],
      action: (_resource) => {
        rgbeLoader.load(_resource.source, (_data) => {
          this.fileLoadEnd(_resource, _data);
        });
      },
    });
  }

  fileLoadEnd(_resource: IResource, _data: Data): void {
    this.loaded++;
    this.items[_resource.name] = _data;
    this.trigger("fileEnd", [_resource, _data]);
    if (this.loaded === this.toLoad) {
      this.trigger("end");
    }
  }

  load(_resources: IResource[] = []) {
    for (const _resource of _resources) {
      this.toLoad++;
      const extensionMatch = _resource.source.match(/\.([a-z]+)$/);

      if (extensionMatch && typeof extensionMatch[1] !== "undefined") {
        const extension = extensionMatch[1];
        const loader = this.loaders.find((_loader) =>
          _loader.extensions.find((_extension) => _extension === extension)
        );

        if (loader) {
          loader.action(_resource);
        } else {
          console.warn(`Cannot found loader for ${_resource}`);
        }
      } else {
        console.warn(`Cannot found extension of ${_resource}`);
      }
    }
  }
}

export default Loader;
