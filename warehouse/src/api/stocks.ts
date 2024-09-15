//定义获取数据的axios接口
import axios from 'axios';

const API_BASE_URL = 'http://haohan.space:8712'; // 替换为您的实际后端地址

export function getStocks(params) {
  return axios.get(`${API_BASE_URL}/stocks/`, {
    params: params
  });
}
export function clearAllStocks() {
  return axios.put(`${API_BASE_URL}/stocks/clear_all/`);
}
export function bulkModifyStocks(data) {
  return axios.put(`${API_BASE_URL}/stocks/bulk_modify/`, data);
}