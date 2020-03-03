/**
 * Input handler.
 *
 * Handles all program inputs, including keypress events, mouse events, and
 * page resize events.
 *
 * @author Michael Huyler
 */

var keysPressed = {};
var keyPollingFrequency = 3; // Frames between key polling
var shouldUpdateKeypress = 0;
var mouseClicked = false;

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
        var D = [
          (g_perspective_lookat[0] - g_perspective_eye[0]) * 0.5,
          (g_perspective_lookat[1] - g_perspective_eye[1]) * 0.5,
          (g_perspective_lookat[2] - g_perspective_eye[2]) * 0.5,
        ];
        g_perspective_eye[0] += D[0];
        g_perspective_lookat[0] += D[0];
        g_perspective_eye[1] += D[1];
        g_perspective_lookat[1] += D[1];
        g_perspective_eye[2] += D[2];
        g_perspective_lookat[2] += D[2];
        break;
      case "KeyA":
      case "65":
        var D = [
          g_perspective_lookat[0] - g_perspective_eye[0],
          g_perspective_lookat[1] - g_perspective_eye[1],
          0
        ];
        // Cross Product
        var C = [
          (D[1] * 1 - D[2] * 0) * 0.5,
          (D[2] * 0 - D[0] * 1) * 0.5,
          0 // (D[0] * 0 - D[1] * 0) * 0.5
        ];
        g_perspective_eye[0] -= C[0];
        g_perspective_lookat[0] -= C[0];
        g_perspective_eye[1] -= C[1];
        g_perspective_lookat[1] -= C[1];
        break;
      case "KeyS":
      case "83":
        var D = [
          (g_perspective_lookat[0] - g_perspective_eye[0]) * 0.5,
          (g_perspective_lookat[1] - g_perspective_eye[1]) * 0.5,
          (g_perspective_lookat[2] - g_perspective_eye[2]) * 0.5,
        ];
        g_perspective_eye[0] -= D[0];
        g_perspective_lookat[0] -= D[0];
        g_perspective_eye[1] -= D[1];
        g_perspective_lookat[1] -= D[1];
        g_perspective_eye[2] -= D[2];
        g_perspective_lookat[2] -= D[2];
        break;
      case "KeyD":
      case "68":
        var D = [
          g_perspective_lookat[0] - g_perspective_eye[0],
          g_perspective_lookat[1] - g_perspective_eye[1],
          0
        ];
        // Cross Product
        var C = [
          (D[1] * 1 - D[2] * 0) * 0.5,
          (D[2] * 0 - D[0] * 1) * 0.5,
          0 // (D[0] * 0 - D[1] * 0) * 0.5
        ];
        g_perspective_eye[0] += C[0];
        g_perspective_lookat[0] += C[0];
        g_perspective_eye[1] += C[1];
        g_perspective_lookat[1] += C[1];
        break;
      /*
      case "KeyI":
      case "73":
        g_perspective_lookat[2] += 0.05;
        break;
      case "KeyJ":
      case "74":
        theta += 0.05;
        g_perspective_lookat[0] = g_perspective_eye[0] + Math.cos(theta);
        g_perspective_lookat[1] = g_perspective_eye[1] + Math.sin(theta);
        break;
      case "KeyK":
      case "75":
        g_perspective_lookat[2] -= 0.05;
        break;
      case "KeyL":
      case "76":
        theta -= 0.05;
        g_perspective_lookat[0] = g_perspective_eye[0] + Math.cos(theta);
        g_perspective_lookat[1] = g_perspective_eye[1] + Math.sin(theta);
        break;
      */
      default:
        // console.log("Unused key: " + key);
        break;
    }
  }
  keysPressed = Object.fromEntries(Object.entries(keysPressed).filter(([k, v]) => v));
}

function mouseDown(ev) {
  mouseClicked = true;
}

function mouseUp(ev) {
  mouseClicked = false;
}

function mouseMove(ev) {

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
