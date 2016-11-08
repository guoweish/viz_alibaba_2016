 <template>
    <div id="nav-bar">
        <div id="work-description">
            <div id="work-description-title">
                智慧物流
            </div>
            <div id="work-description-detail">
                剁手党的最后一公里
            </div>
        </div>

        <div id="menuContainer">
            <!-- <div class="viewMenu" v-for='menu in menuConfig' v-bind:class="{ 'actived': menu.contentWrapperView == getContentWrapperCurrentView }"  @click='setContentWrapperView(menu.contentWrapperView)'> -->
            <div class="viewMenu" v-for='menu in menuConfig' v-bind:class="{ 'actived': menu.contentWrapperView == getContentWrapperCurrentView }"  @click='routeTo(menu)'>
                <div class="nav-menuWrapper">
                    <!-- <span v-bind:class='menu.menuIcon' aria-hidden="true"></span> -->
                    <img class='menuIcon' v-bind:src="menu.menuIcon" />
                    <span class='nav-menu-label'>{{ menu.menuName }}</span>
                </div>
            </div>
        </div>

        <div id="aboutMe">
            <span id="aboutMePowerby">Powered By</span>
            <a href="http://guoweish.github.io" id="aboutMeName">郭不耐</a>
        </div>
        <!-- <nav id='navigator' class="navbar navbar-default navbar-fixed-top" role="navigation">
            <div class="nav-menu-option" v-for='menu in menuConfig' v-bind:class="{ 'actived': menu.actived }">
                <div class="nav-menuWrapper">
                    <span v-bind:class='menu.menuIcon' aria-hidden="true"></span>
                    <span class='nav-menu-label'>{{ menu.menuName }}</span>
                </div>
            </div>
        </nav> -->
    </div>
</template>

<script type="text/javascript">
import { setContentWrapperView } from '../../vuex/actions'
import { getContentWrapperCurrentView } from '../../vuex/getters'
import { getStaticAssetPath } from '../../vuex/getters'

var devImagePath = '../../../../projects/tomahawk/asset/image/'
var deployImagePath = '../asset/image/'
var electronDataPath = './projects/tomahawk/asset/image/'
var currentImagePath = devImagePath //部署阶段切换到部署路径
// var currentImagePath = electronDataPath //部署阶段切换到部署路径

export default {
    vuex: {
        getters: {
            getContentWrapperCurrentView,
            getStaticAssetPath
        },
        actions: {
            setContentWrapperView
        }
    },
    data () {
        return {
            menuConfig: [
                {
                    menuName: '概况透视',
                    contentWrapperView: 'Overview',
                    routePath: { path: '/overview' },
                    menuIcon: this.getStaticAssetPath + 'overview.svg',
                    actived: true
                },
                {
                    menuName: '实时物流',
                    contentWrapperView: 'Realtime',
                    routePath: { path: '/realtime' },
                    menuIcon: this.getStaticAssetPath + 'realtime.svg',
                    actived: false
                },
                {
                    menuName: '绩效分析',
                    contentWrapperView: 'Statistic',
                    routePath: { path: '/statistic' },
                    menuIcon: this.getStaticAssetPath + 'statistic.svg',
                    actived: false
                },
                {
                    menuName: '网点监控',
                    contentWrapperView: 'Leaflet',
                    routePath: { path: '/leaflet' },
                    menuIcon: this.getStaticAssetPath + 'geo.svg',
                    actived: false
                }
            ]
        }
    },
    components: {

    },
    methods: {
        routeTo: function(menu) {
            document.getElementById('switcher').style.visibility = 'visible'
            router.go(menu.routePath)
            this.setContentWrapperView(menu.contentWrapperView)
        },
        goHome: function() {
            document.getElementById('switcher').style.visibility = 'visible'
            router.go('/overview')
            this.setContentWrapperView('Overview')
        }
    },
    ready: function() {
        var _self = this
        document.getElementById('work-description').addEventListener('click', _self.goHome, false)
    }
}

</script>

<style lang="stylus">
#nav-bar
    font-family 'Microsoft Yahei' Simhei Arial
    z-index 600
    position fixed
    left 20px
    top 20px
    width 150px
    visibility hidden

#work-description
    color white
    #work-description-title
        font-size 36px
        opacity 0.7
    #work-description-title:hover
        cursor pointer
    #work-description-detail
        font-size 16px
        opacity 0.5
#aboutMe
    position fixed
    left 33px
    top 290px

#aboutMePowerby
    font-size 12px
    color #666
    opacity 0.4

a:link { text-decoration: none;}
a:active { text-decoration:none}
a:hover { text-decoration:underline;}
a:visited { text-decoration: none;}

#aboutMeName
    font-size 14px
    color #666
    opacity 0.5

#menuContainer
    position fixed
    left 60px
    top 150px
    width 150px

.viewMenu
    display inline-block

.viewMenu:hover
    cursor pointer

.viewMenu.actived
    .nav-menuWrapper
        opacity 0.8
        background-color rgba(255, 255, 255, 0.3)

.nav-menuWrapper
    padding-top 15px
    text-align center
    padding-left 5px
    padding-right 5px
    width 50px
    height 50px
    /*垂直剧中，水平不居中，水平居中left和translate都50%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@*/
    top 50%
    left 50%
    transform: translate(-50%, -50%)
    opacity 0.4
    border solid 1px white
    padding-bottom 20px

.nav-menuWrapper:hover
    opacity 0.7
    background-color rgba(255, 255, 255, 0.2)

.menuIcon
    width 80%

.nav-menu-label
    color white
    font-size 12px
    font-family 'Microsoft Yahei' Simhei Arial
    margin-bottom 5px

#nav-bar .navbar
    left 0
    margin 0
    padding 0
    background -webkit-gradient(linear, 0% 0%, 0% 100%,from(#282C33), to(#131418))
    /*background -ms-linear-gradient(top, #282C33, #131418)*/
    background -moz-linear-gradient(top,#282C33, #131418)
    border-style none
    box-shadow 0px 2px 2px #000

.nav-menu-option
    display inline-block
    position relative
    width 100px
    height 40px
    color #999


</style>
