import React from 'react';
import './signup.css';

const Signup = () => {
  return (
    <div className="signup-container">
      <div className="signup-glass-card">
        <h1>SIGN UP</h1>
        
        <form className="signup-form">
          <div className="input-group">
            <input type="email" placeholder="Email" required />
            <span className="icon">✉</span>
          </div>
          
          <div className="input-group">
            <input type="text" placeholder="Username" required />
            <span className="icon">👤</span>
          </div>
          
          <div className="input-group">
            <input type="password" placeholder="Password" required />
            <span className="icon">🔒</span>
          </div>
          
          <div className="input-group">
            <input type="password" placeholder="Confirm Password" required />
            <span className="icon">🔒</span>
          </div>

          <button type="submit" className="create-btn">Create Account</button>
        </form>

        <p className="footer-text">
          Already have an account? <span className="sign-in-link">Sign In</span>
        </p>
      </div>
    </div>
  );
};

export default Signup;