class Material {
  constructor() {

  }
}

class MaterialList {
  constructor() {
    this._mat = [];
  }

  get materials() {
    return this._mat;
  }
  get size() {
    return this._mat.length;
  }
}
