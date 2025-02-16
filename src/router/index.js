import Vue from 'vue';
import VueRouter from 'vue-router';
import Login from '../views/login/Login.vue'
import HomePage from '../views/home/HomePage.vue'

Vue.use(VueRouter);

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/homePage',
    name: 'HomePage',
    component: HomePage,
    children: [
      // WelcomPage
      {
        path: 'welcomPage',
        component: () => import('../views/home/WelcomPage.vue'),
        name: 'WelcomPage'
      },
      {
        path: 'MonitorScreen',
        component: () => import('../views/home/MonitorScreen.vue'),
        name: 'MonitorScreen'
      },
      {
        path: 'aboutPage',
        component: () => import('../views/home/AboutPage.vue'),
        name: 'AboutPage'
      }
    ]
  }
];

const router = new VueRouter({
  mode: 'hash',
  base: process.env.BASE_URL,
  routes
});

export default router;
