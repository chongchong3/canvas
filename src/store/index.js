import Vue from 'vue';
import Vuex from 'vuex';
import fabricObj from './modules/fabricObj'; 
import getters from './getters';

Vue.use(Vuex);

const store = new Vuex.Store({
    modules: {
        fabricObj
    },
    getters
});

export default store;
