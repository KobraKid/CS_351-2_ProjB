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

  /**
   * Reflects in incident vector about a normal vector.
   *
   * @param {!vec4} R The reflection ray.
   * @param {!vec4} L The incident/light ray.
   * @param {!vec4} N The surface normal ray.
   *
   * @return {vec4} The reflection ray.
   */
  static reflect(R, L, N) {
    // Reflection ray
    glMatrix.vec4.zero(R);
    // Lengthened surface normal
    var C = glMatrix.vec4.create();
    glMatrix.vec4.scale(C, N, glMatrix.vec4.dot(N, L));
    glMatrix.vec4.scale(R, C, 2);
    glMatrix.vec4.subtract(R, R, L);
    return R;
  }

}
