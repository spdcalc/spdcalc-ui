<template lang="pug">
v-card.spd-card(dark)
  slot
</template>

<script>
export default {
  name: 'SPDCard'
}
</script>

<style lang="sass" scoped>
.spd-card
  background-color: $color-panel-dark
  border: 1px solid $color-panel-dark
  ::v-deep(.container)
    padding: 8px
  ::v-deep(.icon-btn:not(:last-child))
    margin-right: 8px
  ::v-deep(.spd-plot .js-plotly-plot .plotly .modebar)
    right: 8px
  ::v-deep(.switch)
    padding: 0px 8px
    align-items: center
    .v-input__slot
      margin-bottom: 0
    .v-messages
      display: none
  ::v-deep(.v-toolbar__content .v-btn.v-btn--icon)
    height: 40px
    width: 40px
  ::v-deep(.props-toolbar)
    display: flex
    flex-wrap: wrap
    margin: 0 -3px
    > *
      flex: 1
      min-width: 10em
      margin: 0 3px 6px

    // @media screen and (min-width: map-get($grid-breakpoints, 'md'))
    //   > *
    //     max-width: 15em

    .v-btn
      height: 31px
  ::v-deep(.v-system-bar--window .v-icon:last-child)
    margin-right: 0
  ::v-deep(.v-icon--link)
    &:hover
      color: white
    &:active
      color: inherit
</style>
