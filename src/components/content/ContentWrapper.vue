<template>
    <div id="content-wrapper">
        <!-- <overview></overview> -->
        <!-- <moving-routines></moving-routines> -->
        <!-- <component :is='tracedCurrentView' transition="fade" transition-mode="out-in" keep-alive></component> -->
        <!-- <component :is='tracedCurrentView'></component> -->
        <!-- <router-view keep-alive></router-view> -->
        <router-view></router-view>
    </div>
</template>

<script>
    import Overview from './overview/Overview.vue'
    import Realtime from './realtime/Realtime.vue'
    import Statistic from './statistic/Statistic.vue'
    import Leaflet from './leaflet/Leaflet.vue'
    import { getContentWrapperCurrentView } from '../../vuex/getters'

    export default {
        components: {
            Overview,
            Realtime,
            Statistic,
            Leaflet
        },
        vuex: {
            getters: {
                getContentWrapperCurrentView
            },
            actions: {
                // setContentWrapperView
            }
        },
        data() {
            return {

            }
        },
        methods: {

        },
        computed: {
            // 用计算属性自动跟踪vuex中的变量更方便，不用手动赋值getters更新
            tracedCurrentView: function() {
                return this.getContentWrapperCurrentView
            }
        }
        // ,ready: setWrapperHeight
    }

</script>

<style lang="stylus">
#content-wrapper
    position absolute
    top 0
    left 0
    /*内容右移避开左侧菜单栏的关键*/
    /*padding-left 100px*/
    /*padding-top 50px*/
    width 100%
    height 100%
    /*background orange*/
    /*overflow hide*/
    background-color #000

.fade-transition
    transition opacity .5s ease

.fade-enter, .fade-leave
    opacity 0

#background-image
    position absolute
    /*z-index -100*/
    overflow hide

</style>
