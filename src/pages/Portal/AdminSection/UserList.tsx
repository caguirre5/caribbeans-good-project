import React, { useEffect, useState } from "react";
import { useAuth } from '../../../contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsis, faSyncAlt } from '@fortawesome/free-solid-svg-icons';

const getRelativeTime = (dateString: string) => {
  const now = new Date();
  const past = new Date(dateString);
  const diff = Math.floor((now.getTime() - past.getTime()) / 1000);
  if (diff < 60) return `just now`;
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hour(s) ago`;
  return `${Math.floor(diff / 86400)} day(s) ago`;
};

const UserList: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuOpenUid, setMenuOpenUid] = useState<string | null>(null);
  const [loadingRoleChange, setLoadingRoleChange] = useState<{ [key: string]: boolean }>({});
  const [modalUser, setModalUser] = useState<string | null>(null);
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'unverified'>('active');
  const { currentUser } = useAuth();

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await currentUser?.getIdToken();
      const response = await fetch(`${import.meta.env.VITE_FULL_ENDPOINT}/api/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      console.error("Error fetching users: ", err);
      setError("Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);
  useEffect(() => {
    document.body.style.overflow = modalUser ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [modalUser]);

  const filteredUsers = users.filter((user) =>
    `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (uid: string) => {
    if (uid === currentUser?.uid) return alert("You can't delete your own account");
    try {
      const token = await currentUser?.getIdToken();
      const response = await fetch(`${import.meta.env.VITE_FULL_ENDPOINT}/api/users/${uid}/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        setUsers(users.filter((u) => u.uid !== uid));
        setModalUser(null);
        setConfirmChecked(false);
      } else {
        alert('Failed to delete user');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleRoasterRole = async (uid: string, hasRole: boolean) => {
    try {
      setLoadingRoleChange((prev) => ({ ...prev, [uid]: true }));
      setMenuOpenUid(null);
      const token = await currentUser?.getIdToken();
      const response = await fetch(`${import.meta.env.VITE_FULL_ENDPOINT}/api/users/${uid}/role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: 'roaster' })
      });
      if (response.ok) {
        setUsers(users.map((u) =>
          u.uid === uid
            ? { ...u, roles: hasRole ? u.roles.filter((r: string) => r !== 'roaster') : [...u.roles, 'roaster'] }
            : u
        ));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRoleChange((prev) => ({ ...prev, [uid]: false }));
    }
  };

  const filteredActive = filteredUsers.filter((u) => u.isActive === true);
  const filteredUnverified = filteredUsers.filter((u) => u.emailVerified === false);

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      {/* Tabs */}
      <div className="flex gap-4 mb-4 border-b">
        <button
          onClick={() => setActiveTab('active')}
          className={`py-2 px-4 font-semibold ${activeTab === 'active' ? 'border-b-2 border-[#174B3D] text-[#174B3D]' : 'text-gray-500'}`}
        >
          Active Users
        </button>
        <button
          onClick={() => setActiveTab('unverified')}
          className={`py-2 px-4 font-semibold ${activeTab === 'unverified' ? 'border-b-2 border-[#174B3D] text-[#174B3D]' : 'text-gray-500'}`}
        >
          Unverified Users
        </button>
      </div>

      {/* Search and refresh */}
      <div className="flex justify-between items-center mb-4">
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border border-gray-300 px-2 py-1 rounded-md text-sm"
        />
        <button onClick={fetchUsers} className="text-gray-500 hover:text-gray-700">
          <FontAwesomeIcon icon={faSyncAlt} className="h-5 w-5" />
        </button>
      </div>

      {loading ? (
        <p>Loading users...</p>
      ) : error ? (
        <p>{error}</p>
      ) : activeTab === 'active' ? (
        filteredActive.length > 0 ? (
          filteredActive.map((user) => (
            <div key={user.uid} className="flex flex-col lg:flex-row justify-between items-center mb-4 p-2 border-b">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                <h3 className="font-bold">{user.firstName} {user.lastName}</h3>
                <p className="text-gray-500">{user.email}</p>
                {user.lastLogin && <p className="text-sm text-gray-400">Last login: {getRelativeTime(user.lastLogin)}</p>}
              </div>
              <div className="relative mt-2 lg:mt-0">
                {loadingRoleChange[user.uid] ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-gray-500"></div>
                ) : (
                  <button
                    onClick={() => setMenuOpenUid(prev => prev === user.uid ? null : user.uid)}
                    className="p-2 rounded-full hover:bg-gray-100"
                  >
                    <FontAwesomeIcon icon={faEllipsis} className="text-gray-500" />
                  </button>
                )}
                {menuOpenUid === user.uid && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50">
                    <button
                      onClick={() => toggleRoasterRole(user.uid, Array.isArray(user.roles) && user.roles.includes("roaster"))}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      {user.roles.includes("roaster") ? "Revoke Roaster" : "Make Roaster"}
                    </button>
                    <button
                      onClick={() => setModalUser(user.uid)}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-100"
                    >
                      Delete User
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <p>No active users found.</p>
        )
      ) : (
        filteredUnverified.length > 0 ? (
          filteredUnverified.sort((a, b) => (a.createdAt?._seconds || 0) - (b.createdAt?._seconds || 0)).map((user) => (
            <div key={user.uid} className="mb-4 border-b pb-2">
              <p className="font-semibold">{user.firstName} {user.lastName}</p>
              <p className="text-gray-600">{user.email}</p>
              <p className="text-sm text-gray-500">
                Created on: {user.createdAt && typeof user.createdAt._seconds === 'number'
                  ? new Date(user.createdAt._seconds * 1000).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })
                  : 'Unknown'}
              </p>
            </div>
          ))
        ) : (
          <p>No users pending email verification.</p>
        )
      )}

      {/* Confirm Delete Modal */}
      {modalUser && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
            <h2 className="text-lg font-bold mb-4">Confirm Deletion</h2>
            <p className="text-sm text-gray-600 mb-4">
              This action cannot be undone. Please confirm you want to delete this user.
            </p>
            <label className="flex items-center mb-4">
              <input
                type="checkbox"
                checked={confirmChecked}
                onChange={() => setConfirmChecked(!confirmChecked)}
                className="mr-2"
              />
              I understand this action is permanent
            </label>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 text-sm"
                onClick={() => {
                  setModalUser(null);
                  setConfirmChecked(false);
                }}
              >
                Cancel
              </button>
              <button
                className={`px-4 py-2 bg-red-500 text-white rounded text-sm ${!confirmChecked ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-600'}`}
                disabled={!confirmChecked}
                onClick={() => handleDelete(modalUser)}
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserList;
