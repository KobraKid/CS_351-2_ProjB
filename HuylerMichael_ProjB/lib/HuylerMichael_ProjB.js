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

var g_image = new ImageBuffer(256, 256);
var g_scene = new Scene();

/* WebGL preview VBOs */
var preview_vbos = []
// Ground Plane
var vbo_0;

/* Raytrace VBO */
var vbo_ray;

/**
 * Initialize global variables, event listeners, etc.
 */
function main() {
  canvas = document.getElementById('webgl');
  canvas.width = window.innerWidth;
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
  g_scene.traceImage();
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
    ...appendDisc(2),
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

function appendSphere() {

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
