import React, { useState } from 'react';
import './Login.css';
import { FiUser, FiLock } from 'react-icons/fi';
import nebulaBg from '../assets/background.jpg'; 

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className="desktop-view-container" style={{ backgroundImage: `url(${nebulaBg})` }}>
      <div className="horizontal-login-box">
        
        {/* Left Side: Branding/Identity */}
        <div className="side-panel-info">
          <div className="logo-area">
            <h1>NEXUS</h1>
            <p>CONNECTING THE FUTURE</p>
          </div>
        </div>

        {/* Right Side: Login Interaction */}
        <div className="side-panel-form">
          <h2>LOGIN</h2>
          <form onSubmit={(e) => e.preventDefault()}>
            <div className="desktop-input-group">
              <input 
                type="text" 
                placeholder="Username" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                required 
              />
              <FiUser className="input-icon" />
            </div>
            
            <div className="desktop-input-group">
              <input 
                type="password" 
                placeholder="Password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
              <FiLock className="input-icon" />
            </div>

            <button type="submit" className="desktop-signin-btn">Sign In</button>
          </form>

          <div className="desktop-links-row">
            <span>Forgot Password?</span>
            <span>Create Account</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;