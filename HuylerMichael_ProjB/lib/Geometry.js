const GEOMETRIES = {
  GRID: 0,
}

class Geometry {
  constructor(type) {
    this._type = type;
    switch (this._type) {
      case GEOMETRIES.GRID:
        this.zGrid;
        this.xgap;
        this.ygap;
        this.linewidth;
        this.linecolor = glMatrix.vec4.fromValues(0.2, 0.5, 0.2, 1.0);
        this.gapcolor = glMatrix.vec4.fromValues(0.9, 0.9, 0.9, 1.0);
        this.skycolor = glMatrix.vec4.fromValues(0.3, 0.9, 0.9, 1.0);
        break;
      default:
        break;
    }
  }

  trace(inRay, hit) {
    switch (this._type) {
      case GEOMETRIES.GRID:
        // Copy the in ray
        var rayT = new Ray();
        glMatrix.vec4.copy(inRay.origin, rayT.origin);
        glMatrix.vec4.copy(inRay.direction, rayT.direction);

        // calculate the hit point
        var t_0 = -rayT.origin[2] / rayT.direction[2];
        if (t_0 < 0 || t_0 > hit.t_0) {
          return;
        }
        hit.t_0 = t_0;
        hit.hitGeom = this;
        glMatrix.vec4.scaleAndAdd(hit.modelHitPoint, rayT.origin, rayT.direction, hit.t_0);
        glMatrix.vec4.copy(hit.hitPoint, hit.modelHitPoint);
        glMatrix.vec4.negate(hit.viewN, inRay.direction);
        glMatrix.vec4.normalize(hit.viewN, hit.viewN);
        glMatrix.vec4.set(hit.surfaceNormal, 0, 0, 1, 0);

        // calculate the color
        var loc = hit.modelHitPoint[0] / this.xgap;
        if (hit.modelHitPoint[0] < 0) loc = -loc;
        if (loc % 1 < this.lineWidth) {
          hit.hitNum = 1;
          return;
        }
        loc = hit.modelHitPoint[1] / this.ygap;
        if (hit.modelHitPoint[1] < 0) loc = -loc;
        if (loc % 1 < this.lineWidth) {
          hit.hitNum = 1;
          return;
        }
        hit.hitNum = 0;
        return;
        break;
      default:
        break;
    }
  }
}

class GeometryList {
  constructor() {
    this._geom = [];
  }

  get geometry() {
    return this._geom;
  }
  get size() {
    return this._geom.length;
  }

  add(g) {
    this._geom.push(g);
  }

}
