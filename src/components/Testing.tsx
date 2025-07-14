import React, { useState } from 'react';

const EmailTestForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSendEmail = async () => {
    setStatus('loading');
    setMessage('');

    try {
      const response = await fetch(`${import.meta.env.VITE_FULL_ENDPOINT}/email/sendWelcomeEmail`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientEmail: 'caguirre.dt@gmail.com',
          userName: 'Cristian',
        }),
      });
      

      if (response.ok) {
        setStatus('success');
        setMessage('Email sent successfully!');
      } else {
        const text = await response.text();
        setStatus('error');
        setMessage(`Failed to send email: ${text}`);
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
      setMessage('Something went wrong while sending the email.');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded-lg shadow-md bg-white">
      <h2 className="text-xl font-semibold mb-4 text-[#174B3D]">Send Test Email</h2>
      <input
        type="email"
        placeholder="Enter email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full px-4 py-2 border border-[#174B3D] rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-[#174B3D]"
      />
      <button
        onClick={handleSendEmail}
        disabled={status === 'loading' || !email}
        className="w-full bg-[#174B3D] text-white py-2 px-4 rounded-md hover:bg-[#1E5A49] transition"
      >
        {status === 'loading' ? 'Sending...' : 'Send Email'}
      </button>

      {message && (
        <p className={`mt-4 text-center ${status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
          {message}
        </p>
      )}
    </div>
  );
};

export default EmailTestForm;
