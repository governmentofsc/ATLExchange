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
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [initialized, setInitialized] = useState(false);

  // Initialize Firebase data on first load
  useEffect(() => {
    const stocksRef = ref(database, 'stocks');
    const usersRef = ref(database, 'users');
    const speedRef = ref(database, 'speedMultiplier');

    // Listen to stocks
    onValue(stocksRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setStocks(data);
      } else if (!initialized) {
        // Initialize with default stocks on first run
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

    // Listen to users
    onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setUsers(data);
      } else if (!initialized) {
        // Initialize with default users
        const initialUsers = {
          'demo': { password: 'demo', balance: 100000, portfolio: { GFI: 10, ATL: 5 } },
          'admin': { password: 'admin', balance: 1000000, portfolio: {} }
        };
        set(usersRef, initialUsers);
      }
    });

    // Listen to speed multiplier
    onValue(speedRef, (snapshot) => {
      const data = snapshot.val();
      if (data !== null) {
        setSpeedMultiplier(data);
      } else if (!initialized) {
        set(speedRef, 1);
      }
    });

    setInitialized(true);
  }, [initialized]);

  // ONLY update stock prices if you're admin - this prevents conflicts
  useEffect(() => {
    if (stocks.length === 0 || !isAdmin) return;
    
    const interval = setInterval(() => {
      const now = new Date();
      const dayStartTime = new Date();
      dayStartTime.setHours(0, 0, 0, 0);
      
      const updatedStocks = stocks.map(stock => {
        const change = (Math.random() - 0.5) * 0.3;
        const newPrice = Math.max(stock.open * 0.98, Math.min(stock.open * 1.02, stock.price + change));
        const newPrice2 = parseFloat(newPrice.toFixed(2));
        
        const newHigh = Math.max(stock.high, newPrice2);
        const newLow = Math.min(stock.low, newPrice2);
        
        const newHistory = [...stock.history];
        const elapsedMs = now - dayStartTime;
        const elapsedMinutes = Math.floor(elapsedMs / 60000);
        const expectedPoints = elapsedMinutes + 1;
        
        if (newHistory.length < expectedPoints) {
          const hour = now.getHours();
          const min = now.getMinutes().toString().padStart(2,'0');
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
          
          newHistory.push({ time: `${displayHour}:${min} ${ampm}`, price: newPrice2 });
        }
        
        const sharesOutstanding = stock.marketCap / stock.price;
        const newMarketCap = Math.max(50000000000, Math.min(1000000000000, sharesOutstanding * newPrice2));
        
        return { ...stock, price: newPrice2, high: newHigh, low: newLow, history: newHistory, marketCap: newMarketCap };
      });
      
      // Update Firebase
      const stocksRef = ref(database, 'stocks');
      set(stocksRef, updatedStocks);
    }, 2000 / speedMultiplier);
    
    return () => clearInterval(interval);
  }, [stocks, speedMultiplier, isAdmin]);

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
    let price = basePrice * 0.92;
    
    for (let day = 0; day < 7; day++) {
      const growth = (day / 7) * 0.08;
      const dayPrice = price * (1 + growth);
      price = dayPrice + (Math.random() - 0.5) * dayPrice * 0.03;
      
      const date = new Date();
      date.setDate(date.getDate() - (7 - day));
      date.setHours(0, 0, 0, 0);
      const dateStr = `${(date.getMonth()+1).toString().padStart(2,'0')}/${date.getDate().toString().padStart(2,'0')}`;
      
      data.push({ time: dateStr, price: parseFloat(price.toFixed(2)) });
    }
    return data;
  }

  function generateYearHistory(basePrice) {
    const data = [];
    let price = basePrice * 0.85;
    
    for (let day = 0; day < 60; day++) {
      const growth = (day / 60) * 0.15;
      const dayPrice = (basePrice * 0.85) * (1 + growth);
      price = dayPrice + (Math.random() - 0.5) * dayPrice * 0.03;
      
      const date = new Date();
      date.setDate(date.getDate() - (60 - day));
      date.setHours(0, 0, 0, 0);
      const dateStr = `${(date.getMonth()+1).toString().padStart(2,'0')}/${date.getDate().toString().padStart(2,'0')}`;
      
      data.push({ time: dateStr, price: parseFloat(price.toFixed(2)) });
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
    const cost = selectedStock.price * parseInt(buyQuantity);
    if (users[user].balance >= cost) {
      const userRef = ref(database, `users/${user}`);
      const newBalance = users[user].balance - cost;
      const newPortfolio = { 
        ...users[user].portfolio, 
        [selectedStock.ticker]: (users[user].portfolio[selectedStock.ticker] || 0) + parseInt(buyQuantity) 
      };
      update(userRef, { balance: newBalance, portfolio: newPortfolio });
      setBuyQuantity('');
    }
  };

  const sellStock = () => {
    if (!selectedStock || !sellQuantity) return;
    if ((users[user].portfolio[selectedStock.ticker] || 0) >= parseInt(sellQuantity)) {
      const proceeds = selectedStock.price * parseInt(sellQuantity);
      const userRef = ref(database, `users/${user}`);
      const newBalance = users[user].balance + proceeds;
      const newPortfolio = { 
        ...users[user].portfolio, 
        [selectedStock.ticker]: users[user].portfolio[selectedStock.ticker] - parseInt(sellQuantity) 
      };
      update(userRef, { balance: newBalance, portfolio: newPortfolio });
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
        const newMarketCap = Math.max(50000000000, Math.min(1000000000000, sharesOutstanding * newPrice));
        return { ...s, price: newPrice, high: newHigh, low: newLow, marketCap: newMarketCap };
      }
      return s;
    });
    
    const stocksRef = ref(database, 'stocks');
    set(stocksRef, updatedStocks);
    setPriceAdjustment('');
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
        const newMarketCap = Math.max(50000000000, Math.min(1000000000000, sharesOutstanding * newPrice));
        return { ...s, price: newPrice, high: newHigh, low: newLow, marketCap: newMarketCap };
      }
      return s;
    });
    
    const stocksRef = ref(database, 'stocks');
    set(stocksRef, updatedStocks);
    setPricePercentage('');
  };

  const adjustMoneySetter = () => {
    if (!targetUser || !adjustMoney) return;
    
    const userRef = ref(database, `users/${targetUser}`);
    const newBalance = users[targetUser].balance + parseFloat(adjustMoney);
    update(userRef, { balance: newBalance });
    
    setAdjustMoney('');
    setTargetUser('');
  };

  const updateSpeedMultiplier = (newSpeed) => {
    const speedRef = ref(database, 'speedMultiplier');
    set(speedRef, newSpeed);
  };

  const getFilteredStocks = () => {
    if (!searchQuery) return stocks.slice(0, 5).sort((a, b) => b.marketCap - a.marketCap);
    return stocks.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.ticker.toLowerCase().includes(searchQuery.toLowerCase()));
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

  const bgClass = darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900';
  const cardClass = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-blue-50 border-blue-200';
  const inputClass = darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300';

  if (selectedStock) {
    const stockData = stocks.find(s => s.ticker === selectedStock.ticker);
    if (!stockData) return null;
    
    const userHolding = user ? (users[user]?.portfolio[selectedStock.ticker] || 0) : 0;
    const portfolioValue = userHolding * stockData.price;
    const priceChange = stockData.price - stockData.open;
    const percentChange = ((priceChange / stockData.open) * 100).toFixed(2);
    const percentChangeColor = percentChange >= 0 ? 'text-green-600' : 'text-red-600';
    
    let chartData;
    if (chartPeriod === '1d') {
      chartData = stockData.history;
    } else if (chartPeriod === '1w') {
      chartData = stockData.extendedHistory;
    } else if (chartPeriod === '1m') {
      chartData = stockData.extendedHistory;
    } else if (chartPeriod === '1y') {
      chartData = stockData.yearHistory;
    } else {
      chartData = stockData.history;
    }
    const chartDomain = getChartDomain(chartData);

    return (
      <div className={`min-h-screen ${bgClass}`}>
        <div className="bg-blue-600 text-white p-4 flex justify-between items-center sticky top-0 z-50">
          <button onClick={() => setSelectedStock(null)} className="flex items-center gap-2 hover:opacity-80">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-bold">Atlanta Stock Exchange</span>
          </button>
          <button onClick={() => setDarkMode(!darkMode)} className="p-2">
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>

        <div className="max-w-7xl mx-auto p-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <div className={`lg:col-span-2 p-6 rounded-lg border-2 ${cardClass}`}>
              <h2 className="text-2xl font-bold mb-2">{stockData.name} ({stockData.ticker})</h2>
              <div className="flex items-baseline gap-3 mb-4">
                <p className="text-3xl font-bold text-blue-600">${stockData.price.toFixed(2)}</p>
                <p className={`text-lg font-bold ${percentChangeColor}`}>{percentChange >= 0 ? '+' : ''}{percentChange}%</p>
              </div>
              
              <div className="mb-4 flex gap-2">
                {['1d', '1w', '1m', '1y'].map(period => (
                  <button key={period} onClick={() => setChartPeriod(period)} className={`px-3 py-1 rounded ${chartPeriod === period ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-900'}`}>{period.toUpperCase()}</button>
                ))}
              </div>

              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData}>
                  <CartesianGrid stroke={darkMode ? '#444' : '#ccc'} />
                  <XAxis dataKey="time" stroke={darkMode ? '#999' : '#666'} angle={-45} textAnchor="end" height={80} />
                  <YAxis stroke={darkMode ? '#999' : '#666'} domain={chartDomain} type="number" ticks={getYAxisTicks(chartDomain)} />
                  <Tooltip contentStyle={{ backgroundColor: darkMode ? '#444' : '#fff', border: `1px solid ${darkMode ? '#666' : '#ccc'}` }} />
                  <Line type="monotone" dataKey="price" stroke="#2563eb" dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
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
                {user && (
                  <>
                    <div className="border-t pt-3 flex justify-between"><span>Your Holdings:</span><span className="font-bold">{userHolding} shares</span></div>
                    <div className="flex justify-between"><span>Portfolio Value:</span><span className="font-bold">${portfolioValue.toFixed(2)}</span></div>
                  </>
                )}
              </div>
            </div>
          </div>

          {user && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
            </div>
          )}
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
          <button onClick={() => setAdminTab('speed')} className={`px-4 py-2 rounded ${adminTab === 'speed' ? 'bg-white text-blue-600' : ''}`}>Market Speed</button>
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

      {isAdmin && adminTab === 'speed' && (
        <div className="max-w-7xl mx-auto p-4">
          <div className={`p-6 rounded-lg border-2 ${cardClass}`}>
            <h2 className="text-xl font-bold mb-4">Market Speed Modifier</h2>
            <p className="mb-4">Current Speed: <span className="font-bold text-blue-600">{speedMultiplier}x</span></p>
            <input type="range" min="0.1" max="1000" step="0.1" value={speedMultiplier} onChange={(e) => updateSpeedMultiplier(parseFloat(e.target.value))} className="w-full mb-4" />
            <div className="flex gap-2 mb-4 flex-wrap">
              <button onClick={() => updateSpeedMultiplier(1)} className="px-4 py-2 bg-gray-400 text-white rounded font-bold hover:bg-gray-500">1x (Normal)</button>
              <button onClick={() => updateSpeedMultiplier(2)} className="px-4 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700">2x</button>
              <button onClick={() => updateSpeedMultiplier(5)} className="px-4 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700">5x</button>
              <button onClick={() => updateSpeedMultiplier(10)} className="px-4 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700">10x</button>
              <button onClick={() => updateSpeedMultiplier(50)} className="px-4 py-2 bg-orange-600 text-white rounded font-bold hover:bg-orange-700">50x</button>
              <button onClick={() => updateSpeedMultiplier(100)} className="px-4 py-2 bg-red-600 text-white rounded font-bold hover:bg-red-700">100x</button>
              <button onClick={() => updateSpeedMultiplier(1000)} className="px-4 py-2 bg-purple-600 text-white rounded font-bold hover:bg-purple-700">1000x</button>
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
                
                <ResponsiveContainer width="100%" height={200}>
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

export default ATLStockExchange;
