import { ICallback, IName, INamespaceObject } from "../types/EventEmitter";

class EventEmitter {
  static BASE_NAMESPACE = "base";
  callbacks: INamespaceObject = {};

  constructor() {
    this.callbacks = {
      [EventEmitter.BASE_NAMESPACE]: {},
    };
  }

  static verifyName(names: string): boolean {
    if (typeof names === "undefined" || names === "") {
      console.warn("wrong names");
      return false;
    }
    return true;
  }

  static verifyCallback(callback: (...data: unknown[]) => void): boolean {
    if (typeof callback !== "function") {
      console.warn("wrong callback");
      return false;
    }
    if (typeof callback === "undefined") {
      console.warn("wrong callback");
      return false;
    }
    return true;
  }

  on(names: string, callback: ICallback): void | EventEmitter {
    const newNames = this.resolveNames(names);

    if (!EventEmitter.verifyCallback(callback)) {
      return;
    }
    if (!EventEmitter.verifyName(names)) {
      return;
    }

    newNames.forEach((name) => {
      const newName: IName = this.resolveName(name);

      if (!this.callbacks[newName.namespace]) {
        this.callbacks[newName.namespace] = {};
      }

      if (!this.callbacks[newName.namespace][newName.value]) {
        this.callbacks[newName.namespace][newName.value] = [];
      }

      this.callbacks[newName.namespace][newName.value].push(callback);
    });

    return this;
  }

  off(names: string): void | EventEmitter {
    if (!EventEmitter.verifyName(names)) {
      return;
    }
    const newNames = this.resolveNames(names);
    newNames.forEach((name) => {
      const newName: IName = this.resolveName(name);
      const { namespace, value } = newName;

      // Remove namespace
      if (namespace !== EventEmitter.BASE_NAMESPACE && value === "") {
        delete this.callbacks[namespace];
      }
      // Delete specific callback in namespace
      else {
        if (namespace === EventEmitter.BASE_NAMESPACE) {
          // Try to remove from each namespace
          for (const namespace in this.callbacks) {
            if (
              this.callbacks[namespace] instanceof Object &&
              this.callbacks[namespace][value] instanceof Array
            ) {
              delete this.callbacks[namespace][value];

              // Remove namespace if empty
              if (Object.keys(this.callbacks[namespace]).length === 0) {
                delete this.callbacks[namespace];
              }
            }
          }
        } // Specified namespace
        else if (
          this.callbacks[namespace] instanceof Object &&
          this.callbacks[namespace][value] instanceof Array
        ) {
          delete this.callbacks[namespace][value];
          // Remove namespace if empty
          if (Object.keys(this.callbacks[namespace]).length === 0) {
            delete this.callbacks[namespace];
          }
        }
      }

      // if (this.callbacks[newName.namespace] && this.callbacks[newName.namespace][newName.value]) {
      //   delete this.callbacks[newName.namespace][newName.value];
      // }
    });

    return this;
  }

  trigger(name: string, ...args: unknown[]): undefined | unknown {
    if (!EventEmitter.verifyName(name)) {
      return;
    }
    let finalResult: unknown = null;
    let result: unknown = null;
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const that = this;

    const safeArguments = !(args instanceof Array) ? [] : args;
    const newNames = this.resolveNames(name);
    const newName = this.resolveName(newNames[0]);

    // Default namespace
    if (newName.namespace === EventEmitter.BASE_NAMESPACE) {
      // Try to find callback in each namespace
      for (const namespace in this.callbacks) {
        if (
          this.callbacks[namespace] instanceof Object &&
          this.callbacks[namespace][newName.value] instanceof Array
        ) {
          this.callbacks[namespace][newName.value].forEach(function (callback) {
            result = callback.apply(that, safeArguments);
            if (typeof finalResult === "undefined") {
              finalResult = result;
            }
          });
        }
      }
    }

    // Specified namespace
    else if (this.callbacks[newName.namespace] instanceof Object) {
      if (newName.value === "") {
        console.warn("wrong name");
        return this;
      }
      that.callbacks[newName.namespace][newName.value].forEach(function (
        callback
      ) {
        result = callback.apply(that, safeArguments);
        if (typeof finalResult === "undefined") finalResult = result;
      });
    }

    return {};
  }

  resolveName(_name: string): IName {
    const parts = _name.split(".");
    const newName: IName = {
      original: _name,
      value: parts[0],
      namespace: "base",
    };
    // Specified namespace
    if (parts.length > 1 && parts[1] !== "") {
      newName.namespace = parts[1];
    }
    return newName;
  }

  resolveNames(_names: string): string[] {
    let names = _names;
    names = names.replace(/[^a-zA-Z0-9 ,/.]/g, "");
    names = names.replace(/[,/]+/g, " ");
    const newNames = names.split(" ");
    return newNames;
  }
}

export default EventEmitter;
