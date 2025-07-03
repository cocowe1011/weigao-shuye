import axios from 'axios';

const HttpUtilwms = axios.create({
  baseURL: process.env.VUE_APP_BASE_URL_WMS,
  timeout: 10000 // 请求超时时间
});

// 添加响应拦截器
HttpUtilwms.interceptors.response.use(
  (response) => {
    // 对响应数据做点什么
    return response.data;
  },
  (error) => {
    // 对响应错误做点什么
    return Promise.reject(error);
  }
);

export default HttpUtilwms;
