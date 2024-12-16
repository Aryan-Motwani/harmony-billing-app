import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import SignatureCollection from './SigantureCollection';
import Form from './Form';
import TicketsPage from './Ticket';
import Admin from './Admin';
import Records from './Record';
import "./index.css"
import Reports from './Reports';
import Form2 from './Form2';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/form" element={<Form />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/ticket/:id" element={<SignatureCollection />} />
        <Route path="/tickets" element={<TicketsPage />} />
        <Route path="/records" element={<Records />}
        <Route path="/reports" element={<Reports />} /> */}
        <Route path="/form2" element={<Form2 />} />
        {/* Optional: Redirect unknown routes to /form */}
        <Route path="*" element={<Navigate to="/form" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
