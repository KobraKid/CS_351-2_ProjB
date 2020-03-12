class Hit {
  constructor() {
    this.hit_geometry = null;
    this.ambient = glMatrix.vec4.create();
    this.diffuse = glMatrix.vec4.create();
    this.emissive = glMatrix.vec4.create();
    this.specular = glMatrix.vec4.create();
    this.t_0 = 10000; // Infinity
    this.hitPoint = glMatrix.vec4.create();
    this.surfaceNormal = glMatrix.vec4.create();
    this.viewNormal = glMatrix.vec4.create();
    this.isEntering = true;
    this.modelHitPoint = glMatrix.vec4.create();
  }

  clear() {
    this.hit_geometry = null;
    glMatrix.vec4.zero(this.ambient);
    glMatrix.vec4.zero(this.diffuse);
    glMatrix.vec4.zero(this.emissive);
    glMatrix.vec4.zero(this.specular);
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
