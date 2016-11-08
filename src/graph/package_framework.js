var ini = {
    sayHey: sayHey,
    sayYo: sayYo
}

var utils = {
    wala: wala,
    hoyo: hoyo
}

export default {
    ini: ini,
    utils: utils
}

function sayHey(msg) {
    console.log(msg)
    sayYo('sayYo')
}

function sayYo(msg) {
    console.log(msg)
    wala('wala')
}

function wala(msg) {
    console.log(msg)
    hoyo('hoyo')
}

function hoyo(msg) {
    console.log(msg)
}
