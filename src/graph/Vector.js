var Vector = function(x, y) {
    this.x = x
    this.y = y
}

Vector.prototype.sayhi = function(msg) {
    console.log(msg)
}

export default Vector
