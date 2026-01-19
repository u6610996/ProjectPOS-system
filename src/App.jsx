import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import productsData from './pos_item.json';

// Custom hook for localStorage
const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
};

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#E74C3C', '#9B59B6'];

const CATEGORY_DISPLAY = {
  'stationary': 'Stationery',
  'small_it_gadgets': 'IT Gadgets',
  'snacks': 'Snacks',
  'consumer_products': 'Consumer Products',
  'simple_medicines': 'Medicines'
};

export default function POSSystem() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [transactions, setTransactions] = useLocalStorage('pos_transactions', []);
  const [products] = useState(productsData.map((item, index) => ({
    id: index + 1,
    name: item.itemName,
    category: item.category,
    description: item.description,
    price: item.unitPrice,
    inventory: item.inventory
  })));
  const [periodFilter, setPeriodFilter] = useState('daily');

  // Calculate statistics
  const stats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());

    const totalSales = transactions.reduce((sum, t) => sum + t.total, 0);
    
    const periodTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      if (periodFilter === 'daily') return date >= today;
      if (periodFilter === 'weekly') return date >= weekAgo;
      if (periodFilter === 'monthly') return date >= monthAgo;
      return true;
    });

    const periodSales = periodTransactions.reduce((sum, t) => sum + t.total, 0);

    // Sales by product
    const salesByProduct = {};
    transactions.forEach(t => {
      if (!salesByProduct[t.productName]) {
        salesByProduct[t.productName] = { quantity: 0, revenue: 0 };
      }
      salesByProduct[t.productName].quantity += t.quantity;
      salesByProduct[t.productName].revenue += t.total;
    });

    // Sales by category
    const salesByCategory = {};
    transactions.forEach(t => {
      const category = t.category;
      salesByCategory[category] = (salesByCategory[category] || 0) + t.total;
    });

    // Daily sales for line chart (last 30 days)
    const dailySales = {};
    const last30Days = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      last30Days.push(dateStr);
      dailySales[dateStr] = 0;
    }

    transactions.forEach(t => {
      const date = t.date;
      if (dailySales.hasOwnProperty(date)) {
        dailySales[date] += t.total;
      }
    });

    const lineChartData = last30Days.map(date => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      sales: dailySales[date]
    }));

    // Category sales for bar chart
    const barChartData = Object.entries(salesByCategory).map(([category, value]) => ({
      category: CATEGORY_DISPLAY[category] || category,
      sales: value
    }));

    // Pie chart data
    const pieData = Object.entries(salesByCategory).map(([category, value]) => ({
      name: CATEGORY_DISPLAY[category] || category,
      value
    }));

    const topProducts = Object.entries(salesByProduct)
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 5)
      .map(([name, data]) => ({ name, ...data }));

    return {
      totalSales,
      periodSales,
      salesByProduct,
      salesByCategory,
      lineChartData,
      barChartData,
      pieData,
      topProducts,
      transactionCount: transactions.length
    };
  }, [transactions, periodFilter]);

  return (
    <div className="app">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Poppins', sans-serif;
          background: #0f172a;
          min-height: 100vh;
        }

        .app {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          position: relative;
        }

        .app::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.08) 0%, transparent 50%);
          pointer-events: none;
        }

        .navbar {
          background: rgba(15, 23, 42, 0.8);
          backdrop-filter: blur(20px);
          padding: 1.5rem 2rem;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          position: sticky;
          top: 0;
          z-index: 100;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .nav-content {
          max-width: 1400px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .logo {
          font-size: 2rem;
          font-weight: 800;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-family: 'JetBrains Mono', monospace;
          letter-spacing: -2px;
          text-shadow: 0 0 30px rgba(102, 126, 234, 0.5);
        }

        .nav-buttons {
          display: flex;
          gap: 1rem;
        }

        .nav-btn {
          padding: 0.875rem 2rem;
          border: 2px solid rgba(255, 255, 255, 0.2);
          background: transparent;
          color: white;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          border-radius: 12px;
          transition: all 0.3s ease;
          font-family: 'Poppins', sans-serif;
          position: relative;
          overflow: hidden;
        }

        .nav-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          transition: left 0.3s ease;
          z-index: -1;
        }

        .nav-btn:hover::before {
          left: 0;
        }

        .nav-btn:hover {
          border-color: transparent;
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
        }

        .nav-btn.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-color: transparent;
          box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
        }

        .container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 2.5rem 2rem;
          position: relative;
          z-index: 1;
        }

        .dashboard {
          animation: fadeInUp 0.6s ease;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2.5rem;
        }

        .stat-card {
          background: rgba(255, 255, 255, 0.95);
          padding: 2rem;
          border-radius: 24px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 5px;
          background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
        }

        .stat-card:hover {
          transform: translateY(-10px) scale(1.02);
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.3);
        }

        .stat-label {
          color: #64748b;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          margin-bottom: 0.75rem;
          font-weight: 600;
        }

        .stat-value {
          font-size: 3rem;
          font-weight: 800;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-family: 'JetBrains Mono', monospace;
          line-height: 1.2;
        }

        .period-filter {
          display: flex;
          gap: 0.75rem;
          margin-bottom: 2.5rem;
          background: rgba(255, 255, 255, 0.95);
          padding: 0.75rem;
          border-radius: 16px;
          width: fit-content;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .filter-btn {
          padding: 0.875rem 1.75rem;
          border: none;
          background: transparent;
          color: #64748b;
          font-weight: 600;
          cursor: pointer;
          border-radius: 12px;
          transition: all 0.3s ease;
          font-family: 'Poppins', sans-serif;
          font-size: 0.95rem;
        }

        .filter-btn.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }

        .charts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(550px, 1fr));
          gap: 2rem;
          margin-bottom: 2.5rem;
        }

        .chart-card {
          background: rgba(255, 255, 255, 0.95);
          padding: 2.5rem;
          border-radius: 24px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          transition: all 0.3s ease;
        }

        .chart-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 25px 70px rgba(0, 0, 0, 0.25);
        }

        .chart-title {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 2rem;
          color: #1e293b;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .chart-title::before {
          content: '';
          width: 5px;
          height: 30px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 10px;
        }

        .top-products {
          background: rgba(255, 255, 255, 0.95);
          padding: 2.5rem;
          border-radius: 24px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .product-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.25rem 1.5rem;
          margin-bottom: 1rem;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          border-radius: 16px;
          transition: all 0.3s ease;
          border: 1px solid rgba(0, 0, 0, 0.05);
        }

        .product-item:hover {
          transform: translateX(10px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
          background: linear-gradient(135deg, #fff 0%, #f1f5f9 100%);
        }

        .product-name {
          font-weight: 600;
          color: #1e293b;
          font-size: 1.05rem;
        }

        .product-sales {
          font-weight: 700;
          color: #667eea;
          font-family: 'JetBrains Mono', monospace;
          font-size: 1.1rem;
        }

        .sales-journal {
          animation: fadeInUp 0.6s ease;
        }

        .form-card {
          background: rgba(255, 255, 255, 0.95);
          padding: 2.5rem;
          border-radius: 24px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
          margin-bottom: 2.5rem;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .form-title {
          font-size: 1.75rem;
          font-weight: 700;
          margin-bottom: 2rem;
          color: #1e293b;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .form-title::before {
          content: '';
          width: 5px;
          height: 35px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 10px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-label {
          font-weight: 600;
          margin-bottom: 0.75rem;
          color: #334155;
          font-size: 0.95rem;
          letter-spacing: 0.3px;
        }

        .form-input,
        .form-select {
          padding: 1rem 1.25rem;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          font-size: 1rem;
          transition: all 0.3s ease;
          font-family: 'Poppins', sans-serif;
          background: white;
        }

        .form-input:focus,
        .form-select:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
        }

        .submit-btn {
          padding: 1.125rem 3rem;
          border: none;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          font-size: 1.1rem;
          font-weight: 700;
          border-radius: 14px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
          font-family: 'Poppins', sans-serif;
          letter-spacing: 0.5px;
        }

        .submit-btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 15px 40px rgba(102, 126, 234, 0.5);
        }

        .submit-btn:active {
          transform: translateY(-1px);
        }

        .transactions-table {
          background: rgba(255, 255, 255, 0.95);
          padding: 2.5rem;
          border-radius: 24px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
          overflow-x: auto;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 1.25rem 1.5rem;
          text-align: left;
          font-weight: 600;
          text-transform: uppercase;
          font-size: 0.85rem;
          letter-spacing: 1.2px;
        }

        th:first-child {
          border-top-left-radius: 12px;
        }

        th:last-child {
          border-top-right-radius: 12px;
        }

        td {
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid #f1f5f9;
          color: #475569;
          font-size: 0.95rem;
        }

        tr:hover {
          background: #f8fafc;
        }

        tr:last-child td {
          border-bottom: none;
        }

        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          color: #64748b;
        }

        .empty-icon {
          font-size: 5rem;
          margin-bottom: 1.5rem;
          opacity: 0.6;
        }

        .empty-text {
          font-size: 1.25rem;
          font-weight: 500;
        }

        @media (max-width: 768px) {
          .charts-grid {
            grid-template-columns: 1fr;
          }
          
          .nav-content {
            flex-direction: column;
            gap: 1.5rem;
          }

          .stat-value {
            font-size: 2.25rem;
          }

          .chart-card {
            padding: 1.5rem;
          }
        }
      `}</style>

      <nav className="navbar">
        <div className="nav-content">
          <div className="logo">ProjectPOS</div>
          <div className="nav-buttons">
            <button 
              className={`nav-btn ${currentPage === 'dashboard' ? 'active' : ''}`}
              onClick={() => setCurrentPage('dashboard')}
            >
              📊 Dashboard
            </button>
            <button 
              className={`nav-btn ${currentPage === 'sales' ? 'active' : ''}`}
              onClick={() => setCurrentPage('sales')}
            >
              📝 Sales Journal
            </button>
          </div>
        </div>
      </nav>

      <div className="container">
        {currentPage === 'dashboard' ? (
          <Dashboard 
            stats={stats} 
            periodFilter={periodFilter}
            setPeriodFilter={setPeriodFilter}
          />
        ) : (
          <SalesJournal 
            transactions={transactions}
            setTransactions={setTransactions}
            products={products}
          />
        )}
      </div>
    </div>
  );
}

function Dashboard({ stats, periodFilter, setPeriodFilter }) {
  return (
    <div className="dashboard">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Sales (All Time)</div>
          <div className="stat-value">฿{stats.totalSales.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Period Sales</div>
          <div className="stat-value">฿{stats.periodSales.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Transactions</div>
          <div className="stat-value">{stats.transactionCount}</div>
        </div>
      </div>

      <div className="period-filter">
        <button 
          className={`filter-btn ${periodFilter === 'daily' ? 'active' : ''}`}
          onClick={() => setPeriodFilter('daily')}
        >
          📅 Daily
        </button>
        <button 
          className={`filter-btn ${periodFilter === 'weekly' ? 'active' : ''}`}
          onClick={() => setPeriodFilter('weekly')}
        >
          📆 Weekly
        </button>
        <button 
          className={`filter-btn ${periodFilter === 'monthly' ? 'active' : ''}`}
          onClick={() => setPeriodFilter('monthly')}
        >
          📊 Monthly
        </button>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-title">📈 Sales Trend (Last 30 Days)</div>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={stats.lineChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="date" 
                stroke="#64748b" 
                style={{ fontSize: '0.85rem' }}
              />
              <YAxis 
                stroke="#64748b" 
                style={{ fontSize: '0.85rem' }}
              />
              <Tooltip 
                contentStyle={{ 
                  background: 'rgba(255, 255, 255, 0.95)', 
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="sales" 
                stroke="#667eea" 
                strokeWidth={3}
                dot={{ fill: '#667eea', r: 5 }}
                activeDot={{ r: 7 }}
                name="Sales (฿)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-title">📊 Sales by Category</div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={stats.barChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="category" 
                stroke="#64748b"
                style={{ fontSize: '0.8rem' }}
                angle={-15}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                stroke="#64748b"
                style={{ fontSize: '0.85rem' }}
              />
              <Tooltip 
                contentStyle={{ 
                  background: 'rgba(255, 255, 255, 0.95)', 
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
                }}
              />
              <Legend />
              <Bar 
                dataKey="sales" 
                fill="#667eea"
                name="Sales (฿)"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-title">🥧 Category Distribution</div>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={stats.pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={110}
                fill="#8884d8"
                dataKey="value"
              >
                {stats.pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  background: 'rgba(255, 255, 255, 0.95)', 
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="top-products">
          <div className="chart-title">🏆 Top 5 Best-Selling Items</div>
          {stats.topProducts.length > 0 ? (
            stats.topProducts.map((product, index) => (
              <div key={index} className="product-item">
                <span className="product-name">
                  {index + 1}. {product.name} ({product.quantity} sold)
                </span>
                <span className="product-sales">฿{product.revenue.toLocaleString()}</span>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📊</div>
              <div className="empty-text">No sales data available</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SalesJournal({ transactions, setTransactions, products }) {
  const [formData, setFormData] = useState({
    productId: '',
    quantity: 1,
    date: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const product = products.find(p => p.id === parseInt(formData.productId));
    if (!product) return;

    const total = product.price * formData.quantity;
    
    const newTransaction = {
      id: Date.now(),
      productId: product.id,
      productName: product.name,
      category: product.category,
      quantity: parseInt(formData.quantity),
      price: product.price,
      total,
      date: formData.date,
      timestamp: new Date().toISOString()
    };

    setTransactions([newTransaction, ...transactions]);
    
    setFormData({
      productId: '',
      quantity: 1,
      date: new Date().toISOString().split('T')[0]
    });
  };

  const selectedProduct = products.find(p => p.id === parseInt(formData.productId));
  const totalPrice = selectedProduct ? selectedProduct.price * formData.quantity : 0;

  return (
    <div className="sales-journal">
      <div className="form-card">
        <div className="form-title">💰 Record New Sale</div>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Product</label>
              <select
                className="form-select"
                value={formData.productId}
                onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                required
              >
                <option value="">Select a product</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name} - ฿{product.price}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Quantity</label>
              <input
                type="number"
                className="form-input"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Date</label>
              <input
                type="date"
                className="form-input"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Total Price</label>
              <input
                type="text"
                className="form-input"
                value={`฿${totalPrice.toLocaleString()}`}
                readOnly
                style={{ 
                  background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', 
                  fontWeight: '700', 
                  color: '#667eea',
                  fontFamily: 'JetBrains Mono, monospace'
                }}
              />
            </div>
          </div>

          <button type="submit" className="submit-btn">
            ✓ Record Sale
          </button>
        </form>
      </div>

      <div className="transactions-table">
        <div className="chart-title">📋 Transaction History</div>
        {transactions.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Product</th>
                <th>Category</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(transaction => (
                <tr key={transaction.id}>
                  <td>{new Date(transaction.date).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })}</td>
                  <td style={{ fontWeight: '600' }}>{transaction.productName}</td>
                  <td>{CATEGORY_DISPLAY[transaction.category] || transaction.category}</td>
                  <td>{transaction.quantity}</td>
                  <td>฿{transaction.price.toLocaleString()}</td>
                  <td style={{ 
                    fontWeight: '700', 
                    color: '#667eea',
                    fontFamily: 'JetBrains Mono, monospace'
                  }}>
                    ฿{transaction.total.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <div className="empty-text">No transactions recorded yet</div>
          </div>
        )}
      </div>
    </div>
  );
}
