// 解决在wind.js中触发另一个作用域中的widget组件变化
var ShareState = {}

ShareState.sampleData = 7
ShareState.cityAqi = ''
// ShareState.updateWidgetDonutChart = ''

ShareState.watchData = function(num) {
    console.log(num)
}

ShareState.watchCityAqi = function() {
    console.log(ShareState.cityAqi)
}

export default ShareState
