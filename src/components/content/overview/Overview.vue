<template>
    <div id="overview">
        <!-- <div id="map-svg"></div> -->
        <div id='webGL-output'></div>
        <div id='Stats-output'></div>
        <!-- <canvas id="movingRouting"></canvas> -->
    </div>
</template>

<script>
import THREE from 'three'
import * as d3 from 'd3'
import TWEEN from 'tween'
import Stats from '../../../static/stats'
import TrackballControls from '../../../static/TrackballControls'
import { getAllData } from '../../../vuex/getters'
import { getStaticAssetPath } from '../../../vuex/getters'
import { fetchAllData } from '../../../vuex/actions'
import { setPersistData } from '../../../vuex/actions'
import { setAnimatorId } from '../../../vuex/actions'
// var devAssetPath = '../../../../projects/tomahawk/asset/'
// var deployAssetPath = '../asset/'
// var currentAssetPath = devAssetPath //部署阶段切换到部署路径
var animatorIdOverview

export default {
    vuex: {
        getters: {
            getAllData,
            getStaticAssetPath
        },
        actions: {
            fetchAllData,
            setPersistData,
            setAnimatorId
        }
    },
    route: {
        activate: function (transition) {
            console.log('overview activated!')
            transition.next()
        },
        deactivate: function (transition) {
            console.log('overview deactivated!')
            window.cancelAnimationFrame(animatorIdOverview)
            transition.next()
        }
    },
    data() {
        return {
            dataStorage:''
        }
    },
    methods: {
        bootOverview: bootOverview
    },
    ready: bootShow
}

//fetch promises, remove animation, boot 3d overview
function bootShow() {
    var _self = this
    this.fetchAllData()
    this.bootOverview(_self)
}

//remove animation, boot 3d overview
function bootOverview(_self) {
    _self.getAllData.then(d => {
        _self.setPersistData(d) //preserver promise data for other views
        drawOverview(d)
        iniApp() //remove loading animation
    })
}

//remove animation
function iniApp() {
    removeLoadingAnimator()
    // showExplore()
    // showNavbar()

    function removeLoadingAnimator() {
        d3.select('#loading').remove()
        d3.select('#circles').remove()
    }

    function showNavbar() {
        // var navbar = document.getElementById('nav-bar')
        // console.log()
        // document.getElementById('nav-bar').style.visibility = 'visible'
    }

    function showExplore() {
        document.getElementById('explore').style.visibility = 'visible'
    }
}

function hideSwitcher() {
    document.getElementById('switcher').style.visibility = 'hidden'
}

//boot 3d overview
function drawOverview(allData) {
    // console.log(allData)
    var shanghaiMapData = allData[0]
    var siteData = allData[1]
    var spotData = allData[2]
    var shopData = allData[3]
    var scheduleData = allData[4]
    console.log(siteData)

    var canvasWidth  = window.innerWidth
    var canvasHeight = window.innerHeight

    var projection = d3.geoMercator()
        .center([121.3, 31.1]) //最终要换成上海的中心坐标
        .scale(80000)
        .translate([canvasWidth/2, canvasHeight/2]) //渲染容器的中心点

    var scheduleNestedData = d3.nest()
        .key(d => d.Courier_id).sortKeys(d3.ascending)
        .entries(scheduleData)

    drawParticles(siteData, spotData, shopData, scheduleNestedData, projection)

    hideSwitcher()
}

function drawParticles(siteData, spotData, shopData, dataNested, projection) {
    //===============================================
    //fps monitor
    // var stats = initStats();

    //===============================================
    //scene
    var scene = new THREE.Scene();

    //===============================================
    //camera
    var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 6000);
    camera.position.x = 1500;
    camera.position.y = 600;
    camera.position.z = 1000;
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
    var particleSystem = new THREE.Object3D()

    var siteParticles = createSprites(siteData, projection, {size:8, color:'aqua', yPosition:0})
    // scene.add(siteParticles)
    particleSystem.add(siteParticles)

    var shopParticles = createSprites(spotData, projection, {size:6, color:'springgreen', yPosition:0})
    // scene.add(shopParticles)
    particleSystem.add(shopParticles)

    var spotParticles = createSprites(shopData, projection, {size:4, color:'orange', yPosition:0})
    // scene.add(spotParticles)
    particleSystem.add(spotParticles)

    // scene.add(particleSystem)

    var routineGroup = draw3DRoutines(dataNested, projection)
    // console.log(routineGroup instanceof THREE.Line) //THREE.Mesh is not THREE.Line
    // scene.add(routineGroup)
    particleSystem.add(routineGroup)
    scene.add(particleSystem)
    // console.log(routineGroup.material.opacity)

    //************************************************
    //tween animation
    //************************************************
    var tweenSpot = new TWEEN.Tween({y: 800, scale:9})
        .to({y: 0, scale:1}, 4000)
        .easing(TWEEN.Easing.Elastic.InOut)

    // var tweenSpotRotation = new TWEEN.Tween({rotation: 0})
        // .to({rotation: Math.PI*2}, 8000)

    var tweenShop = new TWEEN.Tween({y: 800, scale:9})
        .to({y: 0, scale:1}, 5000)
        .easing(TWEEN.Easing.Elastic.InOut)

    var tweenShopRotation = new TWEEN.Tween({y: 0, rotation:0})
        .to({y: 300, rotation:Math.PI*2}, 4000)

    var tweenSite = new TWEEN.Tween({y: 800, scale:9})
        .to({y: 0, scale:1}, 6000)
        .easing(TWEEN.Easing.Elastic.InOut)

    var tweenSiteRotation = new TWEEN.Tween({y: 0, rotation:0})
        .to({y: -300, rotation:Math.PI*2}, 3000)

    //rotate particle system including 3 kinds particles
    var tweenSystemRotation = new TWEEN.Tween({rotation:0})
        .to({rotation:Math.PI*2}, 9000)

    //scale routine group from 0 to 1
    var tweenRoutine = new TWEEN.Tween({scale:0, opacity:0})
        .to({scale:1, opacity:0.1}, 5000)

    //scale routine group from 0 to 1
    var tweenCamera = new TWEEN.Tween({scale:1, rotation:0, xCamera:1500, yCamera:600, zCamera:1000})
        .to({scale:2, rotation:Math.PI*2, xCamera:400, yCamera:1300, zCamera:300}, 4000)

    var tweenExploreButton = new TWEEN.Tween({opacity:0})
        .to({opacity:0.7}, 1000)

    var onUpdateExploreButton = function() {
        var opacity = this.opacity

        document.getElementById('explore').style.visibility = 'visible'
        document.getElementById('explore').style.opacity = opacity
    }

    // tween.chain(tweenUp)
    var onUpdateCamera = function() {
        var rotation = this.rotation
        var scale = this.scale
        var xCamera = this.xCamera
        var yCamera = this.yCamera
        var zCamera = this.zCamera

        particleSystem.rotation.y = rotation
        particleSystem.scale.x = scale
        particleSystem.scale.z = scale

        camera.position.x = xCamera
        camera.position.y = yCamera
        camera.position.z = zCamera
    }

    var onUpdateSpot = function() {
        var y = this.y
        var scale = this.scale

        spotParticles.position.y = y
        spotParticles.scale.x = scale
        spotParticles.scale.z = scale
    }

    var onUpdateSpotRotation = function() {
        var rotation = this.rotation

        // spotParticles.rotation.y = rotation
    }

    var onUpdateShop = function() {
        var y = this.y
        var scale = this.scale
        // console.log(y)
        shopParticles.position.y = y
        shopParticles.scale.x = scale
        shopParticles.scale.z = scale
    }

    var onUpdateShopRotation = function() {
        var y = this.y
        var rotation = this.rotation
        // console.log(y)
        shopParticles.position.y = y
        // shopParticles.rotation.y = rotation
    }

    var onUpdateSite = function() {
        var y = this.y
        var scale = this.scale
        // console.log(y)
        siteParticles.position.y = y
        siteParticles.scale.x = scale
        siteParticles.scale.z = scale
    }

    var onUpdateSiteRotation = function() {
        var y = this.y
        var rotation = this.rotation
        // console.log(y)
        siteParticles.position.y = y
        // siteParticles.rotation.y = rotation
    }

    var onUpdateSystemRotation = function() {
        var rotation = this.rotation
        particleSystem.rotation.y = rotation
    }

    var onUpdateRoutine = function() {
        var scale = this.scale
        var opacity = this.opacity
        routineGroup.scale.y = scale
        routineGroup.material.opacity = opacity
    }


    tweenSpot.onUpdate(onUpdateSpot)
    tweenShop.onUpdate(onUpdateShop)
    tweenSite.onUpdate(onUpdateSite)


    // tweenSpotRotation.onUpdate(onUpdateSpotRotation)
    tweenShopRotation.onUpdate(onUpdateShopRotation)
    tweenSiteRotation.onUpdate(onUpdateSiteRotation)
    tweenSystemRotation.onUpdate(onUpdateSystemRotation)

    tweenRoutine.onUpdate(onUpdateRoutine)
    tweenCamera.onUpdate(onUpdateCamera)

    tweenExploreButton.onUpdate(onUpdateExploreButton)

    tweenSpot.chain(tweenRoutine) //路线逐渐可见
    tweenShop.chain(tweenShopRotation)
    tweenSite.chain(tweenSiteRotation)

    tweenSystemRotation.chain(tweenCamera) //路线绘制之后，继续旋转，整体放大

    tweenCamera.chain(tweenExploreButton) //放大相机视野后，显示转跳按钮

    tweenSpot.start()
    tweenShop.start()
    tweenSite.start()
    tweenSystemRotation.start()
    // tweenRoutine.start()

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

    // render()

    //================================================
    //functions

    function render() {
        // stats.update()

        trackballControls.update(delta)

        TWEEN.update()

        console.log('overview is cycling...')

        animatorIdOverview = window.requestAnimationFrame(render)
        renderer.render(scene, camera)
    }

    window.requestAnimationFrame(render)
    // console.log(animatorId)

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
            var particle = new THREE.Vector3(webPosition[0]-window.innerWidth/2, style.yPosition, webPosition[1] - window.innerHeight/2)
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
                    yPosition = -300
                } else if (addressType == 'B') {
                    yPosition = 0
                } else {
                    yPosition = 300
                }

                var xz = projection([+d.Addr_lng, +d.Addr_lat])
                var xyz = new THREE.Vector3((xz[0]-window.innerWidth/2), yPosition, (xz[1] - window.innerHeight/2))

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
            opacity:0,
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


</script>

<style lang="stylus">
#overview
    background #000
    width 100%
    height 100%

#map-svg
    position absolute
    z-index 10

#webGL-output
    position absolute
    z-index 20
    width 100%
    height 100%

#Stats-output
    position absolute
    z-index 30

.mapShanghai
    stroke #ccc
    stroke-width 2
    stroke-opacity 0.3
    stroke-dasharray: 1 4
    fill none

.expressRoutine
    stroke #999
    stroke-opacity 0.4
    fill none
</style>
