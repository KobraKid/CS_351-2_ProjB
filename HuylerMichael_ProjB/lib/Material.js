class Material {
  constructor(
    ambient_illumination,
    diffuse_illumination,
    specular_illumination,
    ambient_reflectance,
    diffuse_reflectance,
    specular_reflectance,
    emissiveness,
    specular_exponent) {
    this._i_a = ambient_illumination;
    this._i_d = diffuse_illumination;
    this._i_s = specular_illumination;

    this._k_a = ambient_reflectance;
    this._k_d = diffuse_reflectance;
    this._k_s = specular_reflectance;
    this._k_e = emissiveness;

    this._se = specular_exponent;
  }
}

class MaterialList {
  constructor() {
    this._mat = [];
  }

  get size() {
    return this._mat.length;
  }

  add(m) {
    this._mat.push(m);
  }

  get(i) {
    return this._mat[i];
  }
}
