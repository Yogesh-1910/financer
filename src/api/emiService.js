// src/api/emiService.js
import axios from 'axios';
import authService from './authService';

const API_URL = process.env.REACT_APP_API_URL_EMIS;

const getEmis = async () => {
  const response = await axios.get(API_URL, { headers: authService.getAuthHeaders() });
  return response.data;
};

const addEmi = async (emiData) => {
  const response = await axios.post(API_URL, emiData, { headers: authService.getAuthHeaders() });
  return response.data;
};

const updateEmi = async (id, emiData) => {
  const response = await axios.put(`${API_URL}/${id}`, emiData, { headers: authService.getAuthHeaders() });
  return response.data;
};

const deleteEmi = async (id) => {
  await axios.delete(`${API_URL}/${id}`, { headers: authService.getAuthHeaders() });
  return id;
};

export default {
  getEmis,
  addEmi,
  updateEmi,
  deleteEmi,
};