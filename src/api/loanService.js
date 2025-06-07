// src/api/loanService.js
import axios from 'axios';
import authService from './authService';

const API_URL = process.env.REACT_APP_API_URL_LOANS;

const getLoans = async () => {
  const response = await axios.get(API_URL, { headers: authService.getAuthHeaders() });
  return response.data;
};

const addLoan = async (loanData) => {
  const response = await axios.post(API_URL, loanData, { headers: authService.getAuthHeaders() });
  return response.data;
};

const updateLoan = async (id, loanData) => {
  const response = await axios.put(`${API_URL}/${id}`, loanData, { headers: authService.getAuthHeaders() });
  return response.data;
};

const deleteLoan = async (id) => {
  await axios.delete(`${API_URL}/${id}`, { headers: authService.getAuthHeaders() });
  return id;
};

export default {
  getLoans,
  addLoan,
  updateLoan,
  deleteLoan,
};