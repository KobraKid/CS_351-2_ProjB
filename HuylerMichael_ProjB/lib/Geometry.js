const GEOMETRIES = {
  GRID: 0,
  DISC: 1,
  SPHERE: 2,
}

class Geometry {
  constructor(type, colors) {
    this._type = type;
    this.world_to_model = glMatrix.mat4.create();
    this.normal_to_world = glMatrix.mat4.create();
    switch (this._type) {
      case GEOMETRIES.DISC:
        this.radius = 2.0;
        // fallthrough
      case GEOMETRIES.GRID:
        this.xgap = 1.0;
        this.ygap = 1.0;
        this.lineWidth = 0.1;
        this.lineColor = colors[0];
        this.gapColor = colors[1];
        break;
      case GEOMETRIES.SPHERE:
        this.radium = 2.0;
        break;
      default:
        break;
    }
  }

  trace(inRay, hit) {
    switch (this._type) {
      case GEOMETRIES.GRID:
        // copy ray and transform
        var rayT = new Ray();
        glMatrix.vec4.transformMat4(rayT.origin, inRay.origin, this.world_to_model);
        glMatrix.vec4.transformMat4(rayT.direction, inRay.direction, this.world_to_model);

        // find the hit point
        var t_0 = -rayT.origin[2] / rayT.direction[2];

        // behind the camera, or further from the camera than a previous hit
        if (t_0 < 0 || t_0 > hit.t_0)
          return;

        hit.t_0 = t_0;
        hit.hitGeom = this;
        glMatrix.vec4.scaleAndAdd(hit.modelHitPoint, rayT.origin, rayT.direction, t_0);
        glMatrix.vec4.scaleAndAdd(hit.hitPoint, rayT.origin, rayT.direction, t_0);
        glMatrix.vec4.negate(hit.viewNormal, inRay.direction);
        glMatrix.vec4.normalize(hit.viewNormal, hit.viewNormal);
        glMatrix.vec4.set(hit.surfaceNormal, 0, 0, 1, 0);

        // if the following conditionals are met, this ray hit a line
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

        // otherwise this ray hit a gap
        hit.hitNum = 0;
        break;
      case GEOMETRIES.DISC:
        // copy ray and transform
        var rayT = new Ray();
        glMatrix.vec4.transformMat4(rayT.origin, inRay.origin, this.world_to_model);
        glMatrix.vec4.transformMat4(rayT.direction, inRay.direction, this.world_to_model);

        // find the hit point
        var t_0 = -rayT.origin[2] / rayT.direction[2];

        // behind the camera, further from the camera than a previous hit,
        // or outside of radius
        if (t_0 < 0 || t_0 > hit.t_0)
          return;
        var plane_intxn = glMatrix.vec4.create();
        glMatrix.vec4.scaleAndAdd(plane_intxn, inRay.origin, inRay.direction, t_0);
        if (plane_intxn[0] * plane_intxn[0] + plane_intxn[1] * plane_intxn[1] > this.radius * this.radius)
          return;

        hit.t_0 = t_0;
        hit.hitGeom = this;
        glMatrix.vec4.scaleAndAdd(hit.modelHitPoint, rayT.origin, rayT.direction, t_0);
        glMatrix.vec4.scaleAndAdd(hit.hitPoint, rayT.origin, rayT.direction, t_0);
        glMatrix.vec4.negate(hit.viewNormal, inRay.direction);
        glMatrix.vec4.normalize(hit.viewNormal, hit.viewNormal);
        glMatrix.vec4.transformMat4(hit.surfaceNormal, glMatrix.vec4.fromValues(0, 0, 1, 0), this.normal_to_world);
        glMatrix.vec4.normalize(hit.surfaceNormal, hit.surfaceNormal);

        // if the following conditionals are met, this ray hit a line
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

        // otherwise this ray hit a gap
        hit.hitNum = 0;
        break;
      default:
        break;
    }
  }

  setIdentity() {
    glMatrix.mat4.identity(this.world_to_model);
    glMatrix.mat4.identity(this.normal_to_world);
  }

  rayTranslate(x, y, z) {
    var inverse_translate = glMatrix.mat4.create();
    inverse_translate[12] = -x;
    inverse_translate[13] = -y;
    inverse_translate[14] = -z;
    glMatrix.mat4.multiply(this.world_to_model, inverse_translate, this.world_to_model);
    glMatrix.mat4.transpose(this.normal_to_world, this.world_to_model);
  }

  rayRotate(rad, ax, ay, az) {
    var x = ax;
    var y = ay;
    var z = az;
    var len = Math.sqrt(x * x + y * y + z * z);
    if (Math.abs(len) < glMatrix.GLMAT_EPSILON) {
      console.log("Geometry.rayScale()\tError: zero-length axis vector");
      return null;
    }
    len = 1 / len;
    x *= len;
    y *= len;
    z *= len;
    var s = Math.sin(-rad);
    var c = Math.cos(-rad);
    var t = 1 - c;
    var inverse_rotate = glMatrix.mat4.create();
    inverse_rotate[0] = x * x * t + c;
    inverse_rotate[1] = y * x * t + z * s;
    inverse_rotate[2] = z * x * t - y * s;
    inverse_rotate[3] = 0.0;
    inverse_rotate[4] = x * y * t - z * s;
    inverse_rotate[5] = y * y * t + c;
    inverse_rotate[6] = z * y * t + x * s;
    inverse_rotate[7] = 0.0;
    inverse_rotate[8] = x * z * t + y * s;
    inverse_rotate[9] = y * z * t - x * s;
    inverse_rotate[10] = z * z * t + c;
    inverse_rotate[11] = 0.0;
    inverse_rotate[12] = 0.0;
    inverse_rotate[13] = 0.0;
    inverse_rotate[14] = 0.0;
    inverse_rotate[15] = 1.0;
    glMatrix.mat4.multiply(this.world_to_model, inverse_rotate, this.world_to_model);
    glMatrix.mat4.transpose(this.normal_to_world, this.world_to_model);
  }

  rayScale(sx, sy, sz) {
    if (Math.abs(sx) < glMatrix.GLMAT_EPSILON ||
      Math.abs(sy) < glMatrix.GLMAT_EPSILON ||
      Math.abs(sz) < glMatrix.GLMAT_EPSILON) {
      console.log("Geometry.rayScale()\tError: zero-length scale");
      return null;
    }
    var inverse_scale = glMatrix.mat4.create();
    inverse_scale[0] = 1 / sx;
    inverse_scale[5] = 1 / sy;
    inverse_scale[10] = 1 / sz;
    glMatrix.mat4.multiply(this.world_to_model, inverse_scale, this.world_to_model);
    glMatrix.mat4.transpose(this.normal_to_world, this.world_to_model);
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
