import React, { useState } from 'react';
import './Signup.css';
import bgImg from "../assets/bg.png.png";
import { MdEmail, MdPerson, MdLock } from 'react-icons/md';

const Signup = () => {
  return (
    <div 
      className="signup-container" 
      style={{ backgroundImage: `url(${bgImg})` }}
    >
      <div className="signup-box">
        <h1>SIGN UP</h1>
        
        <form className="signup-form">
          <div className="input-group">
            <input type="email" placeholder="Email" />
            <MdEmail className="icon" />
          </div>

          <div className="input-group">
            <input type="text" placeholder="Username" />
            <MdPerson className="icon" />
          </div>

          <div className="input-group">
            <input type="password" placeholder="Password" />
            <MdLock className="icon" />
          </div>

          <div className="input-group">
            <input type="password" placeholder="Confirm Password" />
            <MdLock className="icon" />
          </div>

          <button type="submit" className="create-btn">
            Create Account
          </button>
        </form>

        <p className="signin-text">
          Already have an account? <a href="#">Sign In</a>
        </p>
      </div>
    </div>
  );
};

export default Signup;