import Vue from 'vue'
import Vuex from 'vuex'
import * as d3 from 'd3'
import weig from '../graph/weig'

Vue.use(Vuex)
Vue.use(require('vue-resource'))

// var dataDir = '../../projects/tomahawk/asset/data/'
var devDataPath = '../../projects/tomahawk/asset/data/'
var deployDataPath = '../asset/data/'
var electronDataPath = './projects/tomahawk/asset/data/'
// var electronDataPath = '../asset/data/'
var currentDataPath = devDataPath //部署阶段切换到部署路径
// var currentDataPath = electronDataPath //部署阶段切换到部署路径

const state = {
    viewPort: {}, //视口尺寸数据
    widgetDonutViewPort: {}, //空气质量饼图视口尺寸数据
    contentWrapperCurrentView: 'Overview', //默认载入渲染口碑页面
    allData:'', //挂载所有数据
    persistData: '', //preserve the promise data, for other viewer to use
    animatorId:'',
    dataPath: {
        mode: 'develop',
        // mode: 'deploy',
        // mode: 'electron',
        devDataPath: devDataPath,
        deployDataPath: deployDataPath,
        electronDataPath: electronDataPath
    }
}

const mutations = {
    FETCH_ALLDATA(state) {
        // state.allData = loadAllData(currentDataPath)
        if (state.dataPath.mode == 'develop') {
            state.allData = loadAllData(state.dataPath.devDataPath)
        } else if (state.dataPath.mode == 'electron') {
            state.allData = loadAllData(state.dataPath.electronDataPath)
        } else {
            state.allData = loadAllData(state.dataPath.deployDataPath)
        }
    },
    FETCH_MACRO_ECONOMY_DATA(state) {
        state.macroEconomyData = loadAllData()
    },
    FETCH_CANVAS_SIZE(state) {
        var viewPort = weig.ini.getViewportSize()
        state.viewPort = viewPort
    },
    SET_CONTENT_WRAPPER_VIEW(state, component) { //切换内容模块
        state.contentWrapperCurrentView = component
    },
    SET_PERSIST_DATA(state, data) { //preserve the promise data
        state.persistData = data
    },
    SET_ANIMATOR_ID(state, animatorId) { //preserve the promise data
        state.animatorId = animatorId
    }
}

export default new Vuex.Store({
    state,
    mutations
})

function loadAllData(dataDir) {
    var dataDir = dataDir

    var mapData = dataDir + 'geo_shanghai_full.json'
    var siteData = dataDir + 'site.csv'
    var shopData = dataDir + 'shop.csv'
    var spotData = dataDir + 'spot.csv'
    var scheduleData = dataDir + 'schedulePenalty.csv'
    // var cityData = geoDataDir + 'china-province-capital-geo.csv'
    // var salaryData = economyDataDir + '平均工资分省年度数据.csv'
    // var populationData = economyDataDir + '人口总数分省年度数据.csv'

    var promiseMapData = new Promise((resolve, reject) => {
        d3.json(mapData, function(error, data) {
            resolve(data)
        })
    })

    var promiseSiteData = new Promise((resolve, reject) => {
        d3.csv(siteData, function(error, data) {
            resolve(data)
        })
    })

    var promiseShopData = new Promise((resolve, reject) => {
        d3.csv(shopData, function(error, data) {
            resolve(data)
        })
    })

    var promiseSpotData = new Promise((resolve, reject) => {
        d3.csv(spotData, function(error, data) {
            resolve(data)
        })
    })

    var promiseScheduleData = new Promise((resolve, reject) => {
        d3.csv(scheduleData, function(error, data) {
            resolve(data)
        })
    })

    var queuePromise = Promise.all([promiseMapData, promiseSiteData, promiseShopData, promiseSpotData, promiseScheduleData])

    // console.log(queuePromise)

    return queuePromise
}
