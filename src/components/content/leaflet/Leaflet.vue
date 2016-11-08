<template>
    <div id="leaflet">
        <div id="leaflet-monitor">
            <div id="leafletMonitorClose" @click="closeLeafletMonitor">X</div>
        </div>
        <div id="leaflet-map"></div>
    </div>
</template>

<script>
// import THREE from 'three'
// import $ from 'jquery'
import * as d3 from 'd3'
// import { getPersistData } from '../../../vuex/getters'
import { getStaticAssetPath } from '../../../vuex/getters'
// import Stats from '../../../static/stats'
// import TrackballControls from '../../../static/TrackballControls'
import leaflet from 'leaflet'
// import leafletcluster from '../../../static/leafletcluster'
import markercluster from 'leaflet.markercluster'

require('../../../static/leaflet.css')
require('../../../static/leafletMarkerCluster.css')


var devAssetPath = '../../../../projects/tomahawk/asset/'
var deployAssetPath = '../asset/'
var electronDataPath = './projects/tomahawk/asset/'
var currentAssetPath = devAssetPath //部署阶段切换到部署路径
// var currentAssetPath = electronDataPath //部署阶段切换到部署路径

export default {
    vuex: {
        getters: {
            // getPersistData
            getStaticAssetPath
        },
        actions: {

        }
    },
    methods: {
        closeLeafletMonitor,
        triggerMonitor
    },
    ready: bootLeaflet
}

function bootLeaflet() {
    var _self = this
    initReload()

    drawLeaflet(_self)

    loadMonitorVideo(_self)
}

function initReload() {
    document.getElementById('nav-bar').style.visibility = 'visible'
    d3.select('#loading').remove()
    d3.select('#circles').remove()
}

function hideSwitcher() {
    document.getElementById('switcher').style.visibility = 'hidden'
}

function loadMonitorVideo(_self) {
    var monitorVideoSrc = _self.getStaticAssetPath + 'logistic.mp4'

    var videoContainer = document.getElementById('leaflet-monitor')

    var monitorElement =document.createElement('video')
    monitorElement.src = monitorVideoSrc
    monitorElement.autoplay = 'autoplay'
    monitorElement.loop = 'loop'

    videoContainer.appendChild(monitorElement)
}

function triggerMonitor() {
    console.log('trigger')
    document.getElementById('leaflet-monitor').style.visibility = 'visible'
}

function closeLeafletMonitor(e) {
    e.preventDefault()
    // console.log('close monitor trigger')
    document.getElementById('leaflet-monitor').style.visibility = 'hidden'
}

function drawLeaflet(_self) {
    // console.log(leafletcluster)

    // var viewCenter = [30.9,121.5];
    var viewCenter = [31.1,121.38];
    var mapScale = 10;
    var maxZoom = 14;
    // var mapStyle = 'http://{s}.tile.osm.org/{z}/{x}/{y}.png';
    var mapStyle = 'http://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
    var mapAttribution = '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors';

    var map = L.map('leaflet-map').setView(viewCenter, mapScale);
    L.tileLayer(mapStyle, {attribution: mapAttribution,  maxZoom: maxZoom}).addTo(map);

    map.on('popupopen', function() {
        var leafletMonitorButton = document.getElementById('leafletMonitor')
        leafletMonitorButton.addEventListener('click', function() {
            console.log('gogo popup')
            // document.getElementById('leaflet-monitor').style.visibility = 'hidden'
            triggerMonitor()
        }, false)

        // var vrMonitorButton = document.getElementById('vrMonitor')
        // vrMonitorButton.addEventListener('click', function() {
        //     console.log('vrrrrrrrrrrrrrrr')
        // }, false)

    })

    d3.queue()
        // .defer(d3.csv, currentAssetPath + 'data/site.csv')
        // .defer(d3.csv, currentAssetPath + 'data/spot.csv')
        // .defer(d3.csv, currentAssetPath + 'data/shop.csv')
        .defer(d3.csv, _self.getStaticAssetPath + 'site.csv')
        .defer(d3.csv, _self.getStaticAssetPath + 'spot.csv')
        .defer(d3.csv, _self.getStaticAssetPath + 'shop.csv')
        .await(function(error, siteData, spotData, shopData) {
            var nestLocationData = []
            var keyList = ['site', 'spot', 'shop']
            var dataList = [siteData, spotData, shopData]

            dataList.forEach(function(d, i) {
                var obj = {}
                obj.key = keyList[i]
                obj.values = d
                nestLocationData.push(obj)
            })

            // console.log(nestLocationData);

            // 自定义图标
            var LeafIcon = L.Icon.extend({
                    options: {
                        iconSize:     [30, 40],
                        iconAnchor:   [15, 20],
                        popupAnchor:  [0, -30]
                    }
                });
            var iconSet = [];
            // iconSet['site'] = new LeafIcon({iconUrl: currentAssetPath + 'image/dead.png'});
            // iconSet['shop'] = new LeafIcon({iconUrl: currentAssetPath + 'image/hurt.png'});
            // iconSet['spot'] = new LeafIcon({iconUrl: currentAssetPath + 'image/damage.png'});

            iconSet['site'] = new LeafIcon({iconUrl: _self.getStaticAssetPath + 'dead.png'});
            iconSet['shop'] = new LeafIcon({iconUrl: _self.getStaticAssetPath + 'hurt.png'});
            iconSet['spot'] = new LeafIcon({iconUrl: _self.getStaticAssetPath + 'damage.png'});

            var markersClusters = [];


            nestLocationData.forEach(function(d, i) {
                // 定义每组的坐标组
                markersClusters[i] = defineCluster(d.key);
                // 根据坐标类型选择图片
                var iconPath = iconSet[d.key];
                // console.log(markersClusters[i]);
                d.values.forEach(function(k) {
                    // console.log(k.time);
                    // 根据坐标类型选择图片
                    // var iconPath = iconSet[k.accident];
                    // console.log(k);
                    // 定义每个坐标
                    defineMarker(d.key, k, markersClusters[i], iconPath);
                });
                // 添加一组坐标
                map.addLayer(markersClusters[i]);
            });

            hideSwitcher() //hide the data loading hints

            //创建分组函数
            function defineCluster(clusterCss) {
                var clusterObj = {};
                clusterObj.maxClusterRadius = 100;
                clusterObj.iconCreateFunction = function (cluster) {
                    var childCount = cluster.getChildCount();

                    var c = clusterCss;
                    if (childCount < 10) {
                        c += '-small';
                    } else if (childCount < 30) {
                        c += '-medium';
                    } else {
                        c += '-large';
                    }

                    return new L.DivIcon({ html: '<div><span>' + childCount + '</span></div>', className:'marker-cluster ' + c, iconSize: new L.Point(40, 40) });
                }

                return L.markerClusterGroup(clusterObj);
            }
            //定义单个标点函数
            function defineMarker(dataType, d, cluster, markerIcon) {
                var locationType

                if (dataType == 'site') {
                    locationType = '网点'
                } else if (dataType == 'spot') {
                    locationType = '配送点'
                } else {
                    locationType = 'O2O商家'
                }

                var monitorIcon ='<input type="button" value="启动监控" id="leafletMonitor">'
                var vrMonitor ='<input type="button" value="虚拟现场" id="vrMonitor">'

                // var title = '类型：' + locationType + '<br>' + '编号：' + (d.Site_id || d.Shop_id || d.Spot_id) + '<br>' + monitorIcon  + '<br>' + vrMonitor

                var title = '类型：' + locationType + '<br>' + '编号：' + (d.Site_id || d.Shop_id || d.Spot_id) + '<br>' + monitorIcon

                var marker = L.marker(new L.LatLng(+d.Lat, +d.Lng), { title: title,  icon: markerIcon});

                marker.bindPopup(title);
                cluster.addLayer(marker);

                // playMonitorVideo()
            }

            // function playMonitorVideo() {
            //     var monitorVideoSrc = currentAssetPath + 'image/logistic.mp4'
            //
            //     var monitorElement =document.createElement('video')
            //     monitorElement.src = monitorVideoSrc
            //     monitorElement.autoplay = 'autoplay'
            //     monitorElement.loop = 'loop'
            //
            //     document.body.appendChild(monitorElement)
            // }

        })
}

</script>

<style lang="stylus">
#leaflet-map
    position absolute
    z-index 401
    width 100%
    height 100%

#leafletMonitor
    margin-top 10px

#monitorContainer
    /*z-index 421*/

#leaflet-monitor
    visibility hidden
    position absolute
    right 5px
    top 5px
    z-index 421
    border white solid 2px
    margin-bottom -5px

#leafletMonitorClose:hover
    background brown
    color white
    cursor pointer

#leafletMonitorClose
    position absolute
    top 0px
    right 0px
    z-index 425
    width 20px
    height 20px
    background #999
    text-align center
    font-size 12px
    color #fff
    line-height 20px

.leaflet-control-zoom
    opacity 0

#vrMonitor
    margin-top 10px

</style>
