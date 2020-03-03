const GEOMETRIES = {
  GRID: 0,
}

class Geometry {
  constructor(type) {
    this._type = type;
    switch (this._type) {
      case GEOMETRIES.GRID:
        this.xgap = 1.0;
        this.ygap = 1.0;
        this.lineWidth = 0.1;
        this.lineColor = glMatrix.vec4.fromValues(0.2, 0.5, 0.2, 1.0);
        this.gapColor = glMatrix.vec4.fromValues(0.9, 0.9, 0.9, 1.0);
        this.skyColor = glMatrix.vec4.fromValues(0.3, 0.9, 0.9, 1.0);
        break;
      default:
        break;
    }
  }

  trace(inRay, hit) {
    switch (this._type) {
      case GEOMETRIES.GRID:
        // calculate the hit point
        var t_0 = -inRay.origin[2] / inRay.direction[2];
        if (t_0 < 0 || t_0 > hit.t_0) {
          hit.hitNum = -1;
          return;
        }
        hit.t_0 = t_0;
        hit.hitGeom = this;
        glMatrix.vec4.scaleAndAdd(hit.modelHitPoint, inRay.origin, inRay.direction, t_0);
        glMatrix.vec4.scaleAndAdd(hit.hitPoint, inRay.origin, inRay.direction, t_0);
        glMatrix.vec4.negate(hit.viewNormal, inRay.direction);
        glMatrix.vec4.normalize(hit.viewNormal, hit.viewNormal);
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

  get size() {
    return this._geom.length;
  }

  add(g) {
    this._geom.push(g);
  }

  get(i) {
    return this._geom[i];
  }

}
