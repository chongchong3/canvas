// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
// require('@/assets/js/fabric');
import Vue from 'vue';
import App from './App';
import router from './router';
// import store from './store';
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
Vue.use(ElementUI);

Vue.config.productionTip = false;



/* eslint-disable no-new */
new Vue({
    el: '#app',
    router,
    // store,
    template: '<App/>',
    components: { App }
});
router.beforeEach((to, from, next) => {
    /* 路由发生变化修改页面title */
    if (to.meta.title) {
        document.title = to.meta.title;
    }
    next();
});