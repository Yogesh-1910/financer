// src/components/Dashboard/StockChart.js
import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  Filler
} from 'chart.js';
import 'chartjs-adapter-date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  Filler
);

// Helper to get theme colors (assuming they are defined in :root)
const getThemeColor = (cssVar) => {
    if (typeof window !== 'undefined') { // Ensure window is defined (for SSR or testing)
        return getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim();
    }
    // Fallback colors if CSS variables are not available (e.g., during server-side rendering if not handled)
    const fallbacks = {
        '--primary-color': '#1A374D',
        '--accent-color': '#B1D0E0',
        '--text-light': '#5f6773',
        '--border-color': '#dde2e7',
    };
    return fallbacks[cssVar] || '#000000';
};


const StockChart = ({ timeSeriesData, symbol, intervalHint = '15min', isPositive = true }) => {
  // isPositive can be used to subtly change chart line/fill color

  if (!timeSeriesData || typeof timeSeriesData !== 'object' || Object.keys(timeSeriesData).length === 0) {
    return <p className="chart-message">No chart data available.</p>;
  }
  if (timeSeriesData.error) {
    return <p className="chart-message error">Chart: {timeSeriesData.error}</p>;
  }

  const metaDataInterval = timeSeriesData["Meta Data"]?.["4. Interval"] || intervalHint;
  const seriesKey = `Time Series (${metaDataInterval})`;
  let series = timeSeriesData[seriesKey];
  let labels, dataPoints;

  if (series && typeof series === 'object' && Object.keys(series).length > 0) {
    const sortedTimestamps = Object.keys(series).sort((a, b) => new Date(a) - new Date(b));
    if (sortedTimestamps.length === 0) return <p className="chart-message error">No data points.</p>;
    labels = sortedTimestamps.map(time => new Date(time));
    dataPoints = sortedTimestamps.map(time => parseFloat(series[time]['4. close']));
  } else if (timeSeriesData.finnhub_native_candles && timeSeriesData.finnhub_native_candles.s === 'ok') {
    const nativeCandles = timeSeriesData.finnhub_native_candles;
    const sortedIndices = nativeCandles.t.map((_, index) => index).sort((a,b) => nativeCandles.t[a] - nativeCandles.t[b]);
    if (sortedIndices.length === 0) return <p className="chart-message error">No data points.</p>;
    labels = sortedIndices.map(index => new Date(nativeCandles.t[index] * 1000));
    dataPoints = sortedIndices.map(index => nativeCandles.c[index]);
  } else {
    console.error("Chart Data Issue: Unrecognized data structure or empty series. Data:", timeSeriesData);
    return <p className="chart-message error">Chart data format issue.</p>;
  }

  const chartLineColor = isPositive ? getThemeColor('--success-color') : getThemeColor('--danger-color');
  const chartFillColor = isPositive ? 'rgba(40, 167, 69, 0.1)' : 'rgba(220, 53, 69, 0.1)'; // Lighter fill


  const chartData = {
    labels: labels,
    datasets: [
      {
        label: `${symbol} Price`,
        data: dataPoints,
        borderColor: chartLineColor,
        backgroundColor: chartFillColor,
        tension: 0.3, // Smoother curve
        pointRadius: 0,
        pointHoverRadius: 4,
        pointBackgroundColor: chartLineColor,
        fill: 'start', // Fill to the origin or 'start' of the dataset
        borderWidth: 2,
      },
    ],
  };

  const options = getChartOptions(metaDataInterval);

  return (
    <div className="stock-chart-render-area"> {/* Class for potential CSS targeting from parent */}
      <Line options={options} data={chartData} />
    </div>
  );
};

const getChartOptions = (interval) => {
  let timeUnit = 'minute';
  if (interval) {
    const lowerInterval = interval.toLowerCase();
    if (lowerInterval.includes('min')) timeUnit = 'minute';
    else if (lowerInterval === 'd' || lowerInterval === 'w' || lowerInterval === 'm') timeUnit = 'day';
    else if (lowerInterval.includes('hour') || (!isNaN(parseInt(interval)) && parseInt(interval) >= 60)) timeUnit = 'hour';
  }

  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
        duration: 400, // Faster animation
        easing: 'linear'
    },
    plugins: {
      legend: { display: false },
      title: { display: false },
      tooltip: {
        enabled: true,
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)', // Darker tooltip
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: getThemeColor('--primary-color'),
        borderWidth: 1,
        padding: 10,
        caretPadding: 10,
        cornerRadius: 4,
        titleFont: { size: 12, weight: 'bold' },
        bodyFont: { size: 11 },
        displayColors: false, // Don't show color box in tooltip
        callbacks: {
          label: function(context) {
            if (context.parsed.y !== null) {
              return `Price: $${parseFloat(context.parsed.y).toFixed(2)}`;
            }
            return '';
          },
          title: function(tooltipItems) {
            if (tooltipItems.length > 0) {
              const date = new Date(tooltipItems[0].parsed.x);
              return date.toLocaleDateString([],{month:'short', day:'numeric'}) + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }
            return '';
          }
        }
      },
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: timeUnit,
          tooltipFormat: 'MMM d, HH:mm', // Tooltip date format
          displayFormats: {
            minute: 'HH:mm',
            hour: 'HH:mm',
            day: 'MMM d'
          }
        },
        ticks: {
          maxTicksLimit: 5,
          autoSkipPadding: 15, // More padding for auto skip
          maxRotation: 0,
          font: { size: 10, family: 'Roboto, sans-serif' }, // Use theme font
          color: getThemeColor('--text-light'),
        },
        grid: {
          display: false, // No vertical grid lines
        },
        border: {
            display: true,
            color: getThemeColor('--border-color'), // X-axis line
        }
      },
      y: {
        beginAtZero: false,
        position: 'right', // Y-axis on the right for a modern look
        ticks: {
          maxTicksLimit: 4,
          font: { size: 10, family: 'Roboto, sans-serif' },
          color: getThemeColor('--text-light'),
          padding: 5, // Padding from axis line
          callback: function(value) {
            return '$' + parseFloat(value).toFixed(Math.abs(value) > 50 ? 0 : 2);
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)', // Very subtle horizontal grid lines
          drawBorder: false, // Hide the y-axis line itself (border takes care of it)
          lineWidth: 0.5,
        },
        border: {
            display: true,
            color: getThemeColor('--border-color'), // Y-axis line
            dash: [2,2], // Dashed line for Y axis if desired
        }
      },
    },
    elements: {
      line: {
        borderWidth: 2, // Slightly thicker line for better visibility
      },
      point: { // Style for points if radius > 0
        hoverRadius: 5,
        hoverBorderWidth: 2,
      }
    },
    interaction: { // How chart interacts with mouse events
        mode: 'nearest',
        axis: 'x',
        intersect: false
    }
  };
};

// CSS for chart messages (can be in StockMonitor.module.css or a global file)
// If in StockMonitor.module.css, ensure to import styles and use styles.chartMessage
// This is a placeholder for how you might style messages if not using module CSS for this specific component.
// Better to put in StockMonitor.module.css and pass className if needed.
const GlobalChartMessageStyles = () => (
  <style jsx global>{`
    .chart-message {
      text-align: center;
      padding: 20px 10px;
      font-size: 0.85em;
      color: var(--text-light);
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .chart-message.error {
      color: var(--danger-color);
      font-weight: 500;
    }
    .stock-chart-render-area { /* Class added to the div wrapping <Line> */
        height: 100%;
        width: 100%;
    }
  `}</style>
);


// Add this to make the component self-contained with its basic message styles if not using CSS modules for these messages
const ChartWithStyles = (props) => (
    <>
        <GlobalChartMessageStyles />
        <StockChart {...props} />
    </>
);

// export default StockChart; // If you don't use the wrapper
export default ChartWithStyles; // If you use the wrapper for global styles