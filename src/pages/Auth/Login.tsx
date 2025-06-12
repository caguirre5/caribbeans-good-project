import React, { useState } from 'react';
import { signInWithEmailAndPassword, sendPasswordResetEmail, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, db } from '../../firebase/firebase';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

import GoogleLogo from '../../assets/Google.png'
import CaribbeanLogo from '../../assets/green_logo_icon.png'

const checkEmailExists = async (email: string) => {
  const response = await fetch(`${import.meta.env.VITE_FULL_ENDPOINT}/api/users/check-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email })
  });

  const data = await response.json();
  return data.exists;
};


const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const updateLastLogin = async (user: any) => {
    try {
      const token = await user.getIdToken();
      await fetch(`${import.meta.env.VITE_FULL_ENDPOINT}/api/users/${user.uid}/last-login`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (err) {
      console.error('Failed to update last login:', err);
    }
  };  

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
  
    try {
  
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
  
      if (user.emailVerified) {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, { emailVerified: true });
        // await updateLastLogin(user);
        navigate("/");
      } else {
        setError("Please verify your email before logging in.");
        await signOut(auth);
      }
    } catch (err: any) {
      if (err.code === "auth/invalid-credential") {
        setError("Invalid email or password. If you created your account with Google, please use continue with Google.");
      } else if (err.code === "auth/user-not-found") {
        setError("No account found with this email.");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
  
      // Referencia al documento del usuario en Firestore
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
  
      if (!userDoc.exists()) {
        // Si no existe el documento del usuario, crearlo
        await setDoc(userDocRef, {
          uid: user.uid,
          firstName: user.displayName?.split(' ')[0] || '',
          lastName: user.displayName?.split(' ')[1] || '',
          email: user.email,
          createdAt: new Date(),
          photoURL: user.photoURL || "",
          isActive: false, // Puedes definir la lógica de activación
          emailVerified: true,
          profileCompleted: false,
          roles: ["user"],
        });

        const recipients = ['caguirre.dt@gmail.com', 'info@caribbeangoods.co.uk'];

        for (const email of recipients) {
          try {
            const response = await fetch(`${import.meta.env.VITE_FULL_ENDPOINT}/resourcelibray/sendalert`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                recipientEmail: email,
                alertMessage: 'An user has signed up to the portal',
              }),
            });

            const result = await response.text();
            console.log(`Alert sent to ${email}:`, result);
          } catch (err) {
            console.error(`Error sending alert to ${email}:`, err);
          }
        }
      }
  
      await updateLastLogin(user);
      // console.log("Google Sign-in successful and user saved to Firestore");
      navigate('/'); // Navega al dashboard o home después del login con Google
    } catch (err: any) {
      setError(err.message);
    }
  };
  

  const handlePasswordReset = async () => {
    setError(null);
    if (!email) {
      setError('Please enter your email to reset your password.');
      return;
    }
  
    const exists = await checkEmailExists(email);
  
    if (!exists) {
      setError("No account found with this email.");
      return;
    }
  
    try {
      await sendPasswordResetEmail(auth, email.trim().toLowerCase());
      alert('Password reset email sent!');
    } catch (err: any) {
      setError(err.message);
    }
  };
  
  

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#c9d3c0]">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg">
        <div className="flex justify-center">
          <img src={CaribbeanLogo} alt="Logo" className="h-12 mb-6" /> {/* Cambia la ruta de la imagen al logo que uses */}
        </div>
        <h2 className="text-2xl font-bold text-center text-[#174B3D]">Welcome Back</h2>
        <p className="text-center text-sm text-[#174B3D] mb-8">Log in to your account</p>
        {error && (
  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
    <strong className="font-bold">Login Error: </strong>
    <span className="block sm:inline">{error}</span>
  </div>
)}

        <form className="space-y-4" onSubmit={handleLogin}>
          <div>
            <label className="block text-[#174B3D] font-semibold">Email address*</label>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-[#174B3D] rounded-md focus:outline-none focus:ring-2 focus:ring-[#174B3D] bg-white text-black autofill:bg-white autofill:text-black"
            />
          </div>
          <div>
            <label className="block text-[#174B3D] font-semibold">Password*</label>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-[#174B3D] rounded-md focus:outline-none focus:ring-2 focus:ring-[#174B3D]"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#174B3D] text-white font-semibold rounded-md hover:bg-[#1E5A49] focus:outline-none focus:ring-2 focus:ring-[#174B3D]"
          >
            {loading ? 'Logging in...' : 'Continue'}
          </button>
        </form>
        <div className="text-center mt-4 space-y-4">
          <button
            onClick={handlePasswordReset}
            className="text-[#174B3D] hover:underline"
          >
            Forgot password?
          </button>
          <p className="text-[#174B3D]">Don't have an account? <span className="font-semibold cursor-pointer hover:underline" onClick={() => navigate('/signup')}>Sign up</span></p>
        </div>
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#174B3D]"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-[#174B3D]">OR</span>
          </div>
        </div>
        <button
          onClick={handleGoogleSignIn} // Lógica de Sign In con Google
          className="w-full py-3 border border-[#174B3D] text-[#174B3D] font-semibold rounded-md hover:bg-[#f0f2f1] focus:outline-none focus:ring-2 focus:ring-[#174B3D] flex items-center justify-center"
        >
          <img src={GoogleLogo} alt="Google" className="h-5 mr-3" /> {/* Cambia la ruta del icono de Google */}
          Continue with Google
        </button>
      </div>
    </div>
  );
};

export default Login;
