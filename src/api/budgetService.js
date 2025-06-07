// src/api/budgetService.js
import axios from 'axios';
import authService from './authService';

const API_URL = process.env.REACT_APP_API_URL_BUDGET;

const getBudgetItems = async () => {
  const response = await axios.get(API_URL, { headers: authService.getAuthHeaders() });
  return response.data;
};

const addBudgetItem = async (itemData) => {
  console.log('[BudgetService FE] Adding item:', itemData); // Log what's being sent
  // Ensure itemData contains all necessary fields: monthYear, category, type, itemName, plannedAmount
  const response = await axios.post(API_URL, itemData, { headers: authService.getAuthHeaders() });
  return response.data;
};

const updateBudgetItem = async (id, itemData) => {
  console.log(`[BudgetService FE] Updating item ${id} with:`, itemData);
  const response = await axios.put(`${API_URL}/${id}`, itemData, { headers: authService.getAuthHeaders() });
  return response.data;
};

const deleteBudgetItem = async (id) => {
  await axios.delete(`${API_URL}/${id}`, { headers: authService.getAuthHeaders() });
  return id; // Return id for easier state update on frontend
};

export default {
  getBudgetItems,
  addBudgetItem,
  updateBudgetItem,
  deleteBudgetItem,
};