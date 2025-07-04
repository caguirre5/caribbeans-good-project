import React, { useEffect, useState } from "react";
import { useAuth } from "../../../../contexts/AuthContext";

interface User {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
}

const ContractLoader: React.FC = () => {
  const { currentUser } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = await currentUser?.getIdToken();
        const response = await fetch(`${import.meta.env.VITE_FULL_ENDPOINT}/api/users`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) throw new Error('Failed to fetch users');
        const data = await response.json();
        const activeUsers = data.filter((user: any) => user.isActive === true);
        setUsers(activeUsers);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, [currentUser]);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredUsers([]);
      return;
    }
    const lower = searchTerm.toLowerCase();
    setFilteredUsers(
      users.filter(
        user =>
          user.firstName.toLowerCase().includes(lower) ||
          user.lastName.toLowerCase().includes(lower) ||
          user.email.toLowerCase().includes(lower)
      )
    );
  }, [searchTerm, users]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type === 'application/pdf' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
      setSelectedFile(file);
    } else {
      alert("Only PDF or DOCX files are allowed.");
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file); // incluye prefix 'data:application/pdf;base64,...'
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = async () => {
    if (!selectedFile || !selectedUser) return;
  
    try {
      const base64Content = await fileToBase64(selectedFile);
  
      // 1️⃣ Subir archivo a S3
      const uploadResponse = await fetch(`${import.meta.env.VITE_FULL_ENDPOINT}/resourcelibray/upload`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: selectedFile.name,
          fileContent: base64Content,
          user: selectedUser,
          contentType: selectedFile.type,
        }),
      });
  
      if (!uploadResponse.ok) throw new Error('Failed to upload file');
      const uploadData = await uploadResponse.json();
  
      // Obtener la URL de S3 del archivo subido
      const s3Url = uploadData.fileKey
        ? `https://caribbeangoods-content-s3.s3.amazonaws.com/${uploadData.fileKey}`
        : uploadData.s3Url; // ajusta según lo que retorne tu endpoint /upload

      const token = await currentUser?.getIdToken();
  
      // 2️⃣ Crear contrato en Firestore
      const contractResponse = await fetch(`${import.meta.env.VITE_FULL_ENDPOINT}/api/addContract`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`  
        },
        body: JSON.stringify({
          name: `${selectedUser.firstName} ${selectedUser.lastName}`,
          email: selectedUser.email,
          s3Url: s3Url,
        }),
      });
  
      if (!contractResponse.ok) {
        const errorText = await contractResponse.text();
        console.error('Error creating contract:', errorText);
        throw new Error(`Failed to create contract: ${contractResponse.status} ${contractResponse.statusText}`);
      }
      
      const contractData = await contractResponse.json();
  
      alert(`Contract created successfully for ${contractData.name}!`);
  
      // Opcional: limpiar estados o redirigir
      setSelectedFile(null);
      setSelectedUser(null);
      setSearchTerm('');
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred while uploading the file or creating the contract.');
    }
  };
  
  
  

  return (
    <div className="bg-white p-4 rounded-lg shadow-md w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Upload Contract</h2>
      </div>

      {/* Archivo */}
      <div className="mb-4">
        <label className="block mb-1 font-medium">Upload PDF or DOCX</label>
        <input
          type="file"
          accept=".pdf,.docx"
          onChange={handleFileChange}
          className="border px-3 py-2 w-full rounded text-sm"
        />
        {selectedFile && (
          <p className="mt-2 text-sm text-green-600">Selected file: {selectedFile.name}</p>
        )}
      </div>

      {/* Buscar y seleccionar usuario */}
      <div className="mb-4 relative">
        <label className="block mb-1 font-medium">Select User</label>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setSelectedUser(null);
          }}
          placeholder="Search by name or email"
          className="border px-3 py-2 w-full rounded text-sm"
        />
        {filteredUsers.length > 0 && !selectedUser && (
          <ul className="absolute bg-white border w-full mt-1 rounded max-h-48 overflow-y-auto z-10">
            {filteredUsers.map(user => (
              <li
                key={user.uid}
                className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                onClick={() => {
                  setSelectedUser(user);
                  setSearchTerm(`${user.firstName} ${user.lastName}`);
                  setFilteredUsers([]);
                }}
              >
                {user.firstName} {user.lastName} — {user.email}
              </li>
            ))}
          </ul>
        )}
        {selectedUser && (
          <p className="text-sm text-blue-600 mt-2">
            Selected: {selectedUser.firstName} {selectedUser.lastName}
          </p>
        )}
      </div>

      <button
        disabled={!selectedFile || !selectedUser}
        onClick={handleSubmit}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        Submit Contract
      </button>
    </div>
  );
};

export default ContractLoader;
