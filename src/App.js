import React, { useState, useEffect } from 'react';
import { ArrowLeft, Menu, X, Moon, Sun, LogOut } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { database } from './firebase';
import { ref, set, onValue, update } from 'firebase/database';

const ATLStockExchange = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
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
  const [tradingHistory, setTradingHistory] = useState([]); // User's trading history

  useEffect(() => {
    const stocksRef = ref(database, 'stocks');
    const usersRef = ref(database, 'users');
    const marketStateRef = ref(database, 'marketState');

    onValue(stocksRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setStocks(data);
      } else if (!initialized) {
        const initialStocks = [
          { ticker: 'GCO', name: 'Georgia Commerce', price: 342.18, open: 342.18, high: 345.60, low: 340.00, marketCap: 520000000000, pe: 31.45, high52w: 365.00, low52w: 280.00, dividend: 1.20, qtrlyDiv: 0.30, history: generatePriceHistory(342.18), extendedHistory: generateExtendedHistory(342.18), yearHistory: generateYearHistory(342.18) },
          { ticker: 'GFI', name: 'Georgia Financial Inc', price: 248.02, open: 248.02, high: 253.38, low: 247.27, marketCap: 374000000000, pe: 38.35, high52w: 260.09, low52w: 169.21, dividend: 0.41, qtrlyDiv: 0.26, history: generatePriceHistory(248.02), extendedHistory: generateExtendedHistory(248.02), yearHistory: generateYearHistory(248.02) },
          { ticker: 'SAV', name: 'Savannah Shipping', price: 203.89, open: 203.89, high: 206.50, low: 202.00, marketCap: 312000000000, pe: 35.20, high52w: 225.00, low52w: 175.00, dividend: 0.85, qtrlyDiv: 0.21, history: generatePriceHistory(203.89), extendedHistory: generateExtendedHistory(203.89), yearHistory: generateYearHistory(203.89) },
          { ticker: 'ATL', name: 'Atlanta Tech Corp', price: 156.75, open: 156.75, high: 159.20, low: 155.30, marketCap: 250000000000, pe: 42.15, high52w: 180.50, low52w: 120.00, dividend: 0.15, qtrlyDiv: 0.10, history: generatePriceHistory(156.75), extendedHistory: generateExtendedHistory(156.75), yearHistory: generateYearHistory(156.75) },
          { ticker: 'RED', name: 'Red Clay Industries', price: 127.54, open: 127.54, high: 130.20, low: 126.00, marketCap: 198000000000, pe: 25.67, high52w: 145.30, low52w: 95.00, dividend: 0.50, qtrlyDiv: 0.13, history: generatePriceHistory(127.54), extendedHistory: generateExtendedHistory(127.54), yearHistory: generateYearHistory(127.54) },
          { ticker: 'PEA', name: 'Peach Energy Group', price: 89.43, open: 89.43, high: 91.80, low: 88.50, marketCap: 145000000000, pe: 28.90, high52w: 98.20, low52w: 65.30, dividend: 0.75, qtrlyDiv: 0.19, history: generatePriceHistory(89.43), extendedHistory: generateExtendedHistory(89.43), yearHistory: generateYearHistory(89.43) },
          { ticker: 'COL', name: 'Columbus Manufacturing', price: 112.34, open: 112.34, high: 115.60, low: 111.00, marketCap: 175000000000, pe: 22.15, high52w: 130.00, low52w: 85.00, dividend: 1.50, qtrlyDiv: 0.38, history: generatePriceHistory(112.34), extendedHistory: generateExtendedHistory(112.34), yearHistory: generateYearHistory(112.34) },
          { ticker: 'AUG', name: 'Augusta Pharmaceuticals', price: 78.92, open: 78.92, high: 81.20, low: 77.50, marketCap: 125000000000, pe: 52.30, high52w: 92.50, low52w: 58.00, dividend: 0.0, qtrlyDiv: 0.0, history: generatePriceHistory(78.92), extendedHistory: generateExtendedHistory(78.92), yearHistory: generateYearHistory(78.92) },
        ];
        set(stocksRef, initialStocks);
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
  }, [initialized]);

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

  // Force chart updates when stocks change
  useEffect(() => {
    setChartKey(prev => prev + 1);
  }, [stocks]);

  // Market controller system - ensures only one tab controls price updates
  useEffect(() => {
    const controllerRef = ref(database, 'marketController');
    const sessionId = Date.now() + Math.random();
    let retryTimeout = null;
    
    // Try to become the market controller
    const becomeController = () => {
      set(controllerRef, { 
        sessionId, 
        timestamp: Date.now(),
        user: user || 'anonymous'
      }).catch(() => {
        // If we can't become controller, retry after a delay
        retryTimeout = setTimeout(becomeController, 2000);
      });
    };
    
    becomeController();
    
    // Heartbeat to maintain control
    const heartbeat = setInterval(() => {
      if (isMarketController) {
        update(controllerRef, { timestamp: Date.now() });
      }
    }, 5000);
    
    // Listen for controller changes
    const unsubscribe = onValue(controllerRef, (snapshot) => {
      const data = snapshot.val();
      if (data && data.sessionId === sessionId) {
        setIsMarketController(true);
      } else {
        setIsMarketController(false);
      }
    });
    
    return () => {
      clearInterval(heartbeat);
      if (retryTimeout) clearTimeout(retryTimeout);
      unsubscribe();
    };
  }, [user, isMarketController]);

  useEffect(() => {
    if (stocks.length === 0) return;
    
    // Only run price updates if this tab is the market controller AND market is running
    if (!isMarketController || !marketRunning) return;
    
    const interval = setInterval(() => {
      const now = new Date();
      const dayStartTime = new Date();
      dayStartTime.setHours(0, 0, 0, 0);
      
      const updatedStocks = stocks.map(stock => {
        const change = (Math.random() - 0.5) * 0.3;
        // Allow price to move more freely from current price, not just bounded by opening price
        // This prevents purchase-induced price changes from being immediately reverted
        const newPrice = Math.max(stock.price * 0.995, Math.min(stock.price * 1.005, stock.price + change));
        const newPrice2 = parseFloat(newPrice.toFixed(2));
        
        const newHigh = Math.max(stock.high, newPrice2);
        const newLow = Math.min(stock.low, newPrice2);
        
        const newHistory = [...stock.history];
        const elapsedMs = now - dayStartTime;
        
        // Rolling update system: update last point every 5 seconds, add new point every 2 minutes
        const elapsed2Min = Math.floor(elapsedMs / 120000);
        const expectedPoints2Min = elapsed2Min + 1;
        
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
        
        // Round minutes to nearest 5 for cleaner display
        const roundedMin = Math.floor(min / 5) * 5;
        const displayMin = roundedMin.toString().padStart(2, '0');
        const timeLabel = `${displayHour}:${displayMin} ${ampm}`;
        
        if (newHistory.length < expectedPoints2Min) {
          // Add new data point every 2 minutes
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
    }, updateSpeed); // Use configurable update speed
    
    return () => clearInterval(interval);
  }, [stocks, updateSpeed, isMarketController, marketRunning]);

  function generatePriceHistory(basePrice) {
    const data = [];
    let price = basePrice;
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const now = new Date();
    const msFromMidnight = now - startOfDay;
    const minutesFromMidnight = Math.floor(msFromMidnight / 60000);
    
    for (let i = 0; i <= minutesFromMidnight; i++) {
      const change = (Math.random() - 0.5) * 0.4;
      price = Math.max(basePrice * 0.98, Math.min(basePrice * 1.02, price + change));
      const pointTime = new Date(startOfDay.getTime() + i * 60 * 1000);
      const hour = pointTime.getHours();
      const min = pointTime.getMinutes().toString().padStart(2,'0');
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

  function generateExtendedHistory(basePrice) {
    const data = [];
    let price = basePrice * (0.95 + Math.random() * 0.10); // Start closer to base price
    
    // Generate 7 days of data with 4-hour intervals
    for (let day = 0; day < 7; day++) {
      for (let period = 0; period < 6; period++) {
        // More realistic price movement with trend
        const trend = (Math.random() - 0.5) * 0.02; // Small trend component
        const volatility = (Math.random() - 0.5) * 0.04; // 4% volatility
        const change = trend + volatility;
        price = price * (1 + change);
        
        // Keep price within reasonable bounds
        price = Math.max(basePrice * 0.85, Math.min(basePrice * 1.15, price));
        
        const date = new Date();
        date.setDate(date.getDate() - (7 - day));
        date.setHours(9 + period * 4); // Market hours: 9 AM to 9 PM
        const dateStr = `${(date.getMonth()+1).toString().padStart(2,'0')}/${date.getDate().toString().padStart(2,'0')} ${(9 + period * 4).toString().padStart(2,'0')}:00`;
        
        data.push({ time: dateStr, price: parseFloat(price.toFixed(2)) });
      }
    }
    return data;
  }

  function generateYearHistory(basePrice) {
    const data = [];
    let price = basePrice * (0.90 + Math.random() * 0.20); // Start closer to base price
    
    // Generate 12 months of data with weekly intervals
    for (let month = 0; month < 12; month++) {
      for (let week = 0; week < 4; week++) {
        // Add seasonal trends and realistic volatility
        const seasonalTrend = Math.sin((month * 4 + week) * Math.PI / 24) * 0.01; // Small seasonal component
        const randomChange = (Math.random() - 0.5) * 0.06; // 6% volatility
        const change = seasonalTrend + randomChange;
        price = price * (1 + change);
        
        // Keep within reasonable bounds
        price = Math.max(basePrice * 0.60, Math.min(basePrice * 1.60, price));
        
        const date = new Date();
        date.setMonth(date.getMonth() - (12 - month));
        date.setDate(1 + week * 7);
        const dateStr = `${(date.getMonth()+1).toString().padStart(2,'0')}/${date.getDate().toString().padStart(2,'0')}`;
        
        data.push({ time: dateStr, price: parseFloat(price.toFixed(2)) });
      }
    }
    return data;
  }

  // New function to generate minute-by-minute data for short timeframes
  function generateMinuteHistory(basePrice, minutes) {
    const data = [];
    let price = basePrice;
    const now = new Date();
    const startTime = new Date(now.getTime() - minutes * 60 * 1000);
    
    for (let i = 0; i <= minutes; i++) {
      const change = (Math.random() - 0.5) * 0.02; // Smaller changes for minute data
      price = Math.max(basePrice * 0.99, Math.min(basePrice * 1.01, price + change));
      
      const pointTime = new Date(startTime.getTime() + i * 60 * 1000);
      const hour = pointTime.getHours();
      const min = pointTime.getMinutes().toString().padStart(2,'0');
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

  // Function to filter data based on timeframe
  function getFilteredChartData(stockData, period) {
    const now = new Date();
    let data = [];
    
    switch(period) {
      case '1m':
        data = generateMinuteHistory(stockData.price, 1);
        break;
      case '5m':
        data = generateMinuteHistory(stockData.price, 5);
        break;
      case '15m':
        data = generateMinuteHistory(stockData.price, 15);
        break;
      case '30m':
        data = generateMinuteHistory(stockData.price, 30);
        break;
      case '1h':
        data = generateMinuteHistory(stockData.price, 60);
        break;
      case '4h':
        data = generateMinuteHistory(stockData.price, 240);
        break;
      case '1d':
        data = stockData.history || [];
        break;
      case '1w':
        data = stockData.extendedHistory || [];
        break;
      case '1M':
        data = stockData.extendedHistory || [];
        break;
      case '3M':
        // Generate 3 months of data
        data = generateThreeMonthHistory(stockData.price);
        break;
      case '6M':
        // Generate 6 months of data
        data = generateSixMonthHistory(stockData.price);
        break;
      case '1y':
        data = stockData.yearHistory || [];
        break;
      default:
        data = stockData.history || [];
    }
    
    return data;
  }

  // Generate 3 months of data
  function generateThreeMonthHistory(basePrice) {
    const data = [];
    let price = basePrice * (0.95 + Math.random() * 0.10);
    
    for (let month = 0; month < 3; month++) {
      for (let week = 0; week < 4; week++) {
        const trend = (Math.random() - 0.5) * 0.03;
        const volatility = (Math.random() - 0.5) * 0.05;
        const change = trend + volatility;
        price = price * (1 + change);
        
        price = Math.max(basePrice * 0.80, Math.min(basePrice * 1.30, price));
        
        const date = new Date();
        date.setMonth(date.getMonth() - (3 - month));
        date.setDate(1 + week * 7);
        const dateStr = `${(date.getMonth()+1).toString().padStart(2,'0')}/${date.getDate().toString().padStart(2,'0')}`;
        
        data.push({ time: dateStr, price: parseFloat(price.toFixed(2)) });
      }
    }
    return data;
  }

  // Generate 6 months of data
  function generateSixMonthHistory(basePrice) {
    const data = [];
    let price = basePrice * (0.90 + Math.random() * 0.20);
    
    for (let month = 0; month < 6; month++) {
      for (let week = 0; week < 4; week++) {
        const trend = (Math.random() - 0.5) * 0.025;
        const volatility = (Math.random() - 0.5) * 0.04;
        const change = trend + volatility;
        price = price * (1 + change);
        
        price = Math.max(basePrice * 0.70, Math.min(basePrice * 1.40, price));
        
        const date = new Date();
        date.setMonth(date.getMonth() - (6 - month));
        date.setDate(1 + week * 7);
        const dateStr = `${(date.getMonth()+1).toString().padStart(2,'0')}/${date.getDate().toString().padStart(2,'0')}`;
        
        data.push({ time: dateStr, price: parseFloat(price.toFixed(2)) });
      }
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
      const date = new Date();
      date.setDate(date.getDate() - day);
      const dateStr = `${(date.getMonth()+1).toString().padStart(2,'0')}/${date.getDate().toString().padStart(2,'0')}`;
      
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
      setUser('admin');
      setIsAdmin(true);
      setShowLoginModal(false);
      setLoginUsername('');
      setLoginPassword('');
    } else if (users[loginUsername] && users[loginUsername].password === loginPassword) {
      setUser(loginUsername);
      setIsAdmin(false);
      setShowLoginModal(false);
      setLoginUsername('');
      setLoginPassword('');
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

  const buyStock = () => {
    if (!selectedStock || !buyQuantity) return;
    const quantity = parseInt(buyQuantity);
    const cost = selectedStock.price * quantity;
    if (users[user].balance >= cost) {
      const userRef = ref(database, `users/${user}`);
      const newBalance = users[user].balance - cost;
      const newPortfolio = { 
        ...users[user].portfolio, 
        [selectedStock.ticker]: (users[user].portfolio[selectedStock.ticker] || 0) + quantity
      };
      update(userRef, { balance: newBalance, portfolio: newPortfolio });
      
      // Calculate price impact based on market cap (real-world model)
      // Price impact = (purchase value / market cap) as percentage increase
      const purchaseValue = cost;
      const priceImpactPercent = (purchaseValue / selectedStock.marketCap) * 100;
      const priceImpact = (priceImpactPercent / 100) * selectedStock.price;
      const newPrice = parseFloat((selectedStock.price + priceImpact).toFixed(2));
      
      // Update stock price based on purchase
      const updatedStocks = stocks.map(s => {
        if (s.ticker === selectedStock.ticker) {
          const newHigh = Math.max(s.high, newPrice);
          const newLow = Math.min(s.low, newPrice);
          const sharesOutstanding = s.marketCap / s.price;
          const newMarketCap = sharesOutstanding * newPrice;
          return { ...s, price: newPrice, high: newHigh, low: newLow, marketCap: newMarketCap };
        }
        return s;
      });
      
      const stocksRef = ref(database, 'stocks');
      set(stocksRef, updatedStocks);
      
      // Record trade in history
      const tradeRecord = {
        timestamp: Date.now(),
        type: 'buy',
        ticker: selectedStock.ticker,
        quantity: quantity,
        price: selectedStock.price,
        total: cost,
        newPrice: newPrice,
        priceImpact: priceImpact
      };
      const historyRef = ref(database, `tradingHistory/${user}/${Date.now()}`);
      set(historyRef, tradeRecord);
      
      setBuyQuantity('');
    }
  };

  const sellStock = () => {
    if (!selectedStock || !sellQuantity) return;
    const quantity = parseInt(sellQuantity);
    if ((users[user].portfolio[selectedStock.ticker] || 0) >= quantity) {
      const proceeds = selectedStock.price * quantity;
      const userRef = ref(database, `users/${user}`);
      const newBalance = users[user].balance + proceeds;
      const newPortfolio = { 
        ...users[user].portfolio, 
        [selectedStock.ticker]: users[user].portfolio[selectedStock.ticker] - quantity
      };
      update(userRef, { balance: newBalance, portfolio: newPortfolio });
      
      // Calculate price impact based on market cap
      const saleValue = proceeds;
      const priceImpactPercent = (saleValue / selectedStock.marketCap) * 100;
      const priceImpact = -(priceImpactPercent / 100) * selectedStock.price;
      const newPrice = parseFloat((selectedStock.price + priceImpact).toFixed(2));
      
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
          return { ...s, price: newPrice, high: newHigh, low: newLow, marketCap: newMarketCap };
        }
        return s;
      });
      
      const stocksRef = ref(database, 'stocks');
      set(stocksRef, updatedStocks);
      setSellQuantity('');
    }
  };

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
      history: generatePriceHistory(parseFloat(newStockPrice)),
      extendedHistory: generateExtendedHistory(parseFloat(newStockPrice)),
      yearHistory: generateYearHistory(parseFloat(newStockPrice))
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

  const getFilteredStocks = () => {
    let filtered = stocks;
    
    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        s.ticker.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Filter by stock filter (price range, market cap, etc)
    if (stockFilter === 'under100') filtered = filtered.filter(s => s.price < 100);
    if (stockFilter === '100to500') filtered = filtered.filter(s => s.price >= 100 && s.price < 500);
    if (stockFilter === 'over500') filtered = filtered.filter(s => s.price >= 500);
    if (stockFilter === 'largecap') filtered = filtered.filter(s => s.marketCap > 400000000000);
    if (stockFilter === 'midcap') filtered = filtered.filter(s => s.marketCap >= 200000000000 && s.marketCap <= 400000000000);
    if (stockFilter === 'smallcap') filtered = filtered.filter(s => s.marketCap < 200000000000);
    
    // Sort by market cap if no search
    if (!searchQuery) filtered.sort((a, b) => b.marketCap - a.marketCap);
    
    return filtered.slice(0, 10);
  };

  const filteredStocks = getFilteredStocks();

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

  if (selectedStock) {
    const stockData = stocks.find(s => s.ticker === selectedStock.ticker);
    
    // Show loading screen if data isn't ready yet
    if (!stockData || stocks.length === 0) {
      return (
        <div className={`min-h-screen ${bgClass} flex items-center justify-center`}>
          <div className="text-center">
            <p className="text-lg">Loading...</p>
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
            <button onClick={() => setSelectedStock(null)} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">Back</button>
          </div>
        </div>
      );
    }
    
    const userHolding = user ? (users[user]?.portfolio[selectedStock.ticker] || 0) : 0;
    const portfolioValue = userHolding * stockData.price;
    const priceChange = stockData.price - stockData.open;
    const percentChange = ((priceChange / stockData.open) * 100).toFixed(2);
    const percentChangeColor = percentChange >= 0 ? 'text-green-600' : 'text-red-600';
    
    // Use the new filtered chart data function
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
                {['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w', '1M', '3M', '6M', '1y'].map(period => (
                  <button key={period} onClick={() => setChartPeriod(period)} className={`px-3 py-1 rounded text-sm ${chartPeriod === period ? 'bg-blue-600 text-white' : darkMode ? 'bg-gray-700 text-gray-100 hover:bg-gray-600' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'}`}>{period}</button>
                ))}
              </div>

              {chartData && chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400} key={`${stockData.ticker}-${chartKey}`}>
                  <LineChart data={chartData}>
                    <CartesianGrid stroke={darkMode ? '#444' : '#ccc'} />
                    <XAxis dataKey="time" stroke={darkMode ? '#999' : '#666'} angle={-45} textAnchor="end" height={80} interval={Math.max(0, Math.floor(chartData.length / 6))} />
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
        <h1 className="text-xl font-bold">Atlanta Stock Exchange</h1>
        <div className="flex items-center gap-2 md:gap-4">
          <input type="text" placeholder="Search stocks..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="px-3 py-1 rounded text-gray-900 text-sm" />
          {user && users[user] && <span className="text-sm">${(users[user].balance).toFixed(2)}</span>}
          <button onClick={() => setDarkMode(!darkMode)} className="p-2 hover:bg-blue-700 rounded text-white">
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          {isAdmin && <span className="bg-red-600 px-2 py-1 rounded text-xs hidden md:inline">ADMIN</span>}
          {isAdmin && isMarketController && <span className="bg-green-600 px-2 py-1 rounded text-xs hidden md:inline">MARKET CONTROLLER</span>}
          <span className={`px-2 py-1 rounded text-xs hidden md:inline ${marketRunning ? 'bg-green-600' : 'bg-red-600'}`}>
            MARKET {marketRunning ? 'RUNNING' : 'STOPPED'}
          </span>
          {user ? (
            <button onClick={handleLogout} className="p-2 hover:bg-blue-700 rounded text-white hidden md:inline-block"><LogOut className="w-5 h-5" /></button>
          ) : (
            <button onClick={() => setShowLoginModal(true)} className="px-3 py-1 bg-white text-blue-600 rounded font-bold hover:bg-gray-200 text-sm">Login</button>
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
            <input type="password" placeholder="Password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className={`w-full p-2 mb-4 border rounded ${inputClass}`} />
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
                  Current: {updateSpeed}ms ({1000/updateSpeed}x speed)
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
                  Current: {chartUpdateSpeed}ms - Updates last chart point every {chartUpdateSpeed/1000}s
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
                          { ticker: 'GCO', name: 'Georgia Commerce', price: 342.18, open: 342.18, high: 345.60, low: 340.00, marketCap: 520000000000, pe: 31.45, high52w: 365.00, low52w: 280.00, dividend: 1.20, qtrlyDiv: 0.30, history: generatePriceHistory(342.18), extendedHistory: generateExtendedHistory(342.18), yearHistory: generateYearHistory(342.18) },
                          { ticker: 'GFI', name: 'Georgia Financial Inc', price: 248.02, open: 248.02, high: 253.38, low: 247.27, marketCap: 374000000000, pe: 38.35, high52w: 260.09, low52w: 169.21, dividend: 0.41, qtrlyDiv: 0.26, history: generatePriceHistory(248.02), extendedHistory: generateExtendedHistory(248.02), yearHistory: generateYearHistory(248.02) },
                          { ticker: 'SAV', name: 'Savannah Shipping', price: 203.89, open: 203.89, high: 206.50, low: 202.00, marketCap: 312000000000, pe: 35.20, high52w: 225.00, low52w: 175.00, dividend: 0.85, qtrlyDiv: 0.21, history: generatePriceHistory(203.89), extendedHistory: generateExtendedHistory(203.89), yearHistory: generateYearHistory(203.89) },
                          { ticker: 'ATL', name: 'Atlanta Tech Corp', price: 156.75, open: 156.75, high: 159.20, low: 155.30, marketCap: 250000000000, pe: 42.15, high52w: 180.50, low52w: 120.00, dividend: 0.15, qtrlyDiv: 0.10, history: generatePriceHistory(156.75), extendedHistory: generateExtendedHistory(156.75), yearHistory: generateYearHistory(156.75) },
                          { ticker: 'RED', name: 'Red Clay Industries', price: 127.54, open: 127.54, high: 130.20, low: 126.00, marketCap: 198000000000, pe: 25.67, high52w: 145.30, low52w: 95.00, dividend: 0.50, qtrlyDiv: 0.13, history: generatePriceHistory(127.54), extendedHistory: generateExtendedHistory(127.54), yearHistory: generateYearHistory(127.54) },
                          { ticker: 'PEA', name: 'Peach Energy Group', price: 89.43, open: 89.43, high: 91.80, low: 88.50, marketCap: 145000000000, pe: 28.90, high52w: 98.20, low52w: 65.30, dividend: 0.75, qtrlyDiv: 0.19, history: generatePriceHistory(89.43), extendedHistory: generateExtendedHistory(89.43), yearHistory: generateYearHistory(89.43) },
                          { ticker: 'COL', name: 'Columbus Manufacturing', price: 112.34, open: 112.34, high: 115.60, low: 111.00, marketCap: 175000000000, pe: 22.15, high52w: 130.00, low52w: 85.00, dividend: 1.50, qtrlyDiv: 0.38, history: generatePriceHistory(112.34), extendedHistory: generateExtendedHistory(112.34), yearHistory: generateYearHistory(112.34) },
                          { ticker: 'AUG', name: 'Augusta Pharmaceuticals', price: 78.92, open: 78.92, high: 81.20, low: 77.50, marketCap: 125000000000, pe: 52.30, high52w: 92.50, low52w: 58.00, dividend: 0.0, qtrlyDiv: 0.0, history: generatePriceHistory(78.92), extendedHistory: generateExtendedHistory(78.92), yearHistory: generateYearHistory(78.92) },
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

      <div className="max-w-7xl mx-auto p-4">
        <div className="mb-6 bg-blue-600 text-white p-4 rounded-lg">
          <h3 className="font-bold mb-2">How to Buy/Sell</h3>
          <p className="text-sm">1. Click "Login" button in top right and sign in (demo/demo or admin/admin)</p>
          <p className="text-sm">2. Click on any stock to view details</p>
          <p className="text-sm">3. Enter quantity and click Buy or Sell</p>
          <p className="text-sm">4. Use the moon/sun icon to toggle dark mode</p>
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
            <h2 className="text-2xl font-bold mb-4">My Portfolio</h2>
            
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
                    
                    // Calculate average cost (simplified - in real app this would track actual purchase prices)
                    const avgCost = stock.price * (0.95 + Math.random() * 0.1);
                    const currentValue = qty * stock.price;
                    const totalCost = qty * avgCost;
                    const pnl = currentValue - totalCost;
                    const pnlPercent = ((pnl / totalCost) * 100);
                    
                    // Calculate % of portfolio
                    const totalPortfolioValue = (users[user]?.balance || 0) + Object.entries(users[user]?.portfolio || {}).reduce((sum, [t, q]) => {
                      const s = stocks.find(st => st.ticker === t);
                      return sum + (q * (s?.price || 0));
                    }, 0);
                    const portfolioPercent = (currentValue / totalPortfolioValue) * 100;
                    
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
                        <td className="p-2">{new Date(trade.timestamp).toLocaleString()}</td>
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

        <h2 className="text-2xl font-bold mb-4">Browse Stocks</h2>
        <div className="mb-4 flex gap-2 flex-wrap">
          <button onClick={() => setStockFilter('')} className={`px-3 py-1 rounded ${stockFilter === '' ? 'bg-blue-600 text-white' : darkMode ? 'bg-gray-700 text-gray-100 hover:bg-gray-600' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'}`}>All</button>
          <button onClick={() => setStockFilter('under100')} className={`px-3 py-1 rounded ${stockFilter === 'under100' ? 'bg-blue-600 text-white' : darkMode ? 'bg-gray-700 text-gray-100 hover:bg-gray-600' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'}`}>Under $100</button>
          <button onClick={() => setStockFilter('100to500')} className={`px-3 py-1 rounded ${stockFilter === '100to500' ? 'bg-blue-600 text-white' : darkMode ? 'bg-gray-700 text-gray-100 hover:bg-gray-600' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'}`}>$100-$500</button>
          <button onClick={() => setStockFilter('over500')} className={`px-3 py-1 rounded ${stockFilter === 'over500' ? 'bg-blue-600 text-white' : darkMode ? 'bg-gray-700 text-gray-100 hover:bg-gray-600' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'}`}>Over $500</button>
          <button onClick={() => setStockFilter('largecap')} className={`px-3 py-1 rounded ${stockFilter === 'largecap' ? 'bg-blue-600 text-white' : darkMode ? 'bg-gray-700 text-gray-100 hover:bg-gray-600' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'}`}>Large Cap</button>
          <button onClick={() => setStockFilter('midcap')} className={`px-3 py-1 rounded ${stockFilter === 'midcap' ? 'bg-blue-600 text-white' : darkMode ? 'bg-gray-700 text-gray-100 hover:bg-gray-600' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'}`}>Mid Cap</button>
          <button onClick={() => setStockFilter('smallcap')} className={`px-3 py-1 rounded ${stockFilter === 'smallcap' ? 'bg-blue-600 text-white' : darkMode ? 'bg-gray-700 text-gray-100 hover:bg-gray-600' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'}`}>Small Cap</button>
        </div>
        <h2 className="text-2xl font-bold mb-4">Top Stocks {searchQuery && `- Search: ${searchQuery}`}</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredStocks.map(stock => {
            const priceChange = stock.price - stock.open;
            const percentChange = ((priceChange / stock.open) * 100).toFixed(2);
            const percentChangeColor = percentChange >= 0 ? 'text-green-600' : 'text-red-600';
            
            return (
              <div key={stock.ticker} onClick={() => setSelectedStock(stock)} className={`p-6 rounded-lg border-2 ${cardClass} cursor-pointer hover:shadow-lg transition-shadow`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold">{stock.name}</h3>
                    <p className="text-blue-600 font-bold text-sm">{stock.ticker}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">${stock.price.toFixed(2)}</p>
                    <p className={`text-lg font-bold ${percentChangeColor}`}>{percentChange >= 0 ? '+' : ''}{percentChange}%</p>
                  </div>
                </div>
                
                <ResponsiveContainer width="100%" height={200} key={`${stock.ticker}-list-${chartKey}`}>
                  <LineChart data={stock.history}>
                    <CartesianGrid stroke={darkMode ? '#444' : '#ccc'} />
                    <XAxis dataKey="time" stroke={darkMode ? '#999' : '#666'} fontSize={12} interval={Math.max(0, Math.floor(stock.history.length / 8))} />
                    <YAxis stroke={darkMode ? '#999' : '#666'} fontSize={12} domain={getChartDomain(stock.history)} type="number" ticks={getYAxisTicks(getChartDomain(stock.history))} />
                    <Line type="monotone" dataKey="price" stroke="#2563eb" dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>

                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <div><span className="opacity-75">High:</span> <span className="font-bold">${stock.high.toFixed(2)}</span></div>
                  <div><span className="opacity-75">Low:</span> <span className="font-bold">${stock.low.toFixed(2)}</span></div>
                  <div><span className="opacity-75">Market Cap:</span> <span className="font-bold">${(stock.marketCap / 1000000000).toFixed(2)}B</span></div>
                  <div><span className="opacity-75">P/E:</span> <span className="font-bold">{stock.pe.toFixed(2)}</span></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Force rebuild - all confirm() calls fixed
export default ATLStockExchange;
