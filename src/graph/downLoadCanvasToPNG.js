//canvas config sample #######################################
// var canvasConfig = { width: 300, height: 300 }
//###########################################################
function downLoadCanvasToPNG(canvasConfig, painter) {
    if (typeof(canvasConfig.width) != 'number' || typeof(canvasConfig.height) != 'number' || canvasConfig.width <= 0 || canvasConfig.height <= 0) {
        throw ('canvasConfig wrong')
    }

    var width = canvasConfig.width
    var height = canvasConfig.height

    var canvas = document.createElement('canvas') //create temp canvas as container
    document.body.appendChild(canvas)

    canvas.width = width
    canvas.height = height

    if(typeof(painter) != 'function') {
        throw ('painter is not a function')
    }

    painter(canvas) //draw with outside func

    var imagePath = canvas.toDataURL().replace("image/png", "image/octet-stream")
    window.location.href = imagePath //pop download png

    document.body.removeChild(canvas) //remove temp canvas

    //painter sample =====================
    // function painter(canvas) {
    //     var width = canvas.width
    //     var height = canvas.height
    //
    //     context = canvas.getContext('2d')
    //
    //     context.translate(width/2, height/2)
    //
    //     context.beginPath()
    //     context.arc(0, 0, 100, 0, Math.PI * 2, true)
    //
    //     context.fillStyle = 'teal'
    //     context.fill()
    //
    //     return canvas
    // }
}

export default downLoadCanvasToPNG
