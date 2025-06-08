// src/pages/DashboardPage.js
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Routes, Route, Outlet, useLocation, Navigate } from 'react-router-dom';
import Navbar from '../components/Layout/Navbar';
import Sidebar from '../components/Layout/Sidebar';
import BudgetExcelView, { USER_DATA_UPDATED_EVENT, BUDGET_ITEMS_UPDATED_EVENT } from '../components/Dashboard/BudgetExcelView';
import LoanEMITracker, { FINANCIAL_ENTITIES_UPDATED_EVENT } from '../components/Dashboard/LoanEMITracker';
import AIAssistant from '../components/Dashboard/AIAssistant';
import StockMonitor from '../components/Dashboard/StockMonitor';
import ProfileManager from '../components/Dashboard/ProfileManager';
import Card from '../components/UI/Card';
import { useAuth } from '../contexts/AuthContext';
import { getFinanceNews } from '../api/newsService';
import md5 from 'md5';
import budgetService from '../api/budgetService';
import loanService from '../api/loanService';
// import emiService from '../api/emiService'; // If needed
import styles from './DashboardPage.module.css';

// Format currency helper
const formatCurrency = (amount, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: currency, minimumFractionDigits: 0 }).format(amount || 0);
};

// --- DASHBOARD HOME COMPONENT ---
const DashboardHome = () => {
  const { currentUser, loading: authLoading } = useAuth();
  const [newsArticles, setNewsArticles] = useState([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsError, setNewsError] = useState(null);

  const [summaryData, setSummaryData] = useState({
    salary: 0, totalExpenses: 0, netSavings: 0, totalLoanPayments: 0, investmentAmount: 0,
  });
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState(null);

  const salaryStorageKey = useMemo(() => `financeAppUserSalary_${currentUser?.id}`, [currentUser]);

  const fetchAndCalculateSummary = useCallback(async () => {
    if (!currentUser?.id) {
      setSummaryData({ salary: 0, totalExpenses: 0, netSavings: 0, totalLoanPayments: 0, investmentAmount: 0 });
      setSummaryLoading(false);
      return;
    }

    setSummaryLoading(true);
    setSummaryError(null);

    try {
      const manuallySetSalary = parseFloat(localStorage.getItem(salaryStorageKey)) || 0;

      const [fetchedBudgetItems, fetchedLoans /*, fetchedEmis */] = await Promise.all([
        budgetService.getBudgetItems(),
        loanService.getLoans(),
        // emiService.getEmis(),
      ]);

      let calculatedTotalIncome = manuallySetSalary;
      let calculatedTotalExpenses = 0;
      let calculatedInvestmentAmount = 0;

      if (fetchedBudgetItems && Array.isArray(fetchedBudgetItems)) {
        fetchedBudgetItems.forEach(item => {
          const amount = parseFloat(item.plannedAmount) || 0;
          if (item.type === 'income') {
            if (item.category?.toLowerCase() !== 'salary') {
              calculatedTotalIncome += amount;
            }
          } else if (item.type === 'expense') {
            calculatedTotalExpenses += amount;
            if (item.category?.toLowerCase().includes('investment') || item.category?.toLowerCase().includes('savings')) {
              calculatedInvestmentAmount += amount;
            }
          }
        });
      }

      let calculatedLoanPayments = 0;
      if (fetchedLoans && Array.isArray(fetchedLoans)) {
        calculatedLoanPayments = fetchedLoans.reduce((sum, loan) => {
          return sum + (parseFloat(loan.monthlyPaymentCalculated) || 0);
        }, 0);
      }

      const calculatedNetSavings = calculatedTotalIncome - calculatedTotalExpenses;

      const newSummary = {
        salary: calculatedTotalIncome,
        totalExpenses: calculatedTotalExpenses,
        netSavings: calculatedNetSavings,
        totalLoanPayments: calculatedLoanPayments,
        investmentAmount: calculatedInvestmentAmount,
      };
      setSummaryData(newSummary);

    } catch (error) {
      console.error("[DashboardHome] Error fetching/calculating summary:", error.response?.data || error.message);
      setSummaryError("Could not update financial summary. Please try refreshing.");
      setSummaryData({ salary: 0, totalExpenses: 0, netSavings: 0, totalLoanPayments: 0, investmentAmount: 0 });
    }

    setSummaryLoading(false);
  }, [currentUser, salaryStorageKey]);

  useEffect(() => {
    if (currentUser?.id) {
      fetchAndCalculateSummary();
    }

    const handleDataUpdate = (event) => {
      console.log(`[DashboardHome] Received ${event.type} event. Re-fetching summary.`);
      if (currentUser?.id) {
        fetchAndCalculateSummary();
      }
    };

    window.addEventListener(USER_DATA_UPDATED_EVENT, handleDataUpdate);
    window.addEventListener(BUDGET_ITEMS_UPDATED_EVENT, handleDataUpdate);
    window.addEventListener(FINANCIAL_ENTITIES_UPDATED_EVENT, handleDataUpdate);

    return () => {
      window.removeEventListener(USER_DATA_UPDATED_EVENT, handleDataUpdate);
      window.removeEventListener(BUDGET_ITEMS_UPDATED_EVENT, handleDataUpdate);
      window.removeEventListener(FINANCIAL_ENTITIES_UPDATED_EVENT, handleDataUpdate);
    };
  }, [currentUser, fetchAndCalculateSummary]);

  // News fetching
  useEffect(() => {
    const fetchNews = async () => {
      setNewsLoading(true);
      setNewsError(null);
      try {
        const articles = await getFinanceNews();
        setNewsArticles(articles);
      } catch (error) {
        console.error("Failed to load news:", error);
        setNewsError(error.message || "Could not load news articles.");
      } finally {
        setNewsLoading(false);
      }
    };
    fetchNews();
  }, []);

  const getProfilePicUrl = () => {
    if (currentUser?.profilePicUrl) {
      return currentUser.profilePicUrl;
    }
    if (currentUser?.username) {
      const hash = md5(currentUser.username.trim().toLowerCase());
      return `https://i.pinimg.com/736x/a3/a9/ef/a3a9efaeaf23f42e8f849468af295c4e.jpg`;
    }
    return "https://via.placeholder.com/100.png?text=User";
  };

  if (authLoading && !currentUser) {
    return <Card title="Dashboard"><p className={styles.loadingText}>Loading user session...</p></Card>;
  }

  if (!currentUser) {
    return <Card title="Dashboard"><p>User not logged in. Please login again.</p></Card>;
  }

  return (
    <div className={styles.dashboardHome}>
      <Card className={styles.profileSummaryCard}>
        <div className={styles.profileHeader}>
          <img src={getProfilePicUrl()} alt="Profile" className={styles.profilePic} />
          <div className={styles.profileInfo}>
            <h2>Welcome back, {currentUser?.fullName || currentUser?.username || 'User'}!</h2>
            <p>Here's a quick overview of your finances.</p>
          </div>
        </div>
        {summaryLoading && <p className={styles.loadingText}>Calculating financial summary...</p>}
        {summaryError && <p className={styles.newsErrorMessage}>{summaryError}</p>}
        {!summaryLoading && !summaryError && (
          <div className={styles.financialSummaryGrid}>
            <SummaryBox title="Total Monthly Income" value={formatCurrency(summaryData.salary)} icon="💵" />
            <SummaryBox title="Total Expenses" value={formatCurrency(summaryData.totalExpenses)} icon="支出" colorStyle="red" />
            <SummaryBox title="Net Savings" value={formatCurrency(summaryData.netSavings)} icon="💰" colorStyle={summaryData.netSavings >= 0 ? "green" : "red"} />
            <SummaryBox title="Loan/EMI Payments" value={formatCurrency(summaryData.totalLoanPayments)} icon="💳" />
            <SummaryBox title="Investments Outflow" value={formatCurrency(summaryData.investmentAmount)} icon="📈" />
          </div>
        )}
      </Card>

      <Card title="Latest Finance News" className={styles.newsCard}>
        {newsLoading && <p>Loading news...</p>}
        {newsError && <p className={styles.newsErrorMessage}>Error: {newsError}</p>}
        {!newsLoading && !newsError && newsArticles && newsArticles.length > 0 && (
          <ul className={styles.newsList}>
            {newsArticles.map((article, index) => (
              <li key={index} className={styles.newsItem}>
                {article.urlToImage && (
                  <img src={article.urlToImage} alt={article.title} className={styles.newsImage} 
                       onError={(e) => { e.target.style.display = 'none'; }}/>
                )}
                <div className={styles.newsContent}>
                  <a href={article.url} target="_blank" rel="noopener noreferrer" className={styles.newsTitle}>
                    {article.title}
                  </a>
                  <p className={styles.newsDescription}>{article.description?.substring(0, 100)}...</p>
                  <small className={styles.newsSource}>
                    {article.source?.name} - {new Date(article.publishedAt).toLocaleDateString()}
                  </small>
                </div>
              </li>
            ))}
          </ul>
        )}
        {!newsLoading && !newsError && (!newsArticles || newsArticles.length === 0) && (
          <p>No news articles found, or NewsAPI key is missing/invalid.</p>
        )}
      </Card>
    </div>
  );
};

// SummaryBox
const SummaryBox = ({ title, value, icon, colorStyle }) => (
  <div className={`${styles.summaryBox} ${colorStyle ? styles[colorStyle] : ''}`}>
    <span className={styles.summaryIcon}>{icon}</span>
    <div className={styles.summaryText}>
      <h4>{title}</h4>
      <p>{value}</p>
    </div>
  </div>
);

// --- Main DashboardPage Layout ---
export const DashboardPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const mainContentMarginClass = window.innerWidth > 768 && isSidebarOpen ? '' : (window.innerWidth > 768 ? 'sidebar-collapsed' : '');

  return (
    <div>
      <Navbar toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
      <div className="app-container">
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <main className={`main-content ${mainContentMarginClass}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

// --- DashboardRoutes ---
export const DashboardRoutes = () => (
  <Routes>
    <Route path="/" element={<DashboardPage />}>
      <Route index element={<DashboardHome />} />
      <Route path="budget" element={<BudgetExcelView />} />
      <Route path="loans-emi" element={<LoanEMITracker />} />
      <Route path="stocks" element={<StockMonitor />} />
      <Route path="ai-assistant" element={<AIAssistant />} />
      <Route path="profile" element={<ProfileManager />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Route>
  </Routes>
);
