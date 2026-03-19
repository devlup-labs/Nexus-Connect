import React, { useState } from 'react';
import { Mail, User, Lock } from 'lucide-react';
import './signup.css';
import { signup } from '../api';

const Signup = ({ onAuth, onSwitchToLogin }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const res = await signup(fullName, email, password);
      onAuth(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">
      <div className="auth-card-nexus">
        <h1 className="nexus-title">SIGN UP</h1>

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

        <form className="auth-form" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} onSubmit={handleSignup}>
          <div className="input-group-nexus">
            <input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
            <User size={18} className="input-icon" />
          </div>

          <div className="input-group-nexus">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Mail size={18} className="input-icon" />
          </div>

          <div className="input-group-nexus">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Lock size={18} className="input-icon" />
          </div>

          <div className="input-group-nexus">
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <Lock size={18} className="input-icon" />
          </div>

          <button type="submit" className="nexus-btn" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="footer-text">
          Already have an account?{' '}
          <span className="teal-link" onClick={onSwitchToLogin} style={{ cursor: 'pointer' }}>
            Sign In
          </span>
        </p>
      </div>
    </div>
  );
};

export default Signup;