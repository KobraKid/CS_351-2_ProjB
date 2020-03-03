class ImageBuffer {
  constructor(width, height) {
    this._w = width;
    this._h = height;
    this.pixel_size = 3; // RGB, 4 for RGBA
    this.iBuf = new Uint8Array(width * height * this.pixel_size);
    this.fBuf = new Float32Array(width * height * this.pixel_size);
  }

  get height() {
    return this._h;
  }
  get width() {
    return this._w;
  }

  toInt() {
    this.iBuf = this.fBuf.map(i => i / 255.0);
  }

  toFloat() {
    this.fBuf = this.iBuf.map(i => Math.min(255, Math.floor(Math.min(1.0, Math.max(0.0, i)) * 256.0)));
  }

}
