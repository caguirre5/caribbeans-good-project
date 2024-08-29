import React, { useEffect, useState } from "react";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "../../firebase/firebase"; // Importa la configuración de Firestore

const UserList: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Obtener la lista de usuarios de Firestore
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersCollection = collection(db, "users");
        const userSnapshot = await getDocs(usersCollection);
        const userList = userSnapshot.docs.map((doc) => ({
          uid: doc.id, // Usar el 'id' del documento como 'uid'
          ...doc.data(),
        }));
        setUsers(userList);
      } catch (err) {
        console.error("Error fetching users: ", err);
        setError("Failed to load users.");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Manejar la actualización de roles de usuario
  const toggleRoasterRole = async (userUid: string, hasRoasterRole: boolean) => {
    const userRef = doc(db, "users", userUid);

    try {
      // Encuentra el usuario y obtén el array de roles actual
      const user = users.find((user) => user.uid === userUid);

      if (!user) {
        throw new Error("User not found");
      }

      const currentRoles = Array.isArray(user.roles) ? user.roles : []; // Asegúrate de que 'roles' siempre sea un array

      const updatedRoles = hasRoasterRole
        ? currentRoles.filter((role: string) => role !== "roaster") // Revocar rol
        : [...currentRoles, "roaster"]; // Agregar rol

      await updateDoc(userRef, { roles: updatedRoles });

      // Actualiza el estado local
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.uid === userUid ? { ...user, roles: updatedRoles } : user
        )
      );

      alert(`User role updated successfully!`);
    } catch (err) {
      console.error("Error updating user role: ", err);
      setError("Failed to update user role.");
    }
  };

  if (loading) return <p>Loading users...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="max-w-4xl mx-auto p-4 mt-20">
      <h2 className="text-2xl font-bold mb-4">User List</h2>
      <div className="bg-gray-100 p-4 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => {
              const hasRoasterRole = Array.isArray(user.roles) && user.roles.includes("roaster");
              return (
                <tr key={user.uid}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.firstName || "Unknown"} {user.lastName || "Unknown"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{user.email || "No Email"}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleRoasterRole(user.uid, hasRoasterRole)}
                      className={`px-4 py-2 rounded-md ${
                        hasRoasterRole
                          ? "bg-red-500 text-white hover:bg-red-600"
                          : "bg-green-500 text-white hover:bg-green-600"
                      }`}
                    >
                      {hasRoasterRole ? "Revoke Roaster" : "Make Roaster"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserList;
