class Material {
  constructor(ambient, diffuse, specular, emissive, shininess) {
    this._k_a = ambient;
    this._k_d = diffuse;
    this._k_sp = specular;
    this._k_e = emissive;
    this._k_sh = shininess;
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
