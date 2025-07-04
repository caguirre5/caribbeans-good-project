import React, { useEffect, useState } from "react";
import { useAuth } from '../../../contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsis, faSyncAlt } from '@fortawesome/free-solid-svg-icons';

const getRelativeTime = (dateString: string) => {
  const now = new Date();
  const past = new Date(dateString);
  const diff = Math.floor((now.getTime() - past.getTime()) / 1000); // en segundos

  if (diff < 60) return `just now`;
  if (diff < 3600) {
    const mins = Math.floor(diff / 60);
    return `${mins} minute${mins !== 1 ? 's' : ''} ago`;
  }
  if (diff < 86400) {
    const hours = Math.floor(diff / 3600);
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  }
  const days = Math.floor(diff / 86400);
  return `${days} day${days !== 1 ? 's' : ''} ago`;
};

const UserList: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuOpenUid, setMenuOpenUid] = useState<string | null>(null);
  const [loadingRoleChange, setLoadingRoleChange] = useState<{ [key: string]: boolean }>({});
  const { currentUser } = useAuth();
  const [modalUser, setModalUser] = useState<string | null>(null);
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleDelete = async (userUid: string) => {
    if (userUid === currentUser?.uid) {
      alert("You cannot delete your own account.");
      return;
    }
    try {
      const token = await currentUser?.getIdToken();
      const response = await fetch(`${import.meta.env.VITE_FULL_ENDPOINT}/api/users/${userUid}/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
  
      if (response.ok) {
        setUsers(users.filter((user) => user.uid !== userUid));
        setModalUser(null);
        setConfirmChecked(false);
      } else {
        alert('Failed to delete user');
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      setError("Failed to delete user.");
    }
  };
  

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = await currentUser?.getIdToken();
      const response = await fetch(`${import.meta.env.VITE_FULL_ENDPOINT}/api/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
  
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
  
      const users = await response.json();
      // Filtrar los usuarios que tienen isActive como true
      const activeUsers = users.filter((user: any) => user.isActive === true);
      setUsers(activeUsers);
    } catch (err) {
      console.error("Error fetching users: ", err);
      setError("Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (modalUser) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  
    return () => {
      document.body.style.overflow = '';
    };
  }, [modalUser]);

  const filteredUsers = users.filter(user =>
    `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleRoasterRole = async (userUid: string, hasRoasterRole: boolean) => {
    try {
      setLoadingRoleChange((prev) => ({ ...prev, [userUid]: true }));
      setMenuOpenUid(null);
  
      const token = await currentUser?.getIdToken();
      const response = await fetch(`${import.meta.env.VITE_FULL_ENDPOINT}/api/users/${userUid}/role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: 'roaster' })
      });
  
      if (response.ok) {
        const updatedUsers = users.map((user) =>
          user.uid === userUid
            ? {
                ...user,
                roles: hasRoasterRole
                  ? user.roles.filter((role: any) => role !== 'roaster')
                  : [...user.roles, 'roaster'],
              }
            : user
        );
        setUsers(updatedUsers);
      } else {
        alert('Failed to update user role');
      }
    } catch (error) {
      console.error('Error updating user role: ', error);
      setError('Failed to update user role.');
    } finally {
      setLoadingRoleChange((prev) => ({ ...prev, [userUid]: false }));
    }
  };

  const toggleMenu = (userUid: string) => {
    setMenuOpenUid((prevUid) => (prevUid === userUid ? null : userUid));
  };
  

  if (loading) return <p>Loading users...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Active Users</h2>
        <div className="flex items-center gap-2">
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
      </div>

      {filteredUsers.length > 0 ? (
        filteredUsers.map((user) => (
          <div 
            key={user.uid} 
            className="flex flex-col lg:flex-row lg:justify-between items-center mb-4 p-2 border-b"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:gap-4">
              <h3 className="text-lg font-bold">{user.firstName} {user.lastName}</h3>
              <p className="text-gray-500">{user.email}</p>
              {user.lastLogin && (
                <>
                  <p className="text-gray-500">|</p>
                  <p className="text-gray-400">
                    Last login: {getRelativeTime(user.lastLogin)}
                  </p>
                </>
              )}

            </div>
            <div className="relative mt-2 lg:mt-0">
              {loadingRoleChange[user.uid] ? (
                <div className="p-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-gray-500"></div>
                </div>
              ) : (
                <button
                  className={`p-2 rounded-full ${
                    menuOpenUid === user.uid ? 'bg-gray-100' : 'hover:bg-gray-100'
                  }`}
                  onClick={() => toggleMenu(user.uid)}
                >
                  <FontAwesomeIcon
                    icon={faEllipsis}
                    className="text-gray-500"
                  />
                </button>
              )}
              {menuOpenUid === user.uid && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50">
                  <button
                    onClick={() => toggleRoasterRole(user.uid, Array.isArray(user.roles) && user.roles.includes("roaster"))}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    {Array.isArray(user.roles) && user.roles.includes("roaster") ? "Revoke Roaster" : "Make Roaster"}
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
      )}

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
                className={`px-4 py-2 bg-red-500 text-white rounded text-sm ${
                  !confirmChecked ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-600'
                }`}
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
