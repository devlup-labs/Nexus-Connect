import React, { useState } from 'react';
import './Login.css';
import { FiUser, FiLock } from 'react-icons/fi'; // Feather icons match your UI perfectly

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    console.log("Login Data:", { username, password });
  };

  return (
    <div className="login-wrapper">
      <div className="glass-card">
        <h2>LOGIN</h2>
        <form onSubmit={handleLogin}>
          {/* Username Field */}
          <div className="input-field">
            <input 
              type="text" 
              placeholder="Username" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              required 
            />
            <FiUser className="field-icon" />
          </div>
          
          {/* Password Field */}
          <div className="input-field">
            <input 
              type="password" 
              placeholder="Password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
            <FiLock className="field-icon" />
          </div>

          <button type="submit" className="signin-btn">Sign In</button>
        </form>

        <div className="footer-links">
          <span>Forgot Password?</span>
          <span>Create Account</span>
        </div>
      </div>
    </div>
  );
};

export default Login;