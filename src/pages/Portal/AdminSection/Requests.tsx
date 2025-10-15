import React, { useEffect, useState } from "react";
import { useAuth } from '../../../contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSyncAlt } from '@fortawesome/free-solid-svg-icons';

const getRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};



const Requests: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<{ [key: string]: string | null }>({});
  const { currentUser } = useAuth();

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

      // Filtrar usuarios que tengan isActive = false y emailVerified = true
      const inactiveVerifiedUsers = users.filter((user: any) => user.isActive === false && user.emailVerified === true);
      setUsers(inactiveVerifiedUsers);
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

  const handleAccept = async (userUid: string, userEmail: string, userName: string) => {
    setUpdating((prev) => ({ ...prev, [userUid]: 'accept' }));
  
    try {
      const token = await currentUser?.getIdToken();
      const response = await fetch(`${import.meta.env.VITE_FULL_ENDPOINT}/api/users/${userUid}/activate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
  
      if (response.ok) {
        // 1️⃣ Eliminar usuario de la lista local
        setUsers(users.filter((user) => user.uid !== userUid));
  
        // 2️⃣ Enviar correo de activación
        await handleSendWelcomeEmail(userEmail, userName);

  
      } else {
        alert("Failed to activate user");
      }
    } catch (error) {
      console.error("Error activating user: ", error);
      setError("Failed to activate user.");
    } finally {
      setUpdating((prev) => ({ ...prev, [userUid]: null }));
    }
  };
  

  const handleDecline = async (userUid: string) => {
    setUpdating((prev) => ({ ...prev, [userUid]: 'decline' }));
    
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
      } else {
        alert("Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user: ", error);
      setError("Failed to delete user.");
    } finally {
      setUpdating((prev) => ({ ...prev, [userUid]: null }));
    }
  };

  const handleSendWelcomeEmail = async (recipientEmail: string, userName: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_FULL_ENDPOINT}/email/sendWelcomeEmail`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientEmail,
          userName,
        }),
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error sending welcome email:', errorText);
        alert("Failed to send welcome email.");
      } else {
        console.log("Welcome email sent successfully!");
      }
    } catch (error) {
      console.error("Error sending welcome email:", error);
      alert("An error occurred while sending the welcome email.");
    }
  };
  
  
  

  if (loading) return <p>Loading users...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Pending Requests</h2>
        <button onClick={fetchUsers} className="text-gray-500 hover:text-gray-700">
          <FontAwesomeIcon icon={faSyncAlt} className="h-5 w-5" />
        </button>
      </div>
  
      {users.length > 0 ? (
        users.map((user) => {
          const raw = user.createdAt ?? user.metadata?.creationTime;
          let created: string | null = null;
  
          // 🔽 Normalizamos el formato de fecha desde Firestore o Auth
          if (raw instanceof Date) {
            created = raw.toISOString();
          } else if (typeof raw === "string") {
            created = raw;
          } else if (raw && typeof raw === "object") {
            if (typeof raw.seconds === "number") {
              created = new Date(raw.seconds * 1000).toISOString();
            } else if (typeof (raw as any)._seconds === "number") {
              created = new Date((raw as any)._seconds * 1000).toISOString();
            }
          }
  
          const relative = created ? getRelativeTime(created) : "—";
  
          return (
            <div
              key={user.uid}
              className="flex flex-col lg:flex-row lg:justify-between items-center mb-4 p-2 border-b"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:gap-4">
                <div>
                  <h3 className="text-lg font-bold">
                    {user.firstName} {user.lastName}
                  </h3>
                  <p className="text-gray-500">{user.email}</p>
                  <p className="text-sm text-gray-500">
                    Requested:&nbsp;
                    <span className="font-medium">{relative}</span>
                  </p>
                </div>
              </div>
  
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    handleAccept(
                      user.uid,
                      user.email,
                      `${user.firstName} ${user.lastName}`
                    )
                  }
                  className="mt-2 lg:mt-0 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
                  disabled={updating[user.uid] === "accept"}
                >
                  {updating[user.uid] === "accept" ? (
                    <div className="loader ease-linear rounded-full border-4 border-t-4 border-white h-6 w-6"></div>
                  ) : (
                    "Accept"
                  )}
                </button>
  
                <button
                  onClick={() => handleDecline(user.uid)}
                  className="mt-2 lg:mt-0 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
                  disabled={updating[user.uid] === "decline"}
                >
                  {updating[user.uid] === "decline" ? (
                    <div className="loader ease-linear rounded-full border-4 border-t-4 border-white h-6 w-6"></div>
                  ) : (
                    "Decline"
                  )}
                </button>
              </div>
            </div>
          );
        })
      ) : (
        <div className="text-center py-10">
          <p className="text-lg text-gray-500">No pending requests.</p>
          <p className="text-sm text-gray-400">
            There are currently no users with pending requests.
          </p>
        </div>
      )}
    </div>
  );
  
  
};

export default Requests;
