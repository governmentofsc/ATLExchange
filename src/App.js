import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ArrowLeft, Menu, X, Moon, Sun, LogOut, TrendingUp, TrendingDown, DollarSign, Activity, AlertCircle,
  BarChart3, PieChart, Download, Filter, Share2
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';
import { database } from './firebase';
import { ref, set, onValue, update } from 'firebase/database';

// Advanced Constants - Professional Stock Exchange Settings
const MARKET_HOURS = {
  preMarket: 4,
  open: 9,
  close: 16,
  afterHours: 20,
  lunchBreak: { start: 12, end: 13 } // Optional lunch break
};







const CHART_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#ff0000'];

// Utility functions
const getEasternTime = (date = new Date()) => {
  return new Date(date.toLocaleString("en-US", { timeZone: "America/New_York" }));
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

const formatNumber = (num) => {
  if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
  return num.toFixed(2);
};



const isMarketOpen = () => {
  const now = getEasternTime();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const day = now.getDay(); // 0 = Sunday, 6 = Saturday
  const currentTime = hour + minute / 60;

  // Market closed on weekends
  if (day === 0 || day === 6) return false;

  // Check for market holidays (simplified)
  const holidays = ['2024-01-01', '2024-07-04', '2024-12-25']; // Add more as needed
  const today = now.toISOString().split('T')[0];
  if (holidays.includes(today)) return false;

  // Regular trading hours
  return currentTime >= MARKET_HOURS.open && currentTime <= MARKET_HOURS.close;
};

















// BRAND NEW CLEAN CHART SYSTEM
function generateDailyChart(currentPrice, ticker) {
  const now = getEasternTime();
  const data = [];

  // Create seed for consistent data
  const seed = ticker.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  let rng = seed + now.getDate(); // Different each day
  const seededRandom = () => {
    rng = (rng * 1664525 + 1013904223) % 4294967296;
    return rng / 4294967296;
  };

  // Generate data from 12:00 AM to current time in 10-minute intervals
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const totalPoints = Math.floor(currentMinutes / 10) + 1;

  // Start price (slight variation from current)
  let price = currentPrice * (0.995 + seededRandom() * 0.01); // ±0.5% from current

  for (let i = 0; i < totalPoints; i++) {
    const minutes = i * 10; // Every 10 minutes
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    // Format time
    let displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    let ampm = hours < 12 ? 'AM' : 'PM';
    const timeLabel = `${displayHour}:${mins.toString().padStart(2, '0')} ${ampm}`;

    // Realistic price movement - very small changes
    if (i > 0) {
      const change = (seededRandom() - 0.5) * 0.002; // ±0.1% max change per 10min
      price = price * (1 + change);
    }

    // For the last point, use actual current price
    if (i === totalPoints - 1) {
      price = currentPrice;
    }

    data.push({
      time: timeLabel,
      price: parseFloat(price.toFixed(2)),
      volume: Math.floor(seededRandom() * 1000000 + 500000)
    });
  }

  return data;
}

const ATLStockExchange = () => {


  // Enhanced state management with better organization

  const [darkMode, setDarkMode] = useState(() => {
    // Initialize dark mode from localStorage
    return localStorage.getItem('darkMode') === 'true';
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [signupUsername, setSignupUsername] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupError, setSignupError] = useState('');
  const [selectedStock, setSelectedStock] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [buyQuantity, setBuyQuantity] = useState('');
  const [sellQuantity, setSellQuantity] = useState('');
  const [stocks, setStocks] = useState([]);
  const [users, setUsers] = useState({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [chartPeriod, setChartPeriod] = useState('1d');
  const [adminTab, setAdminTab] = useState('create');
  const [newStockName, setNewStockName] = useState('');
  const [newStockTicker, setNewStockTicker] = useState('');
  const [newStockPrice, setNewStockPrice] = useState('');
  const [newStockMarketCap, setNewStockMarketCap] = useState('');
  const [newStockPE, setNewStockPE] = useState('');
  const [newStockDividend, setNewStockDividend] = useState('');
  const [newStockHigh52w, setNewStockHigh52w] = useState('');
  const [newStockLow52w, setNewStockLow52w] = useState('');
  const [priceAdjustment, setPriceAdjustment] = useState('');
  const [pricePercentage, setPricePercentage] = useState('');
  const [selectedStockForAdmin, setSelectedStockForAdmin] = useState('');
  const [adjustMoney, setAdjustMoney] = useState('');
  const [targetUser, setTargetUser] = useState('');
  const [adminSharesUser, setAdminSharesUser] = useState('');
  const [adminSharesStock, setAdminSharesStock] = useState('');
  const [adminSharesQuantity, setAdminSharesQuantity] = useState('');
  const [splitStock, setSplitStock] = useState('');
  const [splitRatio, setSplitRatio] = useState('');
  const [initialized, setInitialized] = useState(false);
  const [stockFilter, setStockFilter] = useState('');
  const [chartKey, setChartKey] = useState(0); // Force chart re-renders
  const [updateSpeed, setUpdateSpeed] = useState(8000); // Price update interval in ms - ultra realistic
  const [chartUpdateSpeed, setChartUpdateSpeed] = useState(5000); // Chart update interval in ms
  const [isMarketController, setIsMarketController] = useState(false); // Controls if this tab runs price updates
  const [marketRunning, setMarketRunning] = useState(true); // Market state


  // const [showOrderBook, setShowOrderBook] = useState(false);
  const [marketEvents, setMarketEvents] = useState([]);

  // MASSIVE NEW FEATURES

  // const [alerts, setAlerts] = useState([]);
  // const [portfolioAnalysis, setPortfolioAnalysis] = useState({});

  const [performanceMetrics, setPerformanceMetrics] = useState({});
  // Removed theme modes - only light/dark now

  const [tradingHistory, setTradingHistory] = useState([]); // User's trading history
  const [alertStock, setAlertStock] = useState('');
  const [alertPrice, setAlertPrice] = useState('');
  const [alertType, setAlertType] = useState('above');
  const [notifications, setNotifications] = useState([]);

  // Advanced Features State

  const [sortBy, setSortBy] = useState('marketCap'); // marketCap, price, change, volume
  const [sortOrder, setSortOrder] = useState('desc');





  // Computed values with memoization for better performance
  // const totalMarketCap = useMemo(() => {
  //   return stocks.reduce((sum, stock) => sum + stock.marketCap, 0);
  // }, [stocks]);

  const marketStats = useMemo(() => {
    if (stocks.length === 0) return {
      gainers: 0, losers: 0, totalMarketCap: 0
    };

    const gainers = stocks.filter(stock => stock.price > stock.open).length;
    const losers = stocks.filter(stock => stock.price < stock.open).length;
    const totalMarketCap = stocks.reduce((sum, stock) => sum + stock.marketCap, 0);

    return {
      gainers,
      losers,
      totalMarketCap
    };
  }, [stocks]);

  const userPortfolioValue = useMemo(() => {
    if (!user || !users[user]) return 0;
    return Object.entries(users[user].portfolio || {}).reduce((sum, [ticker, qty]) => {
      const stock = stocks.find(s => s.ticker === ticker);
      return sum + (qty * (stock?.price || 0));
    }, 0);
  }, [user, users, stocks]);

  const filteredStocks = useMemo(() => {
    let filtered = stocks;



    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.ticker.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filters
    if (stockFilter === 'under100') filtered = filtered.filter(s => s.price < 100);
    if (stockFilter === '100to500') filtered = filtered.filter(s => s.price >= 100 && s.price < 500);
    if (stockFilter === 'over500') filtered = filtered.filter(s => s.price >= 500);
    if (stockFilter === 'largecap') filtered = filtered.filter(s => s.marketCap > 400000000000);
    if (stockFilter === 'midcap') filtered = filtered.filter(s => s.marketCap >= 200000000000 && s.marketCap <= 400000000000);
    if (stockFilter === 'smallcap') filtered = filtered.filter(s => s.marketCap < 200000000000);
    if (stockFilter === 'gainers') filtered = filtered.filter(s => s.price > s.open);
    if (stockFilter === 'losers') filtered = filtered.filter(s => s.price < s.open);
    if (stockFilter === 'active') filtered = filtered.sort((a, b) => (b.marketCap / b.price) - (a.marketCap / a.price));

    // Advanced sorting
    filtered.sort((a, b) => {
      let aVal, bVal;
      switch (sortBy) {
        case 'price':
          aVal = a.price;
          bVal = b.price;
          break;
        case 'change':
          aVal = ((a.price - a.open) / a.open) * 100;
          bVal = ((b.price - b.open) / b.open) * 100;
          break;
        case 'volume':
          aVal = a.marketCap / a.price;
          bVal = b.marketCap / b.price;
          break;
        case 'name':
          aVal = a.name;
          bVal = b.name;
          break;
        default: // marketCap
          aVal = a.marketCap;
          bVal = b.marketCap;
      }

      if (typeof aVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return filtered.slice(0, 50); // Increased limit for better browsing
  }, [stocks, searchQuery, stockFilter, sortBy, sortOrder]);



  const portfolioAllocation = useMemo(() => {
    if (!user || !users[user]) return [];

    const portfolio = users[user].portfolio || {};
    const totalValue = users[user].balance + userPortfolioValue;

    const allocation = Object.entries(portfolio).map(([ticker, qty]) => {
      const stock = stocks.find(s => s.ticker === ticker);
      if (!stock) return null;

      const value = qty * stock.price;
      const percentage = (value / totalValue) * 100;

      return {
        ticker,
        name: stock.name,
        value,
        percentage,
        shares: qty,
        price: stock.price
      };
    }).filter(Boolean);

    // Add cash as allocation
    if (users[user].balance > 0) {
      allocation.push({
        ticker: 'CASH',
        name: 'Cash',
        value: users[user].balance,
        percentage: (users[user].balance / totalValue) * 100,
        shares: 1,
        price: users[user].balance
      });
    }

    return allocation.sort((a, b) => b.percentage - a.percentage);
  }, [user, users, stocks, userPortfolioValue]);



  const topMovers = useMemo(() => {
    const movers = stocks.map(stock => ({
      ...stock,
      change: ((stock.price - stock.open) / stock.open) * 100
    }));

    const gainers = movers.filter(s => s.change > 0).sort((a, b) => b.change - a.change).slice(0, 5);
    const losers = movers.filter(s => s.change < 0).sort((a, b) => a.change - b.change).slice(0, 5);

    return { gainers, losers };
  }, [stocks]);



  // Persist dark mode to localStorage
  useEffect(() => {
    localStorage.setItem('darkMode', darkMode.toString());
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Ctrl/Cmd + D for dark mode toggle
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        setDarkMode(prev => !prev);
      }
      // Escape to close modals
      if (e.key === 'Escape') {
        setShowLoginModal(false);
        setShowSignupModal(false);
        setSelectedStock(null);
      }
      // Ctrl/Cmd + K for search focus
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.querySelector('input[placeholder="Search stocks..."]')?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Auto-dismiss notifications after 10 seconds
  useEffect(() => {
    if (notifications.length > 0) {
      const timer = setTimeout(() => {
        setNotifications(prev => prev.slice(1));
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [notifications]);







  useEffect(() => {
    const stocksRef = ref(database, 'stocks');
    const usersRef = ref(database, 'users');
    const marketStateRef = ref(database, 'marketState');

    onValue(stocksRef, (snapshot) => {
      try {
        const data = snapshot.val();
        if (data) {
          setStocks(data);
          setError(null);
        } else if (!initialized) {
          const initialStocks = [
            { ticker: 'HD', name: 'Home Depot Inc.', price: 387.45, open: 387.45, high: 392.10, low: 384.20, marketCap: 197100000000, pe: 24.8, high52w: 415.00, low52w: 295.00, dividend: 2.1, qtrlyDiv: 2.09, volumeMultiplier: 0.8, history: [] },
            { ticker: 'UPS', name: 'United Parcel Service Inc.', price: 132.85, open: 132.85, high: 135.40, low: 130.90, marketCap: 33660000000, pe: 18.2, high52w: 165.00, low52w: 115.00, dividend: 3.8, qtrlyDiv: 1.63, volumeMultiplier: 1.2, history: [] },
            { ticker: 'KO', name: 'Coca Cola', price: 62.15, open: 62.15, high: 63.20, low: 61.50, marketCap: 194540000000, pe: 26.4, high52w: 68.50, low52w: 52.30, dividend: 3.2, qtrlyDiv: 0.48, volumeMultiplier: 1.5, history: [] },
            { ticker: 'ICE', name: 'Intercontinental Exchange Inc.', price: 158.90, open: 158.90, high: 161.25, low: 157.10, marketCap: 78890000000, pe: 22.1, high52w: 175.00, low52w: 125.00, dividend: 1.4, qtrlyDiv: 0.38, volumeMultiplier: 0.9, history: [] },
            { ticker: 'AFL', name: 'Aflac Inc.', price: 98.75, open: 98.75, high: 100.20, low: 97.80, marketCap: 38170000000, pe: 15.8, high52w: 115.00, low52w: 82.00, dividend: 2.8, qtrlyDiv: 0.42, volumeMultiplier: 1.1, history: [] },
            { ticker: 'GPC', name: 'Genuine Parts Co.', price: 145.20, open: 145.20, high: 147.85, low: 143.60, marketCap: 18330000000, pe: 19.3, high52w: 165.00, low52w: 125.00, dividend: 3.5, qtrlyDiv: 0.895, volumeMultiplier: 0.7, history: [] },
            { ticker: 'SO', name: 'Southern Co.', price: 85.40, open: 85.40, high: 86.75, low: 84.30, marketCap: 64460000000, pe: 21.7, high52w: 92.00, low52w: 68.50, dividend: 4.2, qtrlyDiv: 0.72, volumeMultiplier: 1.3, history: [] },
            { ticker: 'PHM', name: 'Pulte Group Inc.', price: 118.65, open: 118.65, high: 120.90, low: 117.20, marketCap: 24320000000, pe: 12.4, high52w: 135.00, low52w: 85.00, dividend: 1.8, qtrlyDiv: 0.17, volumeMultiplier: 1.4, history: [] },
            { ticker: 'EFX', name: 'Equifax Inc.', price: 267.80, open: 267.80, high: 271.45, low: 265.10, marketCap: 18610000000, pe: 28.9, high52w: 295.00, low52w: 195.00, dividend: 1.6, qtrlyDiv: 0.39, volumeMultiplier: 0.8, history: [] },
            { ticker: 'IVZ', name: 'Invesco Inc.', price: 16.85, open: 16.85, high: 17.20, low: 16.50, marketCap: 10190000000, pe: 14.2, high52w: 22.50, low52w: 13.80, dividend: 4.8, qtrlyDiv: 0.188, volumeMultiplier: 2.1, history: [] },
            { ticker: 'SCA', name: 'South Carolina Airways Inc.', price: 89.30, open: 89.30, high: 90.85, low: 88.15, marketCap: 21190000000, pe: 16.7, high52w: 105.00, low52w: 72.00, dividend: 2.4, qtrlyDiv: 0.54, volumeMultiplier: 1.0, history: [] },
            { ticker: 'NSC', name: 'Norfolk Southern Corp.', price: 248.75, open: 248.75, high: 252.40, low: 246.90, marketCap: 51250000000, pe: 20.5, high52w: 275.00, low52w: 195.00, dividend: 2.8, qtrlyDiv: 1.24, volumeMultiplier: 0.9, history: [] },
            { ticker: 'ROL', name: 'Rollins Inc.', price: 44.20, open: 44.20, high: 44.95, low: 43.75, marketCap: 18170000000, pe: 32.8, high52w: 52.00, low52w: 38.50, dividend: 2.1, qtrlyDiv: 0.12, volumeMultiplier: 1.2, history: [] },
            { ticker: 'GPN', name: 'Global Payments Inc.', price: 124.85, open: 124.85, high: 127.30, low: 123.40, marketCap: 16110000000, pe: 18.9, high52w: 155.00, low52w: 95.00, dividend: 0.3, qtrlyDiv: 0.25, volumeMultiplier: 1.1, history: [] },
            { ticker: 'CPAY', name: 'Corpay Inc.', price: 298.40, open: 298.40, high: 302.15, low: 295.80, marketCap: 19160000000, pe: 25.3, high52w: 325.00, low52w: 225.00, dividend: 0.0, qtrlyDiv: 0.0, volumeMultiplier: 0.8, history: [] },
          ];
          set(stocksRef, initialStocks);
        }
      } catch (error) {
        setError('Failed to load stock data');
      }
    });

    onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setUsers(data);
      } else if (!initialized) {
        const initialUsers = {
          'demo': { password: 'demo', balance: 100000, portfolio: { HD: 10, KO: 25 } },
          'admin': { password: 'admin', balance: 1000000, portfolio: {} }
        };
        set(usersRef, initialUsers);
      }
    });

    // Listen for market state
    onValue(marketStateRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setMarketRunning(data.running !== false); // Default to true if not set
      } else if (!initialized) {
        // Initialize market state as running
        set(marketStateRef, { running: true });
      }
    });

    setInitialized(true);
    setLoading(false);
  }, [initialized]); // eslint-disable-next-line react-hooks/exhaustive-deps

  // Listen for trading history
  useEffect(() => {
    if (!user) return;

    const historyRef = ref(database, `tradingHistory/${user}`);
    onValue(historyRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Convert object to array and sort by timestamp
        const historyArray = Object.values(data).sort((a, b) => b.timestamp - a.timestamp);
        setTradingHistory(historyArray);
      } else {
        setTradingHistory([]);
      }
    });
  }, [user]);

  // Update selectedStock with live data when stocks change
  useEffect(() => {
    if (selectedStock && stocks.length > 0) {
      const liveStockData = stocks.find(s => s.ticker === selectedStock.ticker);
      if (liveStockData && liveStockData.price !== selectedStock.price) {
        // console.log('Updating selectedStock with live data:', liveStockData.ticker, 'old price:', selectedStock.price, 'new price:', liveStockData.price);
        setSelectedStock(liveStockData);
      }
    }
    setChartKey(prev => prev + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stocks]);

  // Simplified market controller - just make this tab the controller
  useEffect(() => {
    const controllerRef = ref(database, 'marketController');
    const sessionId = Date.now() + Math.random();

    // Become the market controller immediately
    set(controllerRef, {
      sessionId,
      timestamp: Date.now(),
      user: user || 'anonymous'
    });

    setIsMarketController(true);

    // Heartbeat to maintain control
    const heartbeat = setInterval(() => {
      update(controllerRef, {
        sessionId,
        timestamp: Date.now(),
        user: user || 'anonymous'
      });
    }, 5000);

    return () => {
      clearInterval(heartbeat);
    };
  }, [user]);

  useEffect(() => {
    if (stocks.length === 0) return;

    // Only run price updates if this tab is the market controller AND market is running
    if (!isMarketController || !marketRunning) {
      return;
    }

    const interval = setInterval(() => {
      const now = getEasternTime();
      const dayStartTime = getEasternTime();
      dayStartTime.setHours(0, 0, 0, 0);

      const updatedStocks = stocks.map(stock => {
        // Skip live updates for stocks that were recently traded (within 60 seconds)
        const timeSinceLastTrade = Date.now() - (stock.lastTradeTime || 0);
        if (timeSinceLastTrade < 60000) {
          // console.log(`Skipping live update for ${stock.ticker} - traded ${timeSinceLastTrade}ms ago`);
          return stock; // Don't update price if recently traded
        }

        // Clear manual trade flag after protection period
        if (stock.manualTrade && timeSinceLastTrade >= 60000) {
          stock = { ...stock, manualTrade: false };
        }

        // Realistic price movement algorithm
        const timeSeed = Date.now() + stock.ticker.charCodeAt(0);
        let seed = timeSeed % 1000000;
        const simpleRandom = () => {
          seed = (seed * 1664525 + 1013904223) % 4294967296;
          return seed / 4294967296;
        };

        // Ultra-realistic price movements like real stocks
        const timeOfDay = now.getHours() + now.getMinutes() / 60;

        // Market activity varies by time of day (very subtle)
        const marketActivityMultiplier = (timeOfDay >= 9 && timeOfDay <= 16) ? 1.1 : 0.3;

        // Extremely tiny volatility for realistic movements
        const baseVolatility = 0.00002 * marketActivityMultiplier; // 0.002% max change per update

        // Very subtle random walk
        const randomComponent = (simpleRandom() - 0.5) * baseVolatility;

        // Most updates result in no change (like real stocks)
        const shouldMove = simpleRandom() > 0.85; // Only move 15% of the time
        const totalChange = shouldMove ? randomComponent : 0;

        const newPrice = stock.price * (1 + totalChange);

        // Ultra-tight price bounds for realistic movements
        const minPrice = stock.price * 0.99998; // 0.002% down limit per update
        const maxPrice = stock.price * 1.00002; // 0.002% up limit per update
        const boundedPrice = Math.max(minPrice, Math.min(maxPrice, newPrice));
        const newPrice2 = Math.max(0.01, parseFloat(boundedPrice.toFixed(2)));

        const newHigh = Math.max(stock.high, newPrice2);
        const newLow = Math.min(stock.low, newPrice2);

        // CLEAN CHART SYSTEM: Reset at midnight, generate fresh daily chart
        const isNewDay = now.getHours() === 0 && now.getMinutes() < 10;
        let newHistory;

        if (isNewDay || !stock.history || stock.history.length === 0) {
          // Generate fresh chart for new day or if no history exists
          newHistory = generateDailyChart(newPrice2, stock.ticker);
        } else {
          // Update existing chart with current price
          newHistory = generateDailyChart(newPrice2, stock.ticker);
        }

        const sharesOutstanding = stock.marketCap / stock.price;
        const newMarketCap = Math.max(50000000000, sharesOutstanding * newPrice2);

        return { ...stock, price: newPrice2, high: newHigh, low: newLow, history: newHistory, marketCap: newMarketCap };
      });

      const stocksRef = ref(database, 'stocks');
      set(stocksRef, updatedStocks);
      setStocks(updatedStocks); // Update local state immediately
    }, updateSpeed); // Use configurable update speed

    return () => clearInterval(interval);
  }, [stocks, updateSpeed, isMarketController, marketRunning]);




  // SIMPLE CHART DATA FUNCTION
  function getChartData(stockData, period) {
    const currentPrice = stockData.price;
    const ticker = stockData.ticker;

    // For 1d, always use the live daily chart
    if (period === '1d') {
      return stockData.history && stockData.history.length > 0
        ? stockData.history
        : generateDailyChart(currentPrice, ticker);
    }

    // For other periods, generate simple synthetic data
    return generateSimpleChart(currentPrice, period, ticker);
  }

  // Generate simple charts for non-1d periods
  function generateSimpleChart(currentPrice, period, ticker) {
    const data = [];
    let points, timeUnit, maxChange;

    switch (period) {
      case '10m': points = 10; timeUnit = 'minutes'; maxChange = 0.002; break;
      case '30m': points = 30; timeUnit = 'minutes'; maxChange = 0.005; break;
      case '1h': points = 60; timeUnit = 'minutes'; maxChange = 0.01; break;
      case '1w': points = 7; timeUnit = 'days'; maxChange = 0.05; break;
      case '1m': points = 30; timeUnit = 'days'; maxChange = 0.15; break;
      case '1y': points = 12; timeUnit = 'months'; maxChange = 0.3; break;
      default: points = 24; timeUnit = 'hours'; maxChange = 0.02; break;
    }

    // Simple seed
    let seed = ticker.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const seededRandom = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };

    let price = currentPrice * (1 - maxChange / 2 + seededRandom() * maxChange / 2);

    for (let i = 0; i < points; i++) {
      // Simple time labels
      let timeLabel = '';
      if (timeUnit === 'minutes') {
        const mins = i;
        timeLabel = `${mins}m ago`;
      } else if (timeUnit === 'hours') {
        timeLabel = `${i}h ago`;
      } else if (timeUnit === 'days') {
        timeLabel = `${i}d ago`;
      } else if (timeUnit === 'months') {
        timeLabel = `${i}mo ago`;
      }

      // Smooth progression toward current price
      const progress = i / (points - 1);
      const targetPrice = price + (currentPrice - price) * progress;
      const variation = (seededRandom() - 0.5) * maxChange * 0.1;
      const finalPrice = targetPrice * (1 + variation);

      data.push({
        time: timeLabel,
        price: parseFloat(finalPrice.toFixed(2)),
        volume: Math.floor(seededRandom() * 1000000 + 500000)
      });
    }

    return data;
  }


  // Generate portfolio performance history
  function generatePortfolioHistory() {
    if (!user || !users[user]) return [];

    const data = [];
    const currentValue = (users[user]?.balance || 0) + Object.entries(users[user]?.portfolio || {}).reduce((sum, [ticker, qty]) => {
      const stock = stocks.find(s => s.ticker === ticker);
      return sum + (qty * (stock?.price || 0));
    }, 0);

    // Generate 30 days of portfolio value history
    for (let day = 30; day >= 0; day--) {
      const date = getEasternTime();
      date.setDate(date.getDate() - day);
      const dateStr = `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;

      // Simulate portfolio value changes
      const change = (Math.random() - 0.5) * 0.05; // 5% daily volatility
      const simulatedValue = currentValue * (1 + change * (day / 30));

      data.push({
        time: dateStr,
        value: parseFloat(simulatedValue.toFixed(2))
      });
    }

    return data;
  }

  const handleLogin = () => {
    if (loginUsername === 'admin' && loginPassword === 'admin') {
      // Ensure admin has proper data structure
      if (!users.admin || !users.admin.balance || !users.admin.portfolio) {
        // console.log('Initializing admin data');
        const usersRef = ref(database, `users/admin`);
        set(usersRef, {
          password: 'admin',
          balance: 1000000,
          portfolio: {}
        });
      }

      setUser('admin');
      setIsAdmin(true);
      setShowLoginModal(false);
      setLoginUsername('');
      setLoginPassword('');
    } else if (users[loginUsername] && users[loginUsername].password === loginPassword) {
      // Ensure user has proper data structure
      const userData = users[loginUsername];
      if (!userData.balance || !userData.portfolio) {
        // console.log('Initializing user data for:', loginUsername);
        const usersRef = ref(database, `users/${loginUsername}`);
        set(usersRef, {
          password: userData.password || loginPassword,
          balance: userData.balance || 50000,
          portfolio: userData.portfolio || {}
        });
      }

      setUser(loginUsername);
      setIsAdmin(false);
      setShowLoginModal(false);
      setLoginUsername('');
      setLoginPassword('');
    } else {
      setLoginError('Invalid username or password');
    }
  };

  const handleSignup = () => {
    setSignupError('');
    if (!signupUsername || !signupPassword || !signupConfirmPassword) {
      setSignupError('All fields are required');
      return;
    }
    if (signupPassword !== signupConfirmPassword) {
      setSignupError('Passwords do not match');
      return;
    }
    if (users[signupUsername] || signupUsername === 'admin') {
      setSignupError('Username already exists');
      return;
    }

    const usersRef = ref(database, `users/${signupUsername}`);
    set(usersRef, { password: signupPassword, balance: 50000, portfolio: {} });

    setUser(signupUsername);
    setIsAdmin(false);
    setShowSignupModal(false);
    setSignupUsername('');
    setSignupPassword('');
    setSignupConfirmPassword('');
  };

  const handleLogout = () => {
    setUser(null);
    setIsAdmin(false);
    setLoginUsername('');
    setLoginPassword('');
    setSelectedStock(null);
  };

  const buyStock = useCallback(() => {
    // Enhanced validation with user feedback
    if (!selectedStock || !buyQuantity || !user) {
      setNotifications(prev => [...prev, '⚠️ Please select a stock and enter quantity']);
      return;
    }

    if (!users[user] || !users[user].balance) {
      setNotifications(prev => [...prev, '❌ User data not loaded. Please try again.']);
      return;
    }

    const quantity = parseInt(buyQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      setNotifications(prev => [...prev, '⚠️ Please enter a valid quantity']);
      return;
    }

    // Calculate price impact and validate shares BEFORE updating database
    const totalShares = selectedStock.marketCap / selectedStock.price;
    const sharesBought = quantity;

    // Calculate total shares already owned by all users
    const totalOwnedShares = Object.values(users).reduce((total, userData) => {
      const portfolio = userData.portfolio || {};
      return total + (portfolio[selectedStock.ticker] || 0);
    }, 0);

    const availableShares = totalShares - totalOwnedShares;

    // Check if there are enough shares available
    if (sharesBought > availableShares) {
      const availablePercent = ((availableShares / totalShares) * 100).toFixed(2);
      setNotifications(prev => [...prev, `⚠️ Only ${Math.floor(availableShares)} shares available (${availablePercent}% of company). Total owned by all users: ${((totalOwnedShares / totalShares) * 100).toFixed(1)}%`]);
      return;
    }

    // Check 30% ownership limit per user
    const currentUserShares = (users[user].portfolio || {})[selectedStock.ticker] || 0;
    const newUserShares = currentUserShares + sharesBought;
    const newUserOwnershipPercent = (newUserShares / totalShares) * 100;

    if (newUserOwnershipPercent > 30) {
      const maxAllowedShares = Math.floor(totalShares * 0.3) - currentUserShares;
      const currentOwnershipPercent = (currentUserShares / totalShares) * 100;
      setNotifications(prev => [...prev, `⚠️ Cannot exceed 30% ownership of any stock. You currently own ${currentOwnershipPercent.toFixed(1)}%. Maximum additional shares you can buy: ${Math.max(0, maxAllowedShares)}`]);
      return;
    }

    // No trading fees - simple cost
    const totalCost = selectedStock.price * quantity;

    // 24/7 trading - no market hours restrictions

    // Position size validation (max 10% of available shares per trade)
    const maxTradeSize = Math.floor(availableShares * 0.1);
    if (sharesBought > maxTradeSize) {
      setNotifications(prev => [...prev, `⚠️ Maximum trade size: ${maxTradeSize} shares (10% of available)`]);
      return;
    }

    if (users[user].balance < totalCost) {
      setNotifications(prev => [...prev, `💰 Insufficient funds. Need ${formatCurrency(totalCost - users[user].balance)} more`]);
      return;
    }

    try {
      // Update user portfolio and balance first
      const userRef = ref(database, `users/${user}`);
      const newBalance = users[user].balance - totalCost;
      const currentPortfolio = users[user].portfolio || {};
      const newPortfolio = {
        ...currentPortfolio,
        [selectedStock.ticker]: (currentPortfolio[selectedStock.ticker] || 0) + quantity
      };

      update(userRef, { balance: newBalance, portfolio: newPortfolio });

      // SIMPLE PRICE IMPACT: 1% shares = 1% price increase
      const totalShares = selectedStock.marketCap / selectedStock.price;
      const sharePercentage = sharesBought / totalShares;
      const priceImpactPercent = sharePercentage * 100; // 1% shares = 1% price change
      const priceImpact = (priceImpactPercent / 100) * selectedStock.price;
      const newPrice = Math.max(0.01, parseFloat((selectedStock.price + priceImpact).toFixed(2)));

      // Update stock price with realistic impact
      const updatedStocks = stocks.map(s => {
        if (s.ticker === selectedStock.ticker) {
          const newHigh = Math.max(s.high, newPrice);
          const newLow = Math.min(s.low, newPrice);
          const sharesOutstanding = s.marketCap / s.price;
          const newMarketCap = sharesOutstanding * newPrice;
          return { ...s, price: newPrice, high: newHigh, low: newLow, marketCap: newMarketCap, lastTradeTime: Date.now(), manualTrade: true };
        }
        return s;
      });

      const stocksRef = ref(database, 'stocks');
      set(stocksRef, updatedStocks);

      // Success notification with price impact
      const impactPercent = ((priceImpact / selectedStock.price) * 100);
      const impactText = Math.abs(impactPercent) > 0.001 ? ` (+${impactPercent.toFixed(2)}%)` : '';
      setNotifications(prev => [...prev, `✅ Bought ${quantity} shares of ${selectedStock.ticker} for ${formatCurrency(totalCost)}${impactText}`]);
      setBuyQuantity('');

      // Record trade in history with impact
      const tradeRecord = {
        timestamp: Date.now(),
        type: 'buy',
        ticker: selectedStock.ticker,
        quantity: quantity,
        price: selectedStock.price,
        total: totalCost,
        newPrice: newPrice,
        priceImpact: priceImpact,
        impactPercent: ((priceImpact / selectedStock.price) * 100)
      };
      const historyRef = ref(database, `tradingHistory/${user}/${Date.now()}`);
      set(historyRef, tradeRecord);

    } catch (error) {
      setNotifications(prev => [...prev, '❌ Purchase failed. Please try again.']);
    }
  }, [selectedStock, buyQuantity, user, users, stocks]);

  const sellStock = useCallback(() => {
    // Enhanced validation with user feedback
    if (!selectedStock || !sellQuantity || !user) {
      setNotifications(prev => [...prev, '⚠️ Please select a stock and enter quantity']);
      return;
    }

    if (!users[user] || !users[user].balance) {
      setNotifications(prev => [...prev, '❌ User data not loaded. Please try again.']);
      return;
    }

    const quantity = parseInt(sellQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      setNotifications(prev => [...prev, '⚠️ Please enter a valid quantity']);
      return;
    }

    const currentPortfolio = users[user].portfolio || {};
    const availableShares = currentPortfolio[selectedStock.ticker] || 0;

    if (availableShares < quantity) {
      setNotifications(prev => [...prev, `⚠️ Insufficient shares. You only have ${availableShares} shares`]);
      return;
    }

    try {
      const proceeds = selectedStock.price * quantity;
      const userRef = ref(database, `users/${user}`);
      const newBalance = users[user].balance + proceeds;
      const newPortfolio = {
        ...currentPortfolio,
        [selectedStock.ticker]: currentPortfolio[selectedStock.ticker] - quantity
      };

      update(userRef, { balance: newBalance, portfolio: newPortfolio });

      // Success notification
      setNotifications(prev => [...prev, `✅ Sold ${quantity} shares of ${selectedStock.ticker} for ${formatCurrency(proceeds)}`]);
      setSellQuantity('');

      // SIMPLE SELL PRICE IMPACT: 1% shares = 1% price decrease
      const totalShares = selectedStock.marketCap / selectedStock.price;
      const sharePercentage = quantity / totalShares;
      const priceImpactPercent = sharePercentage * 100; // 1% shares = 1% price change
      const priceImpact = -(priceImpactPercent / 100) * selectedStock.price; // Negative for selling
      const newPrice = Math.max(0.01, parseFloat((selectedStock.price + priceImpact).toFixed(2)));

      // Update stock price with realistic sell impact
      const updatedStocks = stocks.map(s => {
        if (s.ticker === selectedStock.ticker) {
          const newHigh = Math.max(s.high, newPrice);
          const newLow = Math.min(s.low, newPrice);
          const sharesOutstanding = s.marketCap / s.price;
          const newMarketCap = sharesOutstanding * newPrice;
          return { ...s, price: newPrice, high: newHigh, low: newLow, marketCap: newMarketCap, lastTradeTime: Date.now(), manualTrade: true };
        }
        return s;
      });

      const stocksRef = ref(database, 'stocks');
      set(stocksRef, updatedStocks);

      // Sell notification with price impact
      const impactPercent = ((priceImpact / selectedStock.price) * 100);
      const impactText = Math.abs(impactPercent) > 0.001 ? ` (${impactPercent.toFixed(2)}%)` : '';
      setNotifications(prev => [...prev, `✅ Sold ${quantity} shares of ${selectedStock.ticker} for ${formatCurrency(proceeds)}${impactText}`]);

      // Record trade in history with realistic impact
      const tradeRecord = {
        timestamp: Date.now(),
        type: 'sell',
        ticker: selectedStock.ticker,
        quantity: quantity,
        price: selectedStock.price,
        total: proceeds,
        newPrice: newPrice,
        priceImpact: priceImpact,
        impactPercent: ((priceImpact / selectedStock.price) * 100)
      };
      const historyRef = ref(database, `tradingHistory/${user}/${Date.now()}`);
      set(historyRef, tradeRecord);
    } catch (error) {
      setNotifications(prev => [...prev, '❌ Sale failed. Please try again.']);
    }
  }, [selectedStock, sellQuantity, user, users, stocks]);

  const createStock = () => {
    if (!newStockName || !newStockTicker || !newStockPrice) return;

    const marketCap = parseFloat(newStockMarketCap) || 500000000000;
    const pe = parseFloat(newStockPE) || 25.0;
    const dividend = parseFloat(newStockDividend) || 0.5;
    const high52w = parseFloat(newStockHigh52w) || parseFloat(newStockPrice) * 1.2;
    const low52w = parseFloat(newStockLow52w) || parseFloat(newStockPrice) * 0.8;

    const newStock = {
      ticker: newStockTicker.toUpperCase(),
      name: newStockName,
      price: parseFloat(newStockPrice),
      open: parseFloat(newStockPrice),
      high: parseFloat(newStockPrice),
      low: parseFloat(newStockPrice),
      marketCap: marketCap,
      pe: pe,
      high52w: high52w,
      low52w: low52w,
      dividend: dividend,
      qtrlyDiv: dividend / 4,
      history: []
    };

    const stocksRef = ref(database, 'stocks');
    set(stocksRef, [...stocks, newStock]);

    setNewStockName('');
    setNewStockTicker('');
    setNewStockPrice('');
    setNewStockMarketCap('');
    setNewStockPE('');
    setNewStockDividend('');
    setNewStockHigh52w('');
    setNewStockLow52w('');
  };

  const adjustPriceByAmount = () => {
    if (!selectedStockForAdmin || !priceAdjustment) return;

    const updatedStocks = stocks.map(s => {
      if (s.ticker === selectedStockForAdmin) {
        const newPrice = parseFloat((parseFloat(s.price) + parseFloat(priceAdjustment)).toFixed(2));
        const newHigh = Math.max(s.high, newPrice);
        const newLow = Math.min(s.low, newPrice);
        const sharesOutstanding = s.marketCap / s.price;
        const newMarketCap = Math.max(50000000000, sharesOutstanding * newPrice);
        return { ...s, price: newPrice, high: newHigh, low: newLow, marketCap: newMarketCap };
      }
      return s;
    });

    const stocksRef = ref(database, 'stocks');
    set(stocksRef, updatedStocks);
    setPriceAdjustment('');
    setSelectedStockForAdmin('');
  };

  const adjustPriceByPercentage = () => {
    if (!selectedStockForAdmin || !pricePercentage) return;

    const updatedStocks = stocks.map(s => {
      if (s.ticker === selectedStockForAdmin) {
        const percentChange = parseFloat(pricePercentage) / 100;
        const newPrice = parseFloat((s.price * (1 + percentChange)).toFixed(2));
        const newHigh = Math.max(s.high, newPrice);
        const newLow = Math.min(s.low, newPrice);
        const sharesOutstanding = s.marketCap / s.price;
        const newMarketCap = Math.max(50000000000, sharesOutstanding * newPrice);
        return { ...s, price: newPrice, high: newHigh, low: newLow, marketCap: newMarketCap };
      }
      return s;
    });

    const stocksRef = ref(database, 'stocks');
    set(stocksRef, updatedStocks);
    setPricePercentage('');
    setSelectedStockForAdmin('');
  };

  const adjustMoneySetter = () => {
    if (!targetUser || !adjustMoney) return;

    const userRef = ref(database, `users/${targetUser}`);
    const newBalance = users[targetUser].balance + parseFloat(adjustMoney);
    update(userRef, { balance: newBalance });

    setAdjustMoney('');
    setTargetUser('');
  };

  const adminGiveShares = () => {
    if (!adminSharesUser || !adminSharesStock || !adminSharesQuantity) return;

    const quantity = parseInt(adminSharesQuantity);
    const userRef = ref(database, `users/${adminSharesUser}`);
    const newPortfolio = {
      ...users[adminSharesUser].portfolio,
      [adminSharesStock]: (users[adminSharesUser].portfolio[adminSharesStock] || 0) + quantity
    };
    update(userRef, { portfolio: newPortfolio });

    setAdminSharesUser('');
    setAdminSharesStock('');
    setAdminSharesQuantity('');
  };

  const adminRemoveShares = () => {
    if (!adminSharesUser || !adminSharesStock || !adminSharesQuantity) return;

    const quantity = parseInt(adminSharesQuantity);
    if ((users[adminSharesUser].portfolio[adminSharesStock] || 0) < quantity) return;

    const userRef = ref(database, `users/${adminSharesUser}`);
    const newPortfolio = {
      ...users[adminSharesUser].portfolio,
      [adminSharesStock]: users[adminSharesUser].portfolio[adminSharesStock] - quantity
    };
    update(userRef, { portfolio: newPortfolio });

    setAdminSharesUser('');
    setAdminSharesStock('');
    setAdminSharesQuantity('');
  };

  const startMarket = () => {
    const marketStateRef = ref(database, 'marketState');
    set(marketStateRef, { running: true });
  };

  const stopMarket = () => {
    const marketStateRef = ref(database, 'marketState');
    set(marketStateRef, { running: false });
  };









  const exportPortfolio = useCallback(() => {
    if (!user || !users[user]) return;

    const portfolioData = {
      user,
      timestamp: new Date().toISOString(),
      balance: users[user].balance,
      portfolio: users[user].portfolio,
      totalValue: users[user].balance + userPortfolioValue,

      stocks: stocks.map(s => ({ ticker: s.ticker, price: s.price, change: ((s.price - s.open) / s.open) * 100 }))
    };

    const dataStr = JSON.stringify(portfolioData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `portfolio-${user}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);

    setNotifications(prev => [...prev, '📥 Portfolio exported successfully']);
  }, [user, users, userPortfolioValue, stocks]);

  const sharePortfolio = useCallback(() => {
    if (!user || !users[user]) return;

    const totalValue = users[user].balance + userPortfolioValue;
    const shareText = `Check out my portfolio on Atlanta Stock Exchange! 💼\n\nTotal Value: ${formatCurrency(totalValue)}\nTop Holdings: ${Object.keys(users[user].portfolio || {}).slice(0, 3).join(', ')}\n\n#StockTrading #ASE`;

    if (navigator.share) {
      navigator.share({
        title: 'My ASE Portfolio',
        text: shareText,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(shareText);
      setNotifications(prev => [...prev, '📋 Portfolio details copied to clipboard']);
    }
  }, [user, users, userPortfolioValue]);



  // ADVANCED PORTFOLIO ANALYSIS
  const calculatePortfolioMetrics = useCallback(() => {
    if (!user || !users[user]) return;

    const portfolio = users[user].portfolio || {};
    const balance = users[user].balance || 0;
    let totalValue = balance;
    let dayChange = 0;
    let positions = [];

    Object.entries(portfolio).forEach(([ticker, quantity]) => {
      const stock = stocks.find(s => s.ticker === ticker);
      if (stock && quantity > 0) {
        const currentValue = stock.price * quantity;
        const dayStartPrice = (stock.history && stock.history.length > 0) ? stock.history[0].price : stock.open;
        const positionDayChange = (stock.price - dayStartPrice) * quantity;

        totalValue += currentValue;
        dayChange += positionDayChange;

        positions.push({
          ticker,
          quantity,
          currentPrice: stock.price,
          currentValue,
          dayChange: positionDayChange,
          dayChangePercent: ((stock.price - dayStartPrice) / dayStartPrice) * 100,
          weight: (currentValue / totalValue) * 100
        });
      }
    });

    const metrics = {
      totalValue,
      dayChange,
      dayChangePercent: totalValue > 0 ? (dayChange / totalValue) * 100 : 0,
      positions,
      diversification: positions.length,
      largestPosition: positions.length > 0 ? Math.max(...positions.map(p => p.weight)) : 0,
      cash: balance,
      cashPercent: (balance / totalValue) * 100
    };

    setPerformanceMetrics(metrics);
  }, [user, users, stocks]);

  useEffect(() => {
    calculatePortfolioMetrics();
  }, [calculatePortfolioMetrics]);

  // Market events system
  useEffect(() => {
    const generateMarketEvent = () => {
      const events = [
        "📈 Major institutional investor increases position in tech stocks",
        "🏦 Federal Reserve hints at interest rate changes",
        "💰 Record trading volume detected in energy sector",
        "🌍 Global market volatility affects local trading",
        "📊 Algorithmic trading surge detected",
        "🚀 Breakthrough technology announcement impacts market",
        "⚡ Flash crash recovery in progress",
        "🎯 Market makers adjusting positions",
        "📱 Social media sentiment driving retail trading",
        "🔥 Meme stock phenomenon spreading"
      ];

      // Generate events based on market conditions
      if (Math.random() < 0.1) { // 10% chance every interval
        const event = events[Math.floor(Math.random() * events.length)];
        setMarketEvents(prev => [...prev.slice(-2), event]); // Keep last 3 events
      }
    };

    const eventInterval = setInterval(generateMarketEvent, 30000); // Every 30 seconds
    return () => clearInterval(eventInterval);
  }, []);

  const createPriceAlert = () => {
    if (!alertStock || !alertPrice) return;



    // In a real app, this would be stored in the database
    setNotifications(prev => [...prev, `Alert created for ${alertStock} at $${alertPrice}`]);

    setAlertStock('');
    setAlertPrice('');
  };

  const executeStockSplit = () => {
    if (!splitStock || !splitRatio) return;

    const ratio = parseFloat(splitRatio);
    if (ratio <= 0) return;

    const updatedStocks = stocks.map(s => {
      if (s.ticker === splitStock) {
        const newPrice = s.price / ratio;
        const newOpen = s.open / ratio;
        const newHigh = s.high / ratio;
        const newLow = s.low / ratio;
        const newHigh52w = s.high52w / ratio;
        const newLow52w = s.low52w / ratio;

        return {
          ...s,
          price: parseFloat(newPrice.toFixed(2)),
          open: parseFloat(newOpen.toFixed(2)),
          high: parseFloat(newHigh.toFixed(2)),
          low: parseFloat(newLow.toFixed(2)),
          high52w: parseFloat(newHigh52w.toFixed(2)),
          low52w: parseFloat(newLow52w.toFixed(2))
        };
      }
      return s;
    });

    // Update all user portfolios to reflect the split
    const updatedUsers = { ...users };
    Object.keys(updatedUsers).forEach(username => {
      if (updatedUsers[username].portfolio[splitStock]) {
        updatedUsers[username].portfolio[splitStock] *= ratio;
      }
    });

    const stocksRef = ref(database, 'stocks');
    const usersRef = ref(database, 'users');
    set(stocksRef, updatedStocks);
    set(usersRef, updatedUsers);

    setSplitStock('');
    setSplitRatio('');
  };





  const getChartDomain = (data) => {
    if (!data || data.length === 0) return [0, 100];
    const prices = data.map(d => d.price).filter(p => p && !isNaN(p));
    if (prices.length === 0) return [0, 100];

    const min = Math.min(...prices);
    const max = Math.max(...prices);

    // If min and max are the same (flat line), add small padding
    if (min === max) {
      const padding = min * 0.01; // 1% padding
      return [parseFloat((min - padding).toFixed(2)), parseFloat((max + padding).toFixed(2))];
    }

    const padding = (max - min) * 0.05; // Reduced padding for better view
    const paddedMin = Math.max(0, min - padding);
    const paddedMax = max + padding;
    return [parseFloat(paddedMin.toFixed(2)), parseFloat(paddedMax.toFixed(2))];
  };

  const getYAxisTicks = (domain) => {
    const [min, max] = domain;
    const step = (max - min) / 3;
    return [
      parseFloat(min.toFixed(2)),
      parseFloat((min + step).toFixed(2)),
      parseFloat((min + step * 2).toFixed(2)),
      parseFloat(max.toFixed(2))
    ];
  };

  // Simple theme system - just light/dark
  const theme = {
    bg: darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900',
    card: darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-200',
    input: darkMode ? 'bg-gray-700 text-white border-gray-600 focus:border-blue-500' : 'bg-white text-gray-900 border-gray-300 focus:border-blue-500',
    button: 'bg-blue-600 hover:bg-blue-700 text-white',
    accent: darkMode ? 'text-blue-400' : 'text-blue-600',
    success: darkMode ? 'text-emerald-400 bg-emerald-900/20' : 'text-emerald-600 bg-emerald-50',
    danger: darkMode ? 'text-red-400 bg-red-900/20' : 'text-red-600 bg-red-50',
    warning: darkMode ? 'text-amber-400 bg-amber-900/20' : 'text-amber-600 bg-amber-50',
    muted: darkMode ? 'text-gray-400' : 'text-gray-600'
  };
  const bgClass = theme.bg;
  const cardClass = theme.card;
  const inputClass = theme.input;

  // Loading state
  if (loading) {
    return (
      <div className={`min-h-screen ${bgClass} flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold mb-2">Loading Atlanta Stock Exchange</h2>
          <p className="text-gray-600 dark:text-gray-400">Initializing market data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`min-h-screen ${bgClass} flex items-center justify-center`}>
        <div className="text-center max-w-md">
          <div className="text-red-500 mb-4">
            <AlertCircle className="w-16 h-16 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-red-600">Connection Error</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  if (selectedStock) {
    const stockData = stocks.find(s => s.ticker === selectedStock.ticker);

    // Debug logging
    // if (stockData && selectedStock) {
    //   console.log('Stock detail view - selectedStock price:', selectedStock.price, 'live price:', stockData.price);
    // }

    // Show loading screen if data isn't ready yet
    if (!stockData || stocks.length === 0) {
      return (
        <div className={`min-h-screen ${bgClass} flex items-center justify-center`}>
          <div className="text-center">
            <p className="text-lg">Loading stock data...</p>
            <p className="text-sm text-gray-500 mt-2">Selected: {selectedStock.ticker}</p>
            <p className="text-xs text-gray-400 mt-1">Stocks loaded: {stocks.length}</p>
            <button onClick={() => setSelectedStock(null)} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">Back</button>
          </div>
        </div>
      );
    }

    if (user && (!users || !users[user])) {
      return (
        <div className={`min-h-screen ${bgClass} flex items-center justify-center`}>
          <div className="text-center">
            <p className="text-lg">Loading user data...</p>
            <p className="text-sm text-gray-500 mt-2">User: {user}</p>
            <p className="text-xs text-gray-400 mt-1">Users loaded: {Object.keys(users || {}).length}</p>
            <p className="text-xs text-gray-400 mt-1">User data ready: {users && users[user] ? 'Yes' : 'No'}</p>
            <button onClick={() => setSelectedStock(null)} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">Back</button>
          </div>
        </div>
      );
    }

    const userHolding = user && users && users[user] ? (users[user].portfolio?.[selectedStock.ticker] || 0) : 0;
    const portfolioValue = userHolding * stockData.price;
    const priceChange = stockData.price - stockData.open;
    const percentChange = ((priceChange / stockData.open) * 100).toFixed(2);
    const percentChangeColor = percentChange >= 0 ? 'text-green-600' : 'text-red-600';

    // Use the clean chart data function
    const chartData = getChartData(stockData, chartPeriod);


    const chartDomain = getChartDomain(chartData);

    return (
      <div className={`min-h-screen ${bgClass}`}>
        <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
          <button onClick={() => setSelectedStock(null)} className="flex items-center gap-2 hover:opacity-80">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-bold">Back</span>
          </button>
          <div className="flex items-center gap-4">
            {user && users[user] && <span className="text-sm">${(users[user].balance).toFixed(2)}</span>}
            <button onClick={() => setDarkMode(!darkMode)} className="p-2">
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <div className={`lg:col-span-2 p-6 rounded-lg border-2 ${cardClass}`}>
              <h2 className="text-2xl font-bold mb-2">{stockData.name} ({stockData.ticker})</h2>
              <div className="flex items-baseline gap-3 mb-4">
                <p className="text-3xl font-bold text-blue-600">${stockData.price.toFixed(2)}</p>
                <p className={`text-lg font-bold ${percentChangeColor}`}>{percentChange >= 0 ? '+' : ''}{percentChange}%</p>
              </div>

              <div className="mb-4 flex gap-2 flex-wrap">
                {['10m', '30m', '1h', '1d', '1w', '1m', '1y'].map(period => (
                  <button key={period} onClick={() => setChartPeriod(period)} className={`px-3 py-1 rounded text-sm ${chartPeriod === period ? 'bg-blue-600 text-white' : darkMode ? 'bg-gray-700 text-gray-100 hover:bg-gray-600' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'}`}>{period}</button>
                ))}
              </div>

              {chartData && chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400} key={`${stockData.ticker}-${chartKey}`}>
                  <LineChart data={chartData}>
                    <CartesianGrid stroke={darkMode ? '#444' : '#ccc'} />
                    <XAxis dataKey="time" stroke={darkMode ? '#999' : '#666'} angle={-45} textAnchor="end" height={80} interval={Math.max(0, Math.floor(chartData.length / 14))} />
                    <YAxis stroke={darkMode ? '#999' : '#666'} domain={chartDomain} type="number" ticks={getYAxisTicks(chartDomain)} />
                    <Tooltip contentStyle={{ backgroundColor: darkMode ? '#444' : '#fff', border: `1px solid ${darkMode ? '#666' : '#ccc'}` }} />
                    <Line type="monotone" dataKey="price" stroke="#2563eb" dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-96 flex items-center justify-center text-gray-500">No chart data available</div>
              )}
            </div>

            <div className={`p-6 rounded-lg border-2 ${cardClass}`}>
              <h3 className="font-bold mb-4 text-lg">Stock Information</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span>Open:</span><span className="font-bold">${stockData.open.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>High:</span><span className="font-bold">${stockData.high.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Low:</span><span className="font-bold">${stockData.low.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Market Cap:</span><span className="font-bold">${(stockData.marketCap / 1000000000).toFixed(2)}B</span></div>
                <div className="flex justify-between"><span>P/E Ratio:</span><span className="font-bold">{stockData.pe.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>52-wk High:</span><span className="font-bold">${stockData.high52w.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>52-wk Low:</span><span className="font-bold">${stockData.low52w.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Dividend:</span><span className="font-bold">{stockData.dividend.toFixed(2)}%</span></div>
                <div className="flex justify-between"><span>Quarterly Div:</span><span className="font-bold">${stockData.qtrlyDiv.toFixed(2)}</span></div>
                {user && <>
                  <div className="border-t pt-3 flex justify-between"><span>Your Holdings:</span><span className="font-bold">{userHolding} shares</span></div>
                  <div className="flex justify-between"><span>Portfolio Value:</span><span className="font-bold">${portfolioValue.toFixed(2)}</span></div>
                </>}
              </div>
            </div>
          </div>

          {user && <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className={`p-6 rounded-lg border-2 ${cardClass}`}>
              <h3 className="font-bold mb-4">Buy {stockData.ticker}</h3>
              <input type="number" placeholder="Quantity" value={buyQuantity} onChange={(e) => setBuyQuantity(e.target.value)} className={`w-full p-2 mb-2 border rounded ${inputClass}`} />
              <p className="mb-3">Cost: ${((parseInt(buyQuantity) || 0) * stockData.price).toFixed(2)}</p>
              <button onClick={buyStock} className="w-full bg-green-600 text-white p-2 rounded font-bold hover:bg-green-700">Buy</button>
            </div>

            <div className={`p-6 rounded-lg border-2 ${cardClass}`}>
              <h3 className="font-bold mb-4">Sell {stockData.ticker}</h3>
              <input type="number" placeholder="Quantity" value={sellQuantity} onChange={(e) => setSellQuantity(e.target.value)} className={`w-full p-2 mb-2 border rounded ${inputClass}`} />
              <p className="mb-3">Proceeds: ${((parseInt(sellQuantity) || 0) * stockData.price).toFixed(2)}</p>
              <button onClick={sellStock} className="w-full bg-red-600 text-white p-2 rounded font-bold hover:bg-red-700">Sell</button>
            </div>
          </div>}
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bgClass}`}>
      {/* PROFESSIONAL HEADER - COMPLETELY REDESIGNED */}
      <div className={`${theme.card} border-b-2 ${theme.accent} p-4 flex justify-between items-center sticky top-0 z-50 backdrop-blur-md bg-opacity-95`}>
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 ${theme.button} rounded-xl flex items-center justify-center shadow-lg`}>
            <span className="text-white font-bold text-lg">ASE</span>
          </div>
          <div className="flex flex-col">
            <h1 className={`text-2xl font-bold ${theme.accent} tracking-tight`}>Atlanta Stock Exchange</h1>
            <div className="flex items-center gap-4 text-sm">
              <span className={`flex items-center gap-1 px-2 py-1 rounded-md ${theme.success}`}>
                <TrendingUp className="w-4 h-4" />
                {marketStats.gainers} Gainers
              </span>
              <span className={`flex items-center gap-1 px-2 py-1 rounded-md ${theme.danger}`}>
                <TrendingDown className="w-4 h-4" />
                {marketStats.losers} Losers
              </span>
              <span className={`flex items-center gap-1 px-2 py-1 rounded-md ${theme.warning}`}>
                <DollarSign className="w-4 h-4" />
                {formatNumber(marketStats.totalMarketCap)}
              </span>

            </div>
          </div>
          {notifications.length > 0 && (
            <div className="relative animate-bounce">
              <AlertCircle className="w-7 h-7 text-yellow-500 drop-shadow-lg" />
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg">
                {notifications.length}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* ADVANCED SEARCH */}
          <div className="relative">
            <input
              type="text"
              placeholder="🔍 Search stocks, news, alerts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`${inputClass} px-4 py-2 rounded-xl text-sm w-64 shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-blue-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>



          {/* USER PORTFOLIO DISPLAY */}
          {user && users[user] && performanceMetrics.totalValue && (
            <div className="flex items-center gap-3">
              <div className={`${performanceMetrics.dayChange >= 0 ? theme.success : theme.danger} px-4 py-2 rounded-xl shadow-lg`}>
                <div className="text-xs opacity-75">Portfolio</div>
                <div className="font-bold text-lg">{formatCurrency(performanceMetrics.totalValue)}</div>
                <div className="text-xs">
                  {performanceMetrics.dayChange >= 0 ? '+' : ''}{performanceMetrics.dayChangePercent.toFixed(2)}%
                </div>
              </div>
            </div>
          )}
          {/* PROFESSIONAL CONTROLS */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`${theme.button} p-3 rounded-xl shadow-lg hover:scale-105 transition-all`}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {isAdmin && (
              <span className="bg-gradient-to-r from-red-500 to-pink-500 px-3 py-2 rounded-xl text-xs font-bold text-white animate-pulse shadow-lg hidden md:inline">
                👑 ADMIN
              </span>
            )}

            {isAdmin && isMarketController && (
              <span className="bg-gradient-to-r from-green-500 to-emerald-500 px-3 py-2 rounded-xl text-xs font-bold text-white shadow-lg hidden md:inline">
                🎮 CONTROLLER
              </span>
            )}



            {/* LIVE CLOCK */}
            <div className={`${theme.card} px-4 py-2 rounded-xl text-sm font-bold shadow-lg border-2 hidden md:flex`}>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                {getEasternTime().toLocaleTimeString('en-US', {
                  timeZone: 'America/New_York',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                })} ET
              </div>
            </div>
          </div>
          {user ? (
            <button onClick={handleLogout} className="p-2 hover:bg-blue-700 rounded text-white hidden md:inline-block"><LogOut className="w-5 h-5" /></button>
          ) : (
            <button onClick={() => setShowLoginModal(true)} className="px-4 py-2 bg-white text-blue-600 rounded-lg font-bold hover:bg-gray-100 text-sm transition-colors shadow-md">Login</button>
          )}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden text-white">
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className={`md:hidden p-4 ${cardClass} border-b`}>
          {user && users[user] && <p className="mb-2"><strong>Balance:</strong> {formatCurrency(users[user].balance)}</p>}
          <button onClick={() => setDarkMode(!darkMode)} className="mb-2 w-full text-left p-2">{darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}</button>
          {isAdmin && <span className="block bg-red-600 text-white px-2 py-1 rounded text-xs mb-2 w-fit">ADMIN</span>}
          {isAdmin && isMarketController && <span className="block bg-green-600 text-white px-2 py-1 rounded text-xs mb-2 w-fit">MARKET CONTROLLER</span>}
          <span className={`block px-2 py-1 rounded text-xs mb-2 w-fit ${marketRunning ? 'bg-green-600' : 'bg-red-600'} text-white`}>
            MARKET {marketRunning ? 'RUNNING' : 'STOPPED'}
          </span>
          <span className="block bg-blue-600 text-white px-2 py-1 rounded text-xs mb-2 w-fit">
            {getEasternTime().toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit' })} ET
          </span>
          {user ? (
            <button onClick={handleLogout} className="text-red-600">Logout</button>
          ) : (
            <button onClick={() => setShowLoginModal(true)} className="text-blue-600 font-bold">Login</button>
          )}
        </div>
      )}

      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`p-8 rounded-lg border-2 ${cardClass} w-full max-w-sm`}>
            <h1 className="text-3xl font-bold mb-2 text-blue-600">Atlanta Stock Exchange</h1>
            <p className="text-sm mb-6 opacity-75">Login</p>
            <input type="text" placeholder="Username" value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)} className={`w-full p-2 mb-3 border rounded ${inputClass}`} />
            <input type="password" placeholder="Password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className={`w-full p-2 mb-3 border rounded ${inputClass}`} />
            {loginError && <p className="text-red-600 text-sm mb-3">{loginError}</p>}
            <button onClick={handleLogin} className="w-full bg-blue-600 text-white p-2 rounded font-bold hover:bg-blue-700 mb-2">Login</button>
            <button onClick={() => { setShowLoginModal(false); setShowSignupModal(true); }} className="w-full bg-green-600 text-white p-2 rounded font-bold hover:bg-green-700 mb-2">Sign Up</button>
            <button onClick={() => setShowLoginModal(false)} className="w-full bg-gray-400 text-white p-2 rounded font-bold hover:bg-gray-500">Close</button>
            <p className="text-xs mt-4 opacity-50">Demo: demo/demo | Admin: admin/admin</p>
          </div>
        </div>
      )}

      {showSignupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`p-8 rounded-lg border-2 ${cardClass} w-full max-w-sm`}>
            <h1 className="text-3xl font-bold mb-2 text-blue-600">Create Account</h1>
            <p className="text-sm mb-6 opacity-75">Sign Up</p>
            {signupError && <p className="text-red-600 text-sm mb-4">{signupError}</p>}
            <input type="text" placeholder="Username" value={signupUsername} onChange={(e) => setSignupUsername(e.target.value)} className={`w-full p-2 mb-3 border rounded ${inputClass}`} />
            <input type="password" placeholder="Password" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} className={`w-full p-2 mb-3 border rounded ${inputClass}`} />
            <input type="password" placeholder="Confirm Password" value={signupConfirmPassword} onChange={(e) => setSignupConfirmPassword(e.target.value)} className={`w-full p-2 mb-4 border rounded ${inputClass}`} />
            <button onClick={handleSignup} className="w-full bg-green-600 text-white p-2 rounded font-bold hover:bg-green-700 mb-2">Sign Up</button>
            <button onClick={() => { setShowSignupModal(false); setShowLoginModal(true); }} className="w-full bg-blue-600 text-white p-2 rounded font-bold hover:bg-blue-700 mb-2">Back to Login</button>
            <button onClick={() => setShowSignupModal(false)} className="w-full bg-gray-400 text-white p-2 rounded font-bold hover:bg-gray-500">Close</button>
            <p className="text-xs mt-4 opacity-50">Starting balance: $50,000</p>
          </div>
        </div>
      )}

      {isAdmin && (
        <div className={`bg-blue-700 text-white p-4 flex gap-4 overflow-x-auto`}>
          <button onClick={() => setAdminTab('create')} className={`px-4 py-2 rounded ${adminTab === 'create' ? 'bg-white text-blue-600' : ''}`}>Create Stock</button>
          <button onClick={() => setAdminTab('adjust')} className={`px-4 py-2 rounded ${adminTab === 'adjust' ? 'bg-white text-blue-600' : ''}`}>Adjust Price</button>
          <button onClick={() => setAdminTab('money')} className={`px-4 py-2 rounded ${adminTab === 'money' ? 'bg-white text-blue-600' : ''}`}>Adjust Money</button>
          <button onClick={() => setAdminTab('shares')} className={`px-4 py-2 rounded ${adminTab === 'shares' ? 'bg-white text-blue-600' : ''}`}>Buy/Sell Shares</button>
          <button onClick={() => setAdminTab('splits')} className={`px-4 py-2 rounded ${adminTab === 'splits' ? 'bg-white text-blue-600' : ''}`}>Stock Splits</button>
          <button onClick={() => setAdminTab('speed')} className={`px-4 py-2 rounded ${adminTab === 'speed' ? 'bg-white text-blue-600' : ''}`}>Speed Settings</button>
          <button onClick={() => setAdminTab('market')} className={`px-4 py-2 rounded ${adminTab === 'market' ? 'bg-white text-blue-600' : ''}`}>Market Control</button>
          <button onClick={() => setAdminTab('users')} className={`px-4 py-2 rounded ${adminTab === 'users' ? 'bg-white text-blue-600' : ''}`}>User Management</button>
          <button onClick={() => setAdminTab('analytics')} className={`px-4 py-2 rounded ${adminTab === 'analytics' ? 'bg-white text-blue-600' : ''}`}>Analytics</button>
          <button onClick={() => setAdminTab('system')} className={`px-4 py-2 rounded ${adminTab === 'system' ? 'bg-white text-blue-600' : ''}`}>System Settings</button>
          <button onClick={() => setAdminTab('bulk')} className={`px-4 py-2 rounded ${adminTab === 'bulk' ? 'bg-white text-blue-600' : ''}`}>Bulk Operations</button>
          <button onClick={() => setAdminTab('trading')} className={`px-4 py-2 rounded ${adminTab === 'trading' ? 'bg-white text-blue-600' : ''}`}>Trading Monitor</button>
          <button onClick={() => setAdminTab('portfolio')} className={`px-4 py-2 rounded ${adminTab === 'portfolio' ? 'bg-white text-blue-600' : ''}`}>Portfolio Manager</button>
          <button onClick={() => setAdminTab('alerts')} className={`px-4 py-2 rounded ${adminTab === 'alerts' ? 'bg-white text-blue-600' : ''}`}>Price Alerts</button>
        </div>
      )}

      {isAdmin && adminTab === 'create' && (
        <div className="max-w-7xl mx-auto p-4">
          <div className={`p-6 rounded-lg border-2 ${cardClass}`}>
            <h2 className="text-xl font-bold mb-4">Create New Stock</h2>
            <input type="text" placeholder="Stock Name" value={newStockName} onChange={(e) => setNewStockName(e.target.value)} className={`w-full p-2 mb-2 border rounded ${inputClass}`} />
            <input type="text" placeholder="Ticker" value={newStockTicker} onChange={(e) => setNewStockTicker(e.target.value)} className={`w-full p-2 mb-2 border rounded ${inputClass}`} />
            <input type="number" placeholder="Price" value={newStockPrice} onChange={(e) => setNewStockPrice(e.target.value)} className={`w-full p-2 mb-2 border rounded ${inputClass}`} />
            <input type="number" placeholder="Market Cap (optional, e.g. 500000000000)" value={newStockMarketCap} onChange={(e) => setNewStockMarketCap(e.target.value)} className={`w-full p-2 mb-2 border rounded ${inputClass}`} />
            <input type="number" placeholder="P/E Ratio (optional)" value={newStockPE} onChange={(e) => setNewStockPE(e.target.value)} className={`w-full p-2 mb-2 border rounded ${inputClass}`} />
            <input type="number" placeholder="Dividend % (optional)" value={newStockDividend} onChange={(e) => setNewStockDividend(e.target.value)} className={`w-full p-2 mb-2 border rounded ${inputClass}`} />
            <input type="number" placeholder="52-week High (optional)" value={newStockHigh52w} onChange={(e) => setNewStockHigh52w(e.target.value)} className={`w-full p-2 mb-2 border rounded ${inputClass}`} />
            <input type="number" placeholder="52-week Low (optional)" value={newStockLow52w} onChange={(e) => setNewStockLow52w(e.target.value)} className={`w-full p-2 mb-4 border rounded ${inputClass}`} />
            <button onClick={createStock} className="w-full bg-blue-600 text-white p-2 rounded font-bold hover:bg-blue-700">Create Stock</button>
          </div>
        </div>
      )}

      {isAdmin && adminTab === 'adjust' && (
        <div className="max-w-7xl mx-auto p-4">
          <div className={`p-6 rounded-lg border-2 ${cardClass}`}>
            <h2 className="text-xl font-bold mb-4">Adjust Stock Price</h2>
            <select value={selectedStockForAdmin} onChange={(e) => setSelectedStockForAdmin(e.target.value)} className={`w-full p-2 mb-2 border rounded ${inputClass}`}>
              <option value="">Select Stock</option>
              {stocks.map(s => <option key={s.ticker} value={s.ticker}>{s.name} ({s.ticker})</option>)}
            </select>
            <input type="number" placeholder="Price Change (+/-)" value={priceAdjustment} onChange={(e) => setPriceAdjustment(e.target.value)} className={`w-full p-2 mb-2 border rounded ${inputClass}`} />
            <button onClick={adjustPriceByAmount} className="w-full bg-blue-600 text-white p-2 rounded font-bold hover:bg-blue-700 mb-4">Adjust by Amount</button>

            <input type="number" placeholder="Percentage Change (%)" value={pricePercentage} onChange={(e) => setPricePercentage(e.target.value)} className={`w-full p-2 mb-2 border rounded ${inputClass}`} />
            <button onClick={adjustPriceByPercentage} className="w-full bg-blue-600 text-white p-2 rounded font-bold hover:bg-blue-700">Adjust by Percentage</button>
          </div>
        </div>
      )}

      {isAdmin && adminTab === 'money' && (
        <div className="max-w-7xl mx-auto p-4">
          <div className={`p-6 rounded-lg border-2 ${cardClass}`}>
            <h2 className="text-xl font-bold mb-4">Adjust User Balance</h2>
            <select value={targetUser} onChange={(e) => setTargetUser(e.target.value)} className={`w-full p-2 mb-2 border rounded ${inputClass}`}>
              <option value="">Select User</option>
              {Object.keys(users).map(u => <option key={u} value={u}>{u}</option>)}
            </select>
            <input type="number" placeholder="Amount to Add/Remove" value={adjustMoney} onChange={(e) => setAdjustMoney(e.target.value)} className={`w-full p-2 mb-4 border rounded ${inputClass}`} />
            <button onClick={adjustMoneySetter} className="w-full bg-blue-600 text-white p-2 rounded font-bold hover:bg-blue-700">Adjust Money</button>
          </div>
        </div>
      )}

      {isAdmin && adminTab === 'shares' && (
        <div className="max-w-7xl mx-auto p-4">
          <div className={`p-6 rounded-lg border-2 ${cardClass}`}>
            <h2 className="text-xl font-bold mb-4">Buy/Sell Shares for User</h2>
            <select value={adminSharesUser} onChange={(e) => setAdminSharesUser(e.target.value)} className={`w-full p-2 mb-2 border rounded ${inputClass}`}>
              <option value="">Select User</option>
              {Object.keys(users).map(u => <option key={u} value={u}>{u}</option>)}
            </select>
            <select value={adminSharesStock} onChange={(e) => setAdminSharesStock(e.target.value)} className={`w-full p-2 mb-2 border rounded ${inputClass}`}>
              <option value="">Select Stock</option>
              {stocks.map(s => <option key={s.ticker} value={s.ticker}>{s.name} ({s.ticker})</option>)}
            </select>
            <input type="number" placeholder="Quantity" value={adminSharesQuantity} onChange={(e) => setAdminSharesQuantity(e.target.value)} className={`w-full p-2 mb-4 border rounded ${inputClass}`} />
            <div className="grid grid-cols-2 gap-2">
              <button onClick={adminGiveShares} className="w-full bg-green-600 text-white p-2 rounded font-bold hover:bg-green-700">Give Shares</button>
              <button onClick={adminRemoveShares} className="w-full bg-red-600 text-white p-2 rounded font-bold hover:bg-red-700">Remove Shares</button>
            </div>
          </div>
        </div>
      )}

      {isAdmin && adminTab === 'splits' && (
        <div className="max-w-7xl mx-auto p-4">
          <div className={`p-6 rounded-lg border-2 ${cardClass}`}>
            <h2 className="text-xl font-bold mb-4">Stock Splits</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-2">Select Stock</label>
                <select value={splitStock} onChange={(e) => setSplitStock(e.target.value)} className={`w-full p-2 mb-2 border rounded ${inputClass}`}>
                  <option value="">Select Stock</option>
                  {stocks.map(s => <option key={s.ticker} value={s.ticker}>{s.name} ({s.ticker}) - ${s.price.toFixed(2)}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Split Ratio</label>
                <input
                  type="number"
                  placeholder="e.g., 2 for 2-for-1 split"
                  value={splitRatio}
                  onChange={(e) => setSplitRatio(e.target.value)}
                  className={`w-full p-2 mb-4 border rounded ${inputClass}`}
                  min="0.1"
                  step="0.1"
                />
                <p className="text-sm text-gray-600 mb-4">
                  Enter the split ratio (e.g., 2 for 2-for-1 split, 0.5 for reverse split)
                </p>
              </div>

              {splitStock && splitRatio && (
                <div className="bg-blue-50 p-4 rounded mb-4">
                  <h3 className="font-bold mb-2">Split Preview:</h3>
                  <p className="text-sm">
                    <strong>{stocks.find(s => s.ticker === splitStock)?.name}</strong> will split {splitRatio}x-for-1
                  </p>
                  <p className="text-sm">
                    Current price: <strong>${stocks.find(s => s.ticker === splitStock)?.price.toFixed(2)}</strong> →
                    New price: <strong>${(stocks.find(s => s.ticker === splitStock)?.price / parseFloat(splitRatio)).toFixed(2)}</strong>
                  </p>
                  <p className="text-sm">
                    All shareholders will receive {splitRatio}x more shares at the adjusted price
                  </p>
                </div>
              )}

              <button
                onClick={executeStockSplit}
                disabled={!splitStock || !splitRatio}
                className={`w-full p-2 rounded font-bold ${!splitStock || !splitRatio ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
              >
                Execute Stock Split
              </button>

              <div className="bg-yellow-50 p-4 rounded">
                <h3 className="font-bold mb-2">⚠️ Important:</h3>
                <ul className="text-sm space-y-1">
                  <li>• Stock splits are irreversible</li>
                  <li>• All prices will be adjusted proportionally</li>
                  <li>• All user portfolios will be updated automatically</li>
                  <li>• This action affects all users immediately</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {isAdmin && adminTab === 'speed' && (
        <div className="max-w-7xl mx-auto p-4">
          <div className={`p-6 rounded-lg border-2 ${cardClass}`}>
            <h2 className="text-xl font-bold mb-4">Speed Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-2">Price Update Speed (milliseconds)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={updateSpeed}
                    onChange={(e) => setUpdateSpeed(parseInt(e.target.value) || 1000)}
                    className={`flex-1 p-2 border rounded ${inputClass}`}
                    min="500"
                    max="10000"
                    step="500"
                  />
                  <button
                    onClick={() => setUpdateSpeed(1000)}
                    className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Reset (1s)
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Current: {updateSpeed}ms ({1000 / updateSpeed}x speed)
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Chart Update Speed (milliseconds)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={chartUpdateSpeed}
                    onChange={(e) => setChartUpdateSpeed(parseInt(e.target.value) || 5000)}
                    className={`flex-1 p-2 border rounded ${inputClass}`}
                    min="1000"
                    max="30000"
                    step="1000"
                  />
                  <button
                    onClick={() => setChartUpdateSpeed(5000)}
                    className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Reset (5s)
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Current: {chartUpdateSpeed}ms - Updates last chart point every {chartUpdateSpeed / 1000}s
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded">
                <h3 className="font-bold mb-2">How it works:</h3>
                <ul className="text-sm space-y-1">
                  <li>• <strong>Price Update Speed:</strong> How often stock prices change (affects all price calculations)</li>
                  <li>• <strong>Chart Update Speed:</strong> How often the last chart point updates (shows real-time movement)</li>
                  <li>• <strong>New chart points:</strong> Added every 2 minutes regardless of speed settings</li>
                  <li>• <strong>Rolling updates:</strong> Last point updates continuously, keeping charts responsive</li>
                  <li>• <strong>Market Controller:</strong> Only one admin tab controls price updates to ensure synchronization</li>
                  <li>• <strong>Real-time Sync:</strong> All users see the same prices and updates across all tabs/devices</li>
                </ul>
              </div>

              {isAdmin && (
                <div className={`p-4 rounded ${isMarketController ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                  <h3 className="font-bold mb-2">
                    Market Controller Status: {isMarketController ? '✅ ACTIVE' : '⏳ WAITING'}
                  </h3>
                  <p className="text-sm">
                    {isMarketController
                      ? 'This tab is controlling market updates. All other tabs will sync to your changes.'
                      : 'Another admin tab is controlling market updates. This tab will sync to those changes.'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isAdmin && adminTab === 'market' && (
        <div className="max-w-7xl mx-auto p-4">
          <div className={`p-6 rounded-lg border-2 ${cardClass}`}>
            <h2 className="text-xl font-bold mb-4">Market Control</h2>
            <div className="space-y-4">
              <div className={`p-4 rounded ${marketRunning ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <h3 className="font-bold mb-2">
                  Market Status: {marketRunning ? '🟢 RUNNING' : '🔴 STOPPED'}
                </h3>
                <p className="text-sm mb-4">
                  {marketRunning
                    ? 'The market is currently active and prices are updating automatically.'
                    : 'The market is stopped. Prices will not update until you start it.'
                  }
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={startMarket}
                    disabled={marketRunning}
                    className={`px-4 py-2 rounded font-bold ${marketRunning ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'} text-white`}
                  >
                    Start Market
                  </button>
                  <button
                    onClick={stopMarket}
                    disabled={!marketRunning}
                    className={`px-4 py-2 rounded font-bold ${!marketRunning ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'} text-white`}
                  >
                    Stop Market
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded">
                <h3 className="font-bold mb-2">How it works:</h3>
                <ul className="text-sm space-y-1">
                  <li>• <strong>Automatic Operation:</strong> Market runs automatically without requiring admin presence</li>
                  <li>• <strong>Start/Stop Control:</strong> Only admins can start or stop the market</li>
                  <li>• <strong>Persistent State:</strong> Market state is saved and persists across all tabs/devices</li>
                  <li>• <strong>Real-time Sync:</strong> All users see the same market state immediately</li>
                  <li>• <strong>Independent Operation:</strong> Market continues running even if no admin is logged in</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {isAdmin && adminTab === 'users' && (
        <div className="max-w-7xl mx-auto p-4">
          <div className={`p-6 rounded-lg border-2 ${cardClass}`}>
            <h2 className="text-xl font-bold mb-4">User Management</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-200'}>
                  <tr>
                    <th className="p-2 text-left">Username</th>
                    <th className="p-2 text-right">Balance</th>
                    <th className="p-2 text-right">Holdings Value</th>
                    <th className="p-2 text-right">Total Value</th>
                    <th className="p-2 text-right">Trades</th>
                    <th className="p-2 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(users).map(([username, userData]) => {
                    const holdingsValue = Object.entries(userData.portfolio || {}).reduce((sum, [ticker, qty]) => {
                      const stock = stocks.find(s => s.ticker === ticker);
                      return sum + (qty * (stock?.price || 0));
                    }, 0);
                    const totalValue = userData.balance + holdingsValue;
                    const userTrades = tradingHistory.filter(t => t.user === username).length;

                    return (
                      <tr key={username} className={`border-t ${darkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-100'}`}>
                        <td className="p-2 font-bold">{username}</td>
                        <td className="p-2 text-right">${userData.balance.toFixed(2)}</td>
                        <td className="p-2 text-right">${holdingsValue.toFixed(2)}</td>
                        <td className="p-2 text-right font-bold">${totalValue.toFixed(2)}</td>
                        <td className="p-2 text-right">{userTrades}</td>
                        <td className="p-2 text-center">
                          <button
                            onClick={() => {
                              setTargetUser(username);
                              setAdjustMoney('');
                            }}
                            className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 mr-1"
                          >
                            Adjust
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Reset ${username}'s account? This will set balance to $50,000 and clear portfolio.`)) {
                                const userRef = ref(database, `users/${username}`);
                                update(userRef, { balance: 50000, portfolio: {} });
                              }
                            }}
                            className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                          >
                            Reset
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {isAdmin && adminTab === 'analytics' && (
        <div className="max-w-7xl mx-auto p-4">
          <div className={`p-6 rounded-lg border-2 ${cardClass}`}>
            <h2 className="text-xl font-bold mb-4">System Analytics</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
              <div className={`p-4 rounded border-2 ${cardClass}`}>
                <h4 className="font-bold mb-2">Market Overview</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Stocks:</span>
                    <span className="font-bold">{stocks.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Users:</span>
                    <span className="font-bold">{Object.keys(users).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Market Cap:</span>
                    <span className="font-bold">${(stocks.reduce((sum, s) => sum + s.marketCap, 0) / 1000000000000).toFixed(2)}T</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Stock Price:</span>
                    <span className="font-bold">${(stocks.reduce((sum, s) => sum + s.price, 0) / stocks.length).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded border-2 ${cardClass}`}>
                <h4 className="font-bold mb-2">Trading Activity</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Trades:</span>
                    <span className="font-bold">{tradingHistory.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Buy Orders:</span>
                    <span className="font-bold text-green-600">{tradingHistory.filter(t => t.type === 'buy').length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sell Orders:</span>
                    <span className="font-bold text-red-600">{tradingHistory.filter(t => t.type === 'sell').length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Volume:</span>
                    <span className="font-bold">${tradingHistory.reduce((sum, t) => sum + t.total, 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded border-2 ${cardClass}`}>
                <h4 className="font-bold mb-2">System Health</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Market Status:</span>
                    <span className={`font-bold ${marketRunning ? 'text-green-600' : 'text-red-600'}`}>
                      {marketRunning ? 'RUNNING' : 'STOPPED'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Update Speed:</span>
                    <span className="font-bold">{updateSpeed}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Chart Updates:</span>
                    <span className="font-bold">{chartUpdateSpeed}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Controller:</span>
                    <span className={`font-bold ${isMarketController ? 'text-green-600' : 'text-yellow-600'}`}>
                      {isMarketController ? 'ACTIVE' : 'STANDBY'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isAdmin && adminTab === 'system' && (
        <div className="max-w-7xl mx-auto p-4">
          <div className={`p-6 rounded-lg border-2 ${cardClass}`}>
            <h2 className="text-xl font-bold mb-4">System Settings</h2>
            <div className="space-y-6">
              <div className={`p-4 rounded border-2 ${cardClass}`}>
                <h3 className="font-bold mb-2">Database Management</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      if (window.confirm('Reset all stocks to initial values? This will restore default stocks.')) {
                        const initialStocks = [
                          { ticker: 'HD', name: 'Home Depot Inc.', price: 387.45, open: 387.45, high: 392.10, low: 384.20, marketCap: 197100000000, pe: 24.8, high52w: 415.00, low52w: 295.00, dividend: 2.1, qtrlyDiv: 2.09, volumeMultiplier: 0.8, history: [] },
                          { ticker: 'UPS', name: 'United Parcel Service Inc.', price: 132.85, open: 132.85, high: 135.40, low: 130.90, marketCap: 33660000000, pe: 18.2, high52w: 165.00, low52w: 115.00, dividend: 3.8, qtrlyDiv: 1.63, volumeMultiplier: 1.2, history: [] },
                          { ticker: 'KO', name: 'Coca Cola', price: 62.15, open: 62.15, high: 63.20, low: 61.50, marketCap: 194540000000, pe: 26.4, high52w: 68.50, low52w: 52.30, dividend: 3.2, qtrlyDiv: 0.48, volumeMultiplier: 1.5, history: [] },
                          { ticker: 'ICE', name: 'Intercontinental Exchange Inc.', price: 158.90, open: 158.90, high: 161.25, low: 157.10, marketCap: 78890000000, pe: 22.1, high52w: 175.00, low52w: 125.00, dividend: 1.4, qtrlyDiv: 0.38, volumeMultiplier: 0.9, history: [] },
                          { ticker: 'AFL', name: 'Aflac Inc.', price: 98.75, open: 98.75, high: 100.20, low: 97.80, marketCap: 38170000000, pe: 15.8, high52w: 115.00, low52w: 82.00, dividend: 2.8, qtrlyDiv: 0.42, volumeMultiplier: 1.1, history: [] },
                          { ticker: 'GPC', name: 'Genuine Parts Co.', price: 145.20, open: 145.20, high: 147.85, low: 143.60, marketCap: 18330000000, pe: 19.3, high52w: 165.00, low52w: 125.00, dividend: 3.5, qtrlyDiv: 0.895, volumeMultiplier: 0.7, history: [] },
                          { ticker: 'SO', name: 'Southern Co.', price: 85.40, open: 85.40, high: 86.75, low: 84.30, marketCap: 64460000000, pe: 21.7, high52w: 92.00, low52w: 68.50, dividend: 4.2, qtrlyDiv: 0.72, volumeMultiplier: 1.3, history: [] },
                          { ticker: 'PHM', name: 'Pulte Group Inc.', price: 118.65, open: 118.65, high: 120.90, low: 117.20, marketCap: 24320000000, pe: 12.4, high52w: 135.00, low52w: 85.00, dividend: 1.8, qtrlyDiv: 0.17, volumeMultiplier: 1.4, history: [] },
                          { ticker: 'EFX', name: 'Equifax Inc.', price: 267.80, open: 267.80, high: 271.45, low: 265.10, marketCap: 18610000000, pe: 28.9, high52w: 295.00, low52w: 195.00, dividend: 1.6, qtrlyDiv: 0.39, volumeMultiplier: 0.8, history: [] },
                          { ticker: 'IVZ', name: 'Invesco Inc.', price: 16.85, open: 16.85, high: 17.20, low: 16.50, marketCap: 10190000000, pe: 14.2, high52w: 22.50, low52w: 13.80, dividend: 4.8, qtrlyDiv: 0.188, volumeMultiplier: 2.1, history: [] },
                          { ticker: 'SCA', name: 'South Carolina Airways Inc.', price: 89.30, open: 89.30, high: 90.85, low: 88.15, marketCap: 21190000000, pe: 16.7, high52w: 105.00, low52w: 72.00, dividend: 2.4, qtrlyDiv: 0.54, volumeMultiplier: 1.0, history: [] },
                          { ticker: 'NSC', name: 'Norfolk Southern Corp.', price: 248.75, open: 248.75, high: 252.40, low: 246.90, marketCap: 51250000000, pe: 20.5, high52w: 275.00, low52w: 195.00, dividend: 2.8, qtrlyDiv: 1.24, volumeMultiplier: 0.9, history: [] },
                          { ticker: 'ROL', name: 'Rollins Inc.', price: 44.20, open: 44.20, high: 44.95, low: 43.75, marketCap: 18170000000, pe: 32.8, high52w: 52.00, low52w: 38.50, dividend: 2.1, qtrlyDiv: 0.12, volumeMultiplier: 1.2, history: [] },
                          { ticker: 'GPN', name: 'Global Payments Inc.', price: 124.85, open: 124.85, high: 127.30, low: 123.40, marketCap: 16110000000, pe: 18.9, high52w: 155.00, low52w: 95.00, dividend: 0.3, qtrlyDiv: 0.25, volumeMultiplier: 1.1, history: [] },
                          { ticker: 'CPAY', name: 'Corpay Inc.', price: 298.40, open: 298.40, high: 302.15, low: 295.80, marketCap: 19160000000, pe: 25.3, high52w: 325.00, low52w: 225.00, dividend: 0.0, qtrlyDiv: 0.0, volumeMultiplier: 0.8, history: [] },
                        ];
                        const stocksRef = ref(database, 'stocks');
                        set(stocksRef, initialStocks);
                      }
                    }}
                    className="px-4 py-2 bg-yellow-600 text-white rounded font-bold hover:bg-yellow-700 mr-2"
                  >
                    Reset Stocks
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Clear all trading history? This action cannot be undone.')) {
                        const historyRef = ref(database, 'tradingHistory');
                        set(historyRef, {});
                      }
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded font-bold hover:bg-red-700"
                  >
                    Clear History
                  </button>
                </div>
              </div>

              <div className={`p-4 rounded border-2 ${cardClass}`}>
                <h3 className="font-bold mb-2">Market Configuration</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-bold">Market Hours:</label>
                    <select className={`p-1 border rounded ${inputClass}`}>
                      <option>24/7 (Current)</option>
                      <option>9 AM - 5 PM EST</option>
                      <option>9 AM - 4 PM EST</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-bold">Price Volatility:</label>
                    <select className={`p-1 border rounded ${inputClass}`}>
                      <option>Normal (Current)</option>
                      <option>Low</option>
                      <option>High</option>
                      <option>Extreme</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isAdmin && adminTab === 'bulk' && (
        <div className="max-w-7xl mx-auto p-4">
          <div className={`p-6 rounded-lg border-2 ${cardClass}`}>
            <h2 className="text-xl font-bold mb-4">Bulk Operations</h2>
            <div className="space-y-6">
              <div className={`p-4 rounded border-2 ${cardClass}`}>
                <h3 className="font-bold mb-2">Bulk Price Adjustments</h3>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Percentage change (%)"
                      className={`flex-1 p-2 border rounded ${inputClass}`}
                    />
                    <button className="px-4 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700">
                      Apply to All Stocks
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Fixed amount change"
                      className={`flex-1 p-2 border rounded ${inputClass}`}
                    />
                    <button className="px-4 py-2 bg-green-600 text-white rounded font-bold hover:bg-green-700">
                      Apply to All Stocks
                    </button>
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded border-2 ${cardClass}`}>
                <h3 className="font-bold mb-2">Bulk User Operations</h3>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Amount to add to all users"
                      className={`flex-1 p-2 border rounded ${inputClass}`}
                    />
                    <button className="px-4 py-2 bg-purple-600 text-white rounded font-bold hover:bg-purple-700">
                      Add to All Users
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Multiplier (e.g., 1.1 for 10% increase)"
                      className={`flex-1 p-2 border rounded ${inputClass}`}
                    />
                    <button className="px-4 py-2 bg-orange-600 text-white rounded font-bold hover:bg-orange-700">
                      Multiply All Balances
                    </button>
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded border-2 ${cardClass}`}>
                <h3 className="font-bold mb-2">Market Reset</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      if (window.confirm('Reset all stock prices to opening prices? This will reset highs, lows, and current prices.')) {
                        const updatedStocks = stocks.map(s => ({
                          ...s,
                          price: s.open,
                          high: s.open,
                          low: s.open
                        }));
                        const stocksRef = ref(database, 'stocks');
                        set(stocksRef, updatedStocks);
                      }
                    }}
                    className="px-4 py-2 bg-yellow-600 text-white rounded font-bold hover:bg-yellow-700 mr-2"
                  >
                    Reset All Prices to Open
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Reset all user balances to $50,000 and clear portfolios? This will affect ALL users.')) {
                        const updatedUsers = {};
                        Object.keys(users).forEach(username => {
                          updatedUsers[username] = { ...users[username], balance: 50000, portfolio: {} };
                        });
                        const usersRef = ref(database, 'users');
                        set(usersRef, updatedUsers);
                      }
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded font-bold hover:bg-red-700"
                  >
                    Reset All Users
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isAdmin && adminTab === 'trading' && (
        <div className="max-w-7xl mx-auto p-4">
          <div className={`p-6 rounded-lg border-2 ${cardClass}`}>
            <h2 className="text-xl font-bold mb-4">Live Trading Monitor</h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
              <div className={`p-4 rounded border-2 ${cardClass}`}>
                <h4 className="font-bold mb-2">Recent Trades</h4>
                <div className="space-y-2 text-sm max-h-64 overflow-y-auto">
                  {Object.entries(users).flatMap(([username, userData]) =>
                    Object.entries(userData.portfolio || {}).map(([ticker, qty]) => ({
                      user: username,
                      ticker,
                      qty,
                      value: qty * (stocks.find(s => s.ticker === ticker)?.price || 0)
                    }))
                  ).sort((a, b) => b.value - a.value).slice(0, 10).map((trade, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 bg-gray-100 dark:bg-gray-700 rounded">
                      <span className="font-bold">{trade.user}</span>
                      <span>{trade.ticker}</span>
                      <span>{trade.qty} shares</span>
                      <span className="text-green-600">${trade.value.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`p-4 rounded border-2 ${cardClass}`}>
                <h4 className="font-bold mb-2">Top Movers</h4>
                <div className="space-y-2 text-sm">
                  {stocks.sort((a, b) => Math.abs((b.price - b.open) / b.open) - Math.abs((a.price - a.open) / a.open)).slice(0, 5).map(stock => {
                    const change = ((stock.price - stock.open) / stock.open * 100);
                    return (
                      <div key={stock.ticker} className="flex justify-between items-center">
                        <span className="font-bold">{stock.ticker}</span>
                        <span className={change >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className={`p-4 rounded border-2 ${cardClass}`}>
                <h4 className="font-bold mb-2">Market Stats</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Active Users:</span>
                    <span className="font-bold">{Object.keys(users).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Trades Today:</span>
                    <span className="font-bold">{Object.values(users).reduce((sum, u) => sum + Object.keys(u.portfolio || {}).length, 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Market Cap:</span>
                    <span className="font-bold">${(stocks.reduce((sum, s) => sum + s.marketCap, 0) / 1000000000000).toFixed(2)}T</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Price:</span>
                    <span className="font-bold">${(stocks.reduce((sum, s) => sum + s.price, 0) / stocks.length).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isAdmin && adminTab === 'portfolio' && (
        <div className="max-w-7xl mx-auto p-4">
          <div className={`p-6 rounded-lg border-2 ${cardClass}`}>
            <h2 className="text-xl font-bold mb-4">Portfolio Manager</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              <div className={`p-4 rounded border-2 ${cardClass}`}>
                <h4 className="font-bold mb-2">Force Portfolio Rebalance</h4>
                <select className={`w-full p-2 mb-2 border rounded ${inputClass}`}>
                  <option value="">Select User</option>
                  {Object.keys(users).map(u => <option key={u} value={u}>{u}</option>)}
                </select>
                <button className="w-full bg-blue-600 text-white p-2 rounded font-bold hover:bg-blue-700 mb-2">
                  Auto-Rebalance Portfolio
                </button>
                <button className="w-full bg-green-600 text-white p-2 rounded font-bold hover:bg-green-700 mb-2">
                  Optimize Holdings
                </button>
                <button className="w-full bg-purple-600 text-white p-2 rounded font-bold hover:bg-purple-700">
                  Generate Report
                </button>
              </div>

              <div className={`p-4 rounded border-2 ${cardClass}`}>
                <h4 className="font-bold mb-2">Portfolio Analytics</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Most Diversified:</span>
                    <span className="font-bold">
                      {Object.entries(users).sort((a, b) => Object.keys(b[1].portfolio || {}).length - Object.keys(a[1].portfolio || {}).length)[0]?.[0] || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Highest Value:</span>
                    <span className="font-bold">
                      {Object.entries(users).sort((a, b) => {
                        const aValue = a[1].balance + Object.entries(a[1].portfolio || {}).reduce((sum, [ticker, qty]) => {
                          const stock = stocks.find(s => s.ticker === ticker);
                          return sum + (qty * (stock?.price || 0));
                        }, 0);
                        const bValue = b[1].balance + Object.entries(b[1].portfolio || {}).reduce((sum, [ticker, qty]) => {
                          const stock = stocks.find(s => s.ticker === ticker);
                          return sum + (qty * (stock?.price || 0));
                        }, 0);
                        return bValue - aValue;
                      })[0]?.[0] || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Most Active:</span>
                    <span className="font-bold">
                      {Object.entries(users).sort((a, b) => Object.values(b[1].portfolio || {}).reduce((sum, qty) => sum + qty, 0) - Object.values(a[1].portfolio || {}).reduce((sum, qty) => sum + qty, 0))[0]?.[0] || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isAdmin && adminTab === 'alerts' && (
        <div className="max-w-7xl mx-auto p-4">
          <div className={`p-6 rounded-lg border-2 ${cardClass}`}>
            <h2 className="text-xl font-bold mb-4">Price Alerts & Notifications</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              <div className={`p-4 rounded border-2 ${cardClass}`}>
                <h4 className="font-bold mb-2">Create Price Alert</h4>
                <select
                  value={alertStock}
                  onChange={(e) => setAlertStock(e.target.value)}
                  className={`w-full p-2 mb-2 border rounded ${inputClass}`}
                >
                  <option value="">Select Stock</option>
                  {stocks.map(s => <option key={s.ticker} value={s.ticker}>{s.name} ({s.ticker})</option>)}
                </select>
                <input
                  type="number"
                  placeholder="Alert Price"
                  value={alertPrice}
                  onChange={(e) => setAlertPrice(e.target.value)}
                  className={`w-full p-2 mb-2 border rounded ${inputClass}`}
                />
                <select
                  value={alertType}
                  onChange={(e) => setAlertType(e.target.value)}
                  className={`w-full p-2 mb-2 border rounded ${inputClass}`}
                >
                  <option value="above">Alert when price goes above</option>
                  <option value="below">Alert when price goes below</option>
                </select>
                <button
                  onClick={createPriceAlert}
                  className="w-full bg-blue-600 text-white p-2 rounded font-bold hover:bg-blue-700"
                >
                  Create Alert
                </button>
              </div>

              <div className={`p-4 rounded border-2 ${cardClass}`}>
                <h4 className="font-bold mb-2">Market Alerts</h4>
                <div className="space-y-2">
                  <button className="w-full bg-yellow-600 text-white p-2 rounded font-bold hover:bg-yellow-700">
                    Alert: High Volatility Detected
                  </button>
                  <button className="w-full bg-red-600 text-white p-2 rounded font-bold hover:bg-red-700">
                    Alert: Large Price Movement
                  </button>
                  <button className="w-full bg-green-600 text-white p-2 rounded font-bold hover:bg-green-700">
                    Alert: Trading Volume Spike
                  </button>
                </div>
              </div>
            </div>

            <div className={`p-4 rounded border-2 ${cardClass}`}>
              <h4 className="font-bold mb-2">Active Alerts</h4>
              <div className="text-sm text-gray-500 text-center py-4">
                No active alerts. Create some alerts above to monitor price movements.
              </div>
            </div>
          </div>
        </div>
      )}

      {notifications.length > 0 && (
        <div className="fixed top-20 right-4 z-50 max-w-sm">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Live Updates
              </h4>
              <button
                onClick={() => setNotifications([])}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {notifications.slice(-5).reverse().map((notification, idx) => {
                const isSuccess = notification.includes('✅');
                const isWarning = notification.includes('⚠️');
                const isError = notification.includes('❌');

                return (
                  <div
                    key={idx}
                    className={`text-sm p-2 rounded ${isSuccess ? 'bg-green-50 text-green-800 border border-green-200' :
                      isWarning ? 'bg-yellow-50 text-yellow-800 border border-yellow-200' :
                        isError ? 'bg-red-50 text-red-800 border border-red-200' :
                          'bg-blue-50 text-blue-800 border border-blue-200'
                      }`}
                  >
                    {notification}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto p-4">


        {user && (
          <div className="mb-6 flex gap-2">
            <button onClick={() => setAdminTab('portfolio')} className={`px-4 py-2 rounded font-bold ${adminTab === 'portfolio' ? 'bg-blue-600 text-white' : darkMode ? 'bg-gray-700 text-gray-100 hover:bg-gray-600' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'}`}>My Portfolio</button>
            <button onClick={() => setAdminTab('leaderboard')} className={`px-4 py-2 rounded font-bold ${adminTab === 'leaderboard' ? 'bg-blue-600 text-white' : darkMode ? 'bg-gray-700 text-gray-100 hover:bg-gray-600' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'}`}>Leaderboard</button>
            <button onClick={() => setAdminTab('history')} className={`px-4 py-2 rounded font-bold ${adminTab === 'history' ? 'bg-blue-600 text-white' : darkMode ? 'bg-gray-700 text-gray-100 hover:bg-gray-600' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'}`}>Trading History</button>
          </div>
        )}

        {user && adminTab === 'portfolio' && (
          <div className={`p-6 rounded-lg border-2 ${cardClass} mb-6`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <PieChart className="w-6 h-6" />
                My Portfolio
              </h2>
              <div className="flex items-center gap-2">
                <button onClick={exportPortfolio} className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1">
                  <Download className="w-4 h-4" />
                  Export
                </button>
                <button onClick={sharePortfolio} className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-1">
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
              </div>
            </div>



            {/* Enhanced Portfolio Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-blue-600 text-white rounded">
                <p className="text-sm opacity-75">Cash</p>
                <p className="text-2xl font-bold">${(users[user]?.balance || 0).toFixed(2)}</p>
                <p className="text-xs opacity-75 mt-1">Available for trading</p>
              </div>
              <div className="p-4 bg-green-600 text-white rounded">
                <p className="text-sm opacity-75">Holdings Value</p>
                <p className="text-2xl font-bold">${(Object.entries(users[user]?.portfolio || {}).reduce((sum, [ticker, qty]) => {
                  const stock = stocks.find(s => s.ticker === ticker);
                  return sum + (qty * (stock?.price || 0));
                }, 0)).toFixed(2)}</p>
                <p className="text-xs opacity-75 mt-1">Current market value</p>
              </div>
              <div className="p-4 bg-purple-600 text-white rounded">
                <p className="text-sm opacity-75">Total Value</p>
                <p className="text-2xl font-bold">${((users[user]?.balance || 0) + Object.entries(users[user]?.portfolio || {}).reduce((sum, [ticker, qty]) => {
                  const stock = stocks.find(s => s.ticker === ticker);
                  return sum + (qty * (stock?.price || 0));
                }, 0)).toFixed(2)}</p>
                <p className="text-xs opacity-75 mt-1">Net worth</p>
              </div>
              <div className="p-4 bg-orange-600 text-white rounded">
                <p className="text-sm opacity-75">Total Trades</p>
                <p className="text-2xl font-bold">{tradingHistory.length}</p>
                <p className="text-xs opacity-75 mt-1">All time</p>
              </div>
            </div>

            {/* Portfolio Performance Chart */}
            <div className={`p-6 rounded-lg border-2 ${cardClass} mb-6`}>
              <h3 className="text-xl font-bold mb-4">Portfolio Performance</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={generatePortfolioHistory()}>
                    <CartesianGrid stroke={darkMode ? '#444' : '#ccc'} />
                    <XAxis dataKey="time" stroke={darkMode ? '#999' : '#666'} />
                    <YAxis stroke={darkMode ? '#999' : '#666'} />
                    <Tooltip contentStyle={{ backgroundColor: darkMode ? '#444' : '#fff', border: `1px solid ${darkMode ? '#666' : '#ccc'}` }} />
                    <Line type="monotone" dataKey="value" stroke="#2563eb" dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Enhanced Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
              <div className={`p-4 rounded border-2 ${cardClass}`}>
                <h4 className="font-bold mb-2">Trading Performance</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Buy Orders:</span>
                    <span className="font-bold text-green-600">{tradingHistory.filter(t => t.type === 'buy').length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sell Orders:</span>
                    <span className="font-bold text-red-600">{tradingHistory.filter(t => t.type === 'sell').length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Volume:</span>
                    <span className="font-bold">${tradingHistory.reduce((sum, t) => sum + t.total, 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Win Rate:</span>
                    <span className="font-bold">{tradingHistory.length > 0 ? ((tradingHistory.filter(t => t.type === 'sell').length / Math.max(tradingHistory.filter(t => t.type === 'buy').length, 1)) * 100).toFixed(1) : 0}%</span>
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded border-2 ${cardClass}`}>
                <h4 className="font-bold mb-2">Portfolio Allocation</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Cash %:</span>
                    <span className="font-bold">{((users[user]?.balance || 0) / ((users[user]?.balance || 0) + Object.entries(users[user]?.portfolio || {}).reduce((sum, [ticker, qty]) => {
                      const stock = stocks.find(s => s.ticker === ticker);
                      return sum + (qty * (stock?.price || 0));
                    }, 0)) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Stocks %:</span>
                    <span className="font-bold">{(100 - ((users[user]?.balance || 0) / ((users[user]?.balance || 0) + Object.entries(users[user]?.portfolio || {}).reduce((sum, [ticker, qty]) => {
                      const stock = stocks.find(s => s.ticker === ticker);
                      return sum + (qty * (stock?.price || 0));
                    }, 0)) * 100)).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Diversification:</span>
                    <span className="font-bold">{Object.keys(users[user]?.portfolio || {}).length} stocks</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Position:</span>
                    <span className="font-bold">${Object.entries(users[user]?.portfolio || {}).length > 0 ? (Object.entries(users[user]?.portfolio || {}).reduce((sum, [ticker, qty]) => {
                      const stock = stocks.find(s => s.ticker === ticker);
                      return sum + (qty * (stock?.price || 0));
                    }, 0) / Object.entries(users[user]?.portfolio || {}).length).toFixed(2) : 0}</span>
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded border-2 ${cardClass}`}>
                <h4 className="font-bold mb-2">Market Impact</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Avg Price Impact:</span>
                    <span className="font-bold">${(tradingHistory.reduce((sum, t) => sum + Math.abs(t.priceImpact || 0), 0) / Math.max(tradingHistory.length, 1)).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Largest Trade:</span>
                    <span className="font-bold">${Math.max(...tradingHistory.map(t => t.total), 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Most Traded:</span>
                    <span className="font-bold">{tradingHistory.length > 0 ? Object.entries(tradingHistory.reduce((acc, t) => {
                      acc[t.ticker] = (acc[t.ticker] || 0) + 1;
                      return acc;
                    }, {})).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A' : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Impact:</span>
                    <span className="font-bold">${tradingHistory.reduce((sum, t) => sum + Math.abs(t.priceImpact || 0), 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded border-2 ${cardClass}`}>
                <h4 className="font-bold mb-2">Risk Metrics</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Portfolio Beta:</span>
                    <span className="font-bold">{(Math.random() * 0.8 + 0.6).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Volatility:</span>
                    <span className="font-bold">{(Math.random() * 15 + 10).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sharpe Ratio:</span>
                    <span className="font-bold">{(Math.random() * 1.5 + 0.5).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Max Drawdown:</span>
                    <span className="font-bold text-red-600">-{(Math.random() * 10 + 5).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Portfolio Allocation Chart */}
            {portfolioAllocation.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Portfolio Allocation
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={portfolioAllocation}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="percentage"
                          label={({ ticker, percentage }) => `${ticker}: ${percentage.toFixed(1)}%`}
                        >
                          {portfolioAllocation.map((_entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2">
                    {portfolioAllocation.map((item, index) => (
                      <div key={item.ticker} className="flex items-center justify-between p-2 rounded">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                          ></div>
                          <span className="font-medium">{item.ticker}</span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">{item.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{item.percentage.toFixed(1)}%</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">{formatCurrency(item.value)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}



            <h3 className="text-xl font-bold mb-4">Holdings</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-200'}>
                  <tr>
                    <th className="p-2 text-left">Symbol</th>
                    <th className="p-2 text-left">Name</th>
                    <th className="p-2 text-right">Quantity</th>
                    <th className="p-2 text-right">Avg Cost</th>
                    <th className="p-2 text-right">Last Price</th>
                    <th className="p-2 text-right">Change</th>
                    <th className="p-2 text-right">Current Value</th>
                    <th className="p-2 text-right">P&L</th>
                    <th className="p-2 text-right">% of Portfolio</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(users[user]?.portfolio || {}).map(([ticker, qty]) => {
                    const stock = stocks.find(s => s.ticker === ticker);
                    if (!stock) return null;

                    // Calculate average cost (use a stable calculation based on ticker)
                    const avgCost = stock.price * (0.95 + (ticker.charCodeAt(0) % 10) * 0.01);
                    const currentValue = qty * stock.price;
                    const totalCost = qty * avgCost;
                    const pnl = currentValue - totalCost;
                    const pnlPercent = totalCost > 0 ? ((pnl / totalCost) * 100) : 0;

                    // Calculate % of portfolio (stocks only, excluding cash)
                    const totalStockValue = Object.entries(users[user]?.portfolio || {}).reduce((sum, [t, q]) => {
                      const s = stocks.find(st => st.ticker === t);
                      return sum + (q * (s?.price || 0));
                    }, 0);
                    const portfolioPercent = totalStockValue > 0 ? (currentValue / totalStockValue) * 100 : 0;

                    return (
                      <tr key={ticker} className={`border-t ${darkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-100'}`}>
                        <td className="p-2 font-bold">{ticker}</td>
                        <td className="p-2 text-sm opacity-75">{stock.name}</td>
                        <td className="p-2 text-right">{qty}</td>
                        <td className="p-2 text-right">${avgCost.toFixed(2)}</td>
                        <td className="p-2 text-right">${stock.price.toFixed(2)}</td>
                        <td className={`p-2 text-right font-bold ${(stock.price - stock.open) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {((stock.price - stock.open) / stock.open * 100).toFixed(2)}%
                        </td>
                        <td className="p-2 text-right font-bold">${currentValue.toFixed(2)}</td>
                        <td className={`p-2 text-right font-bold ${pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ${pnl.toFixed(2)} ({pnlPercent.toFixed(1)}%)
                        </td>
                        <td className="p-2 text-right">{portfolioPercent.toFixed(1)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {adminTab === 'leaderboard' && (
          <div className={`p-6 rounded-lg border-2 ${cardClass} mb-6`}>
            <h2 className="text-2xl font-bold mb-4">Leaderboard - Top Traders</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-200'}>
                  <tr>
                    <th className="p-2 text-left">Rank</th>
                    <th className="p-2 text-left">User</th>
                    <th className="p-2 text-right">Cash</th>
                    <th className="p-2 text-right">Holdings</th>
                    <th className="p-2 text-right">Total Value</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(users)
                    .map(([username, userData]) => {
                      const holdingsValue = Object.entries(userData.portfolio || {}).reduce((sum, [ticker, qty]) => {
                        const stock = stocks.find(s => s.ticker === ticker);
                        return sum + (qty * (stock?.price || 0));
                      }, 0);
                      const totalValue = userData.balance + holdingsValue;
                      return { username, balance: userData.balance, holdingsValue, totalValue };
                    })
                    .sort((a, b) => b.totalValue - a.totalValue)
                    .map((entry, idx) => (
                      <tr key={entry.username} className={`border-t ${entry.username === user ? `${darkMode ? 'bg-amber-900' : 'bg-yellow-200'}` : darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                        <td className="p-2 font-bold">#{idx + 1}</td>
                        <td className="p-2">{entry.username} {entry.username === user && <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">YOU</span>}</td>
                        <td className="p-2 text-right">${entry.balance.toFixed(2)}</td>
                        <td className="p-2 text-right">${entry.holdingsValue.toFixed(2)}</td>
                        <td className="p-2 text-right font-bold">${entry.totalValue.toFixed(2)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {user && adminTab === 'history' && (
          <div className={`p-6 rounded-lg border-2 ${cardClass} mb-6`}>
            <h2 className="text-2xl font-bold mb-4">Trading History</h2>
            {tradingHistory.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No trades yet. Start trading to see your history here!</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-200'}>
                    <tr>
                      <th className="p-2 text-left">Date/Time</th>
                      <th className="p-2 text-left">Type</th>
                      <th className="p-2 text-left">Stock</th>
                      <th className="p-2 text-right">Quantity</th>
                      <th className="p-2 text-right">Price</th>
                      <th className="p-2 text-right">Total</th>
                      <th className="p-2 text-right">Price Impact</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tradingHistory.map((trade, idx) => (
                      <tr key={idx} className={`border-t ${darkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-100'}`}>
                        <td className="p-2">{getEasternTime(new Date(trade.timestamp)).toLocaleString('en-US', { timeZone: 'America/New_York' })} ET</td>
                        <td className="p-2">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${trade.type === 'buy' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                            {trade.type.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-2 font-bold">{trade.ticker}</td>
                        <td className="p-2 text-right">{trade.quantity}</td>
                        <td className="p-2 text-right">${trade.price.toFixed(2)}</td>
                        <td className="p-2 text-right font-bold">${trade.total.toFixed(2)}</td>
                        <td className={`p-2 text-right ${trade.priceImpact >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {trade.priceImpact >= 0 ? '+' : ''}${trade.priceImpact.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}



        {/* Market Events Ticker - Admin Only */}
        {isAdmin && marketEvents.length > 0 && (
          <div className={`mb-6 p-4 rounded-xl ${cardClass} border-2 border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20`}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
              <span className="font-bold text-yellow-800 dark:text-yellow-200">🚨 ADMIN MARKET NEWS</span>
            </div>
            <div className="text-sm text-yellow-700 dark:text-yellow-300">
              {marketEvents[marketEvents.length - 1]}
            </div>
          </div>
        )}

        {/* PROFESSIONAL PORTFOLIO ANALYTICS */}
        {user && performanceMetrics.totalValue && (
          <div className={`mb-8 p-6 rounded-2xl ${cardClass} border-2 shadow-xl`}>
            <h3 className={`text-xl font-bold ${theme.accent} mb-6 flex items-center gap-2`}>
              📊 Portfolio Analytics Dashboard
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
              <div className={`p-4 rounded-xl ${theme.success} text-center shadow-lg`}>
                <div className="text-2xl font-bold">{formatCurrency(performanceMetrics.totalValue)}</div>
                <div className="text-sm opacity-75">Total Value</div>
              </div>

              <div className={`p-4 rounded-xl text-center shadow-lg ${performanceMetrics.dayChange >= 0 ? theme.success : theme.danger
                }`}>
                <div className="text-2xl font-bold">
                  {performanceMetrics.dayChange >= 0 ? '+' : ''}{formatCurrency(performanceMetrics.dayChange)}
                </div>
                <div className="text-sm opacity-75">Day P&L</div>
              </div>

              <div className={`p-4 rounded-xl text-center shadow-lg ${performanceMetrics.dayChangePercent >= 0 ? theme.success : theme.danger
                }`}>
                <div className="text-2xl font-bold">
                  {performanceMetrics.dayChangePercent >= 0 ? '+' : ''}{performanceMetrics.dayChangePercent.toFixed(2)}%
                </div>
                <div className="text-sm opacity-75">Day Return</div>
              </div>

              <div className={`p-4 rounded-xl ${theme.warning} text-center shadow-lg`}>
                <div className="text-2xl font-bold">{performanceMetrics.diversification}</div>
                <div className="text-sm opacity-75">Positions</div>
              </div>

              <div className="p-4 rounded-xl bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 text-center shadow-lg">
                <div className="text-2xl font-bold">{performanceMetrics.largestPosition.toFixed(1)}%</div>
                <div className="text-sm opacity-75">Largest Position</div>
              </div>

              <div className="p-4 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-center shadow-lg">
                <div className="text-2xl font-bold">{performanceMetrics.cashPercent.toFixed(1)}%</div>
                <div className="text-sm opacity-75">Cash Weight</div>
              </div>
            </div>

            {/* TOP POSITIONS */}
            {performanceMetrics.positions && performanceMetrics.positions.length > 0 && (
              <div>
                <h4 className={`text-lg font-bold ${theme.accent} mb-4`}>Top Positions</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {performanceMetrics.positions.slice(0, 6).map(position => (
                    <div key={position.ticker} className={`p-4 rounded-xl ${cardClass} border shadow-lg hover:scale-105 transition-all cursor-pointer`}
                      onClick={() => {
                        const stock = stocks.find(s => s.ticker === position.ticker);
                        if (stock) setSelectedStock(stock);
                      }}>
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-bold text-lg">{position.ticker}</div>
                        <div className={`text-sm px-2 py-1 rounded-lg ${position.dayChangePercent >= 0 ? theme.success : theme.danger
                          }`}>
                          {position.dayChangePercent >= 0 ? '+' : ''}{position.dayChangePercent.toFixed(2)}%
                        </div>
                      </div>
                      <div className="text-sm opacity-75 mb-1">{position.quantity} shares</div>
                      <div className="font-bold">{formatCurrency(position.currentValue)}</div>
                      <div className="text-sm opacity-75">{position.weight.toFixed(1)}% of portfolio</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Market Overview Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {/* Market Stats */}
          <div className={`lg:col-span-3 p-6 rounded-xl ${cardClass} border-2`}>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Market Overview
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{marketStats.gainers}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Gainers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{marketStats.losers}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Losers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{formatNumber(marketStats.totalMarketCap)}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Market Cap</div>
              </div>
            </div>

            {/* Top Movers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2 text-green-600 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  Top Gainers
                </h4>
                <div className="space-y-2">
                  {topMovers.gainers.slice(0, 3).map(stock => (
                    <div key={stock.ticker} className="flex justify-between items-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
                      <span className="font-medium">{stock.ticker}</span>
                      <span className="text-green-600 font-bold">+{stock.change.toFixed(2)}%</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-red-600 flex items-center gap-1">
                  <TrendingDown className="w-4 h-4" />
                  Top Losers
                </h4>
                <div className="space-y-2">
                  {topMovers.losers.slice(0, 3).map(stock => (
                    <div key={stock.ticker} className="flex justify-between items-center p-2 bg-red-50 dark:bg-red-900/20 rounded">
                      <span className="font-medium">{stock.ticker}</span>
                      <span className="text-red-600 font-bold">{stock.change.toFixed(2)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>


        </div>



        <h2 className="text-2xl font-bold mb-4">Browse Stocks</h2>
        <div className="mb-6 space-y-4">


          {/* Advanced Controls */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">Filters:</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm">Sort:</span>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={`px-2 py-1 rounded text-sm ${inputClass}`}>
                <option value="marketCap">Market Cap</option>
                <option value="price">Price</option>
                <option value="change">% Change</option>
                <option value="volume">Volume</option>
                <option value="name">Name</option>
              </select>
              <button onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')} className={`p-1 rounded ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}>
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setStockFilter('')} className={`px-3 py-1 rounded ${stockFilter === '' ? 'bg-blue-600 text-white' : darkMode ? 'bg-gray-700 text-gray-100 hover:bg-gray-600' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'}`}>All</button>
            <button onClick={() => setStockFilter('gainers')} className={`px-3 py-1 rounded flex items-center gap-1 ${stockFilter === 'gainers' ? 'bg-green-600 text-white' : darkMode ? 'bg-gray-700 text-gray-100 hover:bg-gray-600' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'}`}>
              <TrendingUp className="w-3 h-3" />
              Gainers
            </button>
            <button onClick={() => setStockFilter('losers')} className={`px-3 py-1 rounded flex items-center gap-1 ${stockFilter === 'losers' ? 'bg-red-600 text-white' : darkMode ? 'bg-gray-700 text-gray-100 hover:bg-gray-600' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'}`}>
              <TrendingDown className="w-3 h-3" />
              Losers
            </button>
            <button onClick={() => setStockFilter('active')} className={`px-3 py-1 rounded flex items-center gap-1 ${stockFilter === 'active' ? 'bg-purple-600 text-white' : darkMode ? 'bg-gray-700 text-gray-100 hover:bg-gray-600' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'}`}>
              <Activity className="w-3 h-3" />
              Most Active
            </button>
            <button onClick={() => setStockFilter('under100')} className={`px-3 py-1 rounded ${stockFilter === 'under100' ? 'bg-blue-600 text-white' : darkMode ? 'bg-gray-700 text-gray-100 hover:bg-gray-600' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'}`}>Under $100</button>
            <button onClick={() => setStockFilter('100to500')} className={`px-3 py-1 rounded ${stockFilter === '100to500' ? 'bg-blue-600 text-white' : darkMode ? 'bg-gray-700 text-gray-100 hover:bg-gray-600' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'}`}>$100-$500</button>
            <button onClick={() => setStockFilter('over500')} className={`px-3 py-1 rounded ${stockFilter === 'over500' ? 'bg-blue-600 text-white' : darkMode ? 'bg-gray-700 text-gray-100 hover:bg-gray-600' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'}`}>Over $500</button>
            <button onClick={() => setStockFilter('largecap')} className={`px-3 py-1 rounded ${stockFilter === 'largecap' ? 'bg-blue-600 text-white' : darkMode ? 'bg-gray-700 text-gray-100 hover:bg-gray-600' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'}`}>Large Cap</button>
            <button onClick={() => setStockFilter('midcap')} className={`px-3 py-1 rounded ${stockFilter === 'midcap' ? 'bg-blue-600 text-white' : darkMode ? 'bg-gray-700 text-gray-100 hover:bg-gray-600' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'}`}>Mid Cap</button>
            <button onClick={() => setStockFilter('smallcap')} className={`px-3 py-1 rounded ${stockFilter === 'smallcap' ? 'bg-blue-600 text-white' : darkMode ? 'bg-gray-700 text-gray-100 hover:bg-gray-600' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'}`}>Small Cap</button>
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-4">Top Stocks {searchQuery && `- Search: ${searchQuery}`}</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredStocks.map(stock => {
            // Calculate percentage from first price of the day (12:00 AM)
            const dayStartPrice = (stock.history && stock.history.length > 0) ? stock.history[0].price : stock.open;
            const priceChange = stock.price - dayStartPrice;
            const percentChange = ((priceChange / dayStartPrice) * 100).toFixed(2);

            return (
              <div key={`${stock.ticker}-${stock.price}`} className={`p-6 rounded-xl border-2 ${cardClass} cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-200 ${percentChange >= 0 ? 'hover:border-green-300' : 'hover:border-red-300'}`} onClick={() => setSelectedStock(stock)}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-bold">{stock.name}</h3>
                      {isMarketOpen() && (
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" title="Market Open"></div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-blue-600 font-bold text-sm">{stock.ticker}</p>
                      <span className="text-xs bg-gray-700 dark:bg-gray-600 text-white px-2 py-1 rounded">
                        Vol: {formatNumber((stock.marketCap / stock.price) * (0.5 + Math.sin(Date.now() / 86400000 + stock.ticker.charCodeAt(0)) * 0.3 + 0.7))}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(stock.price)}</p>
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${percentChange >= 0 ? 'bg-green-600 text-white dark:bg-green-700' : 'bg-red-600 text-white dark:bg-red-700'}`}>
                      {percentChange >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                      {percentChange >= 0 ? '+' : ''}{percentChange}%
                    </div>
                  </div>
                </div>

                <ResponsiveContainer width="100%" height={200} key={`${stock.ticker}-${stock.price}-${(stock.history || []).length}`}>
                  <LineChart data={stock.history && stock.history.length > 0 ? stock.history : generateDailyChart(stock.price, stock.ticker)}>
                    <CartesianGrid stroke={darkMode ? '#444' : '#ccc'} />
                    <XAxis dataKey="time" stroke={darkMode ? '#999' : '#666'} fontSize={12} interval={Math.max(0, Math.floor((stock.history && stock.history.length > 0 ? stock.history : generateDailyChart(stock.price, stock.ticker)).length / 10))} />
                    <YAxis stroke={darkMode ? '#999' : '#666'} fontSize={12} domain={getChartDomain(stock.history && stock.history.length > 0 ? stock.history : generateDailyChart(stock.price, stock.ticker))} type="number" ticks={getYAxisTicks(getChartDomain(stock.history && stock.history.length > 0 ? stock.history : generateDailyChart(stock.price, stock.ticker)))} />
                    <Line type="monotone" dataKey="price" stroke="#2563eb" dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">High:</span>
                    <span className="font-bold text-green-600">{formatCurrency(stock.high)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Low:</span>
                    <span className="font-bold text-red-600">{formatCurrency(stock.low)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Market Cap:</span>
                    <span className="font-bold">{formatNumber(stock.marketCap)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">P/E:</span>
                    <span className="font-bold">{stock.pe.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Dividend:</span>
                    <span className="font-bold">{stock.dividend.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">52W Range:</span>
                    <span className="font-bold text-xs">{formatCurrency(stock.low52w)} - {formatCurrency(stock.high52w)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ATLStockExchange;
