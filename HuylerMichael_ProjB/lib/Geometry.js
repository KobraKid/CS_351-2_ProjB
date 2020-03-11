const GEOMETRIES = {
  GRID: 0,
  DISC: 1,
  SPHERE: 2,
  CUBE: 3,
  R_S_T_: 4,
}

class Geometry {
  constructor(type, colors, material, ...params) {
    this._type = type;
    this._mat = material;
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
        this.radius = 2.0;
        this.dmin = (p) => {
          return Math.sqrt(
            Math.pow(p[0], 2) +
            Math.pow(p[1], 2) +
            Math.pow(p[2], 2)
          ) - 1;
        };
        break;
      case GEOMETRIES.CUBE:
        this.color = colors[0];
        this.dmin = (p) => {
          return Math.sqrt(
            Math.pow(Math.max(0, Math.abs(p[0]) - 1), 2) +
            Math.pow(Math.max(0, Math.abs(p[1]) - 1), 2) +
            Math.pow(Math.max(0, Math.abs(p[2]) - 1), 2)
          );
        };
        break;
      case GEOMETRIES.R_S_T_:
        this.color = colors[0];
        this.dmin = (p) => {
          return Math.pow(Math.abs(p[0]), params[0]) + Math.pow(Math.abs(p[1]), params[1]) + Math.pow(Math.abs(p[2]), params[2]) - 1;
        };
        break;
      default:
        break;
    }
  }

  get type() {
    return this._type;
  }

  /**
   * Traces a ray to determine the intersection point (if it exists).
   *
   * @param {!Ray} inRay The ray (in world coordinates) used to test intersections.
   * @param {!Hit} hit Holds the results of the traced intersection, if any.
   */
  trace(inRay, hit) {
    switch (this.type) {
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
        hit.hit_geometry = this;
        if (inRay.shadow) return;
        glMatrix.vec4.scaleAndAdd(hit.modelHitPoint, rayT.origin, rayT.direction, t_0);
        glMatrix.vec4.scaleAndAdd(hit.hitPoint, rayT.origin, rayT.direction, t_0);
        glMatrix.vec4.negate(hit.viewNormal, inRay.direction);
        glMatrix.vec4.normalize(hit.viewNormal, hit.viewNormal);
        glMatrix.vec4.copy(hit.surfaceNormal, hit.modelHitPoint);
        break;
      case GEOMETRIES.DISC:
        // copy ray and transform
        var rayT = new Ray();
        glMatrix.vec4.copy(rayT.origin, inRay.origin);
        glMatrix.vec4.copy(rayT.direction, inRay.direction);

        glMatrix.vec4.transformMat4(rayT.origin, inRay.origin, this.world_to_model);
        glMatrix.vec4.transformMat4(rayT.direction, inRay.direction, this.world_to_model);

        // find the hit point
        var t_0 = -rayT.origin[2] / rayT.direction[2];

        // behind the camera, further from the camera than a previous hit,
        // or outside of radius
        if (t_0 < 0 || t_0 > hit.t_0)
          return;
        var plane_intxn = glMatrix.vec4.create();
        glMatrix.vec4.scaleAndAdd(plane_intxn, rayT.origin, rayT.direction, t_0);
        if (plane_intxn[0] * plane_intxn[0] + plane_intxn[1] * plane_intxn[1] > this.radius * this.radius)
          return;

        hit.t_0 = t_0;
        hit.hit_geometry = this;
        if (inRay.shadow) return;
        glMatrix.vec4.copy(hit.modelHitPoint, plane_intxn);
        glMatrix.vec4.scaleAndAdd(hit.hitPoint, inRay.origin, inRay.direction, t_0);
        glMatrix.vec4.negate(hit.viewNormal, inRay.direction);
        glMatrix.vec4.normalize(hit.viewNormal, hit.viewNormal);
        glMatrix.vec4.transformMat4(hit.surfaceNormal, glMatrix.vec4.fromValues(0, 0, 1, 0), this.normal_to_world);
        glMatrix.vec4.normalize(hit.surfaceNormal, hit.surfaceNormal);
        break;
      case GEOMETRIES.SPHERE:
        // copy ray and transform
        var rayT = new Ray();
        glMatrix.vec4.transformMat4(rayT.origin, inRay.origin, this.world_to_model);
        glMatrix.vec4.transformMat4(rayT.direction, inRay.direction, this.world_to_model);

        // ray to sphere center
        var r2s = glMatrix.vec4.create();
        glMatrix.vec4.subtract(r2s, glMatrix.vec4.fromValues(0, 0, 0, 1), rayT.origin);
        // |r2s|^2
        var L2 = glMatrix.vec3.dot(r2s, r2s);
        if (L2 <= 1.0) return; // inside sphere

        // tca (origin to chord midpoint) (scaled)
        var tcaS = glMatrix.vec3.dot(rayT.direction, r2s);
        if (tcaS < 0.0) return; // missed, behind camera

        // direction^2
        var DL2 = glMatrix.vec3.dot(rayT.direction, rayT.direction);
        // tca^2 (not scaled)
        var tca2 = tcaS * tcaS / DL2;
        // (sphere center to chord midpoint)^2
        var LM2 = L2 - tca2;
        if (LM2 > 1.0) return; // missed, outside of sphere

        // (half-chord length)^2
        var Lhc2 = (1.0 - LM2);
        var t_0 = tcaS / DL2 - Math.sqrt(Lhc2 / DL2);
        if (t_0 > hit.t_0) return; // farther than some previous hit

        hit.t_0 = t_0;
        hit.hit_geometry = this;
        if (inRay.shadow) return;
        glMatrix.vec4.scaleAndAdd(hit.modelHitPoint, rayT.origin, rayT.direction, hit.t_0);
        glMatrix.vec4.scaleAndAdd(hit.hitPoint, inRay.origin, inRay.direction, hit.t_0);
        glMatrix.vec4.negate(hit.viewNormal, inRay.direction);
        glMatrix.vec4.normalize(hit.viewNormal, hit.viewNormal);
        glMatrix.vec4.transformMat4(hit.surfaceNormal, glMatrix.vec4.fromValues(0, 0, 1, 0), this.normal_to_world);
        glMatrix.vec4.normalize(hit.surfaceNormal, hit.surfaceNormal);
        break;
        // Any 'ray marching' shapes
      case GEOMETRIES.CUBE:
      case GEOMETRIES.R_S_T_:
        // copy ray and transform
        var rayT = new Ray();
        glMatrix.vec4.transformMat4(rayT.origin, inRay.origin, this.world_to_model);
        glMatrix.vec4.transformMat4(rayT.direction, inRay.direction, this.world_to_model);

        // create a point p that will march toward a surface
        var p = glMatrix.vec4.clone(rayT.origin);
        var march = 0;
        var t_0 = 0;
        do {
          glMatrix.vec4.scaleAndAdd(p, p, rayT.direction, march);
          march = this.dmin(p);
          t_0 += march;
        } while (march > EPSILON && march < MAX_MISS);

        if (this.dmin(p) > MAX_MISS) return; // too big, missed

        if (t_0 > hit.t_0) return; // farther than some previous hit

        hit.t_0 = t_0;
        hit.hit_geometry = this;
        if (inRay.shadow) return;
        glMatrix.vec4.scaleAndAdd(hit.modelHitPoint, rayT.origin, rayT.direction, hit.t_0);
        glMatrix.vec4.scaleAndAdd(hit.hitPoint, inRay.origin, inRay.direction, hit.t_0);
        glMatrix.vec4.negate(hit.viewNormal, inRay.direction);
        glMatrix.vec4.normalize(hit.viewNormal, hit.viewNormal);
        glMatrix.vec4.transformMat4(hit.surfaceNormal, glMatrix.vec4.fromValues(0, 0, 1, 0), this.normal_to_world);
        glMatrix.vec4.normalize(hit.surfaceNormal, hit.surfaceNormal);
        break;
      default:
        break;
    }
  }

  /**
   * Computes the shade of this object at a given hit point.
   *
   * @param {!Hit} hit The hit point where the shading is being done.
   */
  shade(hit) {
    var light_pos = glMatrix.vec4.fromValues(
      g_scene.lights.get(0).position[0],
      g_scene.lights.get(0).position[1],
      g_scene.lights.get(0).position[2],
      0);

    glMatrix.vec4.transformMat4(light_pos, light_pos, this.world_to_model);

    var N = glMatrix.vec4.fromValues(hit.modelHitPoint[0], hit.modelHitPoint[1], hit.modelHitPoint[2], 0);
    glMatrix.vec4.normalize(N, N);
    var L = glMatrix.vec4.subtract(glMatrix.vec4.create(), light_pos, hit.modelHitPoint);
    glMatrix.vec4.normalize(L, L);
    var n_dot_l = glMatrix.vec4.dot(N, L);
    var R = glMatrix.vec4.create();
    Ray.reflect(R, L, N);

    var color = glMatrix.vec4.create();
    glMatrix.vec4.zero(color);
    var attenuation = 1; // default
    // Emissive
    glMatrix.vec4.add(color, color,
      this._mat.K_e);
    // Ambient illumination * ambient reflectance
    glMatrix.vec4.add(color, color,
      glMatrix.vec4.multiply(
        glMatrix.vec4.create(),
        this._mat.I_a,
        this._mat.K_a));
    // Duffuse illumination * diffuse reflectance
    glMatrix.vec4.scaleAndAdd(color, color,
      glMatrix.vec4.multiply(
        glMatrix.vec4.create(),
        this._mat.I_d,
        this._mat.K_d),
      Math.max(0, n_dot_l) * attenuation);
    // Specular illumination * specular reflectance
    glMatrix.vec4.scaleAndAdd(color, color,
      glMatrix.vec4.multiply(
        glMatrix.vec4.create(),
        this._mat.I_s,
        this._mat.K_s),
      Math.pow(
        Math.max(
          0,
          glMatrix.vec4.dot(R, glMatrix.vec4.clone(hit.viewNormal))),
        this._mat.se) * attenuation);
    hit.hit_color = color;
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

function clamp(value, min, max) {
  return (value < min ? min : (value > max ? max : value));
}
