import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './createClient';
import Navbar from './Navbar';

export default function TicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [showSigned, setShowSigned] = useState(false);
  const navigate = useNavigate();

  // Function to fetch tickets from Supabase
  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase.from('Tickets').select('*');
      if (error) throw error;

      setTickets(data);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    }
  };

  // Fetch tickets once when the component mounts
  useEffect(() => {
    fetchTickets();
  }, []);

  // Handle row click to navigate to ticket details
  const handleRowClick = (ticketId) => {
    navigate(`/ticket/${ticketId}`);
  };

  // Filter tickets based on the signed/unsigned toggle
  const filteredTickets = showSigned
    ? tickets.filter((ticket) => ticket.data.status === true)
    : tickets.filter((ticket) => ticket.data.status !== true);

  return (
    <div>
      <Navbar />
      <div className="max-w-6xl mx-auto py-8 px-6">
        {/* Title */}
        <h1 className="text-5xl font-extrabold text-center text-black cursor-pointer mb-8 hover:text-gray-700 transition-all duration-300"
        style={{cursor: "pointer"}}
          onClick={fetchTickets}
        >
           <button>Tickets Dashboard</button>
        </h1>

        {/* Toggle Button */}
        <div className="text-center mb-6">
          <button
            onClick={() => setShowSigned((prev) => !prev)}
            className="py-3 px-6 text-lg bg-black text-white rounded-full shadow-lg hover:bg-gray-800 transition-all duration-300"
          >
            {showSigned ? 'Show Unsigned Tickets' : 'Show Signed Tickets'}
          </button>
        </div>

        {/* Tickets Table */}
        <div className="overflow-hidden rounded-lg shadow-lg bg-white">
          <table className="min-w-full table-auto">
            <thead className="bg-black text-white">
              <tr>
                <th className="px-6 py-4 text-left text-lg font-semibold">Customer</th>
                <th className="px-6 py-4 text-left text-lg font-semibold">Date</th>
                <th className="px-6 py-4 text-left text-lg font-semibold">Time</th>
                <th className="px-6 py-4 text-left text-lg font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.length > 0 ? (
                filteredTickets.map((ticket, index) => (
                  <tr
                    key={index}
                    onClick={() => handleRowClick(ticket.id)}
                    className="hover:bg-gray-100 cursor-pointer transition-all duration-200"
                  >
                    <td className="px-6 py-4 border-b text-gray-700">
                      {ticket.data.customerName}
                    </td>
                    <td className="px-6 py-4 border-b text-gray-700">
                      {ticket.data.date}
                    </td>
                    <td className="px-6 py-4 border-b text-gray-700">
                      {ticket.data.time}
                    </td>
                    <td
                      className={`px-6 py-4 border-b font-medium ${
                        ticket.data.status === true
                          ? 'text-green-500'
                          : 'text-red-500'
                      }`}
                    >
                      {ticket.data.status === true ? 'Signed' : 'Unsigned'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-4 text-center text-gray-500 text-lg"
                  >
                    No tickets available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500">
          <p className="text-sm">
            © {new Date().getFullYear()} Ticket Management System. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
