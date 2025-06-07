// src/pages/DashboardPage.js
import React, { useState, useEffect, useMemo } from 'react'; // Added useMemo
import { Routes, Route, Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/Layout/Navbar';
import Sidebar from '../components/Layout/Sidebar';
import BudgetExcelView from '../components/Dashboard/BudgetExcelView';
import LoanEMITracker from '../components/Dashboard/LoanEMITracker';
import AIAssistant from '../components/Dashboard/AIAssistant';
import StockMonitor from '../components/Dashboard/StockMonitor';
import ProfileManager from '../components/Dashboard/ProfileManager';
import Card from '../components/UI/Card';
import { useAuth } from '../contexts/AuthContext'; // For user info
import { getFinanceNews } from '../api/newsService'; // For news
import md5 from 'md5'; // Optional, for Gravatar-like placeholder

import styles from './DashboardPage.module.css'; // Create this CSS file

// Helper to format currency (copy from BudgetExcelView if not already global)
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);
};

// --- DASHBOARD HOME COMPONENT ---
const DashboardHome = () => {
  const { currentUser } = useAuth();
  const [newsArticles, setNewsArticles] = useState([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsError, setNewsError] = useState(null);

  // --- Budget Summary Logic ---
  const budgetSummaryData = useMemo(() => {
    const salary = parseFloat(localStorage.getItem('budgetSalary')) || 0;
    const itemsString = localStorage.getItem('budgetItems');
    const items = itemsString ? JSON.parse(itemsString) : [];
    
    const totalExpenses = items.reduce((sum, item) => item.type === 'expense' ? sum + item.monthlyAmount : sum, 0);
    const netSavings = salary - totalExpenses;
    const totalLoanPayments = items
      .filter(item => item.category === 'EMI' || item.category === 'EMI / Loan')
      .reduce((sum, item) => sum + item.monthlyAmount, 0);

    return {
      salary,
      totalExpenses,
      netSavings,
      totalLoanPayments,
      investmentAmount: items.filter(item => item.category === 'Investment').reduce((sum, item) => sum + item.monthlyAmount, 0)
    };
  }, [currentUser]); // Re-calculate if currentUser changes (though data is from localStorage)


  // --- Fetch News ---
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

  // --- Profile Picture ---
  const getProfilePicUrl = () => {
    if (currentUser?.profilePicUrl) { // If you implement actual profile pics later
      return currentUser.profilePicUrl;
    }
    // Gravatar-like placeholder using username hash (optional, needs md5 installed)
    // For a real Gravatar, you'd use email. This is just for visual diversity.
    if (currentUser?.username) {
      const hash = md5(currentUser.username.trim().toLowerCase());
      return `https://www.gravatar.com/avatar/${hash}?d=identicon&s=100`; // s=100 for 100px size
    }
    return "https://via.placeholder.com/100.png?text=User"; // Default placeholder
  };

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
        <div className={styles.financialSummaryGrid}>
          <SummaryBox title="Monthly Income" value={formatCurrency(budgetSummaryData.salary)} icon="💵" />
          <SummaryBox title="Total Expenses" value={formatCurrency(budgetSummaryData.totalExpenses)} icon="支出" color="red" /> {/* 支出 is Chinese for expense */}
          <SummaryBox title="Net Savings" value={formatCurrency(budgetSummaryData.netSavings)} icon="💰" color={budgetSummaryData.netSavings >= 0 ? "green" : "red"} />
          <SummaryBox title="Loan Payments" value={formatCurrency(budgetSummaryData.totalLoanPayments)} icon="💳" />
          <SummaryBox title="Investments" value={formatCurrency(budgetSummaryData.investmentAmount)} icon="📈" />
        </div>
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
                       onError={(e) => { e.target.style.display = 'none'; /* Hide if image fails to load */ }}/>
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

// Helper component for summary boxes
const SummaryBox = ({ title, value, icon, color }) => (
  <div className={`${styles.summaryBox} ${color ? styles[color] : ''}`}>
    <span className={styles.summaryIcon}>{icon}</span>
    <div className={styles.summaryText}>
      <h4>{title}</h4>
      <p>{value}</p>
    </div>
  </div>
);


// --- Main DashboardPage Component (Layout) ---
// (This part remains the same as your existing DashboardPage component code)
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

// --- Dashboard Routes Definition (remains the same) ---
export const DashboardRoutes = () => (
  <Routes>
    <Route path="/" element={<DashboardPage />}>
      <Route index element={<DashboardHome />} /> {/* This is the modified component */}
      <Route path="budget" element={<BudgetExcelView />} />
      <Route path="loans-emi" element={<LoanEMITracker />} />
      <Route path="stocks" element={<StockMonitor />} />
      <Route path="ai-assistant" element={<AIAssistant />} />
      <Route path="profile" element={<ProfileManager />} />
    </Route>
  </Routes>
);