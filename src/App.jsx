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
