// IMPORTANT: Get your free API key from https://newsapi.org/
const NEWS_API_KEY = '90d95da3cc494436aa4c766ac1755a37'; // <<<< REPLACE THIS!
const NEWS_API_ENDPOINT = 'https://newsapi.org/v2/top-headlines';

// For demo purposes, if API_KEY is not set, use mock data.
const USE_MOCK_NEWS = NEWS_API_KEY === 'YOUR_NEWS_API_KEY';

const MOCK_NEWS_DATA = {
  status: "ok",
  totalResults: 3,
  articles: [
    {
      source: { id: null, name: "Mock News Source 1" },
      author: "John Doe",
      title: "Global Markets Rally on Positive Economic Data - Mock News",
      description: "Stock markets around the world saw significant gains today following the release of strong manufacturing and employment figures from major economies.",
      url: "#",
      urlToImage: "https://via.placeholder.com/100x70.png?text=News1",
      publishedAt: new Date().toISOString(),
      content: "Detailed content about the market rally..."
    },
    {
      source: { id: null, name: "Mock Finance Today" },
      author: "Jane Smith",
      title: "Central Bank Hints at Interest Rate Stability - Mock News",
      description: "In a recent address, the Central Bank governor suggested that current interest rates are likely to remain stable for the foreseeable future, easing investor concerns.",
      url: "#",
      urlToImage: "https://via.placeholder.com/100x70.png?text=News2",
      publishedAt: new Date(Date.now() - 3600 * 1000 * 2).toISOString(), // 2 hours ago
      content: "More details about the central bank's stance..."
    },
    {
      source: { id: "tech-times", name: "Tech Times" },
      author: "Alex Chan",
      title: "Fintech Innovations Disrupting Traditional Banking - Mock News",
      description: "New financial technologies are rapidly changing the banking landscape, offering consumers more efficient and accessible services. This article explores the latest trends.",
      url: "#",
      urlToImage: "https://via.placeholder.com/100x70.png?text=News3",
      publishedAt: new Date(Date.now() - 3600 * 1000 * 5).toISOString(), // 5 hours ago
      content: "In-depth look at fintech innovations..."
    }
  ]
};


export const getFinanceNews = async () => {
  if (USE_MOCK_NEWS) {
    console.warn("Using MOCK news data because NEWS_API_KEY is not set in newsService.js");
    return MOCK_NEWS_DATA.articles.slice(0, 5); // Return top 5 mock articles
  }

  // For NewsAPI.org, common parameters:
  // country=us (for US news) or country=in (for India news)
  // category=business or category=technology (finance is often under business)
  // pageSize=5 (to get a few articles)
  const country = 'us'; // Change to 'in' for India, or your preferred country
  const category = 'business';
  const pageSize = 5; // Number of articles to fetch

  try {
    const response = await fetch(
      `${NEWS_API_ENDPOINT}?country=${country}&category=${category}&pageSize=${pageSize}&apiKey=${NEWS_API_KEY}`
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("News API Error:", errorData);
      throw new Error(errorData.message || `Failed to fetch news: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.status === "ok") {
      return data.articles;
    } else {
      throw new Error(data.message || "Failed to retrieve news articles.");
    }
  } catch (error) {
    console.error("Error fetching finance news:", error);
    // Fallback to mock data on error if preferred, or re-throw
    // return MOCK_NEWS_DATA.articles.slice(0, pageSize);
    throw error;
  }
};