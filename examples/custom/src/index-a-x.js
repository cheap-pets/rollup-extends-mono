import '@/template/index.html?title=a&fileName=[name]-vue3.html'
import './styles/index.scss'

import { createApp } from 'vue'
import MyComponent from './vue/my-component.vue'
import helloWorld from './1.txt'

// const app = new Vue({
//   render: h => h(MyComponent)
// })

const app = createApp(MyComponent)

app.mount('#app')

function helloWorldA () {
  const foo = 'bar'

  console.log('a:', helloWorld, foo)
}

helloWorldA()
