import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEye, faUpload, faTimes, faSpinner, faBars , faTrash, faEdit, faCheckCircle } from '@fortawesome/free-solid-svg-icons';


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

    const [membersOrder, setMembersOrder] = useState<TeamMember[]>([]);

    const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editPosition, setEditPosition] = useState('');

    const [editLoading, setEditLoading] = useState(false);
    const [editSuccess, setEditSuccess] = useState(false);

    useEffect(() => {
        if (activeTab === 'list') fetchTeamMembers();
    }, [activeTab]);

    useEffect(() => {
        setMembersOrder(teamMembers);
    }, [teamMembers]);

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

    const handleReorder = async (newOrder: TeamMember[]) => {
        setMembersOrder(newOrder);
    
        try {
            const token = await currentUser?.getIdToken();
            const orderedIds = newOrder.map(member => member.id);
    
            const response = await fetch(`${import.meta.env.VITE_FULL_ENDPOINT}/api/updateTeamMembersOrder`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ orderedIds }),
            });
    
            if (!response.ok) throw new Error('Failed to update order');
            // console.log('Order updated successfully');
        } catch (error) {
            console.error('Error updating order:', error);
            alert('Failed to update order');
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
            alert('Error adding team member:');
            setUploadMessage('An error occurred while adding the team member.');
        } finally {
            setUploading(false);
        }
    };
    
    const handleEditMember = async () => {
        if (!editName || !editPosition || !editingMemberId) {
            alert("Please fill in all fields.");
            return;
        }

        setEditLoading(true);
    
        try {
            const token = await currentUser?.getIdToken();
    
            const response = await fetch(`${import.meta.env.VITE_FULL_ENDPOINT}/api/teamMembers/${editingMemberId}/update`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: editName,
                    position: editPosition
                }),
            });
    
            if (!response.ok) throw new Error('Failed to update team member');
            setEditLoading(false);
            setEditSuccess(true);
            fetchTeamMembers();

            setTimeout(() => {
                setEditingMemberId(null);
                setEditSuccess(false);
            }, 2000);
        } catch (error) {
            console.error('Error updating team member:', error);
            alert('An error occurred while updating the team member.');
            setEditName('');
            setEditPosition('');
            setEditLoading(false);
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
                loading ? (
                    <div className="flex justify-center items-center">
                        <FontAwesomeIcon icon={faSpinner} spin size="2x" className="text-blue-600" />
                    </div>
                ) : (
                    <Reorder.Group
                        axis="y"
                        values={membersOrder}
                        onReorder={handleReorder}
                        className="flex flex-col gap-2"
                    >
                        {membersOrder.map((member) => (
                            <Reorder.Item
                                key={member.id}
                                value={member}
                                className="flex flex-col lg:flex-row lg:justify-between items-center p-4 border rounded-md shadow-sm bg-white"
                            >
                                <div className="flex flex-col lg:flex-row lg:items-center lg:gap-4 w-full">
                                    {/* Drag handle */}
                                    <button className="cursor-grab active:cursor-grabbing p-2 rounded-full bg-gray-100 hover:bg-gray-200">
                                        <FontAwesomeIcon icon={faBars} className="text-gray-500" />
                                    </button>

                                    {/* <span className="text-gray-400 text-sm font-mono lg:mt-0 mt-1">
                                        #{index + 1}
                                    </span> */}

                                    <div className="flex flex-col">
                                        <h3 className="text-lg font-bold">{member.name}</h3>
                                        <p className="text-gray-500">{member.position}</p>
                                    </div>

                                    <button
                                        onClick={() => setSelectedPhotoUrl(member.photoUrl)}
                                        className="ml-0 lg:ml-4 mt-2 lg:mt-0 inline-flex items-center justify-center p-2 rounded-full bg-blue-50 hover:bg-blue-100"
                                    >
                                        <FontAwesomeIcon icon={faEye} className="text-blue-600" />
                                    </button>
                                </div>

                                <div className="flex items-center gap-2 mt-3 lg:mt-0">
                                    <button
                                        onClick={() => {
                                            setEditingMemberId(member.id);
                                            setEditName(member.name);
                                            setEditPosition(member.position);
                                        }}
                                        className="p-2 rounded-full bg-blue-50 hover:bg-blue-100 transition"
                                        title="Edit"
                                    >
                                        <FontAwesomeIcon icon={faEdit} className="text-blue-600" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (confirm('Are you sure you want to delete this team member?')) {
                                                handleDeleteTeamMember(member.id, member.fileKey);
                                            }
                                        }}
                                        className="p-2 rounded-full bg-red-50 hover:bg-red-100 transition"
                                        title="Delete"
                                    >
                                        <FontAwesomeIcon icon={faTrash} className="text-red-600" />
                                    </button>
                                </div>
                            </Reorder.Item>
                        ))}
                    </Reorder.Group>
                )
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

            {editingMemberId && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        className="bg-white rounded-lg p-6 shadow-lg w-full max-w-md relative text-center"
                    >
                        {!editLoading && !editSuccess && (
                            <>
                                <button
                                    onClick={() => setEditingMemberId(null)}
                                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                                >
                                    <FontAwesomeIcon icon={faTimes} />
                                </button>
                                <h2 className="text-lg font-bold mb-4">Edit Team Member</h2>
                                <div className="mb-4 text-left">
                                    <label className="block mb-1 font-medium">Name</label>
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="border px-3 py-2 w-full rounded text-sm"
                                    />
                                </div>
                                <div className="mb-4 text-left">
                                    <label className="block mb-1 font-medium">Position</label>
                                    <input
                                        type="text"
                                        value={editPosition}
                                        onChange={(e) => setEditPosition(e.target.value)}
                                        className="border px-3 py-2 w-full rounded text-sm"
                                    />
                                </div>
                                <button
                                    onClick={handleEditMember}
                                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full flex justify-center items-center gap-2"
                                >
                                    <FontAwesomeIcon icon={faUpload} />
                                    Save Changes
                                </button>
                            </>
                        )}

                        {editLoading && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col justify-center items-center"
                            >
                                <FontAwesomeIcon icon={faSpinner} spin size="3x" className="text-blue-600 mb-4" />
                                <p className="text-blue-600 font-medium">Saving changes...</p>
                            </motion.div>
                        )}

                        {editSuccess && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col justify-center items-center text-green-600"
                            >
                                <FontAwesomeIcon icon={faCheckCircle} size="3x" className="mb-4" />
                                <p className="font-semibold">Changes saved successfully!</p>
                            </motion.div>
                        )}
                    </motion.div>
                </div>
            )}

        </div>
    );
};

export default TeamMembersDashboard;
