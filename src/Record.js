import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import { supabase } from './createClient';

const Records = () => {
    const [tabIndex, setTabIndex] = useState(0);
    const [ticketsData, setTicketsData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('');

    useEffect(() => {
        const fetchSupabase = async () => {
            const { data, error } = await supabase.from('Tickets').select('*');
            if (error) {
                console.error('Error fetching prices:', error);
                return;
            }
            if (!data || data.length === 0) {
                console.error('No pricing data available.');
                return;
            }
            console.log(data);
            
            setTicketsData(data);
            setFilteredData(data);
        };

        fetchSupabase();
    }, []);

    const applyFilters = () => {
        let filtered = [...ticketsData];
    
        console.log("Initial Tickets Data:", ticketsData);
        console.log("Start Date:", startDate);
        console.log("End Date:", endDate);
        console.log("Payment Method:", paymentMethod);
    
        if (startDate) {
            console.log("Filtering by Start Date:", startDate);
    
            filtered = filtered.filter((ticket) => {
                const [day, month, year] = ticket.data.date.split('-'); // Split DD-MM-YYYY
                const ticketDate = new Date(Number(year), Number(month) - 1, Number(day)); // Convert to Date object
    
                const filterStartDate = new Date(startDate); // Convert start date to Date object
                console.log(`Ticket Date: ${ticketDate}, Start Date: ${filterStartDate}`);
    
                const comparisonResult = ticketDate >= filterStartDate;
                console.log(
                    `Is Ticket Date (${ticketDate}) >= Start Date (${filterStartDate})? ${comparisonResult}`
                );
    
                return comparisonResult; // Return true if ticketDate >= startDate
            });
    
            console.log("Filtered Data After Start Date Filter:", filtered);
        }
    
        if (endDate) {
            console.log("Filtering by End Date:", endDate);
    
            filtered = filtered.filter((ticket) => {
                const [day, month, year] = ticket.data.date.split('-'); // Split DD-MM-YYYY
                const ticketDate = new Date(Number(year), Number(month) - 1, Number(day)); // Convert to Date object
    
                const filterEndDate = new Date(endDate); // Convert end date to Date object
                console.log(`Ticket Date: ${ticketDate}, End Date: ${filterEndDate}`);
    
                const comparisonResult = ticketDate <= filterEndDate;
                console.log(
                    `Is Ticket Date (${ticketDate}) <= End Date (${filterEndDate})? ${comparisonResult}`
                );
    
                return comparisonResult; // Return true if ticketDate <= endDate
            });
    
            console.log("Filtered Data After End Date Filter:", filtered);
        }
    
        if (paymentMethod) {
            console.log("Filtering by Payment Method:", paymentMethod);
    
            filtered = filtered.filter(
                (ticket) => {
                    const ticketPaymentMethod = ticket.data.bill.paymentMethod
                        ? ticket.data.bill.paymentMethod.toLowerCase()
                        : null;
    
                    const comparisonResult =
                        ticketPaymentMethod === paymentMethod.toLowerCase();
                    console.log(
                        `Ticket Payment Method: ${ticketPaymentMethod}, Filter Payment Method: ${paymentMethod.toLowerCase()}, Match: ${comparisonResult}`
                    );
    
                    return comparisonResult; // Return true if payment methods match
                }
            );
    
            console.log("Filtered Data After Payment Method Filter:", filtered);
        }
    
        console.log("Final Filtered Data:", filtered);
        setFilteredData(filtered);
    };
    
    
    

    const formatDate = (isoDate) => {
        const dateObj = new Date(isoDate);
        return {
            date: dateObj.toLocaleDateString(),
            time: dateObj.toLocaleTimeString(),
        };
    };

    const exportToCSV = () => {
        const csvRows = [];
        const headers =
            tabIndex === 0
                ? [
                      'Customer Name',
                      'Activity Type',
                      'No. of People',
                      'Duration',
                      'Total Amount',
                      'Date',
                      'Time',
                      'Payment Method',
                  ]
                : ['Date', 'Time', 'XS', 'S', 'M', 'L', 'XL'];

        csvRows.push(headers.join(','));

        filteredData.forEach((ticket) => {
            if (tabIndex === 0) {
                const { date, time } = formatDate(ticket.data.date);
                csvRows.push(
                    [
                        ticket.data.customerName,
                        ticket.data.bill.entry.activityType,
                        ticket.data.people?.length || 0,
                        ticket.data.duration,
                        ticket.data.totalAmount,
                        date,
                        time,
                        ticket.data.bill.paymentMethod,
                    ].join(',')
                );
            } else {
                const { date, time } = formatDate(ticket.data.createdAt);
                const socksQuantities = { XS: 0, S: 0, M: 0, L: 0, XL: 0 };
                if (ticket.data.bill.socks && Array.isArray(ticket.data.bill.socks)) {
                    ticket.data.bill.socks.forEach((sock) => {
                        if (socksQuantities.hasOwnProperty(sock.size)) {
                            socksQuantities[sock.size] += sock.quantity;
                        }
                    });
                }
                csvRows.push(
                    [
                        date,
                        time,
                        socksQuantities.XS,
                        socksQuantities.S,
                        socksQuantities.M,
                        socksQuantities.L,
                        socksQuantities.XL,
                    ].join(',')
                );
            }
        });

        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `records-${tabIndex === 0 ? 'tickets' : 'socks'}.csv`;
        link.click();
    };

    
    // Calculate totals for tickets and socks quantities
    const totalPeople = filteredData.reduce((acc, ticket) => acc + (ticket.data.people?.length || 0), 0);
    const totalAmount = filteredData.reduce((acc, ticket) => acc + (ticket.data.totalAmount || 0), 0);

    const socksQuantitiesTotal = filteredData.reduce((acc, ticket) => {
        if (ticket.data.bill.socks && Array.isArray(ticket.data.bill.socks)) {
            ticket.data.bill.socks.forEach(sock => {
                if (acc.hasOwnProperty(sock.size)) {
                    acc[sock.size] += sock.quantity;
                }
            });
        }
        return acc;
    }, { XS: 0, S: 0, M: 0, L: 0, XL: 0 });

    return (
        <div>
            <Navbar />
            <div style={containerStyle}>
                <div style={filterContainerStyle}>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        style={inputStyle}
                    />
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        style={inputStyle}
                    />
                    <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        style={inputStyle}
                    >
                        <option value="">All Payment Methods</option>
                        <option value="cash">Cash</option>
                        <option value="credit card">Card</option>
                        <option value="upi">UPI</option>
                        <option value="mix">Mix</option>
                    </select>
                    <button onClick={applyFilters} style={buttonStyle}>
                        Apply Filters
                    </button>
                    <button onClick={exportToCSV} style={buttonStyle}>
                        Export to CSV
                    </button>
                </div>

                
                {/* Tab Navigation */}
                <div style={tabContainerStyle}>
                    <div
                        onClick={() => setTabIndex(0)}
                        style={{
                            ...tabButtonStyle,
                            backgroundColor: tabIndex === 0 ? '#333' : '#ddd',
                            color: tabIndex === 0 ? '#fff' : '#000'
                        }}
                    >
                        Tickets
                    </div>
                    <div
                        onClick={() => setTabIndex(1)}
                        style={{
                            ...tabButtonStyle,
                            backgroundColor: tabIndex === 1 ? '#333' : '#ddd',
                            color: tabIndex === 1 ? '#fff' : '#000'
                        }}
                    >
                        Socks
                    </div>
                </div>

                {/* Table Container */}
                <div style={tableContainerStyle}>
                    {/* Tickets Table */}
                    {tabIndex === 0 && (
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
                            <thead>
                                <tr>
                                    <th style={tableHeaderStyle}>Customer Name</th>
                                    <th style={tableHeaderStyle}>Activity Type</th>
                                    <th style={tableHeaderStyle}>No. of People</th>
                                    <th style={tableHeaderStyle}>Duration</th>
                                    <th style={tableHeaderStyle}>Total Amount</th>
                                    <th style={tableHeaderStyle}>Date</th>
                                    <th style={tableHeaderStyle}>Time</th>
                                    <th style={tableHeaderStyle}>Payment Method</th>
                                    <th style={tableHeaderStyle}>Cash</th>
                                    <th style={tableHeaderStyle}>Card</th>
                                    <th style={tableHeaderStyle}>UPI</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.map(ticket => {
                                    const { date, time } = formatDate(ticket.data);
                                    return (
                                        <tr key={ticket.id}>
                                            <td style={tableDataStyle}>{ticket.data.customerName}</td>
                                            <td style={tableDataStyle}>{ticket.data.bill.entry.activityType}</td>
                                            <td style={tableDataStyle}>{ticket.data.people?.length || 0}</td>
                                            <td style={tableDataStyle}>{ticket.data.duration}</td>
                                            <td style={tableDataStyle}>{ticket.data.totalAmount}</td>
                                            <td style={tableDataStyle}>{ticket.data.date}</td>
                                            <td style={tableDataStyle}>{ticket.data.time}</td>
                                            <td style={tableDataStyle}>{ticket.data.bill.paymentMethod}</td>
                                            <td style={tableDataStyle}>{ticket.data.bill.distribution.cash}</td>
                                            <td style={tableDataStyle}>{ticket.data.bill.distribution['credit card']}</td>
                                            <td style={tableDataStyle}>{ticket.data.bill.distribution.upi}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colSpan="2" style={tableDataStyle}><strong>Total</strong></td>
                                    <td style={tableDataStyle}><strong>{totalPeople}</strong></td>
                                    <td style={tableDataStyle}></td>
                                    <td style={tableDataStyle}><strong>{totalAmount}</strong></td>
                                    <td style={tableDataStyle}></td>
                                    <td style={tableDataStyle}></td>
                                </tr>
                            </tfoot>
                        </table>
                    )}

                    {/* Socks Table */}
                    {tabIndex === 1 && (
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
                            <thead>
                                <tr>
                                    <th style={tableHeaderStyle}>Date</th>
                                    <th style={tableHeaderStyle}>Time</th>
                                    <th style={tableHeaderStyle}>XS</th>
                                    <th style={tableHeaderStyle}>S</th>
                                    <th style={tableHeaderStyle}>M</th>
                                    <th style={tableHeaderStyle}>L</th>
                                    <th style={tableHeaderStyle}>XL</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.map(ticket => {
                                    const { date, time } = formatDate(ticket.data.createdAt);
                                    const socksQuantities = { XS: 0, S: 0, M: 0, L: 0, XL: 0 };

                                    if (ticket.data.bill.socks && Array.isArray(ticket.data.bill.socks)) {
                                        ticket.data.bill.socks.forEach(sock => {
                                            if (socksQuantities.hasOwnProperty(sock.size)) {
                                                socksQuantities[sock.size] += sock.quantity;
                                            }
                                        });
                                    }

                                    return (
                                        <tr key={ticket.id}>
                                            <td style={tableDataStyle}>{date}</td>
                                            <td style={tableDataStyle}>{time}</td>
                                            <td style={tableDataStyle}>{socksQuantities.XS}</td>
                                            <td style={tableDataStyle}>{socksQuantities.S}</td>
                                            <td style={tableDataStyle}>{socksQuantities.M}</td>
                                            <td style={tableDataStyle}>{socksQuantities.L}</td>
                                            <td style={tableDataStyle}>{socksQuantities.XL}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colSpan="2" style={tableDataStyle}><strong>Total</strong></td>
                                    <td style={tableDataStyle}><strong>{socksQuantitiesTotal.XS}</strong></td>
                                    <td style={tableDataStyle}><strong>{socksQuantitiesTotal.S}</strong></td>
                                    <td style={tableDataStyle}><strong>{socksQuantitiesTotal.M}</strong></td>
                                    <td style={tableDataStyle}><strong>{socksQuantitiesTotal.L}</strong></td>
                                    <td style={tableDataStyle}><strong>{socksQuantitiesTotal.XL}</strong></td>
                                </tr>
                            </tfoot>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

// Add styles here or import them




// Styles for filters and buttons
const filterContainerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    maxWidth: '800px',
    marginBottom: '20px',
    gap: '10px',
};

const inputStyle = {
    padding: '10px',
    fontSize: '16px',
    borderRadius: '5px',
    border: '1px solid #ddd',
    flex: 1,
};

const buttonStyle = {
    padding: '10px 20px',
    fontSize: '16px',
    backgroundColor: '#333',
    color: '#fff',
    borderRadius: '5px',
    border: 'none',
    cursor: 'pointer',
    transition: '0.3s',
};

const containerStyle = {
    margin: '20px auto',
    padding: '20px',
    maxWidth: '1200px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
};

const tabContainerStyle = {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '20px',
};

const tabButtonStyle = {
    padding: '10px 20px',
    margin: '0 5px',
    cursor: 'pointer',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontWeight: 'bold',
    transition: 'background-color 0.3s, color 0.3s',
};

const tableContainerStyle = {
    overflowX: 'auto',
    marginTop: '20px',
};

const tableHeaderStyle = {
    padding: '10px',
    backgroundColor: '#333',
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
};

const tableDataStyle = {
    padding: '10px',
    border: '1px solid #ddd',
    textAlign: 'center',
};


export default Records;
