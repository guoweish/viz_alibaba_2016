import * as d3 from 'd3'
import $ from 'jquery'

import EventBridge from './EventBridge'
import ShareState from './ShareState'

// import state from '../vuex/store'
// import { getCanvasSize } from '../vuex/getters'
// //
//test area ###################################
function excute(cmd) {
    console.log(cmd + ' will be excuted as other commonds')
}

function run(distance) {
    console.log(distance + ' meters run tonight!')
}

// console.log(EventBridge())
// var eBridge = EventBridge()
// console.log(ShareState)
// console.log(getCanvasSize())

// EventBridge.listen('excuteCmd',excute)
// EventBridge.listen('runNight',run)
//
// EventBridge.trigger('runNight', 2000)
// EventBridge.trigger('excuteCmd', 'wolf')
// ShareState.message = 'yo from wind.js'

// 注册更新图表事件
// EventBridge.listen('updateDonut',ShareState.updateWidgetDonutChart)
// EventBridge.trigger('updateDonut', 'I am wind')
//test area ###################################


var globalDataRecorder = '' //记录全局数据参数
var globalDataArray = '' //记录原始数据
var dataMatrix = '' //转换后的地图数据矩阵
var colorTable = ''
var colorMatrix = ''
// 暂时没用到
var windDetailData = { //风力详情组件，包括鼠标当前位置的风力、经纬度、方向
	speed: 0,
	lon: 0,
	lat: 0,
	direction: 0
}
var globalCityCircleGroup = [] //全局城市圆圈变量，在外部便于静态操作鼠标交互关系
var shineSpotPosition = [] //全局存放闪光点位置，绘制闪光

var Vector = function(x, y) {
	this.x = x;
	this.y = y;
}

Vector.polar = function(r, theta) {
	return new Vector(r * Math.cos(theta), r * Math.sin(theta));
};

Vector.prototype.length = function() {
	return Math.sqrt(this.x * this.x + this.y * this.y);
};


Vector.prototype.copy = function(){
	return new Vector(this.x, this.y);
};


Vector.prototype.setLength = function(length) {
	var current = this.length();

	if (current) {
		var scale = length / current;
		this.x *= scale;
		this.y *= scale;
	}

	return this;
};


Vector.prototype.setAngle = function(theta) {
	var r = length();

	this.x = r * Math.cos(theta);
	this.y = r * Math.sin(theta);

	return this;
};

Vector.prototype.getAngle = function() {
	return Math.atan2(this.y, this.x);
};


Vector.prototype.d = function(v) {
	var dx = v.x - this.x;
	var dy = v.y - this.y;

	return Math.sqrt(dx * dx + dy * dy);
};/**
* Identity projection.
*/
var IDProjection = {
	project: function(x, y, opt_v) {
		var v = opt_v || new Vector();
		v.x = x;
		v.y = y;
		return v;
	},
	invert: function(x, y, opt_v) {
		var v = opt_v || new Vector();
		v.x = x;
		v.y = y;
		return v;
	}
};


// 原版@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@2
var Albers = function() {
	function radians(degrees) {
		return Math.PI * degrees / 180;
	}

    // 中央子午线＝当地经度的整数÷6，然后整数部分＋1，再将所得结果×6后减去3
    //西安108.5, 34.2
    //（108/6）=18, 18+1=19, 19×6=114, 114-3=111
    // 原始设置，美国中心
	// var phi0 = radians(38);
	// var phi1 = radians(29.5);
	// var phi2 = radians(45.5);
	// var lambda0 = radians(-98);

    // 根据作者设计，推测设置
	var phi0 = radians(28.5);
	var phi1 = radians(11.5);
	var phi2 = radians(45.5);
	var lambda0 = radians(105);

    // 原始数据经纬度范围
    // x0: 60.0, //最小经度
    // y0: -10.0, //最小纬度
    // x1: 150.0, //最大经度
    // y1: 70.0, //最大纬度

    // 中国投影经验设置
	// var phi0 = radians(0);
	// var phi1 = radians(27);
	// var phi2 = radians(45);
	// var lambda0 = radians(105);

	var n = .5 * (phi1 + phi2);
	var C = Math.cos(phi1) * Math.cos(phi1) + 2 * n * Math.sin(phi1);


	var rho0 = Math.sqrt(C - 2 * n * Math.sin(phi0)) / n;

	return {
		project: function(lon, lat, opt_result) {
			lon = radians(lon);
			lat = radians(lat);
			var theta = n * (lon - lambda0);
			var rho = Math.sqrt(C - 2 * n * Math.sin(lat)) / n;
			var x = rho * Math.sin(theta);
			var y = rho0 - rho * Math.cos(theta);
			if (opt_result) {
				opt_result.x = x;
				opt_result.y = y;
				return opt_result;
			}
			return new Vector(x, y);
		},
		invert: function(x, y) {
			var rho2 = x * x + (rho0 - y) * (rho0 - y);
			var theta = Math.atan(x / (rho0 - y));
			var lon = lambda0 + theta / n;
			var lat = Math.asin((C / n - rho2 * n) / 2);
			return new Vector(lon * 180 / Math.PI, lat * 180 / Math.PI);
		}
	};
}();


var ScaledAlbers = function(scale, offsetX, offsetY, longMin, latMin) {
	this.scale = scale;
	this.offsetX = offsetX;
	this.offsetY = offsetY;
	this.longMin = longMin;
	this.latMin = latMin;
	this.swCorner = Albers.project(longMin, latMin);
};

ScaledAlbers.temp = new Vector(0, 0);

ScaledAlbers.prototype.project = function(lon, lat, opt_result) {
	var proj = Albers.project(lon, lat, ScaledAlbers.temp);
	var a = proj.x;
	var b = proj.y;
	var x = this.scale * (a - this.swCorner.x) + this.offsetX;
	var y = -this.scale * (b - this.swCorner.y) + this.offsetY;
	if (opt_result) {
		opt_result.x = x;
		opt_result.y = y;
		return opt_result;
	}
	return new Vector(x, y);
};

ScaledAlbers.prototype.invert = function(x, y) {
	var a = (x - this.offsetX) / this.scale + this.swCorner.x;
	var b = (y - this.offsetY) / -this.scale + this.swCorner.y;
	return Albers.invert(a, b);
};

/**
* Represents a vector field based on an array of data,
* with specified grid coordinates, using bilinear interpolation
* for values that don't lie on grid points.
*/

/**
*
* @param field 2D array of Vectors
*
* next params are corners of region.
* @param x0
* @param y0
* @param x1
* @param y1
*/
var VectorField = function(field, x0, y0, x1, y1) {
	this.x0 = x0;
	this.x1 = x1;
	this.y0 = y0;
	this.y1 = y1;
	this.field = field;
	this.w = field.length;
	this.h = field[0].length;
	this.maxLength = 0;
	var mx = 0;
	var my = 0;
	for (var i = 0; i < this.w; i++) {
		for (var j = 0; j < this.h; j++) {
			if (field[i][j].length() > this.maxLength) {
				mx = i;
				my = j;
			}
			this.maxLength = Math.max(this.maxLength, field[i][j].length());
		}
	}
	mx = (mx / this.w) * (x1 - x0) + x0;
	my = (my / this.h) * (y1 - y0) + y0;
};

/**
* Reads data from raw object in form:
* {
*   x0: -126.292942,
*   y0: 23.525552,
*   x1: -66.922962,
*   y1: 49.397231,
*   gridWidth: 501.0,
*   gridHeight: 219.0,
*   field: [
*     0,0,
*     0,0,
*     ... (list of vectors)
*   ]
* }
*
* If the correctForSphere flag is set, we correct for the
* distortions introduced by an equirectangular projection.
*/
// 读取风力数据
VectorField.read = function(data, correctForSphere) {
	console.log('raw data: ')
	console.log(data)
	var field = [];
	var w = data.gridWidth;
	var h = data.gridHeight;
	var n = 2 * w * h;
	var i = 0;
	// OK, "total" and "weight"
	// are kludges that you should totally ignore,
	// unless you are interested in the average
	// vector length on vector field over lat/lon domain.
	var total = 0;
	var weight = 0;
	for (var x = 0; x < w; x++) {
		field[x] = [];
		for (var y = 0; y < h; y++) {
			var vx = data.field[i++];
			var vy = data.field[i++];
			var v = new Vector(vx, vy);
			// Uncomment to test a constant field:
			// v = new Vector(10, 0);
			if (correctForSphere) {
				var ux = x / (w - 1);
				var uy = y / (h - 1);
				var lon = data.x0 * (1 - ux) + data.x1 * ux;
				var lat = data.y0 * (1 - uy) + data.y1 * uy;
				var m = Math.PI * lat / 180;
				var length = v.length();
				if (length) {
					total += length * m;
					weight += m;
				}
				v.x /= Math.cos(m);
				v.setLength(length);
			}
			field[x][y] = v;
		}
	}
	var result = new VectorField(field, data.x0, data.y0, data.x1, data.y1);
	//window.console.log('total = ' + total);
	//window.console.log('weight = ' + weight);
	if (total && weight) {
		result.averageLength = total / weight;
	}
	console.log('read data result: ')
	console.log(result)
	return result;
};


VectorField.prototype.inBounds = function(x, y) {
	return x >= this.x0 && x < this.x1 && y >= this.y0 && y < this.y1;
};


VectorField.prototype.bilinear = function(coord, a, b) {
	var na = Math.floor(a);
	var nb = Math.floor(b);
	var ma = Math.ceil(a);
	var mb = Math.ceil(b);
	var fa = a - na;
	var fb = b - nb;

	return this.field[na][nb][coord] * (1 - fa) * (1 - fb) +
	this.field[ma][nb][coord] * fa * (1 - fb) +
	this.field[na][mb][coord] * (1 - fa) * fb +
	this.field[ma][mb][coord] * fa * fb;
};


VectorField.prototype.getValue = function(x, y, opt_result) {
	var a = (this.w - 1 - 1e-6) * (x - this.x0) / (this.x1 - this.x0);
	var b = (this.h - 1 - 1e-6) * (y - this.y0) / (this.y1 - this.y0);
	var vx = this.bilinear('x', a, b);
	var vy = this.bilinear('y', a, b);
	if (opt_result) {
		opt_result.x = vx;
		opt_result.y = vy;
		return opt_result;
	}
	return new Vector(vx, vy);
};


VectorField.prototype.vectValue = function(vector) {
	return this.getValue(vector.x, vector.y);
};


VectorField.constant = function(dx, dy, x0, y0, x1, y1) {
	var field = new VectorField([[]], x0, y0, x1, y1);
	field.maxLength = Math.sqrt(dx * dx + dy * dy);
	field.getValue = function() {
		return new Vector(dx, dy);
	}
	return field;
}

// start 读取中国数据函数 ########################################
// 提取原始气象文档每列数据
function convertRowToNumber(rawRowData) {
    var paraNum = rawRowData.split(' ')
    var paraNumFiltered = paraNum.filter(function(d) {
        return d != ''
    })
    var paraNumFilteredNumberd = paraNumFiltered.map(function(d) {
        return +d
    })

    return paraNumFilteredNumberd
}

// 添加地理头文件信息
function patchGeoHeadData() {
    var head = {
        timestamp: "10:35 am on June 14, 2016",
        x0: 60.0, //最小经度
        y0: -10.0, //最小纬度
        x1: 150.0, //最大经度
        y1: 70.0, //最大纬度
        gridWidth: 91, //经度跨度，用于确定网格划分
        gridHeight: 81
    }

    return head
}

// 转换数据
function convertCNDataToUSStd(data, geoHeadData, correctForSphere) {
    var fieldTransported = []
	var w = geoHeadData.gridWidth
	var h = geoHeadData.gridHeight
	var n = 2 * w * h
	var i = 0

    var total = 0
    var weight = 0

    var numCount = 0 //数据数组计数器
    // console.log()
    for (var y = 0; y < h; y++) {
        fieldTransported[y] = []
        for (var x = 0; x < w; x++) {
            // console.log(data[y * x])
            var singleData = data[numCount] //获取单个原始数据
            numCount++ //计数器增加

            var windAngle = singleData[2] //风角度
            var windSpeed = singleData[3] //风力速度
            var vx = windSpeed * Math.cos(windAngle/180)
            var vy = windSpeed * Math.sin(windAngle/180)

            var v = new Vector(vx, vy)
            //球面数据转为平面数据
            if (correctForSphere) {
                var lon = singleData[0]
                var lat = singleData[0]

				var m = Math.PI * lat / 180;
				var length = v.length();
				if (length) {
					total += length * m;
					weight += m;
				}
				v.x /= Math.cos(m);
				v.setLength(length);
			}
            fieldTransported[y][x] = v
        }
    }
	//需要转置矩阵
	var field=[];

	for (var i=0; i<fieldTransported[0].length; i++){
	    field[i]=[];
	}

	for (var i=0; i<fieldTransported.length; i++){
	    for (var j=0; j<fieldTransported[i].length; j++ ){
	        field[j][i]=fieldTransported[i][j];
	    }
	}

    var result = new VectorField(field, geoHeadData.x0, geoHeadData.y0, geoHeadData.x1, geoHeadData.y1);

	if (total && weight) {
		result.averageLength = total / weight;
	}

	return result;
}

//
function filterChinaLandData(data) {
	// 最东端 东经135度2分30秒 黑龙江和乌苏里江交汇处
	// 最西端 东经73度40分 帕米尔高原乌兹别里山口（乌恰县）
	// 最南端 北纬3度52分 南沙群岛曾母暗沙
	// 最北端 北纬53度33分 漠河以北黑龙江主航道（漠河县）2日本朝鲜韩国
	var filteredChinaLandData = data.filter(function(d) {
		return !(d[0] > 136 || d[0] < 73 || d[1] > 54 || d[1] < 3)
	})

	return filteredChinaLandData
}

//在中国领域之外略多数据，确保vao投影完整
function filterMoreChinaLandData(data) {
	// 最东端 东经135度2分30秒 黑龙江和乌苏里江交汇处
	// 最西端 东经73度40分 帕米尔高原乌兹别里山口（乌恰县）
	// 最南端 北纬3度52分 南沙群岛曾母暗沙
	// 最北端 北纬53度33分 漠河以北黑龙江主航道（漠河县）2日本朝鲜韩国
	var filteredChinaLandData = data.filter(function(d) {
		return !(d[0] > 140 || d[0] < 65 || d[1] > 60 || d[1] < 0)
	})

	return filteredChinaLandData
}
// end 读取中国数据函数 ########################################

// 渲染风力不同颜色
function windIntensityColorScale(maxWind) {
        var result = ["#d73027","#f46d43","#fdae61","#fee090","#ffffbf","#e0f3f8","#abd9e9","#74add1", '#5ca4d2',"#4575b4"]
        result.indexFor = function(m) {  // map wind speed to a style
            return Math.floor(Math.min(m, maxWind) / maxWind * (result.length - 1));
        }
        return result;
}

//根据生成粒子的位置，计算该位置粒子的风俗（太慢影响性能）
function setParticleColor(px, py, globalDataArray, globalDataRecorder) {
	console.log(py)
	console.log(globalDataArray[0][3])
	var particlePositionInArray = (globalDataRecorder.maxLon - globalDataRecorder.minLon + 1) * py + px
	var windSpeed = globalDataArray[particlePositionInArray][3]
	var colorGrade = ["#d73027","#f46d43","#fdae61","#fee090","#ffffbf","#e0f3f8","#abd9e9","#74add1", '#5ca4d2',"#4575b4"]
	// var speedField = globalDataRecorder.maxSpeed - globalDataRecorder.minSpeed
	var speedIndex= (windSpeed / globalDataRecorder.maxSpeed).toFixed(1)
	var particleColor = colorGrade[speedIndex]
	return particleColor
}

// 预先计算好着色表
function makeColorTable(globalDataArray, globalDataRecorder) {
	// console.log(globalDataArray.length)
	// console.log(globalDataRecorder)
	var colorGrade = ["#d73027","#f46d43","#fdae61","#fee090","#ffffbf","#e0f3f8","#abd9e9","#74add1", '#5ca4d2',"#4575b4"]
	var colorTable = []
	var mapWidth = globalDataRecorder.maxLon - globalDataRecorder.minLon + 1
	var mapHeight = globalDataRecorder.maxLat - globalDataRecorder.minLat + 1
	var totalNum = mapWidth * mapHeight
	// console.log(totalNum)
	for (var i = 0; i < mapWidth; i++) {
		for (var j = 0; j < mapHeight; j++) {
			var currentPostion = i * mapWidth + j
			// console.log(currentPostion)
			// if (currentPostion < 0) {
			// 	currentPostion = 0
			// } else if (currentPostion > (totalNum - 1)) {
			// 	currentPostion = (totalNum - 1)
			// }
			if (currentPostion > (totalNum - 1)) {
				currentPostion = (totalNum - 1)
			}
			var wind = globalDataArray[currentPostion]
			// console.log(wind)
			var windSpeed = wind[3]
			var speedIndex= (windSpeed / globalDataRecorder.maxSpeed).toFixed(1) * 10
			// console.log(windSpeed)
			// console.log(speedIndex)
			var particleColor = colorGrade[speedIndex]
			colorTable[currentPostion] = particleColor
		}
	}

	return colorTable
}

function makeColorMatrix(dataMatrix, globalDataRecorder) {
	var colorGrade = ["#d73027","#f46d43","#fdae61","#fee090","#ffffbf","#e0f3f8","#abd9e9","#74add1", '#5ca4d2',"#4575b4"]
	var colorMatrix = []
	var matrixLength = dataMatrix.length
	var matrixRowLength = dataMatrix[0].length
	for (var i = 0; i < matrixLength; i++) {
		colorMatrix[i] = []
		for (var j = 0; j < matrixRowLength; j++) {
			var vx = dataMatrix[i][j].x
			var vy = dataMatrix[i][j].y
			var windSpeed = Math.sqrt(vx * vx + vy * vy)
			// console.log(windSpeed)
			var speedIndex= (windSpeed / globalDataRecorder.maxSpeed).toFixed(1) * 10
			var particleColor = colorGrade[speedIndex]
			colorMatrix[i][j] = particleColor
		}
	}
	return colorMatrix
}
/**
* Listens to mouse events on an element, tracks zooming and panning,
* informs other components of what's going on.
*/
var Animator = function(element, opt_animFunc, opt_unzoomButton) {
	this.element = element;
	this.mouseIsDown = false;
	this.mouseX = -1;
	this.mouseY = -1;
	this.animating = true;
	this.state = 'animate';
	this.listeners = [];
	this.dx = 0;
	this.dy = 0;
	this.scale = 1;
	this.zoomProgress = 0;
	this.scaleTarget = 1;
	this.scaleStart = 1;
	this.animFunc = opt_animFunc;
	this.unzoomButton = opt_unzoomButton;

	if (element) {
		var self = this;
		$(element).mousedown(function(e){
			self.mouseX = e.pageX - this.offsetLeft;
			self.mouseY = e.pageY - this.offsetTop;
			self.mousedown();
		});
		$(element).mouseup(function(e){
			self.mouseX = e.pageX - this.offsetLeft;
			self.mouseY = e.pageY - this.offsetTop;
			self.mouseup();
		});
		$(element).mousemove(function(e){
			self.mouseX = e.pageX - this.offsetLeft;
			self.mouseY = e.pageY - this.offsetTop;
			self.mousemove();
		});
	}
};


Animator.prototype.mousedown = function() {
	this.state = 'mouse-down';
	this.notify('startMove');
	this.landingX = this.mouseX;
	this.landingY = this.mouseY;
	this.dxStart = this.dx;
	this.dyStart = this.dy;
	this.scaleStart = this.scale;
	this.mouseIsDown = true;
};


Animator.prototype.mousemove = function() {
	if (!this.mouseIsDown) {
		this.notify('hover');
		return;
	}
	var ddx = this.mouseX - this.landingX;
	var ddy = this.mouseY - this.landingY;
	var slip = Math.abs(ddx) + Math.abs(ddy);
	if (slip > 2 || this.state == 'pan') {
		this.state = 'pan';
		this.dx += ddx;
		this.dy += ddy;
		this.landingX = this.mouseX;
		this.landingY = this.mouseY;
		this.notify('move');
	}
}

Animator.prototype.mouseup = function() {
	this.mouseIsDown = false;
	if (this.state == 'pan') {
		this.state = 'animate';
		this.notify('endMove');
		return;
	}
	this.zoomClick(this.mouseX, this.mouseY);
};


Animator.prototype.add = function(listener) {
	this.listeners.push(listener);
};


Animator.prototype.notify = function(message) {
	if (this.unzoomButton) {
		var diff = Math.abs(this.scale - 1) > .001 ||
		Math.abs(this.dx) > .001 || Math.abs(this.dy > .001);
		this.unzoomButton.style.visibility = diff ? 'visible' : 'hidden';
	}
	if (this.animFunc && !this.animFunc()) {
		return;
	}
	for (var i = 0; i < this.listeners.length; i++) {
		var listener = this.listeners[i];
		if (listener[message]) {
			listener[message].call(listener, this);
		}
	}
};


Animator.prototype.unzoom = function() {
	this.zoom(0, 0, 1);
};


Animator.prototype.zoomClick = function(x, y) {
	var z = 1.7;
	var scale = 1.7 * this.scale;
	var dx = x - z * (x - this.dx);
	var dy = y - z * (y - this.dy);
	this.zoom(dx, dy, scale);
};

Animator.prototype.zoom = function(dx, dy, scale) {
	this.state = 'zoom';
	this.zoomProgress = 0;
	this.scaleStart = this.scale;
	this.scaleTarget = scale;
	this.dxTarget = dx;
	this.dyTarget = dy;
	this.dxStart = this.dx;
	this.dyStart = this.dy;
	this.notify('startMove');
};

Animator.prototype.relativeZoom = function() {
	return this.scale / this.scaleStart;
};


Animator.prototype.relativeDx = function() {
	return this.dx - this.dxStart;
}

Animator.prototype.relativeDy = function() {
	return this.dy - this.dyStart;
}

Animator.prototype.start = function(opt_millis) {
	var millis = opt_millis || 20;
	var self = this;
	function go() {
	var start = new Date();
	self.loop();
	var time = new Date() - start;
	setTimeout(go, Math.max(10, millis - time));
	}
	go();
};


Animator.prototype.loop = function() {
	if (this.state == 'mouse-down' || this.state == 'pan') {
		return;
	}
	if (this.state == 'animate') {
		this.notify('animate');
		return;
	}
	if (this.state == 'zoom') {
		this.zoomProgress = Math.min(1, this.zoomProgress + .07);
		var u = (1 + Math.cos(Math.PI * this.zoomProgress)) / 2;
		function lerp(a, b) {
			return u * a + (1 - u) * b;
		}
		this.scale = lerp(this.scaleStart, this.scaleTarget);
		this.dx = lerp(this.dxStart, this.dxTarget);
		this.dy = lerp(this.dyStart, this.dyTarget);
		if (this.zoomProgress < 1) {
			this.notify('move');
		} else {
			this.state = 'animate';
			this.zoomCurrent = this.zoomTarget;
			this.notify('endMove');
		}
	}
};

/**
* Displays a geographic vector field using moving particles.
* Positions in the field are drawn onscreen using the Alber
* "Projection" file.
*/

var Particle = function(x, y, age) {
	this.x = x;
	this.y = y;
	this.oldX = -1;
	this.oldY = -1;
	this.age = age;
	this.rnd = Math.random();
}


/**
* @param {HTMLCanvasElement} canvas
* @param {number} scale The scale factor for the projection.
* @param {number} offsetX
* @param {number} offsetY
* @param {number} longMin
* @param {number} latMin
* @param {VectorField} field
* @param {number} numParticles
*/
var MotionDisplay = function(canvas, imageCanvas, field, numParticles, opt_projection) {
	this.canvas = canvas;
	this.projection = opt_projection || IDProjection;
	this.field = field;
	this.numParticles = numParticles;
	this.first = true;
	this.maxLength = field.maxLength;
	this.speedScale = 1;
	this.renderState = 'normal';
	this.imageCanvas = imageCanvas;
	this.x0 = this.field.x0;
	this.x1 = this.field.x1;
	this.y0 = this.field.y0;
	this.y1 = this.field.y1;
	this.makeNewParticles(null, true);
	this.colors = [];
	this.rgb = '40, 40, 40';
	this.background = 'rgb(' + this.rgb + ')';
	this.backgroundAlpha = 'rgba(' + this.rgb + ', .02)';
	this.outsideColor = '#fff';
	// this.outsideColor = '#000';
	for (var i = 0; i < 256; i++) {
		this.colors[i] = 'rgb(' + i + ',' + i + ',' + i + ')';
	}
	if (this.projection) {
		this.startOffsetX = this.projection.offsetX;
		this.startOffsetY = this.projection.offsetY;
		this.startScale = this.projection.scale;
	}
};


MotionDisplay.prototype.setAlpha = function(alpha) {
	this.backgroundAlpha = 'rgba(' + this.rgb + ', ' + alpha + ')';
};

MotionDisplay.prototype.makeNewParticles = function(animator) {
	this.particles = [];
	for (var i = 0; i < this.numParticles; i++) {
		this.particles.push(this.makeParticle(animator));
	}
};


MotionDisplay.prototype.makeParticle = function(animator) {
	var dx = animator ? animator.dx : 0;
	var dy = animator ? animator.dy : 0;
	var scale = animator ? animator.scale : 1;
	var safecount = 0;
	for (;;) {
		var a = Math.random();
		var b = Math.random();
		var x = a * this.x0 + (1 - a) * this.x1;
		var y = b * this.y0 + (1 - b) * this.y1;
		var v = this.field.getValue(x, y);
		if (this.field.maxLength == 0) {
		return new Particle(x, y, 1 + 40 * Math.random());
		}
		var m = v.length() / this.field.maxLength;
		// The random factor here is designed to ensure that
		// more particles are placed in slower areas; this makes the
		// overall distribution appear more even.
		if ((v.x || v.y) && (++safecount > 10 || Math.random() > m * .9)) {
			var proj = this.projection.project(x, y);
			var sx = proj.x * scale + dx;
			var sy = proj.y * scale + dy;
			if (++safecount > 10 || !(sx < 0 || sy < 0 || sx > this.canvas.width || sy > this.canvas.height)) {
				return new Particle(x, y, 1 + 40 * Math.random());
			}
		}
	}
};


MotionDisplay.prototype.startMove = function(animator) {
	// Save screen.
	this.imageCanvas.getContext('2d').drawImage(this.canvas, 0, 0);
};


MotionDisplay.prototype.endMove  = function(animator) {
	if (animator.scale < 1.1) {
		this.x0 = this.field.x0;
		this.x1 = this.field.x1;
		this.y0 = this.field.y0;
		this.y1 = this.field.y1;
	} else {
	// get new bounds for making new particles.
		var p = this.projection;
		var self = this;
		function invert(x, y) {
			x = (x - animator.dx) / animator.scale;
			y = (y - animator.dy) / animator.scale;
			return self.projection.invert(x, y);
		}
		var loc = invert(0, 0);
		var x0 = loc.x;
		var x1 = loc.x;
		var y0 = loc.y;
		var y1 = loc.y;
		function expand(x, y) {
			var v = invert(x, y);
			x0 = Math.min(v.x, x0);
			x1 = Math.max(v.x, x1);
			y0 = Math.min(v.y, y0);
			y1 = Math.max(v.y, y1);
		}
		// This calculation with "top" is designed to fix a bug
		// where we were missing particles at the top of the
		// screen with north winds. This is a short-term fix,
		// it's dependent on the particular projection and
		// region, and we should figure out a more general
		// solution soon.
		var top = -.2 * this.canvas.height;
		expand(top, this.canvas.height);
		expand(this.canvas.width, top);
		expand(this.canvas.width, this.canvas.height);
		this.x0 = Math.max(this.field.x0, x0);
		this.x1 = Math.min(this.field.x1, x1);
		this.y0 = Math.max(this.field.y0, y0);
		this.y1 = Math.min(this.field.y1, y1);
	}
	// tick = 0;
	this.makeNewParticles(animator);
};


MotionDisplay.prototype.animate = function(animator) {
	this.moveThings(animator);
	this.draw(animator);
}


MotionDisplay.prototype.move = function(animator) {
	var w = this.canvas.width;
	var h = this.canvas.height;
	var g = this.canvas.getContext('2d');

	g.fillStyle = this.outsideColor;
	var dx = animator.dx;
	var dy = animator.dy;
	var scale = animator.scale;

	g.fillRect(0, 0, w, h);
	g.fillStyle = this.background;
	g.fillRect(dx, dy, w * scale, h * scale);
	var z = animator.relativeZoom();
	var dx = animator.dx - z * animator.dxStart;
	var dy = animator.dy - z * animator.dyStart;
	g.drawImage(this.imageCanvas, dx, dy, z * w, z * h);
};


MotionDisplay.prototype.moveThings = function(animator) {
	var speed = .01 * this.speedScale / animator.scale;
	for (var i = 0; i < this.particles.length; i++) {
		var p = this.particles[i];
		if (p.age > 0 && this.field.inBounds(p.x, p.y)) {
			var a = this.field.getValue(p.x, p.y);
			p.x += speed * a.x;
			p.y += speed * a.y;
			p.age--;
		} else {
			this.particles[i] = this.makeParticle(animator);
		}
	}
};


MotionDisplay.prototype.draw = function(animator) {
	var g = this.canvas.getContext('2d');
	var w = this.canvas.width;
	var h = this.canvas.height;
	if (this.first) {
		g.fillStyle =  this.background;
		this.first = false;
	} else {
		g.fillStyle = this.backgroundAlpha;
	}
	var dx = animator.dx;
	var dy = animator.dy;
	var scale = animator.scale;
	// console.log('animator: ')
	// console.log(scale)

	g.fillRect(dx, dy, w * scale,h * scale);
	var proj = new Vector(0, 0);
	var val = new Vector(0, 0);
	// g.lineWidth = .75;
	g.lineWidth = .5;
	for (var i = 0; i < this.particles.length; i++) {
		var p = this.particles[i];
		// console.log(p.x)
		if (!this.field.inBounds(p.x, p.y)) {
			p.age = -2;
			continue;
		}
		this.projection.project(p.x, p.y, proj);
		proj.x = proj.x * scale + dx;
		proj.y = proj.y * scale + dy;
		// console.log(proj.x)
		// console.log(proj.y)
		if (proj.x < 0 || proj.y < 0 || proj.x > w || proj.y > h) {
			// console.log('out bound in draw function')
			p.age = -2;
		}
		if (p.oldX != -1) {
			var wind = this.field.getValue(p.x, p.y, val);
			var s = wind.length() / this.maxLength;
			var c = 90 + Math.round(350 * s); // was 400
			if (c > 255) {
				c = 255;
			}
			// g.strokeStyle = this.colors[c];
			// var xPostion = p.x - globalDataRecorder.minLon + 1
			// var yPostion = p.y - globalDataRecorder.minLat + 1
			// var colorPosition = Math.floor(xPostion * yPostion) - 1
			// g.strokeStyle = setParticleColor(p.x, p.y, globalDataArray, globalDataRecorder)
			// g.strokeStyle = colorTable[colorPosition]
			var xPostion = Math.floor(p.x - globalDataRecorder.minLon)
			var yPostion = Math.floor(p.y - globalDataRecorder.minLat)
			g.strokeStyle = colorMatrix[xPostion][yPostion]
			g.beginPath();
			g.moveTo(proj.x, proj.y);
			g.lineTo(p.oldX, p.oldY);
			// console.log(p)
			g.stroke();
		}
		p.oldX = proj.x;
		p.oldY = proj.y;
	}
};

// please don't hate on this code too much.
// it's late and i'm tired.

var MotionDetails = function(div, callout, field, projection, animator) {
	$(callout).fadeOut();
	var moveTime = +new Date();
	var calloutOK = false;
	var currentlyShowing = false;
	var calloutX = 0;
	var calloutY = 0;
	var calloutHTML = '';
	var lastX = 0;
	var lastY = 0;

	// 利用jquery直接控制风力详情文本
	var windSpeedNum = 0
	var windLonNum = 0
	var windLatNum = 0
	var windAngleNum = 0

	function format(x) {
		x = Math.round(x * 10) / 10;
		var a1 = ~~x;
		var a2 = (~~(x * 10)) % 10;
		return a1 + '.' + a2;
	}

	function minutes(x) {
		x = Math.round(x * 60) / 60;
		var degrees = ~~x;
		var m = ~~((x - degrees) * 60);
		return degrees + '&deg;&nbsp;' + (m == 0 ? '00' : m < 10 ? '0' + m : '' + m) + "'";
		// return degrees + '.' + (m == 0 ? '00' : m < 10 ? '0' + m : '' + m) + "'";
	}

	$(div).mouseleave(function() {
		moveTime = +new Date();
		calloutOK = false;
	});

	var pos = $(div).position();

	$(div).mousemove(function(e) {

		// TODO: REMOVE MAGIC CONSTANTS
		var x = e.pageX - this.offsetLeft - 60;
		var y = e.pageY - this.offsetTop - 10;
		if (x == lastX && y == lastY) {
			return;
		}
		lastX = x;
		lastY = y;
		moveTime = +new Date();
		var scale = animator.scale;
		var dx = animator.dx;
		var dy = animator.dy;
		var mx = (x - dx) / scale;
		var my = (y - dy) / scale;
		var location = projection.invert(mx, my);
		var lat = location.y;
		var lon = location.x;
		var speed = 0;
		if (field.inBounds(lon, lat)) {
			speed = field.getValue(lon, lat).length() / 1.15;
		}
		calloutOK = !!speed;

		// var windDirection = Math.atan(dy/dx) //NaN
		// console.log(dx) //0
		// console.log(dy) //0
		// console.log(windDirection)
		// calloutHTML = '<div style="padding-bottom:5px"><b>' +
		// '当前位置风力： ' + format(speed)  + ' mph ' + '<br>' +
		// minutes(lat + 3) + ' N, ' +
		// minutes(lon - 2) + ' E<br>' + '</div>'

		calloutHTML = '<div id="windDetailTitle">当前位置风力</div>' +
		'<div id="windDetailSpeedNumberWrapper"><span id="windDetailSpeedNumber">' + format(speed) + '</span>' + '<span id="windDetailSpeedUnit">mph</span></div>' +
		'<div id="windDetailLonLatDirectionWrapper">' + '<div id="windDetailLonWrapper"><div id="windDetailLonNum">' + minutes(lon - 2) + '</div><div id="windDetailLonTitle">经度</div></div>' +
		'<div id="windDetailLatWrapper"><div id="windDetailLatNum">' + minutes(lat + 3) + '</div><div id="windDetailLatTitle">纬度</div></div>' +
		'<div id="windDetailDirectionWrapper"><div id="windDetailDirectionNum">' + 117 + '</div><div id="windDetailLonDirectionTitle">风向</div></div>' + '</div>'
		// minutes(lat + 3) + ' N, ' +
		// minutes(lon - 2) + ' E<br>' + '</div>'

		// calloutY = (pos.top + y + 10) + 'px';
		// calloutX = (pos.left + x + 65) + 'px';

		// 利用jquery直接控制风力详情文本
		windSpeedNum = format(speed)
		windLonNum = minutes(lon - 2)
		windLatNum = minutes(lat + 3)
		windAngleNum = 117
	});

	setInterval(function() {
		var timeSinceMove = +new Date() - moveTime;
		if (timeSinceMove > 200 && calloutOK) {
			if (!currentlyShowing) {

				// callout.innerHTML = calloutHTML;
				// callout.style.left = calloutX;
				// callout.style.top = calloutY;
				// callout.style.visibility = 'visible';
				// $(callout).fadeTo(400, 1);
				// 利用jquery直接控制风力详情文本
				$('#windDetailSpeedNumber').text(windSpeedNum)
				$('#windDetailLonNum').html(windLonNum)
				$('#windDetailLatNum').html(windLatNum)
				$('#windDetailDirectionNum').html('117')

				currentlyShowing = true;
			}
		} else if (currentlyShowing) {
			// $(callout).fadeOut('fast');
			currentlyShowing = false;
		}
	}, 50);
};

/**
* The cities array contains objects with properties: city, state, lat, lon, pop.
*
* @param {Array.<Object>} cities
* @param {Object} canvas
* @param {Object} projection
*/

// 将画圈的模块独立出来@@@@@@@@@@@@@@@@@@@@@@@@
// 闪光球@@@@@@@@@@@@@@@@@@@@@@
var aqiColorScale = d3.scaleLinear()
	.domain([30, 100])
	.range([100, 0])

var spotMaxRScale = d3.scaleLinear()
	.domain([30, 100])
	.range([20, 10])

function ShineSpot(x, y, r, aqi) {
	this.xPosition = x
	this.yPosition = y
	this.radius = r
	this.aqi = aqi
	this.opacityProp = 1
	this.restR = spotMaxRScale(+this.aqi.AQI)
	// this.fillColor = 'hsla(2, 100%, 38%,' + this.opacityProp + ')'
	this.fillColor = 'hsla(' + aqiColorScale(+this.aqi.AQI) + ', 100%, 38%,' + this.opacityProp + ')'
}

ShineSpot.prototype.draw = function(context) {
	context.save()

	context.translate(this.xPosition, this.yPosition)
	context.fillStyle = this.fillColor

	context.beginPath()
	context.arc(0, 0, this.radius, 0, (Math.PI * 2), true)
	context.closePath()
	context.fill()

	context.restore()
}

ShineSpot.prototype.changeFillStyle = function() {
	this.opacityProp *= 0.95
	// this.fillColor = 'hsla(100, 75%, 50%,' + this.opacityProp + ')'
	this.fillColor = 'hsla(' + aqiColorScale(+this.aqi.AQI) + ', 100%, 38%,' + this.opacityProp + ')'
}

ShineSpot.prototype.reset = function() {
	this.radius = 5
	this.opacityProp = 1
}

// ShineSpot.prototype.checkStatusPerFrame = function() {
// 	this.radius ++
// 	this.opacityProp *= 0.9
//
// 	if(this.radius > 30) {
// 		this.reset()
// 	}
// }


function drawShineSpots() {
	var canvas = document.getElementById('shineSpot-canvas')
	var context = canvas.getContext('2d')

	var spotsGroup = []

	// console.log(shineSpotPosition)
	// shineSpotPosition
	// cities
	for (var i = 0; i < shineSpotPosition.length; i++) {
		// if (shineSpotPosition[i].hasOwnProperty('x') && shineSpotPosition[i].hasOwnProperty('y')) {
		// 	spotsGroup[i] = new ShineSpot(shineSpotPosition[i].x, shineSpotPosition[i].y, 5)
		// } else {
		// 	spotsGroup[i] = 'outScreen'
		// }
		try {
			spotsGroup[i] = new ShineSpot(shineSpotPosition[i].x, shineSpotPosition[i].y, 5, shineSpotPosition[i].aqi)
		} catch (e) {
			console.log(e)
			continue
		} finally {

		}
		// spotsGroup[i] = new ShineSpot(shineSpotPosition[i].x, shineSpotPosition[i].y, 5)
	}

	// var spot = new ShineSpot(100, 200, 5)
	// spot.draw(context)
	runAnimation()

	function runAnimation() {
		window.requestAnimationFrame(runAnimation, canvas)
		context.clearRect(0, 0, 700, 700)

		// for (var i = 0; i < spotsGroup.length; i++) {
		// 	if
		// }

		spotsGroup.forEach((spot, i) => {
			// spot.xPostion = shineSpotPosition[i].x
			// spot.yPostion = shineSpotPosition[i].y
			spot.radius += 0.25
			spot.changeFillStyle()

			spot.draw(context)

			// if(spot.radius > 10) {
			// 	spot.reset()
			// }

			if(spot.radius > spot.restR) {
				spot.reset()
			}

			// if (spot != 'outScreen') {
			//
			// }
		})

		// spot.radius += 0.5
		// spot.changeFillStyle()
		//
		// spot.draw(context)
		//
		// if(spot.radius > 30) {
		// 	spot.reset()
		// }
	}
}
// 隐形的触碰点@@@@@@@@@@@@@@@@@@@@@@@@@
function Ball(radius, city, aqi) {
    this.x = 0
    this.y = 0
    this.radius = radius
    // this.pop = pop
	this.city = city
	this.aqi = aqi
	this.boundRect = ''
}

Ball.prototype.draw = function(context) {
    context.save()
    context.translate(this.x, this.y)

    context.lineWidth = 1
    // context.fillStyle = '#f00'
	context.fillStyle = 'hsla(60, 100%, 50%, 0.01)'

    context.beginPath()
    context.arc(0, 0, this.radius, 0, (Math.PI * 2), true)
    context.closePath()
    context.fill()
    // context.stroke()

    context.restore()
}

Ball.prototype.getBounds = function() {
    return {
        x: this.x - this.radius,
        y: this.y - this.radius,
        width: this.radius * 2,
        height: this.radius * 2
    }
}

Ball.prototype.checkMouseHit = function(canvas, mouse) {
    var ballBounds = this.getBounds()
    var thisBall = this

	// console.log('mouse pressed')

    canvas.addEventListener('mousedown', function() {
		// console.log('mouse moving from Ball.prototype.checkMouseHit')
		// console.log(thisBall)
        if (containsPoint(ballBounds, (mouse.x-100), (mouse.y-50))) {
            console.log(thisBall.city)
			// 触发widget模块donut更新@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
			console.log(ShareState.updateWidgetDonutChart)
			EventBridge.listen('updateDonut', ShareState.updateWidgetDonutChart)
			EventBridge.trigger('updateDonut', thisBall.aqi)

			// var pm25 =
			$("#polutionGradePm25").fadeOut(function() {
				$(this).text(thisBall.aqi['PM2.5']).fadeIn();
			})
			$("#polutionGradeSO2").fadeOut(function() {
				$(this).text(thisBall.aqi['SO2']).fadeIn();
			})
			$("#polutionGradeNO2").fadeOut(function() {
				$(this).text(thisBall.aqi['NO2']).fadeIn();
			})
			// $('#polutionGradePm25').text(thisBall.aqi['PM2.5'])
			// $('#polutionGradeSO2').text(thisBall.aqi['SO2'])
			// $('#polutionGradeNO2').text(thisBall.aqi['NO2'])
			$('.label-city-name').text(thisBall.city)
			// console.log('mouse hit city')
        }
    })

	canvas.addEventListener('mousemove', function() {
		// console.log('mouse moving from Ball.prototype.checkMouseHit')
		// console.log(thisBall)
        if (containsPoint(ballBounds, (mouse.x-100), (mouse.y-50))) {
            console.log(thisBall.city)

			// 触发widget模块donut更新@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
			// console.log(ShareState.updateWidgetDonutChart)
			EventBridge.listen('updateDonut', ShareState.updateWidgetDonutChart)
			EventBridge.trigger('updateDonut', thisBall.aqi)

			// var pm25 =
			$("#polutionGradePm25").fadeOut(function() {
				$(this).text(thisBall.aqi['PM2.5']).fadeIn();
			})
			$("#polutionGradeSO2").fadeOut(function() {
				$(this).text(thisBall.aqi['SO2']).fadeIn();
			})
			$("#polutionGradeNO2").fadeOut(function() {
				$(this).text(thisBall.aqi['NO2']).fadeIn();
			})
			// $('#polutionGradePm25').text(thisBall.aqi['PM2.5'])
			// $('#polutionGradeSO2').text(thisBall.aqi['SO2'])
			// $('#polutionGradeNO2').text(thisBall.aqi['NO2'])
			$('.label-city-name').text(thisBall.city)
			// console.log('mouse hit city')
        }
    })
}

Ball.prototype.checkBounds = function() {
    this.boundRect = this.getBounds()
}

var CityDisplay = function(cities, canvas, projection) {
	this.cities = cities;
	this.canvas = canvas;
	this.projection = projection;
	this.maxInView = 10;
	this.pad = 3;
	// 存放闪光圆点
	this.shineSpotGroup = []
	// 存放绘制好的城市圆圈引用
	this.cityCircleGroup = []
	// 存放城市节点的边界区域
	this.cityCircleBoundsGroup = []

	cities.sort(function(a, b) {
		return b.pop - a.pop;
	});
	for (var i = 0; i < this.cities.length; i++) {
		this.cities[i].alpha = 0;
	}
};

// 为每个城市节点添加鼠标点击侦听
// CityDisplay.prototype.checkMouseHit = function(canvas) {
// 	var thisBall = this
//
//     canvas.addEventListener('mousedown', function() {
//         if (containsPoint(ballBounds, mouse.x, mouse.y)) {
//             // console.log('hit the egg')
//             // console.log(this)
//             console.log(thisBall.pop)
//         }
//     })
// }

CityDisplay.prototype.endMove = function(animator) {
	for (var i = 0; i < this.cities.length; i++) {
		this.cities[i].alpha = 0;
	}
	this.move(animator);

	this.mouseHitDetect()

	// // console.log('move end from CityDisplay.prototype.endMove')
	// var thisCity = this
	// this.cityCircleBoundsGroup = [] //清空上一次缩放更新的节点位置
	// // 缩放地图结束之后，计算城市点的新位置边界@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
	// this.cityCircleGroup.forEach(ball => {
	// 	ball.checkBounds()
	// 	ball.boundRect.id = ball.pop
	// 	// console.log(ball.boundRect)
	// 	thisCity.cityCircleBoundsGroup.push(ball.boundRect)
	// })
	// // console.log(this.cityCircleBoundsGroup)
	//
	// var currentCanvas = this.canvas
	// var mouse = captureMouse(currentCanvas) //捕获鼠标坐标范围

	// currentCanvas.addEventListener('mousedown', function() {
	// 	// console.log('mousedown from CityDisplay.prototype.endMove')
	// 	// console.log(mouse)
	// 	thisCity.cityCircleBoundsGroup.forEach(rect => {
	// 		console.log(rect)
	// 		// console.log(mouse)
	// 		console.log(mouse.x - 100)
	// 		console.log(mouse.y - 50)
	// 		if (containsPoint(rect, (mouse.x - 100), (mouse.y - 50))) {
	//             console.log(rect.id)
	//         }
	// 	})
	// })
}

CityDisplay.prototype.markCities = function(scale, dx, dy, alpha) {
	var spaceTaken = [];
	function collide(r1, r2) {
		return !(r1.x + r1.w < r2.x || r1.x > r2.x + r2.w ||
		r1.y + r1.h < r2.y || r1.y > r2.y + r2.h);
	}
	function isFree(r) {
	for (var i = 0; i < spaceTaken.length; i++) {
		if (collide(r, spaceTaken[i])) {
			return false;
		}
	}
	return true;
	}
	var g = this.canvas.getContext('2d');
	var w = this.canvas.width;
	var h = this.canvas.height;
	var numInView = 0;
	var pad = this.pad;
	for (var i = 0; i < this.cities.length; i++) {
		var city = this.cities[i];
		var r = .075 * Math.pow(city.pop, .3);
		var v = this.projection.project(city.lon, city.lat);
		var x = v.x * scale + dx;
		var y = v.y * scale + dy;
		if (x < 0 || x > w || y < 0 || y > h) {
			continue;
		}
		var tx = x;
		var ty = y + 15;
		var textSize = g.measureText(city.city);
		// check for collisions with previously drawn stuff.
		var dotArea = {
			'x': x - r - pad,
			'y': y - r - pad,
			'w': 2 * (r + pad),
			'h': 2 * (r + pad)
		};
		var textArea = {
			'x': tx - textSize.width / 2 - pad,
			'y': ty - 15 - pad,
			'w': textSize.width + 2 * pad,
			'h': 15 + 2 * pad
		};
		if (!isFree(dotArea) || !isFree(textArea)) {
			continue;
		}
		spaceTaken.push(textArea);
		spaceTaken.push(dotArea);
		city.alpha += alpha;
		if (++numInView > this.maxInView) {
			break;
		}
	}

};

CityDisplay.prototype.mouseHitDetect = function() {
	// console.log('roar from CityDisplay.prototype.mouseHitDetect')
	var currentCanvas = this.canvas
	var mouse = captureMouse(currentCanvas) //捕获鼠标坐标范围

	for (var i = 0; i < this.cities.length; i++) {
		this.cityCircleGroup[i].checkMouseHit(currentCanvas, mouse)
		// console.log(this.cityCircleGroup[i])
	}

}

CityDisplay.prototype.move = function(animator) {
	for (var i = 0; i < this.cities.length; i++) {
		this.cities[i].alpha = 0;
	}
	var dx = 0;
	var dy = 0
	var scale = 1;
	if (animator) {
	dx = animator.dx;
	dy = animator.dy;
	scale = animator.scale;
	if (animator.state == 'zoom') {

		var u = animator.zoomProgress;
		this.markCities(animator.scaleStart, animator.dxStart, animator.dyStart, 1 - u);
		this.markCities(animator.scaleTarget, animator.dxTarget, animator.dyTarget, u);
	} else {
		//this.markCities(animator.scaleStart, animator.dxStart, animator.dyStart, 1);
		this.markCities(scale, dx, dy, 1);
	}
	} else {
		this.markCities(1, 0, 0, 1);
	}

	// var currentCanvas = this.canvas

	var g = this.canvas.getContext('2d');
	var w = this.canvas.width;
	var h = this.canvas.height;
	// console.log(w)
	g.clearRect(0, 0, w, h);
	var pad = this.pad;

	// var cityCircleGroup = [] //存储各个城市圆点图形
	// var mouse = captureMouse(currentCanvas) //捕获鼠标坐标范围
	shineSpotPosition = [] //清空闪光点位置寄存器

	for (var i = 0; i < this.cities.length; i++) {

		var city = this.cities[i];
		var alpha = Math.min(1, city.alpha);
		if (!alpha) {
			continue;
		}
		function check(val, name) {
			if (!val) {
				window.console.log(name + ' = ' + val);
			}
		}
		var r = .075 * Math.pow(city.pop, .3);
		var v = this.projection.project(city.lon, city.lat);
		var x = v.x * scale + dx;
		var y = v.y * scale + dy;



		if (x < 0 || x > w || y < 0 || y > h) {
			continue;
		}
		var tx = x;
		var ty = y + 15;


		// 用于鼠标监测的固定大小隐形圆点
		this.cityCircleGroup[i] = new Ball(r + 10, city.city, city.aqi)
	    this.cityCircleGroup[i].x = x
	    this.cityCircleGroup[i].y = y
	    this.cityCircleGroup[i].draw(g)

		// this.shineSpotGroup[i] = new ShineSpot(x, y, 5)
		// this.shineSpotGroup[i].checkStatusPerFrame()
		// this.shineSpotGroup[i].changeFillStyle()
		// console.log(this.shineSpotGroup[i].radius)
		// this.shineSpotGroup[i].draw(g)

		// 闪光圆点@@@@@@@@@@@@@@@@@@@@@@
		shineSpotPosition[i] = {}
		shineSpotPosition[i].x = x
		shineSpotPosition[i].y = y
		shineSpotPosition[i].aqi = city.aqi

		// console.log(shineSpotPosition[i])


	    // cityCircleGroup[i].checkMouseHit(currentCanvas, mouse)

		// g.beginPath();
		// g.arc(x, y, r, 0, Math.PI*2, true);
		// g.closePath();
		// g.fillStyle = 'rgba(255,255,255,' + alpha + ')';
		// g.fill();
		// g.strokeStyle = 'rgba(0,0,0,' + alpha + ')';
		// g.stroke();

		g.fillStyle = 'rgba(255,255,255,' + .25 * alpha + ')';
		g.textAlign = 'center';
		g.font = '12px Verdana';

		for (var a = -2; a <= 2; a++) {
			for (var b = -2; b <= 2; b++) {
				g.fillText(city.city, tx + a, ty + b);
			}
		}
		g.fillStyle = 'rgba(0,0,0,' + alpha + ')';
		g.fillText(city.city, tx, ty);
	}
	// console.log()
	// 绘制闪光点@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
	drawShineSpots()
};

function captureMouse(element) {
    var mouse = {x: 0, y: 0, event: null},
    body_scrollLeft = document.body.scrollLeft,
    element_scrollLeft = document.documentElement.scrollLeft,
    body_scrollTop = document.body.scrollTop,
    element_scrollTop = document.documentElement.scrollTop,
    offsetLeft = element.offsetLeft,
    offsetTop = element.offsetTop;

    element.addEventListener('mousemove', function (event) {
        var x, y;

        if (event.pageX || event.pageY) {
            x = event.pageX;
            y = event.pageY;
        } else {
            x = event.clientX + body_scrollLeft + element_scrollLeft;
            y = event.clientY + body_scrollTop + element_scrollTop;
        }
        x -= offsetLeft;
        y -= offsetTop;

        mouse.x = x;
        mouse.y = y;
        mouse.event = event;
    }, false);

    return mouse;
}

function containsPoint(rect, x, y) {
  return !(x < rect.x ||
           x > rect.x + rect.width ||
           y < rect.y ||
           y > rect.y + rect.height);
}

var cities = [
    {
    	city: '上海',
    	state: '上海',
    	lat: 31.1,
    	lon: 121.3,
    	pop: 300000,
		aqi: {
			'AQI': "85",
			'CO': "0.928",
			'NO2': "68.9",
			'O3': "89",
			'PM2.5': "61.1",
			'PM10': "71.8",
			'SO2': "16.6",
			'city': "上海",
			'排名': "258",
			'日期': "2015/4/1",
			'范围': "45~124",
			'质量等级': "良"
		}
	},
    {
    	city: '北京',
    	state: '北京',
    	lat: 40,
    	lon: 116,
    	pop: 200000,
		aqi: {
			'AQI': "82",
			'CO': "0.721",
			'NO2': "48.8",
			'O3': "83",
			'PM2.5': "58.6",
			'PM10': "78.2",
			'SO2': "4.5",
			'city': "北京",
			'排名': "240",
			'日期': "2015/4/1",
			'范围': "44~116",
			'质量等级': "良"
		}
	},
    {
    	city: '乌鲁木齐',
    	state: '新疆',
    	lat: 43.4,
    	lon: 87.36,
    	pop: 80000,
		aqi: {
			'AQI': "49",
			'CO': "0.865",
			'NO2': "31.4",
			'O3': "41",
			'PM2.5': "32.7",
			'PM10': "44.4",
			'SO2': "6.4",
			'city': "乌鲁木齐",
			'排名': "106",
			'日期': "2015/4/1",
			'范围': "32~72",
			'质量等级': "优"
		}
	},
    {
    	city: '广州',
    	state: '广东',
    	lat: 23,
    	lon: 113,
    	pop: 150000,
		aqi: {
			'AQI': "42",
			'CO': "0.727",
			'NO2': "37.5",
			'O3': "41",
			'PM2.5': "24.4",
			'PM10': "41.8",
			'SO2': "7.9",
			'city': "广州",
			'排名': "73",
			'日期': "2015/4/1",
			'范围': "33~57",
			'质量等级': "优"
		}
	},
	{
    	city: '昆明',
    	state: '云南',
    	lat: 24.8,
    	lon: 102.8,
    	pop: 150000,
		aqi: {
			'AQI': "52",
			'CO': "0.879",
			'NO2': "18.4",
			'O3': "93",
			'PM2.5': "31.7",
			'PM10': "48.4",
			'SO2': "15.3",
			'city': "昆明",
			'排名': "116",
			'日期': "2015/4/1",
			'范围': "44~59",
			'质量等级': "良"
		}
	},
	{
    	city: '成都',
    	state: '四川',
    	lat: 30.6,
    	lon: 104.1,
    	pop: 150000,
		aqi: {
			'AQI': "98",
			'CO': "0.935",
			'NO2': "45",
			'O3': "223",
			'PM2.5': "70.4",
			'PM10': "120.5",
			'SO2': "18.7",
			'city': "成都",
			'排名': "301",
			'日期': "2015/4/1",
			'范围': "80~121",
			'质量等级': "良"
		}
	},
	// {
    // 	city: '济南',
    // 	state: '山东',
    // 	lat: 36.5,
    // 	lon: 116.9,
    // 	pop: 150000
	// },
	{
    	city: '武汉',
    	state: '湖北',
    	lat: 30.6,
    	lon: 114.3,
    	pop: 150000,
		aqi: {
			'AQI': "83",
			'CO': "1.578",
			'NO2': "51.4",
			'O3': "76",
			'PM2.5': "59.6",
			'PM10': "105",
			'SO2': "28",
			'city': "武汉",
			'排名': "279",
			'日期': "2015/4/1",
			'范围': "76~89",
			'质量等级': "良"
		}
	}
	// ,{
    // 	city: '福州',
    // 	state: '福建',
    // 	lat: 26.1,
    // 	lon: 119.2,
    // 	pop: 150000
	// },
	// {
    // 	city: '郑州',
    // 	state: '河南',
    // 	lat: 34.8,
    // 	lon: 113.2,
    // 	pop: 150000
	// },
	// {
    // 	city: '台北',
    // 	state: '台湾',
    // 	lat: 25.6,
    // 	lon: 121.6,
    // 	pop: 150000
	// },
	// {
    // 	city: '三亚',
    // 	state: '海南',
    // 	lat: 18.8,
    // 	lon: 107.9,
    // 	pop: 150000
	// }
]

// var field = VectorField.read(windData, true);
var field = '' //先申明一个空的全局变量，挂载风力数据

var mapAnimator;
var legendSpeeds = [1, 3, 5, 10, 15, 30];

var MapMask = function(image, width, height) {
	this.image = image;
	this.width = width;
	this.height = height;
};

MapMask.prototype.endMove = function(animator) {
	this.move(animator);
}

MapMask.prototype.move = function(animator) {
	var s = this.image.style;
	s.width = ~~(animator.scale * this.width) + 'px';
	s.height = ~~(animator.scale * this.height) + 'px';
	s.left = animator.dx + 'px';
	s.top = animator.dy + 'px';
};

function isAnimating() {
	// return document.getElementById('animating').checked;
	return true
}

function showCities() {
	document.getElementById('city-display').style.visibility =
	document.getElementById('show-cities').checked ? 'visible' : 'hidden';
}

function doUnzoom() {
	mapAnimator.unzoom();
}

function format(x) {
	x = Math.round(x * 10) / 10;
	var a1 = ~~x;
	var a2 = (~~(x * 10)) % 10;
	return a1 + '.' + a2;
}

function initCN() {
	promiseAllData().then(data => {
	    // console.log(data)
		var dataChina = data[0]
		var geoHeadData = patchGeoHeadData()
        var processedRawData = []
        dataChina.forEach(function(d) {
            var singleRowRawData = d["lng       lat       wDir      wSpeed    "]
            var singleProcessedRowData = convertRowToNumber(singleRowRawData)
            processedRawData.push(singleProcessedRowData)
        })

		// 排除不属于中国领土内的数据
		var filteredChinaLandData = filterMoreChinaLandData(processedRawData)
		//记录到原始全局数据
		globalDataArray = filteredChinaLandData


		var boundLonLat = {}
		boundLonLat.maxLon = 0
		boundLonLat.maxLat = -90
		boundLonLat.minLon = 180
		boundLonLat.minLat = 90
		boundLonLat.maxSpeed = 0
		boundLonLat.minSpeed = 100

		filteredChinaLandData.forEach(function(d) {
			if (d[0] > boundLonLat.maxLon) {
				boundLonLat.maxLon = d[0]
			}

			if (d[1] > boundLonLat.maxLat) {
				boundLonLat.maxLat = d[1]
			}

			if (d[0] < boundLonLat.minLon) {
				boundLonLat.minLon = d[0]
			}

			if (d[1] < boundLonLat.minLat) {
				boundLonLat.minLat = d[1]
			}

			if (d[3] > boundLonLat.maxSpeed) {
				boundLonLat.maxSpeed = d[3]
			}

			if (d[3] < boundLonLat.minSpeed) {
				boundLonLat.minSpeed = d[3]
			}

			// 经度大于90,则风向掉转180度
			if (d[0] > 90) {
				d[2] -= 90
			} else {
				d[2] += 90
			}
		})

		//记录全局数据
		globalDataRecorder = boundLonLat
		// 排除不属于中国领土内的数据，修正边界经纬度
		geoHeadData.x0 = boundLonLat.minLon
		geoHeadData.x1 = boundLonLat.maxLon
		geoHeadData.y0 = boundLonLat.minLat
		geoHeadData.y1 = boundLonLat.maxLat
		geoHeadData.gridWidth = boundLonLat.maxLon - boundLonLat.minLon + 1
		geoHeadData.gridHeight = boundLonLat.maxLat - boundLonLat.minLat + 1

        var field = convertCNDataToUSStd(filteredChinaLandData, geoHeadData, true)
		// console.log(field)
		//全局记录转换后的数据矩阵
		dataMatrix = field.field
		//预先计算色表
		colorMatrix = makeColorMatrix(dataMatrix, globalDataRecorder)
        // 取消页面载入提示
    	// loading = false;
    	// 获取绘图容器
    	var canvas = document.getElementById('display');
    	var imageCanvas = document.getElementById('image-canvas');
    	// 设置投影模式
    	// var mapProjection = new ScaledAlbers(1111, -75, canvas.height - 100, -126.5, 23.5);
		var mapProjection = new ScaledAlbers(700, 0, canvas.height - 50, 73, 3);

    	// 判断浏览器类型再设置粒子数量，firefox和ie比较慢粒子少
    	var isMacFF = navigator.platform.indexOf('Mac') != -1 &&
    	navigator.userAgent.indexOf('Firefox') != -1;
    	var isWinFF = navigator.platform.indexOf('Win') != -1 &&
    	navigator.userAgent.indexOf('Firefox') != -1;
    	var isWinIE = navigator.platform.indexOf('Win') != -1 &&
    	navigator.userAgent.indexOf('MSIE') != -1;
    	// var numParticles = isMacFF || isWinIE ? 3500 : 5000; // slowwwww browsers
		var numParticles = isMacFF || isWinIE ? 3000 : 4000;
    	// 粒子渲染
    	var display = new MotionDisplay(canvas, imageCanvas, field,
    	numParticles, mapProjection);

    	// IE & FF Windows do weird stuff with very low alpha.
    	if (isWinFF || isWinIE) {
    		display.setAlpha(.05);
    	}

    	var navDiv = document.getElementById("city-display");
    	var unzoom = document.getElementById('unzoom');
    	mapAnimator = new Animator(navDiv, isAnimating, unzoom);
    	mapAnimator.add(display); //添加监听listener

		var mask = new MapMask(document.getElementById('mask'), 700, 700);
		mapAnimator.add(mask); //添加监听listener

		// var callout = document.getElementById('callout');
		// var hovercard = new MotionDetails(navDiv, callout, field,
		// mapProjection, mapAnimator);

		// var windDetail = document.getElementById('windDetail');
		var emptyCallOut = document.getElementById('emptyCallOut')
		var hovercard = new MotionDetails(navDiv, emptyCallOut, field,
		mapProjection, mapAnimator);


		// console.log(data[1])
		var cityWeatherNested = d3.nest().key(d => d['city']).key(d => d['日期']).entries(data[1])
		var bj = cityWeatherNested.filter(obj => {
			return obj.key == "北京"
		})
		// console.log(bj[0].values[0].values[0])
		// console.log(cityWeatherNested)

        var cityCanvas = document.getElementById('city-display');
    	var cityDisplay = new CityDisplay(cities, cityCanvas, mapProjection);
    	mapAnimator.add(cityDisplay);
    	cityDisplay.move();
		cityDisplay.mouseHitDetect()

    	mapAnimator.start(20);

		// // 绘制闪光点@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
		// drawShineSpots()
		// 绑定缩放按钮@@@@@@@@@@@@@@@@@@@@@@@@2
		$('#unZoomButton').click(doUnzoom)

        document.getElementById('loadingHint').style.visibility = 'hidden'

	})
	// console.log('@@@@@@@@@@@@@@@@@@@@@@@ boot from wind-initCN()')
    // d3.csv('../../../../asset/data/16040600.000', function(dataChina) {
	// 	// console.log('boot from wind-initCN()')
    //     var geoHeadData = patchGeoHeadData()
    //     var processedRawData = []
    //     dataChina.forEach(function(d) {
    //         var singleRowRawData = d["lng       lat       wDir      wSpeed    "]
    //         var singleProcessedRowData = convertRowToNumber(singleRowRawData)
    //         processedRawData.push(singleProcessedRowData)
    //     })
	//
	// 	// 排除不属于中国领土内的数据
	// 	// var filteredChinaLandData = filterChinaLandData(processedRawData)
	// 	var filteredChinaLandData = filterMoreChinaLandData(processedRawData)
	// 	//记录到原始全局数据
	// 	globalDataArray = filteredChinaLandData
	//
	// 	// var filteredChinaLandData = processedRawData
	// 	// console.log(filteredChinaLandData)
	//
	// 	var boundLonLat = {}
	// 	boundLonLat.maxLon = 0
	// 	boundLonLat.maxLat = -90
	// 	boundLonLat.minLon = 180
	// 	boundLonLat.minLat = 90
	// 	boundLonLat.maxSpeed = 0
	// 	boundLonLat.minSpeed = 100
	//
	// 	filteredChinaLandData.forEach(function(d) {
	// 		if (d[0] > boundLonLat.maxLon) {
	// 			boundLonLat.maxLon = d[0]
	// 		}
	//
	// 		if (d[1] > boundLonLat.maxLat) {
	// 			boundLonLat.maxLat = d[1]
	// 		}
	//
	// 		if (d[0] < boundLonLat.minLon) {
	// 			boundLonLat.minLon = d[0]
	// 		}
	//
	// 		if (d[1] < boundLonLat.minLat) {
	// 			boundLonLat.minLat = d[1]
	// 		}
	//
	// 		if (d[3] > boundLonLat.maxSpeed) {
	// 			boundLonLat.maxSpeed = d[3]
	// 		}
	//
	// 		if (d[3] < boundLonLat.minSpeed) {
	// 			boundLonLat.minSpeed = d[3]
	// 		}
	//
	// 		// 经度大于90,则风向掉转180度
	// 		if (d[0] > 90) {
	// 			d[2] -= 90
	// 		} else {
	// 			d[2] += 90
	// 		}
	// 	})
	//
	// 	//记录全局数据
	// 	globalDataRecorder = boundLonLat
	// 	// console.log(boundLonLat)
	// 	// console.log(geoHeadData)
	// 	// 排除不属于中国领土内的数据，修正边界经纬度
	// 	geoHeadData.x0 = boundLonLat.minLon
	// 	geoHeadData.x1 = boundLonLat.maxLon
	// 	geoHeadData.y0 = boundLonLat.minLat
	// 	geoHeadData.y1 = boundLonLat.maxLat
	// 	geoHeadData.gridWidth = boundLonLat.maxLon - boundLonLat.minLon + 1
	// 	geoHeadData.gridHeight = boundLonLat.maxLat - boundLonLat.minLat + 1
	// 	// console.log(geoHeadData)
	// 	// console.log(filteredChinaLandData)
	//
    //     var field = convertCNDataToUSStd(filteredChinaLandData, geoHeadData, true)
	// 	// console.log(field)
	// 	//全局记录转换后的数据矩阵
	// 	dataMatrix = field.field
	// 	//预先计算色表
	// 	// colorTable = makeColorTable(globalDataArray, globalDataRecorder)
	// 	colorMatrix = makeColorMatrix(dataMatrix, globalDataRecorder)
	// 	// console.log(colorMatrix)
	// 	// console.log(colorTable)
    //     // 取消页面载入提示
    // 	// loading = false;
    // 	// 获取绘图容器
    // 	var canvas = document.getElementById('display');
    // 	var imageCanvas = document.getElementById('image-canvas');
    // 	// 设置投影模式
    // 	// var mapProjection = new ScaledAlbers(1111, -75, canvas.height - 100, -126.5, 23.5);
	// 	var mapProjection = new ScaledAlbers(700, 0, canvas.height - 50, 73, 3);
	//
    // 	// 判断浏览器类型再设置粒子数量，firefox和ie比较慢粒子少
    // 	var isMacFF = navigator.platform.indexOf('Mac') != -1 &&
    // 	navigator.userAgent.indexOf('Firefox') != -1;
    // 	var isWinFF = navigator.platform.indexOf('Win') != -1 &&
    // 	navigator.userAgent.indexOf('Firefox') != -1;
    // 	var isWinIE = navigator.platform.indexOf('Win') != -1 &&
    // 	navigator.userAgent.indexOf('MSIE') != -1;
    // 	// var numParticles = isMacFF || isWinIE ? 3500 : 5000; // slowwwww browsers
	// 	var numParticles = isMacFF || isWinIE ? 500 : 4000;
    // 	// 粒子渲染
    // 	var display = new MotionDisplay(canvas, imageCanvas, field,
    // 	numParticles, mapProjection);
	//
    // 	// IE & FF Windows do weird stuff with very low alpha.
    // 	if (isWinFF || isWinIE) {
    // 		display.setAlpha(.05);
    // 	}
	//
    // 	var navDiv = document.getElementById("city-display");
    // 	var unzoom = document.getElementById('unzoom');
    // 	mapAnimator = new Animator(navDiv, isAnimating, unzoom);
    // 	mapAnimator.add(display); //添加监听listener
	//
	// 	var mask = new MapMask(document.getElementById('mask'), 700, 700);
	// 	mapAnimator.add(mask); //添加监听listener
	//
	// 	// var callout = document.getElementById('callout');
	// 	// var hovercard = new MotionDetails(navDiv, callout, field,
	// 	// mapProjection, mapAnimator);
	// 	// 把风力详情转移到外部widget里@@@@@@@@@@@@@@@@@@@@@@@@@2
	// 	var windDetail = document.getElementById('windDetail');
	// 	var hovercard = new MotionDetails(navDiv, windDetail, field,
	// 	mapProjection, mapAnimator);
    //     //
    //     var cityCanvas = document.getElementById('city-display');
    // 	var cityDisplay = new CityDisplay(cities, cityCanvas, mapProjection);
    // 	mapAnimator.add(cityDisplay);
    // 	cityDisplay.move();
	//
	// 	// // 风速图例
	// 	// var legendAnimator = new Animator(null, isAnimating);
	// 	// var speedScaleFactor = 20 / 1.15;
	// 	// for (var i = 1; i <= legendSpeeds.length; i++) {
	// 	// 	var c = document.getElementById('legend' + i);
	// 	// 	var legendField = VectorField.constant(
	// 	// 	legendSpeeds[i - 1] * speedScaleFactor, 0, 0, 0, c.width, c.height);
	// 	// 	var legend = new MotionDisplay(c, null, legendField, 30);
	// 	// 	// normalize so colors correspond to wind map's maximum length!
	// 	// 	legend.maxLength = field.maxLength * speedScaleFactor;
	// 	// 	legendAnimator.add(legend);
	// 	// }
	//
    // 	mapAnimator.start(20);
	// 	// legendAnimator.start(40);
    // })
}

function promiseAllData() {
	var windData = './asset/data/16040600.000'
	var cityData = './asset/data/air-qulity.csv'

	var promiseWindData = new Promise((resolve, reject) => {
		d3.csv(windData, function(error, data) {
			resolve(data)
		})
	})

	var promiseCityData = new Promise((resolve, reject) => {
		d3.csv(cityData, function(error, data) {
			resolve(data)
		})
	})

	var queuePromise = Promise.all([promiseWindData, promiseCityData])

	return queuePromise
}

export { initCN, doUnzoom }
