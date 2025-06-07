// src/components/Dashboard/DashboardHome.js
import React, { useEffect, useState } from 'react';
// import { Link } from 'react-router-dom'; // Link is no longer needed here if button is removed
import { useAuth } from '../../contexts/AuthContext';
import Card from '../UI/Card';
import UserAvatar from '../Layout/UserAvatar';
// import Button from '../UI/Button'; // Button is no longer needed here if button is removed
import { getFinancialNews } from '../../api/newsService';
import styles from './DashboardHome.module.css';

// Helper to format date (assuming you still have this)
const formatDate = (isoString, options = { year: 'numeric', month: 'short', day: 'numeric' }) => {
  if (!isoString) return 'N/A';
  try {
    return new Date(isoString).toLocaleDateString('en-US', options);
  } catch (e) {
    return 'Invalid Date';
  }
};

const DashboardHome = () => {
  const { currentUser } = useAuth();
  const [newsArticles, setNewsArticles] = useState([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsError, setNewsError] = useState(null);

  const mockLastLogin = new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24).toISOString();
  const mockMemberSince = currentUser?.createdAt || new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 30 * 6).toISOString();

  useEffect(() => {
    const fetchNews = async () => {
      setNewsLoading(true);
      setNewsError(null);
      try {
        const data = await getFinancialNews();
        setNewsArticles(data.articles || []);
      } catch (error) {
        setNewsError(error.message || "Failed to fetch news.");
        setNewsArticles([]);
      } finally {
        setNewsLoading(false);
      }
    };

    fetchNews();
  }, []);

  if (!currentUser) {
    return (
      <div className={styles.loadingContainer}>
        <p>Loading user data...</p>
      </div>
    );
  }

  return (
    <div className={styles.dashboardHomeContainer}>
      <Card className={styles.userDetailsCard} title="My Profile Overview">
        <div className={styles.profileHeader}>
          <UserAvatar user={currentUser} size={90} />
          <div className={styles.profileHeaderText}>
            <h2 className={styles.userName}>{currentUser.fullName || currentUser.username}</h2>
            <p className={styles.userGreeting}>Welcome to your financial dashboard!</p>
          </div>
          {/* "Edit Profile" button and its Link wrapper REMOVED from here */}
          {/*
          <Link to="/dashboard/profile" className={styles.editProfileButtonLink}>
            <Button variant="secondary">Edit Profile</Button>
          </Link>
          */}
        </div>

        <div className={styles.profileDetailsGrid}>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Full Name</span>
            <span className={styles.detailValue}>{currentUser.fullName || 'N/A'}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Username</span>
            <span className={styles.detailValue}>{currentUser.username}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Age</span>
            <span className={styles.detailValue}>{currentUser.age || 'N/A'}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Phone Number</span>
            <span className={styles.detailValue}>{currentUser.phoneNumber || 'N/A'}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Last Login</span>
            <span className={styles.detailValue}>{formatDate(mockLastLogin, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Member Since</span>
            <span className={styles.detailValue}>{formatDate(mockMemberSince)}</span>
          </div>
        </div>
      </Card>

      {/* News Section - remains the same */}
      <Card title="Latest Financial News" className={styles.newsCard}>
        {newsLoading && <p className={styles.loadingText}>Loading news...</p>}
        {newsError && (
          <p className={styles.errorText}>
            Error: {newsError} <br />
            <small>Ensure NEWS_API_KEY is set in `src/api/newsService.js` and is valid.</small>
          </p>
        )}
        {!newsLoading && !newsError && newsArticles.length === 0 && <p>No news articles found.</p>}
        <ul className={styles.newsList}>
          {newsArticles.slice(0, 7).map((article, index) => (
            <li key={article.url || index} className={styles.newsItem}>
              <a href={article.url} target="_blank" rel="noopener noreferrer" className={styles.newsLink}>
                <h4 className={styles.newsTitle}>{article.title}</h4>
              </a>
              <p className={styles.newsMeta}>
                <span className={styles.newsSource}>{article.source?.name || 'Unknown Source'}</span> - {}
                <span className={styles.newsDate}>{formatDate(article.publishedAt)}</span>
              </p>
              {article.description && <p className={styles.newsDescription}>{article.description.substring(0, 120)}...</p>}
            </li>
          ))}
        </ul>
        {newsArticles.length > 7 && (
          <a
            href="https://news.google.com/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx6TVdZU0FtVnVHZ0pWVXlnQVAB?hl=en-IN&gl=IN&ceid=IN%3Aen"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.moreNewsLink}
          >
            View More Financial News →
          </a>
        )}
      </Card>
    </div>
  );
};

export default DashboardHome;