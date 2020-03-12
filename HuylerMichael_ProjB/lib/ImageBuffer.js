class ImageBuffer {
  constructor(width, height) {
    this._w = parseInt(width);
    this._h = parseInt(height);
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

  toFloat() {
    for (var i = 0; i < this.fBuf.length; i++) {
      this.fBuf[i] = this.iBuf[i] / 255.0;
    }
  }

  toInt() {
    for (var i = 0; i < this.iBuf.length; i++) {
      this.iBuf[i] = Math.min(255, Math.floor(Math.min(1.0, Math.max(0.0, this.fBuf[i])) * 256.0));
    }
  }

}
