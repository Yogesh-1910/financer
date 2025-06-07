// src/components/Dashboard/StockMonitor.js
import React, { useState, useEffect, useCallback } from 'react';
import Card from '../UI/Card';
import Input from '../UI/Input';
import Button from '../UI/Button';
import styles from './StockMonitor.module.css';
import { getStockQuote } from '../../api/stockService'; // This now uses Finnhub

const StockMonitor = () => {
  const [symbols, setSymbols] = useState(() => {
    const savedSymbols = localStorage.getItem('stockSymbolsFinnhub'); // Use a different key for Finnhub
    const initialSymbols = savedSymbols ? JSON.parse(savedSymbols) : ['IBM', 'AAPL', 'MSFT', 'GOOGL', 'NVDA'];
    console.log("[StockMonitor] Initial symbols (Finnhub):", initialSymbols);
    return initialSymbols;
  });
  const [stockData, setStockData] = useState({});
  const [loading, setLoading] = useState({});
  const [globalError, setGlobalError] = useState(null);
  const [newSymbol, setNewSymbol] = useState('');

  const fetchStockData = useCallback(async (symbol) => {
    const upperSymbol = symbol.toUpperCase();
    console.log(`[StockMonitor] fetchStockData (Finnhub) called for: ${upperSymbol}`);
    setLoading(prev => ({ ...prev, [upperSymbol]: true }));
    setStockData(prev => ({ ...prev, [upperSymbol]: { ...prev[upperSymbol], error: null } }));
    setGlobalError(null);

    try {
      const data = await getStockQuote(upperSymbol); // getStockQuote now hits Finnhub
      console.log(`[StockMonitor] Data received from Finnhub for ${upperSymbol}:`, data);

      if (data && typeof data.c !== 'undefined') { // 'c' is current price from Finnhub
        console.log(`[StockMonitor] Valid Finnhub data found for ${upperSymbol}. Updating state.`);
        setStockData(prev => ({ ...prev, [upperSymbol]: data }));
      } else {
        const errorMessage = data?.error || `No valid quote data from Finnhub for ${upperSymbol}.`;
        console.warn(`[StockMonitor] ${errorMessage} Finnhub response was:`, data);
        setStockData(prev => ({ ...prev, [upperSymbol]: { error: errorMessage } }));
      }
    } catch (err) {
      console.error(`[StockMonitor] Error fetching ${upperSymbol} (Finnhub) in component:`, err.message);
      setStockData(prev => ({ ...prev, [upperSymbol]: { error: err.message || `Failed to fetch ${upperSymbol}` } }));
    } finally {
      console.log(`[StockMonitor] Finished fetching (Finnhub) for ${upperSymbol}.`);
      setLoading(prev => ({ ...prev, [upperSymbol]: false }));
    }
  }, []);

  useEffect(() => {
    console.log("[StockMonitor] symbols useEffect (Finnhub). Current symbols:", symbols);
    localStorage.setItem('stockSymbolsFinnhub', JSON.stringify(symbols)); // Use a different key
    symbols.forEach(symbol => {
      if (!stockData[symbol.toUpperCase()] || stockData[symbol.toUpperCase()]?.error) {
        fetchStockData(symbol);
      }
    });
  }, [symbols, fetchStockData]);

  useEffect(() => {
    console.log("[StockMonitor] Interval Refresh (Finnhub) useEffect setup.");
    const intervalId = setInterval(() => {
      console.log("[StockMonitor] Interval (Finnhub): Refreshing all stock data...");
      if (symbols.length > 0) {
        symbols.forEach(symbol => fetchStockData(symbol));
      }
    }, 1 * 60 * 1000); // Refresh every 1 minute for Finnhub (free tier is more generous but still has limits)
                    // Check Finnhub's rate limits for free tier.
    return () => {
      console.log("[StockMonitor] Interval (Finnhub) cleared.");
      clearInterval(intervalId);
    };
  }, [symbols, fetchStockData]);

  const handleAddSymbol = (e) => {
    e.preventDefault();
    const processedSymbol = newSymbol.trim().toUpperCase();
    if (processedSymbol && !symbols.includes(processedSymbol)) {
      setSymbols(prev => [...prev, processedSymbol]);
      setNewSymbol('');
    } else if (symbols.includes(processedSymbol)) {
      alert(`${processedSymbol} is already in the list.`);
    }
  };

  const handleRemoveSymbol = (symbolToRemove) => {
    const upperSymbolToRemove = symbolToRemove.toUpperCase();
    setSymbols(prev => prev.filter(s => s.toUpperCase() !== upperSymbolToRemove));
    setStockData(prev => {
      const newData = { ...prev };
      delete newData[upperSymbolToRemove];
      return newData;
    });
  };

  const handleRefreshSymbol = (symbol) => {
    fetchStockData(symbol);
  };

  console.log("[StockMonitor] Rendering (Finnhub). stockData:", stockData, "loading:", loading);

  return (
    <Card title="Stock Monitor (Finnhub)">
      <form onSubmit={handleAddSymbol} className={styles.addSymbolForm}>
        <Input
          name="newSymbol"
          placeholder="Enter Stock Symbol (e.g., TSLA)"
          value={newSymbol}
          onChange={(e) => setNewSymbol(e.target.value)}
        />
        <Button type="submit">Add Symbol</Button>
      </form>

      {globalError && <p className={styles.globalErrorMessage}>Global Error: {globalError}</p>}

      <div className={styles.stockGrid}>
        {symbols.map(symbolRaw => {
          const symbol = symbolRaw.toUpperCase();
          const data = stockData[symbol];
          const isLoadingSymbol = loading[symbol];

          // Finnhub fields: c = current, d = change, dp = percent change
          const currentPrice = data && !data.error ? data.c : 0;
          const change = data && !data.error ? data.d : 0;
          const changePercent = data && !data.error ? data.dp : 0;
          const changeColor = change > 0 ? styles.positive : change < 0 ? styles.negative : styles.neutral;

          return (
            <div key={symbol} className={`${styles.stockCard} ${isLoadingSymbol ? styles.loading : ''} ${data?.error ? styles.errorCard : ''}`}>
              <div className={styles.cardHeader}>
                <h3>{data?.symbol || symbol}</h3> {/* Use symbol from data if available (set in service) */}
                <div className={styles.cardActions}>
                  <Button onClick={() => handleRefreshSymbol(symbol)} variant="text" className={styles.actionButton} title="Refresh" disabled={isLoadingSymbol}>
                    {isLoadingSymbol ? '...' : '↻'}
                  </Button>
                  <Button onClick={() => handleRemoveSymbol(symbol)} variant="text" className={`${styles.actionButton} ${styles.removeButton}`} title="Remove">×</Button>
                </div>
              </div>
              {isLoadingSymbol && <div className={styles.loaderMessage}><div className={styles.loader}></div>Fetching...</div>}
              {!isLoadingSymbol && data && !data.error && typeof data.c !== 'undefined' && (
                <>
                  <p className={styles.price}>${parseFloat(currentPrice).toFixed(2)}</p>
                  <p className={`${styles.change} ${changeColor}`}>
                    {change ? `${parseFloat(change).toFixed(2)} ` : '0.00 '}
                    ({changePercent ? `${parseFloat(changePercent).toFixed(2)}%` : '0.00%'})
                  </p>
                </>
              )}
              {!isLoadingSymbol && data && data.error && <p className={styles.symbolError}>{data.error}</p>}
              {!isLoadingSymbol && !data && <p className={styles.symbolError}>No data available for {symbol}. Try refreshing.</p>}
            </div>
          );
        })}
      </div>
      {symbols.length === 0 && <p>No symbols added. Add a stock symbol to start monitoring.</p>}
      <p className={styles.apiNote}>
        Stock data by Finnhub &trade;
      </p>
    </Card>
  );
};

export default StockMonitor;