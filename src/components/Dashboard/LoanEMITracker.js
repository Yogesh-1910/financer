// src/components/Dashboard/LoanEMITracker.js
import React, { useState, useEffect, useMemo } from 'react'; // Ensure all used hooks are imported
import Card from '../UI/Card';
import styles from './LoanEMITracker.module.css';
import Input from '../UI/Input';
import Button from '../UI/Button';
import loanService from '../../api/loanService';
import emiService from '../../api/emiService';
import { useAuth } from '../../contexts/AuthContext'; // Import useAuth if using currentUser for anything

// --- EXPORT THE EVENT NAME ---
export const FINANCIAL_ENTITIES_UPDATED_EVENT = 'financialEntitiesUpdated';

const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount || 0);

const LoanEMITracker = () => {
  const { currentUser } = useAuth(); // Get currentUser if needed for user-specific actions/data
  const [loans, setLoans] = useState([]);
  const [emis, setEmis] = useState([]);
  const [isLoadingLoans, setIsLoadingLoans] = useState(true);
  const [isLoadingEmis, setIsLoadingEmis] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(null);
  const [editingItem, setEditingItem] = useState(null);

  const initialLoanState = { loanName: '', totalLoanAmount: '', monthlyPaymentCalculated: '', interestRate: '', loanTermMonths: '', paidMonths: '0', startDate: new Date().toISOString().slice(0,10), lenderName: '' };
  const initialEmiState = { emiDescription: '', totalEmiAmount: '', monthlyEmiPayment: '', numberOfInstallments: '', paidInstallments: '0', emiStartDate: new Date().toISOString().slice(0,10), loanId: null };
  const [formData, setFormData] = useState({});

  useEffect(() => {
    const loadData = async () => {
      if (!currentUser) { // Prevent fetching if no user
        setIsLoadingLoans(false); setIsLoadingEmis(false);
        return;
      }
      setIsLoadingLoans(true); setIsLoadingEmis(true); setError(null);
      try {
        const [fetchedLoans, fetchedEmis] = await Promise.all([
          loanService.getLoans(),
          emiService.getEmis()
        ]);
        setLoans(fetchedLoans || []);
        setEmis(fetchedEmis || []);
      } catch (err) {
        console.error("Failed to load loans/emis:", err);
        setError(err.response?.data?.error || err.message || "Could not load data.");
      }
      setIsLoadingLoans(false); setIsLoadingEmis(false);
    };
    loadData();
  }, [currentUser]); // Depend on currentUser

  const handleFormInputChange = (e) => { /* ... (same as before) ... */
    const { name, value } = e.target;
    let processedValue = value;
    const numericFields = ['totalLoanAmount', 'monthlyPaymentCalculated', 'interestRate', 'loanTermMonths', 'paidMonths', 'totalEmiAmount', 'monthlyEmiPayment', 'numberOfInstallments', 'paidInstallments'];
    if (numericFields.includes(name) && value !== '') {
        processedValue = parseFloat(value);
        if (isNaN(processedValue)) processedValue = '';
    }
    if (name === 'loanId' && value === '') processedValue = null;
    setFormData(prev => ({ ...prev, [name]: processedValue }));
  };
  const openForm = (type, itemToEdit = null) => { /* ... (same as before) ... */
    setShowForm(type); setEditingItem(itemToEdit);
    if (itemToEdit) {
        setFormData({...itemToEdit,
            startDate: itemToEdit.startDate ? new Date(itemToEdit.startDate).toISOString().slice(0,10) : new Date().toISOString().slice(0,10),
            emiStartDate: itemToEdit.emiStartDate ? new Date(itemToEdit.emiStartDate).toISOString().slice(0,10) : new Date().toISOString().slice(0,10),
        });
    } else { setFormData(type === 'loan' ? initialLoanState : initialEmiState); }
    setError(null);
  };
  const closeForm = () => { /* ... (same as before) ... */
    setShowForm(null); setEditingItem(null); setError(null);
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    console.log(`[LoanEMITracker] Submitting ${showForm} data:`, formData);
    try {
      let result;
      if (showForm === 'loan') {
        if (editingItem) {
          result = await loanService.updateLoan(editingItem.id, formData);
          setLoans(prev => prev.map(l => l.id === result.id ? result : l));
        } else {
          result = await loanService.addLoan(formData);
          setLoans(prev => [...prev, result]);
        }
      } else if (showForm === 'emi') {
        if (editingItem) {
          result = await emiService.updateEmi(editingItem.id, formData);
          setEmis(prev => prev.map(em => em.id === result.id ? result : em));
        } else {
          result = await emiService.addEmi(formData);
          setEmis(prev => [...prev, result]);
        }
      }
      closeForm();
      window.dispatchEvent(new CustomEvent(FINANCIAL_ENTITIES_UPDATED_EVENT)); // DISPATCH EVENT
      console.log(`[LoanEMITracker] ${showForm} saved successfully.`);
    } catch (err) {
      console.error(`[LoanEMITracker] Failed to save ${showForm}:`, err.response?.data || err.message);
      setError(err.response?.data?.error || err.response?.data?.details || err.message || `Could not save ${showForm}.`);
    }
  };

  const handleDelete = async (type, id) => {
    if (window.confirm(`Are you sure you want to delete this ${type}? This action cannot be undone.`)) {
      setError(null);
      console.log(`[LoanEMITracker] Deleting ${type} ID:`, id);
      try {
        if (type === 'loan') {
          await loanService.deleteLoan(id);
          setLoans(prev => prev.filter(l => l.id !== id));
        } else if (type === 'emi') {
          await emiService.deleteEmi(id);
          setEmis(prev => prev.filter(em => em.id !== id));
        }
        window.dispatchEvent(new CustomEvent(FINANCIAL_ENTITIES_UPDATED_EVENT)); // DISPATCH EVENT
        console.log(`[LoanEMITracker] ${type} deleted successfully.`);
      } catch (err) {
        console.error(`[LoanEMITracker] Failed to delete ${type}:`, err.response?.data || err.message);
        setError(err.response?.data?.error || `Could not delete ${type}.`);
      }
    }
  };

  // ... (useMemo for loanDetails and emiDetails, and the JSX return statement from before)
    const loanDetails = useMemo(() => loans.map(loan => ({...loan, remainingMonths: (loan.loanTermMonths || 0) - (loan.paidMonths || 0), paidPercentage: loan.loanTermMonths ? (((loan.paidMonths || 0) / loan.loanTermMonths) * 100) : 0 })), [loans]);
    const emiDetails = useMemo(() => emis.map(emi => ({...emi, remainingInstallments: (emi.numberOfInstallments || 0) - (emi.paidInstallments || 0), paidPercentage: emi.numberOfInstallments ? (((emi.paidInstallments || 0) / emi.numberOfInstallments) * 100) : 0 })), [emis]);

    if (isLoadingLoans || isLoadingEmis) return <Card title="Loan & EMI Tracker"><p>Loading data...</p></Card>;

     return ( /* ... Your existing JSX for LoanEMITracker, ensuring all handlers are correct ... */
        <div className={styles.trackerPage}>
         <Card title="Loan Tracker" actions={!showForm && <Button onClick={() => openForm('loan')}>+ Add Loan</Button>}>
            {error && showForm === 'loan' && <p className={styles.errorMessage}>{error}</p>}
            {showForm === 'loan' && (
                <form onSubmit={handleSubmit} className={styles.addForm}>
                    <h4>{editingItem ? 'Edit Loan' : 'Add New Loan'}</h4>
                    <Input name="loanName" label="Loan Name" value={formData.loanName || ''} onChange={handleFormInputChange} required />
                    <Input name="totalLoanAmount" label="Total Amount" type="number" value={String(formData.totalLoanAmount || '')} onChange={handleFormInputChange} required />
                    <Input name="monthlyPaymentCalculated" label="Monthly EMI" type="number" value={String(formData.monthlyPaymentCalculated || '')} onChange={handleFormInputChange} required />
                    <Input name="interestRate" label="Interest Rate (%)" type="number" value={String(formData.interestRate || '')} onChange={handleFormInputChange} />
                    <Input name="loanTermMonths" label="Total Term (Months)" type="number" value={String(formData.loanTermMonths || '')} onChange={handleFormInputChange} required/>
                    <Input name="paidMonths" label="Months Paid" type="number" value={String(formData.paidMonths || '0')} onChange={handleFormInputChange} />
                    <Input name="startDate" label="Start Date" type="date" value={formData.startDate || ''} onChange={handleFormInputChange} />
                    <Input name="lenderName" label="Lender Name" value={formData.lenderName || ''} onChange={handleFormInputChange} />
                    <div className={styles.formActions}><Button type="submit">{editingItem ? 'Save Changes' : 'Add Loan'}</Button><Button type="button" variant="secondary" onClick={closeForm}>Cancel</Button></div>
                </form>
            )}
           {!showForm && loanDetails.map(loan => (
             <div key={loan.id} className={styles.itemCard}>
                <div className={styles.itemHeader}><h4>{loan.loanName}</h4><div><Button onClick={() => openForm('loan', loan)} variant="text" className={styles.actionButtonSmall}>✎</Button><Button onClick={() => handleDelete('loan', loan.id)} variant="text" className={`${styles.actionButtonSmall} ${styles.deleteButton}`}>✕</Button></div></div>
                <p><strong>EMI:</strong> {formatCurrency(loan.monthlyPaymentCalculated)}</p>
                <p><strong>Paid:</strong> {loan.paidMonths} / {loan.loanTermMonths} months</p>
                <div className={styles.progressBarContainer}><div className={styles.progressBar} style={{ width: `${loan.paidPercentage}%` }}></div></div>
             </div>
           ))}
           {!showForm && loans.length === 0 && <p>No loans added yet.</p>}
         </Card>

         <Card title="EMI Tracker" actions={!showForm && <Button onClick={() => openForm('emi')}>+ Add EMI</Button>}>
            {error && showForm === 'emi' && <p className={styles.errorMessage}>{error}</p>}
            {showForm === 'emi' && (
                <form onSubmit={handleSubmit} className={styles.addForm}>
                    <h4>{editingItem ? 'Edit EMI' : 'Add New EMI'}</h4>
                    <Input name="emiDescription" label="EMI Description" value={formData.emiDescription || ''} onChange={handleFormInputChange} required />
                    <div className={styles.inputGroup}><label htmlFor="loanId">Link to Loan (Optional)</label><select id="loanId" name="loanId" value={formData.loanId || ''} onChange={handleFormInputChange} className={styles.selectInput}><option value="">Standalone EMI</option>{loans.map(l => <option key={l.id} value={l.id}>{l.loanName}</option>)}</select></div>
                    <Input name="totalEmiAmount" label="Total Item Amount (on EMI)" type="number" value={String(formData.totalEmiAmount || '')} onChange={handleFormInputChange} />
                    <Input name="monthlyEmiPayment" label="Monthly EMI Payment" type="number" value={String(formData.monthlyEmiPayment || '')} onChange={handleFormInputChange} required />
                    <Input name="numberOfInstallments" label="Total Installments" type="number" value={String(formData.numberOfInstallments || '')} onChange={handleFormInputChange} required/>
                    <Input name="paidInstallments" label="Installments Paid" type="number" value={String(formData.paidInstallments || '0')} onChange={handleFormInputChange} />
                    <Input name="emiStartDate" label="Start Date" type="date" value={formData.emiStartDate || ''} onChange={handleFormInputChange} />
                    <div className={styles.formActions}><Button type="submit">{editingItem ? 'Save Changes' : 'Add EMI'}</Button><Button type="button" variant="secondary" onClick={closeForm}>Cancel</Button></div>
                </form>
            )}
           {!showForm && emiDetails.map(emi => (
             <div key={emi.id} className={styles.itemCard}>
                <div className={styles.itemHeader}><h4>{emi.emiDescription}</h4><div><Button onClick={() => openForm('emi', emi)} variant="text" className={styles.actionButtonSmall}>✎</Button><Button onClick={() => handleDelete('emi', emi.id)} variant="text" className={`${styles.actionButtonSmall} ${styles.deleteButton}`}>✕</Button></div></div>
                <p><strong>EMI:</strong> {formatCurrency(emi.monthlyEmiPayment)}</p>
                <p><strong>Paid:</strong> {emi.paidInstallments} / {emi.numberOfInstallments} installments</p>
                <div className={styles.progressBarContainer}><div className={styles.progressBar} style={{ width: `${emi.paidPercentage}%` }}></div></div>
             </div>
           ))}
           {!showForm && emis.length === 0 && <p>No EMIs added yet.</p>}
         </Card>
       </div>
     );
};

export default LoanEMITracker;