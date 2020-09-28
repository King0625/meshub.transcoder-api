import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/v2/',
    name: 'Home',
    component: Home
  },
  {
    name: 'anyUrl',
    path: '/v2/*',
    redirect: { path: '/v2/' }
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
