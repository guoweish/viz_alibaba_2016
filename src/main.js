import Vue from 'vue'
import VueRouter from 'vue-router'
import store from './vuex/store'
// import weig from './graph/weig'
import App from './components/App.vue'
import * as d3 from 'd3'
import { configRouter } from './route-config'

require('./static/initial.styl')
// require('bootstrap-webpack')
// require('./static/no-gutter.css')

Vue.use(VueRouter)
Vue.use(require('vue-resource'))

// var vm = new Vue({
//     store, //inject store to all components
//     el: 'body',
//     components: {
//         App
//     },
//     ready: function() {
//         // d3.select('#loader').remove()
//         // d3.select('body').style('background-color', '')
//     }
//
// })

const router = new VueRouter({
    //启用如下选项，浏览器访问路由路径404,需要nginx设置try file解决
    // history: true,
    // saveScrollPosition: true
})

configRouter(router)

// const App = Vue.extend(require('./components/App.vue'))

router.start(App, '#app')

window.router = router
