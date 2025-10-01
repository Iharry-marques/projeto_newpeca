// frontend/src/api/client.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000',
  withCredentials: true, 
});

export default api;
