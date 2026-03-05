import React, { useState } from 'react';
import './Login.css';
import { FiUser, FiLock } from 'react-icons/fi';
// This import ensures Vite finds your specific nebula image
import nebulaBg from '../assets/background.jpg'; 

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    console.log("Logged in:", { username, password });
  };

  return (
    <div 
      className="login-page-container" 
      style={{ backgroundImage: `url(${nebulaBg})` }}
    >
      <div className="glass-login-card">
        <h2>LOGIN</h2>
        <form onSubmit={handleLogin}>
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

          <button type="submit" className="sign-in-btn">Sign In</button>
        </form>

        <div className="bottom-links">
          <span>Forgot Password?</span>
          <span>Create Account</span>
        </div>
      </div>
    </div>
  );
};

export default Login;