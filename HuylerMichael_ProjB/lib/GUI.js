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
var GuiTracker = function() {
  this.pause = false;
  this.clear = true;
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
  }
  this.camYaw = Math.PI / 2.0;
  this.camPitch = 0.0;
  this.camFovy = 45.0;
  this.camAspect = 1.0;
  this.camNear = 1.0;
  this.camFar = 10000.0;
  this.camEyePoint = glMatrix.vec4.fromValues(0, -8, 2, 1);
  this.camAimPoint = glMatrix.vec4.fromValues(
    this.camEyePoint[0] + Math.cos(this.camYaw) * Math.cos(this.camPitch),
    this.camEyePoint[1] + Math.sin(this.camYaw) * Math.cos(this.camPitch),
    this.camEyePoint[2] + Math.sin(this.camPitch),
    1.0);
  this.camUpVector = glMatrix.vec4.fromValues(
    Math.cos(this.camYaw) * Math.cos(this.camPitch + Math.PI / 2),
    Math.sin(this.camYaw) * Math.cos(this.camPitch + Math.PI / 2),
    Math.sin(this.camPitch + Math.PI / 2),
    0.0);
}
var tracker = new GuiTracker();
var help_visible = false;

/**
 * Initializes the GUI.
 */
function initGui() {
  gui = new dat.GUI({
    name: 'My GUI',
    hideable: false
  });
  gui.add(tracker, 'fps', 0, 60, 1).name('FPS').listen();
  gui.add(tracker, 'pause').name('Pause').listen();
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
