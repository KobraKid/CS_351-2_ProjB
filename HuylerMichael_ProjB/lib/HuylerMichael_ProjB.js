/**
 * Main entry point into the program.
 *
 * Handles setting up objects required for 3D graphics.
 *
 * @author Michael Huyler
 */

/* WebGL variables */
// GL context
var gl;
// HTML canvas
var canvas;
// Screen aspect ratio
var aspect;
var offset;

/* Scenes */
var scenes = [];
// The current scene
var g_scene;

/* WebGL preview VBOs */
var preview_vbos = []
// Ground Plane
var vbo_0;

/* Raytrace VBO */
var vbo_ray;

// Minimum distance for a ray to count as a hit when ray-marching
const EPSILON = 0.00001;
// Maximum distance for a ray to count as a miss when ray-marching
const MAX_MISS = 10000;

/**
 * Initialize global variables, event listeners, etc.
 */
function main() {
  canvas = document.getElementById('webgl');
  canvas.width = window.innerHeight * 2;
  canvas.height = window.innerHeight;
  aspect = canvas.width / canvas.height;

  gl = canvas.getContext("webgl", {
    preserveDrawingBuffer: true
  });

  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  gl.clearColor(0.2, 0.2, 0.2, 1);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  canvas.onmousedown = function(ev) {
    mouseDown(ev)
  };
  canvas.onmousemove = function(ev) {
    mouseMove(ev)
  };
  canvas.onmouseup = function(ev) {
    mouseUp(ev)
  };
  window.addEventListener("keydown", keyDown, false);
  window.addEventListener("keyup", keyUp, false);

  initGui();
  initScenes();
  initVBOBoxes();

  // There is a significant overhead inherent in setting up the VBOs and
  // particle systems, so we start our timing after the setup has completed
  tracker.prev = Date.now();

  var shouldUpdateFrame = 1;
  var tick = function() {
    updateKeypresses();
    requestAnimationFrame(tick, canvas);
    if (shouldUpdateFrame >= tracker.speed) {
      tracker.fps_calc();
      drawAll();
      shouldUpdateFrame = 1;
    } else {
      shouldUpdateFrame++;
    }
  };
  tick();
  do_raytracing();
}

function initScenes() {
  // Scene 1
  {
    let scene = new Scene({
      yaw: 1.182645152126868,
      pitch: -0.41062308478038756,
      eye_point: glMatrix.vec4.fromValues(-2.5794496536254883, -4.994401931762695, 4.859889030456543, 1),
      aim_point: glMatrix.vec4.fromValues(-2.232433795928955, -4.145735263824463, 4.460708141326904, 1),
      up_vector: glMatrix.vec4.fromValues(0.15108102560043335, 0.3694857954978943, 0.9168722629547119, 0),
      mouse_drag_x: -0.3881511746680285,
      mouse_drag_y: -0.41062308478038756,
    });
    scene.geometries.add(new Geometry(GEOMETRIES.GRID, MATERIALS.BRONZE_DULL, []));
    scene.geometries.add(new Geometry(GEOMETRIES.SPHERE, MATERIALS.RED_PLASTIC, [
      new TransformationBox(TRANSFORMATIONS.TRANSLATE, -1, 0, 1),
      new TransformationBox(TRANSFORMATIONS.SCALE, 0.5, 0.5, 0.5),
    ]));
    scene.geometries.add(new Geometry(GEOMETRIES.SPHERE, MATERIALS.GREEN_PLASTIC, [
      new TransformationBox(TRANSFORMATIONS.TRANSLATE, 1, 0, 1),
    ]));
    scene.geometries.add(new Geometry(GEOMETRIES.SPHERE, MATERIALS.CHROME, [
      new TransformationBox(TRANSFORMATIONS.TRANSLATE, 0, 2 * Math.sin(Math.PI / 3), 1),
    ]));
    scene.lights.add(new Light(glMatrix.vec4.fromValues(0, 0, 3, 1)), 1);
    scene.lights.add(new Light(glMatrix.vec4.fromValues(1, 1, 10, 1)), 1);
    scene.setImageBuffer(new ImageBuffer(tracker.resolution, tracker.resolution));
    scenes.push(scene);
  }
  // Scene 2
  {
    let scene = new Scene({
      yaw: -0.6059341592139349,
      pitch: -0.49779086892489066,
      eye_point: glMatrix.vec4.fromValues(-6.2330098152160645, 3.9786722660064697, 5.04525899887085, 1),
      aim_point: glMatrix.vec4.fromValues(-5.510794162750244, 3.4782605171203613, 4.567773342132568, 1),
      up_vector: glMatrix.vec4.fromValues(0.3924790918827057, -0.27194249629974365, 0.8786395192146301, 1),
      mouse_drag_x: -2.1767304860088315,
      mouse_drag_y: -0.49779086892489066,
    });
    scene.geometries.add(new Geometry(GEOMETRIES.GRID, MATERIALS.OBSIDIAN, []));
    scene.geometries.add(new Geometry(GEOMETRIES.SPHERE, MATERIALS.RED_PLASTIC, [
      new TransformationBox(TRANSFORMATIONS.TRANSLATE, -1, -1.3, 1),
    ]));
    scene.geometries.add(new Geometry(GEOMETRIES.SPHERE, MATERIALS.SILVER_SHINY, [
      new TransformationBox(TRANSFORMATIONS.TRANSLATE, 1, -1, 2),
      new TransformationBox(TRANSFORMATIONS.SCALE, 1, 1, 2),
    ]));
    scene.geometries.add(new Geometry(GEOMETRIES.DISC, MATERIALS.GOLD_SHINY, [
      new TransformationBox(TRANSFORMATIONS.TRANSLATE, 1, 1, 1.3),
      new TransformationBox(TRANSFORMATIONS.ROTATE, 1, 0, 0, 0.25 * Math.PI),
      new TransformationBox(TRANSFORMATIONS.ROTATE, 0, 0, 1, 0.25 * Math.PI),
    ]));
    scene.geometries.add(new Geometry(GEOMETRIES.DISC, MATERIALS.EMERALD, [
      new TransformationBox(TRANSFORMATIONS.TRANSLATE, -3, 1, 1.3),
    ]));
    scene.lights.add(new Light(glMatrix.vec4.fromValues(-6, -3, 2, 1)), 2);
    scene.lights.add(new Light(glMatrix.vec4.fromValues(6, -3, 2, 1)), 2);
    scene.setImageBuffer(new ImageBuffer(tracker.resolution, tracker.resolution));
    scenes.push(scene);
  }
  // Scene 3
  {
    let scene = new Scene({
      yaw: 1.5707963267948966,
      pitch: 0,
      eye_point: glMatrix.vec4.fromValues(-1.2246468525851679e-16, -10, 2, 1),
      aim_point: glMatrix.vec4.fromValues(-6.123234262925839e-17, -9, 2, 1),
      up_vector: glMatrix.vec4.fromValues(3.7493993930529855e-33, 6.123234262925839e-17, 1, 0),
      mouse_drag_x: 0,
      mouse_drag_y: 0,
    });
    scene.geometries.add(new Geometry(GEOMETRIES.GRID, MATERIALS.CHROME, []));
    scene.geometries.add(new Geometry(GEOMETRIES.CUBE, MATERIALS.BLUE_PLASTIC, [
      new TransformationBox(TRANSFORMATIONS.TRANSLATE, 0, 0, 1),
      new TransformationBox(TRANSFORMATIONS.SCALE, 3, 1, 3),
    ]));
    scene.geometries.add(new Geometry(GEOMETRIES.CUBE, MATERIALS.BLUE_PLASTIC, [
      new TransformationBox(TRANSFORMATIONS.TRANSLATE, 4, -3, 1),
      new TransformationBox(TRANSFORMATIONS.SCALE, 1, 3, 3),
    ]));
    scene.geometries.add(new Geometry(GEOMETRIES.CUBE, MATERIALS.BLUE_PLASTIC, [
      new TransformationBox(TRANSFORMATIONS.TRANSLATE, -4, -3, 1),
      new TransformationBox(TRANSFORMATIONS.SCALE, 1, 3, 3),
    ]));
    scene.geometries.add(new Geometry(GEOMETRIES.SPHERE, MATERIALS.EMERALD, [
      new TransformationBox(TRANSFORMATIONS.TRANSLATE, 0, -2, 1.5),
    ]));
    scene.geometries.add(new Geometry(GEOMETRIES.SPHERE, MATERIALS.TURQUOISE, [
      new TransformationBox(TRANSFORMATIONS.TRANSLATE, 0, -2, -0.25),
    ]));
    scene.lights.add(new Light(glMatrix.vec4.fromValues(0, -8, 4, 1)), 3);
    scene.lights.add(new Light(glMatrix.vec4.fromValues(-8, 0, 4, 1)), 3);
    scene.lights.add(new Light(glMatrix.vec4.fromValues(8, 0, 4, 1)), 3);
    scene.lights.add(new Light(glMatrix.vec4.fromValues(0, -3, 5, 1)), 3);
    scene.setImageBuffer(new ImageBuffer(tracker.resolution, tracker.resolution));
    scenes.push(scene);
  }
  // Scene 4
  {
    let scene = new Scene({
      yaw: -0.06924921804071671,
      pitch: -0.7475252915820627,
      eye_point: glMatrix.vec4.fromValues(-9.100786209106445, -0.7913273572921753, 11.316386222839355, 1),
      aim_point: glMatrix.vec4.fromValues(-8.369170188903809, -0.8420723676681519, 10.636560440063477, 1),
      up_vector: glMatrix.vec4.fromValues(0.6781965494155884, -0.04703979939222336, 0.7333734631538391, 0),
      mouse_drag_x: -1.6400455448356133,
      mouse_drag_y: -0.7475252915820627,
    });
    scene.geometries.add(new Geometry(GEOMETRIES.GRID, MATERIALS.PEWTER, []));
    scene.geometries.add(new Geometry(GEOMETRIES.CROSSED_CYLINDERS, MATERIALS.RUBY, [
      new TransformationBox(TRANSFORMATIONS.TRANSLATE, 0, 0, 2),
    ]));
    scene.geometries.add(new Geometry(GEOMETRIES.SPHERE, MATERIALS.PEARL, [
      new TransformationBox(TRANSFORMATIONS.ROTATE, 0, 0, 1, -0.25 * Math.PI),
      new TransformationBox(TRANSFORMATIONS.ROTATE, 0, 1, 0, Math.PI / 6),
      new TransformationBox(TRANSFORMATIONS.TRANSLATE, 2, 0, 4),
      new TransformationBox(TRANSFORMATIONS.SCALE, 1, 1, 4),
    ]));
    scene.geometries.add(new Geometry(GEOMETRIES.SPHERE, MATERIALS.PEARL, [
      new TransformationBox(TRANSFORMATIONS.ROTATE, 0, 0, 1, -0.75 * Math.PI),
      new TransformationBox(TRANSFORMATIONS.ROTATE, 0, 1, 0, Math.PI / 6),
      new TransformationBox(TRANSFORMATIONS.TRANSLATE, 2, 0, 4),
      new TransformationBox(TRANSFORMATIONS.SCALE, 1, 1, 4),
    ]));
    scene.geometries.add(new Geometry(GEOMETRIES.DISC, MATERIALS.EMERALD, [
      new TransformationBox(TRANSFORMATIONS.TRANSLATE, -3.5, 0, 1),
      new TransformationBox(TRANSFORMATIONS.ROTATE, 0, 1, 0, 0.25 * Math.PI),
    ]));
    scene.geometries.add(new Geometry(GEOMETRIES.DISC, MATERIALS.EMERALD, [
      new TransformationBox(TRANSFORMATIONS.TRANSLATE, 3.5, 0, 1),
      new TransformationBox(TRANSFORMATIONS.ROTATE, 0, 1, 0, -0.25 * Math.PI),
    ]));
    scene.lights.add(new Light(glMatrix.vec4.fromValues(2, 2, 2, 1)), 4);
    scene.setImageBuffer(new ImageBuffer(tracker.resolution, tracker.resolution));
    scenes.push(scene);
  }
  // Default scene
  g_scene = scenes[tracker.scene];
  g_scene.enable();
}

/**
 * Initializes all of the VBOBoxes.
 */
function initVBOBoxes() {
  // WebGL preview(s)
  id = 0;
  const vertex_shader_0 = `
    precision highp float;

    uniform mat4 u_mvp_matrix_${id};

    attribute vec4 a_position_${id};
    attribute vec3 a_color_${id};

    varying vec4 v_color_${id};

    void main() {
  		gl_Position = u_mvp_matrix_${id} * a_position_${id};
  		v_color_${id} = vec4(a_color_${id}, 1.0);
    }
  `;
  const fragment_shader_0 = `
    precision highp float;

    varying vec4 v_color_${id};

    void main() {
      gl_FragColor = v_color_${id};
    }
  `;
  const verts = Float32Array.from([
    ...appendGrid(),
    ...appendDisc(2),
    ...appendSphere(),
  ]);
  vbo_0 = new VBOBox(
    vertex_shader_0,
    fragment_shader_0,
    verts,
    gl.LINES,
    7, {
      ['a_position_' + id]: [0, 4],
      ['a_color_' + id]: [4, 3],
    },
    id,
    () => gl.enable(gl.DEPTH_TEST));
  vbo_0.init();
  preview_vbos.push(vbo_0);

  // Raycast produced image
  id = 1;
  const vertex_shader_1 = `
    uniform mat4 u_mvp_matrix_${id};
    attribute vec4 a_position_${id};
    attribute vec2 a_texture_coord_${id};
    varying vec2 v_texture_coord_${id};

    void main() {
      u_mvp_matrix_${id};

      gl_Position = a_position_${id};
      v_texture_coord_${id} = a_texture_coord_${id};
    }
  `;
  const fragment_shader_1 = `
    precision mediump float;

    uniform sampler2D u_sampler_${id};
    varying vec2 v_texture_coord_${id};

    void main() {
      gl_FragColor = texture2D(u_sampler_${id}, v_texture_coord_${id});
    }
  `;
  vbo_ray = new VBOBox(
    vertex_shader_1,
    fragment_shader_1,
    new Float32Array([
      -1.00, 1.00, 0.0, 1.0,
      -1.00, -1.00, 0.0, 0.0,
      1.00, 1.00, 1.0, 1.0,
      1.00, -1.00, 1.0, 0.0,
    ]),
    gl.TRIANGLE_STRIP,
    4, {
      ['a_position_' + id]: [0, 2],
      ['a_texture_coord_' + id]: [2, 2],
    },
    id,
    () => {
      gl.enable(gl.DEPTH_TEST)
      gl.uniform1i(this.u_sampler_location, 0);
    });
  vbo_ray.init();
}

function appendGrid() {
  const xcount = 11;
  const ycount = 11;
  const verts = new Float32Array(7 * 2 * (xcount + ycount));
  const xymax = 5.0;
  var v = 0;
  var j = 0;
  const xgap = xymax / (xcount - 1);
  const ygap = xymax / (ycount - 1);
  for (v = 0, j = 0; v < 2 * xcount; v++, j += 7) {
    if (v % 2 == 0) {
      verts[j] = -xymax + v * xgap;
      verts[j + 1] = -xymax;
      verts[j + 2] = 0.0;
      verts[j + 3] = 1.0;
    } else {
      verts[j] = -xymax + (v - 1) * xgap;
      verts[j + 1] = xymax;
      verts[j + 2] = 0.0;
      verts[j + 3] = 1.0;
    }
  }
  for (v = 0; v < 2 * ycount; v++, j += 7) {
    if (v % 2 == 0) {
      verts[j] = -xymax;
      verts[j + 1] = -xymax + v * ygap;
      verts[j + 2] = 0.0;
      verts[j + 3] = 1.0;
    } else {
      verts[j] = xymax;
      verts[j + 1] = -xymax + (v - 1) * ygap;
      verts[j + 2] = 0.0;
      verts[j + 3] = 1.0;
    }
  }
  for (var i = 0; i < verts.length; i += 7) {
    verts[i + 4] = 80.0 / 255;
    verts[i + 5] = 80.0 / 255;
    verts[i + 6] = 80.0 / 255;
  }
  return verts;
}

function appendDisc(radius = 2) {
  const xcount = radius * 5 + 1;
  const ycount = radius * 5 + 1;
  const verts = new Float32Array(7 * 2 * (xcount + ycount));
  const xgap = 2 * radius / (xcount - 2);
  const ygap = 2 * radius / (ycount - 2);
  var line = 0;
  for (var i = 0; i < xcount; i++, line++) {
    var x = -radius + (i + 0.5) * xgap;
    var diff = Math.sqrt(radius * radius - x * x);
    verts[(line * 7 * 2) + 0] = x;
    verts[(line * 7 * 2) + 1] = -diff;
    verts[(line * 7 * 2) + 2] = 0;
    verts[(line * 7 * 2) + 3] = 1;
    verts[(line * 7 * 2) + 4] = Math.random();
    verts[(line * 7 * 2) + 5] = Math.random();
    verts[(line * 7 * 2) + 6] = Math.random();
    verts[(line * 7 * 2) + 7] = x;
    verts[(line * 7 * 2) + 8] = diff;
    verts[(line * 7 * 2) + 9] = 0;
    verts[(line * 7 * 2) + 10] = 1;
    verts[(line * 7 * 2) + 11] = Math.random();
    verts[(line * 7 * 2) + 12] = Math.random();
    verts[(line * 7 * 2) + 13] = Math.random();
  }
  for (i = 0; i < ycount; i++, line++) {
    var y = -radius + (i + 0.5) * ygap;
    var diff = Math.sqrt(radius * radius - y * y);
    verts[(line * 7 * 2) + 0] = -diff;
    verts[(line * 7 * 2) + 1] = y;
    verts[(line * 7 * 2) + 2] = 0;
    verts[(line * 7 * 2) + 3] = 1;
    verts[(line * 7 * 2) + 4] = Math.random();
    verts[(line * 7 * 2) + 5] = Math.random();
    verts[(line * 7 * 2) + 6] = Math.random();
    verts[(line * 7 * 2) + 7] = diff;
    verts[(line * 7 * 2) + 8] = y;
    verts[(line * 7 * 2) + 9] = 0;
    verts[(line * 7 * 2) + 10] = 1;
    verts[(line * 7 * 2) + 11] = Math.random();
    verts[(line * 7 * 2) + 12] = Math.random();
    verts[(line * 7 * 2) + 13] = Math.random();
  }
  return verts;
}

function appendSphere(radius = 1) {
  const NScount = 13;
  const EWcount = 2 * NScount;
  const vertCount = 2 * EWcount * NScount;
  const vertSet = new Float32Array(vertCount * 7);
  const EWbgnColr = glMatrix.vec4.fromValues(1.0, 0.5, 0.0, 1.0);
  const EWendColr = glMatrix.vec4.fromValues(0.0, 0.5, 1.0, 1.0);
  const NSbgnColr = glMatrix.vec4.fromValues(1.0, 1.0, 1.0, 1.0);
  const NSendColr = glMatrix.vec4.fromValues(0.0, 1.0, 0.5, 1.0);
  var EWcolrStep = glMatrix.vec4.create();
  var NScolrStep = glMatrix.vec4.create();
  glMatrix.vec4.subtract(EWcolrStep, EWendColr, EWbgnColr);
  glMatrix.vec4.subtract(NScolrStep, NSendColr, NSbgnColr);
  glMatrix.vec4.scale(EWcolrStep, EWcolrStep, 2.0 / (EWcount - 1));
  glMatrix.vec4.scale(NScolrStep, NScolrStep, 1.0 / (NScount - 1));
  var EWgap = 1.0 / (EWcount - 1);
  var NSgap = 1.0 / (NScount - 1);
  var EWint = 0;
  var NSint = 0;
  var v = 0;
  var idx = 0;
  var pos = glMatrix.vec4.create();
  var colrNow = glMatrix.vec4.create();

  for (NSint = 0; NSint < NScount; NSint++) {
    colrNow = glMatrix.vec4.scaleAndAdd(colrNow, NSbgnColr, NScolrStep, NSint);
    for (EWint = 0; EWint < EWcount; EWint++, v++, idx += 7) {
      polar2xyz(pos, EWint * EWgap, NSint * NSgap);
      vertSet[idx] = pos[0];
      vertSet[idx + 1] = pos[1];
      vertSet[idx + 2] = pos[2];
      vertSet[idx + 3] = 1.0;
      vertSet[idx + 4] = colrNow[0];
      vertSet[idx + 5] = colrNow[1];
      vertSet[idx + 6] = colrNow[2];
    }
  }

  for (EWint = 0; EWint < EWcount; EWint++) {
    if (EWint < EWcount / 2) {
      colrNow = glMatrix.vec4.scaleAndAdd(colrNow, EWbgnColr, EWcolrStep, EWint);
    } else {
      colrNow = glMatrix.vec4.scaleAndAdd(colrNow, EWbgnColr, EWcolrStep, EWcount - EWint);
    }
    for (NSint = 0; NSint < NScount; NSint++, v++, idx += 7) {
      polar2xyz(pos, EWint * EWgap, NSint * NSgap);
      vertSet[idx] = pos[0];
      vertSet[idx + 1] = pos[1];
      vertSet[idx + 2] = pos[2];
      vertSet[idx + 3] = 1.0;
      vertSet[idx + 4] = colrNow[0];
      vertSet[idx + 5] = colrNow[1];
      vertSet[idx + 6] = colrNow[2];
    }
  }
  return vertSet;
}

function polar2xyz(out4, fracEW, fracNS) {
  var sEW = Math.sin(2.0 * Math.PI * fracEW);
  var cEW = Math.cos(2.0 * Math.PI * fracEW);
  var sNS = Math.sin(Math.PI * fracNS);
  var cNS = Math.cos(Math.PI * fracNS);
  glMatrix.vec4.set(out4, cEW * sNS, sEW * sNS, cNS, 1.0);
}

/**
 * Draws all of the VBOBoxes.
 */
function drawAll() {
  if (tracker.clear) gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.viewport(0, 0, gl.drawingBufferWidth / 2, gl.drawingBufferHeight);
  preview_vbos.forEach((box, i) => {
    box.enable();
    box.adjust();
    box.draw();
  });

  gl.viewport(gl.drawingBufferWidth / 2, 0, gl.drawingBufferWidth / 2, gl.drawingBufferHeight);
  vbo_ray.enable();
  vbo_ray.adjust();
  vbo_ray.draw();
}
