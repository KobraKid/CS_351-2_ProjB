class Light {
  constructor(position = glMatrix.vec4.fromValues(0, 0, 1, 1), color = glMatrix.vec4.fromValues(1, 1, 1, 1)) {
    this._pos = position;
    this._color = color;
    this._enabled = true;
    this.x = this._pos[0];
    this.y = this._pos[1];
    this.z = this._pos[2];
  }

  get color() {
    return this._color;
  }
  get enabled() {
    return this._enabled;
  }
  get position() {
    return this._pos;
  }

  createShadowRay(shadow_ray, hitPoint) {
    glMatrix.vec4.subtract(shadow_ray, this.position, hitPoint);
    shadow_ray[3] = 0;
  }
}

class LightList {
  constructor() {
    this._lights = [];
  }

  get size() {
    return this._lights.length;
  }

  add(l, scene) {
    this._lights.push(l);
    const size = this.size - 1;
    var l_folder = lights.addFolder(`Light ${scene}-${size + 1}`)
    l_folder.add(l, '_enabled').name('Enabled');
    l_folder.add(l, 'x', -10, 10, 1).onChange(function(value) {
      glMatrix.vec4.set(this.get(size).position, value, this.get(size).position[1], this.get(size).position[2], this.get(size).position[3]);
    }.bind(this));
    l_folder.add(l, 'y', -10, 10, 1).onChange(function(value) {
      glMatrix.vec4.set(this.get(size).position, this.get(size).position[0], value, this.get(size).position[2], this.get(size).position[3]);
    }.bind(this));
    l_folder.add(l, 'z', -10, 10, 1).onChange(function(value) {
      glMatrix.vec4.set(this.get(size).position, this.get(size).position[0], this.get(size).position[1], value, this.get(size).position[3]);
    }.bind(this));
  }

  get(i) {
    return this._lights[i];
  }
}
