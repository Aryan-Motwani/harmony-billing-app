import React, { useState, useRef, useEffect } from 'react';
import Modal from 'react-modal';
import { supabase } from './createClient';
import client from './sanityClient';
import { useParams } from 'react-router-dom';
import Navbar from './Navbar';

// Supabase client setup
// const supabase = createClient('YOUR_SUPABASE_URL', 'YOUR_SUPABASE_ANON_KEY');

// Set app element for accessibility
Modal.setAppElement('#root');

export default function SignatureCollection() {
  const { id } = useParams(); // Get the ticket ID from the URL
  const [people, setPeople] = useState([]); // Store people from the ticket
  const [signatures, setSignatures] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTermsAccepted, setIsTermsAccepted] = useState(false);
  const [currentPersonIndex, setCurrentPersonIndex] = useState(null);
  const [currTicket, setCurrTicket] = useState('');
  const canvasRefs = useRef([]);
  const isDrawing = useRef(false);

  useEffect(() => {
    const fetchTicketData = async () => {
      try {
        // Fetch data from Supabase
        console.log(id);
        
        const { data: tickets, error } = await supabase
          .from('Tickets')
          .select('*')
          .eq('id', id);
        
        setCurrTicket(tickets[0])
        
          

        if (error) throw error;
        if (tickets.length > 0) {
          const ticket = tickets[0];
          const peopleData = ticket.data.people.map(person => ({
            name: person.name,
            signature: person.signature || null,
          }));
          setPeople(peopleData);
          setSignatures(peopleData);
        }
      } catch (error) {
        console.error('Error fetching ticket data:', error);
      }
    };

    fetchTicketData();
  }, [id]);

  // Open signature modal
  const handleOpenSignature = (index) => {
    setCurrentPersonIndex(index);
    setIsModalOpen(true);
    document.body.style.overflow = 'hidden'; // Prevent body scrolling when modal is open
  };

  // Accept terms
  const handleAcceptTerms = () => {
    setIsTermsAccepted(true);
  };

  // Save signature and upload to Sanity
  const handleSaveSignature = async () => {
    const canvas = canvasRefs.current[currentPersonIndex];
    const dataURL = canvas.toDataURL('image/png'); // This is the Base64-encoded string
  
    // Close the modal and display the image first
    const newSignatures = [...signatures];
    newSignatures[currentPersonIndex] = {
      name: people[currentPersonIndex].name,
      signature: dataURL, // Store the Base64 string here
    };
  
    setSignatures(newSignatures);
    setIsModalOpen(false);
    document.body.style.overflow = '';
    setIsTermsAccepted(false); // Reset terms acceptance for next person
  
    // Clear the canvas after saving
    clearCanvas();
  
    try {
      // Fetch pricing data from Supabase
      const { data, error } = await supabase.from('prices').select('*');
  
      if (error) {
        console.error('Error fetching prices:', error);
        return;
      }
  
      if (!data || data.length === 0) {
        console.error('No pricing data available.');
        return;
      }
  
      const prices = data[0]?.prices;
  
      const signatureStatus = prices.signatureStatus; // Get the signatureStatus field

      console.log(signatureStatus);
      
  
      // Simulate the state of signatures including the current one being added
      const updatedSignatures = [...signatures];
      updatedSignatures[currentPersonIndex] = {
        name: people[currentPersonIndex].name,
        signature: dataURL,
      };
  
      // Check if all signatures are completed
      const allSigned = updatedSignatures.every(person => person.signature !== null);
  
      // Check if at least one signature is completed
      const oneSigned = updatedSignatures.some(person => person.signature !== null);
  
      // Determine the new status based on signatureStatus
      const newStatus = signatureStatus === 'one' ? oneSigned : allSigned;
  
      // Update the specific person's signature in the Supabase ticket data
      const updatedPeople = people.map((person, index) =>
        index === currentPersonIndex
          ? { ...person, signature: dataURL }
          : person
      );
  
      // Update the ticket in Supabase with the modified people array and status
      const updatedData = {
        ...currTicket.data,
        people: updatedPeople,
        status: newStatus, // Set status based on the condition
      };
  
      const { error: updateError } = await supabase
        .from('Tickets')
        .update({ data: updatedData })
        .eq('id', id);
  
      if (updateError) throw updateError;
  
      if (newStatus) {
        console.log('Ticket status set to true.');
      }
    } catch (error) {
      console.error('Error updating signature in Supabase:', error);
    }
  };
  
  
  
  
  

  // Clear the canvas
  const clearCanvas = () => {
    const canvas = canvasRefs.current[currentPersonIndex];
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  
  const startDrawing = (x, y) => {
    const canvas = canvasRefs.current[currentPersonIndex];
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    ctx.lineWidth = 2 * window.devicePixelRatio; // Adjust line width for clarity
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'black';
    ctx.beginPath();
    ctx.moveTo(x * scaleX, y * scaleY);
    isDrawing.current = true;
  };

  const draw = (x, y) => {
    if (!isDrawing.current) return;
    const canvas = canvasRefs.current[currentPersonIndex];
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    ctx.lineTo(x * scaleX, y * scaleY);
    ctx.stroke();
  };

  const handleMouseDown = (e) => {
    const rect = canvasRefs.current[currentPersonIndex].getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    startDrawing(x, y);

    const mouseMoveHandler = (e) => {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      draw(x, y);
    };

    const mouseUpHandler = () => {
      isDrawing.current = false;
      window.removeEventListener('mousemove', mouseMoveHandler);
      window.removeEventListener('mouseup', mouseUpHandler);
    };

    window.addEventListener('mousemove', mouseMoveHandler);
    window.addEventListener('mouseup', mouseUpHandler);
  };

  const handleTouchStart = (e) => {
    e.preventDefault();
    const rect = canvasRefs.current[currentPersonIndex].getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    startDrawing(x, y);
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    const rect = canvasRefs.current[currentPersonIndex].getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    draw(x, y);
  };


  const handleTouchEnd = () => {
    isDrawing.current = false;
  };

  const clickButton = async () => {
    await supabase
      .from('Tickets')
      .update({ name : 'gulan' })
      .eq('id', 14)
      .select()
    
  }

  return (
    <div>
      <Navbar/>
      <div style={{ maxWidth: '600px', margin: 'auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
        <h1 style={{ textAlign: 'center' }}>Signature Collection</h1>
        {/* <button onClick={clickButton}>click</button> */}
        {people.map((person, index) => (
          <div key={index} style={{ marginBottom: '20px' }}>
            <label>{person.name}</label>
            <button
              onClick={() => handleOpenSignature(index)}
              style={{
                marginTop: '10px',
                width: '100%',
                padding: '12px',
                backgroundColor: 'black',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              Open Signature
            </button>
          </div>
        ))}

        {/* Collected Signatures Section */}
        <div style={{ marginTop: '20px' }}>
          <h2 style={{ fontSize: '20px' }}>Collected Signatures</h2>
          {signatures.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {signatures.map((sig, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center' }}>
                  {sig.signature ? (
                    <img src={sig.signature} alt={`Signature of ${sig.name}`} style={{ width: '200px', height: 'auto', border: '1px solid #ccc', borderRadius: '4px', marginRight: '10px' }} />
                  ) : (
                    <div style={{ width: '200px', height: '50px', border: '1px dashed #ccc', borderRadius: '4px', marginRight: '10px' }} />
                  )}
                  <span>{sig.name}</span>
                </div>
              ))}
            </div>
          ) : (
            <p>No signatures collected yet.</p>
          )}
        </div>
      </div>
      {/* Modal for Terms Acceptance */}
      <Modal
        isOpen={isModalOpen && !isTermsAccepted}
        onRequestClose={() => setIsModalOpen(false)}
        style={{
          content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            transform: 'translate(-50%, -50%)',
            width: '90%', // Responsive width
            maxWidth: '600px', // Maximum width
            height: '70%', // Responsive height
            maxHeight: '400px', // Maximum height
            border: '1px solid #ccc', // Thin border
            borderRadius: '8px', // Rounded corners
            overflow: 'hidden', // Prevent scrolling of the modal itself
          },
        }}
      >
        <div style={{ 
            padding: '10px', // Padding for terms content
            height: 'calc(100% - 80px)', // Adjust height to fit accept button
            overflowY: 'scroll' // Enable scrolling within terms content
        }}>
          <h2>Terms & Conditions</h2>
          <p>
            Before signing, please read the following terms and conditions carefully.
            By accepting, you agree to the terms stated below.
          </p>
          {/* Terms and conditions go here */}
        </div>
        <button
          onClick={handleAcceptTerms}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: 'black',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
            marginTop: '20px',
          }}
        >
          Accept Terms
        </button>
      </Modal>

      {/* Signature Modal */}
      <Modal
        isOpen={isModalOpen && isTermsAccepted}
        onRequestClose={() => setIsModalOpen(false)}
        style={{
          content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            transform: 'translate(-50%, -50%)',
            width: '90%',
            maxWidth: '600px',
            height: '70%',
            maxHeight: '400px',
          },
        }}
      >
        <h2>Draw Your Signature</h2>
        <canvas
          ref={(el) => (canvasRefs.current[currentPersonIndex] = el)}
          width="500"
          height="200"
          style={{ border: '1px solid #ccc', width: '100%', height: 'auto' }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />
        <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
          <button
            onClick={handleSaveSignature}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: 'black',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Save Signature
          </button>
          <button
            onClick={clearCanvas}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: 'white',
              color: 'black',
              border: '1px solid #ccc',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Clear Signature
          </button>
        </div>
      </Modal>
    </div>
  );
}
