class Scene {
  constructor(max_depth = 1) {
    this.skyColor = glMatrix.vec4.fromValues(0.3, 1.0, 1.0, 1.0);
    this.ray_camera = new Camera();
    this.eye_ray = new Ray(this.skyColor);
    this.buffer = new ImageBuffer();
    this.geometries = new GeometryList();
    this.materials = new MaterialList();
    this.lights = new LightList();

    this.ray_camera.rayPerspective(tracker.camera.fovy, tracker.camera.aspect, tracker.camera.near);
    this.ray_camera.rayLookAt(tracker.camera.eye_point, tracker.camera.aim_point, tracker.camera.up_vector);
    this.setImageBuffer(g_image);
    this.geometries.add(new Geometry(GEOMETRIES.GRID));
  }

  setImageBuffer(buffer) {
    this.ray_camera.setSize(buffer.width, buffer.height);
    this.buffer = buffer;
  }

  traceImage() {
    this.ray_camera.rayPerspective(tracker.camera.fovy, tracker.camera.aspect, tracker.camera.near);
    this.ray_camera.rayLookAt(tracker.camera.eye_point, tracker.camera.aim_point, tracker.camera.up_vector);
    this.setImageBuffer(this.buffer);
    var color = glMatrix.vec4.create();
    var buffer_index = 0;
    var hit = new Hit(this.skyColor);
    for (var p_y = 0; p_y < this.buffer.height; p_y++) {
      for (var p_x = 0; p_x < this.buffer.width; p_x++) {
        color = glMatrix.vec4.fromValues(0, 0, 0, 0);
        for (var subpixel = 0; subpixel < tracker.aa * tracker.aa; subpixel++) {
          this.ray_camera.makeEyeRay(this.eye_ray, p_x, p_y, subpixel);
          hit.clear();
          for (var i = 0; i < this.geometries.size; i++) {
            this.geometries.get(i).trace(this.eye_ray, hit);
          }
          if (hit.hitNum == 0) {
            glMatrix.vec4.add(color, color, hit.hitGeom.gapColor);
          } else if (hit.hitNum == 1) {
            glMatrix.vec4.add(color, color, hit.hitGeom.lineColor);
          } else {
            glMatrix.vec4.add(color, color, this.skyColor);
          }
        }
        buffer_index = (p_y * this.buffer.width + p_x) * this.buffer.pixel_size;
        glMatrix.vec4.scale(color, color, 1 / (tracker.aa * tracker.aa));
        this.buffer.fBuf[buffer_index] = color[0];
        this.buffer.fBuf[buffer_index + 1] = color[1];
        this.buffer.fBuf[buffer_index + 2] = color[2];
      }
    }
    this.buffer.toInt();
    vbo_ray.reloadTexture();
  }

}
