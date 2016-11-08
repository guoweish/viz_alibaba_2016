export function configRouter (router) {

    router.map({
        '/overview': {
            component: require('./components/content/overview/Overview.vue')
        },
        '/realtime': {
            component: require('./components/content/realtime/Realtime.vue')
        },
        '/statistic': {
            component: require('./components/content/statistic/Statistic.vue')
        },
        '/leaflet': {
            component: require('./components/content/leaflet/Leaflet.vue')
        },
        '/': {
            component: require('./components/content/overview/Overview.vue')
        }
    })
}
