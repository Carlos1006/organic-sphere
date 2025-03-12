export interface IName {
  original: string;
  value: string;
  namespace: string;
}

export interface ICallback {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (...data: any[]): void;
}

export interface ICallbackObject {
  [key: string]: ICallback[];
}

export interface INamespaceObject {
  [key: string]: ICallbackObject;
}
