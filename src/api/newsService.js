// src/api/newsService.js
import axios from 'axios'; // Assuming you have axios: npm install axios

// IMPORTANT: Ensure REACT_APP_NEWS_API_KEY is set in your frontend .env file
const NEWS_API_KEY = process.env.REACT_APP_NEWS_API_KEY;
const NEWS_API_ENDPOINT = 'https://newsapi.org/v2/top-headlines';

// Determine if the API key is valid and present (not empty or a common placeholder)
const IS_NEWS_API_KEY_CONFIGURED_FOR_LIVE = NEWS_API_KEY &&
                                          NEWS_API_KEY.trim() !== '' &&
                                          NEWS_API_KEY !== 'YOUR_NEWS_API_KEY' && // Common placeholder
                                          NEWS_API_KEY !== 'YOUR_API_KEY';     // Another common placeholder

if (!IS_NEWS_API_KEY_CONFIGURED_FOR_LIVE) {
  console.warn(
    `[NewsService] WARNING: NewsAPI key (REACT_APP_NEWS_API_KEY) is either missing, empty, or a placeholder.
    Current Key Value (first 10 chars if long): "${NEWS_API_KEY ? NEWS_API_KEY.substring(0, 10) + '...' : 'Not Set'}"
    Mock news data will be used as a fallback if live fetching fails or returns no articles.`
  );
} else {
  console.log("[NewsService] REACT_APP_NEWS_API_KEY found. Live news will be attempted.");
}

const MOCK_NEWS_DATA_ARTICLES = [
    {
      source: { id: null, name: "Mock Finance Today" },
      author: "AI Reporter",
      title: "Market Trends: A Look Ahead (Mock Data)",
      description: "Analysts discuss potential market movements for the upcoming quarter, focusing on tech and renewable energy sectors. This is mock data for demonstration.",
      url: "#mock-article-1",
      urlToImage: "https://via.placeholder.com/120x80.png?text=MarketTrends",
      publishedAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(), // 1 hour ago
    },
    {
      source: { id: null, name: "Mock Business Insights" },
      author: "Demo Journalist",
      title: "Impact of New Policies on Small Businesses (Mock Data)",
      description: "Exploring how recent regulatory changes could affect small and medium-sized enterprises across various industries. This is mock data for demonstration.",
      url: "#mock-news-2",
      urlToImage: "https://via.placeholder.com/120x80.png?text=SMBPolicy",
      publishedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(), // 4 hours ago
    },
    {
      source: { id: null, name: "Mock Global Finance" },
      author: "Economic Bot",
      title: "Currency Fluctuations and Global Trade (Mock Data)",
      description: "An overview of recent currency movements and their implications for international trade and investment strategies. This is mock data.",
      url: "#mock-news-3",
      urlToImage: "https://via.placeholder.com/120x80.png?text=CurrencyNews",
      publishedAt: new Date(Date.now() - 7 * 3600 * 1000).toISOString(), // 7 hours ago
    }
];

export const getFinanceNews = async () => {
  // If the API key isn't properly configured, go straight to mock data.
  if (!IS_NEWS_API_KEY_CONFIGURED_FOR_LIVE) {
    console.log("[NewsService] getFinanceNews: API key not configured for live data. Returning MOCK news data.");
    return new Promise(resolve => setTimeout(() => resolve(MOCK_NEWS_DATA_ARTICLES), 200));
  }

  // Attempt live fetch if key seems okay
  const country = 'in'; // Target country (e.g., 'in' for India, 'us' for USA)
  const category = 'business'; // News category
  const pageSize = 5;    // Number of articles to try and fetch

  const apiUrl = `${NEWS_API_ENDPOINT}?country=${country}&category=${category}&pageSize=${pageSize}&apiKey=${NEWS_API_KEY}`;
  console.log("[NewsService] getFinanceNews: Attempting LIVE fetch from URL:", apiUrl);

  try {
    const response = await axios.get(apiUrl);
    console.log("[NewsService] getFinanceNews: Live news API HTTP response status:", response.status);
    // For detailed debugging: console.log("[NewsService] Live API Raw Data:", JSON.stringify(response.data));

    if (response.data.status === "ok" && Array.isArray(response.data.articles) && response.data.articles.length > 0) {
      console.log("[NewsService] getFinanceNews: Successfully fetched live news articles. Count:", response.data.articles.length);
      return response.data.articles; // Return live articles
    } else if (response.data.status === "ok" && response.data.articles.length === 0) {
      console.warn("[NewsService] getFinanceNews: Live API returned 0 articles. Falling back to MOCK data.");
      return MOCK_NEWS_DATA_ARTICLES; // Fallback to mock if API returns 0 articles
    } else {
      // API returned 200 OK, but the 'status' field in the JSON is 'error' or articles missing
      const errorMessage = response.data.message || "News API returned 'ok' status but data was malformed or articles array missing.";
      console.error("[NewsService] getFinanceNews: News API reported an issue within successful HTTP response:", errorMessage, "Full response:", response.data);
      console.warn("[NewsService] getFinanceNews: Falling back to MOCK news data due to API response issue.");
      return MOCK_NEWS_DATA_ARTICLES; // Fallback to mock
    }
  } catch (error) {
    // This catch block handles network errors or HTTP error statuses (4xx, 5xx)
    let detailedErrorMessage = "Failed to fetch live finance news.";
    if (error.response) {
      detailedErrorMessage = `News API Error ${error.response.status}: ${error.response.data?.message || error.message}`;
      console.error(`[NewsService] getFinanceNews: API Error - Status ${error.response.status}`, error.response.data);
    } else if (error.request) {
      detailedErrorMessage = "No response from News API. Check network or API server status.";
      console.error("[NewsService] getFinanceNews: No response received from News API", error.request);
    } else {
      detailedErrorMessage = error.message || "An unknown error occurred while fetching news.";
      console.error("[NewsService] getFinanceNews: Generic error during news fetch attempt", error.message);
    }
    console.warn(`[NewsService] getFinanceNews: Falling back to MOCK news data due to fetch error: ${detailedErrorMessage}`);
    // In case of any error during live fetch, return mock data instead of throwing an error to the component
    // This ensures the component always has some articles to display, reducing likelihood of "No articles found" message.
    return MOCK_NEWS_DATA_ARTICLES;
  }
};