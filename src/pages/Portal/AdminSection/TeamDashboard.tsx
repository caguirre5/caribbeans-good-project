import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEye, faUpload, faTimes, faSpinner, faEllipsisV, faTrash, faEdit } from '@fortawesome/free-solid-svg-icons';


interface TeamMember {
    id: string;
    name: string;
    position: string;
    photoUrl: string;
    fileKey: string;
}

const TeamMembersDashboard: React.FC = () => {
    const { currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState<'list' | 'add'>('list');

    // States for viewing members
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null);

    // States for adding a member
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [position, setPosition] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadMessage, setUploadMessage] = useState<string | null>(null);

    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

    useEffect(() => {
        if (activeTab === 'list') fetchTeamMembers();
    }, [activeTab]);

    const fetchTeamMembers = async () => {
        setLoading(true);
        try {
            const token = await currentUser?.getIdToken();
            const response = await fetch(`${import.meta.env.VITE_FULL_ENDPOINT}/api/getTeamMembers`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch team members');
            const data = await response.json();
            setTeamMembers(data);
        } catch (error) {
            console.error('Error fetching team members:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && (file.type.startsWith('image/'))) {
            setSelectedFile(file);
        } else {
            alert("Only image files are allowed.");
        }
    };

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    };

    const handleUpload = async () => {
        if (!firstName || !lastName || !position || !selectedFile) {
            alert("Please complete all fields.");
            return;
        }
    
        setUploading(true);
        try {
            const base64Content = await fileToBase64(selectedFile);
    
            // 1️⃣ Upload photo to S3
            const uploadResponse = await fetch(`${import.meta.env.VITE_FULL_ENDPOINT}/s3/uploadTeamMemberPhoto`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fileName: selectedFile.name,
                    fileContent: base64Content,
                    contentType: selectedFile.type,
                    user: { firstName, lastName },
                }),
            });
    
            if (!uploadResponse.ok) throw new Error('Failed to upload photo');
            const uploadData = await uploadResponse.json();
            const photoUrl = uploadData.s3Url;
            const fileKey = uploadData.fileKey; // ✅ capturar fileKey retornado
    
            // 2️⃣ Create Firestore document including fileKey
            const token = await currentUser?.getIdToken();
            const addResponse = await fetch(`${import.meta.env.VITE_FULL_ENDPOINT}/api/addTeamMember`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: `${firstName} ${lastName}`,
                    position,
                    photoUrl,
                    fileKey, // ✅ enviar fileKey
                }),
            });
    
            if (!addResponse.ok) throw new Error('Failed to create team member');
            setUploadMessage('Team member added successfully!');
            setFirstName('');
            setLastName('');
            setPosition('');
            setSelectedFile(null);
            fetchTeamMembers();
        } catch (error) {
            console.error('Error adding team member:', error);
            setUploadMessage('An error occurred while adding the team member.');
        } finally {
            setUploading(false);
        }
    };
    

    const handleDeleteTeamMember = async (id: string, fileKey: string) => {
        if (!confirm('Are you sure you want to delete this team member?')) return;
    
        try {
            const token = await currentUser?.getIdToken();
    
            // 1️⃣ Eliminar foto de S3
            const s3Response = await fetch(`${import.meta.env.VITE_FULL_ENDPOINT}/s3/deleteTeamMemberPhoto`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ fileKey }),
            });
            if (!s3Response.ok) throw new Error('Failed to delete photo from S3');
    
            // 2️⃣ Eliminar documento en Firestore
            const firestoreResponse = await fetch(`${import.meta.env.VITE_FULL_ENDPOINT}/api/teamMembers/${id}/delete`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (!firestoreResponse.ok) throw new Error('Failed to delete team member from Firestore');
    
            alert('Team member deleted successfully!');
            // Actualizar estado o refetch aquí
        } catch (error) {
            console.error('Error deleting team member:', error);
            alert('An error occurred while deleting the team member.');
        }
    };
    

    return (
        <div className="bg-white p-4 rounded-lg shadow-md w-full">
            {/* Tabs */}
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Team Members</h2>
                <button
                    onClick={() => setActiveTab(activeTab === 'list' ? 'add' : 'list')}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
                >
                    <FontAwesomeIcon icon={activeTab === 'list' ? faPlus : faEye} />
                    {activeTab === 'list' ? 'Add Member' : 'View Members'}
                </button>
            </div>

            {/* View Members */}
            {activeTab === 'list' && (
                <div>
                    {loading ? (
                        <div className="flex justify-center items-center">
                            <FontAwesomeIcon icon={faSpinner} spin size="2x" className="text-blue-600" />
                        </div>
                    ) : teamMembers.length === 0 ? (
                        <p>No team members found.</p>
                    ) : (
                        <table className="min-w-full border text-sm">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="border px-2 py-1 text-left">Name</th>
                                    <th className="border px-2 py-1 text-left">Position</th>
                                    <th className="border px-2 py-1 text-left">Photo</th>
                                    <th className="border px-2 py-1 text-left">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {teamMembers.map(member => (
                                    <tr key={member.id}>
                                        <td className="border px-2 py-1">{member.name}</td>
                                        <td className="border px-2 py-1">{member.position}</td>
                                        <td className="border px-2 py-1">
                                            <button
                                                onClick={() => setSelectedPhotoUrl(member.photoUrl)}
                                                className="text-blue-600 hover:text-blue-800"
                                            >
                                                <FontAwesomeIcon icon={faEye} />
                                            </button>
                                        </td>
                                        <td className="border px-2 py-1 relative">
                                            <button
                                                onClick={() => setOpenDropdownId(openDropdownId === member.id ? null : member.id)}
                                                className="text-gray-600 hover:text-gray-800"
                                            >
                                                <FontAwesomeIcon icon={faEllipsisV} />
                                            </button>

                                            <AnimatePresence>
                                                {openDropdownId === member.id && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: -10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -10 }}
                                                        className="absolute right-0 mt-2 bg-white border rounded shadow-md z-50 w-32"
                                                    >
                                                        <button
                                                            onClick={() => {
                                                                // placeholder, implementar luego
                                                                alert('Edit functionality coming soon!');
                                                                setOpenDropdownId(null);
                                                            }}
                                                            className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                                                        >
                                                            <FontAwesomeIcon icon={faEdit} className="mr-2" /> Edit
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                if (confirm('Are you sure you want to delete this team member?')) {
                                                                    handleDeleteTeamMember(member.id, member.fileKey);
                                                                }
                                                                setOpenDropdownId(null);
                                                            }}
                                                            className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-red-600"
                                                        >
                                                            <FontAwesomeIcon icon={faTrash} className="mr-2" /> Delete
                                                        </button>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </td>

                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* Add Member */}
            {activeTab === 'add' && (
                <div className="space-y-4">
                    <div>
                        <label className="block mb-1 font-medium">First Name</label>
                        <input
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="border px-3 py-2 w-full rounded text-sm"
                        />
                    </div>
                    <div>
                        <label className="block mb-1 font-medium">Last Name</label>
                        <input
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="border px-3 py-2 w-full rounded text-sm"
                        />
                    </div>
                    <div>
                        <label className="block mb-1 font-medium">Position</label>
                        <input
                            type="text"
                            value={position}
                            onChange={(e) => setPosition(e.target.value)}
                            className="border px-3 py-2 w-full rounded text-sm"
                        />
                    </div>
                    <div>
                        <label className="block mb-1 font-medium">Upload Photo</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="border px-3 py-2 w-full rounded text-sm"
                        />
                        {selectedFile && (
                            <p className="mt-2 text-sm text-green-600">Selected: {selectedFile.name}</p>
                        )}
                    </div>
                    <button
                        onClick={handleUpload}
                        disabled={uploading}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
                    >
                        <FontAwesomeIcon icon={faUpload} />
                        {uploading ? 'Uploading...' : 'Submit'}
                    </button>
                    {uploadMessage && (
                        <p className={`text-sm ${uploadMessage.includes('error') ? 'text-red-600' : 'text-green-600'}`}>
                            {uploadMessage}
                        </p>
                    )}
                </div>
            )}

            {/* Modal for viewing photo */}
            <AnimatePresence>
                {selectedPhotoUrl && (
                    <motion.div
                        className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedPhotoUrl(null)}
                    >
                        <motion.div
                            className="bg-white p-4 rounded shadow-lg max-w-lg w-full relative"
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.8 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setSelectedPhotoUrl(null)}
                                className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
                            >
                                <FontAwesomeIcon icon={faTimes} size="lg" />
                            </button>
                            <img src={selectedPhotoUrl} alt="Team Member" className="w-full h-auto rounded" />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TeamMembersDashboard;
