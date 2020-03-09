class Hit {
  constructor(color) {
    this.hitGeom = null;
    this.hitNum = -1;
    this.t_0 = 10000; // Infinity
    this.hitPoint = glMatrix.vec4.create();
    this.surfaceNormal = glMatrix.vec4.create();
    this.viewNormal = glMatrix.vec4.create();
    this.isEntering = true;
    this.modelHitPoint = glMatrix.vec4.create();
    this.color = glMatrix.vec4.clone(color);
  }

  clear() {
    this.hitGeom = -1;
    this.hitNum = g_scene.sky_color;
    this.t_0 = 10000; // Infinity
    glMatrix.vec4.set(this.hitPoint, this.t_0, 0, 0, 1);
    glMatrix.vec4.set(this.surfaceNormal, -1, 0, 0, 0);
    glMatrix.vec4.set(this.viewNormal, -1, 0, 0, 0);
    glMatrix.vec4.copy(this.modelHitPoint, this.hitPoint);
  }
}

class HitList {
  constructor() {
    this._hits = [];
  }

  get hits() {
    return this._hits;
  }
  get size() {
    return this._hits.length;
  }
}
