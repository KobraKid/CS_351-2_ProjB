class Camera {
  constructor(l = -1, r = 1, t = 1, b = -1, n = 1) {
    this.eye_point = glMatrix.vec4.fromValues(0, 0, 0, 1);
    this.u = glMatrix.vec4.fromValues(1, 0, 0, 0);
    this.v = glMatrix.vec4.fromValues(0, 1, 0, 0);
    this.n = glMatrix.vec4.fromValues(0, 0, 1, 0);
    this.frustum = {
      left: l,
      right: r,
      top: t,
      bottom: b,
      near: n,
    }
    this.x_max = 256;
    this.y_max = 256;
    // Fractional portion of the camera's axes a single pixel takes up
    this.u_frac = (this.frustum.right - this.frustum.left) / this.x_max;
    this.v_frac = (this.frustum.top - this.frustum.bottom) / this.y_max;
  }

  setSize(width, height) {
    this.x_max = width;
    this.y_max = height;
    this.u_frac = (this.frustum.right - this.frustum.left) / this.x_max;
    this.v_frac = (this.frustum.top - this.frustum.bottom) / this.y_max;
  }

  makeEyeRay(ray, x, y) {
    var u_pos = this.frustum.left + x * this.u_frac;
    var v_pos = this.frustum.bottom + y * this.v_frac;
    var pos = glMatrix.vec4.create();
    glMatrix.vec4.scaleAndAdd(pos, pos, this.u, u_pos);
    glMatrix.vec4.scaleAndAdd(pos, pos, this.v, v_pos);
    glMatrix.vec4.scaleAndAdd(pos, pos, this.n, -this.frustum.near);
    glMatrix.vec4.copy(ray.origin, this.eye_point);
    glMatrix.vec4.copy(ray.direction, pos);
  }

  rayFrustum(left, right, top, bottom, near) {
    this.frustum.left = left;
    this.frustum.right = right;
    this.frustum.top = top;
    this.frustum.bottom = bottom;
    this.frustum.near = near;
  }

  rayPerspective(fovy, aspect, zNear) {
    this.frustum.near = zNear;
    this.frustum.top = zNear * Math.tan(0.5 * fovy * (Math.PI / 180.0));
    this.frustum.bottom = -this.frustum.top;
    this.frustum.right = this.frustum.top * aspect;
    this.frustum.left = -this.frustum.right;
  }

  rayLookAt(eyePoint, aimPoint, upVector) {
    this.eye_point = eyePoint;
    glMatrix.vec4.subtract(this.n, this.eye_point, aimPoint);
    glMatrix.vec4.normalize(this.n, this.n);
    glMatrix.vec3.cross(this.u, upVector, this.n);
    glMatrix.vec4.normalize(this.u, this.u);
    glMatrix.vec3.cross(this.v, this.n, this.u);
  }
}
