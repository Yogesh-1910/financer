// src/pages/DashboardPage.js
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Routes, Route, Outlet, useLocation, Navigate } from 'react-router-dom';
import Navbar from '../components/Layout/Navbar';
import Sidebar from '../components/Layout/Sidebar';

// Ensure this path is correct and the file exports these constants
import { USER_DATA_UPDATED_EVENT, BUDGET_ITEMS_UPDATED_EVENT, FINANCIAL_ENTITIES_UPDATED_EVENT } from '../utils/eventTypes';

import BudgetExcelView from '../components/Dashboard/BudgetExcelView';
import LoanEMITracker from '../components/Dashboard/LoanEMITracker';
import AIAssistant from '../components/Dashboard/AIAssistant';
import StockMonitor from '../components/Dashboard/StockMonitor';
import ProfileManager from '../components/Dashboard/ProfileManager';
import Card from '../components/UI/Card';
import { useAuth } from '../contexts/AuthContext';
import { getFinanceNews } from '../api/newsService';   // FROM THE SIMPLIFIED/DEBUG VERSION
import budgetService from '../api/budgetService';
import loanService from '../api/loanService';
// import emiService from '../api/emiService'; // Uncomment if used for summary
import md5 from 'md5'; // For Gravatar-like profile pic fallback
import styles from './DashboardPage.module.css';   // Your CSS module

// --- Helper to format currency ---
const formatCurrency = (amount, currency = 'INR') => {
  const numericAmount = Number(amount);
  if (isNaN(numericAmount)) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(0);
  }
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(numericAmount);
};

// --- Constants for Image URLs ---
const API_BASE_URL_ENV_DASH = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
const IMAGE_SERVER_URL_DASH = API_BASE_URL_ENV_DASH.endsWith('/api')
                           ? API_BASE_URL_ENV_DASH.substring(0, API_BASE_URL_ENV_DASH.length - '/api'.length)
                           : API_BASE_URL_ENV_DASH;
const DEFAULT_DASH_PROFILE_PIC = "https://via.placeholder.com/80.png?text=User";


// --- DASHBOARD HOME COMPONENT ---
const DashboardHome = () => {
  const { currentUser, loading: authIsLoading } = useAuth();
  const location = useLocation();

  console.log("[DashboardHome] Rendering. currentUser from context:", currentUser, "Auth loading:", authIsLoading);

  // News State
  const [newsArticles, setNewsArticles] = useState([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsError, setNewsError] = useState(null);

  // Summary State
  const [summaryData, setSummaryData] = useState({
    totalIncome: 0, totalExpenses: 0, netSavings: 0, totalLoanPayments: 0, investmentAmount: 0,
  });
  const [summaryCalculating, setSummaryCalculating] = useState(true);
  const [summaryFetchError, setSummaryFetchError] = useState(null);

  // State for fetched data used in summary calculation
  const [dbBudgetItems, setDbBudgetItems] = useState([]);
  const [dbLoans, setDbLoans] = useState([]);

  const salaryStorageKey = useMemo(() => currentUser?.id ? `financeAppUserSalary_${currentUser.id}` : null, [currentUser]);

  // Combined data fetching and summary calculation
  const fetchAndCalculateSummary = useCallback(async () => {
    if (!currentUser?.id) {
      console.log("[DashboardHome] fetchAndCalculateSummary: No current user ID, resetting summary.");
      setSummaryData({ totalIncome: 0, totalExpenses: 0, netSavings: 0, totalLoanPayments: 0, investmentAmount: 0 });
      setDbBudgetItems([]);
      setDbLoans([]);
      setSummaryCalculating(false);
      return;
    }

    console.log("[DashboardHome] fetchAndCalculateSummary: Starting data fetch for user ID:", currentUser.id);
    setSummaryCalculating(true);
    setSummaryFetchError(null);

    let fetchedBudgetItems = [];
    let fetchedLoans = [];

    try {
      const [budgetItemsResponse, loansResponse] = await Promise.all([
        budgetService.getBudgetItems().catch(err => {
            console.error("[DashboardHome] fetchAndCalculateSummary: Error fetching budget items:", err.response?.data || err.message);
            setSummaryFetchError(prevErr => prevErr ? `${prevErr}, Budget fetch failed.` : "Failed to load budget data.");
            return [];
        }),
        loanService.getLoans().catch(err => {
            console.error("[DashboardHome] fetchAndCalculateSummary: Error fetching loans:", err.response?.data || err.message);
            setSummaryFetchError(prevErr => prevErr ? `${prevErr}, Loan fetch failed.` : "Failed to load loan data.");
            return [];
        }),
      ]);

      fetchedBudgetItems = Array.isArray(budgetItemsResponse) ? budgetItemsResponse : [];
      fetchedLoans = Array.isArray(loansResponse) ? loansResponse : [];

      setDbBudgetItems(fetchedBudgetItems);
      setDbLoans(fetchedLoans);

      console.log("[DashboardHome] fetchAndCalculateSummary: Data fetched. BudgetItems:", fetchedBudgetItems.length, "Loans:", fetchedLoans.length);

      const manuallySetSalaryFallback = parseFloat(localStorage.getItem(salaryStorageKey)) || 0;
      if (manuallySetSalaryFallback > 0) {
          console.log("[DashboardHome] fetchAndCalculateSummary: Salary from localStorage fallback (if needed):", manuallySetSalaryFallback);
      }

      const getNumericAmount = (item, field = 'plannedAmount') => parseFloat(item?.[field]) || 0;
      const dbSalaryItem = fetchedBudgetItems.find(item => item.type === 'income' && item.category?.toLowerCase() === 'salary');
      let primarySalary = getNumericAmount(dbSalaryItem);
      if (primarySalary === 0 && manuallySetSalaryFallback > 0 && !dbSalaryItem) {
          primarySalary = manuallySetSalaryFallback;
      }

      let calculatedTotalIncome = primarySalary;
      let calculatedTotalExpenses = 0;
      let calculatedInvestmentAmount = 0;

      fetchedBudgetItems.forEach(item => {
        const amount = getNumericAmount(item);
        if (item.type === 'income') {
          if (!(item.category?.toLowerCase() === 'salary' && item.id === dbSalaryItem?.id)) {
            calculatedTotalIncome += amount;
          }
        } else if (item.type === 'expense') {
          calculatedTotalExpenses += amount;
          if (item.category?.toLowerCase().includes('investment') || item.category?.toLowerCase().includes('savings')) {
            calculatedInvestmentAmount += amount;
          }
        }
      });

      let calculatedLoanPayments = fetchedLoans.reduce((sum, loan) => {
        return sum + (parseFloat(loan.monthlyPaymentCalculated) || 0);
      }, 0);

      const calculatedNetSavings = calculatedTotalIncome - calculatedTotalExpenses;
      const newSummary = {
        salary: calculatedTotalIncome, totalExpenses: calculatedTotalExpenses, netSavings: calculatedNetSavings,
        totalLoanPayments: calculatedLoanPayments, investmentAmount: calculatedInvestmentAmount,
      };
      console.log("[DashboardHome] fetchAndCalculateSummary: New summary calculated:", newSummary);
      setSummaryData(newSummary);

    } catch (error) {
      console.error("[DashboardHome] fetchAndCalculateSummary: Overall critical error:", error);
      const criticalErrorMsg = error.message || "A critical error occurred while generating the summary.";
      setSummaryFetchError(prevErr => prevErr ? `${prevErr}, ${criticalErrorMsg}`: criticalErrorMsg);
      setSummaryData({ salary: 0, totalExpenses: 0, netSavings: 0, totalLoanPayments: 0, investmentAmount: 0 });
    }
    setSummaryCalculating(false);
  }, [currentUser, salaryStorageKey]);

  useEffect(() => {
    if (currentUser?.id && !authIsLoading) {
      fetchAndCalculateSummary();
    }
    const handleDataUpdate = (event) => {
      console.log(`[DashboardHome] EventListener: Received ${event.type}. Re-fetching summary.`);
      if (currentUser?.id) { fetchAndCalculateSummary(); }
    };
    console.log("[DashboardHome] Adding event listeners for data updates.");
    window.addEventListener(USER_DATA_UPDATED_EVENT, handleDataUpdate);
    window.addEventListener(BUDGET_ITEMS_UPDATED_EVENT, handleDataUpdate);
    window.addEventListener(FINANCIAL_ENTITIES_UPDATED_EVENT, handleDataUpdate);
    return () => {
      console.log("[DashboardHome] Removing event listeners.");
      window.removeEventListener(USER_DATA_UPDATED_EVENT, handleDataUpdate);
      window.removeEventListener(BUDGET_ITEMS_UPDATED_EVENT, handleDataUpdate);
      window.removeEventListener(FINANCIAL_ENTITIES_UPDATED_EVENT, handleDataUpdate);
    };
  }, [currentUser, authIsLoading, fetchAndCalculateSummary]);

  // --- SIMPLIFIED News fetching useEffect (from previous focused response) ---
  useEffect(() => {
    console.log("[DashboardHome] NewsEffect: Mounting. Attempting to fetch news.");
    setNewsLoading(true);
    setNewsError(null);
    setNewsArticles([]); // Clear previous articles

    getFinanceNews() // This uses the newsService.js with extensive logging
      .then(data => {
        console.log("[DashboardHome] NewsEffect: getFinanceNews() PROMISE RESOLVED. Data:", data);
        if (Array.isArray(data)) {
          setNewsArticles(data);
        } else {
          console.error("[DashboardHome] NewsEffect: Data from getFinanceNews is not an array:", data);
          setNewsError("Received unexpected data format for news.");
          setNewsArticles([]); // Ensure empty array on format error
        }
      })
      .catch(err => {
        console.error("[DashboardHome] NewsEffect: getFinanceNews() PROMISE REJECTED. Error object:", err);
        setNewsError(err.message || "Failed to load news. Check console for details from NewsService.");
        setNewsArticles([]); // Ensure empty array on error
      })
      .finally(() => {
        setNewsLoading(false);
        console.log("[DashboardHome] NewsEffect: Fetch attempt complete. Loading set to false.");
      });
  }, []); // Empty dependency array - fetch news once on mount


  // Profile Pic Logic
  const getProfilePicUrl = () => {
    if (currentUser?.profilePicUrl) {
      return `${IMAGE_SERVER_URL_DASH}${currentUser.profilePicUrl}?t=${new Date().getTime()}`;
    }
    if (currentUser?.username) {
      const hash = md5(currentUser.username.trim().toLowerCase());
      return `https://www.gravatar.com/avatar/${hash}?d=identicon&s=80`;
    }
    return DEFAULT_DASH_PROFILE_PIC;
  };

  if (authIsLoading && !currentUser) {
    return <Card title="Dashboard"><p className={styles.loadingText}>Initializing user session...</p></Card>;
  }
  if (!currentUser) {
    return <Card title="Dashboard"><p className={styles.errorMessage}>User not logged in. Please login again.</p></Card>;
  }

  return (
    <div className={styles.dashboardHome}>
      <Card className={styles.profileSummaryCard}>
        <div className={styles.profileHeader}>
          <img src={getProfilePicUrl()} alt="Profile" className={styles.profilePicDashboard} onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_DASH_PROFILE_PIC; }} />
          <div className={styles.profileInfo}>
            <h2>Welcome back, {currentUser.fullName || currentUser.username}!</h2>
            <p>Here's a quick overview of your finances.</p>
          </div>
        </div>

        {summaryCalculating && <p className={styles.loadingText}>Calculating financial summary...</p>}
        {summaryFetchError && <p className={styles.errorMessage}>Summary Error: {summaryFetchError}</p>}
        {!summaryCalculating && !summaryFetchError && (
          <div className={styles.financialSummaryGrid}>
            <SummaryBox title="Total Income" value={formatCurrency(summaryData.salary)} icon="💵" />
            <SummaryBox title="Total Expenses" value={formatCurrency(summaryData.totalExpenses)} icon="💸" colorStyle="redText" />
            <SummaryBox title="Net Savings" value={formatCurrency(summaryData.netSavings)} icon="💰" colorStyle={summaryData.netSavings >= 0 ? "greenText" : "redText"} />
            <SummaryBox title="Loan/EMI Payments" value={formatCurrency(summaryData.totalLoanPayments)} icon="💳" />
           
          </div>
        )}
      </Card>

      <Card title="Latest Finance News" className={styles.newsCard}>
        {newsLoading && <p className={styles.loadingText}>Loading news articles...</p>}
        {!newsLoading && newsError && <p className={styles.errorMessage}>News Update Error: {newsError}</p>}
        {!newsLoading && !newsError && newsArticles.length > 0 && (
          <ul className={styles.newsList}>
            {newsArticles.map((article, index) => (
              <li key={article.url || `news-${index}-${Math.random()}`} className={styles.newsItem}>
                {article.urlToImage && <img src={article.urlToImage} alt={article.title || 'News'} className={styles.newsImage} onError={(e) => { e.target.style.display = 'none'; }}/>}
                <div className={styles.newsContent}>
                  <a href={article.url} target="_blank" rel="noopener noreferrer" className={styles.newsTitle}>{article.title || "Untitled Article"}</a>
                  <p className={styles.newsDescription}>{article.description?.substring(0, 100) || "No description."}...</p>
                  <small className={styles.newsSource}>{article.source?.name || "Unknown Source"} - {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : "N/A"}</small>
                </div>
              </li>
            ))}
          </ul>
        )}
        {!newsLoading && !newsError && newsArticles.length === 0 && (
          <p className={styles.infoMessage}>No news articles found, or NewsAPI key might be missing/invalid (check console for warnings).</p>
        )}
      </Card>
    </div>
  );
};

// SummaryBox helper component
const SummaryBox = ({ title, value, icon, colorStyle }) => (
  <div className={`${styles.summaryBox} ${colorStyle ? styles[colorStyle] : ''}`}>
    <span className={styles.summaryIcon}>{icon}</span>
    <div className={styles.summaryText}>
      <h4>{title}</h4>
      <p className={styles[colorStyle] || ''}>{value}</p> {/* Apply colorStyle to value */}
    </div>
  </div>
);

// --- Main DashboardPage Layout Component ---
export const DashboardPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

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

  const mainContentMarginClass = 
    (window.innerWidth > 768 && isSidebarOpen) ? styles.mainContentOpen :
    (window.innerWidth > 768 && !isSidebarOpen) ? styles.mainContentCollapsed : 
    '';

  return (
    <div className={styles.dashboardPageLayout}>
      <Navbar toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
      <div className={styles.dashboardContainer}>
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <main className={`${styles.mainDashboardContent} ${mainContentMarginClass}`}>
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