import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ArrowLeft, Menu, X, Moon, Sun, LogOut, TrendingUp, TrendingDown, DollarSign, Activity, AlertCircle,
  BarChart3, PieChart, Download, Filter, Share2, Zap, Target, Bell, Settings,
  Users, Globe
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RechartsPieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { database } from './firebase';
import { ref, set, onValue, update } from 'firebase/database';

// Atlanta Stock Exchange - Clean Build Version 2.0
// All unused imports and variables have been removed
const customStyles = `
  @keyframes slide-in-right {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  @keyframes slide-down {
    from { transform: translateY(-100%); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  
  @keyframes scale-in {
    from { transform: scale(0.9); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
  
  @keyframes pulse-glow {
    0%, 100% { box-shadow: 0 0 5px rgba(59, 130, 246, 0.5); }
    50% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.8); }
  }
  
  .animate-slide-in-right { animation: slide-in-right 0.3s ease-out; }
  .animate-slide-down { animation: slide-down 0.3s ease-out; }
  .animate-scale-in { animation: scale-in 0.3s ease-out; }
  .animate-pulse-glow { animation: pulse-glow 2s infinite; }
  
  .glass-effect {
    backdrop-filter: blur(10px);
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
  
  .dark .glass-effect {
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .gradient-text {
    background: linear-gradient(135deg, #3B82F6, #8B5CF6);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  .hover-lift {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  
  .hover-lift:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = customStyles;
  document.head.appendChild(styleSheet);
}

// Advanced Constants - Professional Stock Exchange Settings

const TRADING_FEES = {
  commission: 0.0, // No commission fees
  spread: 0.0, // No bid-ask spread
  minimumFee: 0.0 // No minimum fee
};





const CHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];

// Enhanced market simulation constants
const MARKET_SIMULATION = {
  volatilityBase: 0.0001, // Base volatility per update
  volatilityMultiplier: 1.5, // Market hours multiplier
  momentumDecay: 0.85, // How quickly momentum fades
  meanReversionStrength: 0.00005, // Pull toward opening price
  maxDailyChange: 0.15, // Maximum 15% daily change
  priceUpdateInterval: 2000, // 2 seconds for smoother updates
  chartUpdateInterval: 5000 // 5 seconds for chart points
};

// Professional trading interface constants
const UI_CONSTANTS = {
  maxNotifications: 5,
  notificationDuration: 8000,
  animationDuration: 300,
  chartHeight: 400,
  mobileBreakpoint: 768
};

// Utility functions
const getEasternTime = (date = new Date()) => {
  return new Date(date.toLocaleString("en-US", { timeZone: "America/New_York" }));
};

// Mobile detection
const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (window.innerWidth <= UI_CONSTANTS.mobileBreakpoint);
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



// Removed unused isMarketOpen function

const getMarketStatus = () => {
  return 'OPEN'; // 24/7 trading
};















// CLEAN DAILY CHART GENERATION - 5-minute intervals
// ULTRA-REALISTIC INTRADAY CHART GENERATION - Professional Market Simulation
function generateDailyChart(currentPrice, ticker, existingHistory = []) {
  const now = getEasternTime();

  // Safety check for input parameters
  if (!isFinite(currentPrice) || currentPrice <= 0) {
    currentPrice = 100;
  }

  // Advanced seeded random with multiple generators for different market factors
  const seed = ticker.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  let rng1 = seed + now.getDate();
  let rng2 = seed * 31 + now.getMonth();
  let rng3 = seed * 97 + now.getFullYear();

  const seededRandom1 = () => { rng1 = (rng1 * 1664525 + 1013904223) % 4294967296; return rng1 / 4294967296; };
  const seededRandom2 = () => { rng2 = (rng2 * 1103515245 + 12345) % 4294967296; return rng2 / 4294967296; };
  const seededRandom3 = () => { rng3 = (rng3 * 134775813 + 1) % 4294967296; return rng3 / 4294967296; };

  // Market microstructure parameters
  const marketOpen = 9.5 * 60; // 9:30 AM in minutes
  const marketClose = 16 * 60; // 4:00 PM in minutes
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const targetPoints = Math.floor(currentMinutes / 5) + 1;

  let data = [...existingHistory];
  let orderBookImbalance = 0; // Simulates buy/sell pressure
  let institutionalFlow = 0; // Large player movements
  let volatilityCluster = 1; // GARCH-like volatility clustering
  let microTrend = 0; // Short-term momentum

  while (data.length < targetPoints) {
    const pointIndex = data.length;
    const totalMinutes = pointIndex * 5;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    // Professional time formatting
    let displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    let ampm = hours < 12 ? 'AM' : 'PM';
    const timeLabel = `${displayHour}:${minutes.toString().padStart(2, '0')} ${ampm}`;

    // Market session effects
    const isPreMarket = totalMinutes < marketOpen;
    const isMarketHours = totalMinutes >= marketOpen && totalMinutes <= marketClose;
    const isAfterHours = totalMinutes > marketClose;

    // Volume and volatility patterns
    let volumeMultiplier, volatilityMultiplier;

    let price;
    if (pointIndex === 0) {
      // Opening price with realistic gap from previous close
      const gapFactor = 0.995 + seededRandom1() * 0.01; // ±0.5% overnight gap
      price = currentPrice * gapFactor;

      // Set default volume multiplier for opening
      volumeMultiplier = isMarketHours ? 1.0 : 0.2;
      volatilityMultiplier = isMarketHours ? 1.0 : 0.3;
    } else {
      const prevPrice = data[pointIndex - 1].price;
      if (isPreMarket) {
        volumeMultiplier = 0.1 + seededRandom2() * 0.2;
        volatilityMultiplier = 0.3;
      } else if (isMarketHours) {
        // U-shaped volume pattern (high at open/close, lower midday)
        const sessionProgress = (totalMinutes - marketOpen) / (marketClose - marketOpen);
        const uShape = Math.pow(Math.sin(sessionProgress * Math.PI), 0.3);
        volumeMultiplier = 0.5 + uShape * 1.5 + seededRandom2() * 0.3;
        volatilityMultiplier = 0.8 + uShape * 0.4;
      } else {
        volumeMultiplier = 0.05 + seededRandom2() * 0.1;
        volatilityMultiplier = 0.2;
      }

      // Advanced market microstructure simulation

      // 1. Order flow imbalance (buy vs sell pressure)
      const flowChange = (seededRandom1() - 0.5) * 0.3;
      orderBookImbalance = orderBookImbalance * 0.95 + flowChange;
      orderBookImbalance = Math.max(-1, Math.min(1, orderBookImbalance));

      // 2. Institutional trading patterns
      if (seededRandom3() > 0.98) { // 2% chance of institutional activity
        institutionalFlow = (seededRandom1() - 0.5) * 2;
      }
      institutionalFlow *= 0.92; // Decay institutional impact

      // 3. Volatility clustering (GARCH effect)
      const prevReturn = Math.abs(Math.log(prevPrice / (data[Math.max(0, pointIndex - 2)]?.price || prevPrice)));
      volatilityCluster = 0.1 + 0.85 * volatilityCluster + 0.05 * prevReturn;
      volatilityCluster = Math.min(3, volatilityCluster);

      // 4. Microtrend momentum
      if (pointIndex >= 3) {
        const recentPrices = data.slice(-3).map(d => d.price);
        const trend = (recentPrices[2] - recentPrices[0]) / recentPrices[0];
        microTrend = microTrend * 0.8 + trend * 0.2;
      }

      // 5. Mean reversion to fair value
      const fairValueDistance = (currentPrice - prevPrice) / currentPrice;
      const meanReversion = fairValueDistance * 0.001;

      // 6. Random walk component with realistic distribution
      const normalRandom = () => {
        // Box-Muller transform for normal distribution
        const u1 = seededRandom1();
        const u2 = seededRandom2();
        return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      };

      // Combine all market forces
      const baseVolatility = 0.0008; // 5-minute base volatility
      const totalVolatility = baseVolatility * volatilityMultiplier * volatilityCluster;

      const priceChange =
        normalRandom() * totalVolatility * 0.4 + // Random component
        orderBookImbalance * 0.0003 + // Order flow
        institutionalFlow * 0.0008 + // Institutional impact
        microTrend * 0.3 + // Momentum
        meanReversion; // Mean reversion

      price = prevPrice * (1 + priceChange);

      // Realistic price constraints
      const maxMove = prevPrice * 0.02; // 2% max move per 5min
      price = Math.max(prevPrice - maxMove, Math.min(prevPrice + maxMove, price));
    }

    // Safety checks
    if (!isFinite(price) || price <= 0) {
      price = pointIndex > 0 ? data[pointIndex - 1].price : currentPrice;
    }

    // Realistic volume simulation
    let volume;
    if (isMarketHours) {
      const baseVolume = 800000;
      const priceVolatility = pointIndex > 0 ? Math.abs(price - data[pointIndex - 1].price) / price : 0;
      const volatilityBoost = 1 + priceVolatility * 50;
      volume = Math.floor(baseVolume * volumeMultiplier * volatilityBoost * (0.7 + seededRandom3() * 0.6));
    } else if (isPreMarket || isAfterHours) {
      // Pre-market and after-hours have different volume patterns
      const baseVolume = isPreMarket ? 30000 : 20000; // Pre-market slightly higher than after-hours
      volume = Math.floor(baseVolume * volumeMultiplier * (0.5 + seededRandom3()));
    } else {
      volume = Math.floor(10000 * volumeMultiplier * (0.3 + seededRandom3() * 0.4));
    }

    data.push({
      time: timeLabel,
      price: parseFloat(price.toFixed(2)),
      volume: volume,
      isLive: pointIndex === targetPoints - 1
    });
  }

  return data;
}

// OLD FUNCTION - KEEPING FOR COMPATIBILITY
function generatePriceHistory(openPrice, currentOrSeed, maybeSeedKey) {
  const ticker = typeof maybeSeedKey === 'string' ? maybeSeedKey : (typeof currentOrSeed === 'string' ? currentOrSeed : 'STOCK');
  const currentPrice = typeof currentOrSeed === 'number' ? currentOrSeed : openPrice;
  return generateDailyChart(currentPrice, ticker);
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
  const [isMobileDevice, setIsMobileDevice] = useState(false);
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
  const [, setInitialized] = useState(false);
  const [stockFilter, setStockFilter] = useState('');
  const [chartKey, setChartKey] = useState(0); // Force chart re-renders
  const [updateSpeed, setUpdateSpeed] = useState(MARKET_SIMULATION.priceUpdateInterval);
  const [chartUpdateSpeed, setChartUpdateSpeed] = useState(MARKET_SIMULATION.chartUpdateInterval);
  const [isMarketController, setIsMarketController] = useState(false); // Controls if this tab runs price updates
  const [marketRunning, setMarketRunning] = useState(true); // Market state
  // Enhanced state management
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



  // Mobile detection and optimization
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileDevice(isMobile());
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  // Enhanced notification management
  useEffect(() => {
    if (notifications.length > 0) {
      const timer = setTimeout(() => {
        setNotifications(prev => prev.slice(1));
      }, UI_CONSTANTS.notificationDuration);
      return () => clearTimeout(timer);
    }
  }, [notifications]);

  // Limit notifications to prevent memory issues
  useEffect(() => {
    if (notifications.length > UI_CONSTANTS.maxNotifications) {
      setNotifications(prev => prev.slice(-UI_CONSTANTS.maxNotifications));
    }
  }, [notifications]);







  useEffect(() => {
    // Test Firebase connection first
    console.log('Initializing Firebase connection...');

    const stocksRef = ref(database, 'stocks');
    const usersRef = ref(database, 'users');
    const marketStateRef = ref(database, 'marketState');

    onValue(stocksRef, (snapshot) => {
      try {
        const data = snapshot.val();
        if (data) {
          setStocks(data);
          setError(null);
        } else {
          console.log('Database is empty, generating initial stock data...');
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
        console.error('Firebase connection error:', error);
        setError(`Connection Error: ${error.message || 'Failed to load stock data'}`);
      }
    });

    onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setUsers(data);
      } else {
        console.log('Generating initial user data...');
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
      } else {
        console.log('Initializing market state...');
        // Initialize market state as running
        set(marketStateRef, { running: true });
      }
    });

    setInitialized(true);
    setLoading(false);
  }, []); // eslint-disable-next-line react-hooks/exhaustive-deps

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

  // Enhanced market controller with better synchronization
  useEffect(() => {
    const controllerRef = ref(database, 'marketController');
    const sessionId = Date.now() + Math.random();

    // Listen for controller changes first
    const unsubscribe = onValue(controllerRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const timeSinceLastUpdate = Date.now() - data.timestamp;
        // If controller hasn't updated in 10 seconds, take control
        if (timeSinceLastUpdate > 10000 || data.sessionId === sessionId) {
          setIsMarketController(true);
        } else {
          setIsMarketController(false);
        }
      } else {
        // No controller exists, become the controller
        setIsMarketController(true);
      }
    });

    // Try to become controller
    set(controllerRef, {
      sessionId,
      timestamp: Date.now(),
      user: user || 'anonymous'
    });

    // Heartbeat to maintain control
    const heartbeat = setInterval(() => {
      if (isMarketController) {
        update(controllerRef, {
          sessionId,
          timestamp: Date.now(),
          user: user || 'anonymous'
        });
      }
    }, 3000); // More frequent heartbeat

    return () => {
      clearInterval(heartbeat);
      unsubscribe();
    };
  }, [user, isMarketController]);

  useEffect(() => {
    if (stocks.length === 0) return;

    // Only run price updates if this tab is the market controller AND market is running
    if (!isMarketController || !marketRunning) {
      return;
    }

    const interval = setInterval(() => {
      try {
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

          // Enhanced realistic price movement algorithm with smooth start
          const timeSeed = Date.now() + stock.ticker.charCodeAt(0);
          let seed = timeSeed % 1000000;
          const simpleRandom = () => {
            seed = (seed * 1664525 + 1013904223) % 4294967296;
            return seed / 4294967296;
          };

          // Smooth market start - reduce volatility for first few minutes
          const marketStartTime = stock.marketStartTime || Date.now();
          if (!stock.marketStartTime) {
            stock.marketStartTime = Date.now();
          }
          const timeSinceStart = Date.now() - marketStartTime;
          const startSmoothingFactor = Math.min(1, timeSinceStart / (5 * 60 * 1000)); // 5 minutes to full volatility

          // More sophisticated price movements
          const timeOfDay = now.getHours() + now.getMinutes() / 60;
          const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday

          // Market activity varies by time and day
          const marketActivityMultiplier = (timeOfDay >= 9 && timeOfDay <= 16) ?
            (dayOfWeek >= 1 && dayOfWeek <= 5 ? MARKET_SIMULATION.volatilityMultiplier : 0.8) : 0.4;

          // Base volatility with stock-specific characteristics and smooth start
          const baseStockVolatility = MARKET_SIMULATION.volatilityBase * marketActivityMultiplier;
          const stockVolatility = baseStockVolatility * startSmoothingFactor; // Apply smooth start
          const sectorVolatility = stock.marketCap > 1000000000000 ? 0.8 : 1.2; // Large caps less volatile

          // PROFESSIONAL REAL-TIME PRICE SIMULATION - Institutional-Grade Market Dynamics
          const priceHistory = stock.history || [];

          // Initialize persistent market state for each stock
          if (!stock.marketState) {
            stock.marketState = {
              orderBookImbalance: 0,
              institutionalFlow: 0,
              volatilityCluster: 1,
              microTrend: 0,
              lastVolatility: stockVolatility,
              marketMakingSpread: 0.001,
              liquidityDepth: 1,
              newsImpact: 0,
              algorithmicPressure: 0
            };
          }

          const ms = stock.marketState;

          // 1. Market Microstructure - Order Book Dynamics
          const flowChange = (simpleRandom() - 0.5) * 0.4;
          ms.orderBookImbalance = ms.orderBookImbalance * 0.97 + flowChange * 0.03;
          ms.orderBookImbalance = Math.max(-1, Math.min(1, ms.orderBookImbalance));

          // 2. Institutional Trading Patterns
          if (simpleRandom() > 0.995) { // 0.5% chance of institutional block trade
            ms.institutionalFlow = (simpleRandom() - 0.5) * 3;
          }
          ms.institutionalFlow *= 0.94; // Institutional impact decays

          // 3. Advanced Volatility Clustering (GARCH-like)
          const recentReturn = priceHistory.length > 0 ?
            Math.abs(Math.log(stock.price / priceHistory[priceHistory.length - 1].price)) : stockVolatility;
          ms.volatilityCluster = 0.05 + 0.90 * ms.volatilityCluster + 0.05 * (recentReturn / stockVolatility);
          ms.volatilityCluster = Math.min(4, ms.volatilityCluster);

          // 4. Multi-timeframe Momentum
          let shortMomentum = 0, mediumMomentum = 0, longMomentum = 0;
          if (priceHistory.length >= 5) {
            const recent = priceHistory.slice(-5);
            shortMomentum = (recent[4].price - recent[3].price) / recent[3].price;
            mediumMomentum = (recent[4].price - recent[2].price) / recent[2].price / 2;
            longMomentum = (recent[4].price - recent[0].price) / recent[0].price / 4;
          }
          ms.microTrend = ms.microTrend * 0.85 + (shortMomentum * 0.5 + mediumMomentum * 0.3 + longMomentum * 0.2) * 0.15;

          // 5. Market Making and Liquidity Effects
          const spreadPressure = ms.orderBookImbalance * ms.marketMakingSpread;
          ms.liquidityDepth = 0.5 + 0.5 * Math.exp(-Math.abs(ms.orderBookImbalance) * 2);

          // 6. News and Event Impact Simulation
          if (simpleRandom() > 0.998) { // 0.2% chance of news event
            ms.newsImpact = (simpleRandom() - 0.5) * 0.02;
          }
          ms.newsImpact *= 0.85; // News impact decays quickly

          // 7. Algorithmic Trading Pressure
          const priceDeviation = (stock.price - stock.open) / stock.open;
          ms.algorithmicPressure = Math.tanh(priceDeviation * 10) * 0.0005; // Mean reversion algos

          // 8. Time-of-day Effects
          const hour = now.getHours();
          const minute = now.getMinutes();
          const sessionTime = hour + minute / 60;

          let sessionMultiplier = 1;
          if (sessionTime < 9.5 || sessionTime > 16) { // Pre/after market
            sessionMultiplier = 0.3;
          } else if (sessionTime < 10 || sessionTime > 15.5) { // Opening/closing hour
            sessionMultiplier = 1.8;
          } else if (sessionTime >= 12 && sessionTime <= 14) { // Lunch lull
            sessionMultiplier = 0.7;
          }

          // 9. Advanced Random Walk with Fat Tails
          const normalRandom = () => {
            const u1 = simpleRandom();
            const u2 = simpleRandom();
            return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
          };

          // Student's t-distribution for realistic fat tails
          const fatTailRandom = () => {
            const normal = normalRandom();
            const chi2 = -2 * Math.log(simpleRandom());
            return normal / Math.sqrt(chi2 / 4); // t-distribution with 4 degrees of freedom
          };

          // 10. Combine All Market Forces
          const baseVolatility = stockVolatility * sectorVolatility;
          const adjustedVolatility = baseVolatility * ms.volatilityCluster * sessionMultiplier / ms.liquidityDepth;

          const priceChange =
            fatTailRandom() * adjustedVolatility * 0.3 + // Random walk with fat tails
            ms.orderBookImbalance * 0.0002 + // Order flow imbalance
            ms.institutionalFlow * 0.0005 + // Institutional trading
            ms.microTrend * 0.4 + // Multi-timeframe momentum
            spreadPressure + // Market making effects
            ms.newsImpact + // News impact
            ms.algorithmicPressure + // Algorithmic pressure
            (simpleRandom() - 0.5) * adjustedVolatility * 0.1; // Additional microstructure noise

          // 11. Circuit Breakers and Realistic Constraints
          const maxSingleMove = baseVolatility * 8; // 8x normal volatility max
          const constrainedChange = Math.max(-maxSingleMove, Math.min(maxSingleMove, priceChange));

          // 12. Daily Volatility Limits
          const currentDailyChange = Math.abs((stock.price - stock.open) / stock.open);
          const dailyVolatilityLimit = stockVolatility * 15; // 15x daily volatility limit
          const dailyMultiplier = currentDailyChange > dailyVolatilityLimit ? 0.1 : 1;

          const newPrice2 = stock.price * (1 + constrainedChange * dailyMultiplier);

          // Final safety bounds and update market state
          const finalPrice = Math.max(0.01, parseFloat(newPrice2.toFixed(2)));
          stock.marketState = ms;

          const newHigh = Math.max(stock.high, finalPrice);
          const newLow = Math.min(stock.low, finalPrice);

          // FIXED CHART SYSTEM: 5-minute intervals (288 points/day), update last point every 5 seconds
          const isNewDay = now.getHours() === 0 && now.getMinutes() < 5;
          let newHistory = [...(stock.history || [])];
          let newOpen = stock.open;

          // Clear bad data if history has too many points (old system)
          if (newHistory.length > 300) {
            newHistory = [];
          }

          if (isNewDay || newHistory.length === 0) {
            // Generate fresh chart for new day AND reset open price
            newHistory = generateDailyChart(finalPrice, stock.ticker);
            newOpen = stock.price; // Set today's opening price to current price
          } else {
            // Only add new point if we're exactly at a 5-minute boundary
            const currentMinutes = now.getMinutes();
            const isExactly5MinBoundary = currentMinutes % 5 === 0 && now.getSeconds() < 10; // Within first 10 seconds of 5-minute mark

            const totalMinutesToday = now.getHours() * 60 + now.getMinutes();
            const expectedPoints = Math.floor(totalMinutesToday / 5) + 1;

            if (isExactly5MinBoundary && newHistory.length < expectedPoints) {
              // Add new 5-minute point ONLY at exact 5-minute boundaries
              const totalMinutes = (newHistory.length) * 5;
              const hours = Math.floor(totalMinutes / 60);
              const minutes = totalMinutes % 60;
              let displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
              let ampm = hours < 12 ? 'AM' : 'PM';
              const timeLabel = `${displayHour}:${minutes.toString().padStart(2, '0')} ${ampm}`;

              newHistory.push({
                time: timeLabel,
                price: finalPrice,
                volume: Math.floor(Math.random() * 1000000 + 500000),
                isLive: true
              });
            } else if (newHistory.length > 0) {
              // ALWAYS update the last point with current live price (every 5 seconds)
              const lastIndex = newHistory.length - 1;
              newHistory[lastIndex] = {
                ...newHistory[lastIndex],
                price: finalPrice,
                isLive: true
              };
            }
          }

          const sharesOutstanding = stock.marketCap / stock.price;
          const newMarketCap = Math.max(50000000000, sharesOutstanding * finalPrice);

          return {
            ...stock,
            price: finalPrice,
            open: newOpen,
            high: newHigh,
            low: newLow,
            history: newHistory,
            marketCap: newMarketCap,
            lastMomentum: ms.microTrend,
            lastUpdate: Date.now()
          };
        });

        const stocksRef = ref(database, 'stocks');
        set(stocksRef, updatedStocks);
        setStocks(updatedStocks); // Update local state immediately

        // Performance monitoring removed to eliminate unused variables

      } catch (error) {
        console.error('Price update error:', error);
        setNotifications(prev => [...prev, '⚠️ Price update failed - retrying...']);
      }
    }, updateSpeed); // Use configurable update speed

    return () => clearInterval(interval);
  }, [stocks, updateSpeed, isMarketController, marketRunning]);


  // PROFESSIONAL WEEKLY CHART GENERATION - Realistic Multi-Day Patterns
  function generateExtendedHistory(basePrice, seedKey = '') {
    const data = [];

    // Safety check for input parameters
    if (!isFinite(basePrice) || basePrice <= 0) {
      basePrice = 100;
    }

    // Advanced multi-generator seeded random system
    const baseSeed = seedKey ? seedKey.split('').reduce((a, b) => a + b.charCodeAt(0), 0) : Math.floor(basePrice * 100);
    let rng1 = baseSeed;
    let rng2 = baseSeed * 17;
    let rng3 = baseSeed * 31;
    let rng4 = baseSeed * 97;

    const seededRandom1 = () => { rng1 = (rng1 * 1664525 + 1013904223) % 4294967296; return rng1 / 4294967296; };
    const seededRandom2 = () => { rng2 = (rng2 * 1103515245 + 12345) % 4294967296; return rng2 / 4294967296; };
    const seededRandom3 = () => { rng3 = (rng3 * 134775813 + 1) % 4294967296; return rng3 / 4294967296; };
    const seededRandom4 = () => { rng4 = (rng4 * 214013 + 2531011) % 4294967296; return rng4 / 4294967296; };

    // Market state variables
    let price = basePrice * (0.88 + seededRandom1() * 0.24); // ±12% starting variation
    let weeklyTrend = (seededRandom2() - 0.5) * 0.02; // Weekly trend bias
    let volatilityRegime = 0.8 + seededRandom3() * 0.4; // Volatility clustering
    let marketSentiment = seededRandom4() - 0.5; // Overall market mood
    let institutionalActivity = 0;
    let newsImpact = 0;

    // Generate 7 days of realistic market data
    for (let day = 0; day < 7; day++) {
      const dayOfWeek = (getEasternTime().getDay() - 7 + day) % 7;
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      // Weekend effects (reduced activity, gap potential)
      if (isWeekend) {
        // Minimal weekend activity, potential gaps
        const weekendGap = (seededRandom1() - 0.5) * 0.005; // Small weekend gaps
        price *= (1 + weekendGap);

        const date = getEasternTime();
        date.setDate(date.getDate() - (7 - day));
        const dateStr = `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')} Weekend`;

        data.push({ time: dateStr, price: parseFloat(price.toFixed(2)) });
        continue;
      }

      // Weekday trading simulation - hourly intervals during market hours
      for (let hour = 9; hour <= 16; hour++) {
        const sessionProgress = (hour - 9) / 7; // 0 to 1 through trading day

        // Realistic intraday patterns using session progress
        const openingVolatility = hour === 9 ? 1.8 : 1.0;
        const closingVolatility = hour === 16 ? 1.5 : 1.0;
        const lunchLull = hour >= 12 && hour <= 14 ? 0.7 : 1.0;
        const sessionEffect = 1 + Math.sin(sessionProgress * Math.PI) * 0.2; // U-shaped activity
        const intradayMultiplier = openingVolatility * closingVolatility * lunchLull * sessionEffect;

        // Market microstructure effects

        // 1. Institutional flow (block trades, algorithmic trading)
        if (seededRandom1() > 0.95) { // 5% chance of institutional activity
          institutionalActivity = (seededRandom2() - 0.5) * 0.008;
        }
        institutionalActivity *= 0.85; // Decay institutional impact

        // 2. News and events simulation
        if (seededRandom3() > 0.98) { // 2% chance of news impact
          newsImpact = (seededRandom4() - 0.5) * 0.015;
        }
        newsImpact *= 0.7; // News impact decays quickly

        // 3. Market sentiment evolution
        const sentimentChange = (seededRandom1() - 0.5) * 0.1;
        marketSentiment = marketSentiment * 0.95 + sentimentChange * 0.05;
        marketSentiment = Math.max(-1, Math.min(1, marketSentiment));

        // 4. Volatility clustering (GARCH-like behavior)
        const recentVolatility = data.length > 0 ? Math.abs(Math.log(price / data[data.length - 1].price)) : 0;
        volatilityRegime = 0.1 + 0.88 * volatilityRegime + 0.02 * recentVolatility;
        volatilityRegime = Math.min(2.5, volatilityRegime);

        // 5. Weekly trend persistence
        const trendDecay = 0.98;
        weeklyTrend *= trendDecay;
        if (seededRandom2() > 0.9) { // 10% chance of trend change
          weeklyTrend += (seededRandom3() - 0.5) * 0.01;
        }

        // 6. Advanced random walk with fat tails
        const normalRandom = () => {
          const u1 = seededRandom1();
          const u2 = seededRandom2();
          return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        };

        // Student's t-distribution for fat tails (more realistic than normal)
        const fatTailRandom = () => {
          const normal = normalRandom();
          const chi2 = -2 * Math.log(seededRandom3()); // Chi-squared approximation
          return normal / Math.sqrt(chi2 / 3); // t-distribution with 3 degrees of freedom
        };

        // Combine all market forces
        const baseHourlyVolatility = 0.003; // Base hourly volatility
        const totalVolatility = baseHourlyVolatility * volatilityRegime * intradayMultiplier;

        const priceChange =
          fatTailRandom() * totalVolatility * 0.6 + // Random walk with fat tails
          weeklyTrend * 0.3 + // Weekly trend
          marketSentiment * 0.0005 + // Market sentiment
          institutionalActivity + // Institutional flow
          newsImpact + // News impact
          (seededRandom4() - 0.5) * 0.001; // Additional noise

        price *= (1 + priceChange);

        // Realistic constraints
        const maxHourlyMove = 0.05; // 5% max hourly move
        const prevPrice = data.length > 0 ? data[data.length - 1].price : basePrice;
        price = Math.max(prevPrice * (1 - maxHourlyMove), Math.min(prevPrice * (1 + maxHourlyMove), price));

        // Safety checks
        if (!isFinite(price) || price <= 0) {
          price = prevPrice || basePrice;
        }

        // Keep within reasonable weekly bounds
        price = Math.max(basePrice * 0.70, Math.min(basePrice * 1.45, price));

        const date = getEasternTime();
        date.setDate(date.getDate() - (7 - day));
        date.setHours(hour);

        let displayHour = hour > 12 ? hour - 12 : hour;
        let ampm = hour >= 12 ? 'PM' : 'AM';
        if (hour === 12) displayHour = 12;

        const dateStr = `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')} ${displayHour}:00 ${ampm}`;

        data.push({ time: dateStr, price: parseFloat(price.toFixed(2)) });
      }
    }

    return data;
  }

  // INSTITUTIONAL-GRADE YEARLY CHART GENERATION - Long-term Market Dynamics
  function generateYearHistory(basePrice, seedKey = '') {
    const data = [];

    // Safety check for input parameters
    if (!isFinite(basePrice) || basePrice <= 0) {
      basePrice = 100;
    }

    // Professional multi-seed random system for complex market simulation
    const baseSeed = seedKey ? seedKey.split('').reduce((a, b) => a + b.charCodeAt(0), 0) : Math.floor(basePrice * 100);
    let rng1 = baseSeed;
    let rng2 = baseSeed * 23;
    let rng3 = baseSeed * 47;
    let rng4 = baseSeed * 73;
    let rng5 = baseSeed * 101;

    const seededRandom1 = () => { rng1 = (rng1 * 1664525 + 1013904223) % 4294967296; return rng1 / 4294967296; };
    const seededRandom2 = () => { rng2 = (rng2 * 1103515245 + 12345) % 4294967296; return rng2 / 4294967296; };
    const seededRandom3 = () => { rng3 = (rng3 * 134775813 + 1) % 4294967296; return rng3 / 4294967296; };
    const seededRandom4 = () => { rng4 = (rng4 * 214013 + 2531011) % 4294967296; return rng4 / 4294967296; };
    const seededRandom5 = () => { rng5 = (rng5 * 16807) % 2147483647; return rng5 / 2147483647; };

    // Long-term market state variables
    let price = basePrice * (0.75 + seededRandom1() * 0.50); // ±25% starting variation
    let fundamentalTrend = (seededRandom2() - 0.5) * 0.04; // Annual fundamental growth/decline
    let marketCycle = seededRandom3() * 2 * Math.PI; // Market cycle phase
    let volatilityRegime = 0.5 + seededRandom4() * 1.0; // Long-term volatility state
    let economicSentiment = seededRandom5() - 0.5; // Macro economic sentiment
    let sectorRotation = 0; // Sector-specific rotation effects
    let institutionalPositioning = 0; // Large fund positioning

    // Macro-economic factors
    let interestRateCycle = seededRandom1() * 2 * Math.PI;
    let inflationExpectations = 0.02 + (seededRandom2() - 0.5) * 0.03;
    let geopoliticalRisk = seededRandom3() * 0.5;

    // Generate 12 months of sophisticated market data
    for (let month = 0; month < 12; month++) {
      // Monthly macro-economic updates
      if (month % 3 === 0) { // Quarterly updates
        // Interest rate cycle evolution
        interestRateCycle += (seededRandom1() - 0.5) * 0.5;

        // Inflation expectations drift
        inflationExpectations += (seededRandom2() - 0.5) * 0.005;
        inflationExpectations = Math.max(0, Math.min(0.08, inflationExpectations));

        // Geopolitical risk updates
        geopoliticalRisk = geopoliticalRisk * 0.8 + seededRandom3() * 0.2;

        // Economic sentiment shifts
        const sentimentShock = seededRandom4() > 0.9 ? (seededRandom5() - 0.5) * 0.4 : 0;
        economicSentiment = economicSentiment * 0.9 + sentimentShock;
        economicSentiment = Math.max(-1, Math.min(1, economicSentiment));
      }

      for (let week = 0; week < 4; week++) {
        const weekOfYear = month * 4 + week;
        const yearProgress = weekOfYear / 48;

        // 1. Seasonal Effects (January effect, summer doldrums, year-end rallies)
        let seasonalFactor = 0;
        if (month === 0) seasonalFactor += 0.008; // January effect
        if (month >= 5 && month <= 7) seasonalFactor -= 0.003; // Summer doldrums
        if (month === 11) seasonalFactor += 0.005; // Year-end rally
        seasonalFactor += Math.sin(month * Math.PI / 6) * 0.004; // General seasonal pattern
        seasonalFactor += Math.sin(yearProgress * 2 * Math.PI) * 0.002; // Year-long cycle effect

        // 2. Market Cycle Dynamics (Bull/Bear market phases)
        marketCycle += (seededRandom1() - 0.5) * 0.1;
        const cyclicalTrend = Math.sin(marketCycle) * 0.006;

        // 3. Volatility Clustering and Regime Changes
        const recentVolatility = data.length > 0 ?
          Math.abs(Math.log(price / data[Math.max(0, data.length - 4)].price)) : 0.02;
        volatilityRegime = 0.05 + 0.92 * volatilityRegime + 0.03 * recentVolatility;
        volatilityRegime = Math.min(3.0, volatilityRegime);

        // Volatility regime shifts (bear market spikes)
        if (seededRandom2() > 0.98) {
          volatilityRegime *= 1.5 + seededRandom3();
        }

        // 4. Fundamental Trend Evolution
        if (seededRandom4() > 0.95) { // 5% chance of fundamental shift
          const trendShift = (seededRandom5() - 0.5) * 0.02;
          fundamentalTrend = fundamentalTrend * 0.8 + trendShift * 0.2;
          fundamentalTrend = Math.max(-0.06, Math.min(0.06, fundamentalTrend));
        }

        // 5. Sector Rotation Effects
        const sectorCycle = Math.sin(weekOfYear * 0.3) * 0.003;
        sectorRotation = sectorRotation * 0.95 + sectorCycle * 0.05;

        // 6. Institutional Positioning (momentum and contrarian effects)
        const momentumSignal = data.length >= 12 ?
          (price - data[data.length - 12].price) / data[data.length - 12].price : 0;
        const institutionalResponse = Math.tanh(momentumSignal * 5) * 0.002; // Momentum following
        institutionalPositioning = institutionalPositioning * 0.9 + institutionalResponse * 0.1;

        // 7. Major Market Events and Shocks
        let eventImpact = 0;
        const eventRoll = seededRandom1();
        if (eventRoll > 0.995) { // 0.5% chance - Major crisis
          eventImpact = (seededRandom2() - 0.7) * 0.25; // Bias toward negative
        } else if (eventRoll > 0.985) { // 1% chance - Significant event
          eventImpact = (seededRandom3() - 0.5) * 0.12;
        } else if (eventRoll > 0.97) { // 1.5% chance - Minor event
          eventImpact = (seededRandom4() - 0.5) * 0.06;
        }

        // 8. Macro-economic Impact
        const interestRateImpact = -Math.sin(interestRateCycle) * 0.003; // Inverse relationship
        const inflationImpact = (0.03 - inflationExpectations) * 0.1; // Optimal inflation around 3%
        const geopoliticalImpact = -geopoliticalRisk * 0.002;

        // 9. Advanced Random Walk with Levy Flights (fat tails and jumps)
        const normalRandom = () => {
          const u1 = seededRandom1();
          const u2 = seededRandom2();
          return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        };

        // Levy stable distribution for realistic market returns
        const levyRandom = () => {
          if (seededRandom3() > 0.95) { // 5% chance of jump
            return normalRandom() * 3; // Large move
          }
          return normalRandom(); // Normal move
        };

        // 10. Combine All Market Forces
        const baseWeeklyVolatility = 0.008; // Base weekly volatility
        const totalVolatility = baseWeeklyVolatility * volatilityRegime;

        const weeklyReturn =
          levyRandom() * totalVolatility * 0.5 + // Random walk with jumps
          fundamentalTrend / 52 + // Weekly fundamental trend
          seasonalFactor + // Seasonal effects
          cyclicalTrend + // Market cycle
          sectorRotation + // Sector rotation
          institutionalPositioning + // Institutional flow
          economicSentiment * 0.001 + // Economic sentiment
          interestRateImpact + // Interest rate impact
          inflationImpact + // Inflation impact
          geopoliticalImpact + // Geopolitical risk
          eventImpact; // Event-driven moves

        price *= (1 + weeklyReturn);

        // Realistic constraints with circuit breakers
        const maxWeeklyMove = 0.15; // 15% max weekly move
        const prevPrice = data.length > 0 ? data[data.length - 1].price : basePrice;
        price = Math.max(prevPrice * (1 - maxWeeklyMove), Math.min(prevPrice * (1 + maxWeeklyMove), price));

        // Safety checks
        if (!isFinite(price) || price <= 0) {
          price = prevPrice || basePrice;
        }

        // Long-term bounds (allow significant yearly movement)
        price = Math.max(basePrice * 0.30, Math.min(basePrice * 3.50, price));

        const date = getEasternTime();
        date.setMonth(date.getMonth() - (12 - month));
        date.setDate(1 + week * 7);

        // Ensure valid date
        if (date.getDate() > 28) {
          date.setDate(28);
        }

        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const dateStr = `${monthNames[date.getMonth()]} ${date.getDate()}`;

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

    // 24/7 trading - no market hours restrictions

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
    const prices = data.map(d => d.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const padding = (max - min) * 0.15;
    const paddedMin = min - padding;
    const paddedMax = max + padding;
    return [parseFloat(paddedMin.toFixed(2)), parseFloat(paddedMax.toFixed(2))];
  };

  // Removed unused getYAxisTicks function

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
                <ResponsiveContainer width="100%" height={isMobileDevice ? 250 : UI_CONSTANTS.chartHeight} key={`${stockData.ticker}-${chartKey}`}>
                  <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#E5E7EB'} />
                    <XAxis
                      dataKey="time"
                      stroke={darkMode ? '#9CA3AF' : '#6B7280'}
                      fontSize={12}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      domain={chartDomain}
                      stroke={darkMode ? '#9CA3AF' : '#6B7280'}
                      fontSize={12}
                      tickFormatter={(value) => `$${value.toFixed(2)}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: darkMode ? '#1F2937' : '#FFFFFF',
                        border: `1px solid ${darkMode ? '#374151' : '#E5E7EB'}`,
                        borderRadius: '8px',
                        color: darkMode ? '#F9FAFB' : '#111827'
                      }}
                      formatter={(value) => [`$${value.toFixed(2)}`, 'Price']}
                      labelStyle={{ color: darkMode ? '#D1D5DB' : '#6B7280' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, fill: '#3B82F6' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-96 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>Loading chart data...</p>
                  </div>
                </div>
              )}
            </div>

            {/* ENHANCED TRADING PANEL */}
            <div className={`p-6 rounded-lg border-2 ${cardClass}`}>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" />
                Trading Panel
              </h3>

              {user ? (
                <div className="space-y-4">
                  {/* Portfolio Summary */}
                  <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Your Position</span>
                      <span className="text-lg font-bold text-blue-600">{userHolding} shares</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Portfolio Value</span>
                      <span className="font-bold">{formatCurrency(portfolioValue)}</span>
                    </div>
                  </div>

                  {/* Buy Section */}
                  <div className={`p-4 rounded-lg border ${darkMode ? 'border-green-600 bg-green-900/10' : 'border-green-300 bg-green-50'}`}>
                    <h4 className="font-bold text-green-600 mb-3 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Buy {stockData.ticker}
                    </h4>
                    <div className="space-y-3">
                      <input
                        type="number"
                        placeholder="Quantity"
                        value={buyQuantity}
                        onChange={(e) => setBuyQuantity(e.target.value)}
                        className={`w-full p-3 rounded-lg border-2 ${inputClass} focus:ring-2 focus:ring-green-400`}
                        min="1"
                      />
                      {buyQuantity && (
                        <div className="text-sm space-y-1">
                          <div className="flex justify-between">
                            <span>Base Cost:</span>
                            <span>{formatCurrency(stockData.price * parseInt(buyQuantity || 0))}</span>
                          </div>
                          <div className="flex justify-between text-gray-500">
                            <span>Fees:</span>
                            <span>{formatCurrency(Math.max(TRADING_FEES.minimumFee, (stockData.price * parseInt(buyQuantity || 0)) * (TRADING_FEES.commission + TRADING_FEES.spread)))}</span>
                          </div>
                          <div className="flex justify-between font-bold border-t pt-1">
                            <span>Total:</span>
                            <span>{formatCurrency((stockData.price * parseInt(buyQuantity || 0)) + Math.max(TRADING_FEES.minimumFee, (stockData.price * parseInt(buyQuantity || 0)) * (TRADING_FEES.commission + TRADING_FEES.spread)))}</span>
                          </div>
                        </div>
                      )}
                      <button
                        onClick={buyStock}
                        disabled={!buyQuantity || parseInt(buyQuantity) <= 0}
                        className="w-full bg-green-600 text-white p-3 rounded-lg font-bold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        Buy Shares
                      </button>
                    </div>
                  </div>

                  {/* Sell Section */}
                  {userHolding > 0 && (
                    <div className={`p-4 rounded-lg border ${darkMode ? 'border-red-600 bg-red-900/10' : 'border-red-300 bg-red-50'}`}>
                      <h4 className="font-bold text-red-600 mb-3 flex items-center gap-2">
                        <TrendingDown className="w-4 h-4" />
                        Sell {stockData.ticker}
                      </h4>
                      <div className="space-y-3">
                        <input
                          type="number"
                          placeholder="Quantity"
                          value={sellQuantity}
                          onChange={(e) => setSellQuantity(e.target.value)}
                          className={`w-full p-3 rounded-lg border-2 ${inputClass} focus:ring-2 focus:ring-red-400`}
                          min="1"
                          max={userHolding}
                        />
                        {sellQuantity && (
                          <div className="text-sm space-y-1">
                            <div className="flex justify-between">
                              <span>Proceeds:</span>
                              <span>{formatCurrency(stockData.price * parseInt(sellQuantity || 0))}</span>
                            </div>
                            <div className="flex justify-between text-gray-500">
                              <span>Available:</span>
                              <span>{userHolding} shares</span>
                            </div>
                          </div>
                        )}
                        <button
                          onClick={sellStock}
                          disabled={!sellQuantity || parseInt(sellQuantity) <= 0 || parseInt(sellQuantity) > userHolding}
                          className="w-full bg-red-600 text-white p-3 rounded-lg font-bold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          Sell Shares
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setBuyQuantity('1')}
                      className={`p-2 rounded-lg text-sm font-medium ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} transition-colors`}
                    >
                      Buy 1
                    </button>
                    <button
                      onClick={() => setBuyQuantity('10')}
                      className={`p-2 rounded-lg text-sm font-medium ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} transition-colors`}
                    >
                      Buy 10
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">Login Required</p>
                  <p className="text-sm opacity-75 mb-4">Please login to start trading</p>
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors"
                  >
                    Login Now
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ENHANCED STOCK DETAILS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {/* Key Metrics */}
            <div className={`p-6 rounded-lg border-2 ${cardClass}`}>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Key Metrics
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Market Cap</span>
                  <span className="font-bold">{formatNumber(stockData.marketCap)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">P/E Ratio</span>
                  <span className="font-bold">{stockData.pe?.toFixed(2) || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Day High</span>
                  <span className="font-bold text-green-600">${stockData.high.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Day Low</span>
                  <span className="font-bold text-red-600">${stockData.low.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">52W High</span>
                  <span className="font-bold">${stockData.high52w?.toFixed(2) || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">52W Low</span>
                  <span className="font-bold">${stockData.low52w?.toFixed(2) || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Dividend</span>
                  <span className="font-bold">${stockData.dividend?.toFixed(2) || '0.00'}</span>
                </div>
              </div>
            </div>

            {/* Trading Activity */}
            <div className={`p-6 rounded-lg border-2 ${cardClass}`}>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                Trading Activity
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Opening Price</span>
                  <span className="font-bold">${stockData.open.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Price Change</span>
                  <span className={`font-bold ${percentChangeColor}`}>
                    {priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">% Change</span>
                  <span className={`font-bold ${percentChangeColor}`}>
                    {percentChange >= 0 ? '+' : ''}{percentChange}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Shares Outstanding</span>
                  <span className="font-bold">{formatNumber(stockData.marketCap / stockData.price)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Market Status</span>
                  <span className="font-bold text-green-600">OPEN 24/7</span>
                </div>
              </div>
            </div>

            {/* Recent Trades */}
            <div className={`p-6 rounded-lg border-2 ${cardClass}`}>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-600" />
                Recent Trades
              </h3>
              {tradingHistory.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {tradingHistory
                    .filter(trade => trade.ticker === stockData.ticker)
                    .slice(0, 5)
                    .map((trade, idx) => (
                      <div key={idx} className={`p-2 rounded text-sm ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        <div className="flex justify-between items-center">
                          <span className={`font-bold ${trade.type === 'buy' ? 'text-green-600' : 'text-red-600'}`}>
                            {trade.type.toUpperCase()} {trade.quantity}
                          </span>
                          <span className="font-bold">${trade.price.toFixed(2)}</span>
                        </div>
                        <div className="text-xs opacity-75">
                          {new Date(trade.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p className="text-sm">No recent trades</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bgClass}`}>
      {/* ENHANCED PROFESSIONAL HEADER */}
      <div className={`${theme.card} border-b-2 ${theme.accent} p-4 flex justify-between items-center sticky top-0 z-50 backdrop-blur-md bg-opacity-95 shadow-lg`}>
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 ${theme.button} rounded-xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform`}>
            <span className="text-white font-bold text-xl">ASE</span>
          </div>
          <div className="flex flex-col">
            <h1 className={`text-2xl font-bold ${theme.accent} tracking-tight`}>Atlanta Stock Exchange</h1>
            <div className="flex items-center gap-4 text-sm">
              <span className={`flex items-center gap-1 px-3 py-1 rounded-full ${theme.success} shadow-sm`}>
                <TrendingUp className="w-4 h-4" />
                {marketStats.gainers} Gainers
              </span>
              <span className={`flex items-center gap-1 px-3 py-1 rounded-full ${theme.danger} shadow-sm`}>
                <TrendingDown className="w-4 h-4" />
                {marketStats.losers} Losers
              </span>
              <span className={`flex items-center gap-1 px-3 py-1 rounded-full ${theme.warning} shadow-sm`}>
                <DollarSign className="w-4 h-4" />
                {formatNumber(marketStats.totalMarketCap)}
              </span>
              <span className={`flex items-center gap-1 px-3 py-1 rounded-full ${marketRunning ? theme.success : theme.danger} shadow-sm`}>
                <div className={`w-2 h-2 rounded-full ${marketRunning ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
                {marketRunning ? 'LIVE' : 'PAUSED'}
              </span>
            </div>
          </div>

          {/* Enhanced Notifications */}
          {notifications.length > 0 && (
            <div className="relative">
              <div className="animate-bounce">
                <Bell className="w-7 h-7 text-yellow-500 drop-shadow-lg" />
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg min-w-[20px] text-center">
                  {notifications.length}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Enhanced Search */}
          <div className="relative hidden md:block">
            <input
              type="text"
              placeholder="🔍 Search stocks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`${inputClass} px-4 py-2 rounded-xl text-sm w-64 shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all pl-10`}
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <Activity className="w-4 h-4" />
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-blue-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Enhanced Portfolio Display */}
          {user && users[user] && performanceMetrics.totalValue && (
            <div className="hidden lg:flex items-center gap-3">
              <div className={`${performanceMetrics.dayChange >= 0 ? theme.success : theme.danger} px-4 py-2 rounded-xl shadow-lg border-2`}>
                <div className="text-xs opacity-75 font-medium">Portfolio</div>
                <div className="font-bold text-lg">{formatCurrency(performanceMetrics.totalValue)}</div>
                <div className="text-xs font-medium">
                  {performanceMetrics.dayChange >= 0 ? '+' : ''}{performanceMetrics.dayChangePercent.toFixed(2)}%
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`${theme.button} p-3 rounded-xl shadow-lg hover:scale-105 transition-all duration-200`}
              title="Toggle Dark Mode"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Admin Badge */}
            {isAdmin && (
              <div className="hidden md:flex items-center gap-2">
                <span className="bg-gradient-to-r from-red-500 to-pink-500 px-3 py-2 rounded-xl text-xs font-bold text-white animate-pulse shadow-lg">
                  👑 ADMIN
                </span>
                {isMarketController && (
                  <span className="bg-gradient-to-r from-green-500 to-emerald-500 px-3 py-2 rounded-xl text-xs font-bold text-white shadow-lg">
                    🎮 CONTROLLER
                  </span>
                )}
              </div>
            )}

            {/* Live Clock */}
            <div className={`${theme.card} px-4 py-2 rounded-xl text-sm font-bold shadow-lg border-2 hidden lg:flex`}>
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

          {/* User Actions */}
          {user ? (
            <div className="flex items-center gap-2">
              <span className="hidden md:inline text-sm font-medium">
                {user} • {formatCurrency(users[user]?.balance || 0)}
              </span>
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-red-600 rounded-xl text-white transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowLoginModal(true)}
              className="px-6 py-2 bg-white text-blue-600 rounded-xl font-bold hover:bg-gray-100 text-sm transition-colors shadow-md"
            >
              Login
            </button>
          )}

          {/* Mobile Menu */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Enhanced Mobile Menu */}
      {mobileMenuOpen && (
        <div className={`md:hidden ${cardClass} border-b shadow-lg animate-slide-down`}>
          <div className="p-4 space-y-4">
            {/* Mobile Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="🔍 Search stocks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`${inputClass} w-full px-4 py-2 rounded-lg`}
              />
            </div>

            {/* User Info */}
            {user && users[user] && (
              <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <div className="flex justify-between items-center">
                  <span className="font-bold">{user}</span>
                  <span className="font-bold text-blue-600">{formatCurrency(users[user].balance)}</span>
                </div>
                {performanceMetrics.totalValue && (
                  <div className="text-sm mt-1">
                    <span>Portfolio: {formatCurrency(performanceMetrics.totalValue)}</span>
                    <span className={`ml-2 ${performanceMetrics.dayChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ({performanceMetrics.dayChange >= 0 ? '+' : ''}{performanceMetrics.dayChangePercent.toFixed(2)}%)
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Mobile Controls */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
              </button>

              {user ? (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 p-2 text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              ) : (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="flex items-center gap-2 p-2 text-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                >
                  <Users className="w-5 h-5" />
                  <span>Login</span>
                </button>
              )}
            </div>

            {/* Status Indicators */}
            <div className="flex flex-wrap gap-2">
              {isAdmin && (
                <span className="bg-red-600 text-white px-2 py-1 rounded text-xs font-bold">ADMIN</span>
              )}
              {isAdmin && isMarketController && (
                <span className="bg-green-600 text-white px-2 py-1 rounded text-xs font-bold">CONTROLLER</span>
              )}
              <span className={`px-2 py-1 rounded text-xs font-bold text-white ${marketRunning ? 'bg-green-600' : 'bg-red-600'}`}>
                MARKET {marketRunning ? 'RUNNING' : 'STOPPED'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Notifications Panel */}
      {notifications.length > 0 && (
        <div className="fixed top-20 right-4 z-40 space-y-2 max-w-sm">
          {notifications.slice(0, UI_CONSTANTS.maxNotifications).map((notification, idx) => {
            const isSuccess = notification.includes('✅');
            const isError = notification.includes('❌');
            const isWarning = notification.includes('⚠️');

            return (
              <div
                key={idx}
                className={`p-4 rounded-xl shadow-lg border-2 backdrop-blur-md animate-slide-in-right ${isSuccess ? theme.success :
                  isError ? theme.danger :
                    isWarning ? theme.warning :
                      theme.card
                  } transition-all duration-300 hover:scale-105`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium flex-1">{notification}</p>
                  <button
                    onClick={() => setNotifications(prev => prev.filter((_, i) => i !== idx))}
                    className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Enhanced Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`p-8 rounded-2xl border-2 ${cardClass} w-full max-w-md shadow-2xl animate-scale-in`}>
            <div className="text-center mb-6">
              <div className={`w-16 h-16 ${theme.button} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                <span className="text-white font-bold text-2xl">ASE</span>
              </div>
              <h1 className="text-3xl font-bold mb-2 text-blue-600">Welcome Back</h1>
              <p className="text-sm opacity-75">Login to Atlanta Stock Exchange</p>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Username"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                className={`w-full p-4 border-2 rounded-xl ${inputClass} focus:ring-2 focus:ring-blue-400 transition-all`}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              />
              <input
                type="password"
                placeholder="Password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className={`w-full p-4 border-2 rounded-xl ${inputClass} focus:ring-2 focus:ring-blue-400 transition-all`}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              />

              {loginError && (
                <div className={`p-3 rounded-lg ${theme.danger} text-sm font-medium`}>
                  {loginError}
                </div>
              )}

              <button
                onClick={handleLogin}
                className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold hover:bg-blue-700 transition-all transform hover:scale-105 shadow-lg"
              >
                Login
              </button>

              <button
                onClick={() => { setShowLoginModal(false); setShowSignupModal(true); }}
                className="w-full bg-green-600 text-white p-4 rounded-xl font-bold hover:bg-green-700 transition-all transform hover:scale-105 shadow-lg"
              >
                Create Account
              </button>

              <button
                onClick={() => setShowLoginModal(false)}
                className="w-full bg-gray-400 text-white p-4 rounded-xl font-bold hover:bg-gray-500 transition-all"
              >
                Cancel
              </button>
            </div>

            <div className={`mt-6 p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <p className="text-xs font-medium mb-2">Demo Accounts:</p>
              <p className="text-xs opacity-75">Demo User: <code>demo</code> / <code>demo</code></p>
              <p className="text-xs opacity-75">Admin: <code>admin</code> / <code>admin</code></p>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Signup Modal */}
      {showSignupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`p-8 rounded-2xl border-2 ${cardClass} w-full max-w-md shadow-2xl animate-scale-in`}>
            <div className="text-center mb-6">
              <div className={`w-16 h-16 ${theme.button} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                <span className="text-white font-bold text-2xl">ASE</span>
              </div>
              <h1 className="text-3xl font-bold mb-2 text-green-600">Join ASE</h1>
              <p className="text-sm opacity-75">Create your trading account</p>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Choose Username"
                value={signupUsername}
                onChange={(e) => setSignupUsername(e.target.value)}
                className={`w-full p-4 border-2 rounded-xl ${inputClass} focus:ring-2 focus:ring-green-400 transition-all`}
                onKeyPress={(e) => e.key === 'Enter' && handleSignup()}
              />
              <input
                type="password"
                placeholder="Create Password"
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                className={`w-full p-4 border-2 rounded-xl ${inputClass} focus:ring-2 focus:ring-green-400 transition-all`}
                onKeyPress={(e) => e.key === 'Enter' && handleSignup()}
              />
              <input
                type="password"
                placeholder="Confirm Password"
                value={signupConfirmPassword}
                onChange={(e) => setSignupConfirmPassword(e.target.value)}
                className={`w-full p-4 border-2 rounded-xl ${inputClass} focus:ring-2 focus:ring-green-400 transition-all`}
                onKeyPress={(e) => e.key === 'Enter' && handleSignup()}
              />

              {signupError && (
                <div className={`p-3 rounded-lg ${theme.danger} text-sm font-medium`}>
                  {signupError}
                </div>
              )}

              <button
                onClick={handleSignup}
                className="w-full bg-green-600 text-white p-4 rounded-xl font-bold hover:bg-green-700 transition-all transform hover:scale-105 shadow-lg"
              >
                Create Account
              </button>

              <button
                onClick={() => { setShowSignupModal(false); setShowLoginModal(true); }}
                className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold hover:bg-blue-700 transition-all transform hover:scale-105 shadow-lg"
              >
                Back to Login
              </button>

              <button
                onClick={() => setShowSignupModal(false)}
                className="w-full bg-gray-400 text-white p-4 rounded-xl font-bold hover:bg-gray-500 transition-all"
              >
                Cancel
              </button>
            </div>

            <div className={`mt-6 p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <p className="text-xs font-medium mb-2">🎉 Welcome Bonus:</p>
              <p className="text-xs opacity-75">• Starting balance: <strong>$50,000</strong></p>
              <p className="text-xs opacity-75">• Free trading for first 30 days</p>
              <p className="text-xs opacity-75">• Access to all market features</p>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Admin Panel */}
      {
        isAdmin && (
          <div className={`${darkMode ? 'bg-gradient-to-r from-red-900 to-pink-900' : 'bg-gradient-to-r from-red-600 to-pink-600'} text-white p-4 shadow-lg`}>
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Settings className="w-6 h-6" />
                  <h2 className="text-xl font-bold">Admin Control Panel</h2>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="bg-white bg-opacity-20 px-2 py-1 rounded">
                    Controller: {isMarketController ? '✅' : '❌'}
                  </span>
                  <span className="bg-white bg-opacity-20 px-2 py-1 rounded">
                    Market: {marketRunning ? '🟢 Running' : '🔴 Stopped'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
                {[
                  { id: 'create', label: 'Create Stock', icon: '📈' },
                  { id: 'adjust', label: 'Adjust Price', icon: '💰' },
                  { id: 'money', label: 'User Money', icon: '💵' },
                  { id: 'shares', label: 'Manage Shares', icon: '📊' },
                  { id: 'splits', label: 'Stock Splits', icon: '✂️' },
                  { id: 'market', label: 'Market Control', icon: '🎮' },
                  { id: 'users', label: 'Users', icon: '👥' },
                  { id: 'analytics', label: 'Analytics', icon: '📈' },
                  { id: 'system', label: 'System', icon: '⚙️' },
                  { id: 'bulk', label: 'Bulk Ops', icon: '🔄' },
                  { id: 'trading', label: 'Trading', icon: '⚡' },
                  { id: 'portfolio', label: 'Portfolios', icon: '💼' },
                  { id: 'alerts', label: 'Alerts', icon: '🔔' },
                  { id: 'speed', label: 'Speed', icon: '🚀' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setAdminTab(tab.id)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all transform hover:scale-105 ${adminTab === tab.id
                      ? 'bg-white text-red-600 shadow-lg'
                      : 'bg-white bg-opacity-20 hover:bg-opacity-30'
                      }`}
                  >
                    <div className="text-center">
                      <div className="text-lg mb-1">{tab.icon}</div>
                      <div className="text-xs">{tab.label}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )
      }

      {
        isAdmin && adminTab === 'create' && (
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
        )
      }

      {
        isAdmin && adminTab === 'adjust' && (
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
        )
      }

      {
        isAdmin && adminTab === 'money' && (
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
        )
      }

      {
        isAdmin && adminTab === 'shares' && (
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
        )
      }

      {
        isAdmin && adminTab === 'splits' && (
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
        )
      }

      {
        isAdmin && adminTab === 'speed' && (
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
        )
      }

      {
        isAdmin && adminTab === 'market' && (
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
        )
      }

      {
        isAdmin && adminTab === 'users' && (
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
        )
      }

      {
        isAdmin && adminTab === 'analytics' && (
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
        )
      }

      {
        isAdmin && adminTab === 'system' && (
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
        )
      }

      {
        isAdmin && adminTab === 'bulk' && (
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
        )
      }

      {
        isAdmin && adminTab === 'trading' && (
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
        )
      }

      {
        isAdmin && adminTab === 'portfolio' && (
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
        )
      }

      {
        isAdmin && adminTab === 'alerts' && (
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
        )
      }

      {
        notifications.length > 0 && (
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

        {/* Enhanced Header with Stats */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <Globe className="w-8 h-8 text-blue-600" />
              Market Overview
              {searchQuery && <span className="text-lg text-gray-500">- "{searchQuery}"</span>}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Showing {filteredStocks.length} of {stocks.length} stocks • Live updates every {MARKET_SIMULATION.priceUpdateInterval / 1000}s
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-4 lg:mt-0">
            <div className={`p-3 rounded-lg ${theme.success} text-center`}>
              <div className="text-2xl font-bold">{marketStats.gainers}</div>
              <div className="text-xs">Gainers</div>
            </div>
            <div className={`p-3 rounded-lg ${theme.danger} text-center`}>
              <div className="text-2xl font-bold">{marketStats.losers}</div>
              <div className="text-xs">Losers</div>
            </div>
            <div className={`p-3 rounded-lg ${theme.warning} text-center`}>
              <div className="text-lg font-bold">{formatNumber(marketStats.totalMarketCap)}</div>
              <div className="text-xs">Total Cap</div>
            </div>
          </div>
        </div>

        {/* Enhanced Stock Grid */}
        <div className={`grid gap-4 ${isMobileDevice ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'} ${isMobileDevice ? 'gap-3' : 'gap-6'}`}>
          {filteredStocks.map(stock => {
            // Calculate percentage from first price of the day (12:00 AM)
            const dayStartPrice = (stock.history && stock.history.length > 0) ? stock.history[0].price : stock.open;
            const priceChange = stock.price - dayStartPrice;
            const percentChange = ((priceChange / dayStartPrice) * 100).toFixed(2);
            const userHolding = user && users[user] ? (users[user].portfolio?.[stock.ticker] || 0) : 0;
            const volume = Math.floor((stock.marketCap / stock.price) * (0.5 + Math.sin(Date.now() / 86400000 + stock.ticker.charCodeAt(0)) * 0.3 + 0.7));

            return (
              <div
                key={`${stock.ticker}-${stock.price}`}
                className={`group relative ${isMobileDevice ? 'p-4' : 'p-6'} rounded-2xl border-2 ${cardClass} cursor-pointer hover:shadow-2xl ${isMobileDevice ? 'hover:scale-[1.01]' : 'hover:scale-[1.02]'} transition-all duration-300 ${percentChange >= 0 ? 'hover:border-green-400 hover:shadow-green-100' : 'hover:border-red-400 hover:shadow-red-100'
                  } ${userHolding > 0 ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}`}
                onClick={() => setSelectedStock(stock)}
              >
                {/* Stock Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold group-hover:text-blue-600 transition-colors">{stock.name}</h3>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" title="Live Trading"></div>
                        {userHolding > 0 && (
                          <div className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-bold">
                            {userHolding} shares
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-blue-600 font-bold text-lg">{stock.ticker}</span>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
                        Vol: {formatNumber(volume)}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
                        P/E: {stock.pe?.toFixed(1) || 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-blue-600 mb-1">{formatCurrency(stock.price)}</p>
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold shadow-lg ${percentChange >= 0
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                      : 'bg-gradient-to-r from-red-500 to-rose-500 text-white'
                      }`}>
                      {percentChange >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                      {percentChange >= 0 ? '+' : ''}{percentChange}%
                    </div>
                  </div>
                </div>

                {/* Enhanced Mini Chart */}
                <div className="mb-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-3">
                  <ResponsiveContainer width="100%" height={isMobileDevice ? 120 : 180} key={`${stock.ticker}-${stock.price}-${(stock.history || []).length}`}>
                    <AreaChart data={stock.history && stock.history.length > 0 ? stock.history : generatePriceHistory(stock.open ?? stock.price, stock.price, stock.ticker)}>
                      <defs>
                        <linearGradient id={`gradient-${stock.ticker}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#E5E7EB'} />
                      <XAxis
                        dataKey="time"
                        stroke={darkMode ? '#9CA3AF' : '#6B7280'}
                        fontSize={10}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        stroke={darkMode ? '#9CA3AF' : '#6B7280'}
                        fontSize={10}
                        domain={getChartDomain(stock.history && stock.history.length > 0 ? stock.history : generatePriceHistory(stock.open ?? stock.price, stock.price, stock.ticker))}
                        type="number"
                        tickFormatter={(value) => `$${value.toFixed(0)}`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: darkMode ? '#1F2937' : '#FFFFFF',
                          border: 'none',
                          borderRadius: '8px',
                          boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                        }}
                        formatter={(value) => [`$${value.toFixed(2)}`, 'Price']}
                      />
                      <Area
                        type="monotone"
                        dataKey="price"
                        stroke="#3B82F6"
                        strokeWidth={2}
                        fill={`url(#gradient-${stock.ticker})`}
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Enhanced Stock Metrics */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        High:
                      </span>
                      <span className="font-bold text-green-600">{formatCurrency(stock.high)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                        <TrendingDown className="w-3 h-3" />
                        Low:
                      </span>
                      <span className="font-bold text-red-600">{formatCurrency(stock.low)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        Dividend:
                      </span>
                      <span className="font-bold">{stock.dividend?.toFixed(2) || '0.00'}%</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                        <BarChart3 className="w-3 h-3" />
                        Cap:
                      </span>
                      <span className="font-bold">{formatNumber(stock.marketCap)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">52W:</span>
                      <span className="font-bold text-xs">
                        {formatCurrency(stock.low52w || stock.price * 0.8)} - {formatCurrency(stock.high52w || stock.price * 1.2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Open:</span>
                      <span className="font-bold">{formatCurrency(stock.open)}</span>
                    </div>
                  </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="mt-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedStock(stock);
                    }}
                    className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    View Details
                  </button>
                  {user && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedStock(stock);
                        setBuyQuantity('1');
                      }}
                      className="flex-1 bg-green-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                    >
                      Quick Buy
                    </button>
                  )}
                </div>

                {/* Hover Effect Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ATLStockExchange;
