class Scene {
  constructor(max_depth = 1) {
    this.max_depth = max_depth;
    this.sky_color = glMatrix.vec4.fromValues(0.3, 1.0, 1.0, 1.0);
    this.ray_camera = new Camera();
    this.eye_ray = new Ray();
    this.shadow_ray = new Ray().set_shadow();
    this.buffer; // = new ImageBuffer();
    this.geometries = new GeometryList();
    this.materials = new MaterialList();
    this.lights = new LightList();

    this.ray_camera.rayPerspective(tracker.camera.fovy, tracker.camera.aspect, tracker.camera.near);
    this.ray_camera.rayLookAt(tracker.camera.eye_point, tracker.camera.aim_point, tracker.camera.up_vector);

    this.materials.add(new Material(
      glMatrix.vec4.fromValues(0.2, 0.2, 0.2, 1),
      glMatrix.vec4.fromValues(0.5, 0.5, 0.5, 1),
      glMatrix.vec4.fromValues(1, 1, 1, 1),
      glMatrix.vec4.fromValues(0.0215, 0.1745, 0.0215, 1),
      glMatrix.vec4.fromValues(0.07568, 0.61424, 0.07568, 1),
      glMatrix.vec4.fromValues(0.633, 0.727811, 0.633, 1),
      glMatrix.vec4.fromValues(0, 0, 0, 1), 0.6 * 128));

    // Grid
    var i = 0;
    this.geometries.add(new Geometry(GEOMETRIES.GRID,
      [
        glMatrix.vec4.fromValues(0.2, 0.5, 0.2, 1),
        glMatrix.vec4.fromValues(0.9, 0.9, 0.9, 1),
      ], this.materials.get(0)));
    this.geometries.get(i).setIdentity();
    // Sphere
    i++;
    this.geometries.add(new Geometry(GEOMETRIES.SPHERE,
      [
        glMatrix.vec4.fromValues(0.2, 0.5, 0.9, 1)
      ], this.materials.get(0)));
    this.geometries.get(i).setIdentity();
    this.geometries.get(i).rayTranslate(0, -1, 1);
    // Disc 1
    i++;
    this.geometries.add(new Geometry(GEOMETRIES.DISC,
      [
        glMatrix.vec4.fromValues(0.9, 0.9, 0.9, 1),
        glMatrix.vec4.fromValues(0.2, 0.5, 0.2, 1),
      ], this.materials.get(0)));
    this.geometries.get(i).setIdentity();
    this.geometries.get(i).rayTranslate(1, 1, 1.3);
    this.geometries.get(i).rayRotate(0.25 * Math.PI, 1, 0, 0);
    this.geometries.get(i).rayRotate(0.25 * Math.PI, 0, 0, 1);
    // Disc 2
    i++;
    this.geometries.add(new Geometry(GEOMETRIES.DISC,
      [
        glMatrix.vec4.fromValues(0.9, 0.5, 0.9, 1),
        glMatrix.vec4.fromValues(0.2, 0.9, 0.2, 1),
      ], this.materials.get(0)));
    this.geometries.get(i).setIdentity();
    this.geometries.get(i).rayTranslate(-1, 1, 1.3);
    this.geometries.get(i).rayRotate(0.75 * Math.PI, 1, 0, 0);
    this.geometries.get(i).rayRotate(Math.PI / 3, 0, 0, 1);
    /*
    // Ray-marched cube
    this.geometries.add(new Geometry(GEOMETRIES.SPHERE,
      [
        glMatrix.vec4.fromValues(0.1, 0.3, 0.5, 1)
      ], 0));
    this.geometries.get(2).setIdentity();
    this.geometries.get(2).rayTranslate(0, 0, 4);
    this.geometries.get(2).rayRotate(0.75 * Math.PI, 0, 0, 1);
    this.geometries.get(2).rayRotate(0.25 * Math.PI, 1, 0, 0);
    */

    this.lights.add(new Light(glMatrix.vec4.fromValues(4, 0, 4, 1)));
  }

  setImageBuffer(buffer) {
    this.ray_camera.setSize(buffer.width, buffer.height);
    this.buffer = buffer;
  }

  traceImage() {
    return new Promise(resolve => {
      tracker.progress = 0;

      // Ensure that the camera matches the WebGL preview
      this.ray_camera.rayPerspective(tracker.camera.fovy, tracker.camera.aspect, tracker.camera.near);
      this.ray_camera.rayLookAt(tracker.camera.eye_point, tracker.camera.aim_point, tracker.camera.up_vector);

      var buffer_index = 0;
      var hit = new Hit(this.sky_color);
      var color = glMatrix.vec4.create();

      for (var p_y = 0; p_y < this.buffer.height; p_y++) {
        for (var p_x = 0; p_x < this.buffer.width; p_x++) {
          glMatrix.vec4.zero(color);
          for (var subpixel = 0; subpixel < tracker.aa * tracker.aa; subpixel++) {
            this.ray_camera.makeEyeRay(this.eye_ray, p_x, p_y, subpixel);
            hit.clear();
            this.trace(this.eye_ray, hit, color, this.max_depth);
            this.shade(hit, color, this.max_depth);
          }
          buffer_index = (p_y * this.buffer.width + p_x) * this.buffer.pixel_size;
          this.buffer.fBuf[buffer_index] = color[0];
          this.buffer.fBuf[buffer_index + 1] = color[1];
          this.buffer.fBuf[buffer_index + 2] = color[2];
        }
      }
      this.buffer.toInt();
      vbo_ray.reloadTexture();
      tracker.progress = 100;

      // Asynchronous return (doesn't work right now)
      resolve(0);
    });
  }

  trace(ray, hit, color, depth) {
    // if we hit max recursion depth
    if (depth <= 0) return;
    // trace on each geometry to find the closest hit point
    for (var i = 0; i < this.geometries.size; i++) {
      this.geometries.get(i).trace(ray, hit);
    }
  }

  shade(hit, color, depth) {
    // if we hit max recursion depth
    if (depth <= 0) return;

    // if we hit nothing during tracing, then no need to recurse further
    if (hit.hit_geometry == null) {
      glMatrix.vec4.scaleAndAdd(color, color, hit.hit_color, 1 / (tracker.aa * tracker.aa));
      return;
    }

    hit.hit_geometry.shade(hit);
    var shadow_hit = new Hit();
    glMatrix.vec4.scaleAndAdd(this.shadow_ray.origin, hit.hitPoint, this.eye_ray.direction, -1.0E-10);
    glMatrix.vec4.scaleAndAdd(this.shadow_ray.direction, this.lights.get(0).position, hit.hitPoint, -1);
    this.trace(this.shadow_ray, shadow_hit, color, depth - 1);
    if (shadow_hit.hit_geometry != null) {
      hit.hit_color = glMatrix.vec4.fromValues(0, 0, 0, 1);
    }
    // average color(s) from each subpixel
    // if antialiasing is disabled, no scaling is performed, and color comes
    // from the single sample
    glMatrix.vec4.scaleAndAdd(color, color, hit.hit_color, 1 / (tracker.aa * tracker.aa));
  }

}
