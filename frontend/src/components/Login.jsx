import React, { useState } from 'react';
import './Login.css';
import { FiUser, FiLock } from 'react-icons/fi';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    console.log("Desktop Login Data:", { username, password });
  };

  return (
    <div className="desktop-container">
      <div className="horizontal-card">
        {/* Left Side: Branding / Background Texture */}
        <div className="brand-section">
          <h1>NEXUS</h1>
          <p>The Future of Connectivity</p>
          <div className="nebula-accent"></div>
        </div>

        {/* Right Side: The Glassmorphism Form */}
        <div className="form-section">
          <h2>LOGIN</h2>
          <form onSubmit={handleLogin}>
            <div className="input-group">
              <input 
                type="text" 
                placeholder="Username" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                required 
              />
              <FiUser className="input-icon" />
            </div>
            
            <div className="input-group">
              <input 
                type="password" 
                placeholder="Password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
              <FiLock className="input-icon" />
            </div>

            <button type="submit" className="login-button">Sign In</button>
          </form>

          <div className="links">
            <span>Forgot Password?</span>
            <span>Create Account</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;