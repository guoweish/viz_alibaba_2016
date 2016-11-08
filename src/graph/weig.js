//****************************************************
// Created by Guo wei with MIT license
// Email: guoweish@163.com
// website: http://guoweish.github.io
// github: github.com/guoweish
//****************************************************
// ***********API reference:**************
//+++++++++++++++++++++++++++++++++++++
// ini:// 初始化绘图环境
// --createSvg // 函数: 创建svg画布
// --getViewportSize // 获取绘图容器尺寸
// --createMouseTooltip //创建鼠标经过目标图形，出现div信息框
//+++++++++++++++++++++++++++++++++++++
// draw:
// --circle
// --rect
// --arc
// --line
// --text
// --arrow
//+++++++++++++++++++++++++++++++++++++
// magic:
// --shadowFilter
// --blurFilter
//+++++++++++++++++++++++++++++++++++++
// utils:
// --isEmptyObject
//+++++++++++++++++++++++++++++++++++++
// data:
// --addIndexOfForceData
//+++++++++++++++++++++++++++++++++++++
// graph:
// --line
// --bubble
// --bar
// --pie
//+++++++++++++++++++++++++++++++++++++
//layout
// --radar
//****************************************************
//****************************************************
// import d3 from 'd3'
import * as d3 from 'd3'

// 初始化绘图环境
var ini = {
    createSvg : createSvg, // 函数: 创建svg画布
    getViewportSize: getViewportSize, // 获取绘图容器尺寸
    createMouseTooltip : createMouseTooltip,//创建鼠标经过目标图形，出现div信息框
    getDivWidthHeight : getDivWidthHeight
}

var draw = {
    circle : circle,
    rect : rect,
    arc : arc,
    line : line,
    text : text,
    arrow : arrow
}

var magic = {
    shadowFilter : shadowFilter,
    blurFilter : blurFilter
}

var utils = {
    isEmptyObject : isEmptyObject
}

var data = {
    addIndexOfForceData : addIndexOfForceData
}

var graph = {
    // line : line,
    // bubble : bubble,
    // bar : bar,
    // pie : pie
}

var layout = {
    force : force
}

var widgets = {
    crateZoomToolPanel : crateZoomToolPanel
}

export default {
    ini : ini,
    draw : draw,
    magic : magic,
    utils : utils,
    data: data,
    graph : graph,
    layout : layout,
    widgets : widgets
}

// ########################################################
// ########################################################
// ********************************************************
// 初始化绘图环境
// ********************************************************
// 函数: 创建svg画布
// container: svg挂载点
// svgConfig: svg设置
function createSvg (containerId, svgConfig) {
    // 默认svg挂载点为body
    var divId = '#' + containerId
    var container = d3.select(divId)|| d3.select('body')

    var svg = container.append('svg')

    var divWidthHeight = getDivWidthHeight (containerId)

    if (divWidthHeight.height != 0 && divWidthHeight.width != 0) {
        // 如果容器div有css设置高度，优先自定义svg，次优div设置
        var svgConfig = svgConfig || divWidthHeight
    } else {
        // // 如果容器div不存在css设置高度，优先自定义svg，次优先默认高400宽400
        var svgConfig = svgConfig || { width: 400, height: 400};
    }

    // // // 如果容器div不存在css设置高度，优先自定义svg，次优先默认高400宽400
    // var svgConfig = svgConfig || { width: 400, height: 300}

    svg.attr('width', svgConfig.width)
        .attr('height', svgConfig.height)

    return svg
}
// ********************************************************
// 获取绘图容器尺寸
function getViewportSize (w) {
    var w = w || window;
    if (w.innerWidth != null) {
        return {
            width: w.innerWidth,
            height: w.innerHeight,
            // clientWidth: w.clientWidth,
            // clientHeight: w.clientHeight,
            xPageOffset: w.pageXOffset,
            yPageOffset: w.pageYOffset
        }
    }
}
// ********************************************************
// start 获取div宽度高度
function getDivWidthHeight (divId) {
    var height = document.getElementById(divId).offsetHeight
    var width = document.getElementById(divId).offsetWidth

    return {
        'height': height,
        'width': width
    }
}
// end 获取div宽度高度
// ********************************************************
// 创建鼠标经过目标图形，出现div信息框
// styleClass: div样式
function createMouseTooltip (styleClass) {
    var mouseTooltip = d3.select("body")
        .append("div")
        .attr("class", styleClass)
        .style("opacity", 0);

    return mouseTooltip;
}

// ########################################################
// ########################################################
// ********************************************************
// 绘制基本图形
// ********************************************************
// 创建圆形
// container: 挂载点
// circleConfig: 绘制参数
function circle (container, circleConfig) {
    var g = container.append('g');

    var circleConfig = circleConfig || { r: 100, cx: 0, cy: 0, styleClass: ''};

    var circle = g.append('circle')
        .attr('r', circleConfig.r)
        .attr('cx', circleConfig.cx)
        .attr('cy', circleConfig.cy);

    if (circleConfig.styleClass) {
        circle.attr('class', circleConfig.styleClass);
    }

    return circle;
}
// end 创建圆形

// ********************************************************
// 创建长方形
// container: 挂载点
// rectConfig: 绘制参数
function rect (container, rectConfig) {
    var g = container.append('g');

    var rectConfig = rectConfig || { width: 100, height: 100, x: 0, y: 0, styleClass: ''};

    var rect = g.append('rect')
        .attr('width', rectConfig.width)
        .attr('height', rectConfig.height)
        .attr('x', rectConfig.x)
        .attr('y', rectConfig.y);

    if (rectConfig.styleClass) {
        rect.attr('class', rectConfig.styleClass);
    }

    return rect;
}
// end 创建长方形

// ********************************************************
// 创建文本
// container: 挂载点
// rectConfig: 绘制参数
function text (container, textConfig) {
    var g = container.append('g');

    var textConfig = textConfig || {x: 0, y: 0, styleClass: '', content: 'text place holder'};

    var text = g.append('text')
        .attr('x', textConfig.x)
        .attr('y', textConfig.y)
        .text(textConfig.content);

    if (textConfig.styleClass) {
        text.attr('class', textConfig.styleClass);
    }

    return text;
}
// end 创建文本

// ********************************************************
// 创建直线
// container: 挂载点
// rectConfig: 绘制参数
function line (container, lineConfig) {
    var g = container.append('g');

    var lineConfig = lineConfig || {x1: 0, y1: 0, x2: 100, y2: 0, styleClass: ''};

    var line = g.append('line')
        .attr('x1', lineConfig.x1)
        .attr('y1', lineConfig.y1)
        .attr('x2', lineConfig.x2)
        .attr('y2', lineConfig.y2);

    if (lineConfig.styleClass) {
        line.attr('class', lineConfig.styleClass);
    }

    return line;
}
// end 创建直线

// ********************************************************
// 弧线连线
function arc (d) {
    var dx = d.x2 - d.x1;
    var dy = d.y2 - d.y1;
    var dr = Math.sqrt(dx * dx + dy * dy);

    return "M" + d.x1 + "," + d.y1 + "A" + dr + "," + dr + " 0 0,1 " + d.x2 + "," + d.y2;
}
// end 弧线连线

// ********************************************************
// 绘制箭头
//case:
// var arrowConfig = {
//     id: 'arrow',
//     path: "M0,0 L4,2 L0,4 L0,0",
//     markerUnits: 'strokeWidth',
//     markerWidth: 4,
//     markerHeight: 4,
//     viewBox: "0 0 4 4",
//     refX: 6,
//     refY: 1,
//     orient: 'auto'
// }
// var arrow_path = "M0,0 L4,2 L0,4 L0,0";
// var arrow = arrow(svg, "arrow", "#2fafc6", arrow_path);
function arrow (svg, color, arrowConfig) {
    var arrow_path = arrow_path || "M0,0 L4,2 L0,4 L0,0";

    var svg = svg || d3.select('svg');

    var defsG = svg.append('g');
    var defs = defsG.append("defs");
    var arrowMarker = defs.append("marker")
        .attr(arrowConfig);

    arrowMarker.append("path")
        .attr("d",arrow_path)
        .attr("fill",color);
}
// end 绘制箭头

// ########################################################
// ########################################################
// ********************************************************
// 函数集合: svg相关工具
// ********************************************************
// 阴影滤镜
function shadowFilter (svg, id) {
    var g = svg.append('g');

    var filter = g.append('defs')
        .append('filter')
        .attr('id', id);

    var feGaussianBlur = filter.append('feGaussianBlur')
        .attr('stdDeviation', '2')
        .attr('in', 'SourceAlpha');

    var feOffset = filter.append('feOffset')
        .attr('dx', '1')
        .attr('dy', '1');

    var feMerge = filter.append('feMerge');
    var feMergeNode_1 = feMerge.append('feMergeNode');
    var feMergeNode_2 = feMerge.append('feMergeNode')
        .attr('in', 'SourceGraphic');

    return filter;
}
// end 阴影滤镜

// ********************************************************
// 高斯模糊
function blurFilter (svg, id) {
    var g = svg.append('g');

    var filter = g.append('defs')
        .append('filter')
        .attr('id', id);

    var feGaussianBlur = filter.append('feGaussianBlur')
        .attr('stdDeviation', '2.5')
        .attr('result', 'coloredBlur');

    var feMerge = filter.append('feMerge');
    var feMergeNode_1 = feMerge.append('feMergeNode')
        .attr('in', 'coloredBlur');
    var feMergeNode_2 = feMerge.append('feMergeNode')
        .attr('in', 'SourceGraphic');

    return filter;
}
// end 高斯模糊

// ########################################################
// ########################################################
// ********************************************************
// 工具函数集合
// ********************************************************
// 检测是否空对象
function isEmptyObject (obj){
    for (var name in obj){
        return false;
    }
    return true;
}
// end 检测是否空对象

// ########################################################
// ########################################################
// ********************************************************
// 函数集合: 数据处理相关工具
// ********************************************************
// 为力图、bundle图原始数据添加索引
function addIndexOfForceData (data) {
    var dataIndexed = {};
    var nodesArray = [];
    var nodesData = data.nodes;
    var linksData = data.links;
    var linkIndexed;

    for(var keys in nodesData) {
        nodesArray.push(nodesData[keys].id);
    }

    linkIndexed = linksData.map(function(link) {
        var sourceData = link.source;
        var targetData = link.target;

        var sourceIndex = nodesArray.indexOf(sourceData);
        var targetIndex = nodesArray.indexOf(targetData);
        // 返回更多关系属性需要自定义
        return {source: sourceIndex, target: targetIndex};
    });

    dataIndexed.nodes = nodesData;
    dataIndexed.links = linkIndexed;
    // console.log(dataIndexed.links);

    // console.log(dataIndexed);
    return dataIndexed;
}
// end 为力图、bundle图原始数据添加索引

// ########################################################
// ########################################################
// ********************************************************
// force、bundle、matrix等复杂布局图形
// ********************************************************
// 简单的力图
function force (data, svg, graphConfig) {
    var width = graphConfig.svgWidth || 600;
    var height = graphConfig.svgHeight || 600;

    var nodes = data.nodes;
    var edges = data.links;

    var force = d3.layout.force()
        .nodes(nodes)   //指定节点数组
        .links(edges)   //指定连线数组
        .size([width,height]) //指定范围
        .linkDistance(20)  //指定连线长度
        .linkStrength(0.8)
        .charge(-25)  //相互之间的作用力
        .gravity(0.1)
        .friction(0.7)
        .alpha(0.05)
        .theta(0.3);

    force.start();  //开始作用

    //添加连线
    var edgesG = svg.append('g').attr('id', 'edgesG');
    var svg_edges = edgesG.selectAll("line")
        .data(edges)
        .enter()
        .append("line")
        .style('stroke', 'gray');
    console.log(svg_edges);

    //添加节点
    var nodesG = svg.append('g').attr('id', 'nodesG');
    var svg_nodes = nodesG.selectAll("circle")
        .data(nodes)
        .enter()
        .append("circle")
        .attr("r", 5)
        .style('fill', 'teal')
        .style('fill-opacity', .7)
        .style('stroke', 'gray')
        .style('stroke-width', 1)
        .call(force.drag);  //使得节点能够拖动
    console.log(svg_nodes);

    force.on("tick", function(){
        svg_edges.attr("x1",function(d){ return d.source.x; })
            .attr("y1",function(d){ return d.source.y; })
            .attr("x2",function(d){ return d.target.x; })
            .attr("y2",function(d){ return d.target.y; });

        //更新节点坐标
        svg_nodes.attr("cx",function(d){ return d.x; })
            .attr("cy",function(d){ return d.y; });
    });
}
// end 简单的力图

// ########################################################
// ########################################################
// ********************************************************
// // widgets UI组件
// ********************************************************
//缩放工具栏
// 用例：
// var zoomToolPanel = crateZoomToolPanel(svg);
// zoomToolPanel.zoomInButtonG.on('click', doZoomIn);
// zoomToolPanel.zoomOutButtonG.on('click', doZoomOut);
// zoomToolPanel.zoomOriginalButtonG.on('click', doZoomOriginal);
function crateZoomToolPanel (svg) {
    var zoomBehavior = {}; //behavior host

    var zoomControlPanelG = svg.append('g')
        .attr('transform', 'translate(50, 50)');

    zoomBehavior.zoomInButtonG = zoomControlPanelG
        .append('g')
        .attr('transform', 'translate(10, 10)')
        // .on('click', zoomBehavior.zoomIn);

    zoomBehavior.zoomOutButtonG = zoomControlPanelG
        .append('g')
        .attr('transform', 'translate(10, 40)')
        // .on('click', zoomOut);

    zoomBehavior.zoomOriginalButtonG = zoomControlPanelG
        .append('g')
        .attr('transform', 'translate(10, 70)')
        // .on('click', zoomOriginal);

    zoomBehavior.zoomInButtonG.append('circle') //zoom in
        .attr('r', 10)
        .style('stroke', '#666')
        .style('stroke-width', 2)
        .style('fill', '#fefefe');

    zoomBehavior.zoomInButtonG.append('line')
        .attr('x1', -5)
        .attr('y1', 0)
        .attr('x2', 5)
        .attr('y2', 0)
        .style('stroke', '#555')
        .style('stroke-width', 3);

    zoomBehavior.zoomInButtonG.append('line')
        .attr('x1', 0)
        .attr('y1', -5)
        .attr('x2', 0)
        .attr('y2', 5)
        .style('stroke', '#555')
        .style('stroke-width', 3);

    zoomBehavior.zoomOutButtonG.append('circle') // zoom out
        .attr('r', 10)
        .style('stroke', '#666')
        .style('stroke-width', 2)
        .style('fill', '#fefefe');

    zoomBehavior.zoomOutButtonG.append('line')
        .attr('x1', -5)
        .attr('y1', 0)
        .attr('x2', 5)
        .attr('y2', 0)
        .style('stroke', '#555')
        .style('stroke-width', 3);

    zoomBehavior.zoomOriginalButtonG.append('rect') // zoom out
        .attr('width', 18)
        .attr('height', 18)
        .attr('x', -9)
        .attr('y', -9)
        .style('stroke', '#666')
        .style('stroke-width', 2)
        .style('fill', '#fefefe');

    zoomBehavior.zoomOriginalButtonG.append('text')
        .attr('x', -7)
        .attr('y', 3)
        .text('1:1')
        .style('font-size', '10px')
        .style('stroke', '#555')
        .style('pointer-events', 'none');

    return zoomBehavior;
}




// export default {
//     // ########################################################
//     // ########################################################
//     // ********************************************************
//     // 初始化绘图环境
//     ini: {
//         // ********************************************************
//         // 函数: 创建svg画布
//         // container: svg挂载点
//         // svgConfig: svg设置
//         createSvg: function(container, svgConfig) {
//             // 默认svg挂载点为body
//             var container = container || d3.select('body');
//
//             var svg = container.append('svg');
//             // 默认svg高400宽400
//             var svgConfig = svgConfig || { width: 400, height: 400};
//
//             svg.attr('width', svgConfig.width)
//                 .attr('height', svgConfig.height);
//
//             return svg;
//         },
//         // ********************************************************
//         // 获取绘图容器尺寸
//         getViewportSize: function(w) {
//             var w = w || window;
//             if (w.innerWidth != null) {
//                 return {
//                     width: w.innerWidth,
//                     height: w.innerHeight,
//                     xPageOffset: w.pageXOffset,
//                     yPageOffset: w.pageYOffset
//                 }
//             }
//         },
//         // ********************************************************
//         // 创建鼠标经过目标图形，出现div信息框
//         // styleClass: div样式
//         createMouseTooltip: function(styleClass) {
//             var mouseTooltip = d3.select("body")
//                 .append("div")
//                 .attr("class", styleClass)
//                 .style("opacity", 0);
//
//             return mouseTooltip;
//         }
//     },
//     // ########################################################
//     // ########################################################
//     // ********************************************************
//     // 绘制基本图形
//     draw: {
//         // ********************************************************
//         // 创建圆形
//         // container: 挂载点
//         // circleConfig: 绘制参数
//         circle: function(container, circleConfig) {
//             var g = container.append('g');
//
//             var circleConfig = circleConfig || { r: 100, cx: 0, cy: 0, styleClass: ''};
//
//             var circle = g.append('circle')
//                 .attr('r', circleConfig.r)
//                 .attr('cx', circleConfig.cx)
//                 .attr('cy', circleConfig.cy);
//
//             if (circleConfig.styleClass) {
//                 circle.attr('class', circleConfig.styleClass);
//             }
//
//             return circle;
//         },
//         // end 创建圆形
//
//         // ********************************************************
//         // 创建长方形
//         // container: 挂载点
//         // rectConfig: 绘制参数
//         rect: function(container, rectConfig) {
//             var g = container.append('g');
//
//             var rectConfig = rectConfig || { width: 100, height: 100, x: 0, y: 0, styleClass: ''};
//
//             var rect = g.append('rect')
//                 .attr('width', rectConfig.width)
//                 .attr('height', rectConfig.height)
//                 .attr('x', rectConfig.x)
//                 .attr('y', rectConfig.y);
//
//             if (rectConfig.styleClass) {
//                 rect.attr('class', rectConfig.styleClass);
//             }
//
//             return rect;
//         },
//         // end 创建长方形
//
//         // ********************************************************
//         // 创建文本
//         // container: 挂载点
//         // rectConfig: 绘制参数
//         text: function(container, textConfig) {
//             var g = container.append('g');
//
//             var textConfig = textConfig || {x: 0, y: 0, styleClass: '', content: 'text place holder'};
//
//             var text = g.append('text')
//                 .attr('x', textConfig.x)
//                 .attr('y', textConfig.y)
//                 .text(textConfig.content);
//
//             if (textConfig.styleClass) {
//                 text.attr('class', textConfig.styleClass);
//             }
//
//             return text;
//         },
//         // end 创建文本
//
//         // ********************************************************
//         // 创建直线
//         // container: 挂载点
//         // rectConfig: 绘制参数
//         line: function(container, lineConfig) {
//             var g = container.append('g');
//
//             var lineConfig = lineConfig || {x1: 0, y1: 0, x2: 100, y2: 0, styleClass: ''};
//
//             var line = g.append('line')
//                 .attr('x1', lineConfig.x1)
//                 .attr('y1', lineConfig.y1)
//                 .attr('x2', lineConfig.x2)
//                 .attr('y2', lineConfig.y2);
//
//             if (lineConfig.styleClass) {
//                 line.attr('class', lineConfig.styleClass);
//             }
//
//             return line;
//         },
//         // end 创建直线
//
//         // ********************************************************
//         // 弧线连线
//         arc: function(d) {
//             var dx = d.x2 - d.x1;
//             var dy = d.y2 - d.y1;
//             var dr = Math.sqrt(dx * dx + dy * dy);
//
//             return "M" + d.x1 + "," + d.y1 + "A" + dr + "," + dr + " 0 0,1 " + d.x2 + "," + d.y2;
//         },
//         // end 弧线连线
//
//         // ********************************************************
//         // 绘制箭头
//         //case:
//         // var arrowConfig = {
//         //     id: 'arrow',
//         //     path: "M0,0 L4,2 L0,4 L0,0",
//         //     markerUnits: 'strokeWidth',
//         //     markerWidth: 4,
//         //     markerHeight: 4,
//         //     viewBox: "0 0 4 4",
//         //     refX: 6,
//         //     refY: 1,
//         //     orient: 'auto'
//         // }
//         // var arrow_path = "M0,0 L4,2 L0,4 L0,0";
//         // var arrow = arrow(svg, "arrow", "#2fafc6", arrow_path);
//         arrow: function(svg, color, arrowConfig) {
//             var arrow_path = arrow_path || "M0,0 L4,2 L0,4 L0,0";
//
//             var svg = svg || d3.select('svg');
//
//             var defsG = svg.append('g');
//             var defs = defsG.append("defs");
//             var arrowMarker = defs.append("marker")
//                 .attr(arrowConfig);
//
//             arrowMarker.append("path")
//     			.attr("d",arrow_path)
//     			.attr("fill",color);
//         }
//         // end 绘制箭头
//
//     },
//     // ########################################################
//     // ########################################################
//     // ********************************************************
//     // 函数集合: svg相关工具
//     svg: {
//         // ********************************************************
//         // 阴影滤镜
//         shadowFilter: function(svg, id) {
//             var g = svg.append('g');
//
//             var filter = g.append('defs')
//                 .append('filter')
//                 .attr('id', id);
//
//             var feGaussianBlur = filter.append('feGaussianBlur')
//                 .attr('stdDeviation', '2')
//                 .attr('in', 'SourceAlpha');
//
//             var feOffset = filter.append('feOffset')
//                 .attr('dx', '1')
//                 .attr('dy', '1');
//
//             var feMerge = filter.append('feMerge');
//             var feMergeNode_1 = feMerge.append('feMergeNode');
//             var feMergeNode_2 = feMerge.append('feMergeNode')
//                 .attr('in', 'SourceGraphic');
//
//             return filter;
//         },
//         // end 阴影滤镜
//
//         // ********************************************************
//         // 高斯模糊
//         blurFilter: function(svg, id) {
//             var g = svg.append('g');
//
//             var filter = g.append('defs')
//                 .append('filter')
//                 .attr('id', id);
//
//             var feGaussianBlur = filter.append('feGaussianBlur')
//                 .attr('stdDeviation', '2.5')
//                 .attr('result', 'coloredBlur');
//
//             var feMerge = filter.append('feMerge');
//             var feMergeNode_1 = feMerge.append('feMergeNode')
//                 .attr('in', 'coloredBlur');
//             var feMergeNode_2 = feMerge.append('feMergeNode')
//                 .attr('in', 'SourceGraphic');
//
//             return filter;
//         }
//         // end 高斯模糊
//     },
//     // ########################################################
//     // ########################################################
//     // ********************************************************
//     // 工具函数集合
//     utils: {
//         // ********************************************************
//         // 检测是否空对象
//         isEmptyObject: function(obj){
//             for (var name in obj){
//                 return false;
//             }
//             return true;
//         },
//         // end 检测是否空对象
//         // ********************************************************
//         // start 获取div宽度高度
//         getDivWidthHeight: function (divId) {
//             var height = document.getElementById(divId).offsetHeight
//             var width = document.getElementById(divId).offsetWidth
//
//             return {
//                 'height': height,
//                 'width': width
//             }
//         }
//         // end 获取div宽度高度
//     },
//     // ########################################################
//     // ########################################################
//     // ********************************************************
//     // 函数集合: 数据处理相关工具
//     data: {
//         // ********************************************************
//         // 为力图、bundle图原始数据添加索引
//         addIndexOfForceData: function(data) {
//             var dataIndexed = {};
//             var nodesArray = [];
//             var nodesData = data.nodes;
//             var linksData = data.links;
//             var linkIndexed;
//
//             for(var keys in nodesData) {
//                 nodesArray.push(nodesData[keys].id);
//             }
//
//             linkIndexed = linksData.map(function(link) {
//                 var sourceData = link.source;
//                 var targetData = link.target;
//
//                 var sourceIndex = nodesArray.indexOf(sourceData);
//                 var targetIndex = nodesArray.indexOf(targetData);
//                 // 返回更多关系属性需要自定义
//                 return {source: sourceIndex, target: targetIndex};
//             });
//
//             dataIndexed.nodes = nodesData;
//             dataIndexed.links = linkIndexed;
//             // console.log(dataIndexed.links);
//
//             // console.log(dataIndexed);
//             return dataIndexed;
//         }
//         // end 为力图、bundle图原始数据添加索引
//     },
//     // ########################################################
//     // ########################################################
//     // ********************************************************
//     // force、bundle、matrix等复杂布局图形
//     layout: {
//         // ********************************************************
//         // 简单的力图
//         force: function(data, svg, graphConfig) {
//             var width = graphConfig.svgWidth || 600;
//             var height = graphConfig.svgHeight || 600;
//
//             var nodes = data.nodes;
//             var edges = data.links;
//
//             var force = d3.layout.force()
//                 .nodes(nodes)   //指定节点数组
//                 .links(edges)   //指定连线数组
//                 .size([width,height]) //指定范围
//                 .linkDistance(20)  //指定连线长度
//                 .linkStrength(0.8)
//                 .charge(-25)  //相互之间的作用力
//                 .gravity(0.1)
//                 .friction(0.7)
//                 .alpha(0.05)
//                 .theta(0.3);
//
//             force.start();  //开始作用
//
//             //添加连线
//             var edgesG = svg.append('g').attr('id', 'edgesG');
//             var svg_edges = edgesG.selectAll("line")
//                 .data(edges)
//                 .enter()
//                 .append("line")
//                 .style('stroke', 'gray');
//             console.log(svg_edges);
//
//             //添加节点
//             var nodesG = svg.append('g').attr('id', 'nodesG');
//             var svg_nodes = nodesG.selectAll("circle")
//                 .data(nodes)
//                 .enter()
//                 .append("circle")
//                 .attr("r", 5)
//                 .style('fill', 'teal')
//                 .style('fill-opacity', .7)
//                 .style('stroke', 'gray')
//                 .style('stroke-width', 1)
//                 .call(force.drag);  //使得节点能够拖动
//             console.log(svg_nodes);
//
//             force.on("tick", function(){
//                 svg_edges.attr("x1",function(d){ return d.source.x; })
//                     .attr("y1",function(d){ return d.source.y; })
//                     .attr("x2",function(d){ return d.target.x; })
//                     .attr("y2",function(d){ return d.target.y; });
//
//                 //更新节点坐标
//                 svg_nodes.attr("cx",function(d){ return d.x; })
//                     .attr("cy",function(d){ return d.y; });
//             });
//         }
//         // end 简单的力图
//     },
//     widgets: { //UI组件
//         //缩放工具栏
//         // 用例：
//         // var zoomToolPanel = crateZoomToolPanel(svg);
//         // zoomToolPanel.zoomInButtonG.on('click', doZoomIn);
//         // zoomToolPanel.zoomOutButtonG.on('click', doZoomOut);
//         // zoomToolPanel.zoomOriginalButtonG.on('click', doZoomOriginal);
//         crateZoomToolPanel: function (svg) {
//             var zoomBehavior = {}; //behavior host
//
//             var zoomControlPanelG = svg.append('g')
//                 .attr('transform', 'translate(50, 50)');
//
//             zoomBehavior.zoomInButtonG = zoomControlPanelG
//                 .append('g')
//                 .attr('transform', 'translate(10, 10)')
//                 // .on('click', zoomBehavior.zoomIn);
//
//             zoomBehavior.zoomOutButtonG = zoomControlPanelG
//                 .append('g')
//                 .attr('transform', 'translate(10, 40)')
//                 // .on('click', zoomOut);
//
//             zoomBehavior.zoomOriginalButtonG = zoomControlPanelG
//                 .append('g')
//                 .attr('transform', 'translate(10, 70)')
//                 // .on('click', zoomOriginal);
//
//             zoomBehavior.zoomInButtonG.append('circle') //zoom in
//                 .attr('r', 10)
//                 .style('stroke', '#666')
//                 .style('stroke-width', 2)
//                 .style('fill', '#fefefe');
//
//             zoomBehavior.zoomInButtonG.append('line')
//                 .attr('x1', -5)
//                 .attr('y1', 0)
//                 .attr('x2', 5)
//                 .attr('y2', 0)
//                 .style('stroke', '#555')
//                 .style('stroke-width', 3);
//
//             zoomBehavior.zoomInButtonG.append('line')
//                 .attr('x1', 0)
//                 .attr('y1', -5)
//                 .attr('x2', 0)
//                 .attr('y2', 5)
//                 .style('stroke', '#555')
//                 .style('stroke-width', 3);
//
//             zoomBehavior.zoomOutButtonG.append('circle') // zoom out
//                 .attr('r', 10)
//                 .style('stroke', '#666')
//                 .style('stroke-width', 2)
//                 .style('fill', '#fefefe');
//
//             zoomBehavior.zoomOutButtonG.append('line')
//                 .attr('x1', -5)
//                 .attr('y1', 0)
//                 .attr('x2', 5)
//                 .attr('y2', 0)
//                 .style('stroke', '#555')
//                 .style('stroke-width', 3);
//
//             zoomBehavior.zoomOriginalButtonG.append('rect') // zoom out
//                 .attr('width', 18)
//                 .attr('height', 18)
//                 .attr('x', -9)
//                 .attr('y', -9)
//                 .style('stroke', '#666')
//                 .style('stroke-width', 2)
//                 .style('fill', '#fefefe');
//
//             zoomBehavior.zoomOriginalButtonG.append('text')
//                 .attr('x', -7)
//                 .attr('y', 3)
//                 .text('1:1')
//                 .style('font-size', '10px')
//                 .style('stroke', '#555')
//                 .style('pointer-events', 'none');
//
//             return zoomBehavior;
//         }
//     }
// }
