import { IAsset } from "../types/Asset";
import EventEmitter from "./EventEmitter";
import Experience from "./Experience";
import { IAssetGroup, IItems, PossibleTexture } from "../types/Resources";
import Loader from "./Loader";
import { Data, IResource } from "../types/Loader";
import * as THREE from "three";

class Resources extends EventEmitter {
  loader: Loader;
  groups: IAssetGroup = {
    assets: [],
    current: null,
    loaded: [],
  };
  items: IItems;

  constructor(assets: IAsset[], _experience: Experience) {
    super();

    // Items (will contain every resources)
    this.items = {};

    // Loader
    this.loader = new Loader(_experience);

    this.groups = {
      assets: [...assets],
      loaded: [],
      current: null,
    };
    this.loadNextGroup();

    // Loader file end event
    this.loader.on("fileEnd", (_resource: IResource, _data: Data): void => {
      let data = _data as PossibleTexture | THREE.Texture;

      // Convert to texture
      if (_resource.type === "texture") {
        if (!(data instanceof THREE.Texture)) {
          data = new THREE.Texture(_data as PossibleTexture);
        }
        data.needsUpdate = true;
      }

      this.items[_resource.name] = data;

      // Progress and event
      if (this.groups.current && this.groups.current.loaded) {
        const value = Number(this.groups.current.loaded);
        this.groups.current.loaded = value + 1;
      }

      this.trigger("progress", [this.groups.current, _resource, data]);
    });

    // Loader all end event
    this.loader.on("end", () => {
      if (this.groups.current) {
        this.groups.loaded.push(this.groups.current);
      }

      // Trigger
      this.trigger("groupEnd", [this.groups.current]);

      if (this.groups.assets.length > 0) {
        this.loadNextGroup();
      } else {
        this.trigger("end");
      }
    });
  }

  loadNextGroup() {
    const nextAsset = this.groups.assets.shift();
    if (nextAsset) {
      this.groups.current = nextAsset;
      this.groups.current.toLoad = this.groups.current.items.length;
      this.groups.current.loaded = 0;
      this.loader.load(this.groups.current.items);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createInstancedMeshes(_children: any[], _groups: any) {
    // Groups
    const groups = [];

    for (const _group of _groups) {
      groups.push({
        name: _group.name,
        regex: _group.regex,
        meshesGroups: [],
        instancedMeshes: [],
      });
    }

    // Result
    const result = {};

    for (const _group of groups) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      result[_group.name] = _group.instancedMeshes;
    }

    return result;
  }

  destroy() {
    for (const _itemKey in this.items) {
      const item = this.items[_itemKey];
      if (item instanceof THREE.Texture) {
        item.dispose();
      }
    }
  }
}

export default Resources;
