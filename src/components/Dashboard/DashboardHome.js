// src/components/Dashboard/BudgetExcelView.js
import React, { useState, useEffect, useMemo } from 'react';
import Card from '../UI/Card';
import Button from '../UI/Button';
import Input from '../UI/Input';
import styles from './BudgetExcelView.module.css';
import budgetService from '../../api/budgetService';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount || 0);
};

const getCurrentMonthYear = () => new Date().toISOString().slice(0, 7); // YYYY-MM

const expenseCategories = [
    "Rent/Mortgage", "Utilities (Elec, Water, Gas)", "Internet/Cable", "Phone Bill",
    "Groceries", "Dining Out/Takeaway", "Transportation (Fuel, Public)", "Vehicle Maintenance",
    "EMI (Non-Loan specific)", "Loan Payment", "Credit Card Payment",
    "Insurance (Health, Life, Vehicle)", "Healthcare/Medical", "Education/Courses",
    "Investment/Savings Contribution", "Subscriptions (Streaming, Apps)",
    "Personal Care", "Clothing", "Entertainment/Leisure", "Gifts/Donations",
    "Household Supplies", "Childcare/Petcare", "Other Expense"
];

const BudgetExcelView = () => {
  const [salaryInput, setSalaryInput] = useState(''); // For the controlled salary input field
  const [items, setItems] = useState([]); // All budget items (income & expenses) from backend
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // For the Expense Entry Form
  const [expenseCategory, setExpenseCategory] = useState(expenseCategories[0]);
  const [expenseName, setExpenseName] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');

  // Fetch budget items and set initial salary input
  useEffect(() => {
    const loadData = async () => {
      console.log("[BudgetView] useEffect: Loading data...");
      setIsLoading(true);
      setError(null);
      try {
        const fetchedItems = await budgetService.getBudgetItems();
        console.log("[BudgetView] useEffect: Fetched items:", fetchedItems);
        setItems(fetchedItems || []);
        const salaryItem = fetchedItems.find(it => it.type === 'income' && it.category?.toLowerCase() === 'salary');
        if (salaryItem) {
          setSalaryInput(String(salaryItem.plannedAmount || ''));
        } else {
          setSalaryInput('');
        }
      } catch (err) {
        const errorMsg = err.response?.data?.msg || err.message || "Could not load budget data.";
        console.error("[BudgetView] useEffect: Load data error:", errorMsg);
        setError(errorMsg);
      }
      setIsLoading(false);
    };
    loadData();
  }, []);

  const handleSalarySave = async () => {
    const amount = parseFloat(salaryInput);
    if (isNaN(amount) || amount < 0) {
      setError("Please enter a valid salary amount.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    console.log("[BudgetView] Attempting to save salary:", amount);
    try {
      const existingSalaryItem = items.find(it => it.type === 'income' && it.category?.toLowerCase() === 'salary');
      const salaryPayload = {
        monthYear: getCurrentMonthYear(), // Salary is typically for the current month context
        category: 'Salary',
        itemName: 'Monthly Salary',
        plannedAmount: amount,
        type: 'income',
      };

      let updatedOrAddedSalaryItem;
      if (existingSalaryItem && existingSalaryItem.id) {
        updatedOrAddedSalaryItem = await budgetService.updateBudgetItem(existingSalaryItem.id, salaryPayload);
        setItems(prev => prev.map(it => it.id === updatedOrAddedSalaryItem.id ? updatedOrAddedSalaryItem : it));
      } else {
        updatedOrAddedSalaryItem = await budgetService.addBudgetItem(salaryPayload);
        setItems(prev => [...prev, updatedOrAddedSalaryItem]);
      }
      setSalaryInput(String(updatedOrAddedSalaryItem.plannedAmount)); // Reflect saved amount
      console.log("[BudgetView] Salary saved successfully.");
    } catch (err) {
      const errorMsg = err.response?.data?.msg || "Could not save salary.";
      console.error("[BudgetView] Failed to save salary:", errorMsg);
      setError(errorMsg);
    }
    setIsSubmitting(false);
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const amountNum = parseFloat(expenseAmount);
    if (!expenseCategory || !expenseName.trim() || isNaN(amountNum) || amountNum <= 0) {
      setError("Category, expense name, and a valid positive amount are required.");
      setIsSubmitting(false);
      return;
    }

    const newExpenseData = {
      monthYear: getCurrentMonthYear(), // Expenses are for the current month context
      category: expenseCategory,
      type: 'expense',
      itemName: expenseName.trim(),
      plannedAmount: amountNum,
    };
    console.log("[BudgetView] Submitting new expense:", newExpenseData);

    try {
      const addedItem = await budgetService.addBudgetItem(newExpenseData);
      setItems(prevItems => [...prevItems, addedItem]);
      // Reset expense form
      setExpenseCategory(expenseCategories[0]);
      setExpenseName('');
      setExpenseAmount('');
      console.log("[BudgetView] Expense item added successfully:", addedItem);
    } catch (err) {
      const errorMsg = err.response?.data?.msg || "Could not add expense.";
      console.error("[BudgetView] Add expense error:", errorMsg);
      setError(errorMsg);
    }
    setIsSubmitting(false);
  };

  const handleRemoveItem = async (id) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      setError(null);
      setIsSubmitting(true);
      try {
        const itemToDelete = items.find(it => it.id === id);
        if (itemToDelete && itemToDelete.category?.toLowerCase() === 'salary' && itemToDelete.type === 'income') {
            // If deleting the main salary item, also clear the salaryInput state
            await budgetService.deleteBudgetItem(id);
            setSalaryInput('');
        } else {
            await budgetService.deleteBudgetItem(id);
        }
        setItems(prev => prev.filter(item => item.id !== id));
      } catch (err) {
        setError("Could not delete item.");
      }
      setIsSubmitting(false);
    }
  };

  // Memoized calculations for the display table
  const derivedSalaryAmount = useMemo(() => {
    const salaryItem = items.find(it => it.type === 'income' && it.category?.toLowerCase() === 'salary');
    return parseFloat(salaryItem?.plannedAmount) || 0;
  }, [items]);

  const otherIncomes = useMemo(() => {
    return items.filter(it => it.type === 'income' && it.category?.toLowerCase() !== 'salary');
  }, [items]);

  const allExpenses = useMemo(() => {
    return items.filter(it => it.type === 'expense');
  }, [items]);

  const totalIncome = useMemo(() => {
    return derivedSalaryAmount + otherIncomes.reduce((sum, item) => sum + (parseFloat(item.plannedAmount) || 0), 0);
  }, [derivedSalaryAmount, otherIncomes]);

  const totalExpenses = useMemo(() => {
    return allExpenses.reduce((sum, item) => sum + (parseFloat(item.plannedAmount) || 0), 0);
  }, [allExpenses]);

  const netSavings = useMemo(() => totalIncome - totalExpenses, [totalIncome, totalExpenses]);

  const budgetTableDisplayData = useMemo(() => {
    const displayRows = [];

    // 1. Salary Row
    displayRows.push({
      key: 'main-salary-row',
      id: items.find(it => it.type === 'income' && it.category?.toLowerCase() === 'salary')?.id, // For potential delete
      category: 'Salary',
      item: 'Monthly Salary',
      monthly: derivedSalaryAmount,
      type: 'income'
    });

    // 2. Other Income items
    otherIncomes.forEach(item => {
      displayRows.push({
        key: `item-${item.id}`, id: item.id, category: item.category,
        item: item.itemName, monthly: parseFloat(item.plannedAmount) || 0, type: 'income'
      });
    });

    // 3. All Expense items
    allExpenses.forEach(item => {
      displayRows.push({
        key: `item-${item.id}`, id: item.id, category: item.category,
        item: item.itemName, monthly: parseFloat(item.plannedAmount) || 0, type: 'expense'
      });
    });

    // 4. Summary Rows
    displayRows.push({ key: 'total-income-row', category: 'Summary', item: 'Total Income', monthly: totalIncome, type: 'summary', isTotalIncomeStyle: true });
    displayRows.push({ key: 'total-expenses-row', category: 'Summary', item: 'Total Expenses', monthly: totalExpenses, type: 'summary', isTotalExpenseStyle: true });
    displayRows.push({ key: 'net-savings-row', category: 'Summary', item: 'Net Savings', monthly: netSavings, type: 'summary', isNetSavingsStyle: true });

    return displayRows;
  }, [derivedSalaryAmount, otherIncomes, allExpenses, totalIncome, totalExpenses, netSavings, items]);


  const handleExportToExcel = () => {
    const dataForExport = budgetTableDisplayData.map(row => ({
      Category: row.category,
      Item: row.item,
      Type: row.type,
      'Monthly Amount (INR)': row.monthly,
    }));
    if(dataForExport.length === 0) { alert("No data to export."); return; }
    const ws = XLSX.utils.json_to_sheet(dataForExport);
    ws['!cols'] = [ { wch: 25 }, { wch: 35 }, { wch: 10 }, { wch: 20 } ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Budget');
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    saveAs(dataBlob, `budget_overview_${getCurrentMonthYear()}.xlsx`);
  };

  if (isLoading) {
    return <Card title="Budget Manager"><p className={styles.loadingMessage}>Loading budget data...</p></Card>;
  }

  return (
    <Card title="Budget Manager">
      {error && <p className={styles.errorMessage}>{error}</p>}

      <div className={styles.salarySection}>
        <Input
          label="Monthly Salary (INR):"
          type="number"
          name="salaryInput"
          value={salaryInput}
          onChange={(e) => setSalaryInput(e.target.value)}
          onBlur={handleSalarySave} // Save when input loses focus
          placeholder="Enter your monthly salary"
          disabled={isSubmitting}
        />
        {/* Could add a small save button next to salary if onBlur is not preferred */}
        {/* <Button onClick={handleSalarySave} disabled={isSubmitting} className={styles.salarySaveButton}>Save Salary</Button> */}
      </div>

      <form onSubmit={handleAddExpense} className={styles.expenseForm}>
        <h4>Add New Expense</h4>
        <div className={styles.formRow}>
            <div className={styles.inputGroup}>
                <label htmlFor="expenseCategory">Expense Category*</label>
                <select
                    id="expenseCategory"
                    name="expenseCategory"
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value)}
                    className={styles.selectInput}
                    required
                    disabled={isSubmitting}
                >
                    {expenseCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
            </div>
            <Input
                label="Name of the Expense*"
                name="expenseName"
                placeholder="e.g., Electricity Bill, Netflix"
                value={expenseName}
                onChange={(e) => setExpenseName(e.target.value)}
                required
                disabled={isSubmitting}
            />
        </div>
        <div className={styles.formRow}>
            <Input
                label="Amount (INR)*"
                name="expenseAmount"
                type="number"
                step="0.01"
                placeholder="Expense amount"
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
                required
                disabled={isSubmitting}
            />
            <Button type="submit" className={styles.addExpenseButton} disabled={isSubmitting}>
                {isSubmitting ? 'Adding...' : 'Add Expense'}
            </Button>
        </div>
      </form>

      <div className={styles.tableContainer}>
        <table className={styles.budgetTable}>
          <thead>
            <tr>
              <th>Category</th>
              <th>Item Name / Description</th>
              <th>Type</th>
              <th>Monthly Amount</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {budgetTableDisplayData.map((row) => (
              <tr key={row.key} className={`
                ${row.type === 'income' ? styles.incomeRow : ''}
                ${row.type === 'expense' ? styles.expenseRow : ''}
                ${row.isTotalIncomeStyle ? styles.totalIncomeRow : ''}
                ${row.isTotalExpenseStyle ? styles.totalExpenseRow : ''}
                ${row.isNetSavingsStyle ? styles.netSavingsRow : ''}
              `}>
                <td>{row.category}</td>
                <td>{row.item}</td>
                <td>{row.type}</td>
                <td className={styles.amountCell}>{formatCurrency(row.monthly)}</td>
                <td>
                  {row.id && ( // Only show delete for items that have an ID (from DB)
                    <Button
                      onClick={() => handleRemoveItem(row.id)}
                      variant="text"
                      className={`${styles.actionButtonSmall} ${styles.deleteButton}`}
                      title="Delete"
                      disabled={isSubmitting}
                    >
                      ✕
                    </Button>
                  )}
                </td>
              </tr>
            ))}
            {items.length === 0 && !isLoading && parseFloat(salaryInput) === 0 && (
                 <tr><td colSpan="5" className={styles.noDataCell}>No budget data. Start by adding your salary and expenses.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Button onClick={handleExportToExcel} className={styles.exportButton} disabled={(items.length === 0 && parseFloat(salaryInput) === 0) || isSubmitting}>
        Export to Excel
      </Button>
    </Card>
  );
};

export default BudgetExcelView;