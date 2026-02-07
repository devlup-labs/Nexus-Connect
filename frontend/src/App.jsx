import Login from './components/Login';
import Signup from './components/signup'; // Ensure this matches your filename
import { useState } from 'react';
import './App.css';

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      {/* Login is commented out so we only see Signup */}
      {/* <Login /> */} 
      
      <Signup /> 
    </>
  );
}

export default App;