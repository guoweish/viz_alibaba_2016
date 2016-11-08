export const getStaticAssetPath = state => {
    if (state.dataPath.mode == 'develop') {
        return state.dataPath.devDataPath
    } else if (state.dataPath.mode == 'electron') {
        return state.dataPath.electronDataPath
    } else {
        return state.dataPath.deployDataPath
    }
}

export const getAllData = state => {
    return state.allData
}

export const getPersistData = state => {
    return state.persistData
}

export const getAnimatorId = state => {
    return state.animatorId
}

export const getCanvasSize = state => {
    return state.viewPort
}

export const getWidgetDonutViewport = state => {
    return state.widgetDonutViewPort
}

export const getChinaMapData = state => {
    return state.macroEconomyData
}

export const getMacroEconomyData = state => {
    return state.macroEconomyData
}

export const getContentWrapperCurrentView = state => {
    return state.contentWrapperCurrentView
}

//风力详情组件，包括鼠标当前位置的风力、经纬度、方向
export const getWindDetailSpeed = state => {
    return state.windDetailWidget.speed
}

export const getWindDetailDirection = state => {
    return state.windDetailWidget.direction
}

export const getWindDetailLon = state => {
    return state.windDetailWidget.lon
}

export const getWindDetailLat = state => {
    return state.windDetailWidget.lat
}
