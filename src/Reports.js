import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import { supabase } from './createClient';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Reports = () => {
    const [ticketsData, setTicketsData] = useState([]);
    const [dailyReport, setDailyReport] = useState([]);
    const [monthlyReport, setMonthlyReport] = useState([]);
    const [yearlyReport, setYearlyReport] = useState([]);
    const [reportType, setReportType] = useState('daily');

    useEffect(() => {
        const fetchData = async () => {
            const { data, error } = await supabase.from('Tickets').select('*');
            if (error) {
                console.error('Error fetching tickets:', error);
                return;
            }

            if (!data || data.length === 0) {
                console.error('No data available.');
                return;
            }

            setTicketsData(data);
            generateReports(data);
        };

        fetchData();
    }, []);

    const generateReports = (data) => {
        const daily = {};
        const monthly = {};
        const yearly = {};

        data.forEach((ticket) => {
            const [day, month, year] = ticket.data.date.split('-'); // Split DD-MM-YYYY
            const date = new Date(Number(year), Number(month) - 1, Number(day));;
            const dayKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
            const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`; // YYYY-MM
            const yearKey = `${date.getFullYear()}`; // YYYY

            // Daily aggregation
            if (!daily[dayKey]) {
                daily[dayKey] = { tickets: 0, amount: 0 };
            }
            daily[dayKey].tickets += ticket.data.people?.length || 0;
            daily[dayKey].amount += ticket.data.totalAmount || 0;

            // Monthly aggregation
            if (!monthly[monthKey]) {
                monthly[monthKey] = { tickets: 0, amount: 0 };
            }
            monthly[monthKey].tickets += ticket.data.people?.length || 0;
            monthly[monthKey].amount += ticket.data.totalAmount || 0;

            // Yearly aggregation
            if (!yearly[yearKey]) {
                yearly[yearKey] = { tickets: 0, amount: 0 };
            }
            yearly[yearKey].tickets += ticket.data.people?.length || 0;
            yearly[yearKey].amount += ticket.data.totalAmount || 0;
        });

        setDailyReport(daily);
        setMonthlyReport(monthly);
        setYearlyReport(yearly);
    };

    const renderTable = (report) => {
        return (
            <table style={tableStyle}>
                <thead>
                    <tr>
                        <th style={tableHeaderStyle}>Date</th>
                        <th style={tableHeaderStyle}>Total Tickets</th>
                        <th style={tableHeaderStyle}>Total Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {Object.entries(report).map(([key, value]) => (
                        <tr key={key}>
                            <td style={tableDataStyle}>{key}</td>
                            <td style={tableDataStyle}>{value.tickets}</td>
                            <td style={tableDataStyle}>{value.amount}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    };

    const getChartData = (report) => {
        const labels = Object.keys(report);
        const ticketsData = Object.values(report).map((r) => r.tickets);
        const amountData = Object.values(report).map((r) => r.amount);

        return {
            labels,
            datasets: [
                {
                    label: 'Tickets Sold',
                    data: ticketsData,
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                },
                {
                    label: 'Total Amount',
                    data: amountData,
                    backgroundColor: 'rgba(255, 99, 132, 0.6)',
                },
            ],
        };
    };

    return (
        <div>
            <Navbar />
            <div style={containerStyle}>
                <h1 style={{ textAlign: 'center' }}>Reports</h1>
                <div style={filterContainerStyle}>
                    <select
                        value={reportType}
                        onChange={(e) => setReportType(e.target.value)}
                        style={inputStyle}
                    >
                        <option value="daily">Daily</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                    </select>
                </div>

                {/* Render Charts */}
                <div style={chartContainerStyle}>
                    {reportType === 'daily' && (
                        <>
                            <h2>Daily Report</h2>
                            <Bar data={getChartData(dailyReport)} options={{ responsive: true }} />
                        </>
                    )}
                    {reportType === 'monthly' && (
                        <>
                            <h2>Monthly Report</h2>
                            <Line data={getChartData(monthlyReport)} options={{ responsive: true }} />
                        </>
                    )}
                    {reportType === 'yearly' && (
                        <>
                            <h2>Yearly Report</h2>
                            <Bar data={getChartData(yearlyReport)} options={{ responsive: true }} />
                        </>
                    )}
                </div>

                {/* Render Tables */}
                <div style={tableContainerStyle}>
                    {reportType === 'daily' && renderTable(dailyReport)}
                    {reportType === 'monthly' && renderTable(monthlyReport)}
                    {reportType === 'yearly' && renderTable(yearlyReport)}
                </div>
            </div>
        </div>
    );
};

// Add styles here
const containerStyle = { padding: '20px', maxWidth: '1200px', margin: '0 auto' };
const filterContainerStyle = { marginBottom: '20px', textAlign: 'center' };
const inputStyle = { padding: '10px', fontSize: '16px', borderRadius: '5px', border: '1px solid #ddd' };
const chartContainerStyle = { marginBottom: '40px' };
const tableContainerStyle = { marginTop: '20px' };
const tableStyle = { width: '100%', borderCollapse: 'collapse', marginBottom: '20px' };
const tableHeaderStyle = { padding: '10px', backgroundColor: '#333', color: '#fff', fontWeight: 'bold' };
const tableDataStyle = { padding: '10px', border: '1px solid #ddd', textAlign: 'center' };

export default Reports;
