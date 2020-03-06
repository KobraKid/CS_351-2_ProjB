/**
 * Input handler.
 *
 * Handles all program inputs, including keypress events, mouse events, and
 * page resize events.
 *
 * @author Michael Huyler
 */

/* Keyboard vars */
var keysPressed = {};
var keyPollingFrequency = 3; // Frames between key polling
var shouldUpdateKeypress = 0;
/* Mouse vars */
var mouse_clicked = false;
var mouse_x = 0;
var mouse_y = 0;
var mouse_drag_x = 0;
var mouse_drag_y = 0;

/**
 * Performs an action when a key is pressed.
 */
function keyDown(kev) {
  var code;
  if (!kev.code) {
    code = "" + kev.keyCode;
  } else {
    code = kev.code;
  }
  keysPressed[code] = true;
  switch (code) {
    case "KeyP":
    case "80":
      tracker.pause = !tracker.pause;
      break;
    case "KeyT":
    case "84":
      g_scene.traceImage();
      break;
    case "Period":
    case "86":
      toggle_help();
      break;
    case "Slash":
    case "90":
      toggle_gui();
      break;
    default:
      // console.log("Unused key: " + code);
      break;
  }
}

/**
 * Performs an action when a key is released.
 */
function keyUp(kev) {
  var code;
  if (!kev.code) {
    code = "" + kev.keyCode;
  } else {
    code = kev.code;
  }
  keysPressed[code] = false;
  switch (code) {
    default:
      // console.log("Unused key: " + code);
      break;
  }
}

/**
 * Handles continuous key presses.
 *
 * For actions that should be performed for the entire duration of the
 * keypress, not just on the rising/falling edge, this function will poll the
 * key every few frames and perform a repeated action.
 */
function updateKeypresses() {
  if (shouldUpdateKeypress < keyPollingFrequency) {
    shouldUpdateKeypress++;
    return;
  }
  shouldUpdateKeypress = 0;
  for (var key in keysPressed) {
    if (!keysPressed[key]) {
      continue;
    }
    switch (key) {
      case "KeyW":
      case "87":
        var move = glMatrix.vec4.create();
        glMatrix.vec4.sub(move, tracker.camAimPoint, tracker.camEyePoint);
        glMatrix.vec4.normalize(move, move);
        glMatrix.vec4.scale(move, move, tracker.camSpeed);
        glMatrix.vec4.add(tracker.camAimPoint, tracker.camAimPoint, move);
        glMatrix.vec4.add(tracker.camEyePoint, tracker.camEyePoint, move);
        break;
      case "KeyA":
      case "65":
        var move = glMatrix.vec4.fromValues(Math.sin(tracker.camYaw), -Math.cos(tracker.camYaw), 0, 0);
        glMatrix.vec4.scale(move, move, -tracker.camSpeed);
        glMatrix.vec4.add(tracker.camAimPoint, tracker.camAimPoint, move);
        glMatrix.vec4.add(tracker.camEyePoint, tracker.camEyePoint, move);
        break;
      case "KeyS":
      case "83":
        var move = glMatrix.vec4.create();
        glMatrix.vec4.sub(move, tracker.camEyePoint, tracker.camAimPoint);
        glMatrix.vec4.normalize(move, move);
        glMatrix.vec4.scale(move, move, tracker.camSpeed);
        glMatrix.vec4.add(tracker.camAimPoint, tracker.camAimPoint, move);
        glMatrix.vec4.add(tracker.camEyePoint, tracker.camEyePoint, move);
        break;
      case "KeyD":
      case "68":
        var move = glMatrix.vec4.fromValues(Math.sin(tracker.camYaw), -Math.cos(tracker.camYaw), 0, 0);
        glMatrix.vec4.scale(move, move, tracker.camSpeed);
        glMatrix.vec4.add(tracker.camAimPoint, tracker.camAimPoint, move);
        glMatrix.vec4.add(tracker.camEyePoint, tracker.camEyePoint, move);
        break;
      default:
        // console.log("Unused key: " + key);
        break;
    }
  }
  keysPressed = Object.fromEntries(Object.entries(keysPressed).filter(([k, v]) => v));
}

function mouseDown(ev) {
  var mouse_pos = mouseToCVV(ev);
  mouse_x = mouse_pos[0];
  mouse_y = mouse_pos[1];
  mouse_clicked = true;
}

function mouseUp(ev) {
  var mouse_pos = mouseToCVV(ev);
  mouse_clicked = false;
  mouse_drag_x += (mouse_pos[0] - mouse_x);
  mouse_drag_y += (mouse_pos[1] - mouse_y);
  mouse_x = mouse_pos[0];
  mouse_y = mouse_pos[1];
}

function mouseMove(ev) {
  if (!mouse_clicked) return;

  var mouse_pos = mouseToCVV(ev);
  mouse_drag_x += (mouse_pos[0] - mouse_x);
  mouse_drag_y += (mouse_pos[1] - mouse_y);
  mouse_x = mouse_pos[0];
  mouse_y = mouse_pos[1];

  tracker.camYaw = (Math.PI / 2.0) + mouse_drag_x * 1.0;
  if (tracker.camYaw < -Math.PI) {
    tracker.camYaw += 2 * Math.PI;
  } else if (tracker.camYaw > Math.PI) {
    tracker.camYaw -= 2 * Math.PI;
  }

  tracker.camPitch = mouse_drag_y * 1.0;
  if (tracker.camPitch < -Math.PI / 2) {
    tracker.camPitch = -Math.PI / 2;
  } else if (tracker.camPitch > Math.PI / 2) {
    tracker.camPitch = Math.PI / 2;
  }

  tracker.camAimPoint[0] = tracker.camEyePoint[0] + Math.cos(tracker.camYaw) * Math.cos(tracker.camPitch);
  tracker.camAimPoint[1] = tracker.camEyePoint[1] + Math.sin(tracker.camYaw) * Math.cos(tracker.camPitch);
  tracker.camAimPoint[2] = tracker.camEyePoint[2] + Math.sin(tracker.camPitch);

  tracker.camUpVector[0] = Math.cos(tracker.camYaw) * Math.cos(tracker.camPitch + Math.PI / 2);
  tracker.camUpVector[1] = Math.sin(tracker.camYaw) * Math.cos(tracker.camPitch + Math.PI / 2);
  tracker.camUpVector[2] = Math.sin(tracker.camPitch + Math.PI / 2);
}

function mouseToCVV(ev) {
  return [
    (ev.clientX - canvas.getBoundingClientRect().left - (canvas.width / 2)) / (canvas.width / 2),
    (ev.clientY + canvas.getBoundingClientRect().top + (canvas.height / 2)) / (canvas.height / 2)
  ];
}

/**
 * Handles page resize events.
 *
 * Resizes the canvas and calls WebGLRenderingContext.viewport() to resize the
 * current rendering context according to the new canvas size and aspect ratio.
 */
function drawResize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  aspect = canvas.width / canvas.height;
  gl.viewport(0, 0, canvas.width, canvas.height);
}
