<template lang="pug">
SPDCol(:size="size")
  SPDCard.spd-panel(:class="{ 'locked': !autoUpdate }")
    v-system-bar(dark, color="panel", window, height="38")
      .plotname {{ title }}
      v-spacer

      slot(name="main-toolbar")

      //- v-menu(offset-y)
      //-   template(v-slot:activator="{ on }")
      //-     v-icon(v-on="on") mdi-dots-vertical
      //-   v-list(dense)
      //-     v-list-item(@click="")
      //-       v-list-item-icon
      //-         v-icon mdi-refresh
      //-       v-list-item-content
      //-         v-list-item-title recalculate
      IconButton(
        :icon="autoUpdateVal? 'mdi-lock-open' : 'mdi-lock'"
        , :tooltip="autoUpdateVal ? 'This plot will auto-update with parameter changes' : 'Not auto-updating, unless manually requested'"
        , @click="autoUpdateVal = !autoUpdateVal"
        , :color="autoUpdateVal ? '' : 'yellow'"
      )
      IconButton(v-show="!loading", icon="mdi-refresh", @click="$emit('refresh')", tooltip="force refresh", :loading="loading", :progress="progress")
      IconButton(v-show="loading", color="red", icon="mdi-cancel", @click="$emit('cancel')", tooltip="cancel")
      v-icon(
        color="red"
        , @click="$emit('remove')"
      ) mdi-close
    .v-system-bar.extension(v-if="$slots['secondary-toolbar']")
      .secondary-toolbar.flex-column.flex-wrap
        slot(name="secondary-toolbar")
    slot
    .v-system-bar.extension(v-if="$slots['result-bar']")
      .result-bar.flex-column.flex-wrap.flex
        slot(name="result-bar")
    v-system-bar(dark, color="panel", window)
      v-progress-circular.bottom-progress(
        v-if="loading || progress !== undefined"
        , size="16"
        , width="2"
        , color="yellow"
        , :rotate="progress && -90"
        , :indeterminate="progress === undefined"
        , :value="progress"
      )
      span.status-msg {{ statusMsg }}
      v-spacer
</template>

<script>
import IconButton from '@/components/icon-button.vue'
import SPDCol from '@/components/spd-col.vue'
import SPDCard from '@/components/spd-card.vue'

export default {
  name: 'SPDPanel',
  props: {
    title: {
      type: String,
    },
    toolbarRows: {
      type: [Number, String],
      default: 1,
    },
    size: {
      type: Number,
      default: 1,
    },
    loading: Boolean,
    progress: Number,
    autoUpdate: {
      type: Boolean,
      default: true,
    },
    statusMsg: String,
  },
  components: {
    SPDCard,
    IconButton,
    SPDCol,
  },
  data: () => ({}),
  computed: {
    autoUpdateVal: {
      get() {
        return this.autoUpdate
      },
      set(v) {
        this.$emit('update:autoUpdate', v)
      },
    },
  },
  mounted() {},
}
</script>

<style lang="sass" scoped>
.spd-panel
  $lock-color: map-get($yellow, 'darken-2')
  &.locked
    border-color: $lock-color
    box-shadow: 0px 3px 1px -2px change-color($lock-color, $alpha:.2), 0px 2px 2px 0px change-color($lock-color, $alpha:.14), 0px 1px 5px 0px change-color($lock-color, $alpha:.12)
  .extension
    display: flex
    // padding-top: 0.2em
    padding-bottom: 0em
    background: $color-panel-dark
  .secondary-toolbar
    margin-bottom: -3px
  .result-bar
    display: flex
    margin-top: 11px
    justify-content: center
  .plotname
    color: white
  .bottom-progress
    margin-right: 10px
</style>
