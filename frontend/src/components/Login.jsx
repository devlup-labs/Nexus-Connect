import React, { useState } from 'react';
import './Login.css';
import { FiUser, FiLock } from 'react-icons/fi';
import nebulaBg from '../assets/background.jpg';
import { login } from '../api';

const Login = ({ onAuth, onSwitchToSignup }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(email, password);
      onAuth(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="desktop-fullscreen-bg"
      style={{ backgroundImage: `url(${nebulaBg})` }}
    >
      <div className="center-login-card">
        <h2>LOGIN</h2>

        {error && (
          <div style={{
            color: '#ef4444',
            fontSize: '13px',
            marginBottom: '12px',
            padding: '8px 12px',
            background: 'rgba(239, 68, 68, 0.1)',
            borderRadius: '8px',
            border: '1px solid rgba(239, 68, 68, 0.3)'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="input-container">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <FiUser className="input-icon" />
          </div>

          <div className="input-container">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <FiLock className="input-icon" />
          </div>

          <button type="submit" className="login-submit-btn" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="bottom-links-container">
          <span>Forgot Password?</span>
          <span onClick={onSwitchToSignup} style={{ cursor: 'pointer' }}>Create Account</span>
        </div>
      </div>
    </div>
  );
};

export default Login;