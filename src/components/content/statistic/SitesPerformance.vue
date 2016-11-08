<template>
    <div id="statistic-site">
        <div id="trigger-button-container">
            <div id="trigger-package" class='trigger-button'>
                订单总量
            </div>
            <div id="trigger-delay" class='trigger-button'>
                延误订单
            </div>
        </div>

        <div id="statistic-site-webgl"></div>
    </div>
</template>

<script>
import THREE from 'three'
import TWEEN from 'tween'
import Stats from '../../../static/stats'
import * as d3 from 'd3'
import EventBridge from '../../../static/EventBridge'
import OrbitControls from '../../../static/OrbitControls'
import d33d from '../../../static/d33d'
import { getPersistData } from '../../../vuex/getters'

var transformSVGPathExposed = d33d() //svg提取为threejs所用路径的方法，没有npm库只能自己修改

var devAssetPath = '../../../../projects/tomahawk/asset/'
var deployAssetPath = '../asset/'
var electronDataPath = './projects/tomahawk/asset/'
// var currentAssetPath = electronDataPath //部署阶段切换到部署路径
var currentAssetPath = devAssetPath //部署阶段切换到部署路径

export default  {
    vuex: {
        getters: {
            getPersistData
        },
        actions: {

        }
    },
    data() {
        return {
            animatorId: ''
        }
    },
    methods: {

    },
    computed: {
        // tracedCurrentView: function() {
        //     return ''
        // }
    },
    components: {

    },
    beforeDestroy: function() {
        console.log('component SitesPerformance destory')
        window.cancelAnimationFrame(this.animatorId)
    },
    ready: bootSitesStatistic
}

function hideSwitcher() {
    document.getElementById('switcher').style.visibility = 'hidden'
}

function regListeners() {
    document.getElementById('trigger-delay').addEventListener('click', showDelayBox, false)
    document.getElementById('trigger-package').addEventListener('click', showPackageBox, false)

    function showPackageBox() {
        EventBridge.trigger('showPackageBox')
    }

    function showDelayBox() {
        EventBridge.trigger('showDelayBox')
    }
}

function listenShowDelayEvent() {
    document.getElementById('trigger-delay').addEventListener('click', showDelayBox, false)

    function showDelayBox() {
        EventBridge.trigger('showDelayBox')
    }
}

function listenShowPackageEvent() {
    document.getElementById('trigger-package').addEventListener('click', showPackageBox, false)

    function showPackageBox() {
        EventBridge.trigger('showPackageBox')
    }
}

function bootSitesStatistic() {
    var _self = this

    var persistData = this.getPersistData

    drawSitePerformance(_self, persistData)

    regListeners()
}

function drawSitePerformance(_self, persistData) {
    var shanghaiMapData = persistData[0]
    var siteData = persistData[1]
    var spotData = persistData[2]
    var shopData = persistData[3]
    var scheduleData = persistData[4]
    // console.log(scheduleData)

    var siteScheduleData = scheduleData.filter(d => {
        return d.Addr[0] == 'A'
    })

    var scheduleNestedData = d3.nest()
        .key(d => d.Addr).sortKeys(d3.ascending)
        .rollup(d => {
            return {'penaltyTime':d3.sum(d, e => { return e.Penalty_time }), 'amountPackages':d3.sum(d, e => { return e.Amount })}
        })
        .entries(siteScheduleData)

    console.log(scheduleNestedData)



    // var sitesPackageRollupData = siteNestedData
    //     .rollup(d => {
    //         return {'penaltyTime':d3.sum(d, e => { return e.Penalty_time }), 'amountPackages':d3.sum(d, e => { return e.Amount })}
    //     })

    // console.log(sitesPackageRollupData)

    renderWebGL(_self, 'statistic-site-webgl', siteData, shanghaiMapData)

    hideSwitcher()
}

function renderWebGL(_self, webglContainer, siteData, mapData) {
    //scene
    var scene = new THREE.Scene();
    //===============================================
    //camera
    var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 6000);
    camera.position.x = 800;
    camera.position.y = 600;
    camera.position.z = 600;
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    //===============================================
    //camera view control
    // var trackballControls = new TrackballControls(camera)
    var orbitControls = new THREE.OrbitControls(camera)
    orbitControls.maxPolarAngle = 0.9 * Math.PI / 2
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
    //***********************************************************************
    //***********************************************************************
    //meshes
    var wholeScene = new THREE.Object3D()

    var totalPackageBoxStyle = {
        color:'teal',
        transparent:true,
        opacity:0.5,
        blending: THREE.AdditiveBlending
    }

    var sitesBoxesGroup = generateSitesBoxes(siteData, totalPackageBoxStyle)
    // scene.add(sitesBoxesGroup)
    wholeScene.add(sitesBoxesGroup)

    var delayBoxStyle = {
        color:'deeppink',
        transparent:true,
        opacity:0.5,
        blending: THREE.AdditiveBlending
    }

    var delayBoxesGroup = generateSitesBoxes(siteData, delayBoxStyle)
    wholeScene.add(delayBoxesGroup)

    var mapGround = generateMapGround(mapData)
    // scene.add(mapGround)
    wholeScene.add(mapGround)

    scene.add(wholeScene)
    //===============================================
    //lights
    var ambientLight = new THREE.AmbientLight(0xffffff)
    scene.add(ambientLight);
    //************************************************
    //render scene
    //************************************************
    document.getElementById(webglContainer).appendChild(renderer.domElement)

    window.requestAnimationFrame(render)

    var allBoxVertex = wholeScene.children[0].children
    var delayBoxVertex = wholeScene.children[1].children

    var tweenScaleShowTotalPackage = createTween(0.001, 1, 2000, tweenHandler(allBoxVertex))
    tweenScaleShowTotalPackage.start()

    var tweenScaleInitialDelayBox = createTween(1, 0.001, 10, tweenHandler(delayBoxVertex))
    tweenScaleInitialDelayBox.start()

    EventBridge.listen('showDelayBox', showDelayBox)
    EventBridge.listen('showPackageBox', showPackageBox)

    function render() {
        // trackballControls.update(delta)
        orbitControls.update(delta)

        TWEEN.update()

        // wholeScene.rotation.y += 0.01

        _self.animatorId = window.requestAnimationFrame(render)
        renderer.render(scene, camera)
    }

    function createTween(startIndex, endIndex, timeGap, tweenHandler) {
        var tween = new TWEEN.Tween({yScale:startIndex})
            .to({yScale:endIndex}, timeGap)

        tween.onUpdate(tweenHandler)

        return tween
    }

    function tweenHandler(boxType) {
        return function() {
            var yScale = this.yScale

            boxType.forEach(d => {
                d.scale.y = yScale
            })
        }
    }

    function showDelayBox() {
        var hidePackageTween = createTween(1, 0.001, 1000, tweenHandler(allBoxVertex))
        hidePackageTween.start()

        var showDelayTween = createTween(0.001, 1, 2000, tweenHandler(delayBoxVertex))
        showDelayTween.start()
    }

    function showPackageBox() {
        var hideDelayTween = createTween(1, 0.001, 1000, tweenHandler(delayBoxVertex))
        hideDelayTween.start()

        var showPackageTween = createTween(0.001, 1, 2000, tweenHandler(allBoxVertex))
        showPackageTween.start()
    }

    function generateSitesBoxes(siteData, style) {
        var canvasWidth  = window.innerWidth
        var canvasHeight = window.innerHeight

        var projection = d3.geoMercator()
            .center([121.5, 31.1]) //最终要换成上海的中心坐标
            .scale(40000)
            // .translate([canvasWidth/2, canvasHeight/2]) //渲染容器的中心点

        var sitesBoxesGroup = new THREE.Object3D()

        siteData.forEach(d => {
            var boxHeight = Math.floor(Math.random() * 100 + 10)

            var boxVertexSize = 10
            var boxGeometry = new THREE.BoxGeometry(boxVertexSize, boxHeight, boxVertexSize)
            // console.log(boxGeometry)
            boxGeometry.applyMatrix(new THREE.Matrix4().makeTranslation(0, boxHeight / 2, 0))

            // var boxMaterial = new THREE.MeshPhongMaterial({color:'teal', transparent:true, opacity:0.5, blending: THREE.AdditiveBlending})
            var boxMaterial = new THREE.MeshPhongMaterial(style)

            var box = new THREE.Mesh(boxGeometry, boxMaterial)

            var postionProjected = projection([+d.Lng, +d.Lat])

            box.position.x = postionProjected[0]
            box.position.z = postionProjected[1]

            sitesBoxesGroup.add(box)
        })

        var translateCenterDistance = projection([121.5, 31.1])
        sitesBoxesGroup.translateX(-translateCenterDistance[0])
        sitesBoxesGroup.translateZ(-translateCenterDistance[1])

        return sitesBoxesGroup
    }

    function generateMapGround(mapData) {
        var canvasWidth  = window.innerWidth
        var canvasHeight = window.innerHeight

        var svg = d3.select('#statistic-site')
            .append('svg')
            .attr('id', 'mapGroundSvg')
            .attr('width', canvasWidth)
            .attr('height', canvasHeight)

        var projection = d3.geoMercator()
            .center([121.5, 31.1]) //最终要换成上海的中心坐标
            .scale(40000)
            // .translate([canvasWidth/2, canvasHeight/2]) //渲染容器的中心点

        var path = d3.geoPath()
            .projection(projection)

        var mapPathArr = []

        var mapGroup = new THREE.Object3D()

        svg.append("g")
            .selectAll("path")
            .data(mapData.features)
            .enter()
            .append("path")
            .attr("d", path)
            // .attr('class', 'province')
            .attr('', function(d) {
                mapPathArr.push(path(d))
            })

        // console.log(mapPathArr)
        var mapDistrictColorScale = d3.scaleLinear()
        .domain([0,mapPathArr.length])
        .range(['#666', '#111'])

        mapPathArr.forEach(function(pathString, i) {
            var shape = createMesh(new THREE.ExtrudeGeometry(drawShape(pathString), setOption(i)), mapDistrictColorScale(i))
            shape.rotation.x = (Math.PI / 2)
            // shape.rotation.z = - (Math.PI / 4)

            mapGroup.add(shape)
            // scene.add(shape)
        })

        // 移动到scene中心原点
        var translateCenterDistance = projection([121.5, 31.1])
        mapGroup.translateX(-translateCenterDistance[0])
        mapGroup.translateZ(-translateCenterDistance[1])

        d3.select('#mapGroundSvg').remove()

        return mapGroup


        function setOption(i) {
            var options = {
                amount: 1,
                // bevelThickness: 2,
                // bevelSize: 1,
                // bevelSegments: 3,
                bevelEnabled: false,
                curveSegments: 10,
                steps: 1
            }

            return options
        }

        function drawShape(svgPathString) {
            var shape = transformSVGPathExposed(svgPathString)

            return shape
        }

        function createMesh(geom, color) {
            // var meshMaterial = new THREE.MeshPhongMaterial({color: 0x00cccc * Math.random(), transparent: true, opacity: 0.5})
            var meshMaterial = new THREE.MeshPhongMaterial({color: color, transparent: true, opacity: 0.3})
            // var wireFrameMaterial = new THREE.MeshBasicMaterial({color: 0x999999, wireframe: true})

            // var mesh = THREE.SceneUtils.createMultiMaterialObject(geom, [meshMaterial, wireFrameMaterial])

            var mesh = new THREE.Mesh(geom, meshMaterial)

            // mesh.scale.x = 0.03
            // mesh.scale.y = 0.03

            return mesh
        }
    }

}
</script>

<style lang="stylus">
#statistic-site
    position absolute

#trigger-button-container
    position absolute
    top 70px
    right 20px

.trigger-button
    font-family 'Microsoft Yahei' Arial
    color #ccc
    font-size 12px
    font-weight bold
    padding-top 10px
    padding-bottom 10px
    padding-left 37px
    padding-right 37px
    margin-bottom 5px
    /*border-radius 5px*/
    border 1px solid #999

.trigger-button:hover
    background #333
    cursor pointer

</style>
