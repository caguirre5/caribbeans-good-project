import React, { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, db } from '../../firebase/firebase'; // Importa la configuración de Firebase y Firestore
import { useAuth } from '../../contexts/AuthContext'; // Importa tu AuthContext
import { useNavigate } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore'; // Importa los métodos necesarios de Firestore

const Signup: React.FC = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { currentUser } = useAuth(); // Accede al estado de autenticación
  const navigate = useNavigate();

  // Función para manejar el registro con email y password
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!validatePassword(password)) {
      setError("Password must be at least 8 characters long and contain a mix of uppercase, lowercase, numbers, and special characters.");
      return;
    }

    try {
      setError(null);
      setLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Actualiza el perfil del usuario en Firebase Authentication
      await updateProfile(userCredential.user, {
        displayName: `${firstName} ${lastName}`
      });

      // Almacena el usuario en Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), {
        uid: userCredential.user.uid,
        firstName: firstName,
        lastName: lastName,
        email: email,
        createdAt: new Date(),
        isActive: false,
        profileCompleted: false,
        roles: ["user"],
      });

      console.log("Signup successful");
      navigate('/'); // Redirige al home o a donde prefieras
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Función para manejar el inicio de sesión con Google
  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);

      // Almacena el usuario en Firestore
      await setDoc(doc(db, "users", result.user.uid), {
        uid: result.user.uid,
        firstName: result.user.displayName?.split(' ')[0] || '',
        lastName: result.user.displayName?.split(' ')[1] || '',
        email: result.user.email,
        createdAt: new Date(),
        photoURL: result.user.photoURL || "", 
        isActive: true,
        profileCompleted: false,
        roles: ["user"],
      });

      console.log("Google Sign-in successful");
      navigate('/'); // Redirige al home o a donde prefieras
    } catch (err: any) {
      setError(err.message);
    }
  };

  const validatePassword = (password: string) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(password);
  };

  if (currentUser) {
    return <p className="text-center text-lg">Already signed up as {currentUser.email}</p>;
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row items-center justify-center bg-gray-100">
      {/* Imagen para la versión Desktop */}
      <div className="hidden lg:w-1/2 h-full">
        <img
          src="https://blogs.iita.org/wp-content/uploads/2019/05/Ripe-coffee-cherries.jpg" // Aquí puedes colocar la URL de la imagen de tu preferencia
          alt="Signup"
          className="w-full h-full object-contain"
        />
      </div>
      
      {/* Formulario de Signup */}
      <div className="w-full lg:w-1/2 max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-900">Sign Up</h2>
        {error && <p className="text-red-500 text-center">{error}</p>}
        <form className="space-y-4" onSubmit={handleSignup}>
          {/* Contenedor para Nombre y Apellido en la misma fila en versión Desktop */}
          <div className="flex flex-col lg:flex-row lg:space-x-4">
            <div className="w-full">
              <label className="block text-gray-700">First Name</label>
              <input
                type="text"
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div className="w-full">
              <label className="block text-gray-700">Last Name</label>
              <input
                type="text"
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          </div>
          <div>
            <label className="block text-gray-700">Email</label>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-gray-700">Password</label>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-gray-700">Confirm Password</label>
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-indigo-500 text-white font-semibold rounded-md hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            {loading ? 'Signing Up...' : 'Sign Up'}
          </button>
        </form>
        <div className="text-center mt-4">
          <p className="text-gray-700">Or sign up with:</p>
          <button
            onClick={handleGoogleSignIn}
            className="mt-2 py-2 px-4 bg-red-500 text-white font-semibold rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400"
          >
            Sign Up with Google
          </button>
        </div>
      </div>
    </div>
  );
};

export default Signup;
