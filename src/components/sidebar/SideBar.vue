<template>
    <div id="side-bar">
        <!-- <div class="menu-option" v-for='menu in menuConfig' @click='setContentWrapperView(menu.contentWrapperView)'>
            <span v-bind:class='menu.menuIcon' aria-hidden="true"></span>
            <span class='menu-label'>{{ menu.menuName }}</span>
        </div> -->
        <div class="menu-option" v-for='menu in menuConfig' v-bind:class="{ 'actived': menu.contentWrapperView == getContentWrapperCurrentView }"  @click='setContentWrapperView(menu.contentWrapperView)'>
            <div class="menuWrapper">
                <span v-bind:class='menu.menuIcon' aria-hidden="true"></span>
                <span class='menu-label'>{{ menu.menuName }}</span>
            </div>
        </div>
    </div>
</template>

<script type="text/javascript">
    import { setContentWrapperView } from '../../vuex/actions'
    import { getContentWrapperCurrentView } from '../../vuex/getters'

    export default {
        vuex: {
            getters: {
                getContentWrapperCurrentView
                // getCanvasSize
            },
            actions: {
                setContentWrapperView
            }
        },
        data () {
            return {
                menuConfig: [
                    {
                        menuName: '风场地图',
                        menuIcon: 'glyphicon glyphicon-random',
                        actived: true,
                        contentWrapperView: 'WindMapWrapper'
                    },
                    {
                        menuName: '排污监测',
                        menuIcon: 'glyphicon glyphicon-eye-open',
                        actived: false,
                        contentWrapperView: 'PolutionWrapper'
                    },
                    {
                        menuName: '农业金融',
                        menuIcon: 'glyphicon glyphicon-usd',
                        actived: false,
                        contentWrapperView: 'FinanceWrapper'
                    }
                ]
            }
        },
        components: {

        },
        computed: {
            activeButton: function(viewComp) {
                viewComp == ''
            }
        }
    }

</script>

<style lang="stylus">
#side-bar
    z-index 20
    position absolute
    left 0
    top 50px
    width 100px
    height 100%
    background #151719
    overflow hidden
    /*box-shadow 1px 0 1px #222*/
    /*transition all 0.5s ease*/

.menu-option
    position relative
    width 100%
    height 100px
    font-size 12px
    color #aaa
    /*padding-top 10px
    padding-bottom 10px*/
    border-left #151719 3px solid
    text-align center

.menu-option.actived
    background #02ADD4
    /*background #264367*/
    color #eee
    opacity 0.85

.menu-option:hover
    /*background #264367*/
    background #02ADD4
    color #fff
    cursor pointer
    /*border-left #0182BC 3px solid*/
    border-left orange 2px solid


.menu-option
    .glyphicon
        display block
        font-size 32px
        /*padding-top 30px*/
        padding-bottom 5px
        /*margin-left 10px
        margin-right 10px*/

.menu-option
    .menu-label
        font-family 'Microsoft Yahei' Simhei Arial

.menuWrapper
    position absolute
    /*垂直剧中，水平不居中，水平居中left和translate都50%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@*/
    top 50%
    left 50%
    transform: translate(-50%, -50%);
</style>
