import React, { useState, useMemo } from 'react';
import Dashboard from './components/Dashboard';
import SalesJournal from './components/SalesJournal';
import { useLocalStorage } from './hooks/useLocalStorage';
import { CATEGORY_DISPLAY } from './constants';
import productsData from './pos_item.json';
import './styles/App.css';

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

  const handleDeleteTransaction = (id) => {
    if (window.confirm('Delete this transaction?')) {
      setTransactions(transactions.filter(t => t.id !== id));
    }
  };

  const stats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
    // FIX: Change 'Year Start' to 'Rolling 365 Days'
    const yearAgo = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);

    const totalSales = transactions.reduce((sum, t) => sum + t.total, 0);

    const periodTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      if (periodFilter === 'daily') return date >= today;
      if (periodFilter === 'weekly') return date >= weekAgo;
      if (periodFilter === 'monthly') return date >= monthAgo;
      if (periodFilter === 'yearly') return date >= yearAgo; // Filter now catches Dec 2025
      return true;
    });

    const periodSales = periodTransactions.reduce((sum, t) => sum + t.total, 0);

    const salesByProduct = {};
    periodTransactions.forEach(t => {
      if (!salesByProduct[t.productName]) {
        salesByProduct[t.productName] = { quantity: 0, revenue: 0 };
      }
      salesByProduct[t.productName].quantity += t.quantity;
      salesByProduct[t.productName].revenue += t.total;
    });

    const salesByCategory = {};
    periodTransactions.forEach(t => {
      const category = t.category;
      salesByCategory[category] = (salesByCategory[category] || 0) + t.total;
    });

    const daysToShow = periodFilter === 'daily' ? 1 : 
                       periodFilter === 'weekly' ? 7 : 
                       periodFilter === 'monthly' ? 30 : 365;

    const trendDataMap = {};
    const trendDates = [];
    
    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      trendDates.push(dateStr);
      trendDataMap[dateStr] = 0;
    }

    periodTransactions.forEach(t => {
      if (trendDataMap.hasOwnProperty(t.date)) {
        trendDataMap[t.date] += t.total;
      }
    });

    const lineChartData = trendDates.map(date => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      sales: trendDataMap[date]
    }));

    const barChartData = Object.entries(salesByCategory).map(([category, value]) => ({
      category: CATEGORY_DISPLAY[category] || category,
      sales: value
    }));

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
      transactionCount: periodTransactions.length
    };
  }, [transactions, periodFilter]);

  return (
    <div className="app">
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
            onDelete={handleDeleteTransaction}
          />
        )}
      </div>
    </div>
  );
}