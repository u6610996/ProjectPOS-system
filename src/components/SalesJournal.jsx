import React, { useState } from 'react';
import { CATEGORY_DISPLAY } from '../constants';

export default function SalesJournal({ transactions, setTransactions, products }) {
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
