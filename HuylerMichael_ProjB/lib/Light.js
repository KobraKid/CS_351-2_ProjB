class Light {
  constructor() {

  }
}

class LightList {
  constructor() {
    this._lights = [];
  }

  get lights() {
    return this._lights;
  }
  get size() {
    return this._lights.length;
  }
}
