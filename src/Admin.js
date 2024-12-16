import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import { supabase } from './createClient';

export default function Admin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState('trampoline');
  const [selectedSignature, setSelectedSignature] = useState('one');
  const [toggleState, setToggleState] = useState('true');
  const [discount, setDiscount] = useState(0);
  const [pricing, setPricing] = useState({
    trampoline: {},
    softplay: {},
    socks: {},
  });

  useEffect(() => {
    const fetchSupabase = async () => {
      const { data, error } = await supabase.from('prices').select('*');
      if (error) {
        console.error('Error fetching prices:', error);
        return;
      }
      if (!data || data.length === 0) {
        console.error('No pricing data available.');
        return;
      }
      const fetchedData = data[0].prices;
      setPricing({
        trampoline: fetchedData.trampolin || {},
        softplay: fetchedData.softplay || {},
        socks: fetchedData.socks || {},
      });
      setDiscount(fetchedData.discount)
      setToggleState(fetchedData.toggleState == false ? "false" : "true")
      setSelectedSignature(fetchedData.signatureStatus)
    };
    fetchSupabase();
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (username === 'admin' && password === 'yourpassword') {
      setIsLoggedIn(true);
    } else {
      alert('Invalid username or password');
    }
  };

  const handlePriceChange = (category, key, value) => {
    setPricing((prevPricing) => {
      if (['socks', 'trampoline', 'softplay'].includes(category)) {
        return {
          ...prevPricing,
          [category]: { ...prevPricing[category], [key]: Number(value) },
        };
      }
      return prevPricing;
    });
  };

  const handleSubmit = async () => {
    try {
      const { error } = await supabase
        .from('prices')
        .update({
          prices: {
            trampolin: pricing.trampoline,
            softplay: pricing.softplay,
            socks: pricing.socks,
            discount,
            toggleState : toggleState == "false" ? false : true,
            signatureStatus : selectedSignature,
          },
          
        })
        .eq('id', 'db474f1e-5ed7-469f-89c3-5f4552fa241f');

      if (error) throw error;
      alert('Pricing updated successfully!');
    } catch (error) {
      console.error('Error updating pricing:', error);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-sm">
          <h2 className="text-3xl font-bold text-center mb-6">Admin Login</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded focus:ring focus:ring-gray-500"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded focus:ring focus:ring-gray-500"
            />
            <button
              type="submit"
              className="w-full p-3 bg-black text-white rounded hover:bg-gray-800"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
    <div className="bg-gray-100 min-h-screen p-6">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-6">
        <h2 className="text-4xl font-bold text-center mb-6">Admin Panel</h2>

        {/* Activity Selection */}
        <div className="flex justify-around mb-6 gap-5">
          {['trampoline', 'softplay'].map((activity) => (
            <button
              key={activity}
              onClick={() => setSelectedActivity(activity)}
              className={`flex-1 p-4 text-center text-xl font-semibold rounded border-2 ${
                selectedActivity === activity
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-black border-gray-300'
              }`}
            >
              {activity.charAt(0).toUpperCase() + activity.slice(1)} Prices
            </button>
          ))}
        </div>

        {/* Pricing Inputs */}
        {selectedActivity === 'trampoline' && (
          <div className="mb-6">
            <h3 className="text-2xl font-semibold mb-4">Trampoline Prices</h3>
            <div className="grid grid-cols-2 gap-4">
              {Object.keys(pricing.trampoline).map((key) => (
                <div key={key} className="space-y-2">
                  <label className="block font-medium">{key} mins:</label>
                  <input
                    type="number"
                    value={pricing.trampoline[key]}
                    onChange={(e) =>
                      handlePriceChange('trampoline', key, e.target.value)
                    }
                    className="w-full p-2 border rounded focus:ring focus:ring-gray-500"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedActivity === 'softplay' && (
          <div className="mb-6">
            <h3 className="text-2xl font-semibold mb-4">Softplay Prices</h3>
            <div className="grid grid-cols-2 gap-4">
              {Object.keys(pricing.softplay).map((key) => (
                <div key={key} className="space-y-2">
                  <label className="block font-medium">{key} mins:</label>
                  <input
                    type="number"
                    value={pricing.softplay[key]}
                    onChange={(e) =>
                      handlePriceChange('softplay', key, e.target.value)
                    }
                    className="w-full p-2 border rounded focus:ring focus:ring-gray-500"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Socks Pricing */}
        <div className="mb-6">
          <h3 className="text-2xl font-semibold mb-4">Socks Pricing</h3>
          <div className="grid grid-cols-2 gap-4">
            {Object.keys(pricing.socks).map((size) => (
              <div key={size} className="space-y-2">
                <label className="block font-medium">{size}:</label>
                <input
                  type="number"
                  value={pricing.socks[size]}
                  onChange={(e) => handlePriceChange('socks', size, e.target.value)}
                  className="w-full p-2 border rounded focus:ring focus:ring-gray-500"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Signature Selection */}
        <div className="mb-6">
          <label className="block font-medium mb-2">Signature Selection:</label>
          <select
            value={selectedSignature}
            onChange={(e) => setSelectedSignature(e.target.value)}
            className="w-full p-2 border rounded focus:ring focus:ring-gray-500"
          >
            <option value="one">One</option>
            <option value="all">All</option>
          </select>
        </div>

        <div className='mb-6'>
      <label className="block text-gray-700 font-medium">Discount</label>
          <div style={{ display: "flex", gap: "5%" }}>
            <div style={{ flex: "1" }}>
              <input
                type="number"
                min="0"
                onWheel={(e) => e.target.blur()}
                
                value={discount}
                onChange={(e) => {
                  const updatedDiscount = parseFloat(e.target.value) || 0; // Handle invalid inputs
                  setDiscount(updatedDiscount);
                  
                }}
                className="w-full mt-2 px-4 py-2 border rounded-md focus:outline-none focus:ring focus:ring-gray-300"
              />
            </div>
            <div>
        </div>
        </div>
        </div>


        {/* Toggle State */}
        <div className="mb-6">
          <label className="block font-medium mb-2">Toggle State:</label>
          <select
            value={toggleState}
            onChange={(e) => setToggleState(e.target.value)}
            className="w-full p-2 border rounded focus:ring focus:ring-gray-500"
          >
            <option value="true">On</option>
            <option value="false">Off</option>
          </select>
        </div>

        <button
          onClick={handleSubmit}
          className="w-full p-3 bg-black text-white rounded hover:bg-gray-800"
        >
          Save Changes
        </button>
      </div>
    </div>
    </div>
  );
}
