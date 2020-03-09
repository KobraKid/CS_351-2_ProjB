class Scene {
  constructor(max_depth = 1) {
    this.sky_color = glMatrix.vec4.fromValues(0.3, 1.0, 1.0, 1.0);
    this.ray_camera = new Camera();
    this.eye_ray = new Ray();
    this.buffer = new ImageBuffer();
    this.geometries = new GeometryList();
    this.materials = new MaterialList();
    this.lights = new LightList();

    this.ray_camera.rayPerspective(tracker.camera.fovy, tracker.camera.aspect, tracker.camera.near);
    this.ray_camera.rayLookAt(tracker.camera.eye_point, tracker.camera.aim_point, tracker.camera.up_vector);
    this.setImageBuffer(g_image);
    // Grid
    this.geometries.add(new Geometry(GEOMETRIES.GRID,
      [
        glMatrix.vec4.fromValues(0.2, 0.5, 0.2, 1.0),
        glMatrix.vec4.fromValues(0.9, 0.9, 0.9, 1.0),
      ]));
    this.geometries.get(0).setIdentity();
    // Disc 1
    this.geometries.add(new Geometry(GEOMETRIES.DISC,
      [
        glMatrix.vec4.fromValues(0.9, 0.9, 0.9, 1.0),
        glMatrix.vec4.fromValues(0.2, 0.5, 0.2, 1.0),
      ]));
    this.geometries.get(1).setIdentity();
    this.geometries.get(1).rayTranslate(1, 1, 1.3);
    this.geometries.get(1).rayRotate(0.25 * Math.PI, 1, 0, 0);
    this.geometries.get(1).rayRotate(0.25 * Math.PI, 0, 0, 1);
    // Disc 2
    this.geometries.add(new Geometry(GEOMETRIES.DISC,
      [
        glMatrix.vec4.fromValues(0.9, 0.5, 0.9, 1.0),
        glMatrix.vec4.fromValues(0.2, 0.9, 0.2, 1.0),
      ]));
    this.geometries.get(2).setIdentity();
    this.geometries.get(2).rayTranslate(-1, 1, 1.3);
    this.geometries.get(2).rayRotate(0.75 * Math.PI, 1, 0, 0);
    this.geometries.get(2).rayRotate(Math.PI / 3, 0, 0, 1);
    // Sphere
    this.geometries.add(new Geometry(GEOMETRIES.SPHERE,
      [
        glMatrix.vec4.fromValues(0.2, 0.5, 0.9, 1.0)
      ]));
    this.geometries.get(3).setIdentity();
    this.geometries.get(3).rayTranslate(1.2, -1.3, 1);
    this.geometries.get(3).rayRotate(0.75 * Math.PI, 1, 0, 0);
  }

  setImageBuffer(buffer) {
    this.ray_camera.setSize(buffer.width, buffer.height);
    this.buffer = buffer;
  }

  traceImage() {
    tracker.progress = 0;
    this.ray_camera.rayPerspective(tracker.camera.fovy, tracker.camera.aspect, tracker.camera.near);
    this.ray_camera.rayLookAt(tracker.camera.eye_point, tracker.camera.aim_point, tracker.camera.up_vector);
    this.setImageBuffer(this.buffer);
    var color = glMatrix.vec4.create();
    var buffer_index = 0;
    var hit = new Hit(this.sky_color);
    for (var p_y = 0; p_y < this.buffer.height; p_y++) {
      for (var p_x = 0; p_x < this.buffer.width; p_x++) {
        glMatrix.vec4.zero(color);
        for (var subpixel = 0; subpixel < tracker.aa * tracker.aa; subpixel++) {
          this.ray_camera.makeEyeRay(this.eye_ray, p_x, p_y, subpixel);
          hit.clear();
          for (var i = 0; i < this.geometries.size; i++) {
            this.geometries.get(i).trace(this.eye_ray, hit);
          }
          glMatrix.vec4.add(color, color, hit.hitNum);
        }
        // average the colors of each supersample
        glMatrix.vec4.scale(color, color, 1 / (tracker.aa * tracker.aa));
        buffer_index = (p_y * this.buffer.width + p_x) * this.buffer.pixel_size;
        this.buffer.fBuf[buffer_index] = color[0];
        this.buffer.fBuf[buffer_index + 1] = color[1];
        this.buffer.fBuf[buffer_index + 2] = color[2];
      }
    }
    this.buffer.toInt();
    vbo_ray.reloadTexture();
    tracker.progress = 100;
    return new Promise(resolve => {
      resolve(0);
    });
  }

}
