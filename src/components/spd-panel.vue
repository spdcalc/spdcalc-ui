<template lang="pug">
SPDCol(:size="size")
  v-card.spd-panel(dark, :class="{ 'locked': !autoUpdate }")
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

      IconButton(icon="mdi-refresh", @click="$emit('refresh')", tooltip="force refresh", :loading="loading", :progress="progress")
      v-icon(
        color="red"
        , @click="$emit('remove')"
      ) mdi-close
    .v-system-bar.extension(v-if="$slots['secondary-toolbar']")
      .flex-column.flex-wrap
        slot(name="secondary-toolbar")
    slot
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

      IconButton(
        :icon="autoUpdateVal? 'mdi-lock-open' : 'mdi-lock'"
        , :tooltip="autoUpdateVal ? 'This plot will auto-update with parameter changes' : 'Not auto-updating, unless manually requested'"
        , @click="autoUpdateVal = !autoUpdateVal"
        , :color="autoUpdateVal ? '' : 'yellow'"
      )
</template>

<script>
import IconButton from '@/components/icon-button'
import SPDCol from '@/components/spd-col'

export default {
  name: 'SPDPanel'
  , props: {
    title: {
      type: String
    }
    , toolbarRows: {
      type: [Number, String]
      , default: 1
    }
    , size: {
      type: Number
      , default: 1
    }
    , loading: Boolean
    , progress: Number
    , autoUpdate: {
      type: Boolean
      , default: true
    }
    , statusMsg: String
  }
  , components: {
    IconButton
    , SPDCol
  }
  , data: () => ({
  })
  , computed: {
    autoUpdateVal: {
      get(){ return this.autoUpdate }
      , set( v ){
        this.$emit('update:autoUpdate', v)
      }
    }
  }
  , mounted(){
  }
}
</script>

<style lang="sass" scoped>
.spd-panel
  background-color: $color-panel-dark
  border: 1px solid $color-panel-dark
  $lock-color: map-get($yellow, 'darken-2')
  &.locked
    border-color: $lock-color
    box-shadow: 0px 3px 1px -2px change-color($lock-color, $alpha:.2), 0px 2px 2px 0px change-color($lock-color, $alpha:.14), 0px 1px 5px 0px change-color($lock-color, $alpha:.12)
  .extension
    display: flex
    // padding-top: 0.2em
    padding-bottom: 0em
    background: $color-panel-dark
  .plotname
    color: white
  .bottom-progress
    margin-right: 10px
  >>> .icon-btn:not(:last-child)
    margin-right: 8px
  >>> .spd-plot .js-plotly-plot .plotly .modebar
    right: 8px
  >>> .switch
    padding: 0px 8px
    align-items: center
    .v-input__slot
      margin-bottom: 0
    .v-messages
      display: none
  >>> .v-toolbar__content .v-btn.v-btn--icon
    height: 40px
    width: 40px
  >>> .props-toolbar
    display: flex
    height: 38px
    // justify-content: start
    > *
      flex: 1
      margin-left: 6px
      &:first-child
        margin-left: inherit
    .v-btn
      height: 31px
  >>> .v-system-bar--window .v-icon:last-child
    margin-right: 0
  >>> .v-icon--link
    &:hover
      color: white
    &:active
      color: inherit
</style>
