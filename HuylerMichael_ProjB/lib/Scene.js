class Scene {
  constructor(default_camera) {
    this.sky_color = glMatrix.vec4.fromValues(0.3, 1.0, 1.0, 1.0);
    this.ray_camera = new Camera();
    this.eye_ray = new Ray();
    this.shadow_ray = new Ray().set_shadow();
    this.reflection_ray = new Ray();
    this.buffer; // = new ImageBuffer();
    this.geometries = new GeometryList();
    this.lights = new LightList();
    this.default_camera = default_camera;
  }

  enable() {
    tracker.camera.yaw = this.default_camera.yaw;
    tracker.camera.pitch = this.default_camera.pitch;
    glMatrix.vec4.copy(tracker.camera.eye_point, this.default_camera.eye_point);
    glMatrix.vec4.copy(tracker.camera.aim_point, this.default_camera.aim_point);
    glMatrix.vec4.copy(tracker.camera.up_vector, this.default_camera.up_vector);
    mouse_drag_x = this.default_camera.mouse_drag_x;
    mouse_drag_y = this.default_camera.mouse_drag_y;
    this.ray_camera.setSize(tracker.resolution, tracker.resolution);
    this.ray_camera.rayPerspective(tracker.camera.fovy, tracker.camera.aspect, tracker.camera.near);
    this.ray_camera.rayLookAt(tracker.camera.eye_point, tracker.camera.aim_point, tracker.camera.up_vector);
  }

  setImageBuffer(buffer) {
    console.log('buh ' + Math.random());
    this.ray_camera.setSize(buffer.width, buffer.height);
    this.buffer = buffer;
  }

  traceImage() {
    return new Promise(resolve => {
      tracker.progress = 0;

      // Ensure that the camera matches the WebGL preview at all times
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
            this.trace(this.eye_ray, hit);
            // find the shade at the hit point (potentially recursively)
            this.shade(hit, color, tracker.depth - 1);
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

      // Asynchronous return (doesn't work right now 😞)
      resolve(0);
    });
  }

  trace(ray, hit) {
    // trace on each geometry to find the closest hit point
    for (var i = 0; i < this.geometries.size; i++) {
      this.geometries.get(i).trace(ray, hit);
    }
  }

  shade(hit, color, depth) {
    // if we hit nothing during tracing, then no need to proceed further
    if (hit.hit_geometry == null) {
      glMatrix.vec4.scaleAndAdd(color, color, hit.hit_color, 1 / (tracker.aa * tracker.aa));
      return;
    }

    /* Trace, find shadows */

    var shadow_hit = new Hit();
    var in_shadow;
    for (var i = 0; i < this.lights.size; i++) {
      // Trace a shadow ray from the hit point to each light source
      shadow_hit.clear();
      in_shadow = false;
      glMatrix.vec4.scaleAndAdd(this.shadow_ray.origin, hit.hitPoint, this.eye_ray.direction, -1.0E-3);
      glMatrix.vec4.subtract(this.shadow_ray.direction, this.lights.get(i).position, hit.hitPoint);
      this.trace(this.shadow_ray, shadow_hit, color);

      // we hit something closeer than the light source
      if (shadow_hit.hit_geometry != null && shadow_hit.t_0 <= glMatrix.vec4.dot(this.shadow_ray.direction, this.lights.get(i).position)) {
        in_shadow = true;
      }

      // Get the shade of the hit point
      hit.hit_geometry.shade(hit, i, in_shadow);
      glMatrix.vec4.zero(hit.hit_color);
      glMatrix.vec4.add(hit.hit_color, hit.hit_color, hit.emissive);
      glMatrix.vec4.add(hit.hit_color, hit.hit_color, hit.ambient);
      glMatrix.vec4.add(hit.hit_color, hit.hit_color, hit.diffuse);
      glMatrix.vec4.add(hit.hit_color, hit.hit_color, hit.specular);
    }

    /* Reflections */

    if (depth > 0) {
      // Trace a reflection ray from the hit point about the normal
      var reflection_hit = new Hit();
      glMatrix.vec4.scaleAndAdd(this.reflection_ray.origin, hit.hitPoint, this.eye_ray.direction, -1.0E-3);
      Ray.reflect(this.reflection_ray.direction, hit.viewNormal, hit.surfaceNormal);
      this.trace(this.reflection_ray, reflection_hit);

      if (reflection_hit.hit_geometry != null && reflection_hit.hit_geometry.type != GEOMETRIES.GRID) {
        this.shade(reflection_hit, reflection_hit.hit_color, depth - 1);
        glMatrix.vec4.scale(hit.hit_color, hit.hit_color, 0.5);
        glMatrix.vec4.scaleAndAdd(hit.hit_color, hit.hit_color, reflection_hit.hit_color, 0.5);
      }
    }

    // average color(s) from each subpixel
    glMatrix.vec4.scaleAndAdd(color, color, hit.hit_color, 1 / (tracker.aa * tracker.aa));
  }

}
