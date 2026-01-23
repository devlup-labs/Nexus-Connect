import React, { useState } from 'react';
import './login1.css';
import { FiUser, FiLock } from 'react-icons/fi';
import nebulaBg from '../assets/background.jpg'; 

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div 
      className="desktop-page-wrapper" 
      style={{ backgroundImage: `url(${nebulaBg})` }}
    >
      <div className="horizontal-glass-card">
        {/* Left Panel: Branding Section */}
        <div className="branding-panel">
          <h1>NEXUS</h1>
          <p>The Future of Connection</p>
        </div>

        {/* Right Panel: Login Form Section */}
        <div className="form-panel">
          <h2>LOGIN</h2>
          <form onSubmit={(e) => e.preventDefault()}>
            <div className="input-row">
              <input 
                type="text" 
                placeholder="Username" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                required 
              />
              <FiUser className="row-icon" />
            </div>
            
            <div className="input-row">
              <input 
                type="password" 
                placeholder="Password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
              <FiLock className="row-icon" />
            </div>

            <button type="submit" className="desktop-btn">Sign In</button>
          </form>

          <div className="desktop-footer">
            <span>Forgot Password?</span>
            <span>Create Account</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;