import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ArrowLeft, Menu, X, Moon, Sun, LogOut, TrendingUp, TrendingDown, DollarSign, Activity, AlertCircle,
  BarChart3, PieChart, Download, Filter, Share2, WifiOff
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

const TRADING_FEES = {
  commission: 0.005, // 0.5% commission
  spread: 0.001, // 0.1% bid-ask spread
  minimumFee: 1.00 // Minimum $1 fee
};

const CIRCUIT_BREAKERS = {
  level1: 0.07, // 7% drop triggers 15-minute halt
  level2: 0.13, // 13% drop triggers 15-minute halt
  level3: 0.20  // 20% drop triggers market close
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

const getMarketStatus = () => {
  const now = getEasternTime();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const day = now.getDay();
  const currentTime = hour + minute / 60;

  if (day === 0 || day === 6) return 'WEEKEND';

  if (currentTime < MARKET_HOURS.preMarket) return 'CLOSED';
  if (currentTime < MARKET_HOURS.open) return 'PRE_MARKET';
  if (currentTime <= MARKET_HOURS.close) return 'OPEN';
  if (currentTime <= MARKET_HOURS.afterHours) return 'AFTER_HOURS';
  return 'CLOSED';
};















// Enhanced price history generation with better performance and caching
function generatePriceHistory(openPrice, currentOrSeed, maybeSeedKey) {
  const now = getEasternTime();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Normalize parameters
  let currentPrice = openPrice;
  let seedKey = '';

  if (typeof currentOrSeed === 'number') {
    currentPrice = currentOrSeed;
    seedKey = typeof maybeSeedKey === 'string' ? maybeSeedKey : '';
  } else if (typeof currentOrSeed === 'string') {
    seedKey = currentOrSeed;
  }

  // Validate inputs
  if (!openPrice || openPrice <= 0) return [];
  if (!currentPrice || currentPrice <= 0) currentPrice = openPrice;

  // Generate data points from 12:00 AM to current time only
  const data = [];

  // Start at midnight (0 minutes) and go to current time
  const intervalMinutes = 10; // Data point every 10 minutes
  const totalPoints = Math.floor(currentMinutes / intervalMinutes) + 1;

  // Seeded random for consistent data
  const hashString = (str) => {
    if (!str) return Math.floor(openPrice * 1000);
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = (h * 31 + str.charCodeAt(i)) >>> 0;
    }
    return h;
  };

  let seed = hashString(seedKey + now.toDateString());
  const seededRandom = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  // Generate price progression from open to current
  for (let i = 0; i < totalPoints; i++) {
    const minutes = i * intervalMinutes;
    const progress = i / (totalPoints - 1);

    // Format time as 12-hour format
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    let displayHour = hours;
    let ampm = 'AM';

    if (hours === 0) {
      displayHour = 12;
    } else if (hours < 12) {
      displayHour = hours;
    } else if (hours === 12) {
      displayHour = 12;
      ampm = 'PM';
    } else {
      displayHour = hours - 12;
      ampm = 'PM';
    }

    const timeLabel = `${displayHour}:${mins.toString().padStart(2, '0')} ${ampm}`;

    // Calculate price with some random variation but trending toward current price
    const basePrice = openPrice + (currentPrice - openPrice) * progress;
    const variation = (seededRandom() - 0.5) * 0.02 * basePrice; // 2% max variation
    const price = Math.max(0.01, basePrice + variation);

    data.push({
      time: timeLabel,
      price: parseFloat(price.toFixed(2)),
      volume: Math.floor((0.5 + seededRandom()) * 1000000), // Add volume data
      bid: parseFloat((price - 0.01).toFixed(2)), // Bid price
      ask: parseFloat((price + 0.01).toFixed(2))  // Ask price
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
  const [updateSpeed, setUpdateSpeed] = useState(1000); // Price update interval in ms
  const [chartUpdateSpeed, setChartUpdateSpeed] = useState(5000); // Chart update interval in ms
  const [isMarketController, setIsMarketController] = useState(false); // Controls if this tab runs price updates
  const [marketRunning, setMarketRunning] = useState(true); // Market state
  const [marketSentiment, setMarketSentiment] = useState('neutral'); // bull, bear, neutral
  const [volatilityMode, setVolatilityMode] = useState('normal'); // low, normal, high, extreme
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showOrderBook, setShowOrderBook] = useState(false);
  const [marketEvents, setMarketEvents] = useState([]);

  const [tradingHistory, setTradingHistory] = useState([]); // User's trading history
  const [alertStock, setAlertStock] = useState('');
  const [alertPrice, setAlertPrice] = useState('');
  const [alertType, setAlertType] = useState('above');
  const [notifications, setNotifications] = useState([]);

  // Advanced Features State

  const [sortBy, setSortBy] = useState('marketCap'); // marketCap, price, change, volume
  const [sortOrder, setSortOrder] = useState('desc');



  const [connectionStatus, setConnectionStatus] = useState('connected');

  // Computed values with memoization for better performance
  const totalMarketCap = useMemo(() => {
    return stocks.reduce((sum, stock) => sum + stock.marketCap, 0);
  }, [stocks]);

  const marketStats = useMemo(() => {
    if (stocks.length === 0) return {
      avgPrice: 0, totalVolume: 0, gainers: 0, losers: 0, unchanged: 0,
      totalMarketCap: 0, avgPE: 0, totalDividendYield: 0, vix: 0,
      advanceDeclineRatio: 0, newHighs: 0, newLows: 0
    };

    const avgPrice = stocks.reduce((sum, stock) => sum + stock.price, 0) / stocks.length;
    const gainers = stocks.filter(stock => stock.price > stock.open).length;
    const losers = stocks.filter(stock => stock.price < stock.open).length;
    const unchanged = stocks.filter(stock => stock.price === stock.open).length;

    const totalMarketCap = stocks.reduce((sum, stock) => sum + stock.marketCap, 0);
    const avgPE = stocks.reduce((sum, stock) => sum + (stock.pe || 0), 0) / stocks.length;
    const totalDividendYield = stocks.reduce((sum, stock) => sum + (stock.dividend || 0), 0) / stocks.length;

    // Calculate VIX-like volatility index
    const volatilities = stocks.map(stock => {
      const dayChange = Math.abs((stock.price - stock.open) / stock.open);
      return dayChange;
    });
    const vix = (volatilities.reduce((sum, vol) => sum + vol, 0) / volatilities.length) * 100;

    const advanceDeclineRatio = losers > 0 ? gainers / losers : gainers;
    const newHighs = stocks.filter(stock => stock.price >= stock.high52w * 0.98).length;
    const newLows = stocks.filter(stock => stock.price <= stock.low52w * 1.02).length;

    return {
      avgPrice,
      totalVolume: Object.values(users).reduce((sum, user) => {
        return sum + Object.values(user.portfolio || {}).reduce((userSum, qty) => userSum + qty, 0);
      }, 0),
      gainers,
      losers,
      unchanged,
      totalMarketCap,
      avgPE,
      totalDividendYield,
      vix,
      advanceDeclineRatio,
      newHighs,
      newLows
    };
  }, [stocks, users]);

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



  // Connection status monitoring
  useEffect(() => {
    const checkConnection = () => {
      setConnectionStatus(navigator.onLine ? 'connected' : 'disconnected');
    };

    window.addEventListener('online', checkConnection);
    window.addEventListener('offline', checkConnection);

    const statusInterval = setInterval(checkConnection, 5000);

    return () => {
      window.removeEventListener('online', checkConnection);
      window.removeEventListener('offline', checkConnection);
      clearInterval(statusInterval);
    };
  }, []);



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
            { ticker: 'GCO', name: 'Georgia Commerce', price: 342.18, open: 342.18, high: 345.60, low: 340.00, marketCap: 520000000000, pe: 31.45, high52w: 365.00, low52w: 280.00, dividend: 1.20, qtrlyDiv: 0.30, volumeMultiplier: 0.3, history: generatePriceHistory(342.18, 342.18, 'GCO'), extendedHistory: generateExtendedHistory(342.18, 'GCO'), yearHistory: generateYearHistory(342.18, 'GCO') },
            { ticker: 'GFI', name: 'Georgia Financial Inc', price: 248.02, open: 248.02, high: 253.38, low: 247.27, marketCap: 374000000000, pe: 38.35, high52w: 260.09, low52w: 169.21, dividend: 0.41, qtrlyDiv: 0.26, volumeMultiplier: 1.8, history: generatePriceHistory(248.02, 248.02, 'GFI'), extendedHistory: generateExtendedHistory(248.02, 'GFI'), yearHistory: generateYearHistory(248.02, 'GFI') },
            { ticker: 'SAV', name: 'Savannah Shipping', price: 203.89, open: 203.89, high: 206.50, low: 202.00, marketCap: 312000000000, pe: 35.20, high52w: 225.00, low52w: 175.00, dividend: 0.85, qtrlyDiv: 0.21, volumeMultiplier: 0.7, history: generatePriceHistory(203.89, 203.89, 'SAV'), extendedHistory: generateExtendedHistory(203.89, 'SAV'), yearHistory: generateYearHistory(203.89, 'SAV') },
            { ticker: 'ATL', name: 'Atlanta Tech Corp', price: 156.75, open: 156.75, high: 159.20, low: 155.30, marketCap: 250000000000, pe: 42.15, high52w: 180.50, low52w: 120.00, dividend: 0.15, qtrlyDiv: 0.10, volumeMultiplier: 2.5, history: generatePriceHistory(156.75, 156.75, 'ATL'), extendedHistory: generateExtendedHistory(156.75, 'ATL'), yearHistory: generateYearHistory(156.75, 'ATL') },
            { ticker: 'RED', name: 'Red Clay Industries', price: 127.54, open: 127.54, high: 130.20, low: 126.00, marketCap: 198000000000, pe: 25.67, high52w: 145.30, low52w: 95.00, dividend: 0.50, qtrlyDiv: 0.13, volumeMultiplier: 1.2, history: generatePriceHistory(127.54, 127.54, 'RED'), extendedHistory: generateExtendedHistory(127.54, 'RED'), yearHistory: generateYearHistory(127.54, 'RED') },
            { ticker: 'PEA', name: 'Peach Energy Group', price: 89.43, open: 89.43, high: 91.80, low: 88.50, marketCap: 145000000000, pe: 28.90, high52w: 98.20, low52w: 65.30, dividend: 0.75, qtrlyDiv: 0.19, volumeMultiplier: 3.1, history: generatePriceHistory(89.43, 89.43, 'PEA'), extendedHistory: generateExtendedHistory(89.43, 'PEA'), yearHistory: generateYearHistory(89.43, 'PEA') },
            { ticker: 'COL', name: 'Columbus Manufacturing', price: 112.34, open: 112.34, high: 115.60, low: 111.00, marketCap: 175000000000, pe: 22.15, high52w: 130.00, low52w: 85.00, dividend: 1.50, qtrlyDiv: 0.38, volumeMultiplier: 0.9, history: generatePriceHistory(112.34, 112.34, 'COL'), extendedHistory: generateExtendedHistory(112.34, 'COL'), yearHistory: generateYearHistory(112.34, 'COL') },
            { ticker: 'AUG', name: 'Augusta Pharmaceuticals', price: 78.92, open: 78.92, high: 81.20, low: 77.50, marketCap: 125000000000, pe: 52.30, high52w: 92.50, low52w: 58.00, dividend: 0.0, qtrlyDiv: 0.0, volumeMultiplier: 4.2, history: generatePriceHistory(78.92, 78.92, 'AUG'), extendedHistory: generateExtendedHistory(78.92, 'AUG'), yearHistory: generateYearHistory(78.92, 'AUG') },
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
          'demo': { password: 'demo', balance: 100000, portfolio: { GFI: 10, ATL: 5 } },
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

        // Simple realistic price movement for live updates
        const timeSeed = Date.now() + stock.ticker.charCodeAt(0);

        // Create a simple seeded random for this update
        let seed = timeSeed % 1000000;
        const simpleRandom = () => {
          seed = (seed * 1664525 + 1013904223) % 4294967296;
          return seed / 4294967296;
        };

        // Enhanced price movements with volatility modes
        const volatilityMultiplier =
          volatilityMode === 'extreme' ? 5.0 :
            volatilityMode === 'high' ? 2.0 :
              volatilityMode === 'low' ? 0.3 : 1.0;

        const marketSentimentMultiplier =
          marketSentiment === 'bull' ? 1.2 :
            marketSentiment === 'bear' ? 0.8 : 1.0;

        const baseChange = (simpleRandom() - 0.5) * 0.0008 * volatilityMultiplier * marketSentimentMultiplier;
        const sentimentBias = marketSentiment === 'bull' ? 0.0001 : marketSentiment === 'bear' ? -0.0001 : 0;
        const totalChange = baseChange + sentimentBias;

        const newPrice = stock.price * (1 + totalChange);

        // Circuit breaker check
        const dayStartPrice = stock.open || stock.price;
        const priceChangePercent = Math.abs((newPrice - dayStartPrice) / dayStartPrice);

        let circuitBreakerTriggered = false;
        if (priceChangePercent >= CIRCUIT_BREAKERS.level3) {
          circuitBreakerTriggered = true;
          setMarketEvents(prev => [...prev.slice(-2), `🚨 CIRCUIT BREAKER: ${stock.ticker} trading halted - 20% limit reached`]);
        } else if (priceChangePercent >= CIRCUIT_BREAKERS.level2) {
          circuitBreakerTriggered = true;
          setMarketEvents(prev => [...prev.slice(-2), `⚠️ CIRCUIT BREAKER: ${stock.ticker} trading halted - 13% limit reached`]);
        } else if (priceChangePercent >= CIRCUIT_BREAKERS.level1) {
          circuitBreakerTriggered = true;
          setMarketEvents(prev => [...prev.slice(-2), `⚡ CIRCUIT BREAKER: ${stock.ticker} trading halted - 7% limit reached`]);
        }

        // Apply bounds (tighter during circuit breaker)
        const boundMultiplier = circuitBreakerTriggered ? 0.9999 : 0.9998;
        const minPrice = stock.price * boundMultiplier;
        const maxPrice = stock.price * (2 - boundMultiplier);
        const boundedPrice = circuitBreakerTriggered ? stock.price : Math.max(minPrice, Math.min(maxPrice, newPrice));
        const newPrice2 = Math.max(0.01, parseFloat(boundedPrice.toFixed(2)));

        const newHigh = Math.max(stock.high, newPrice2);
        const newLow = Math.min(stock.low, newPrice2);

        // Reset history at start of new trading day (if it's early morning and history exists from previous day)
        let newHistory = [...(stock.history || [])];
        const elapsedMs = now - dayStartTime;

        // If it's early in the day (before 6 AM) and we have history, it might be from yesterday - reset it
        if (now.getHours() < 6 && newHistory.length > 0) {
          // Check if the last entry is from a different day by looking at elapsed time
          const lastEntryTime = elapsedMs / 120000; // Convert to 2-minute intervals
          if (lastEntryTime < 0 || newHistory.length > 200) { // Reset if negative time or too many entries
            newHistory = [];
            // Also reset daily high/low at start of new day
            stock.high = stock.price;
            stock.low = stock.price;
          }
        }

        // Continuous update system: add new point every minute, update current point every few seconds
        const elapsedMinutes = Math.floor(elapsedMs / 60000);
        const expectedPoints = elapsedMinutes + 1;

        const hour = now.getHours();
        const min = now.getMinutes();
        let displayHour = hour;
        let ampm = 'AM';

        if (hour === 0) {
          displayHour = 12;
          ampm = 'AM';
        } else if (hour < 12) {
          displayHour = hour;
          ampm = 'AM';
        } else if (hour === 12) {
          displayHour = 12;
          ampm = 'PM';
        } else {
          displayHour = hour - 12;
          ampm = 'PM';
        }

        const timeLabel = `${displayHour}:${min.toString().padStart(2, '0')} ${ampm}`;

        if (newHistory.length < expectedPoints) {
          // Add new data point every minute
          newHistory.push({ time: timeLabel, price: newPrice2 });
        } else {
          // Update the last point with current price every update cycle
          if (newHistory.length > 0) {
            newHistory[newHistory.length - 1] = { time: timeLabel, price: newPrice2 };
          }
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
  }, [stocks, updateSpeed, isMarketController, marketRunning, marketSentiment, volatilityMode]);


  function generateExtendedHistory(basePrice, seedKey = '') {
    const data = [];

    // Simple seeded random number generator for consistent but natural randomness
    const createSeededRandom = (seed) => {
      let state = seed;
      return () => {
        state = (state * 1664525 + 1013904223) % 4294967296;
        return state / 4294967296;
      };
    };

    const baseSeed = seedKey ? seedKey.split('').reduce((a, b) => a + b.charCodeAt(0), 0) : Math.floor(basePrice * 100);
    const random = createSeededRandom(baseSeed);

    let price = basePrice * (0.92 + random() * 0.16); // More variation in starting price
    let momentum = 0;

    // Generate 7 days of data with hourly intervals for better resolution
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour += 2) { // Every 2 hours for better detail
        // Market behavior changes throughout the day
        const timeOfDay = hour / 24;
        const marketActivity = Math.sin(timeOfDay * Math.PI) * 0.5 + 0.5; // Higher activity during market hours

        // Simple realistic randomization
        const r1 = random();

        // Random walk with momentum
        const randomChange = (r1 - 0.5) * 2; // -1 to 1
        momentum = momentum * 0.8 + randomChange * 0.2;

        // Market activity affects volatility
        const volatility = 0.01 + marketActivity * 0.005;

        // Calculate price change
        const change = momentum * volatility;

        price = price * (1 + change);

        // Keep within reasonable bounds but allow more movement
        price = Math.max(basePrice * 0.75, Math.min(basePrice * 1.35, price));

        const date = getEasternTime();
        date.setDate(date.getDate() - (7 - day));
        date.setHours(hour);

        let displayHour = hour;
        let ampm = 'AM';
        if (hour === 0) {
          displayHour = 12;
          ampm = 'AM';
        } else if (hour < 12) {
          displayHour = hour;
          ampm = 'AM';
        } else if (hour === 12) {
          displayHour = 12;
          ampm = 'PM';
        } else {
          displayHour = hour - 12;
          ampm = 'PM';
        }

        const dateStr = `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')} ${displayHour}:00 ${ampm}`;

        data.push({ time: dateStr, price: parseFloat(price.toFixed(2)) });
      }
    }
    return data;
  }

  function generateYearHistory(basePrice, seedKey = '') {
    const data = [];

    // Use seeded randomization for consistency
    const baseSeed = seedKey ? seedKey.split('').reduce((a, b) => a + b.charCodeAt(0), 0) : Math.floor(basePrice * 100);
    let seedCounter = 0;
    const seededRandom = () => {
      seedCounter++;
      const x = Math.sin(baseSeed + seedCounter) * 10000;
      return x - Math.floor(x);
    };

    let price = basePrice * (0.80 + seededRandom() * 0.40); // More variation in starting price
    let longTermTrend = (seededRandom() - 0.5) * 0.03; // Overall yearly trend
    let momentum = 0;

    // Generate 12 months of data with more frequent intervals
    for (let month = 0; month < 12; month++) {
      for (let week = 0; week < 4; week++) {
        // Seasonal effects (stronger in certain months)
        const seasonalFactor = Math.sin((month / 12) * Math.PI * 2) * 0.015;

        // Market cycles and events
        const cycleFactor = Math.sin((month * 4 + week) / 48 * Math.PI * 2) * 0.008;

        // Enhanced randomization
        const random1 = seededRandom();
        const random2 = seededRandom();
        const random3 = seededRandom();

        // Momentum over longer periods
        momentum = momentum * 0.85 + (random1 - 0.5) * 0.8;

        // Volatility varies by month (higher in certain periods)
        const baseVolatility = 0.015 + Math.abs(Math.sin(month * Math.PI / 6)) * 0.01;
        const volatilityCluster = Math.abs(random2 - 0.5) * 0.012;
        const totalVolatility = baseVolatility + volatilityCluster;

        // Trend can shift quarterly
        if (week === 0 && month % 3 === 0 && random3 > 0.7) {
          longTermTrend = (seededRandom() - 0.5) * 0.03;
        }

        // Major market events (rare but impactful)
        let eventImpact = 0;
        if (random3 > 0.98) {
          eventImpact = (seededRandom() - 0.5) * 0.15; // Major event
        } else if (random3 > 0.95) {
          eventImpact = (seededRandom() - 0.5) * 0.08; // Minor event
        }

        // Combine all factors
        const noise = (seededRandom() - 0.5) * 2;
        const change = longTermTrend + seasonalFactor + cycleFactor + momentum * 0.3 + totalVolatility * noise + eventImpact;

        price = price * (1 + change);

        // Keep within reasonable bounds but allow significant movement over a year
        price = Math.max(basePrice * 0.40, Math.min(basePrice * 2.50, price));

        const date = getEasternTime();
        date.setMonth(date.getMonth() - (12 - month));
        date.setDate(1 + week * 7);

        // Ensure valid date
        if (date.getDate() > 28) {
          date.setDate(28);
        }

        const dateStr = `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;

        data.push({ time: dateStr, price: parseFloat(price.toFixed(2)) });
      }
    }
    return data;
  }

  // Enhanced function to generate minute-by-minute data for short timeframes
  function generateMinuteHistory(basePrice, minutes, seedKey = '') {
    const data = [];
    let price = basePrice;
    const now = getEasternTime();
    const startTime = new Date(now.getTime() - minutes * 60 * 1000);

    // Use seeded randomization for consistency
    const baseSeed = seedKey ? seedKey.split('').reduce((a, b) => a + b.charCodeAt(0), 0) : Math.floor(basePrice * 1000);
    let seedCounter = 0;
    const seededRandom = () => {
      seedCounter++;
      const x = Math.sin(baseSeed + seedCounter + minutes) * 10000;
      return x - Math.floor(x);
    };

    let momentum = 0;
    let microTrend = (seededRandom() - 0.5) * 0.002;

    for (let i = 0; i <= minutes; i += 1) {
      // Enhanced short-term movement
      const random1 = seededRandom();
      const random2 = seededRandom();

      // Momentum for smoother movement
      momentum = momentum * 0.6 + (random1 - 0.5) * 0.8;

      // Micro volatility with clustering
      const baseVolatility = 0.003;
      const volatilityCluster = Math.abs(random2 - 0.5) * 0.002;
      const totalVolatility = baseVolatility + volatilityCluster;

      // Occasional micro trend shifts
      if (seededRandom() > 0.97) {
        microTrend = (seededRandom() - 0.5) * 0.002;
      }

      const noise = (seededRandom() - 0.5) * 2;
      const change = microTrend + momentum * 0.4 + totalVolatility * noise;

      price = price * (1 + change);

      // Tighter bounds for short timeframes
      price = Math.max(basePrice * 0.985, Math.min(basePrice * 1.015, price));

      const pointTime = new Date(startTime.getTime() + i * 60 * 1000);
      const hour = pointTime.getHours();
      const min = pointTime.getMinutes().toString().padStart(2, '0');
      let displayHour = hour;
      let ampm = 'AM';

      if (hour === 0) {
        displayHour = 12;
        ampm = 'AM';
      } else if (hour < 12) {
        displayHour = hour;
        ampm = 'AM';
      } else if (hour === 12) {
        displayHour = 12;
        ampm = 'PM';
      } else {
        displayHour = hour - 12;
        ampm = 'PM';
      }

      data.push({ time: `${displayHour}:${min} ${ampm}`, price: parseFloat(price.toFixed(2)) });
    }
    return data;
  }

  // New function to generate monthly data (30 days)
  function generateMonthHistory(basePrice, seedKey = '') {
    const data = [];

    // Use seeded randomization for consistency
    const baseSeed = seedKey ? seedKey.split('').reduce((a, b) => a + b.charCodeAt(0), 0) : Math.floor(basePrice * 100);
    let seedCounter = 0;
    const seededRandom = () => {
      seedCounter++;
      const x = Math.sin(baseSeed + seedCounter) * 10000;
      return x - Math.floor(x);
    };

    let price = basePrice * (0.90 + seededRandom() * 0.20);
    let trend = (seededRandom() - 0.5) * 0.025; // Monthly trend
    let momentum = 0;

    // Generate 30 days of data with daily intervals
    for (let day = 0; day < 30; day++) {
      // Enhanced randomization
      const random1 = seededRandom();
      const random2 = seededRandom();
      const random3 = seededRandom();

      // Weekly cycles
      const weeklyEffect = Math.sin((day / 7) * Math.PI * 2) * 0.005;

      // Momentum carries forward
      momentum = momentum * 0.75 + (random1 - 0.5) * 0.7;

      // Volatility with clustering
      const baseVolatility = 0.012;
      const volatilityCluster = Math.abs(random2 - 0.5) * 0.008;
      const totalVolatility = baseVolatility + volatilityCluster;

      // Trend can shift weekly
      if (day % 7 === 0 && random3 > 0.8) {
        trend = (seededRandom() - 0.5) * 0.025;
      }

      // Combine factors
      const noise = (seededRandom() - 0.5) * 2;
      const change = trend + weeklyEffect + momentum * 0.35 + totalVolatility * noise;

      price = price * (1 + change);

      // Keep within reasonable bounds
      price = Math.max(basePrice * 0.70, Math.min(basePrice * 1.45, price));

      const date = getEasternTime();
      date.setDate(date.getDate() - (30 - day));
      const dateStr = `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;

      data.push({ time: dateStr, price: parseFloat(price.toFixed(2)) });
    }
    return data;
  }

  // Function to filter data based on timeframe
  function getFilteredChartData(stockData, period) {
    let data = [];

    switch (period) {
      case '10m':
        data = generateMinuteHistory(stockData.price, 10, stockData.ticker);
        break;
      case '30m':
        data = generateMinuteHistory(stockData.price, 30, stockData.ticker);
        break;
      case '1h':
        data = generateMinuteHistory(stockData.price, 60, stockData.ticker);
        break;
      case '1d':
        // Use live history if available, otherwise generate synthetic data
        data = stockData.history && stockData.history.length > 0
          ? stockData.history
          : generatePriceHistory(stockData.open ?? stockData.price, stockData.price, stockData.ticker);
        break;
      case '1w':
        // Generate fresh weekly data with proper seeding
        data = generateExtendedHistory(stockData.price, stockData.ticker);
        break;
      case '1m':
        // Generate monthly data (30 days) with daily intervals
        data = generateMonthHistory(stockData.price, stockData.ticker);
        break;
      case '1y':
        // Generate yearly data with proper seeding
        data = generateYearHistory(stockData.price, stockData.ticker);
        break;
      default:
        data = stockData.history || [];
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

    // Professional trading cost calculation with fees
    const baseCost = selectedStock.price * quantity;
    const commission = Math.max(TRADING_FEES.minimumFee, baseCost * TRADING_FEES.commission);
    const spread = baseCost * TRADING_FEES.spread;
    const totalCost = baseCost + commission + spread;

    // Market hours validation
    const marketStatus = getMarketStatus();
    if (marketStatus === 'CLOSED' || marketStatus === 'WEEKEND') {
      setNotifications(prev => [...prev, `🕐 Market is ${marketStatus}. Trading unavailable.`]);
      return;
    }

    // Position size validation (max 10% of available shares per trade)
    const maxTradeSize = Math.floor(availableShares * 0.1);
    if (sharesBought > maxTradeSize) {
      setNotifications(prev => [...prev, `⚠️ Maximum trade size: ${maxTradeSize} shares (10% of available)`]);
      return;
    }

    if (users[user].balance < totalCost) {
      setNotifications(prev => [...prev, `💰 Insufficient funds. Need ${formatCurrency(totalCost - users[user].balance)} more (includes fees: ${formatCurrency(commission + spread)})`]);
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

      // Calculate and apply price impact
      const sharePercentage = sharesBought / totalShares;
      const priceImpactPercent = sharePercentage * 100; // 1% of shares = 1% price increase
      const priceImpact = (priceImpactPercent / 100) * selectedStock.price;
      const newPrice = Math.max(0.01, parseFloat((selectedStock.price + priceImpact).toFixed(2))); // Prevent negative prices

      // Update stock price based on purchase
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

      // Success notification with detailed breakdown
      setNotifications(prev => [...prev, `✅ Bought ${quantity} shares of ${selectedStock.ticker} for ${formatCurrency(baseCost)} + ${formatCurrency(commission + spread)} fees = ${formatCurrency(totalCost)} - Price impact: ${priceImpact > 0 ? '+' : ''}${((priceImpact / selectedStock.price) * 100).toFixed(2)}%`]);
      setBuyQuantity('');

      // Record professional trade in history
      const tradeRecord = {
        timestamp: Date.now(),
        type: 'buy',
        ticker: selectedStock.ticker,
        quantity: quantity,
        price: selectedStock.price,
        baseCost: baseCost,
        commission: commission,
        spread: spread,
        total: totalCost,
        newPrice: newPrice,
        priceImpact: priceImpact,
        marketStatus: getMarketStatus(),
        volatilityMode: volatilityMode,
        marketSentiment: marketSentiment
      };
      const historyRef = ref(database, `tradingHistory/${user}/${Date.now()}`);
      set(historyRef, tradeRecord);

    } catch (error) {
      setNotifications(prev => [...prev, '❌ Purchase failed. Please try again.']);
    }
  }, [selectedStock, buyQuantity, user, users, stocks, marketSentiment, volatilityMode]);

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

      // Calculate price impact based on shares sold vs total shares outstanding
      const totalShares = selectedStock.marketCap / selectedStock.price;
      const sharesSold = quantity;
      const sharePercentage = sharesSold / totalShares;

      // Price impact proportional to percentage of shares traded - no caps!
      const priceImpactPercent = sharePercentage * 100; // 1% of shares = 1% price decrease
      const priceImpact = -(priceImpactPercent / 100) * selectedStock.price; // Negative for selling
      const newPrice = Math.max(0.01, parseFloat((selectedStock.price + priceImpact).toFixed(2))); // Prevent negative prices

      // Record trade in history
      const tradeRecord = {
        timestamp: Date.now(),
        type: 'sell',
        ticker: selectedStock.ticker,
        quantity: quantity,
        price: selectedStock.price,
        total: proceeds,
        newPrice: newPrice,
        priceImpact: priceImpact
      };
      const historyRef = ref(database, `tradingHistory/${user}/${Date.now()}`);
      set(historyRef, tradeRecord);

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
      history: generatePriceHistory(parseFloat(newStockPrice), parseFloat(newStockPrice), newStockTicker || ''),
      extendedHistory: generateExtendedHistory(parseFloat(newStockPrice), newStockTicker || ''),
      yearHistory: generateYearHistory(parseFloat(newStockPrice), newStockTicker || '')
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
    const prices = data.map(d => d.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const padding = (max - min) * 0.15;
    const paddedMin = min - padding;
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

  const bgClass = darkMode ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900';
  const cardClass = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const inputClass = darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-gray-100 text-gray-900 border-gray-300';

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

    // Use the new filtered chart data function with live price
    const chartData = getFilteredChartData(stockData, chartPeriod);


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
      <div className="bg-blue-600 text-white p-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-bold text-sm">ASE</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold">Atlanta Stock Exchange</h1>
            <div className="flex items-center gap-2 text-xs opacity-75">
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {marketStats.gainers}
              </span>
              <span className="flex items-center gap-1">
                <TrendingDown className="w-3 h-3" />
                {marketStats.losers}
              </span>
              <span className="flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                {formatNumber(totalMarketCap)}
              </span>
            </div>
          </div>
          {notifications.length > 0 && (
            <div className="relative">
              <AlertCircle className="w-6 h-6 text-yellow-300 animate-pulse" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1 rounded-full min-w-[16px] h-4 flex items-center justify-center">
                {notifications.length}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search stocks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-2 rounded-lg text-gray-900 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {user && users[user] && (
            <div className="flex items-center gap-2">
              <div className="bg-green-600 px-3 py-1 rounded-lg">
                <span className="text-sm font-bold">{formatCurrency(users[user].balance)}</span>
              </div>
              {connectionStatus === 'disconnected' && (
                <div className="bg-red-500 px-2 py-1 rounded-lg">
                  <WifiOff className="w-4 h-4" />
                </div>
              )}
            </div>
          )}
          <button onClick={() => setDarkMode(!darkMode)} className="p-2 hover:bg-blue-700 rounded text-white">
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          {isAdmin && <span className="bg-red-500 px-2 py-1 rounded-full text-xs font-bold hidden md:inline animate-pulse">ADMIN</span>}
          {isAdmin && isMarketController && <span className="bg-green-500 px-2 py-1 rounded-full text-xs font-bold hidden md:inline">CONTROLLER</span>}
          <div className={`px-3 py-1 rounded-lg text-xs font-bold hidden md:inline ${marketRunning ? 'bg-green-500' : 'bg-red-500'}`}>
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${marketRunning ? 'bg-green-200 animate-pulse' : 'bg-red-200'}`}></div>
              MARKET {marketRunning ? 'LIVE' : 'CLOSED'}
            </div>
          </div>
          <div className={`px-3 py-1 rounded-lg text-xs font-bold hidden md:inline ${marketSentiment === 'bull' ? 'bg-green-600' :
            marketSentiment === 'bear' ? 'bg-red-600' : 'bg-yellow-600'
            }`}>
            {marketSentiment === 'bull' ? '🐂 BULLISH' :
              marketSentiment === 'bear' ? '🐻 BEARISH' : '😐 NEUTRAL'}
          </div>
          <div className={`px-3 py-1 rounded-lg text-xs font-bold hidden md:inline ${volatilityMode === 'extreme' ? 'bg-red-600 animate-pulse' :
            volatilityMode === 'high' ? 'bg-orange-600' :
              volatilityMode === 'low' ? 'bg-blue-600' : 'bg-gray-600'
            }`}>
            📊 {volatilityMode.toUpperCase()} VOL
          </div>
          <div className="bg-blue-700 px-3 py-1 rounded-lg text-xs font-bold hidden md:inline">
            {getEasternTime().toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit' })} ET
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
          {user && users[user] && <p className="mb-2"><strong>Balance:</strong> ${(users[user].balance).toFixed(2)}</p>}
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
                          { ticker: 'GCO', name: 'Georgia Commerce', price: 342.18, open: 342.18, high: 345.60, low: 340.00, marketCap: 520000000000, pe: 31.45, high52w: 365.00, low52w: 280.00, dividend: 1.20, qtrlyDiv: 0.30, volumeMultiplier: 0.3, history: generatePriceHistory(342.18, 342.18, 'GCO'), extendedHistory: generateExtendedHistory(342.18, 'GCO'), yearHistory: generateYearHistory(342.18, 'GCO') },
                          { ticker: 'GFI', name: 'Georgia Financial Inc', price: 248.02, open: 248.02, high: 253.38, low: 247.27, marketCap: 374000000000, pe: 38.35, high52w: 260.09, low52w: 169.21, dividend: 0.41, qtrlyDiv: 0.26, volumeMultiplier: 1.8, history: generatePriceHistory(248.02, 248.02, 'GFI'), extendedHistory: generateExtendedHistory(248.02, 'GFI'), yearHistory: generateYearHistory(248.02, 'GFI') },
                          { ticker: 'SAV', name: 'Savannah Shipping', price: 203.89, open: 203.89, high: 206.50, low: 202.00, marketCap: 312000000000, pe: 35.20, high52w: 225.00, low52w: 175.00, dividend: 0.85, qtrlyDiv: 0.21, volumeMultiplier: 0.7, history: generatePriceHistory(203.89, 203.89, 'SAV'), extendedHistory: generateExtendedHistory(203.89, 'SAV'), yearHistory: generateYearHistory(203.89, 'SAV') },
                          { ticker: 'ATL', name: 'Atlanta Tech Corp', price: 156.75, open: 156.75, high: 159.20, low: 155.30, marketCap: 250000000000, pe: 42.15, high52w: 180.50, low52w: 120.00, dividend: 0.15, qtrlyDiv: 0.10, volumeMultiplier: 2.5, history: generatePriceHistory(156.75, 156.75, 'ATL'), extendedHistory: generateExtendedHistory(156.75, 'ATL'), yearHistory: generateYearHistory(156.75, 'ATL') },
                          { ticker: 'RED', name: 'Red Clay Industries', price: 127.54, open: 127.54, high: 130.20, low: 126.00, marketCap: 198000000000, pe: 25.67, high52w: 145.30, low52w: 95.00, dividend: 0.50, qtrlyDiv: 0.13, volumeMultiplier: 1.2, history: generatePriceHistory(127.54, 127.54, 'RED'), extendedHistory: generateExtendedHistory(127.54, 'RED'), yearHistory: generateYearHistory(127.54, 'RED') },
                          { ticker: 'PEA', name: 'Peach Energy Group', price: 89.43, open: 89.43, high: 91.80, low: 88.50, marketCap: 145000000000, pe: 28.90, high52w: 98.20, low52w: 65.30, dividend: 0.75, qtrlyDiv: 0.19, volumeMultiplier: 3.1, history: generatePriceHistory(89.43, 89.43, 'PEA'), extendedHistory: generateExtendedHistory(89.43, 'PEA'), yearHistory: generateYearHistory(89.43, 'PEA') },
                          { ticker: 'COL', name: 'Columbus Manufacturing', price: 112.34, open: 112.34, high: 115.60, low: 111.00, marketCap: 175000000000, pe: 22.15, high52w: 130.00, low52w: 85.00, dividend: 1.50, qtrlyDiv: 0.38, volumeMultiplier: 0.9, history: generatePriceHistory(112.34, 112.34, 'COL'), extendedHistory: generateExtendedHistory(112.34, 'COL'), yearHistory: generateYearHistory(112.34, 'COL') },
                          { ticker: 'AUG', name: 'Augusta Pharmaceuticals', price: 78.92, open: 78.92, high: 81.20, low: 77.50, marketCap: 125000000000, pe: 52.30, high52w: 92.50, low52w: 58.00, dividend: 0.0, qtrlyDiv: 0.0, volumeMultiplier: 4.2, history: generatePriceHistory(78.92, 78.92, 'AUG'), extendedHistory: generateExtendedHistory(78.92, 'AUG'), yearHistory: generateYearHistory(78.92, 'AUG') },
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
        <div className="mb-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg shadow-lg">
          <h3 className="font-bold mb-3 text-lg">🚀 Welcome to Atlanta Stock Exchange</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">Getting Started:</h4>
              <p className="mb-1">• Login with demo/demo or admin/admin</p>
              <p className="mb-1">• Browse stocks or use search</p>
              <p className="mb-1">• Click any stock to view details</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Trading:</h4>
              <p className="mb-1">• Enter quantity and Buy/Sell</p>
              <p className="mb-1">• Purchases affect stock prices realistically</p>
              <p className="mb-1">• View portfolio and trading history</p>
            </div>
          </div>
        </div>

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

        {/* Market Events Ticker */}
        {marketEvents.length > 0 && (
          <div className={`mb-6 p-4 rounded-xl ${cardClass} border-2 border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20`}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
              <span className="font-bold text-yellow-800 dark:text-yellow-200">🚨 BREAKING MARKET NEWS</span>
            </div>
            <div className="text-sm text-yellow-700 dark:text-yellow-300">
              {marketEvents[marketEvents.length - 1]}
            </div>
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
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-4">
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
              <div className="text-center">
                <div className={`text-2xl font-bold ${marketStats.vix > 30 ? 'text-red-600' : marketStats.vix > 20 ? 'text-yellow-600' : 'text-green-600'}`}>
                  {marketStats.vix.toFixed(1)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">VIX</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{marketStats.avgPE.toFixed(1)}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Avg P/E</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">{marketStats.totalDividendYield.toFixed(2)}%</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Avg Yield</div>
              </div>
            </div>

            {/* Professional Market Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-center">
                <div className="text-lg font-bold">{marketStats.advanceDeclineRatio.toFixed(2)}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">A/D Ratio</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">{marketStats.newHighs}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">New Highs</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-red-600">{marketStats.newLows}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">New Lows</div>
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
          {/* Market Controls */}
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <button
              onClick={() => setShowHeatmap(!showHeatmap)}
              className={`px-4 py-2 rounded-lg font-bold transition-colors ${showHeatmap ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                }`}
            >
              🔥 Heatmap View
            </button>
            <button
              onClick={() => setMarketSentiment(marketSentiment === 'bull' ? 'bear' : marketSentiment === 'bear' ? 'neutral' : 'bull')}
              className={`px-4 py-2 rounded-lg font-bold transition-colors ${marketSentiment === 'bull' ? 'bg-green-600 text-white' :
                marketSentiment === 'bear' ? 'bg-red-600 text-white' : 'bg-yellow-600 text-white'
                }`}
            >
              {marketSentiment === 'bull' ? '🐂 Bull Market' :
                marketSentiment === 'bear' ? '🐻 Bear Market' : '😐 Neutral Market'}
            </button>
            <button
              onClick={() => setVolatilityMode(volatilityMode === 'low' ? 'normal' : volatilityMode === 'normal' ? 'high' : volatilityMode === 'high' ? 'extreme' : 'low')}
              className={`px-4 py-2 rounded-lg font-bold transition-colors ${volatilityMode === 'extreme' ? 'bg-red-600 text-white animate-pulse' :
                volatilityMode === 'high' ? 'bg-orange-600 text-white' :
                  volatilityMode === 'low' ? 'bg-blue-600 text-white' : 'bg-gray-600 text-white'
                }`}
            >
              📊 {volatilityMode.charAt(0).toUpperCase() + volatilityMode.slice(1)} Volatility
            </button>
            <button
              onClick={() => setShowOrderBook(!showOrderBook)}
              className={`px-4 py-2 rounded-lg font-bold transition-colors ${showOrderBook ? 'bg-purple-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                }`}
            >
              📈 Level II Data
            </button>
            <div className={`px-3 py-1 rounded-lg text-xs font-bold ${getMarketStatus() === 'OPEN' ? 'bg-green-600 text-white' :
              getMarketStatus() === 'PRE_MARKET' ? 'bg-yellow-600 text-white' :
                getMarketStatus() === 'AFTER_HOURS' ? 'bg-orange-600 text-white' : 'bg-red-600 text-white'
              }`}>
              🕐 {getMarketStatus().replace('_', ' ')}
            </div>
          </div>

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

        {showHeatmap ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 mb-8">
            {filteredStocks.map(stock => {
              const dayStartPrice = (stock.history && stock.history.length > 0) ? stock.history[0].price : stock.open;
              const priceChange = stock.price - dayStartPrice;
              const percentChange = ((priceChange / dayStartPrice) * 100);

              return (
                <div
                  key={stock.ticker}
                  onClick={() => setSelectedStock(stock)}
                  className={`p-4 rounded-lg cursor-pointer transition-all duration-200 hover:scale-105 ${percentChange >= 5 ? 'bg-green-600 text-white' :
                    percentChange >= 2 ? 'bg-green-400 text-white' :
                      percentChange >= 0 ? 'bg-green-200 text-green-800' :
                        percentChange >= -2 ? 'bg-red-200 text-red-800' :
                          percentChange >= -5 ? 'bg-red-400 text-white' : 'bg-red-600 text-white'
                    }`}
                >
                  <div className="font-bold text-sm">{stock.ticker}</div>
                  <div className="text-xs opacity-90">{formatCurrency(stock.price)}</div>
                  <div className="font-bold text-sm">
                    {percentChange >= 0 ? '+' : ''}{percentChange.toFixed(1)}%
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredStocks.map(stock => {
              // Calculate percentage from first price of the day (12:00 AM)
              const dayStartPrice = (stock.history && stock.history.length > 0) ? stock.history[0].price : stock.open;
              const priceChange = stock.price - dayStartPrice;
              const percentChange = ((priceChange / dayStartPrice) * 100).toFixed(2);


              return (
                <div key={`${stock.ticker}-${stock.price}`} onClick={() => setSelectedStock(stock)} className={`p-6 rounded-xl border-2 ${cardClass} cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-200 ${percentChange >= 0 ? 'hover:border-green-300' : 'hover:border-red-300'}`}>
                  <div>
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
                      <LineChart data={stock.history && stock.history.length > 0 ? stock.history : generatePriceHistory(stock.open ?? stock.price, stock.price, stock.ticker)}>
                        <CartesianGrid stroke={darkMode ? '#444' : '#ccc'} />
                        <XAxis dataKey="time" stroke={darkMode ? '#999' : '#666'} fontSize={12} interval={Math.max(0, Math.floor((stock.history && stock.history.length > 0 ? stock.history : generatePriceHistory(stock.open ?? stock.price, stock.price, stock.ticker)).length / 10))} />
                        <YAxis stroke={darkMode ? '#999' : '#666'} fontSize={12} domain={getChartDomain(stock.history && stock.history.length > 0 ? stock.history : generatePriceHistory(stock.open ?? stock.price, stock.price, stock.ticker))} type="number" ticks={getYAxisTicks(getChartDomain(stock.history && stock.history.length > 0 ? stock.history : generatePriceHistory(stock.open ?? stock.price, stock.price, stock.ticker)))} />
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
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ATLStockExchange;
