import React, { useEffect, useState } from "react";
import { useAuth } from '../../../contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsis, faSyncAlt } from '@fortawesome/free-solid-svg-icons';

const UserList: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState<{ [key: string]: boolean }>({});
  const [loadingRoleChange, setLoadingRoleChange] = useState<{ [key: string]: boolean }>({});
  const { currentUser } = useAuth();

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = await currentUser?.getIdToken();
      const response = await fetch(`http://${import.meta.env.VITE_ENDPOINT}:${import.meta.env.VITE_PORT}/api/users`, {
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

  const toggleRoasterRole = async (userUid: string, hasRoasterRole: boolean) => {
    try {
      setLoadingRoleChange((prev) => ({ ...prev, [userUid]: true }));
      setMenuOpen((prevMenuOpen) => ({
        ...prevMenuOpen,
        [userUid]: false,
      }));
  
      const token = await currentUser?.getIdToken();
      const response = await fetch(`http://${import.meta.env.VITE_ENDPOINT}:${import.meta.env.VITE_PORT}/api/users/${userUid}/role`, {
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
    setMenuOpen((prevMenuOpen) => ({
      ...prevMenuOpen,
      [userUid]: !prevMenuOpen[userUid],
    }));
  };

  if (loading) return <p>Loading users...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Active Users</h2>
        <button onClick={fetchUsers} className="text-gray-500 hover:text-gray-700">
          <FontAwesomeIcon icon={faSyncAlt} className="h-5 w-5" />
        </button>
      </div>
      {users.length > 0 ? (
        users.map((user) => (
          <div 
            key={user.uid} 
            className="flex flex-col lg:flex-row lg:justify-between items-center mb-4 p-2 border-b"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:gap-4">
              <h3 className="text-lg font-bold">{user.firstName} {user.lastName}</h3>
              <p className="text-gray-500">{user.email}</p>
            </div>
            <div className="relative mt-2 lg:mt-0">
              {loadingRoleChange[user.uid] ? (
                <div className="p-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-gray-500"></div>
                </div>
              ) : (
                <button
                  className="p-2 hover:bg-gray-100 rounded-full"
                  onClick={() => toggleMenu(user.uid)}
                >
                  <FontAwesomeIcon
                    icon={faEllipsis}
                    className="text-gray-500"
                  />
                </button>
              )}
              {menuOpen[user.uid] && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50">
                  <button
                    onClick={() => toggleRoasterRole(user.uid, Array.isArray(user.roles) && user.roles.includes("roaster"))}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    {Array.isArray(user.roles) && user.roles.includes("roaster") ? "Revoke Roaster" : "Make Roaster"}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))
      ) : (
        <p>No active users found.</p>
      )}
    </div>
  );
};

export default UserList;
