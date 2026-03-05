import React, { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { auth, db } from '../../firebase/firebase';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore';

import GoogleLogo from '../../assets/Google.png';
import CaribbeanLogo from '../../assets/green_logo_icon.png';

const Signup: React.FC = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const checkEmailExists = async (email: string) => {
    const response = await fetch(
      `${import.meta.env.VITE_FULL_ENDPOINT}/api/users/check-email`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      }
    );

    const data = await response.json();
    return data.exists;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!validatePassword(password)) {
      setError(
        'Password must be at least 8 characters long and contain a mix of uppercase, lowercase, and numbers.'
      );
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const emailInUse = await checkEmailExists(email);
      if (emailInUse) {
        setError('Email is already in use. Please use a different email or log in.');
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      await updateProfile(userCredential.user, {
        displayName: `${firstName} ${lastName}`,
      });

      await setDoc(doc(db, 'users', userCredential.user.uid), {
        uid: userCredential.user.uid,
        firstName,
        lastName,
        email,
        createdAt: new Date(),
        isActive: false,
        emailVerified: true, // ✅ ahora siempre true
        profileCompleted: false,
        roles: ['user'],
      });

      // (Mantengo tu email de "access request" al usuario)
      try {
        const response = await fetch(
          `${import.meta.env.VITE_FULL_ENDPOINT}/email/sendAccessRequestEmail`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ recipientEmail: email }),
          }
        );

        const result = await response.text();
        console.log(`Alert sent to ${email}:`, result);
      } catch (err) {
        console.error(`Error sending alert to ${email}:`, err);
      }

      // Aviso a admins (corrijo un bug: estabas reusando "email" como variable del loop)
      const recipients = ['caguirre.dt@gmail.com', 'info@caribbeangoods.co.uk'];

      for (const recipient of recipients) {
        try {
          const response = await fetch(
            `${import.meta.env.VITE_FULL_ENDPOINT}/resourcelibray/sendalert`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                recipientEmail: recipient,
                alertMessage: `A new user signed up using email and password: ${email}. Check the admin panel to manage their access request.`,
              }),
            }
          );

          const result = await response.text();
          console.log(`Alert sent to ${recipient}:`, result);
        } catch (err) {
          console.error(`Error sending alert to ${recipient}:`, err);
        }
      }

      // ✅ Sin pantalla de verificación: decide a dónde mandarlo
      // Si quieres que pase a login:
      navigate('/login');
      // o si prefieres enviarlo directo a Portal:
      // navigate('/Portal');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if (!user.email) {
        setError('Google account does not have an email associated.');
        return;
      }

      const emailInUse = await checkEmailExists(user.email);
      if (emailInUse) {
        navigate('/');
        return;
      }

      await setDoc(doc(db, 'users', result.user.uid), {
        uid: result.user.uid,
        firstName: result.user.displayName?.split(' ')[0] || '',
        lastName: result.user.displayName?.split(' ')[1] || '',
        email: result.user.email,
        createdAt: new Date(),
        photoURL: result.user.photoURL || '',
        isActive: false,
        emailVerified: true, // ya estaba true
        profileCompleted: false,
        roles: ['user'],
      });

      try {
        const response = await fetch(
          `${import.meta.env.VITE_FULL_ENDPOINT}/email/sendAccessRequestEmail`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ recipientEmail: user.email }),
          }
        );

        const resultText = await response.text();
        console.log(`Alert sent!`, resultText);
      } catch (err) {
        console.error(`Error sending alert!`, err);
      }

      const recipients = ['caguirre.dt@gmail.com', 'info@caribbeangoods.co.uk'];

      for (const recipient of recipients) {
        try {
          const response = await fetch(
            `${import.meta.env.VITE_FULL_ENDPOINT}/resourcelibray/sendalert`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                recipientEmail: recipient,
                alertMessage: `A new user signed up with Google: ${user.email}. Check the admin panel to manage their access request.`,
              }),
            }
          );

          const resultText = await response.text();
          console.log(`Alert sent to ${recipient}:`, resultText);
        } catch (err) {
          console.error(`Error sending alert to ${recipient}:`, err);
        }
      }

      navigate('/Portal');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const validatePassword = (password: string) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;
    return regex.test(password);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row items-center justify-center bg-[#c9d3c0]">
      <div className="hidden lg:w-1/2 h-full">
        <img
          src="https://blogs.iita.org/wp-content/uploads/2019/05/Ripe-coffee-cherries.jpg"
          alt="Signup"
          className="w-full h-full object-contain"
        />
      </div>

      <div className="w-full lg:w-1/2 max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg">
        <div className="flex justify-center">
          <img src={CaribbeanLogo} alt="Logo" className="h-12 mb-6" />
        </div>

        <h2 className="text-2xl font-bold text-center text-[#174B3D]">Welcome</h2>
        <p className="text-center text-sm text-[#174B3D] mb-8">Create an account</p>

        {error && <p className="text-red-500 text-center">{error}</p>}

        <form className="space-y-4" onSubmit={handleSignup}>
          <div className="flex flex-col lg:flex-row lg:space-x-4">
            <div className="w-full">
              <label className="block text-[#174B3D] font-semibold">First Name</label>
              <input
                type="text"
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="w-full px-4 py-2 border border-[#174B3D] rounded-md focus:outline-none focus:ring-2 focus:ring-[#174B3D]"
              />
            </div>

            <div className="w-full">
              <label className="block text-[#174B3D] font-semibold">Last Name</label>
              <input
                type="text"
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="w-full px-4 py-2 border border-[#174B3D] rounded-md focus:outline-none focus:ring-2 focus:ring-[#174B3D]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#174B3D] font-semibold">Email</label>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-[#174B3D] rounded-md focus:outline-none focus:ring-2 focus:ring-[#174B3D]"
            />
          </div>

          <div>
            <label className="block text-[#174B3D] font-semibold">Password</label>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-[#174B3D] rounded-md focus:outline-none focus:ring-2 focus:ring-[#174B3D]"
            />
          </div>

          <div>
            <label className="block text-[#174B3D] font-semibold">Confirm Password</label>
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-[#174B3D] rounded-md focus:outline-none focus:ring-2 focus:ring-[#174B3D]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-[#174B3D] text-white font-semibold rounded-md hover:bg-[#1E5A49] focus:outline-none focus:ring-2 focus:ring-[#174B3D]"
          >
            {loading ? 'Signing Up...' : 'Sign Up'}
          </button>
        </form>

        <div className="text-center mt-4">
          <p className="text-[#174B3D]">Or sign up with:</p>
          <button
            onClick={handleGoogleSignIn}
            className="w-full py-3 border border-[#174B3D] text-[#174B3D] font-semibold rounded-md hover:bg-[#f0f2f1] focus:outline-none focus:ring-2 focus:ring-[#174B3D] flex items-center justify-center"
          >
            <img src={GoogleLogo} alt="Google" className="h-5 mr-3" />
            Google
          </button>
        </div>

        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/login')}
            className="text-[#174B3D] font-semibold hover:underline"
          >
            Already have an account? Log in
          </button>
        </div>
      </div>
    </div>
  );
};

export default Signup;