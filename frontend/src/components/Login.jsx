import React, { useState } from 'react';
import './Login.css';
import { FiUser, FiLock } from 'react-icons/fi';
import nebulaBg from '../assets/background.jpg'; 

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div 
      className="desktop-fullscreen-bg" 
      style={{ backgroundImage: `url(${nebulaBg})` }}
    >
      <div className="center-login-card">
        <h2>LOGIN</h2>
        
        <form onSubmit={(e) => e.preventDefault()}>
          <div className="input-container">
            <input 
              type="text" 
              placeholder="Username" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
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

          <button type="submit" className="login-submit-btn">Sign In</button>
        </form>

        <div className="bottom-links-container">
          <span>Forgot Password?</span>
          <span>Create Account</span>
        </div>
      </div>
    </div>
  );
};

export default Login;