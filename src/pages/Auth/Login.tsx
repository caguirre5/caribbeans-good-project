import React, { useState } from 'react';
import { signInWithEmailAndPassword, sendPasswordResetEmail, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, db } from '../../firebase/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (user.emailVerified) {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          emailVerified: true
        });
        console.log("User is active and logged in.");
        navigate('/');
      } else {
        console.log("Please verify your email before logging in.");
        setError("Please verify your email before logging in.");
        await signOut(auth);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      navigate('/'); // Navega al dashboard o home después del login con Google
      console.log("Google Sign-in successful");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      setError('Please enter your email to reset your password.');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      alert('Password reset email sent!');
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (currentUser) {
    return <p className="text-center text-lg">Already logged in as {currentUser.email}</p>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#c9d3c0]">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg">
        <div className="flex justify-center">
          <img src="/src/assets/green_logo_icon.png" alt="Logo" className="h-12 mb-6" /> {/* Cambia la ruta de la imagen al logo que uses */}
        </div>
        <h2 className="text-2xl font-bold text-center text-[#174B3D]">Welcome Back</h2>
        <p className="text-center text-sm text-[#174B3D] mb-8">Log in to your account</p>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <form className="space-y-4" onSubmit={handleLogin}>
          <div>
            <label className="block text-[#174B3D] font-semibold">Email address*</label>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-[#174B3D] rounded-md focus:outline-none focus:ring-2 focus:ring-[#174B3D]"
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
          <img src="/src/assets/Google.png" alt="Google" className="h-5 mr-3" /> {/* Cambia la ruta del icono de Google */}
          Continue with Google
        </button>
      </div>
    </div>
  );
};

export default Login;
