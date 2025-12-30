import axios from "axios";

const api = axios.create({
  baseURL: __DEV__ ? "http://192.168.0.105:8000" : "https://api.yourdomain.com",
});

export default api;
