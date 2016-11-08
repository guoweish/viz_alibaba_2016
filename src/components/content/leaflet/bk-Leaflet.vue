<template>
    <div id="moving-routines">
        <div id="map-svg"></div>
        <!-- <div id='webGL-output'></div> -->
        <div id='Stats-output'></div>
        <canvas id="canvas"></canvas>
        <canvas id="canvasOfCircles"></canvas>
    </div>
</template>

<script>
// import THREE from 'three'
import * as d3 from 'd3'
// import TrackballControls from '../../../static/TrackballControls'

var devAssetPath = '../../../../projects/tomahawk/asset/'
var deployAssetPath = '../asset/'
var currentAssetPath = devAssetPath //部署阶段切换到部署路径

export default {
    ready: drawMap
}

function drawMap() {
    var canvasWidth  = window.innerWidth
    var canvasHeight = window.innerHeight

    var svg = d3.select("#map-svg").append("svg")
        .attr("width", canvasWidth)
        .attr("height", canvasHeight)

    var projection = d3.geoMercator()
        .center([121.3, 31.1]) //最终要换成上海的中心坐标
        .scale(40000)
        .translate([canvasWidth/2, canvasHeight/2]) //渲染容器的中心点

    d3.queue()
        .defer(d3.json, currentAssetPath + 'data/geo_shanghai_full.json')
        .defer(d3.csv, currentAssetPath + 'data/site.csv')
        .defer(d3.csv, currentAssetPath + 'data/spot.csv')
        .defer(d3.csv, currentAssetPath + 'data/shop.csv')
        // .defer(d3.csv, currentAssetPath + 'data/online_order.csv')
        // .defer(d3.csv, currentAssetPath + 'data/o2o_order.csv')
        // .defer(d3.csv, currentAssetPath + 'data/courier.csv')
        .defer(d3.csv, currentAssetPath + 'data/schedulePenalty.csv')
        // .await(function(error, shanghaiMapData, siteData, spotData, shopData, onlineOrderData, o2oOrderData, courierData, scheduleData) {
        .await(function(error, shanghaiMapData, siteData, spotData, shopData, scheduleData) {
            // console.log(shanghaiMapData)
            // console.log(siteData)
            drawShanghaiMap(svg, shanghaiMapData, projection)

            drawGeoCirclesSytem('canvasOfCircles', siteData, spotData, shopData, projection)

            drawRoutings(siteData, spotData, shopData, scheduleData, projection)

            // console.log(routineSystem)

            // routineSystem.forea
        })

    function drawRoutings(siteData, spotData, shopData, scheduleData, projection) {
        var canvas = document.getElementById('canvas')
        var context = canvas.getContext('2d')
        context.globalCompositeOperation = 'lighter'

        canvas.width = window.innerWidth
        canvas.height = window.innerHeight

        context.fillStyle = 'rgba(0, 0, 0, 1)'
        context.fillRect(0, 0, canvas.width, canvas.height)

        var scheduleNestedData = d3.nest()
            .key(d => d.Courier_id).sortKeys(d3.ascending)
            // .key(d => d.Addr).sortKeys(d3.ascending)
            .entries(scheduleData)
        // console.log(scheduleNestedData)
        var courierSystem = [] //快递员集合
        var routineSystem = [] //路线集合

        scheduleNestedData.forEach(d => {
            var routine = scheduleRouting(d.values, projection)
            routineSystem.push(routine)

            var courier = new Spot()
            courier.setTargetList(routine)
            courier.setDirection()

            courierSystem.push(courier)
        })

        var geoCirclesSytem = createGeoCirclesSytem(siteData, spotData, shopData, projection)
        console.log(geoCirclesSytem)

        render()

        function render() {
            context.fillStyle = 'rgba(0, 0, 0, 0.07)'
            context.fillRect(0, 0, canvas.width, canvas.height)

            courierSystem.forEach(d => {
                d.draw(context)
            })

            // geoCirclesSytem.forEach()

            requestAnimationFrame(render)
        }
    }

    function drawGeoCirclesSytem(canvasId, siteData, spotData, shopData, projection) {
        var canvas = document.getElementById(canvasId)
        var context = canvas.getContext('2d')
        context.globalCompositeOperation = 'lighter'

        canvas.width = window.innerWidth
        canvas.height = window.innerHeight

        var geoCirclesSytem = createGeoCirclesSytem(siteData, spotData, shopData, projection)

        geoCirclesSytem.forEach(d => {
            d.forEach(e => {
                e.draw(context)
            })
        })
    }

    function createGeoCirclesSytem(siteData, spotData, shopData, projection) {
        var geoCircleSystem
        var sites = []
        var shops = []
        var spots = []

        var siteStyle = {r:8, color:'rgba(255, 14, 12, 0.7)'}
        var shopStyle = {r:4, color:'rgba(255, 125, 22, 0.6)'}
        var spotStyle = {r:2, color:'rgba(81, 233, 71, 0.5)'}

        sites = createCircleSystem(siteData, siteStyle)
        shops = createCircleSystem(shopData, shopStyle)
        spots = createCircleSystem(spotData, spotStyle)

        geoCircleSystem = [sites, shops, spots]

        return geoCircleSystem

        function createCircleSystem(geoData, style) {
            var circleHolder = []

            geoData.forEach(d => {
                var postionProjected = projection([+d.Lng, +d.Lat])
                var xPositon = postionProjected[0]
                var yPosition = postionProjected[1]
                var circle = new Circle(xPositon, yPosition, style)

                circleHolder.push(circle)
            })

            return circleHolder
        }
    }

    function Spot(x, y) {
        this.x = x || 0
        this.y = y || 0
        // this.distance = 0
        this.targetList = []
        this.target = ''
        this.targetIndex = 1 //因为要从0出发，第一个目标必然为1
        this.direction = 0
        this.speed = 1
    }

    Spot.prototype.setDirection = function() {
        this.direction = Math.atan2(this.target.y - this.y, this.target.x - this.x)
    }

    Spot.prototype.setTarget = function(target) {
        this.target = target
    }

    Spot.prototype.setTargetList = function(targetList) {
        this.targetList = targetList
        // 初始化出发点和第一个目标点
        this.target = this.targetList[1]
        this.x = this.targetList[0].x
        this.y = this.targetList[0].y
    }

    Spot.prototype.tick = function() {
        var distance = getDistance(this.x, this.y, this.target.x, this.target.y)
        if (distance < 1) {
            this.x = this.target.x
            this.y = this.target.y
            this.changeTarget()
            this.setDirection()
        } else {
            this.x += Math.cos(this.direction) * this.speed
            this.y += Math.sin(this.direction) * this.speed
        }
    }

    Spot.prototype.changeTarget = function() {
        if (this.targetIndex < (this.targetList.length - 1)) {
            this.targetIndex++
        } else {
            this.targetIndex = 0
        }

        this.setTarget(this.targetList[this.targetIndex])
    }

    Spot.prototype.draw = function(context) {
        // context.strokeStyle = 'rgba(0, 250, 250, 1)'
        // context.strokeStyle = 'rgba(' + this.target.penaltyTime + ', 250, 250, 1)'
        if (this.target.penaltyTime == 0) {
            context.strokeStyle = 'rgba(0, 250, 250, 1)'
        } else {
            context.strokeStyle = 'rgba(250, 50, 250, 1)'
        }

        context.lineWidth = 1
        context.beginPath()
        context.moveTo(this.x, this.y)
        this.tick()
        context.lineTo(this.x, this.y)
        context.stroke()
    }

    function Target(x, y, p) {
        this.x = x
        this.y = y
        this.penaltyTime = p
    }

    function Circle(x, y, style) {
        this.x = x || 0
        this.y = y || 0
        this.r = style.r || 5
        this.color = style.color || 'Orange'
        this.particleBackground = 'rgba(0, 0, 0, 0.1)'
    }

    Circle.prototype.draw = function(context) {
        context.beginPath()

        var fillStyle = context.createRadialGradient(this.x, this.y, this.r * 0.001, this.x, this.y, this.r)
        fillStyle.addColorStop(0, this.color)
        fillStyle.addColorStop(1, this.particleBackground)

        context.fillStyle = fillStyle
        context.beginPath()
        context.arc(this.x, this.y, this.r, 0, Math.PI * 2)
        context.fill()
    }

    function getDistance(x1, y1, x2, y2) {
    	var xDist = x2 - x1;
    	var yDist = y2 - y1;

    	return Math.sqrt(xDist * xDist + yDist * yDist);
    }

    function scheduleRouting(courierSchedule, projection) {
        var routineSchedule = []
        var numberOfroutines = courierSchedule.length

        courierSchedule.forEach(d => {
            var postionProjected = projection([+d.Addr_lng, +d.Addr_lat])
            var xPositon = postionProjected[0]
            var yPosition = postionProjected[1]
            var penaltyTime = +d.Penalty_time

            routineSchedule.push(new Target(xPositon, yPosition, penaltyTime))
        })

        return routineSchedule
    }

    function drawRoutineSeries(svg, scheduleNestedData, projection) {
        var line = d3.line()
            .x(d => { return projection([+d.Addr_lng, +d.Addr_lat])[0] })
            .y(d => { return projection([+d.Addr_lng, +d.Addr_lat])[1] })
            // .curve(d3.curveStepAfter)

        var allRoutines = svg.append('g')
            .selectAll('.routine')
            .data(scheduleNestedData)
            .enter()
            .append('g')
            .attr('class', 'routine')
        // console.log(allRoutines)

        allRoutines.append('path')
            .attr('class', 'expressRoutine')
            .attr('d', d => { return line(d.values) })
            // .attr('onmouseover', d => { console.log(d) })

    }

    function drawExpressRoutine(svg, scheduleData, projection) {
        var line = d3.line()
            .x(d => { return projection([+d.Arrival_lng, +d.Arrival_lat])[0] || projection([+d.Departure_lng, +d.Departure_lat])[0]})
            .y(d => { return projection([+d.Arrival_lng, +d.Arrival_lat])[1] || projection([+d.Departure_lng, +d.Departure_lat])[1]})
            // .curve(d3.curveStepAfter)

        svg.append('g')
            .selectAll('.expressRoutine')
            .data(scheduleData)
            .enter()
            .append("line")
            .attr("class", "expressRoutine")
            .attr('x1', d => { return projection([+d.Departure_lng, +d.Departure_lat])[0]})
    		.attr('y1', d => { return projection([+d.Departure_lng, +d.Departure_lat])[1]})
            .attr('x2', d => { return projection([+d.Arrival_lng, +d.Arrival_lat])[0]})
    		.attr('y2', d => { return projection([+d.Arrival_lng, +d.Arrival_lat])[1]})
    }

    function drawParticles(siteData, spotData, shopData, dataNested, projection) {
        //===============================================
        //fps monitor
        var stats = initStats();

        //===============================================
        //scene
        var scene = new THREE.Scene();

        //===============================================
        //camera
        var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 3000);
        camera.position.x = 500;
        camera.position.y = 200;
        camera.position.z = 300;
        camera.lookAt(new THREE.Vector3(0, 0, 0));

        //===============================================
        //camera view control
        var trackballControls = new TrackballControls(camera)
        var clock = new THREE.Clock()
        var delta = clock.getDelta()
        // orbitControls.update(delta)

        //===============================================
        //renderer
        var renderer = new THREE.WebGLRenderer({antialias: true});
        renderer.setClearColor(new THREE.Color(0x000000, 0));
        renderer.setSize(window.innerWidth, window.innerHeight);
        // renderer.shadowMapEnabled = true;

        //===============================================
        //axis
        var axis = new THREE.AxisHelper(1000)
        // scene.add(axis)

        //===============================================
        //ground plane
        // var groundGeom = new THREE.PlaneGeometry(100, 100, 1, 1);
        // var groundMesh = new THREE.Mesh(groundGeom, new THREE.MeshBasicMaterial({color: 0xcccccc}));
        // groundMesh.rotation.x = -Math.PI / 2;
        // groundMesh.position.y = -20;
        // groundMesh.receiveShadow = true
        // scene.add(groundMesh);

        //***********************************************************************
        //***********************************************************************
        //meshes
        // var boxGeometry = new THREE.BoxGeometry(50, 50, 50)


        //===============================================
        //lights
        // var ambientLight = new THREE.AmbientLight(0x0c0c0c)
        var ambientLight = new THREE.AmbientLight(0x0c0c0c)
        scene.add(ambientLight);

        // var spotLight = new THREE.SpotLight(0xffffff)
        // spotLight.position.set(0, 0, 50);
        // spotLight.castShadow = true;
        // scene.add(spotLight);

        //************************************************
        //render scene
        //************************************************
        // console.log()
        // console.log(document.getElementById("webGL-output").style)
        document.getElementById("webGL-output").appendChild(renderer.domElement)

        // var step = 0

        var siteParticles = createSprites(siteData, projection, {size:8, color:'red', yPosition:150})
        scene.add(siteParticles)

        var spotParticles = createSprites(spotData, projection, {size:2, color:'pink', yPosition:-100})
        scene.add(spotParticles)

        var shopParticles = createSprites(shopData, projection, {size:4, color:'orange', yPosition:50})
        scene.add(shopParticles)

        var routineGroup = draw3DRoutines(dataNested, projection)
        // console.log(routineGroup instanceof THREE.Line) //THREE.Mesh is not THREE.Line
        scene.add(routineGroup)

        render()

        //================================================
        //functions

        function render() {
            stats.update()

            trackballControls.update(delta)

            // text.rotation.y += 0.01

            requestAnimationFrame(render)
            renderer.render(scene, camera)
        }

        function createSprites(siteData, projection, style) {
            var geom = new THREE.Geometry()
            var material = new THREE.PointsMaterial({
                size: style.size,
                vertexColors: true,
                color: style.color,
                opacity: 0.8,
                transparent: true,
                blending: THREE.AdditiveBlending
            })

            siteData.forEach(d => {
                var webPosition = projection([+d.Lng, +d.Lat])
                // console.log(webPosition)
                var particle = new THREE.Vector3(webPosition[0]-canvasWidth/2, style.yPosition, webPosition[1] - canvasHeight/2)
                geom.vertices.push(particle)
                geom.colors.push(new THREE.Color(style.color))
            })

            var cloud = new THREE.Points(geom, material)
            // cloud.rotation.x = Math.PI/2

            return cloud
            // scene.add(cloud)
        }

        function draw3DRoutines(dataNested, projection) {
            var routineGroup = new THREE.Object3D()
            var routineGroupGeometry = new THREE.Geometry() //try to merge all line together

            dataNested.forEach(d => {
                // console.log(d.values)
                var lineGeometry = new THREE.Geometry() //crate new line geometry to host dots

                var routineArray =  d.values
                routineArray.forEach(d => {
                    // console.log(d.Addr[0])
                    var addressType = d.Addr[0]
                    var yPosition

                    if (addressType == 'A') {
                        yPosition = 150
                    } else if (addressType == 'B') {
                        yPosition = -100
                    } else {
                        yPosition = 50
                    }

                    var xz = projection([+d.Addr_lng, +d.Addr_lat])
                    var xyz = new THREE.Vector3((xz[0]-canvasWidth/2), yPosition, (xz[1] - canvasHeight/2))

                    lineGeometry.vertices.push(xyz)
                })

                // var lineMaterial = new THREE.LineBasicMaterial({
                //     color: 0x00cccc,
                //     transparent:true,
                //     opacity:0.1,
                //     blending: THREE.AdditiveBlending
                // })
                // var singleRoutine = new THREE.Line(lineGeometry, lineMaterial)
                //
                // routineGroup.add(singleRoutine)

                THREE.GeometryUtils.merge(routineGroupGeometry, lineGeometry)
            })

            var lineMaterial = new THREE.LineBasicMaterial({
                color: 0x00cccc,
                transparent:true,
                opacity:0.1,
                blending: THREE.AdditiveBlending
            })
            var routineTogether = new THREE.Line(routineGroupGeometry, lineMaterial)

            // return routineGroup
            return routineTogether
        }


        function createMesh(geom) {
            var meshMaterial = new THREE.MeshBasicMaterial({color: 0x00cccc, transparent: true, opacity: 0.8, side: THREE.DoubleSide})

            var mesh = new THREE.Mesh(geom, meshMaterial)

            return mesh
        }

        function initStats() {

            var stats = new Stats();

            stats.setMode(0); // 0: fps, 1: ms

            // Align top-left
            stats.domElement.style.position = 'absolute';
            stats.domElement.style.left = '0px';
            stats.domElement.style.top = '0px';

            document.getElementById("Stats-output").appendChild(stats.domElement);

            return stats;
        }
    }

    function drawShanghaiMap(svg, mapData, projection) {
        var path = d3.geoPath()
            .projection(projection)

        svg.append("g")
            .selectAll("path.mapShanghai")
            .data(mapData.features)
            .enter()
            .append("path")
            .attr('class', 'mapShanghai')
            .attr("d", path)
    }

    function drawCircles(svg, siteData, projection, style) {
        svg.append("g")
            .selectAll("circle")
            .data(siteData)
            .enter()
            .append("circle")
            .attr('r', style.radius)
            .attr('transform', d => {
                return 'translate(' + projection([+d.Lng, +d.Lat]) + ')'
            })
            .style('fill', style.color)
            .style('fill-opacity', 0.5)
    }


}
</script>

<style lang="stylus">
#map-wrapper
    background #000
    width 100%
    height 100%

#map-svg
    position absolute
    z-index 40

/*#webGL-output
    position absolute
    z-index 20
    width 100%
    height 100%*/

#Stats-output
    position absolute
    z-index 50

#canvas
    position absolute
    z-index 20

#canvasOfCircles
    position absolute
    z-index 30

.mapShanghai
    stroke #ccc
    stroke-width 1
    stroke-opacity 0.7
    stroke-dasharray: 1 4
    fill none

.expressRoutine
    stroke #999
    stroke-opacity 0.4
    fill none
</style>
