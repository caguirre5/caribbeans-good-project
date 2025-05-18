import { useState } from 'react';
import { motion } from 'framer-motion';

function ContactForm() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    message: ''
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const sendInfo = async (payload: {
    recipientEmail: string;
    firstName: string;
    lastName: string;
    email: string;
    message: string;
  }) => {
    console.log("📤 Enviando contacto a backend:", payload);
  
    try {
      const response = await fetch(`${import.meta.env.VITE_FULL_ENDPOINT}/resourcelibray/sendcontact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
  
      const result = await response.text();
      console.log("✅ Respuesta del servidor:", result);
    } catch (err) {
      console.error('❌ Error al enviar contacto:', err);
      throw err;
    }
  };
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSubmitted(false); // por si lo vuelven a enviar
  
    const payload = {
      recipientEmail: 'caguirre.dt@gmail.com',
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      message: formData.message,
    };
  
    try {
      await sendInfo(payload);
      setSubmitted(true); // ✅ Solo si no hubo error
    } catch (error) {
      console.error("❌ Error sending info:", error);
      setSubmitted(false);
    } finally {
      setLoading(false); // 🕐 Se detiene el loader siempre, al final
    }
  };
  
  
  

  return (
    <div className="w-full flex flex-col items-center justify-center">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">Contact Us</h2>

      {loading ? (
        <motion.div
            className="flex flex-col items-center justify-center text-[#044421]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <motion.div
            className="w-8 h-8 border-4 border-t-transparent border-[#044421] rounded-full mb-4"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            />
            <p>Sending your message...</p>
        </motion.div>
    ) : submitted ? (
        <motion.div
          className="text-center text-[#044421]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <h3 className="text-xl font-semibold">Message sent!</h3>
          <p className="text-sm">Thank you for contacting us. We will get back to you shortly.</p>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col lg:flex-row gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="firstName">
                First Name
              </label>
              <input
                className="rounded-full px-4 py-2 focus:outline-none focus:ring-0"
                id="firstName"
                name="firstName"
                placeholder="John"
                type="text"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="lastName">
                Last Name
              </label>
              <input
                className="rounded-full px-4 py-2 focus:outline-none focus:ring-0"
                id="lastName"
                name="lastName"
                placeholder="Doe"
                type="text"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="my-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="email">
              Email
            </label>
            <input
              className="block w-full px-4 py-2 rounded-full border-gray-300 shadow-sm focus:outline-none focus:ring-0 sm:text-sm"
              id="email"
              name="email"
              placeholder="john@example.com"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="my-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="message">
              Message
            </label>
            <textarea
              className="block w-full px-4 py-2 rounded-2xl border-gray-300 shadow-sm focus:outline-none focus:ring-0 sm:text-sm"
              id="message"
              name="message"
              placeholder="Your message..."
              rows={4}
              value={formData.message}
              onChange={handleChange}
              required
            />
          </div>

          <button
            className="mt-2 rounded-full bg-[#c9d3c0] py-2 px-12 text-sm font-medium text-white shadow-sm transition duration-300 ease-in-out hover:bg-[#9ed1c4] hover:text-[#044421] focus:outline-none focus:ring-0"
            type="submit"
          >
            Send
          </button>
        </form>
      )}
    </div>
  );
}

export default ContactForm;
