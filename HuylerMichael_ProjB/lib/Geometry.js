const GEOMETRIES = {
  GRID: 0,
  DISC: 1,
  SPHERE: 2,
  CUBE: 3,
  CYLINDER: 4,
  UNION_CYLINDERS: 5,
};

class Geometry {
  constructor(type, material, transformations, ...params) {
    this._type = type;
    this._mat = material;
    this._transformations = transformations;
    this.world_to_model = glMatrix.mat4.create();
    this.normal_to_world = glMatrix.mat4.create();
    switch (this._type) {
      case GEOMETRIES.GRID:
        break;
      case GEOMETRIES.DISC:
        this.radius = 2.0;
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
        this.dmin = (p) => {
          return Math.sqrt(
            Math.pow(Math.max(0, Math.abs(p[0]) - 1), 2) +
            Math.pow(Math.max(0, Math.abs(p[1]) - 1), 2) +
            Math.pow(Math.max(0, Math.abs(p[2]) - 1), 2)
          );
        };
        break;
      case GEOMETRIES.CYLINDER:
        this.size = 3;
        this.rad = 1;
        this.dmin = (p) => {
          if (Math.abs(p[2]) < this.size)
            return Math.sqrt(Math.pow(p[0], 2) + Math.pow(p[1], 2)) - this.rad;
          else
            return Math.sqrt(Math.pow(p[0], 2) + Math.pow(p[1], 2) + Math.pow(p[2] - (p[2] > 0 ? this.size : -this.size), 2)) - this.rad;
        };
        break;
      case GEOMETRIES.UNION_CYLINDERS:
        this.size = 3;
        this.rad = 1;
        this.cyl1 = function(p) {
          if (Math.abs(p[2]) < this.size)
            return Math.sqrt(Math.pow(p[0], 2) + Math.pow(p[1], 2)) - this.rad;
          else
            return Math.sqrt(Math.pow(p[0], 2) + Math.pow(p[1], 2) + Math.pow(p[2] - (p[2] > 0 ? this.size : -this.size), 2)) - this.rad;
        };
        this.cyl2 = function(p) {
          if (Math.abs(p[0]) < this.size)
            return Math.sqrt(Math.pow(p[2], 2) + Math.pow(p[1], 2)) - this.rad;
          else
            return Math.sqrt(Math.pow(p[2], 2) + Math.pow(p[1], 2) + Math.pow(p[0] - (p[0] > 0 ? this.size : -this.size), 2)) - this.rad;
        };
        this.cyl3 = function(p) {
          if (Math.abs(p[1]) < this.size)
            return Math.sqrt(Math.pow(p[0], 2) + Math.pow(p[2], 2)) - this.rad;
          else
            return Math.sqrt(Math.pow(p[0], 2) + Math.pow(p[2], 2) + Math.pow(p[1] - (p[1] > 0 ? this.size : -this.size), 2)) - this.rad;
        };
        this.dmin = (p) => {
          return Math.min(Math.min(this.cyl1(p), this.cyl2(p)), this.cyl3(p));
        };
        break;
      default:
        break;
    }
    this.setIdentity();
    for (var i = 0; i < transformations.length; i++) {
      switch (transformations[i].type) {
        case TRANSFORMATIONS.TRANSLATE:
          this.rayTranslate(transformations[i].vector);
          break;
        case TRANSFORMATIONS.ROTATE:
          this.rayRotate(transformations[i].rad, transformations[i].vector);
          break;
        case TRANSFORMATIONS.SCALE:
          this.rayScale(transformations[i].vector);
          break;
        default:
          break;
      }
    }
  }

  get material() {
    return this._mat;
  }
  get transformations() {
    return this._transformations;
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
    // copy ray and transform
    var rayT = new Ray();
    glMatrix.vec4.transformMat4(rayT.origin, inRay.origin, this.world_to_model);
    glMatrix.vec4.transformMat4(rayT.direction, inRay.direction, this.world_to_model);

    var point_to_vec = glMatrix.vec4.fromValues(0, 0, 0, 1);

    switch (this.type) {
      case GEOMETRIES.GRID:
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
        glMatrix.vec4.transformMat4(hit.surfaceNormal, glMatrix.vec4.fromValues(0, 0, 1, 0), this.normal_to_world);
        glMatrix.vec4.normalize(hit.surfaceNormal, hit.surfaceNormal);
        break;
      case GEOMETRIES.DISC:
        // find the hit point
        var t_0 = -rayT.origin[2] / rayT.direction[2];

        // behind the camera, further from the camera than a previous hit,
        // or outside of radius
        if (t_0 < 0 || t_0 > hit.t_0)
          return;
        var plane_intxn = glMatrix.vec4.scaleAndAdd(glMatrix.vec4.create(), rayT.origin, rayT.direction, t_0);
        if (plane_intxn[0] * plane_intxn[0] + plane_intxn[1] * plane_intxn[1] > this.radius * this.radius)
          return;

        hit.t_0 = t_0;
        hit.hit_geometry = this;
        if (inRay.shadow) return;
        glMatrix.vec4.scaleAndAdd(hit.modelHitPoint, rayT.origin, rayT.direction, t_0);
        glMatrix.vec4.scaleAndAdd(hit.hitPoint, inRay.origin, inRay.direction, t_0);
        glMatrix.vec4.negate(hit.viewNormal, inRay.direction);
        glMatrix.vec4.normalize(hit.viewNormal, hit.viewNormal);
        glMatrix.vec4.transformMat4(hit.surfaceNormal, glMatrix.vec4.fromValues(0, 0, 1, 0), this.normal_to_world);
        glMatrix.vec4.normalize(hit.surfaceNormal, hit.surfaceNormal);
        break;
      case GEOMETRIES.SPHERE:
        // ray to sphere center
        var r2s = glMatrix.vec4.create();
        glMatrix.vec4.subtract(r2s, point_to_vec, rayT.origin);
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
        hit.surfaceNormal = glMatrix.vec4.clone(hit.modelHitPoint);
        glMatrix.vec4.subtract(hit.surfaceNormal, hit.surfaceNormal, point_to_vec);
        break;
      case GEOMETRIES.CUBE:
        // March starting from the ray's origin
        var p = glMatrix.vec4.clone(rayT.origin);
        var t_0 = this.ray_march(p, rayT.direction);

        if (this.dmin(p) > MAX_MISS) return; // too big, missed

        if (t_0 > hit.t_0) return; // farther than some previous hit

        hit.t_0 = t_0;
        hit.hit_geometry = this;
        if (inRay.shadow) return;
        glMatrix.vec4.scaleAndAdd(hit.modelHitPoint, rayT.origin, rayT.direction, hit.t_0);
        glMatrix.vec4.scaleAndAdd(hit.hitPoint, inRay.origin, inRay.direction, hit.t_0);
        glMatrix.vec4.negate(hit.viewNormal, inRay.direction);
        glMatrix.vec4.normalize(hit.viewNormal, hit.viewNormal);
        var x_dist = Math.abs(Math.abs(hit.modelHitPoint[0]) - 1);
        var y_dist = Math.abs(Math.abs(hit.modelHitPoint[1]) - 1);
        var z_dist = Math.abs(Math.abs(hit.modelHitPoint[2]) - 1);
        if (x_dist < y_dist && x_dist < z_dist)
          hit.surfaceNormal = glMatrix.vec4.fromValues(hit.modelHitPoint[0], 0, 0, 0);
        else if (y_dist < x_dist && y_dist < z_dist)
          hit.surfaceNormal = glMatrix.vec4.fromValues(0, hit.modelHitPoint[1], 0, 0);
        else
          hit.surfaceNormal = glMatrix.vec4.fromValues(0, 0, hit.modelHitPoint[2], 0);
        glMatrix.vec4.normalize(hit.surfaceNormal, hit.surfaceNormal);
        // console.log(hit.modelHitPoint, hit.surfaceNormal);
        glMatrix.vec4.transformMat4(hit.surfaceNormal, hit.surfaceNormal, this.normal_to_world);
        glMatrix.vec4.normalize(hit.surfaceNormal, hit.surfaceNormal);
        break;
      case GEOMETRIES.CYLINDER:
      case GEOMETRIES.UNION_CYLINDERS:
        // March starting from the ray's origin
        var p = glMatrix.vec4.clone(rayT.origin);
        var t_0 = this.ray_march(p, rayT.direction);

        if (this.dmin(p) > MAX_MISS) return; // too big, missed

        if (t_0 > hit.t_0) return; // farther than some previous hit

        hit.t_0 = t_0;
        hit.hit_geometry = this;
        if (inRay.shadow) return;
        glMatrix.vec4.scaleAndAdd(hit.modelHitPoint, rayT.origin, rayT.direction, hit.t_0);
        glMatrix.vec4.scaleAndAdd(hit.hitPoint, inRay.origin, inRay.direction, hit.t_0);
        glMatrix.vec4.negate(hit.viewNormal, inRay.direction);
        glMatrix.vec4.normalize(hit.viewNormal, hit.viewNormal);
        hit.surfaceNormal = Math.abs(hit.modelHitPoint[2]) < 1 ?
          glMatrix.vec4.fromValues(hit.modelHitPoint[0], hit.modelHitPoint[1], 0, 0) :
          glMatrix.vec4.fromValues(hit.modelHitPoint[0], hit.modelHitPoint[1], Math.abs(hit.modelHitPoint[2]) - 1, 0);
        glMatrix.vec4.transformMat4(hit.surfaceNormal, hit.surfaceNormal, this.normal_to_world);
        glMatrix.vec4.normalize(hit.surfaceNormal, hit.surfaceNormal);
        break;
      default:
        break;
    }
    // sanity check
    hit.surfaceNormal[3] = 0;
  }

  ray_march(p, dir) {
    var march = 0;
    var t_0 = 0;
    do {
      glMatrix.vec4.scaleAndAdd(p, p, dir, march);
      march = this.dmin(p);
      t_0 += march;
    } while (march > EPSILON && march < MAX_MISS);
    return t_0;
  }

  /**
   * Computes the shade of this object at a given hit point.
   *
   * @param {!Hit} hit The hit point where the shading is being done.
   */
  shade(hit, light_index) {
    var light_pos = glMatrix.vec4.fromValues(
      g_scene.lights.get(light_index).position[0],
      g_scene.lights.get(light_index).position[1],
      g_scene.lights.get(light_index).position[2],
      0);

    glMatrix.vec4.transformMat4(light_pos, light_pos, this.world_to_model);

    var N = hit.surfaceNormal;
    var L = glMatrix.vec4.subtract(glMatrix.vec4.create(), light_pos, hit.modelHitPoint);
    glMatrix.vec4.normalize(L, L);
    var n_dot_l = glMatrix.vec4.dot(N, L);
    var R = Ray.reflect(glMatrix.vec4.create(), L, N);

    var attenuation = 1 / glMatrix.vec4.length(L);
    var mat = (this.type == GEOMETRIES.GRID &&
        (Math.abs(hit.modelHitPoint[0] - Math.floor(hit.modelHitPoint[0])) < 0.1 ||
          Math.abs(hit.modelHitPoint[1] - Math.floor(hit.modelHitPoint[1])) < 0.1)) ?
      MATERIALS.BLACK_RUBBER : this._mat;
    // Emissive
    glMatrix.vec4.copy(hit.emissive, mat.K_e);
    // Ambient illumination * ambient reflectance
    glMatrix.vec4.multiply(hit.ambient, mat.I_a, mat.K_a);
    // Duffuse illumination * diffuse reflectance
    glMatrix.vec4.scale(hit.diffuse,
      glMatrix.vec4.multiply(
        glMatrix.vec4.create(),
        mat.I_d,
        mat.K_d),
      Math.max(0, n_dot_l) * attenuation);
    // Specular illumination * specular reflectance
    glMatrix.vec4.scale(hit.specular,
      glMatrix.vec4.multiply(
        glMatrix.vec4.create(),
        mat.I_s,
        mat.K_s),
      Math.pow(Math.max(0, glMatrix.vec4.dot(R, hit.surfaceNormal)), mat.se) * attenuation);
  }

  setIdentity() {
    glMatrix.mat4.identity(this.world_to_model);
    glMatrix.mat4.identity(this.normal_to_world);
  }

  rayTranslate(vector) {
    var inverse_translate = glMatrix.mat4.create();
    inverse_translate[12] = -vector[0];
    inverse_translate[13] = -vector[1];
    inverse_translate[14] = -vector[2];
    glMatrix.mat4.multiply(this.world_to_model, inverse_translate, this.world_to_model);
    glMatrix.mat4.transpose(this.normal_to_world, this.world_to_model);
  }

  rayRotate(rad, vector) {
    var x = vector[0];
    var y = vector[1];
    var z = vector[2];
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

  rayScale(vector) {
    if (Math.abs(vector[0]) < glMatrix.GLMAT_EPSILON ||
      Math.abs(vector[1]) < glMatrix.GLMAT_EPSILON ||
      Math.abs(vector[2]) < glMatrix.GLMAT_EPSILON) {
      console.log("Geometry.rayScale()\tError: zero-length scale");
      return null;
    }
    var inverse_scale = glMatrix.mat4.create();
    inverse_scale[0] = 1 / vector[0];
    inverse_scale[5] = 1 / vector[1];
    inverse_scale[10] = 1 / vector[2];
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

const TRANSFORMATIONS = {
  TRANSLATE: 0,
  ROTATE: 1,
  SCALE: 2,
};

class TransformationBox {
  constructor(type, ...params) {
    this.type = type;
    this.vector = glMatrix.vec3.fromValues(params[0], params[1], params[2]);
    if (type == TRANSFORMATIONS.ROTATE)
      this.rad = params[3];
  }

}

function clamp(value, min, max) {
  return (value < min ? min : (value > max ? max : value));
}
