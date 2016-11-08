function EventBridge() {
    var clientList = {}
    var listen
    var trigger
    var remove

    listen = function(key, fn) {
        if (!clientList[key]) {
            clientList[key] = []
        }
        clientList[key].push(fn)
        // console.log(this.clientList[key])
    }

    trigger = function() {
        var key = Array.prototype.shift.call(arguments)
        var fns = clientList[key]
        // console.log(fns)

        if (!fns || fns.length == 0) {
            return false
        }

        for (var i = 0; i < fns.length; i++) {
            var fn = fns[i]
            fn.apply(this, arguments)
        }
    }

    remove = function(key, fn) {
        var fns = clientList[key]
        if (!fns) {
            return false
        }

        if (!fn) {
            fns && (fns.length = 0)
        } else {
            for (var j = fns.length-1; j >= 0 ; j--) {
                var _fn = fns[j]
                if (_fn == fn) {
                    fns.splice(j, 1)
                }
            }
        }
    }

    return {
        listen: listen,
        trigger: trigger,
        remove: remove
    }
}

export default EventBridge()
