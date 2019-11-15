<template lang="pug">
SPDPanel(
  title="Heralding vs Waist Size"
  , @refresh="redraw"
  , @remove="$emit('remove')"
  , :loading="loading"
  , toolbar-rows="1"
  , :auto-update.sync="panelSettings.autoUpdate"
  , :status-msg="statusMsg"
)
  template(#secondary-toolbar)
    v-toolbar-items.props-toolbar
      ParameterInput(
        label="min"
        , v-model="panelSettings.xaxis.min"
        , lazy
        , :sigfigs="2"
        , units="µm"
      )
      ParameterInput(
        label="max"
        , v-model="panelSettings.xaxis.max"
        , lazy
        , :sigfigs="2"
        , units="µm"
      )
      ParameterInput(
        label="Steps"
        , v-model="panelSettings.xaxis.steps"
        , step="1"
        , :sigfigs="0"
        , lazy
      )
      ParameterInput(
        label="Resolution"
        , v-model="panelSettings.jsiResolution"
        , step="1"
        , :sigfigs="0"
        , tooltip="The grid size of the JSA integration"
        , lazy
      )
  SPDLinePlot(
    :plotly-config="plotlyConfig"
    , :chart-data="chartData"
    , xTitle="Waist Size (µm)"
    , yTitle="Efficiency"
    , y2Title="Counts / s"
    , @updatedView="plotView = $event"
  )
    template(#chart-bar)
      IconButton(
        v-if="plotView"
        , icon="mdi-target-variant"
        , tooltip="compute data over current plot view"
        , @click="applyRange"
      )
</template>

<script>
import { mapGetters } from 'vuex'
import panelMixin from '@/components/panel.mixin'
import SPDLinePlot from '@/components/spd-line-plot'
import _debounce from 'lodash/debounce'
import colors from 'vuetify/lib/util/colors'

export default {
  name: 'heralding-v-waist-series'
  , mixins: [panelMixin]
  , props: {
  }
  , data: () => ({
    panelSettings: {
      xaxis: {
        min: 0
        , max: 130
        , steps: 10
      }
      , jsiResolution: 20
    }
    , plotView: null
    , data: null
    , xAxisData: []
    , plotlyConfig: {
      layout: {
        yaxis2: {
          titlefont: {
            color: colors.green.darken2
          }
          , tickfont: {
            color: colors.green.darken2
          }
        }
      }
    }
  })
  , components: {
    SPDLinePlot
  }
  , computed: {
    chartData(){
      return this.data ? [{
        x: this.xAxisData
        , y: this.data.map(r => r.signal_efficiency)
        , type: 'scatter'
        , mode: 'lines+markers'
        , line: { shape: 'spline' }
        , name: 'Signal'
        , spline: {
          color: colors.blueGrey.darken2
        }
        , marker: {
          color: colors.blueGrey.darken2
        }
      }, {
        x: this.xAxisData
        , y: this.data.map(r => r.idler_efficiency)
        , type: 'scatter'
        , mode: 'lines+markers'
        , line: { shape: 'spline' }
        , name: 'Idler'
        , spline: {
          color: colors.orange.darken1
        }
        , marker: {
          color: colors.orange.darken1
        }
      }, {
        x: this.xAxisData
        , y: this.data.map(r => r.coincidences_rate)
        , type: 'scatter'
        , mode: 'lines+markers'
        , line: { shape: 'spline' }
        , name: 'Coincidences'
        , yaxis: 'y2'
        , spline: {
          color: colors.green.base
        }
        , marker: {
          color: colors.green.base
        }
      }] : []
    }
    , ...mapGetters('parameters', [
      'spdConfig'
      , 'integrationConfig'
    ])
  }
  , created(){
    this.calculate = _debounce(this.calculate.bind(this), 500)
  }
  , mounted(){
    this.$on('parametersUpdated', () => this.redraw())
    this.redraw()
  }
  , watch: {
    panelSettings: 'redraw'
  }
  , methods: {
    redraw(){
      this.calculate()
    }
    , getXAxisData(){
      const xaxis = this.panelSettings.xaxis
      return this.getStepArray(xaxis.min, xaxis.max, xaxis.steps)
    }
    , calculate(){
      this.loading = true
      const xaxis = this.panelSettings.xaxis
      this.spdWorkers.execSingle(
        'getHeraldingResultsVsWaist'
        , this.spdConfig
        , { ...this.integrationConfig, size: this.panelSettings.jsiResolution }
        , [xaxis.min, xaxis.max, xaxis.steps | 0]
      ).then( ({ result, duration }) => {
        this.data = result
        this.xAxisData = this.getXAxisData()
        this.status = `done in ${duration.toFixed(2)}ms`
      }).catch( error => {
        this.$store.dispatch('error', { error, context: 'while calculating Heralding vs waist plot' })
      }).finally(() => {
        this.loading = false
      })
    }
    , applyRange(){
      const xRange = this.plotView.xRange
      this.panelSettings.xaxis = {
        min: xRange[0]
        , max: xRange[1]
        , steps: this.panelSettings.xaxis.steps
      }
    }
  }
}
</script>

<style lang="sass">
</style>
