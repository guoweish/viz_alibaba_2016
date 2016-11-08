import * as d3 from 'd3'

function Donut() {
    var _chart = {}

    var _width = 500
    var _height = 500

    var _data = []

    var _colors = d3.scaleOrdinal(d3.schemeCategory10)

    var _svg
    var _bodyG
    var _svgContainer = 'body'

    var _pieG
    var _radius = 200
    var _innerRadius = 60
    var _startAngle = 0
    var _endAngle = Math.PI * 2

    var _displayLabels = true

    _chart.render = function() {
        if (!_svg) {
            _svg = d3.select(_svgContainer)
                .append('svg')
                .attr('width', _width)
                .attr('height', _height)
        }

        renderBody(_svg)
    }

    // _bodyG是所有组件的容器
    function renderBody(svg) {
        if (!_bodyG) {
            _bodyG = svg.append('g')
                .attr('class', 'body')
        }

        renderPie()
    }

    function renderPie() {
        var pie = d3.pie()
            .sort(d => d.id)
            .value(d => d.value)
            .startAngle(_startAngle)
            .endAngle(_endAngle)

        var arc = d3.arc()
            .outerRadius(_radius)
            .innerRadius(_innerRadius)

        if (!_pieG) {
            _pieG = _bodyG.append('g')
                .attr('class', 'pie')
                // .attr("transform", "translate(" + _radius + "," + _radius + ")")
                .attr("transform", "translate(" + _width/2 + "," + _height/2 + ")")
        }

        renderSlices(pie, arc)

        if (_displayLabels) {
            renderLabels(pie, arc)
        }
    }

    function renderSlices(pie, arc) {
        var slices = _pieG.selectAll('path.arc')
            .data(pie(_data))

        slices.exit().remove()

        slices.enter()
            .append('path')
            .attr('class', 'arc')
            .attr('fill', (d, i) => _colors(i))
            // .attr('d', arc)

            slices.transition()
                    .attrTween("d", function (d) {
                        if (!this.__current__) {

                        }
                        
                        var currentArc = this.__current__; // <-C

                        if (!currentArc)
                            currentArc = {startAngle: 0,
                                            endAngle: 0};
                        console.log(d)
                        console.log(currentArc)

                        var interpolate = d3.interpolate(
                                            currentArc, d);

                        this.__current__ = interpolate(1);//<-D

                        return function (t) {
                            return arc(interpolate(t));
                        };
                    });
    }

    function renderLabels(pie, arc) {
        var labels = _pieG.selectAll('text.label')
            .data(pie(_data))

        console.log(labels)

        labels.enter()
            .append('text')
            .attr('class', 'label')
            .attr('transform', d => {
                'translate(' + arc.centroid(d) + ')'
            })
            .attr('dy', '.35em')
            .attr('text-anchor', 'middle')
            .text(d => d.data.id) //data是arc内部属性


        // labels.transition()
        //     .attr('transform', d => {
        //         'translate(' + arc.centroid(d) + ')'
        //     })
        //     .attr('dy', '.35em')
        //     .attr('text-anchor', 'middle')
        //     .text(d => d.data.id)
    }

    _chart.data = function(d) {
        if (!arguments.length) {
            return _data
        }

        _data = d

        return _chart
    }

    _chart.width = function(w) {
        if (!arguments.length) {
            return _width
        }

        _width = w

        return _chart
    }

    _chart.height = function(h) {
        if (!arguments.length) {
            return _height
        }

        _height = h

        return _chart
    }

    // 颜色需要的是一个ordinal比例尺，输入数字输出颜色字符串
    _chart.colors = function (c) {
            if (!arguments.length) return _colors
            _colors = c
            return _chart
    }

    _chart.radius = function (r) {
        if (!arguments.length) return _radius
        _radius = r
        return _chart
    }

    _chart.innerRadius = function (r) {
        if (!arguments.length) return _innerRadius
        _innerRadius = r
        return _chart
    }

    _chart.displayLabels = function(trueOrFalse) {
        if (!arguments.length) {
            return _displayLabels
        }

        _displayLabels = trueOrFalse

        return _chart
    }

    _chart.startAngle = function(angle) {
        if (!arguments.length) {
            return _startAngle
        }

        _startAngle = angle

        return _chart
    }

    _chart.endAngle = function(angle) {
        if (!arguments.length) {
            return _endAngle
        }

        _endAngle = angle

        return _chart
    }

    // 设定svg的dom容器id
    _chart.svgContainer = function(containerId) {
        if (!arguments.length) {
            return _svgContainer
        }

        _svgContainer = '#' + containerId

        return _chart
    }

    return _chart
}

export default Donut
