import React from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { COLORS } from '../constants';

export default function Dashboard({ stats, periodFilter, setPeriodFilter }) {
  // Simple helper to format title based on filter
  const getFilterLabel = () => {
    const labels = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', yearly: 'Yearly' };
    return labels[periodFilter] || 'All Time';
  };

  return (
    <div className="dashboard">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Sales (All Time)</div>
          <div className="stat-value">฿{stats.totalSales.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{getFilterLabel()} Sales</div>
          <div className="stat-value">฿{stats.periodSales.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Transactions ({getFilterLabel()})</div>
          <div className="stat-value">{stats.transactionCount}</div>
        </div>
      </div>

      <div className="period-filter">
        {['daily', 'weekly', 'monthly', 'yearly'].map((p) => (
          <button
            key={p}
            className={`filter-btn ${periodFilter === p ? 'active' : ''}`}
            onClick={() => setPeriodFilter(p)}
          >
            {p === 'daily' && '📅 Daily'}
            {p === 'weekly' && '📆 Weekly'}
            {p === 'monthly' && '📊 Monthly'}
            {p === 'yearly' && '🗓️ Yearly'}
          </button>
        ))}
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-title">📈 Sales Trend - {getFilterLabel()}</div>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={stats.lineChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: '0.85rem' }} />
              <YAxis stroke="#64748b" style={{ fontSize: '0.85rem' }} />
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
          <div className="chart-title">📊 Sales by Category ({getFilterLabel()})</div>
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
              <YAxis stroke="#64748b" style={{ fontSize: '0.85rem' }} />
              <Tooltip
                contentStyle={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
                }}
              />
              <Legend />
              <Bar dataKey="sales" fill="#667eea" name="Sales (฿)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-title">🥧 Category Distribution ({getFilterLabel()})</div>
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
          <div className="chart-title">🏆 Top 5 - {getFilterLabel()}</div>
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
              <div className="empty-text">No data for this period</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}