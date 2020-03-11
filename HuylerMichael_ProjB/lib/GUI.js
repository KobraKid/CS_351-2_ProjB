/**
 * GUI Manager.
 *
 * Handles setting up the GUI and help menu and sets up helper functions to
 * toggle the menus.
 *
 * @author Michael Huyler
 */

var gui;
var gui_open = true;
let GuiTracker = function() {
  this.pause = false;
  this.clear = true;
  this.trace = function() {
    do_raytracing();
  };
  this.progress = 0;
  this.resolution = 32;
  this.depth = 2;
  /* FPS */
  this.fps = 60.0;
  this.ms = 1000.0 / 60.0; // timestep
  this.prev;
  this.speed = 1; // speed at which simulation should run
  /**
   * Updatets the FPS in the GUI
   */
  this.fps_calc = function() {
    var now = Date.now();
    // prevent instability from switching tabs (since canvas does not update
    // when not the active tab): cap elapsed time to 266 2/3 ms = ~4 FPS
    var elapsed = Math.min(now - this.prev, 800 / 3.0);
    this.prev = now;
    this.ms = elapsed / this.speed;
    tracker.fps = 1000.0 / elapsed;
  };
  /*
   * WebGL camera vars
   */
  this.camSpeed = 0.5;
  this.camera = {
    yaw: Math.PI / 2.0,
    pitch: 0.0,
    fovy: 45.0,
    aspect: 1.0,
    near: 1.0,
    far: 10000.0,
    eye_point: glMatrix.vec4.create(),
    aim_point: glMatrix.vec4.create(),
    up_vector: glMatrix.vec4.create(),
    // initial constants
    initial_yaw: Math.PI / 2.0,
    initial_pitch: 0.0,
  };
  /* Antialiasing */
  this.aa = 1;
  this.jitter = false;
}
var tracker = new GuiTracker();
var help_visible = false;

/**
 * Initializes the GUI.
 */
function initGui() {
  tracker.camera.eye_point = glMatrix.vec4.fromValues(0, -8, 2, 1);
  tracker.camera.aim_point = glMatrix.vec4.fromValues(
    tracker.camera.eye_point[0] + Math.cos(tracker.camera.yaw) * Math.cos(tracker.camera.pitch),
    tracker.camera.eye_point[1] + Math.sin(tracker.camera.yaw) * Math.cos(tracker.camera.pitch),
    tracker.camera.eye_point[2] + Math.sin(tracker.camera.pitch),
    1.0);
  tracker.camera.up_vector = glMatrix.vec4.fromValues(
    Math.cos(tracker.camera.yaw) * Math.cos(tracker.camera.pitch + Math.PI / 2),
    Math.sin(tracker.camera.yaw) * Math.cos(tracker.camera.pitch + Math.PI / 2),
    Math.sin(tracker.camera.pitch + Math.PI / 2),
    0.0);

  gui = new dat.GUI({
    name: 'My GUI',
    hideable: false
  });
  gui.add(tracker, 'fps', 0, 60, 1).name('FPS').listen();
  gui.add(tracker, 'pause').name('Pause').listen();
  gui.add(tracker, 'resolution', {
    "64x64 px": 64,
    "128x128 px": 128,
    "256x256 px": 256,
    "512x512 px": 512,
    "1024x1024 px": 1024,
  }).name('Resolution').onChange(value => g_scene.setImageBuffer(new ImageBuffer(value, value)));
  gui.add(tracker, 'depth', 1, 4, 1).name('Depth').onChange(value => g_scene.max_depth = value);
  var aa = gui.addFolder('Antialiasing');
  aa.add(tracker, 'aa', {
    "1x1": 1,
    "2x2": 2,
    "3x3": 3,
    "4x4": 4,
  }).name('Supersampling');
  aa.add(tracker, 'jitter').name('Jitter');
  aa.open();
  gui.add(tracker, 'trace').name('Trace!');
  gui.add(tracker, 'progress', 0, 100, 1).name('Progress:').listen();
  gui.open();
  document.getElementsByClassName('close-bottom')[0].onclick = function() {
    gui_open = !gui_open;
  };
}

/**
 * Toggles the GUI.
 */
function toggle_gui() {
  gui_open = !gui_open;
  if (gui_open)
    gui.open();
  else
    gui.close();
}

/**
 * Toggles the help menu.
 */
function toggle_help() {
  help_visible = !help_visible;
  document.getElementById("help-menu-expanded").style.visibility = help_visible ? "visible" : "hidden";
  document.getElementById("help-menu").innerHTML = help_visible ? "Hide Help" : "Show Help";
}

async function do_raytracing() {
  await g_scene.traceImage();
}
