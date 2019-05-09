<template>
  <v-container>
    <v-layout
      text-xs-center
      wrap
    >
      <v-flex xs12>
        <v-img
          :src="require('../assets/logo.svg')"
          class="my-3"
          contain
          height="200"
        ></v-img>
      </v-flex>

      <v-flex mb-4>
        <h1 class="display-2 font-weight-bold mb-3">
          Welcome to Vuetify
        </h1>
        <p class="subheading font-weight-regular">
          For help and collaboration with other Vuetify developers,
          <br>please join our online
          <a href="https://community.vuetifyjs.com" target="_blank">Discord Community</a>
        </p>
      </v-flex>

      <v-flex
        mb-5
        xs12
      >
        <h2 class="headline font-weight-bold mb-3">What's next?</h2>

        <v-layout justify-center>
          <a
            v-for="(next, i) in whatsNext"
            :key="i"
            :href="next.href"
            class="subheading mx-3"
            target="_blank"
          >
            {{ next.text }}
          </a>
        </v-layout>
      </v-flex>

      <v-flex
        xs12
        mb-5
      >
        <h2 class="headline font-weight-bold mb-3">Important Links</h2>

        <v-layout justify-center>
          <a
            v-for="(link, i) in importantLinks"
            :key="i"
            :href="link.href"
            class="subheading mx-3"
            target="_blank"
          >
            {{ link.text }}
          </a>
        </v-layout>
      </v-flex>

      <v-flex
        xs12
        mb-5
      >
        <h2 class="headline font-weight-bold mb-3">Ecosystem</h2>

        <v-layout justify-center>
          <a
            v-for="(eco, i) in ecosystem"
            :key="i"
            :href="eco.href"
            class="subheading mx-3"
            target="_blank"
          >
            {{ eco.text }}
          </a>
        </v-layout>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>

function calc( val ){
  let x_re = val
  let x_im = val * val

  //sqrt x
  let r = Math.sqrt((x_re * x_re)+(x_im * x_im))
  let realNum = x_re + r
  let denom = Math.sqrt(2 * realNum)
  let sqrt_re = realNum / denom
  let sqrt_im = x_im / denom

  // exp x
  r = Math.exp(x_re)
  let exp_re = r * Math.cos(x_im)
  let exp_im = r * Math.sin(x_im)

  let y_re = sqrt_re - exp_re
  let y_im = sqrt_im - exp_im

  // norm
  return Math.sqrt(y_re * y_re + y_im * y_im)
}

function init( counts ){
  let test_values = new Float64Array( counts )

  for (let i = 0; i < counts; i++){
    test_values[i] = i + 1
  }

  return test_values
}

function js_speed_test(counts){
  let test_values = init( counts )
  let total = 0

  console.log(`JS: Testing with ${counts} calculations`)

  let start = window.performance.now()
  for (let i = 0; i < counts; i++){
    //sqrt x
    total += calc( 1 / test_values[i] )
  }

  let end = window.performance.now()

  let elapsed = end - start
  console.log(`JS: Calculation took ${elapsed} ms`)

  return total
}

export default {
  data: () => ({
    ecosystem: [
      {
        text: 'vuetify-loader'
        , href: 'https://github.com/vuetifyjs/vuetify-loader'
      }
      , {
        text: 'github'
        , href: 'https://github.com/vuetifyjs/vuetify'
      }
      , {
        text: 'awesome-vuetify'
        , href: 'https://github.com/vuetifyjs/awesome-vuetify'
      }
    ]
    , importantLinks: [
      {
        text: 'Documentation'
        , href: 'https://vuetifyjs.com'
      }
      , {
        text: 'Chat'
        , href: 'https://community.vuetifyjs.com'
      }
      , {
        text: 'Made with Vuetify'
        , href: 'https://madewithvuetifyjs.com'
      }
      , {
        text: 'Twitter'
        , href: 'https://twitter.com/vuetifyjs'
      }
      , {
        text: 'Articles'
        , href: 'https://medium.com/vuetify'
      }
    ]
    , whatsNext: [
      {
        text: 'Explore components'
        , href: 'https://vuetifyjs.com/components/api-explorer'
      }
      , {
        text: 'Select a layout'
        , href: 'https://vuetifyjs.com/layout/pre-defined'
      }
      , {
        text: 'Frequently Asked Questions'
        , href: 'https://vuetifyjs.com/getting-started/frequently-asked-questions'
      }

    ]
  })
  , mounted(){
    setTimeout(() => {
      let iterations = 10000
      let result

      result = js_speed_test(iterations)
      console.log('JS result: ', result)

      // console.time('WASM test')
      result = this.$wasm.wasmTest.speed_test(iterations)
      console.log('WASM result: ', result)


    }, 1000)
  }
}
</script>

<style>

</style>
