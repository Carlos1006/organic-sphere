import { IResource } from "./Loader";

export interface IAsset {
  name: string;
  data: object;
  items: IResource[];
  loaded?: number;
  toLoad?: number;
}
