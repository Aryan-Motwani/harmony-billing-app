import React, { useEffect, useState } from 'react';
import html2canvas from 'html2canvas';
import client from './sanityClient';
import Navbar from './Navbar';
import jsPDF from 'jspdf';

export default function Form() {
  const [activityType, setActivityType] = useState('Trampoline'); // Activity selection state
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [numPeople, setNumPeople] = useState(1);
  const [people, setPeople] = useState([{ name: '', signature: 'h' }]);
  const [needsSocks, setNeedsSocks] = useState(false);
  const [socksSizes, setSocksSizes] = useState({ S: 0, M: 0, L: 0 });
  const [selectedDuration, setSelectedDuration] = useState('30 min');
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState('%'); // Default discount type to percentage
  const [billedBy, setBilledBy] = useState('Gulshan');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [mixPayment, setMixPayment] = useState([{ method: 'cash', amount: '' }, { method: 'cash', amount: '' }]);
  const [bill, setBill] = useState('');
  const [data, setData] = useState([]);
  const [error, setError] = useState(''); // Error state for mix payment validation
  const [phoneError, setPhoneError] = useState(''); // Error state for phone validation

  const durationPricing = {
    Trampoline: { '30 min': 100, '60 min': 200, '90 min': 300 },
    Softplay: { '30 min': 80, '60 min': 160, '90 min': 240 },
  };

  useEffect(() => {
    client.fetch('*[_type == "ticket"]').then(setData).catch(console.error);
  }, []);

  useEffect(() => {
    // Update people state when numPeople changes
    setPeople(Array.from({ length: numPeople }, (_, index) => ({ name: index === 0 ? customerName : '' })));
  }, [numPeople, customerName]);

  const handleNumPeopleChange = (e) => {
    const num = parseInt(e.target.value);
    setNumPeople(num);
  };

  const handlePersonChange = (index, value) => {
    const newPeople = [...people];
    newPeople[index].name = value; // Update the name of the specific person
    setPeople(newPeople);
  };

  const handleSocksChange = (size, value) => {
    setSocksSizes((prev) => ({ ...prev, [size]: parseInt(value) || 0 }));
  };

  const handleMixPaymentChange = (index, field, value) => {
    const newMixPayment = [...mixPayment];
    newMixPayment[index][field] = value;
    setMixPayment(newMixPayment);
  };

  const validateSocks = () => {
    const totalSocks = Object.values(socksSizes).reduce((a, b) => a + b, 0);
    if (totalSocks !== numPeople) {
      setError(`Socks quantity does not match`);
      return false;
    }
    setError('');
    return true;
  };

  const validatePhone = () => {
    if (phone.length !== 10) {
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

  const handleSubmit = (e) => {
    e.preventDefault();
    const packagePrice = durationPricing[activityType][selectedDuration];
    const socksTotal = needsSocks ? numPeople * 30 : 0;
    const discountAmount = discountType === 'Rs' ? discount : (packagePrice * numPeople + socksTotal) * (discount / 100);
    const total = packagePrice * numPeople + socksTotal - discountAmount;

    if (paymentMethod === 'mix' && !validateMixPayment(total)) return;
    if (!validateSocks() || !validatePhone()) return;

    const billDetails = (
      <div id="billDetails" className='billDetails' style={{ textAlign: 'center' }}>
        <h2>PAID</h2>
        <p>Health & Harmony<br />Cannaught Place, Delhi<br />Phone: +91 7888106698</p>
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
    const socksTotal = needsSocks ? numPeople * 30 : 0;
    let totalAmount = packagePrice * numPeople + socksTotal;
    const discountAmount = discountType === 'Rs' ? discount : (packagePrice * numPeople + socksTotal) * (discount / 100);
    totalAmount -= discountAmount;

    if (paymentMethod === 'mix' && !validateMixPayment(totalAmount)) return;
    if (!validateSocks() || !validatePhone()) return;

    const ticketData = {
      _type: 'ticket',
      customerName,
      phoneNumber: phone,
      people,
      duration: selectedDuration,
      totalAmount,
      activityType,
      createdAt: new Date().toISOString(),
    };
    console.log(ticketData);
    
    try {
      const result = await client.create(ticketData);
      alert('Ticket stored successfully!');
      console.log('Ticket stored:', result);
    } catch (error) {
      console.error('Store ticket failed:', error.message);
      alert('Error storing ticket: ' + error.message);
    }
  };

  const clearAllTickets = async () => {
    try {
      const tickets = await client.fetch('*[_type == "ticket"]{_id}');
      if (tickets.length === 0) return console.log('No tickets to delete.');

      const ticketIds = tickets.map((ticket) => ticket._id);
      await client.delete(ticketIds);
      console.log('Tickets cleared.');
      alert('All tickets cleared successfully.');
    } catch (error) {
      console.error('Error clearing tickets:', error.message);
      alert('Error clearing tickets: ' + error.message);
    }
  };

  const downloadBill = () => {
    const pdf = new jsPDF();
    pdf.html(document.querySelector('#billDetails'), {
      callback: (pdf) => {
        pdf.save('bill.pdf');
      },
      x: 10,
      y: 10,
    });
  };

  return (
    <div>
      <Navbar />
      <form onSubmit={handleSubmit}>
        <div>
          <label>Name: </label>
          <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
        </div>
        <div>
          <label>Phone Number: </label>
          <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          {phoneError && <p style={{ color: 'red' }}>{phoneError}</p>}
        </div>
        <div>
          <label>Activity Type: </label>
          <select value={activityType} onChange={(e) => setActivityType(e.target.value)}>
            <option value="Trampoline">Trampoline</option>
            <option value="Softplay">Softplay</option>
          </select>
        </div>
        <div>
          <label>Duration: </label>
          <select value={selectedDuration} onChange={(e) => setSelectedDuration(e.target.value)}>
            {Object.keys(durationPricing[activityType]).map((duration) => (
              <option key={duration} value={duration}>{duration}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Number of People: </label>
          <input type="number" value={numPeople} onChange={handleNumPeopleChange} min="1" max="10" />
        </div>
        {people.map((person, index) => (
          <div key={index}>
            <label>{`Person ${index + 1}: `}</label>
            <input type="text" value={person.name} onChange={(e) => handlePersonChange(index, e.target.value)} />
          </div>
        ))}
        <div>
          <label>Needs Socks: </label>
          <input type="checkbox" checked={needsSocks} onChange={(e) => setNeedsSocks(e.target.checked)} />
        </div>
        {needsSocks && (
          <div>
            <label>Socks Sizes:</label>
            <div>
              <label>Small: </label>
              <input type="number" value={socksSizes.S} onChange={(e) => handleSocksChange('S', e.target.value)} />
            </div>
            <div>
              <label>Medium: </label>
              <input type="number" value={socksSizes.M} onChange={(e) => handleSocksChange('M', e.target.value)} />
            </div>
            <div>
              <label>Large: </label>
              <input type="number" value={socksSizes.L} onChange={(e) => handleSocksChange('L', e.target.value)} />
            </div>
            {error && <p style={{ color: 'red' }}>{error}</p>}
          </div>
        )}
        <div>
          <label>Discount: </label>
          <input type="number" value={discount} onChange={(e) => setDiscount(parseInt(e.target.value))} />
          <select value={discountType} onChange={(e) => setDiscountType(e.target.value)}>
            <option value="%">%</option>
            <option value="Rs">Rs</option>
          </select>
        </div>
        <div>
          <label>Billed By: </label>
          <input type="text" value={billedBy} onChange={(e) => setBilledBy(e.target.value)} />
        </div>
        <div>
          <label>Payment Method: </label>
          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
            <option value="cash">Cash</option>
            <option value="credit">Credit</option>
            <option value="mix">Mix</option>
          </select>
        </div>
        {paymentMethod === 'mix' && (
          <div>
            {mixPayment.map((payment, index) => (
              <div key={index}>
                <label>Payment Method: </label>
                <input type="text" value={payment.method} onChange={(e) => handleMixPaymentChange(index, 'method', e.target.value)} />
                <label>Amount: </label>
                <input type="number" value={payment.amount} onChange={(e) => handleMixPaymentChange(index, 'amount', e.target.value)} />
              </div>
            ))}
            {error && <p style={{ color: 'red' }}>{error}</p>}
          </div>
        )}
        <button type="submit">Generate Bill</button>
      </form>
      <div>
        <h2>Bill</h2>
        <div>
          {bill}
        </div>
        {bill && <button onClick={downloadBill}>Download Bill</button>}
      </div>
      <button onClick={storeData}>Store Ticket</button>
      <button onClick={clearAllTickets}>Clear All Tickets</button>
    </div>
  );
}
