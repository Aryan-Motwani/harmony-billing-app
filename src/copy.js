import React, { useEffect, useRef, useState } from 'react';
import html2canvas from 'html2canvas';

import client from './sanityClient';
import Navbar from './Navbar';
import jsPDF from 'jspdf';
import { supabase } from './createClient';

export default function Form() {
  
  const [activityType, setActivityType] = useState('Trampoline'); // Activity selection state

  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [numPeople, setNumPeople] = useState(1);
  const [people, setPeople] = useState([{ name: '', signature: 'h' }]);
  const [needsSocks, setNeedsSocks] = useState(false);
  const [socksSizes, setSocksSizes] = useState({ XS:0, S: 0, M: 0, L: 0, XL :0 });
  const [selectedDuration, setSelectedDuration] = useState('30 min');
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState('%'); // Default discount type to percentage
  const [billedBy, setBilledBy] = useState('Gulshan');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [mixPayment, setMixPayment] = useState([{ method: 'cash', amount: '' }, { method: 'cash', amount: '' }]);
  const [bill, setBill] = useState('');
  const [data, setData] = useState([]);
  const [prices, setPrices] = useState([]);
  const [error, setError] = useState(''); // Error state for mix payment validation
  const [phoneError, setPhoneError] = useState(''); // Error state for mix payment validation
  const [currTotal, setCurrTotal] = useState(0)
  const [supaPrice, setSupaPrice] = useState('')
  const [newTickets, setNewTickets] = useState([]);

  const [durationPricing, setDurationPricing] = useState({
    Trampoline: { '30 min': 0, '60 min': 0, '90 min': 0 },
    Softplay: { '30 min':0, '60 min':0, '90 min':0 },
  }); // Error state for mix payment validation
  const [socksPricing, setSocksPricing] = useState({
    Trampoline: { XS: 0, S: 0, M: 0, L: 0, XL:0 },   // prices per size
    Softplay: { XS: 0, S: 0, M: 0, L: 0, XL:0 },
  }); // Error state for mix payment validation
  const billRef = useRef(null);



  const durationPricingg = {
    Trampoline: { '30 min': 0, '60 min': 0, '90 min': 0 },
    Softplay: { '30 min':0, '60 min':0, '90 min':0 },
  }

  let socksPricingg = {
    Trampoline: { S: 20, M: 30, L: 40 },   // prices per size
    Softplay: { S: 15, M: 25, L: 35 },
  };
  

  useEffect(() => {
    const fetchData = async () => {
      try {
        const ticketsData = await client.fetch('*[_type == "ticket"]');
        setData(ticketsData);  // Set tickets data after fetching
        
        const pricesData = await client.fetch('*[_type == "price"]');
        setPrices(pricesData); // Set prices data after fetching
  
        // Now execute the additional logic with pricesData
        if (pricesData && pricesData.length > 0) {
          // socksPricing = pricesData[0]['socks'];
          console.log(pricesData);
          
          setDurationPricing({
            Trampoline: { '30 min':data[0]['trampolin'][0], '60 min':pricesData[0]['trampoline'][1], '90 min':pricesData[0]['trampoline'][1] },
            Softplay: { '30 min':pricesData[0]['softplay'], '60 min':pricesData[0]['softplay'], '90 min':pricesData[0]['softplay'] },
          })
          setSocksPricing({
            Trampoline: { XS: pricesData[0]['socks']['XS'], S: pricesData[0]['socks']['S'], M: pricesData[0]['socks']['M'], L: pricesData[0]['socks']['L'], XL:pricesData[0]['socks']['XL'] },   // prices per size
            Softplay: { XS: pricesData[0]['socks']['XS'], S: pricesData[0]['socks']['S'], M: pricesData[0]['socks']['M'], L: pricesData[0]['socks']['L'], XL:pricesData[0]['socks']['XL'] },   // prices per size
          })
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    getPrice()
    
  }, []);
  
  

  useEffect(() => {
    // Update people state when numPeople changes
    setPeople(Array.from({ length: numPeople }, (_, index) => ({ name: index === 0 ? customerName : '' })));
  }, [numPeople, customerName]);
  

  const handleNumPeopleChange = (e) => {
    const num = parseInt(e.target.value);
    setNumPeople(num);
    calculateTotal(num, selectedDuration)
  };

  const handlePersonChange = (index, value) => {
    const newPeople = [...people];
    newPeople[index].name = value; // Update the name of the specific person
    setPeople(newPeople);
  };

  const handleSocksChange = (size, value) => {
    setSocksSizes((prev) => {
        const updatedSocksSizes = { ...prev, [size]: parseInt(value) || 0 };
        calculateTotal(numPeople, selectedDuration, updatedSocksSizes);
        return updatedSocksSizes;
    });
};

  const handleMixPaymentChange = (index, field, value) => {
    const newMixPayment = [...mixPayment];
    newMixPayment[index][field] = value;
    setMixPayment(newMixPayment);
  };

  const validateSocks = () => {
    if(!needsSocks) return true
    const totalSocks = Object.values(socksSizes).reduce((a, b) => a + b, 0);
    if (totalSocks != numPeople) {
      setError(`Socks quantity does not match`);
      return false;
    }
    setError('');
    return true;
  };

  const validatePhone = () => {
    
    // const totalSocks = Object.values(socksSizes).reduce((a, b) => a + b, 0);
    if (phone.length != 9) {
      setPhoneError(`Invalid Phone Number`);
      return false;
    }
    setPhoneError('');
    return true;
  };

  const validateMixPayment = (total) => {
    const totalMixPayment = mixPayment.reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0);
    if (totalMixPayment !== total) {
      setError(`Total mix payments (${totalMixPayment} Rs) do not match the bill amount (${total} Rs).`);
      return false;
    }
    setError('');
    return true;
  };


  const getPrice = async () => {
    const { data, error } = await supabase.from('prices').select('*');

    if (error) {
        console.error("Error fetching prices:", error);
        return;
    }

    if (!data || data.length === 0) {
        console.error("No pricing data available.");
        return;
    }

    const prices = data[0]?.prices;

    setDurationPricing({
        Trampoline: { 
            '30 min': prices?.trampolin?.['30'] || 0, 
            '60 min': prices?.trampolin?.['60'] || 0, 
            '90 min': prices?.trampolin?.['90'] || 0 
        },
        Softplay: { 
            '30 min': prices?.softplay?.['30'] || 0, 
            '60 min': prices?.softplay?.['60'] || 0, 
            '90 min': prices?.softplay?.['90'] || 0 
        }
    });

    setSocksPricing({
        Trampoline: { 
            XS: prices?.socks?.XS || 0, 
            S: prices?.socks?.S || 0, 
            M: prices?.socks?.M || 0, 
            L: prices?.socks?.L || 0, 
            XL: prices?.socks?.XL || 0 
        },
        Softplay: { 
            XS: prices?.socks?.XS || 0, 
            S: prices?.socks?.S || 0, 
            M: prices?.socks?.M || 0, 
            L: prices?.socks?.L || 0, 
            XL: prices?.socks?.XL || 0 
        }
    });

    console.log("Fetched prices:", data);
};


  const handleSubmit = (e) => {
    console.log(durationPricing["Softplay"]);
    console.log(durationPricing["Trampoline"]);
    
    e.preventDefault();
    
    const packagePrice = durationPricing[activityType][selectedDuration];

    // const socksTotal = needsSocks ? numPeople * 30 : 0;
    const socksTotal = needsSocks
    ? Object.entries(socksSizes).reduce((total, [size, qty]) => {
        const costPerPair = socksPricing[activityType][size] || 0;
        return total + costPerPair * qty;
      }, 0)
    : 0;


    const discountAmount = discountType === 'Rs' ? discount : (packagePrice * numPeople + socksTotal) * (discount / 100);
    const total = packagePrice * numPeople + socksTotal - discountAmount;
    

    if (paymentMethod === 'mix' && !validateMixPayment(total)) return;
    if (!validateSocks()) return;

    const billDetails = (
      <div className='billDetails' style={{ textAlign: 'center' }}>
        <h2>Trampoline Park</h2>
        <p>Health & Harmony<br />Cidco, Aurangabad<br />Phone: +91 7888106698</p>
        <p>-------------------------------------</p>
        <table style={{ width: '100%', borderCollapse: 'collapse', opacity: 0.9 }}>
          <thead>
            <tr>
              <th style={tableHeaderStyle}>No.</th>
              <th style={tableHeaderStyle}>Item</th>
              <th style={tableHeaderStyle}>Qty</th>
              <th style={tableHeaderStyle}>Price</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={tableCellStyle}>1</td>
              <td style={tableCellStyle}>Entry</td>
              <td style={tableCellStyle}>{numPeople}</td>
              <td style={tableCellStyle}>{packagePrice * numPeople} Rs</td>
            </tr>
            {needsSocks && (
              <tr>
                <td style={tableCellStyle}></td>
                <td style={tableCellStyle}>Socks</td>
                <td style={tableCellStyle}>{numPeople}</td>
                <td style={tableCellStyle}>{socksTotal} Rs</td>
              </tr>
            )}
            <tr>
              <td style={tableCellStyle} colSpan="3">Subtotal</td>
              <td style={tableCellStyle}>{packagePrice * numPeople + socksTotal} Rs</td>
            </tr>
            <tr>
              <td style={tableCellStyle} colSpan="3">Discount</td>
              <td style={tableCellStyle}>- {discountAmount} Rs</td>
            </tr>
            <tr>
              <td style={tableCellStyle} colSpan="3"><strong>Total after Discount</strong></td>
              <td style={tableCellStyle}><strong>{total} Rs</strong></td>
            </tr>
          </tbody>
        </table>
        <p>-------------------------------------</p>
        <p>Payment Method: {paymentMethod}</p>
        {paymentMethod === 'mix' && (
          <div>
            {mixPayment.map((payment, index) => (
              <p key={index} style={{ margin: 0 }}>
                Payment {index + 1}: {payment.method} - {payment.amount} Rs
              </p>
            ))}
          </div>
        )}
      </div>
    );
    
    setBill(billDetails);
};

const tableHeaderStyle = {
  textAlign: 'center',
  padding: '8px',
  borderBottom: '1px solid transparent',
  opacity: 0.9
};

const tableCellStyle = {
  textAlign: 'center',
  padding: '8px 20px',
  borderBottom: '1px solid transparent',
  opacity: 0.9
};


const storeData = async () => {
  const packagePrice = durationPricing[activityType][selectedDuration];
  let distribution = {'cash' : 0, 'credit card' : 0, 'upi' : 0}

  // Calculate socks total based on selected sizes and activity type
  const socksTotal = needsSocks
    ? Object.entries(socksSizes).reduce((total, [size, qty]) => {
        const costPerPair = socksPricing[activityType][size] || 0;
        return total + costPerPair * qty;
      }, 0)
    : 0;

  // Calculate the total amount and discount
  const discountAmount =
    discountType === 'Rs'
      ? discount
      : (packagePrice * numPeople + socksTotal) * (discount / 100);
  const subtotal = packagePrice * numPeople + socksTotal;
  const totalAmount = subtotal - discountAmount;

  if (paymentMethod === 'mix' && !validateMixPayment(totalAmount)) return;
  if (!validateSocks()) return;

  // Prepare socks details to store
  const socksDetails = needsSocks
    ? Object.keys(socksSizes)
        .filter(size => socksSizes[size] > 0)
        .map(size => ({
          size,
          quantity: socksSizes[size],
          costPerPair: socksPricing[activityType][size],
          totalCost: socksPricing[activityType][size] * socksSizes[size],
        }))
    : [];

    if(paymentMethod != "mix"){
      distribution[paymentMethod] = totalAmount;
    }else{
      mixPayment.forEach(i => {
        distribution[i.method] = i.amount
      })
    }

  // Create the bill object with all details
  const bill = {
    entry: {
      activityType,
      duration: selectedDuration,
      packagePrice,
      quantity: numPeople,
      totalCost: packagePrice * numPeople,
    },
    socks: socksDetails,
    subtotal,
    discount: discountAmount,
    totalAfterDiscount: totalAmount,
    paymentMethod,
    distribution
  };

  console.log(bill.distribution);

  // Prepare ticket data with bill details
  const ticketData = {
    _type: 'ticket',
    customerName,
    phoneNumber: phone,
    people,
    date : new Date().getDate()+"-"+new Date().getMonth()+"-"+new Date().getUTCFullYear(),
    time : new Date().getHours()+":"+new Date().getMinutes()+":"+new Date().getSeconds(),
    duration: selectedDuration,
    totalAmount,
    status:'false', 
    bill,  // Store bill object here
    createdAt: new Date().toISOString(),
  };

  console.log(ticketData);
  
  await supabase.from("Tickets").insert({name : customerName, data : ticketData})
};

  const printBill = () => {
    document.querySelector('.print-btn').style.display = 'none'
    const billElement = billRef.current; // Get the current element using ref
  
    // Check if the billElement is defined before calling html2canvas
    if (billElement) {
      // Use html2canvas to capture the bill element
      html2canvas(billElement, { scale: 2 }).then((canvas) => {
        const imgData = canvas.toDataURL("image/png");
  
        // Create a new window for printing
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          // Set up the print document
          printWindow.document.write('<html><head><title>Print Bill</title>');
          printWindow.document.write('<style>');
          printWindow.document.write('body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; height: 100vh; }');
          printWindow.document.write('img { max-width: 100%; height: auto; }'); // Ensure the image scales properly
          printWindow.document.write('</style>');
          printWindow.document.write('</head><body>');
          printWindow.document.write('<img src="' + imgData + '" />');
          printWindow.document.write('</body></html>');
  
          printWindow.document.close(); // Close the document to finish rendering
  
          // Wait for a moment to allow the content to render before printing
          printWindow.onload = function() {
            printWindow.focus(); // Focus on the new window
            printWindow.print(); // Trigger the print dialog
            printWindow.close(); // Optionally close the window after printing
          };
        }
      }).catch((error) => {
        console.error("Error capturing bill content:", error);
      });
    } else {
      console.error("Bill element is not available.");
    }
    setTimeout(() => {
      document.querySelector('.print-btn').style.display = ''
    }, 3000);
  };

  let calculateTotal = (noOfPeople,duration, sizes=socksSizes, disType=discountType, disAmount=discount) => {
    console.log(noOfPeople, duration);
    const packagePrice = durationPricing[activityType][duration];
    const socksTotal = needsSocks
    ? Object.entries(sizes).reduce((total, [size, qty]) => {
        const costPerPair = socksPricing[activityType][size] || 0;
        return total + costPerPair * qty;
      }, 0)
    : 0;

  // Calculate the total amount and discount
  console.log({disAmount});
  
  const discountAmount =
    disType === 'Rs'
      ? disAmount
      : (packagePrice * noOfPeople + socksTotal) * (disAmount / 100);
      console.log(packagePrice +'*'+ noOfPeople +'*'+ socksTotal);
      console.log(packagePrice * noOfPeople + socksTotal);
      
    const subtotal = packagePrice * noOfPeople + socksTotal;
    const totalAmount = subtotal - discountAmount;

    setCurrTotal(totalAmount);
  }

  return (
    <div>
      <Navbar/>
      <div style={{ maxWidth: '500px', margin: 'auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
        <header style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h1>Health and Harmony</h1>
          <p>Trampoline Park Customer Information</p>
          <h1>Grand Total {currTotal}</h1>
        </header>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '20px' }}>
        <div className="form-group">
            <label>Activity</label>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
              {['Trampoline', 'Softplay'].map((activity) => (
                <button
                  key={activity}
                  type="button"
                  onClick={() => setActivityType(activity)}
                  style={{
                    flex: '1',
                    padding: '12px',
                    borderRadius: '4px',
                    border: `2px solid ${activityType === activity ? 'black' : '#ccc'}`,
                    backgroundColor: activityType === activity ? 'black' : 'white',
                    color: activityType === activity ? 'white' : 'black',
                    cursor: 'pointer',
                  }}
                >
                  {activity}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label>Customer Name</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label>Phone Number</label>
            <input
              type="number"
              value={phone}
              onChange={(e) => {
                validatePhone()
                setPhone(e.target.value)}
              }
              style={inputStyle}
            />
            {phoneError && <p style={{ color: 'red' }}>{phoneError}</p>}
          </div>

          <div>
            <label>Number of People</label>
            <input
              type="number"
              min="1"
              value={numPeople}
              onChange={handleNumPeopleChange}
              style={inputStyle}
            />
          </div>

          {people.map((person, index) => (
            <div key={index} style={{ marginBottom: '10px' }}>
              <input
                type="text"
                value={person.name}
                onChange={(e) => handlePersonChange(index, e.target.value)}
                placeholder={`Person ${index + 1} Name`}
                style={inputStyle}
              />
            </div>
          ))}

          <div>
            <label>Duration</label>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
              {['30 min', '60 min', '90 min'].map((duration) => (
                <button
                  key={duration}
                  type="button"
                  onClick={() => {setSelectedDuration(duration); calculateTotal(numPeople, duration)}}
                  style={{
                    flex: '1',
                    padding: '12px',
                    borderRadius: '4px',
                    border: `2px solid ${selectedDuration === duration ? 'black' : '#ccc'}`,
                    backgroundColor: selectedDuration === duration ? 'black' : 'white',
                    color: selectedDuration === duration ? 'white' : 'black',
                    cursor: 'pointer',
                  }}
                >
                  {duration}
                </button>
              ))}
            </div>
          </div>


          <div>
            <label>Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              style={inputStyle}
            >
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="credit card">Credit Card</option>
              <option value="mix">Mix</option>
            </select>
          </div>

          {paymentMethod === 'mix' && (
            <>
              {mixPayment.map((payment, index) => (
                <div key={index} style={{ display: 'flex', gap: '10px' }}>
                  <select
                    value={payment.method}
                    onChange={(e) => handleMixPaymentChange(index, 'method', e.target.value)}
                    style={{ flex: '1', padding: '8px' }}
                  >
                    <option value="cash">Cash</option>
                    <option value="upi">UPI</option>
                    <option value="credit card">Credit Card</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Amount"
                    value={payment.amount}
                    onChange={(e) => handleMixPaymentChange(index, 'amount', e.target.value)}
                    style={{ flex: '1', padding: '8px' }}
                  />
                </div>
              ))}
            </>
          )}

          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <input
              type="checkbox"
              checked={needsSocks}
              onChange={(e) => setNeedsSocks(e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            <label>I need socks</label>
          </div>

          {needsSocks && (
            <div style={{ display: 'grid', gap: '10px' }}>
              <label>Sock Sizes</label>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '6%' }}>
                {['XS', 'S'].map((size) => (
                  <div key={size} style={{ flex: '1' }}>
                    <label>{size}</label>
                    <input
                      type="number"
                      value={socksSizes[size]}
                      onChange={(e) => handleSocksChange(size, e.target.value)}
                      min="0"
                      style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                    />
                  </div>
                ))}
              </div>
              {activityType == "Trampoline" &&
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '6%' }}>
                {['M','L', 'XL',].map((size) => (
                  <div key={size} style={{ flex: '1' }}>
                    <label>{size}</label>
                    <input
                      type="number"
                      value={socksSizes[size]}
                      onChange={(e) => handleSocksChange(size, e.target.value)}
                      min="0"
                      style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                    />
                  </div>
                ))}
              </div>}
            </div>
          )}

          <div>
          <label>Discount</label>
          <div style={{ display: "flex", gap: "5%" }}>
  <div style={{ flex: "1" }}>
    <input
      type="number"
      value={discount}
      onChange={(e) => {
        const updatedDiscount = parseFloat(e.target.value) || 0; // Handle invalid inputs
        setDiscount(updatedDiscount); // Update state
        calculateTotal(numPeople, selectedDuration, socksSizes, discountType, updatedDiscount); // Pass updated discount
      }}
      style={inputStyle}
    />
  </div>
  <div>
    <select
      value={discountType}
      onChange={(e) => {
        const updatedDiscountType = e.target.value; // Get the selected discount type
        setDiscountType(updatedDiscountType); // Update state
        calculateTotal(numPeople, selectedDuration, socksSizes, updatedDiscountType, discount); // Pass updated discount type
      }}
      style={inputStyle}
    >
      <option value="%">%</option>
      <option value="Rs">Rs</option>
    </select>
  </div>
</div>

          </div>
          <button type="button" onClick={storeData} style={buttonStyle}>Submit</button>
          <button type="submit" style={{ ...buttonStyle, marginBottom: '10px' }}>Generate Bill</button>
          {error && <p style={{ color: 'red' }}>{error}</p>}
        </form>

        {bill && (
            <div
              ref={billRef} // Use ref here
              style={{
                marginTop: '20px',
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                width: '100mm',  // Match PDF width
                height: '150mm', // Match PDF height
                overflow: 'auto',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center'
              }}>
              {/* <h2 style={{ textAlign: 'center' }}>Bill Details</h2> */}
              <pre style={{ margin: 0 }}>{bill}</pre>
              <button onClick={printBill} className='print-btn' style={buttonStyle}>Print Bill</button>
            </div>
          )}
      </div>
    </div>
  );
}

const inputStyle = {
  padding: '8px',
  borderRadius: '4px',
  border: '1px solid #ccc',
  width: '100%',
};

const buttonStyle = {
  padding: '12px',
  borderRadius: '4px',
  backgroundColor: 'black',
  color: 'white',
  cursor: 'pointer',
  textAlign:'center',
  marginBottom: '10px',
};

//////////////

const handleSubmit = (e) => {
    console.log(durationPricing["Softplay"]);
    console.log(durationPricing["Trampoline"]);
    
    e.preventDefault();
    
    const packagePrice = durationPricing[activityType][selectedDuration];

    // const socksTotal = needsSocks ? numPeople * 30 : 0;
    const socksTotal = needsSocks
    ? Object.entries(socksSizes).reduce((total, [size, qty]) => {
        const costPerPair = socksPricing[activityType][size] || 0;
        return total + costPerPair * qty;
      }, 0)
    : 0;


    const discountAmount = discountType === 'Rs' ? discount : (packagePrice * numPeople + socksTotal) * (discount / 100);
    const total = packagePrice * numPeople + socksTotal - discountAmount;
    

    if (paymentMethod === 'mix' && !validateMixPayment(total)) return;
    if (!validateSocks()) return;

    const billDetails = (
      <div className='billDetails' style={{ textAlign: 'center' }}>
        <h2>Trampoline Park</h2>
        <p>Health & Harmony<br />Cidco, Aurangabad<br />Phone: +91 7888106698</p>
        <p>-------------------------------------</p>
        <table style={{ width: '100%', borderCollapse: 'collapse', opacity: 0.9 }}>
          <thead>
            <tr>
              <th style={tableHeaderStyle}>No.</th>
              <th style={tableHeaderStyle}>Item</th>
              <th style={tableHeaderStyle}>Qty</th>
              <th style={tableHeaderStyle}>Price</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={tableCellStyle}>1</td>
              <td style={tableCellStyle}>Entry</td>
              <td style={tableCellStyle}>{numPeople}</td>
              <td style={tableCellStyle}>{packagePrice * numPeople} Rs</td>
            </tr>
            {needsSocks && (
              <tr>
                <td style={tableCellStyle}></td>
                <td style={tableCellStyle}>Socks</td>
                <td style={tableCellStyle}>{numPeople}</td>
                <td style={tableCellStyle}>{socksTotal} Rs</td>
              </tr>
            )}
            <tr>
              <td style={tableCellStyle} colSpan="3">Subtotal</td>
              <td style={tableCellStyle}>{packagePrice * numPeople + socksTotal} Rs</td>
            </tr>
            <tr>
              <td style={tableCellStyle} colSpan="3">Discount</td>
              <td style={tableCellStyle}>- {discountAmount} Rs</td>
            </tr>
            <tr>
              <td style={tableCellStyle} colSpan="3"><strong>Total after Discount</strong></td>
              <td style={tableCellStyle}><strong>{total} Rs</strong></td>
            </tr>
          </tbody>
        </table>
        <p>-------------------------------------</p>
        <p>Payment Method: {paymentMethod}</p>
        {paymentMethod === 'mix' && (
          <div>
            {mixPayment.map((payment, index) => (
              <p key={index} style={{ margin: 0 }}>
                Payment {index + 1}: {payment.method} - {payment.amount} Rs
              </p>
            ))}
          </div>
        )}
      </div>
    );
    
    setBill(billDetails);
};

const printBill = () => { 
    document.querySelector('.print-btn').style.display = 'none'
    const billElement = billRef.current; // Get the current element using ref
  
    // Check if the billElement is defined before calling html2canvas
    if (billElement) {
      // Use html2canvas to capture the bill element
      html2canvas(billElement, { scale: 2 }).then((canvas) => {
        const imgData = canvas.toDataURL("image/png");
  
        // Create a new window for printing
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          // Set up the print document
          printWindow.document.write('<html><head><title>Print Bill</title>');
          printWindow.document.write('<style>');
          printWindow.document.write('body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; height: 100vh; }');
          printWindow.document.write('img { max-width: 100%; height: auto; }'); // Ensure the image scales properly
          printWindow.document.write('</style>');
          printWindow.document.write('</head><body>');
          printWindow.document.write('<img src="' + imgData + '" />');
          printWindow.document.write('</body></html>');
  
          printWindow.document.close(); // Close the document to finish rendering
  
          // Wait for a moment to allow the content to render before printing
          printWindow.onload = function() {
            printWindow.focus(); // Focus on the new window
            printWindow.print(); // Trigger the print dialog
            printWindow.close(); // Optionally close the window after printing
          };
        }
      }).catch((error) => {
        console.error("Error capturing bill content:", error);
      });
    } else {
      console.error("Bill element is not available.");
    }
    setTimeout(() => {
      document.querySelector('.print-btn').style.display = ''
    }, 3000);
  };

const handleSubmit = (e) => {
    console.log(durationPricing["Softplay"]);
    console.log(durationPricing["Trampoline"]);
    
    e.preventDefault();
    
    const packagePrice = durationPricing[activityType][selectedDuration];

    // const socksTotal = needsSocks ? numPeople * 30 : 0;
    const socksTotal = needsSocks
    ? Object.entries(socksSizes).reduce((total, [size, qty]) => {
        const costPerPair = socksPricing[activityType][size] || 0;
        return total + costPerPair * qty;
      }, 0)
    : 0;


    const discountAmount = discountType === 'Rs' ? discount : (packagePrice * numPeople + socksTotal) * (discount / 100);
    const total = packagePrice * numPeople + socksTotal - discountAmount;
    

    if (paymentMethod === 'mix' && !validateMixPayment(total)) return;
    if (!validateSocks()) return;

    const billDetails = (
      <div className='billDetails' style={{ textAlign: 'center' }}>
        <h2>Trampoline Park</h2>
        <p>Health & Harmony<br />Cidco, Aurangabad<br />Phone: +91 7888106698</p>
        <p>-------------------------------------</p>
        <table style={{ width: '100%', borderCollapse: 'collapse', opacity: 0.9 }}>
          <thead>
            <tr>
              <th style={tableHeaderStyle}>No.</th>
              <th style={tableHeaderStyle}>Item</th>
              <th style={tableHeaderStyle}>Qty</th>
              <th style={tableHeaderStyle}>Price</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={tableCellStyle}>1</td>
              <td style={tableCellStyle}>Entry</td>
              <td style={tableCellStyle}>{numPeople}</td>
              <td style={tableCellStyle}>{packagePrice * numPeople} Rs</td>
            </tr>
            {needsSocks && (
              <tr>
                <td style={tableCellStyle}></td>
                <td style={tableCellStyle}>Socks</td>
                <td style={tableCellStyle}>{numPeople}</td>
                <td style={tableCellStyle}>{socksTotal} Rs</td>
              </tr>
            )}
            <tr>
              <td style={tableCellStyle} colSpan="3">Subtotal</td>
              <td style={tableCellStyle}>{packagePrice * numPeople + socksTotal} Rs</td>
            </tr>
            <tr>
              <td style={tableCellStyle} colSpan="3">Discount</td>
              <td style={tableCellStyle}>- {discountAmount} Rs</td>
            </tr>
            <tr>
              <td style={tableCellStyle} colSpan="3"><strong>Total after Discount</strong></td>
              <td style={tableCellStyle}><strong>{total} Rs</strong></td>
            </tr>
          </tbody>
        </table>
        <p>-------------------------------------</p>
        <p>Payment Method: {paymentMethod}</p>
        {paymentMethod === 'mix' && (
          <div>
            {mixPayment.map((payment, index) => (
              <p key={index} style={{ margin: 0 }}>
                Payment {index + 1}: {payment.method} - {payment.amount} Rs
              </p>
            ))}
          </div>
        )}
      </div>
    );
    
    setBill(billDetails);
};


        {bill && (
            <div
              ref={billRef} // Use ref here
              style={{
                marginTop: '20px',
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                width: '100mm',  // Match PDF width
                height: '150mm', // Match PDF height
                overflow: 'auto',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center'
              }}>
              {/* <h2 style={{ textAlign: 'center' }}>Bill Details</h2> */}
              <pre style={{ margin: 0 }}>{bill}</pre>
              <button onClick={printBill} className='print-btn' style={buttonStyle}>Print Bill</button>
            </div>
          )}

this is all the code related to bill generation 