import Vue from 'vue'

export function sendMsg(params) {
  return Vue.http.post('/sendMessage', params)

 }

 export function getUserInfo(params) {
  return Vue.http.post('/login/miniSiteRegister', params)

 }
