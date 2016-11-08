export const fetchAllData = ({ dispatch }) => {
    dispatch('FETCH_ALLDATA')
}

export const setPersistData = ({ dispatch }, data) => {
    var persistDataArray = []

    for (var i = 0; i < data.length; i++) {
        persistDataArray.push(data[i])
    }

    dispatch('SET_PERSIST_DATA', persistDataArray)
}

export const setAnimatorId = ({ dispatch }, animatorId) => {
    dispatch('SET_ANIMATOR_ID')
}

export const fetchCanvasSize = ({ dispatch }) => {
    dispatch('FETCH_CANVAS_SIZE')
}

export const fetchWidgetDonutViewport = ({ dispatch }, divId) => {
    dispatch('FETCH_WIDGET_DONUT_VIEWPORT', divId)
}

export const fetchChinaMapData = ({ dispatch }) => {
    dispatch('FETCH_CHINAMAP')
}

export const fetchMacroEconomyData = ({ dispatch }) => {
    dispatch('FETCH_MACRO_ECONOMY_DATA')
}

export const setContentWrapperView = ({ dispatch }, component) => {
    dispatch('SET_CONTENT_WRAPPER_VIEW', component)
}

export const setContentWrapperCustomerExperienceView = ({ dispatch }) => {
    dispatch('SET_CONTENT_WRAPPER_VIEW_CUSTOMER_EXPERIENCE')
}

//风力详情组件，包括鼠标当前位置的风力、经纬度、方向
export const setWindDetailSpeed = ({ dispatch }, speed) => {
    dispatch('SET_WIND_DETAIL_SPEED', speed)
}

export const setWindDetailDirection = ({ dispatch }, direction) => {
    dispatch('SET_WIND_DETAIL_DIRECTION', direction)
}

export const setWindDetailLon = ({ dispatch }, lon) => {
    dispatch('SET_WIND_DETAIL_LON', lon)
}

export const setWindDetailLat = ({ dispatch }, lat) => {
    dispatch('SET_WIND_DETAIL_LAT', lat)
}
