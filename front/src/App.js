import './App.css';
import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [open, setOpen] = useState(false);
  const [accountNumber, setAccountNumber] = useState('');
  const [pin, setPin] = useState('');
  const [sessionToken, setSessionToken] = useState('');
  const [error, setError] = useState('');
  const [accountDetails, setAccountDetails] = useState(null);

  const handleLogin = async () => {
    console.log("Login button clicked");
    try {
      const response = await axios.put('http://localhost:8082/client/loginaccount', {
        AccountNumber: accountNumber,
        Pin: pin
      });
      setSessionToken(response.data["your token"]);
      setOpen(true);
      setError('');
    } catch (err) {
      console.log("Error:",'Login failed');
      setError(  err.response?.data || 'Login failed');
      setError(typeof err.response?.data === 'object' ? JSON.stringify("Account Number Can Not Be String") : err.response?.data || 'Login failed');
    }
  };
  const getAccountDetails = async () => {
    try {
      console.log("getAccountDetails button clicked");
      console.log("sessiontoken", sessionToken);
      console.log(accountNumber, pin);
      const response = await axios.get('http://localhost:8082/client/getAccount/detail', {
        headers: { Authorization: `Bearer ${sessionToken}` },
        params: { AccountNumber: accountNumber, Pin: pin }, // Use params instead of data
      });
      console.log("Response:", response.data);
      setAccountDetails(response.data);
      setError('');
    } catch (err) {
      console.log("Error Fetching Account Details:", err.response?.data || 'Failed to fetch account details');
      setError(err.response?.data || 'Failed to fetch account details');
    }
  };
const handleDeposit = async () => {
    const amount = prompt("Enter amount to deposit:");
    if (!isNaN(amount) && amount > 0) {
        try {
            await axios.put('http://localhost:8082/client/deposit', {
                AccountNumber: accountNumber,
                Amount: parseInt(amount)
            });
            alert("Amount credited successfully!");
            setError('');
        } catch (err) {
            setError(err.response?.data || 'Deposit failed');
            alert(err.response?.data || 'Deposit failed');
        }
    } else {
        alert("Please enter a valid amount.");
    }
};
const handleTransfer = async () => {
  const transferTo = prompt("Account Number:");
  const amount = prompt("Enter Amount:");
  const pin = prompt("Enter your PIN:");

  // Validate amount input
  const parsedAmount = parseInt(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert("Please enter a valid amount greater than zero.");
      return; // Exit the function if the amount is invalid
  }

  // Validate account number and PIN input
  if (!transferTo || !pin) {
      alert("Please provide both recipient account number and your PIN.");
      return; // Exit the function if either input is missing
  }

  try {
      const response = await axios.put('http://localhost:8082/client/Transfer/amount', {
          From: accountNumber,  // Current account number
          To: transferTo,
          Amount: parsedAmount,
          Pin: pin
      }, { headers: { Authorization: `Bearer ${sessionToken}` } });

      alert(response.data); // Display success message from the server
  } catch (err) {
      // Log the error response for debugging
      console.error("Transfer error:", err.response);
      const errorMessage = err.response?.data || 'Transfer failed';
      setError(errorMessage); // Set error message in state
      alert(errorMessage); // Display error message to user
  }
};
const handleWithdraw = async () => {
    const amount = prompt("Enter amount:");
    if (!isNaN(amount) && amount > 0) {
        try {
            const response = await axios.put('http://localhost:8082/client/withdraw/Amount', {
                AccountNumber: accountNumber,
                Amount: parseInt(amount),
                Pin: pin
            }, { headers: { Authorization: `Bearer ${sessionToken}` } });

            alert(response.data); // Display success message from the server
        } catch (err) {
            setError(err.response?.data || 'Withdrawal failed'); // Set error message
        }
    } else {
        alert("Please enter a valid amount greater than zero.");
    }
};

const handleLofout = async () =>{
  try {
      setOpen(false);
  } catch (err) {
      setError(err.response?.data || 'Logout failed');
  }
}
  return (
    <>
    <div className="App">
      {open ? (
        <div className="AccountPage">
          {/* Account actions */}
          <button onClick={getAccountDetails}>View Account Details</button>
          <button onClick={handleDeposit}>Deposit</button>
          <button onClick={handleTransfer}>Transfer</button>
          <button onClick={handleWithdraw}>Withdraw</button>
          {accountDetails && (
            <div>
              <h3>Account Details</h3>
              <p>Account Name: {accountDetails["Account Namee"]}</p>
              <p>Account Number: {accountDetails["Account Number"]}</p>
              <p>Balance: {accountDetails.Amount}</p>
            </div>
          )}
          <br/><button onClick={handleLofout}>Logout</button>
        </div>
      ) : (
        <div className="loginPage">
          <input type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="Account Number"/><br/>
          <input type="password" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="PIN"/><br/>
          <button type="button" onClick={handleLogin}>Login</button>
          <p style={{ color: 'red' }}>{error}</p>
        </div>
      )}
    </div>
    </>
  );
}

export default App;
