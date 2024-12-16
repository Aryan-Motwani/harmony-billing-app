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
  const [payError, setPayError] = useState(''); // Error state for mix payment validation
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

  const [showModal, setShowModal] = useState(false);
  const [submissionDetails, setSubmissionDetails] = useState({});
  const [mainToggle, setMainToggle] = useState(true);
  

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
    return true;
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
      setPayError(`Total mix payments (${totalMixPayment} Rs) do not match the bill amount (${total} Rs).`);
      return false;
    }
    setPayError('');
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

    if(prices?.discount){
      setDiscount(prices?.discount)
    }

    setMainToggle(prices?.toggleState)

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
    

    

    const billDetails = (
      <div
        className="billDetails"
        style={{
          textAlign: "center",
          // fontSize: "22px",
          // fontWeight: "bold",
          width: "100%",
          maxWidth: "80mm",
        }}
      >
        <h2 style={{ fontSize: "28px", margin: "5px 0" }}>Trampoline Park</h2>
        <p style={{ margin: "5px 0" }}>
          Health & Harmony<br />
          Cidco, Aurangabad<br />
          Phone: +91 7888106698
        </p>
        <p style={{ margin: "10px 0", borderTop: "1px dashed #000", borderBottom: "1px dashed #000", padding: "5px 0" }}>
          Receipt
        </p>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "18px", // Slightly smaller font for table content
            opacity: 0.9,
          }}
        >
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: "5px" }}>No.</th>
              <th style={{ textAlign: "left", padding: "5px" }}>Item</th>
              <th style={{ textAlign: "center", padding: "5px" }}>Qty</th>
              <th style={{ textAlign: "right", padding: "5px" }}>Price</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: "5px" }}>1</td>
              <td style={{ padding: "5px" }}>Entry</td>
              <td style={{ textAlign: "center", padding: "5px" }}>{numPeople}</td>
              <td style={{ textAlign: "right", padding: "5px" }}>{packagePrice * numPeople} Rs</td>
            </tr>
            {needsSocks && (
              <tr>
                <td style={{ padding: "5px" }}></td>
                <td style={{ padding: "5px" }}>Socks</td>
                <td style={{ textAlign: "center", padding: "5px" }}>{numPeople}</td>
                <td style={{ textAlign: "right", padding: "5px" }}>{socksTotal} Rs</td>
              </tr>
            )}
            <tr>
              <td style={{ padding: "5px" }} colSpan="3">Subtotal</td>
              <td style={{ textAlign: "right", padding: "5px" }}>{packagePrice * numPeople + socksTotal} Rs</td>
            </tr>
            <tr>
              <td style={{ padding: "5px" }} colSpan="3">Discount</td>
              <td style={{ textAlign: "right", padding: "5px" }}>- {discountAmount} Rs</td>
            </tr>
            <tr>
              <td style={{ padding: "5px" }} colSpan="3">
                <strong>Total after Discount</strong>
              </td>
              <td style={{ textAlign: "right", padding: "5px" }}>
                <strong>{total} Rs</strong>
              </td>
            </tr>
          </tbody>
        </table>
        <p style={{ margin: "10px 0", borderTop: "1px dashed #000", borderBottom: "1px dashed #000", padding: "3px 0" }}>
          Payment Method: {paymentMethod}
        </p>
        {paymentMethod === "mix" && (
          <div style={{ fontSize: "18px", textAlign: "left", marginTop: "10px" }}>
            {mixPayment.map((payment, index) => (
              <p key={index} style={{ margin: "5px 0" }}>
                Payment {index + 1}: {payment.method} - {payment.amount} Rs
              </p>
            ))}
          </div>
        )}
        <p style={{ margin: "10px 0", fontSize: "18px" }}>Thank you for visiting!</p>
      </div>
    );
    
    setBill(billDetails);
    setTimeout(() => {
      
      printBill()
    }, 500);
    setTimeout(() => {
      
      setBill('')
    }, 3000);
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

  // if (paymentMethod === 'mix' && !validateMixPayment(totalAmount)) return;
  // if (needsSocks && validateSocks()) return;

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

  console.log({mainToggle,}, !mainToggle);
  
  console.log("before await");
  
  if(!mainToggle) return;
  
  console.log("await");
  
  await supabase.from("Tickets").insert({name : customerName, data : ticketData})

  clearInputs()
  
};

  const clearInputs = () => {
    setCustomerName("")
    setPhone("")
    setNumPeople(1)
    setNeedsSocks(false)
    setSelectedDuration('30 min')
    setPaymentMethod('cash')
    setMixPayment([{ method: 'cash', amount: '' }, { method: 'cash', amount: '' }]);
    setDiscount(0)
    setDiscountType('%')
    setSocksSizes({ XS:0, S: 0, M: 0, L: 0, XL :0 });
    setBill('');
    alert("Ticket Submitted")

  }

  const printBill = () => {
    
    // document.querySelector('.print-btn').style.display = 'none'
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
      // document.querySelector('.print-btn').style.display = ''
      // document.querySelector('.billDetails').style.display = 'none'
      // document.querySelector('.billRef').style.opacity = '0'
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

  const handleClick = async () => {
    const bill = {
      entry: {
        activityType : 'Trampoline',
        duration: '60 min',
        packagePrice : 30,
        quantity: 3,
        totalCost: 360,
      },
      socks: [
        {size: 'XS', quantity: 1, costPerPair: 50, totalCost: 50},
        {size: 'X', quantity: 2, costPerPair: 80, totalCost: 160}
      ],
      subtotal : 360,
      discount: 10,
      totalAfterDiscount: 360,
      paymentMethod : 'cash', 
      distribution : {'cash': 0, 'credit card': 270, 'upi': 0}
    };
  
  
    // Prepare ticket data with bill details
    const ticketData = {
      _type: 'ticket',
      customerName : 'Walter White',
      phoneNumber: 9890009933,
      people : [{name : 'Walter White'}, {name : 'Jesse Pinkman'}, {name : 'Gustavo Fring'}],
      date : "22-10-2024",
      time : "19:3:43",
      duration: "60 min",
      totalAmount : 360,
      status:'false', 
      bill,  // Store bill object here
      createdAt: new Date().toISOString(),
    };

    await supabase.from("ticketss").insert(
      {name : "aryan", data : {a : ''}},
      {name : "new", data : {a : ''}}
    )}

    const handleSubmitClick = () => {
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
    if (needsSocks && !validateSocks()) return;
    
      
      const details = {
        activityType,
        numPeople,
        selectedDuration,
        bill, // Use your bill object here
      };
      setSubmissionDetails(details);
      setShowModal(true); // Open the modal
    };
  
    const handleConfirm = () => {
      setShowModal(false);
      storeData(); // Call your storeData function here
    };
  
    const handleCancel = () => {
      setShowModal(false);
    };

  return (
    <div>
      <Navbar/>
      <div className='mx-auto p-6 font-sans'>
      <header className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Health and Harmony</h1>
          <p className="text-gray-600">Trampoline Park Customer Information</p>
          <h1 className="text-xl font-semibold text-gray-900 mt-4">Grand Total {currTotal}</h1>
        </header>

        <form
  onSubmit={handleSubmit}
  className="grid gap-6 bg-white shadow-lg p-6 rounded-lg w-full max-w-3xl mx-auto">
          {/* Activity Selection */}
          <div>
            <label className="block text-gray-700 font-medium">Activity</label>
            <div className="flex gap-4 mt-2">
              {['Trampoline', 'Softplay'].map((activity) => (
                <button
                  key={activity}
                  type="button"
                  onClick={() => setActivityType(activity)}
                  className={`flex-1 px-4 py-2 text-center border rounded-md ${
                    activityType === activity
                      ? 'bg-gray-800 text-white border-gray-800'
                      : 'border-gray-300 text-gray-700'
                  }`}
                >
                  {activity}
                </button>
              ))}
            </div>
          </div>

          {/* Customer Name */}
          <div>
            <label className="block text-gray-700 font-medium">Customer Name</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full mt-2 px-4 py-2 border rounded-md focus:outline-none focus:ring focus:ring-gray-300"
            />
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-gray-700 font-medium">Phone Number</label>
            <input
              type="number"
              min="0"
              onWheel={(e) => e.target.blur()}
              
              value={phone}
              onChange={(e) => {
                validatePhone();
                setPhone(e.target.value);
              }}
              className="w-full mt-2 px-4 py-2 border rounded-md focus:outline-none focus:ring focus:ring-gray-300"
            />
            {phoneError && <p className="text-sm text-red-500 mt-1">{phoneError}</p>}
          </div>

          {/* Number of People */}
          <div>
            <label className="block text-gray-700 font-medium">Number of People</label>
            <input
              type="number"
              onWheel={(e) => e.target.blur()}
              
              min="1"
              value={numPeople}
              onChange={handleNumPeopleChange}
              className="w-full mt-2 px-4 py-2 border rounded-md focus:outline-none focus:ring focus:ring-gray-300"
            />
          </div>

          {/* Individual Person Details */}
          {people.map((person, index) => (
            <div key={index} className="mb-2">
              <input
                type="text"
                value={person.name}
                onChange={(e) => handlePersonChange(index, e.target.value)}
                placeholder={`Person ${index + 1} Name`}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring focus:ring-gray-300"
              />
            </div>
          ))}

          {/* Duration Selection */}
          <div>
            <label className="block text-gray-700 font-medium">Duration</label>
            <div className="flex gap-4 mt-2">
              {['30 min', '60 min', '90 min'].map((duration) => (
                <button
                  key={duration}
                  type="button"
                  onClick={() => {
                    setSelectedDuration(duration);
                    calculateTotal(numPeople, duration);
                  }}
                  className={`flex-1 px-4 py-2 text-center border rounded-md ${
                    selectedDuration === duration
                      ? 'bg-gray-800 text-white border-gray-800'
                      : 'border-gray-300 text-gray-700'
                  }`}
                >
                  {duration}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-gray-700 font-medium">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full mt-2 px-4 py-2 border rounded-md focus:outline-none focus:ring focus:ring-gray-300"
            >
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="credit card">Credit Card</option>
              <option value="mix">Mix</option>
            </select>
          </div>

          {/* Mixed Payment Details */}
          {paymentMethod === 'mix' &&
            mixPayment.map((payment, index) => (
              <div key={index} className="flex gap-4 mt-2">
                <select
                  value={payment.method}
                  onChange={(e) => handleMixPaymentChange(index, 'method', e.target.value)}
                  className="flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring focus:ring-gray-300"
                >
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="credit card">Credit Card</option>
                </select>
                <input
                  type="number"
                  min="0"
                  onWheel={(e) => e.target.blur()}
                  
                  placeholder="Amount"
                  value={payment.amount}
                  onChange={(e) => handleMixPaymentChange(index, 'amount', e.target.value)}
                  className="flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring focus:ring-gray-300"
                />
              </div>
            ))}
            {payError && <p className="text-sm text-red-500 mt-1">{payError}</p>}

          {/* Socks Section */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={needsSocks}
              onChange={(e) => setNeedsSocks(e.target.checked)}
              className="form-checkbox h-5 w-5"
            />
            <label className="text-gray-700">I need socks</label>
          </div>

          {needsSocks && (
            <div className="grid gap-4">
              <label className="text-gray-700 font-medium">Sock Sizes</label>
              <div className="flex gap-4">
                {['XS', 'S', 'M', 'L', 'XL'].map((size) => (
                  <div key={size} className="flex-1">
                    <label className="text-gray-700">{size}</label>
                    <input
                      type="number"
                      min="0"
                      onWheel={(e) => e.target.blur()}
                      
                      value={socksSizes[size]}
                      onChange={(e) => handleSocksChange(size, e.target.value)}
                      className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring focus:ring-gray-300 mt-2"
                    />
                  </div>
                ))}
              </div>
            {error && <p className="text-sm text-red-500 mt-1">{error}</p>}

            </div>
          )}


      <div>
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
                  setDiscount(updatedDiscount); // Update state
                  calculateTotal(numPeople, selectedDuration, socksSizes, discountType, updatedDiscount); // Pass updated discount
                  
                }}
                className="w-full mt-2 px-4 py-2 border rounded-md focus:outline-none focus:ring focus:ring-gray-300"
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
                className="w-full mt-2 px-4 py-2 border rounded-md focus:outline-none focus:ring focus:ring-gray-300"
              >
                <option value="%">%</option>
                <option value="Rs">Rs</option>
              </select>
        </div>
      </div>

          </div>

          {/* Submit Buttons */}
          <div className="grid gap-4">
            <button
              type="button"
              onClick={handleSubmitClick}
              className="bg-gray-800 text-white py-2 rounded-md hover:bg-gray-700"
            >
              Submit
            </button>
            {/* 
            */}
            <button
              type="submit"
              className="bg-gray-800 text-white py-2 rounded-md hover:bg-gray-700"
            >
              Generate Bill
            </button>
          </div>

          {/* Confirmation Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg p-6 w-11/12 max-w-md">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Confirm Submission</h2>
              <p>
                <strong>Activity:</strong> {submissionDetails.activityType}
              </p>
              <p>
                <strong>Number of People:</strong> {submissionDetails.numPeople}
              </p>
              <p>
                <strong>Duration:</strong> {submissionDetails.selectedDuration}
              </p>
              <p>
                <strong>Package Price:</strong> {durationPricing[activityType][selectedDuration] * numPeople}
              </p>

              <p>
                <strong>Socks Amount : </strong> {needsSocks
    ? Object.entries(socksSizes).reduce((total, [size, qty]) => {
        const costPerPair = socksPricing[activityType][size] || 0;
        return total + costPerPair * qty;
      }, 0)
    : 0}
              </p>

              <p>
                <strong>Discount Amount</strong> {
    discountType === 'Rs'
      ? discount
      : (durationPricing[activityType][selectedDuration] * numPeople + needsSocks
        ? Object.entries(socksSizes).reduce((total, [size, qty]) => {
            const costPerPair = socksPricing[activityType][size] || 0;
            return total + costPerPair * qty;
          }, 0)
        : 0) * (discount / 100)}
              </p>
              <p>
                <strong>Total Bill</strong> {currTotal}
              </p>


              {/* <pre>{JSON.stringify(submissionDetails.bill, null, 2)}</pre> */}
                  

              <div className="flex justify-end mt-4 gap-2">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
        </form>

        {/* <button onClick={handleClick}>Click</button> */}

        {bill && (
            <div
              className='billRef'
              ref={billRef} // Use ref here
              style={{
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                width: '80mm',  // Match PDF width
                height: '230mm', // Match PDF height
                overflow: 'auto',
                display: 'flex',
                flexDirection: 'column',
                // alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center'
              }}>
              {/* <h2 style={{ textAlign: 'center' }}>Bill Details</h2> */}
              <pre style={{ margin: 0 }}>{bill}</pre>
              {/* <button onClick={printBill} className='print-btn' style={buttonStyle}>Print Bill</button> */}
            </div>
          )}
      </div>
    </div>
  );
}
