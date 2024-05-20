import '@/template/index.html?title=a&fileName1=[name]-vue2.html'
import './styles/index.scss'

import Vue from 'vue'
import MyComponent from './vue/my-component.vue'
import helloWorld from './1.txt'

const app = new Vue({
  render: h => h(MyComponent)
})

app.mount('#app')

function helloWorldA () {
  const foo = 'bar'

  console.log('a:', helloWorld, foo)
}

helloWorldA()
