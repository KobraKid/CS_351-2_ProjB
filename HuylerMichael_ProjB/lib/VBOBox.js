/**
 * Abstracted container for WebGL. Inspired by Tumblin's VBOBox.
 *
 * @author Michael Huyler
 */

/**
 * A complete encapsulation of a VBO and its corresponding shader program.
 *
 * Provides an easy way to switch between VBOs, especially those which use
 * different shaders, or which have different attribute sets.
 */
class VBOBox {
  /**
   * @param {string} VERTEX_SHADER The vertex shader for this box.
   * @param {string} FRAGMENT_SHADER The fragment shader for this box.
   * @param {!Float32Array} vertex_array An array of vertices to be loaded into the VBO.
   * @param {!GLenum} draw_method The mode to be used when calling WebGLRenderingContext.drawArrays().
   * @param {number} attribute_count The number of attributes each vertex has.
   * @param {[string: number]} attributes A dictionary of attributes stored in the VBO, where keys are the
   *        attribute names, and values are how many floats are stared in the VBO for the given attribute.
   * @param {number} box_num The index of this box.
   */
  constructor(VERTEX_SHADER, FRAGMENT_SHADER, vertex_array, draw_method,
    attribute_count, attributes, box_num, adjust_function) {
    /* GLSL shader code */
    this.VERTEX_SHADER = VERTEX_SHADER;
    this.FRAGMENT_SHADER = FRAGMENT_SHADER;

    /* VBO contents */
    this._vbo = vertex_array;

    /* VBO metadata */
    // Number of vertices in the VBO
    this.vertex_count = this._vbo.length / attribute_count;
    // Number of bytes each float requires
    this.FSIZE = this._vbo.BYTES_PER_ELEMENT;
    // Total size of the VBO in bytes
    this.vbo_size = this._vbo.length * this.FSIZE;
    // Size of a single vertex in bytes
    this.vbo_stride = this.vbo_size / this.vertex_count;
    // How to interpret the vertices
    this.draw_method = draw_method;

    /* GPU memory locations */
    this.vbo_loc;
    this.shader_loc;

    /* Attribute metadata */
    this.attributes = [];
    for (var attribute in attributes) {
      this.attributes.push({
        name: attribute,
        count: attributes[attribute][1],
        offset: attributes[attribute][0] * this.FSIZE,
        location: ''
      });
    }

    /* Uniform variables and locations */
    this._mvp_matrix = glMatrix.mat4.create();
    this.u_mvp_matrix_loc;

    /* VBOBox index */
    this.box_num = box_num;

    /* Adjust function */
    this.custom_adjust = adjust_function;

    /* Individual M, V, P matricies */
    this._model_matrix = glMatrix.mat4.create();
    this._view_matrix = glMatrix.mat4.create();
    this._projection_matrix = glMatrix.mat4.create();

    /* Vertex counts */
    this.c_grid_vertex = 44;
    this.c_disc_vertex = 44;
    this.c_sphere_vertex = 0;
  }

  get index() {
    return this.box_num;
  }
  get model_matrix() {
    return this._model_matrix;
  }
  get program() {
    return this.shader_loc;
  }
  get projection_matrix() {
    return this._projection_matrix;
  }
  get vbo() {
    return this._vbo;
  }
  get view_matrix() {
    return this._view_matrix;
  }

  set model_matrix(matrix) {
    this._model_matrix = matrix;
  }
  set projection_matrix(matrix) {
    this._projection_matrix = matrix;
  }
  set vbo(vbo) {
    this._vbo = vbo;
  }
  set view_matrix(matrix) {
    this._view_matrix = matrix;
  }

  /**
   * Initializes a VBOBox, finds GPU locaiton of all variables.
   */
  init() {
    // Set up shader
    this.shader_loc =
      createProgram(gl, this.VERTEX_SHADER, this.FRAGMENT_SHADER);
    if (!this.shader_loc) {
      console.log(this.constructor.name +
        '.init() failed to create executable Shaders on the GPU.');
      return;
    }
    gl.program = this.shader_loc;

    this.vbo_loc = gl.createBuffer();
    if (!this.vbo_loc) {
      console.log(this.constructor.name +
        '.init() failed to create VBO in GPU.');
      return;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo_loc);
    gl.bufferData(gl.ARRAY_BUFFER, this.vbo, gl.STATIC_DRAW);

    // Set up attributes
    this.attributes.forEach((attribute, i) => {
      attribute.location =
        gl.getAttribLocation(this.shader_loc, attribute.name);
      if (attribute.locaiton < 0) {
        console.log(this.constructor.name +
          '.init() Failed to get GPU location of ' +
          attribute.name);
        return;
      }
    });

    // Set up uniforms
    this.u_mvp_matrix_loc =
      gl.getUniformLocation(this.shader_loc, 'u_mvp_matrix_' + this.box_num);
    if (!this.u_mvp_matrix_loc) {
      console.log(this.constructor.name +
        '.init() failed to get GPU location for u_mvp_matrix_' + this.box_num + ' uniform');
      return;
    }

    if (this.box_num == 1) {
      this.u_texture_location = gl.createTexture();
      if (!this.u_texture_location) {
        console.log(this.constructor.name +
          '.init() failed to create the texture object');
        return;
      }

      this.u_sampler_location = gl.getUniformLocation(this.shader_loc, 'u_sampler_' + this.box_num);
      if (!this.u_sampler_location) {
        console.log(this.constructor.name +
          '.init() failed to get GPU location for u_sampler_' + this.box_num + ' uniform');
        return;
      }

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.u_texture_location);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, g_image.width, g_image.height, 0, gl.RGB, gl.UNSIGNED_BYTE, g_image.iBuf);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
  }

  /**
   * Enables a VBOBox, switching the GPU over to the box's program and enables
   * the current program's attributes.
   */
  enable() {
    gl.useProgram(this.shader_loc);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo_loc);

    this.attributes.forEach((attribute, _) => {
      gl.vertexAttribPointer(
        attribute.location,
        attribute.count,
        gl.FLOAT,
        false,
        this.vbo_stride,
        attribute.offset
      );
      gl.enableVertexAttribArray(attribute.location);
    });
  }

  /**
   * Ensures that this VBOBox is ready to be used.
   */
  validate() {
    if (gl.getParameter(gl.CURRENT_PROGRAM) != this.shader_loc) {
      console.log(this.constructor.name +
        '.validate(): shader program at this.shader_loc not in use! ' + this.index);
      return false;
    }
    if (gl.getParameter(gl.ARRAY_BUFFER_BINDING) != this.vbo_loc) {
      console.log(this.constructor.name +
        '.validate(): vbo at this.vbo_loc not in use! ' + this.index);
      return false;
    }
    return true;
  }

  /**
   * Adjusts matrices every frame, sends new values to the GPU.
   */
  adjust() {
    this.custom_adjust();
    glMatrix.mat4.perspective(this.projection_matrix, glMatrix.glMatrix.toRadian(tracker.camera.fovy), tracker.camera.aspect, tracker.camera.near, tracker.camera.far);
    glMatrix.mat4.lookAt(this.view_matrix, tracker.camera.eye_point, tracker.camera.aim_point, tracker.camera.up_vector);
    // glMatrix.mat4.identity(this.model_matrix);
    glMatrix.mat4.multiply(this._mvp_matrix, this.projection_matrix, this.view_matrix);
  }

  /**
   * Draws the current VBOBox, using the currently loaded program, variables
   * and VBO contents.
   */
  draw() {
    if (!this.validate()) {
      console.log('ERROR: Before .draw() you need to call .enable()');
    }
    if (this.box_num == 1) {
      gl.drawArrays(this.draw_method, 0, this.vertex_count);
      return;
    }
    var v_count = 0;
    var temp;
    // Grid
    temp = glMatrix.mat4.create();
    glMatrix.mat4.copy(temp, this._mvp_matrix);
    gl.uniformMatrix4fv(this.u_mvp_matrix_loc, false, this._mvp_matrix);
    gl.drawArrays(this.draw_method, v_count, this.c_grid_vertex);
    v_count += this.c_grid_vertex;
    this._mvp_matrix = temp;
    // Disc 1
    temp = glMatrix.mat4.create();
    glMatrix.mat4.copy(temp, this._mvp_matrix);
    glMatrix.mat4.translate(this._mvp_matrix, this._mvp_matrix, glMatrix.vec3.fromValues(1, 1, 1.3));
    glMatrix.mat4.rotate(this._mvp_matrix, this._mvp_matrix, 0.25 * Math.PI, glMatrix.vec3.fromValues(1, 0, 0));
    glMatrix.mat4.rotate(this._mvp_matrix, this._mvp_matrix, 0.25 * Math.PI, glMatrix.vec3.fromValues(0, 0, 1));
    gl.uniformMatrix4fv(this.u_mvp_matrix_loc, false, this._mvp_matrix);
    gl.drawArrays(this.draw_method, v_count, this.c_disc_vertex);
    v_count += this.c_disc_vertex;
    this._mvp_matrix = temp;
    // Disc 2
    temp = glMatrix.mat4.create();
    glMatrix.mat4.copy(temp, this._mvp_matrix);
    glMatrix.mat4.translate(this._mvp_matrix, this._mvp_matrix, glMatrix.vec3.fromValues(-1, 1, 1.3));
    glMatrix.mat4.rotate(this._mvp_matrix, this._mvp_matrix, 0.75 * Math.PI, glMatrix.vec3.fromValues(1, 0, 0));
    glMatrix.mat4.rotate(this._mvp_matrix, this._mvp_matrix, Math.PI / 3, glMatrix.vec3.fromValues(0, 0, 1));
    gl.uniformMatrix4fv(this.u_mvp_matrix_loc, false, this._mvp_matrix);
    gl.drawArrays(this.draw_method, v_count, this.c_disc_vertex);
    v_count += this.c_disc_vertex;
    this._mvp_matrix = temp;
    // Sphere
    temp = glMatrix.mat4.create();
    glMatrix.mat4.copy(temp, this._mvp_matrix);
    glMatrix.mat4.translate(this._mvp_matrix, this._mvp_matrix, glMatrix.vec3.fromValues(1.2, -1, 1));
    gl.uniformMatrix4fv(this.u_mvp_matrix_loc, false, this._mvp_matrix);
    gl.drawArrays(this.draw_method, v_count, this.c_sphere_vertex);
    v_count += this.c_sphere_vertex;
    this._mvp_matrix = temp;
  }

  /**
   * Reloads the contents of the VBO.
   *
   * Useful if independent vertices should move. Modifications to this VBOBox's
   * vbo array will be substituted into the GPU's VBO.
   *
   * @param {!Float32Array} data The data to sub into the VBO.
   * @param {number=} index The index to start substituting data at.
   */
  reload(data, index = 0) {
    gl.useProgram(this.shader_loc);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo_loc);
    gl.bufferSubData(gl.ARRAY_BUFFER, index * this.FSIZE, data);
  }

  reloadTexture() {
    // gl.useProgram(this.shader_loc);
    // gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo_loc);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, g_image.width, g_image.height, gl.RGB, gl.UNSIGNED_BYTE, g_image.iBuf);
  }
}
