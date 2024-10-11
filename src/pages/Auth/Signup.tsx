import React, { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, db } from '../../firebase/firebase'; 
import { useNavigate } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore'; 

const Signup: React.FC = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verificationEmailSent, setVerificationEmailSent] = useState(false);

  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!validatePassword(password)) {
      setError("Password must be at least 8 characters long and contain a mix of uppercase, lowercase, and numbers.");
      return;
    }

    try {
      setError(null);
      setLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      await updateProfile(userCredential.user, {
        displayName: `${firstName} ${lastName}`
      });

      await sendEmailVerification(userCredential.user);

      await setDoc(doc(db, "users", userCredential.user.uid), {
        uid: userCredential.user.uid,
        firstName: firstName,
        lastName: lastName,
        email: email,
        createdAt: new Date(),
        isActive: false, 
        emailVerified: false,
        profileCompleted: false,
        roles: ["user"],
      });
      await signOut(auth);
      setVerificationEmailSent(true);
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

      await setDoc(doc(db, "users", result.user.uid), {
        uid: result.user.uid,
        firstName: result.user.displayName?.split(' ')[0] || '',
        lastName: result.user.displayName?.split(' ')[1] || '',
        email: result.user.email,
        createdAt: new Date(),
        photoURL: result.user.photoURL || "", 
        isActive: false,
        emailVerified: true,
        profileCompleted: false,
        roles: ["user"],
      });

      console.log("Google Sign-in successful");
      navigate('/'); 
    } catch (err: any) {
      setError(err.message);
    }
  };

  const validatePassword = (password: string) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/;
    return regex.test(password);
  };

  if (verificationEmailSent) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#c9d3c0]">
        <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-center text-[#174B3D]">Check Your Email</h2>
          <p className="text-center text-gray-700">
            We've sent a verification link to your email. Please check your inbox and click the link to verify your email before logging in.
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full py-2 px-4 bg-[#174B3D] text-white font-semibold rounded-md hover:bg-[#1E5A49] focus:outline-none focus:ring-2 focus:ring-[#174B3D] mt-4"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

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
          <img src="/src/assets/green_logo_icon.png" alt="Logo" className="h-12 mb-6" /> {/* Cambia la ruta de la imagen al logo que uses */}
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
            <img src="/src/assets/Google.png" alt="Google" className="h-5 mr-3" /> {/* Cambia la ruta del icono de Google */}
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
