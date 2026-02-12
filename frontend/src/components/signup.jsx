import React from 'react';
import { Mail, User, Lock } from 'lucide-react';
import './Signup.css';

const Signup = () => {
  return (
    <div className="signup-page">
      <div className="auth-card-nexus">
        <h1 className="nexus-title">SIGN UP</h1>

        <form className="auth-form" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="input-group-nexus">
            <input type="email" placeholder="Email" required />
            <Mail size={18} className="input-icon" />
          </div>

          <div className="input-group-nexus">
            <input type="text" placeholder="Username" required />
            <User size={18} className="input-icon" />
          </div>

          <div className="input-group-nexus">
            <input type="password" placeholder="Password" required />
            <Lock size={18} className="input-icon" />
          </div>

          <div className="input-group-nexus">
            <input type="password" placeholder="Confirm Password" required />
            <Lock size={18} className="input-icon" />
          </div>

          <button type="submit" className="nexus-btn">
            Create Account
          </button>
        </form>

        <p className="footer-text">
          Already have an account? <span className="teal-link">Sign In</span>
        </p>
      </div>
    </div>
  );
};

export default Signup;