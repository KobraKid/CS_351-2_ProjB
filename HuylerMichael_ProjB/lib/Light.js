class Light {
  constructor(position = glMatrix.vec4.fromValues(0, 0, 1, 0), color = glMatrix.vec4.fromValues(1, 1, 1, 1)) {

  }
}

class LightList {
  constructor() {
    this._lights = [];
  }

  get size() {
    return this._lights.length;
  }

  add(l) {
    this._lights.push(l);
  }

  get(i) {
    return this._lights[i];
  }
}
