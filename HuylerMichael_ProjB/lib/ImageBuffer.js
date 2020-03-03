class ImageBuffer {
  constructor(width, height) {
    this._w = width;
    this._h = height;
    this.pixel_size = 3; // RGB, 4 for RGBA
    this.iBuf = new Uint8Array(width * height * this.pixel_size);
    this.fBuf = new Float32Array(width * height * this.pixel_size);
    this.setTestPattern(0);
  }

  get height() {
    return this._h;
  }
  get width() {
    return this._w;
  }

  setTestPattern(pattNum) {
    var PATT_MAX = 4;
    if (pattNum < 0 || pattNum >= PATT_MAX)
      pattNum %= PATT_MAX;

    for (var j = 0; j < this._h; j++) { // for the j-th row of pixels
      for (var i = 0; i < this._w; i++) { //  & the i-th pixel on that row,
        var idx = (j * this._w + i) * this.pixel_size; // Array index at pixel (i,j)
        switch (pattNum) {
          case 0: //================(Colorful L-shape)===========================
            if (i < this._w / 4 || j < this._h / 4) {
              this.iBuf[idx] = i; // 0 <= red <= 255
              this.iBuf[idx + 1] = j; // 0 <= grn <= 255
            } else {
              this.iBuf[idx] = 0;
              this.iBuf[idx + 1] = 0;
            }
            this.iBuf[idx + 2] = 255 - i - j; // 0 <= blu <= 255
            break;
          case 1: //================(bright orange)==============================
            this.iBuf[idx] = 255; // bright orange
            this.iBuf[idx + 1] = 128;
            this.iBuf[idx + 2] = 0;
            break;
          case 2: //=================(Vertical Blue/yellow)=======================
            if (i > 5 * this._w / 7 && j > 4 * this._h / 5) {
              this.iBuf[idx] = 200; // 0 <= red <= 255
              this.iBuf[idx + 1] = 200; // 0 <= grn <= 255
              this.iBuf[idx + 2] = 200; // 0 <= blu <= 255
            } else {
              this.iBuf[idx] = 255 - j; // 0 <= red <= 255
              this.iBuf[idx + 1] = 255 - j; // 0 <= grn <= 255
              this.iBuf[idx + 2] = j; // 0 <= blu <= 255
            }
            break;
          case 3:
            //================(Diagonal YRed/Cyan)================================
            this.iBuf[idx] = 255 - (i + j) / 2; // bright orange
            this.iBuf[idx + 1] = 255 - j;
            this.iBuf[idx + 2] = 255 - j;
            break;
          default:
            break;
        }
      }
    }
    this.toFloat();
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
