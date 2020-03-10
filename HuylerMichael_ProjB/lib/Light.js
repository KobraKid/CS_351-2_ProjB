class Light {
  constructor(position = glMatrix.vec4.fromValues(0, 0, 1, 1), color = glMatrix.vec4.fromValues(1, 1, 1, 1)) {
    this._pos = position;
    this._color = color;
  }

  get color() {
    return this._color;
  }
  get position() {
    return this._pos;
  }

  createShadowRay(shadow_ray, hitPoint) {
    glMatrix.vec4.subtract(shadow_ray, this.position, hitPoint);
    shadow_ray[3] = 0;
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
