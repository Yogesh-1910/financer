import React, { useState, useEffect, useMemo } from 'react';
import Card from '../UI/Card';
import Button from '../UI/Button';
import Input from '../UI/Input';
import styles from './BudgetExcelView.module.css';
import * as XLSX from 'xlsx'; // Import the xlsx library
import { saveAs } from 'file-saver'; // Import file-saver

// Helper to format currency (already present in your code)
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);
};


const BudgetExcelView = () => {
  // ... (all your existing state and useEffect hooks: salary, items, newItem, etc.)
  const [salary, setSalary] = useState(() => parseFloat(localStorage.getItem('budgetSalary')) || 75000);
  const [items, setItems] = useState(() => {
    const savedItems = localStorage.getItem('budgetItems');
    return savedItems ? JSON.parse(savedItems) : [
      { id: 1, category: 'EMI', name: 'Home Loan EMI', monthlyAmount: 20000, totalAmount: 2400000, type: 'expense' },
      { id: 2, category: 'EMI', name: 'Car Loan EMI', monthlyAmount: 8000, totalAmount: 480000, type: 'expense' },
      { id: 3, category: 'Living Expenses', name: 'Groceries', monthlyAmount: 10000, type: 'expense' },
      { id: 4, category: 'Living Expenses', name: 'Utilities (Elec, Water)', monthlyAmount: 3000, type: 'expense' },
      { id: 5, category: 'Investment', name: 'Mutual Fund SIP', monthlyAmount: 5000, type: 'expense' },
    ];
  });

  const [newItem, setNewItem] = useState({ category: 'Living Expenses', name: '', monthlyAmount: '', type: 'expense' });
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    localStorage.setItem('budgetSalary', salary.toString());
  }, [salary]);

  useEffect(() => {
    localStorage.setItem('budgetItems', JSON.stringify(items));
  }, [items]);

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newItem.name || !newItem.monthlyAmount) {
        alert("Please provide item name and monthly amount.");
        return;
    }
    setItems([...items, { ...newItem, id: Date.now(), monthlyAmount: parseFloat(newItem.monthlyAmount) }]);
    setNewItem({ category: 'Living Expenses', name: '', monthlyAmount: '', type: 'expense' });
    setIsAdding(false);
  };

  const handleRemoveItem = (id) => {
    if(window.confirm("Are you sure you want to delete this item?")) {
        setItems(items.filter(item => item.id !== id));
    }
  };

  const totalExpenses = useMemo(() => {
    return items.reduce((sum, item) => item.type === 'expense' ? sum + item.monthlyAmount : sum, 0);
  }, [items]);

  const netSavings = useMemo(() => salary - totalExpenses, [salary, totalExpenses]);

  // This is the data that will be displayed in the table AND exported
  const budgetSummary = useMemo(() => {
    const summary = [
        { category: 'Income', item: 'Monthly Salary', monthly: salary, total: salary * 12, isHeader: true },
    ];
    items.forEach(it => {
        summary.push({
            category: it.category,
            item: it.name,
            monthly: it.monthlyAmount,
            total: it.totalAmount || it.monthlyAmount * 12,
            id: it.id
        });
    });
    summary.push({ category: 'Summary', item: 'Total Expenses', monthly: totalExpenses, total: totalExpenses * 12, isHeader: true, isExpenseTotal: true });
    summary.push({ category: 'Summary', item: 'Net Savings', monthly: netSavings, total: netSavings * 12, isHeader: true, isSavings: true });
    return summary;
  }, [salary, items, totalExpenses, netSavings]);


  // THE EXPORT FUNCTIONALITY
  const handleExportToExcel = () => {
    // 1. Prepare data for Excel (array of objects or array of arrays)
    // We'll use the budgetSummary data but format it slightly for export
    const dataForExport = budgetSummary.map(row => ({
      Category: row.category,
      Item: row.item,
      'Monthly Amount (INR)': row.monthly, // Numbers are fine for Excel
      'Est. Yearly / Total (INR)': row.total
    }));

    // 2. Create a new worksheet
    const ws = XLSX.utils.json_to_sheet(dataForExport);

    // Optional: Adjust column widths
    // This is a bit more complex, here's a basic example
    const columnWidths = [
        { wch: 25 }, // Category
        { wch: 35 }, // Item
        { wch: 20 }, // Monthly Amount
        { wch: 25 }  // Yearly Amount
    ];
    ws['!cols'] = columnWidths;

    // 3. Create a new workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Budget'); // 'Budget' is the sheet name

    // 4. Generate Excel file and trigger download
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });

    const fileName = `budget_overview_${new Date().toISOString().slice(0,10)}.xlsx`;
    saveAs(dataBlob, fileName);
  };

  return (
    <Card title="Monthly Budget Overview" actions={!isAdding && <Button onClick={() => setIsAdding(true)}>+ Add Item</Button>}>
      {/* ... (your existing JSX for salary input and add item form) ... */}
      <div className={styles.controls}>
        <Input
          label="Your Gross Monthly Salary (INR):"
          type="number"
          value={salary}
          onChange={(e) => setSalary(parseFloat(e.target.value) || 0)}
          name="salary"
        />
      </div>

      {isAdding && (
        <form onSubmit={handleAddItem} className={styles.addItemForm}>
          <h4>Add New Budget Item</h4>
          <div className={styles.formRow}>
            <Input name="name" placeholder="Item Name (e.g., Rent, Netflix)" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} required />
            <Input name="monthlyAmount" type="number" placeholder="Monthly Amount" value={newItem.monthlyAmount} onChange={e => setNewItem({...newItem, monthlyAmount: e.target.value})} required />
          </div>
          <div className={styles.formRow}>
            <div className={styles.inputGroup}>
              <label htmlFor="category">Category</label>
              <select id="category" name="category" value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})} className={styles.selectInput}>
                <option value="Living Expenses">Living Expenses</option>
                <option value="EMI">EMI / Loan</option>
                <option value="Investment">Investment</option>
                <option value="Subscription">Subscription</option>
                <option value="Discretionary">Discretionary</option>
                <option value="Other Expense">Other Expense</option>
              </select>
            </div>
            <div className={styles.inputGroup}> {/* Placeholder for type if needed later */} </div>
          </div>
          <div className={styles.formActions}>
            <Button type="submit">Add Item</Button>
            <Button type="button" variant="secondary" onClick={() => setIsAdding(false)}>Cancel</Button>
          </div>
        </form>
      )}

      <div className={styles.tableContainer}>
        <table className={styles.budgetTable}>
          <thead>
            <tr>
              <th>Category</th>
              <th>Item</th>
              <th>Monthly Amount</th>
              <th>Est. Yearly / Total</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {budgetSummary.map((item, index) => (
              <tr key={item.id || `summary-${index}`} className={`
                ${item.isHeader && styles.headerRow}
                ${item.category === 'Income' && styles.incomeRow}
                ${item.isSavings && styles.savingsRow}
                ${item.isExpenseTotal && styles.expenseTotalRow}
              `}>
                <td>{item.category}</td>
                <td>{item.item}</td>
                <td>{formatCurrency(item.monthly)}</td>
                <td>{formatCurrency(item.total)}</td>
                <td>
                  {!item.isHeader && item.id && (
                    <Button onClick={() => handleRemoveItem(item.id)} variant="danger" className={styles.deleteButton}>✕</Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* MODIFIED EXPORT BUTTON */}
      <Button onClick={handleExportToExcel} className={styles.exportButton}>
        Export to Excel
      </Button>
    </Card>
  );
};

export default BudgetExcelView;