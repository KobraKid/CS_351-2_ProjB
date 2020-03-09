class Ray {
  constructor(origin = glMatrix.vec4.fromValues(0, 0, 0, 1), direction = glMatrix.vec4.fromValues(0, 0, 0, 0)) {
    this._o = origin;
    this._dir = direction;
    this._shadow = false;
  }

  get direction() {
    return this._dir;
  }
  get origin() {
    return this._o;
  }
  get shadow() {
    return this._shadow;
  }

  set_shadow() {
    this._shadow = true;
    return this;
  }

}
