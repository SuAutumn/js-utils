import HtmlParser from '../utils/HtmlParser'

let text = `
<!DOCTYPE html>
<template>
  <meta charset="UTF-8" >
<!--  测试-->
  <div class="login">
    <div class="flex-1">
      <img src="@/assets/pics/login2.png" width="100%" height="100%" class="login2" alt/>
    </div>
    <div class="flex-1 pr">
      <div class="login-right">
        <div class="title">欢迎登录</div>
        <div class="sub-title">欢迎登录智慧校园管理系统</div>
        <div>
          <input type="text" placeholder="请输入账号" v-model="account" autofocus/>
        </div>
        <div>
          <input type="password" placeholder="请输入密码" v-model="pwd"/>
        </div>
        <div>
          <button class="login-btn" @click="login">登录</button>
        </div>
      </div>
      <div class="pa" style="top: 0;right: 10%;">
<!--        <img src="@/assets/pics/login1.png" alt>hello</img>-->
      </div>
    </div>
  </div>
</template>`

text = `<template>
  <view class="container tab-trend">
    <uni-status-bar></uni-status-bar>
    <view style="z-index: 101;" class="ph-34 pr hair-line-bottom">
      <tab-bar :value="barIndex" :tabBars="bars" @changeIndex="selectBar" />
    </view>
    <view class="list-box pb-60">
      <mescroll-uni
        :fixed="false"
        ref="mescrollRef"
        @init="mescrollInit"
        @down="downCallback"
        @up="upCallback"
        :down="downOption"
        :up="upOption"
      >
        <view v-if="bar.id === 'deal'" class="ph-34 pt-34">
          <TrendItem :entity="data" v-for="(data, index) in bar.data" :key="index" />
        </view>
        <view v-if="bar.id === 'news'">
          <!--          <area-title title="各大指数趋势"></area-title>-->
          <!--          <stock-market-index ref="stockMarketIndex"></stock-market-index>-->
          <Banner :banner="bannerInfo" v-show="bannerInfo.length > 0"></Banner>
          <live-msg :list="briefNews" v-show="briefNews.length > 0" @click="selectBar('1')"></live-msg>
          <area-title title="新闻报道"></area-title>
          <view class="ph-34 pt-34"><NewsItem :entity="data" v-for="(data, index) in bar.data" :key="index" /></view>
        </view>
        <view v-if="bar.id === 'msg'"><brief-news :list="bar.data"></brief-news></view>
        <calendar
          v-if="bar.id === 'calendar'"
          @change="calendarChange"
          :list="bar.data"
          :total="bar.total"
        ></calendar>
      </mescroll-uni>
    </view>
    <trend-stock-market :tickers="tickers"></trend-stock-market>
    <!--     <tui-fab :right="34" bgColor="#8358DD" @click="onNew"></tui-fab>-->
  </view>
</template>
<script>
import MescrollMixin from '@/components/mescroll-uni/mescroll-mixins.js'
import { articleList } from '@/const/apis.js'
import TrendItem from '@/components/list-items/trend-item.vue'
import NewsItem from '@/components/list-items/news-item.vue'
import AreaTitle from '@/components/area-title/area-title.vue'
import TrendStockMarket from '@/pages/trend/trend-stock-market.vue'
import LiveMsg from '@/pages/trend/live-msg.vue'
import BriefNews from '@/pages/trend/brief-news.vue'
import Calendar from '@/pages/trend/calendar.vue'
import Banner from '@/pages/trend/banner'
import { getBriefNews, getCalendarEconomic, getCalendarMeets, getCalendarReports, tickers } from '@/const/apis'
import { SimpleNews } from '@/pages/trend/News'
import CalendarEconomic, { CalendarMeet, CalendarReport } from '@/pages/trend/calendarHelper/CalendarEconomic'

const DEFAULT_INDEX = '000001.SH,399001.SZ,399006.SZ,000688.SH,000300.SH'
export default {
  mixins: [MescrollMixin],
  components: {
    TrendItem,
    NewsItem,
    AreaTitle,
    LiveMsg,
    TrendStockMarket,
    BriefNews,
    Calendar,
    Banner,
  },
  async onLoad() {
    await this.getBannerInfo()
    await this.getBriefNews()
    this.downCallback()
  },
  onShow() {
    this.getTickers()
  },
  onHide() {
    if (this.timer) clearTimeout(this.timer)
  },
  computed: {
    bar() {
      return this.bars[this.barIndex]
    },
  },
  data() {
    return {
      downOption: {
        auto: false,
      },
      upOption: {
        auto: false,
        page: {
          size: 20, // 每页数据的数量,默认10
        },
        // noMoreSize: 1,
        empty: {
          tip: '暂无相关数据',
        },
      },
      barIndex: 0,
      bars: [
        { name: '资讯', id: 'news', code: 'common', category: 3, data: [], y: 0, page: 1, total: 0 },
        { name: '7x24', id: 'msg', data: [], y: 0, page: 1, total: 0 },
        { name: '日历', id: 'calendar', data: [], y: 0, page: 1, total: 0, from: '', to: '', queryType: 'default' },
        // { name: '观点', id: 'deal', code: 'common', category: 0, data: [], y: 0, page: 1, total: 0 },
      ],
      isChangeBar: true,
      // 大盘指数
      tickers: [],
      // 10条7*24数据
      briefNews: [],
      bannerInfo: [],
    }
  },
  methods: {
    /**
     * 跳转发表页面
     */
    onNew() {
      this.tui.href('../trend/create')
    },
    selectBar(index) {
      index = Number(index)
      if (index !== this.barIndex) {
        this.barIndex = index
        this.isChangeBar = true // 切换了bar
        // calendar 自己调接口 不统一处理
        if (this.bar.id !== 'calendar') {
          this.downCallback()
        }
        if (this.barIndex === 0) {
          this.briefNews = []
          this.getBriefNews()
        }
      }
    },
    downCallback() {
      this.bar.page = 1
      this.bar.data = []
      this.mescroll.resetUpScroll()
      this.mescroll.scrollTo(0, 0)
    },
    async upCallback(page) {
      // if (this.isChangeBar) {
      //   this.mescroll.hideUpScroll()
      //   this.tui.showLoading()
      // }
      const bar = this.bar
      try {
        let res = null
        if (bar.id === 'news') {
          res = await this.getNews(bar)
        } else if (bar.id === 'deal') {
          res = await this.getDeal(bar)
        } else if (bar.id === 'msg') {
          res = await this.getBriefNews(bar)
        } else if (bar.id === 'calendar') {
          res = await this.getCalendar(bar)
        }
        bar.page++
        bar.total = res.total
        this.mescroll.endBySize(res.rows.length, bar.total)
      } catch (err) {
        this.mescroll.endErr()
      }
      if (this.isChangeBar) {
        this.$nextTick(() => {
          // this.tui.hideLoading()
        })
      }
      this.isChangeBar = false
    },
    async getTickers() {
      this.tickers = await tickers(DEFAULT_INDEX, 30)
      this.timer = setTimeout(this.getTickers, 1000 * 60)
    },
    async getBriefNews(bar) {
      if (!bar) {
        this.briefNews = (await getBriefNews({ limit: 10, page: 1 })).rows || []
      } else {
        const res = await getBriefNews({ limit: 20, page: bar.page })
        bar.data = bar.data.concat(res.rows)
        return res
      }
    },
    async getNews(bar) {
      const res = await articleList({
        algo: bar.code,
        category: bar.category,
        limit: 20,
        page: bar.page,
        simple: 1,
        // simple: bar.category === 2 ? 1 : 0,
      })
      bar.data = bar.data.concat((res.rows || []).map(row => new SimpleNews(row)))
      return res
    },
    async getDeal(bar) {
      const res = await articleList({
        algo: bar.code,
        category: bar.category,
        limit: 20,
        page: bar.page,
        simple: bar.category === 2 ? 1 : 0,
      })
      res.rows = res.rows || []
      res.rows.forEach(row => {
        // 去除富文本标签
        row.content = row.content.replace(/<\/?.+?>/gi, '')
      })
      bar.data = bar.data.concat(res.rows)
      return res
    },
    async getBannerInfo() {
      const res = await articleList({
        algo: 'common',
        category: 8,
        limit: 0,
        page: 1,
        simple: 0,
      })
      this.bannerInfo = res.rows
    },
    async getCalendar(bar) {
      let res
      if (bar.queryType === 'default') {
        res = await getCalendarEconomic({
          from: bar.from + ' 00:00:00',
          to: bar.to + ' 23:59:59',
          limit: 20,
          page: bar.page,
          country: bar.country,
        })
        bar.data = bar.data.concat(res.rows.map(row => new CalendarEconomic(row)))
      }
      if (bar.queryType === 'meet') {
        res = await getCalendarMeets({
          from: bar.from + ' 00:00:00',
          to: bar.to + ' 23:59:59',
          limit: 20,
          page: bar.page,
        })
        bar.data = bar.data.concat(res.rows.map(row => new CalendarMeet(row)))
      }
      if (bar.queryType === 'report') {
        res = await getCalendarReports({
          from: bar.from + ' 00:00:00',
          to: bar.to + ' 23:59:59',
          limit: 20,
          page: bar.page,
        })
        bar.data = bar.data.concat(res.rows.map(row => new CalendarReport(row)))
      }
      bar.total = res.total
      return res
    },
    calendarChange(e) {
      const {from, to, queryType, country} = e.detail
      this.bar.from = from
      this.bar.to = to
      this.bar.queryType = queryType
      this.bar.country = country
      this.downCallback()
    },
  },
}
</script>
<style lang="scss">
.tab-trend {
  height: calc(100vh - var(--window-bottom));

  .fliter-box {
    margin-top: -34rpx;
    padding: 0 34rpx;
    background-color: #f3f3f3;
    height: 64rpx;
    font-size: 26rpx;
    color: #666;
    margin-bottom: 34rpx;
    position: relative;
    z-index: 100;

    &__items {
      position: absolute;
      top: 64rpx;
      left: 0;
      right: 0;
      padding: 0 34rpx 34rpx;
      background-color: #fff;
      font-size: 30rpx;
      color: #333;
      transition: height 0.2s linear, opacity 0.1s linear;
      overflow: hidden;

      .item {
        line-height: 94rpx;
        position: relative;

        &::after {
          content: '';
          position: absolute;
          transform: scaleY(0.5) translateZ(0);
          transform-origin: 0 100%;
          bottom: 0;
          right: 0;
          left: 0;
          border-bottom-color: #c5c5c5;
          border-bottom-width: 1px;
          border-bottom-style: solid;
        }

        &.active {
          color: #8358dd;
        }
      }
    }
  }

  .news-type {
    margin-top: -17rpx;
    height: 56rpx;
    line-height: 56rpx;
    text-align: center;
    margin-bottom: 20rpx;
    font-size: 28rpx;
    color: #666;

    &__item.active {
      color: $uni-color-primary;
      position: relative;

      &::after {
        position: absolute;
        content: '';
        bottom: 0;
        left: 25%;
        // right: 0;
        width: 50%;
        height: 4rpx;
        background-color: $uni-color-primary;
      }
    }
  }

  .list-box {
    flex: 1;
    height: 0;
    position: relative;
  }
}
</style>
`

test('HtmlParser', () => {
  const p = new HtmlParser(text)
  console.log(JSON.stringify(p.exec()))
  const newText = p.toString()
  console.log(newText)
})
