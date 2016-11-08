<template>
    <div id="statistic">
        <div id="performanceSwitchMenuContainer">
            <div class="performanceSwitchMenu" v-for='menu in menuConfig' v-bind:class="{ 'actived': menu.contentWrapperView == tracedCurrentView }"  @click='switchPerformanceView(menu)'>
                {{ menu.menuName }}
            </div>
        </div>

        <component :is='tracedCurrentView' transition="fade" transition-mode="out-in" keep-alive></component>

        <div id="statistc-map-svg"></div>
        <legend-bar></legend-bar>
        <div id="routine-detail">
            <div id="routine-detail-close" @click='closeRoutineDetail'>X</div>
        </div>
    </div>
</template>

<script>
// import THREE from 'three'
import * as d3 from 'd3'
import { getPersistData } from '../../../vuex/getters'
// import { getAnimatorId } from '../../../vuex/getters'
// import Stats from '../../../static/stats'
// import TrackballControls from '../../../static/TrackballControls'
import LegendBar from '../../navbar/LegendBar.vue'

import SitesPerformance from './SitesPerformance.vue'
import CourierPerformance from './CourierPerformance.vue'

var devAssetPath = '../../../../projects/tomahawk/asset/'
var deployAssetPath = '../asset/'
var currentAssetPath = devAssetPath //部署阶段切换到部署路径
var electronDataPath = './projects/tomahawk/asset/'
// var currentAssetPath = electronDataPath //部署阶段切换到部署路径

export default {
    vuex: {
        getters: {
            getPersistData
        },
        actions: {

        }
    },
    data() {
        return {
            menuConfig: [
                {
                    menuName: '站点',
                    contentWrapperView: 'SitesPerformance',
                    actived: true
                },
                {
                    menuName: '员工',
                    contentWrapperView: 'CourierPerformance',
                    actived: false
                }
            ],
            currentPerformanceViewer: 'SitesPerformance',
            worstList:''
        }
    },
    methods: {
        switchPerformanceView,
        computerWorstList,
        clickList,
        clickRoutineDetail,
        closeRoutineDetail,
        persisteNestedData,
        drawRoutineDetail
    },
    computed: {
        tracedCurrentView: function() {
            // return 'SitesPerformance'
            return this.currentPerformanceViewer
        }
    },
    components: {
        LegendBar,
        SitesPerformance,
        CourierPerformance
    },
    route: {
        activate: function (transition) {
            console.log('statistic activated!')
            transition.next()
        },
        deactivate: function (transition) {
            console.log('statistic deactivated!')
            this.closeRoutineDetail() //close the routine detail in case user not close while switch
            transition.next()
        }
    },
    ready: bootStatistic
}

function bootStatistic() {
    // console.log(this.getPersistData)
    this.nestedData = this.getPersistData
    console.log(this.nestedData)
    var _self = this
    initReload()
    // drawStatistic(_self)
}

function switchPerformanceView(menu) {
    this.currentPerformanceViewer = menu.contentWrapperView
}

function computerWorstList(listWanted) {
    this.worstList = listWanted
}

function clickList(listKey) {
    d3.selectAll('path.expressRoutine').classed('hightBadRoutine', false)
    d3.select('path#' + listKey).classed('hightBadRoutine', true)
}

function clickRoutineDetail(routine) {
    console.log(routine)
}

function closeRoutineDetail() {
    document.getElementById('routine-detail').style.visibility = 'hidden'
}

function showRoutineDetail() {
    document.getElementById('routine-detail').style.visibility = 'visible'
}

function persisteNestedData(nestedData) {
    this.nestedData = nestedData
}

function initReload() {
    document.getElementById('nav-bar').style.visibility = 'visible'
    d3.select('#loading').remove()
    d3.select('#circles').remove()
}

function hideSwitcher() {
    document.getElementById('switcher').style.visibility = 'hidden'
}

function drawStatistic(_self) {
    // var shanghaiMapData = allData[0]
    // var siteData = allData[1]
    // var spotData = allData[3]
    // var shopData = allData[2]
    // var scheduleData = allData[4]

    var canvasWidth  = window.innerWidth
    var canvasHeight = window.innerHeight

    var projection = d3.geoMercator()
        // .center([121.3, 31.1]) //最终要换成上海的中心坐标
        .center([121.52, 31.08]) //最终要换成上海的中心坐标
        .scale(40000)
        .translate([canvasWidth/2, canvasHeight/2]) //渲染容器的中心点

    // var zoom = d3.zoom()
    //     .scaleExtent([1, 10])
    //     .on("zoom", zoomed)

    // var drag = d3.drag()
    //     // .origin(function(d) { return d })
    //     // .on("dragstart", dragstarted)
    //     .on("drag", dragged)
    //     .on("dragend", dragended)

    var svg = d3.select("#statistc-map-svg").append("svg")
        .attr("width", canvasWidth)
        .attr("height", canvasHeight)

    var g = svg.append("g")

    // g.attr('transform', 'translate(-100, 0)')

    svg.append("rect")
        .attr("width", canvasWidth)
        .attr("height", canvasHeight)
        .style("fill", "none")
        .style("pointer-events", "all")
        .call(d3.zoom()
        .scaleExtent([1 / 2, 4])
        .on("zoom", zoomed))

    if(_self.getPersistData) {
        renderStaticMap(_self.getPersistData)
    } else {
        asyRenderStaticMap()
    }

    function asyRenderStaticMap() {
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
                var scheduleNestedData = d3.nest()
                    .key(d => d.Courier_id).sortKeys(d3.ascending)
                    .entries(scheduleData)

                var scheduleRollupData = d3.nest()
                    .key(d => d.Courier_id).sortKeys(d3.ascending)
                    .rollup(d => {
                        return {'penaltyTime':d3.sum(d, e => { return e.Penalty_time }), 'amountPackages':d3.sum(d, e => { return checkPackageAmount(e.Amount) })}
                    })
                    .entries(scheduleData)

                scheduleRollupData.sort((d,e) => {
                    return d.value.penaltyTime < e.value.penaltyTime ? 1: -1
                })

                var worstList = scheduleRollupData.slice(0, 50)
                _self.computerWorstList(worstList)

                drawShanghaiMap(g, shanghaiMapData, projection)

                drawRoutineSeries(g, scheduleNestedData, projection)

                drawCircles(g, spotData, projection, {radius:1, color:'springgreen'})
                drawCircles(g, shopData, projection, {radius:2, color:'orange'})
                drawCircles(g, siteData, projection, {radius:3, color:'red'})

                hideSwitcher()

                document.getElementById('worst-list').style.visibility = 'visible'
            })
    }

    function renderStaticMap(persistData) {
        var shanghaiMapData = persistData[0]
        var siteData = persistData[1]
        var spotData = persistData[2]
        var shopData = persistData[3]
        var scheduleData = persistData[4]

        var scheduleNestedData = d3.nest()
            .key(d => d.Courier_id).sortKeys(d3.ascending)
            .entries(scheduleData)

        // console.log(scheduleNestedData)

        _self.persisteNestedData(scheduleNestedData)
        // console.log(_self.nestedData)

        // drawRoutineDetail('routine-detail', scheduleNestedData[4])

        var scheduleRollupData = d3.nest()
            .key(d => d.Courier_id).sortKeys(d3.ascending)
            .rollup(d => {
                return {'penaltyTime':d3.sum(d, e => { return e.Penalty_time }), 'amountPackages':d3.sum(d, e => { return checkPackageAmount(e.Amount) })}
            })
            .entries(scheduleData)

        scheduleRollupData.sort((d,e) => {
            return d.value.penaltyTime < e.value.penaltyTime ? 1: -1
        })
        // console.log(scheduleRollupData)

        var worstList = scheduleRollupData.slice(0, 50)
        // console.log(worstList)
        _self.computerWorstList(worstList)

        drawShanghaiMap(g, shanghaiMapData, projection)

        drawRoutineSeries(g, scheduleNestedData, projection)

        drawCircles(g, spotData, projection, {radius:1, color:'springgreen'})
        drawCircles(g, shopData, projection, {radius:2, color:'orange'})
        drawCircles(g, siteData, projection, {radius:3, color:'red'})

        hideSwitcher()

        document.getElementById('worst-list').style.visibility = 'visible'
    }

    function zoomed() {
        g.attr("transform", d3.event.transform);
    }

    function checkPackageAmount(d) {
        if (+d > 0) {
            return +d
        } else {
            return 0
        }
    }
}

function drawRoutineSeries(svg, scheduleNestedData, projection) {
    var line = d3.line()
        .x(d => { return projection([+d.Addr_lng, +d.Addr_lat])[0] })
        .y(d => { return projection([+d.Addr_lng, +d.Addr_lat])[1] })
        .curve(d3.curveStepAfter)

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
        .attr('id', d => { return d.key })
        // .attr('onmouseover', d => { console.log(d) })

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

function drawRoutineDetail(routingId) {
    showRoutineDetail() //显示详情框
    console.log(this.nestedData)
    var routineDataArray = this.nestedData.filter(d => { return d.key == routingId })[0].values

    var canvasWidth  = 760
    var canvasHeight = 560
    var margin = 20

    if(d3.select('svg#routineDetailSvg')) {
        d3.select('svg#routineDetailSvg').remove()
    }

    var svg = d3.select("#routine-detail").append("svg")
        .attr("width", canvasWidth)
        .attr("height", canvasHeight)
        .attr('id', 'routineDetailSvg')

    var g = svg.append('g').attr('transform', 'translate(20, 40)')
    var timeGapGroup = svg.append('g').attr('transform', 'translate(20, 20)')

    var routineNum = routineDataArray.length
    var unitHeight = Math.floor(canvasHeight / routineNum) //单位高度
    var totalTimeLength = +routineDataArray[routineNum - 1].Departure
    var unitWidth = canvasWidth / totalTimeLength //单位元宽度

    var totalTimeHours = Math.ceil(totalTimeLength / 60)
    // console.log(totalTimeHours)

    var timeGapsArray = computerTimeGaps(totalTimeHours)
    console.log(timeGapsArray)

    if(d3.select('.mouseTooltip')) {
        d3.select('.mouseTooltip').remove()
    }

    var mouseTooltip = createMouseTooltip('mouseTooltip')

    timeGapGroup.selectAll('text.scheduleRoutineTimeGapText')
        .data(timeGapsArray)
        .enter()
        .append('text')
        .attr('x', (d,i) => {
            var unitX = (canvasWidth - margin * 2) / timeGapsArray.length
            return i * unitX + (unitX / 2)
        })
        .attr('y', 20)
        .text(d => { return d })
        .style('stroke', '#999')

    g.selectAll('rect.scheduleRoutine')
        .data(routineDataArray)
        .enter()
        .append('rect')
        .attr('width', (d,i) => {
            return computerBlockWidth(d, i, routineDataArray)
        })
        .attr('height', unitHeight)
        .attr('y', (d,i) => { return i*unitHeight })
        .attr('x', (d,i) => {
            return computerBlockXPosition(d, i, routineDataArray, unitWidth)
        })
        .attr('class', 'scheduleRoutine')
        .style('fill', d => {
            if(+d.Penalty_time > 0) {
                return '#F4BB4E'
            } else {
                return '#4EBD72'
            }
        })
        .style('fill-opacity', 0.8)
        .on('mouseover', d => {
            console.log(d)
            showMouseTooltip(mouseTooltip, d)
        })
        .on('mouseout', d => {
            hideMouseTooltip(mouseTooltip)
        })

    function computerTimeGaps(hours) {
        var timeGapsArray = []

        if (hours <= 16) {
            for (var i = 0; i < hours; i++) {
                timeGap = 8 + i
                timeGap += ':00'
                timeGapsArray.push(timeGap)
            }
        } else if (hours > 16) {
            for (var i = 0; i < hours; i+=2) {
                var timeGap

                if(i <= 16) {
                    timeGap = 8 + i
                    timeGap += ':00'
                } else if(i > 16 && i <= 40) {
                    timeGap = 8 + i -24
                    timeGap += ':00'
                } else if(i > 40) {
                    timeGap = 8 + i -48
                    timeGap += ':00'
                }

                timeGapsArray.push(timeGap)
            }
        }

        // for (var i = 0; i < hours; i++) {
        //     var timeGap
        //
        //     if(i <= 16) {
        //         timeGap = 8 + i
        //         timeGap += ':00'
        //     } else if(i > 16 && i <= 40) {
        //         timeGap = 8 + i -24
        //         timeGap += ':00'
        //     } else if(i > 40) {
        //         timeGap = 8 + i -48
        //         timeGap += ':00'
        //     }
        //
        //     timeGapsArray.push(timeGap)
        // }

        return timeGapsArray
    }

    function computerBlockWidth(d, i, routineDataArray) {
        var lastDeparture

        if(i == 0) {
            lastDeparture = 0
        } else {
            lastDeparture = +routineDataArray[i-1].Departure
        }

        var departureTime = +d.Departure
        var arrivalTime = +d.Arrival_time

        // var costTime = departureTime - arrivalTime
        var costTime = departureTime - lastDeparture

        var width = costTime * unitWidth

        if(width <= 0) {
            return 0
        } else {
            // return Math.floor(width)
            return width
        }
    }

    function computerBlockXPosition(d, i, routineDataArray, unitWidth) {
        var lastDeparture

        if(i == 0) {
            lastDeparture = 0
        } else {
            lastDeparture = +routineDataArray[i-1].Departure
        }

        return lastDeparture * unitWidth
    }
}

// start mouse tooltip ===========================

function createMouseTooltip(styleClass) {
    var mouseTooltip = d3.select("body")
        .append("div")
        .attr("class", styleClass)
        // .style("opacity", 0);

    return mouseTooltip;
}

//出现提示框
function showMouseTooltip(mouseTooltip, d) {
    // mouseTooltip.style("opacity", 1)
    mouseTooltip.style("visibility", 'visible')
        .style('z-index', 1201);

    mouseTooltip.html(generateMouseTooltipContent(d))
        // .style("left", (d3.event.pageX) + "px")
        // .style("top", (d3.event.pageY) + "px");
        .style("left", (window.event.clientX + document.body.scrollLeft - document.body.clientLeft) + "px")
        .style("top", (window.event.clientY + document.body.scrollTop  - document.body.clientTop) + "px")
}

// 隐藏提示框
function hideMouseTooltip(mouseTooltip) {
    // mouseTooltip.style("opacity", 0);
    mouseTooltip.style("visibility", 'hidden')
}

//start 生成提示框内容
function generateMouseTooltipContent (d) {
    var htmlContent = '';

    htmlContent += "<div>订单编号： " + d.Order_id + "</div>"
    htmlContent += "<div>配送地址： " + d.Addr + "</div>"
    htmlContent += "<div>到达时间： " + computerTime(d.Arrival_time) + "</div>"
    htmlContent += "<div>离开时间： " + computerTime(d.Departure) + "</div>"
    htmlContent += "<div>罚时计算： " + (+d.Penalty_time/60).toFixed(1) + "小时</div>"

    return htmlContent;

    function computerTime(rawTime) {
        var totalTime = +rawTime
        var totalHours = Math.floor(totalTime/60)
        var minuts = totalTime % 60
        var formatHour

        var formatTime

        if (totalHours <= 16) {
            formatHour = 8 + totalHours
        } else if (totalHours > 16) {
            formatHour = 8 + totalHours -24
        }

        formatTime = formatHour + ':' + minuts

        return formatTime
    }
}
</script>

<style lang="stylus">
#statistc-map-svg
    z-index 301

#performanceSwitchMenuContainer
    z-index 311
    position absolute
    top 20px
    right 20px

.performanceSwitchMenu
    font-size 16px
    /*font-weight bold*/
    color #ccc
    display inline-block
    padding-top 5px
    padding-bottom 5px
    padding-left 15px
    padding-right 15px
    /*background #333*/
    border 1px solid #ccc

.performanceSwitchMenu:hover
    cursor pointer
    background #666

.performanceSwitchMenu.actived
    background #666

#routine-detail
    z-index 611
    position absolute
    border-radius 2px
    /*居中*/
    top 50%
    left 50%
    transform: translate(-50%, -50%)
    width 800px
    height 600px
    background #ccc
    opacity 0.95
    overflow auto
    visibility hidden

#routine-detail-close
    position absolute
    top 5px
    right 5px
    width 20px
    height 20px
    background #bbb
    text-align center
    font-size 12px
    color #999
    line-height 20px

#routine-detail-close:hover
    background brown
    color white
    cursor pointer

#worst-list
    z-index 303
    position absolute
    right 0
    top 0
    width 250px
    height 100%
    /*padding-left 10px*/
    background #333
    opacity 0.5
    overflow auto
    visibility hidden

#worst-list:hover
    /*cursor pointer*/

#list-title
    color white
    padding-top 10px
    padding-bottom 10px
    padding-left 10px
    font-size 18px
    font-weight bold
    color aqua

.list-row-name
    color white
    padding-top 10px
    padding-bottom 10px
    font-size 14px
    font-weight bold

#list-row-container
    width 100%

.list-row:nth-child(odd)
    background #444

.list-row
    position relative
    color white
    width 100%
    padding-top 10px
    padding-bottom 10px
    font-size 14px

.list-row:hover
    background #00cccc
    opacity 0.9

.row-bt
    display inline-block
    cursor pointer
    width 15%
    padding-left 10px

.row-head
    display inline-block
    width 20%

.row-time
    display inline-block
    width 25%

.row-amount
    display inline-block
    width 25%
    text-align right

.expressRoutine
    stroke #999
    stroke-opacity 0.2
    fill none

.hightBadRoutine
    stroke-width 3px
    stroke red
    stroke-opacity 0.8
    fill none

.mouseTooltip
    position absolute
    padding 10px
    padding-top 15px
    padding-bottom 15px
    background-color white
    color #666
    font-size 12px
</style>
