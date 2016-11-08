<template>
    <div id="explore">
        <div id="explore-button-wrapper">
            <input id="explore-button" type="button" value="开始探索" @click='startExplore'>
        </div>
    </div>
</template>

<script type="text/javascript">
import { setContentWrapperView } from '../../vuex/actions'

export default {
    vuex: {
        getters: {
            // getContentWrapperCurrentView
        },
        actions: {
            setContentWrapperView
        }
    },
    methods: {
        startExplore: startExplore,
        routeTo: function(routePath) {
            router.go(routePath)
        }
    },
    components: {

    },
    ready: function() {
        // 检测ie版本，如果非ie，返回undefined，ie返回版本号
        // var tridentVersion =  typeof ScriptEngineMajorVersion === "function" ?  ScriptEngineMajorVersion() : undefined
        // if(tridentVersion) {
        //     document.getElementById('navigator').style.background = '#131418'
        // }
    }
}

function startExplore() {
    this.setContentWrapperView("Realtime")
    this.routeTo("/realtime")
    document.getElementById('nav-bar').style.visibility = 'visible'
    document.getElementById('explore').style.display = 'none'
}

</script>

<style lang="stylus">
#explore
    z-index 800
    position absolute
    width 400px
    height 200px
    background-color #000
    opacity 0.5
    visibility hidden
    border-radius 5px
    /*居中*/
    top 50%
    left 50%
    transform: translate(-50%, -50%)

#explore-button-wrapper
    position absolute
    top 50%
    left 50%
    transform: translate(-50%, -50%)

#explore-button
    font-size 24px
    color aqua
    font-family 'Microsoft Yahei' Simhei Arial
    background transparent
    border none

#explore-button:hover
    cursor pointer
    color white

</style>
