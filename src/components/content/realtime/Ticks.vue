 <template>
    <div id="tickNum-container">
        <div id="tickNum-package">
            <div id="tickNum-package-title">
                接收包裹
            </div>
            <div class="tickNum-number">
                {{ tickNumPackage }}
            </div>
        </div>
        <div id="tickNum-delay">
            <div id="tickNum-delay-title">
                延误订单
            </div>
            <div class="tickNum-number">
                {{ tickNumDelay }}
            </div>
        </div>
    </div>
    <div id="tick-container">
        <div id="waves-container">
            <canvas id='waves'></canvas>
        </div>
        <div id="ticks">
            <div id="hours">
                {{ computeHours }}
            </div>
            <div id="ampm">
                {{ computeAMPM }}
            </div>
        </div>
    </div>
</template>

<script type="text/javascript">
import * as d3 from 'd3'

var animatorId //动画句柄，切换路由之后停止本组件动画

export default {
    data() {
        return {
            timerCounter: 8,
            isMorning: 'am',
            timerCounterIntervalId:'',
            tickNumPackageLimit:25262,
            tickNumDelayLimit:1828,
            tickNumPackage:0,
            tickNumDelay:0
        }
    },
    methods: {
        checkTimerCounter: function() {
            if (this.timerCounter < 20) {
                this.timerCounter++
                this.tickNumPackage += Math.floor(this.tickNumPackageLimit/12)
                this.tickNumDelay += Math.floor(this.tickNumDelayLimit/12)
            } else {
                this.timerCounter = 8
                this.tickNumPackage = 0
                this.tickNumDelay = 0
            }
        },
        drawWaves: drawWaves
    },
    computed: {
        computeAMPM: function() {
            if (this.timerCounter <= 12) {
                return '上午'
            } else {
                return '下午'
            }
        },
        computeHours: function() {
            if (this.timerCounter <= 9) {
                return '0' + this.timerCounter
            } else {
                return this.timerCounter
            }
        }
    },
    beforeDestroy: function() { //卸载组件之前，清楚定时器，防止内存泄漏
        clearInterval(this.timerCounterIntervalId)
        window.cancelAnimationFrame(animatorId)
    },
    ready: function() {
        this.timerCounterIntervalId = setInterval(this.checkTimerCounter, 1500)
        this.drawWaves()
        showTicks()
    }
}

function showTicks() {
    document.getElementById('tick-container').style.visibility = 'visible'
}

function drawWaves() {
    var width = 50
    var height = 280

    var canvas = document.getElementById('waves')
    var context = canvas.getContext('2d')

    canvas.width = width
    canvas.height = height

    var pointPinkGroup = []
    var pointAquaGroup = []
    var yStep = 0.05
    var segment = 25
    var xDeviation = 5

    var colorAquaScale = d3.scaleLinear()
        .domain([0, segment])
        .range(['black', 'aqua'])

    var colorPinkScale = d3.scaleLinear()
        .domain([0, segment])
        .range(['black', 'deeppink'])

    for (var i = 0; i < segment; i++) {
        pointAquaGroup[i] = new Point(2, 'aqua')
        pointAquaGroup[i].y = (height / segment) * i + generateRandomDistance() * xDeviation
        pointAquaGroup[i].angle = Math.PI/segment * 2 * i

        pointPinkGroup[i] = new Point(2, 'deeppink')
        pointPinkGroup[i].y = (height / segment) * i + generateRandomDistance() * xDeviation
        pointPinkGroup[i].angle = Math.PI/segment * 2 * i + Math.PI
    }

    window.requestAnimationFrame(drawFrame)

    function drawFrame() {
        context.clearRect(0,0, width, height)

        for (var i = 0; i < segment; i++) {
            pointAquaGroup[i].x = (width / 2) + Math.sin(pointAquaGroup[i].angle) * (width / 2)
            pointAquaGroup[i].angle += yStep

            pointPinkGroup[i].x = (width / 2) + Math.sin(pointPinkGroup[i].angle) * (width / 2)
            pointPinkGroup[i].angle += yStep
        }

        for (var j = 0; j < (segment - 1); j++) {
            context.beginPath()
            context.strokeStyle = colorAquaScale(j)
            context.moveTo(pointAquaGroup[j].x, pointAquaGroup[j].y)
            context.lineTo(pointAquaGroup[j+1].x, pointAquaGroup[j+1].y)
            context.stroke()
        }

        for (var j = 0; j < (segment - 1); j++) {
            context.beginPath()
            context.strokeStyle = colorPinkScale(j)
            context.moveTo(pointPinkGroup[j].x, pointPinkGroup[j].y)
            context.lineTo(pointPinkGroup[j+1].x, pointPinkGroup[j+1].y)
            context.stroke()
        }

        pointAquaGroup[segment-1].draw(context)
        pointPinkGroup[segment-1].draw(context)

        animatorId = window.requestAnimationFrame(drawFrame)
    }
}

function generateRandomDistance() {
    return (Math.random() - 0.5)
}

function Point(radius, color) {
  if (radius === undefined) { radius = 2; }
  if (color === undefined) { color = "#ff0000"; }
  this.x = 0;
  this.y = 0;
  this.radius = radius;
  this.color = color
  this.rotation = 0;
  this.scaleX = 1;
  this.scaleY = 1;
  this.lineWidth = 0;
}

Point.prototype.draw = function (context) {
  context.save();
  context.translate(this.x, this.y);
  context.rotate(this.rotation);
  context.scale(this.scaleX, this.scaleY);

  context.lineWidth = this.lineWidth;
  context.fillStyle = this.color;
  context.beginPath();
  context.arc(0, 0, this.radius, 0, (Math.PI * 2), true);
  context.closePath();
  context.fill();
  if (this.lineWidth > 0) {
    context.stroke();
  }
  context.restore();
}
</script>

<style lang="stylus">
#tickNum-container
    font-family 'Microsoft Yahei' Arial
    font-weight bold
    position absolute
    top 20px
    right 20px
    z-index 1200
    text-align right
    opacity 0.3

#tickNum-package-title
    font-size 12px
    color aqua

#tickNum-delay-title
    font-size 12px
    color deeppink

.tickNum-number
    font-size 48px
    color gray

#tick-container
    position absolute
    bottom 50px
    right 20px
    z-index 1200
    text-align center
    visibility hidden

#waves-container
    z-index 1300
    opacity 0.5

#ticks
    color #002735
    font-family Arial
    font-weight bold
    z-index 1200
    /*position absolute
    bottom 50px
    right 20px*/
    text-align center

#hours
    font-size 80px

#ampm
    font-size 24px
    margin-top -20px
    font-family 'Microsoft Yahei' Arial
    /*padding-right 8px*/

</style>
