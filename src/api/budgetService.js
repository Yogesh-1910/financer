// src/api/budgetService.js
import axios from 'axios';
import authService from './authService'; // Ensure this path is correct

const API_URL = process.env.REACT_APP_API_URL_BUDGET || 'http://localhost:5001/api/budget';
console.log("[FE BudgetService] API URL:", API_URL); // Verify

const getBudgetItems = async () => {
  console.log("[FE BudgetService] getBudgetItems: Fetching...");
  const response = await axios.get(API_URL, { headers: authService.getAuthHeaders() });
  console.log("[FE BudgetService] getBudgetItems: Response data:", response.data);
  return response.data;
};

const addBudgetItem = async (itemData) => {
  console.log("[FE BudgetService] addBudgetItem: Sending data:", itemData);
  const response = await axios.post(API_URL, itemData, { headers: authService.getAuthHeaders() });
  console.log("[FE BudgetService] addBudgetItem: Response data:", response.data);
  return response.data;
};

// ... updateBudgetItem and deleteBudgetItem with similar logging ...
const updateBudgetItem = async (id, itemData) => {
  console.log(`[FE BudgetService] updateBudgetItem ${id}: Sending data:`, itemData);
  const response = await axios.put(`${API_URL}/${id}`, itemData, { headers: authService.getAuthHeaders() });
  console.log(`[FE BudgetService] updateBudgetItem ${id}: Response data:`, response.data);
  return response.data;
};

const deleteBudgetItem = async (id) => {
  console.log(`[FE BudgetService] deleteBudgetItem ${id}: Deleting...`);
  await axios.delete(`${API_URL}/${id}`, { headers: authService.getAuthHeaders() });
  console.log(`[FE BudgetService] deleteBudgetItem ${id}: Success.`);
  return id;
};

export default {
  getBudgetItems,
  addBudgetItem,
  updateBudgetItem,
  deleteBudgetItem,
};