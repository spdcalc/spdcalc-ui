<template lang="pug">
.jsa
  v-container(fluid, grid-list-lg)
    v-layout(row, wrap)
      v-flex(xs12)
        h2 JSI

      v-flex(sm12, xs12)
        v-card
          v-toolbar(flat)
            v-btn(
              @click="redraw"
              , :loading="loading"
            ) Refresh
          v-responsive(ref="plotWrap", :aspect-ratio="1")
            vue-plotly(ref="plot", v-if="chart.data.length", v-bind="chart")
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import _debounce from 'lodash/debounce'
import _times from 'lodash/times'
import VuePlotly from '@statnett/vue-plotly'
import chroma from 'chroma-js'

function createGroupedArray(arr, chunkSize) {
  let groups = []
  for (let i = 0; i < arr.length; i += chunkSize) {
    groups.push(arr.slice(i, i + chunkSize))
  }
  return groups
}

export default {
  name: 'JSA'
  , props: {
    minColor: {
      type: String
      , default: 'navy'
    }
    , maxColor: {
      type: String
      , default: 'gold'
    }
  }
  , data: () => ({
    loading: false
    , resizeCount: 0
    , chartData: []
  })
  , components: {
    VuePlotly
  }
  , computed: {
    colorScale(){
      return chroma.scale([
        this.minColor
        , this.maxColor
      ]).mode('lab')
    }
    , colorScaleArray(){
      const colorScale = this.colorScale
      const divisions = 100
      return _times( divisions, (n) => {
        let val = n / (divisions - 1)
        return [val, colorScale(val).css('rgb')]
      })
    }
    , chart(){
      // hack for resize
      this.resizeCount // eslint-disable-line no-unused-expressions
      let dim = this.$refs.plotWrap ? this.$refs.plotWrap.$el.offsetWidth : 500
      return {
        data: this.chartData
        , options: {
          responsive: true
        }
        , layout: {
          hovertemplate: {
            line: {
              color: 'red'
            }
          }
          // title: {
          //   text: 'JSI Plot'
          // }
          , width: dim
          , height: dim
          , xaxis: {
            title: 'Signal wavelength (nm)'
            , showgrid: false
          }
          , yaxis: {
            title: 'Idler wavelength (nm)'
            , showgrid: false
          }
        }
        , autoResize: true
      }
    }
    , ...mapGetters('parameters', [
      'spdConfig'
      , 'integrationConfig'
    ])
  }
  , mounted(){

    const resize = _debounce(() => {
      this.resizeCount++
    }, 200)

    window.addEventListener('resize', resize, { passive: true })

    const unwatch = this.$store.watch(
      (state, getters) => ({ ...getters['parameters/spdConfig'], ...getters['parameters/integrationConfig'] })
      , () => this.redraw()
      , { immediate: true, deep: true }
    )

    this.$on('hook:beforeDestroy', () => {
      unwatch()
      window.removeEventListener('resize', resize)
    })
  }
  , methods: {
    redraw: _debounce(function(){
      this.loading = true

      this.getJSI().then( res => {
        let result = res
        let integration = this.integrationConfig
        let x0 = integration.ls_min
        let dx = (integration.ls_max - x0) / (integration.size - 1)
        let y0 = integration.li_min
        let dy = (integration.li_max - y0) / (integration.size - 1)

        this.chartData = [{
          x0
          , dx
          , y0
          , dy
          , z: createGroupedArray(result, this.integrationConfig.size)
          , type: 'heatmapgl'
          , colorscale: this.colorScaleArray
        }]

        this.loading = false
      })
    }, 300)
    , ...mapActions('jobs', [
      'getJSI'
    ])
  }
}
</script>
