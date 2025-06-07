import React, { useState, useEffect, useMemo } from 'react';
import Card from '../UI/Card';
import styles from './LoanEMITracker.module.css';
import Input from '../UI/Input';
import Button from '../UI/Button';

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);
};

const LoanEMITracker = () => {
  const [loans, setLoans] = useState(() => {
    const savedLoans = localStorage.getItem('loanTrackerLoans');
    return savedLoans ? JSON.parse(savedLoans) : [
      { id: 1, name: 'Home Loan', totalAmount: 2000000, monthlyPayment: 20000, interestRate: 7.5, termMonths: 240, paidMonths: 60 },
      { id: 2, name: 'Car Loan', totalAmount: 500000, monthlyPayment: 10000, interestRate: 9, termMonths: 60, paidMonths: 12 },
    ];
  });

  const [newLoan, setNewLoan] = useState({ name: '', totalAmount: '', monthlyPayment: '', interestRate: '', termMonths: '', paidMonths: '0' });
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    localStorage.setItem('loanTrackerLoans', JSON.stringify(loans));
  }, [loans]);

  const handleLoanChange = (e) => {
    const { name, value } = e.target;
    setNewLoan({...newLoan, [name]: value });
  }

  const handleAddLoan = (e) => {
    e.preventDefault();
    if(!newLoan.name || !newLoan.totalAmount || !newLoan.monthlyPayment || !newLoan.termMonths) {
        alert("Name, Total Amount, Monthly Payment, and Term are required.");
        return;
    }
    setLoans([...loans, {
        id: Date.now(),
        ...newLoan,
        totalAmount: parseFloat(newLoan.totalAmount),
        monthlyPayment: parseFloat(newLoan.monthlyPayment),
        interestRate: newLoan.interestRate ? parseFloat(newLoan.interestRate) : 0,
        termMonths: parseInt(newLoan.termMonths),
        paidMonths: parseInt(newLoan.paidMonths) || 0
    }]);
    setNewLoan({ name: '', totalAmount: '', monthlyPayment: '', interestRate: '', termMonths: '', paidMonths: '0' });
    setIsAdding(false);
  };

  const handleRemoveLoan = (id) => {
    if (window.confirm("Are you sure you want to remove this loan?")) {
        setLoans(loans.filter(loan => loan.id !== id));
    }
  };

  const loanDetails = useMemo(() => {
    return loans.map(loan => {
        const remainingMonths = loan.termMonths - loan.paidMonths;
        const remainingAmount = remainingMonths * loan.monthlyPayment; // Simplified, doesn't account for interest portion reduction over time
        return { ...loan, remainingMonths, remainingAmount };
    });
  }, [loans]);


  return (
    <Card title="Loan & EMI Tracker" actions={!isAdding && <Button onClick={() => setIsAdding(true)}>+ Add Loan/EMI</Button>}>
        {isAdding && (
            <form onSubmit={handleAddLoan} className={styles.addForm}>
                <h4>Add New Loan/EMI</h4>
                <Input name="name" placeholder="Loan Name (e.g., Personal Loan, Credit Card EMI)" value={newLoan.name} onChange={handleLoanChange} required />
                <div className={styles.formRow}>
                    <Input name="totalAmount" type="number" label="Total Loan Amount" placeholder="e.g., 100000" value={newLoan.totalAmount} onChange={handleLoanChange} required />
                    <Input name="monthlyPayment" type="number" label="Monthly Payment (EMI)" placeholder="e.g., 5000" value={newLoan.monthlyPayment} onChange={handleLoanChange} required />
                </div>
                <div className={styles.formRow}>
                    <Input name="interestRate" type="number" label="Interest Rate (%)" placeholder="e.g., 12.5" value={newLoan.interestRate} onChange={handleLoanChange} />
                    <Input name="termMonths" type="number" label="Total Term (Months)" placeholder="e.g., 24" value={newLoan.termMonths} onChange={handleLoanChange} required />
                </div>
                 <Input name="paidMonths" type="number" label="Months Already Paid" placeholder="e.g., 6" value={newLoan.paidMonths} onChange={handleLoanChange} />
                <div className={styles.formActions}>
                    <Button type="submit">Add Loan</Button>
                    <Button type="button" variant="secondary" onClick={() => setIsAdding(false)}>Cancel</Button>
                </div>
            </form>
        )}

        {loanDetails.length === 0 && !isAdding && <p>No loans or EMIs added yet. Click "+ Add Loan/EMI" to start.</p>}

        <div className={styles.loanGrid}>
            {loanDetails.map(loan => (
            <div key={loan.id} className={styles.itemCard}>
                <div className={styles.itemHeader}>
                    <h4>{loan.name}</h4>
                    <Button onClick={() => handleRemoveLoan(loan.id)} variant="danger" className={styles.deleteButton}>✕</Button>
                </div>
                <p><strong>EMI:</strong> {formatCurrency(loan.monthlyPayment)} / month</p>
                <p><strong>Total Amount:</strong> {formatCurrency(loan.totalAmount)}</p>
                <p><strong>Interest:</strong> {loan.interestRate || "N/A"}%</p>
                <p><strong>Term:</strong> {loan.paidMonths} / {loan.termMonths} months paid</p>
                <div className={styles.progressBarContainer}>
                    <div
                        className={styles.progressBar}
                        style={{ width: `${(loan.paidMonths / loan.termMonths) * 100}%` }}
                    ></div>
                </div>
                <p><strong>Remaining:</strong> {loan.remainingMonths} months ({formatCurrency(loan.remainingAmount)})</p>
            </div>
            ))}
        </div>
    </Card>
  );
};

export default LoanEMITracker;