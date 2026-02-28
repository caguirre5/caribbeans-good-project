import React, { useEffect, useMemo, useState } from "react";
import Footer from "./Footer";
import { useAuth } from "../contexts/AuthContext";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { deleteUser } from "firebase/auth";

const Profile: React.FC = () => {
  const { currentUser } = useAuth();

  const [userData, setUserData] = useState<any>({});
  const [originalData, setOriginalData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProfileIncomplete, setIsProfileIncomplete] = useState(false);

  // Delete account UI state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteCheckedFinal, setDeleteCheckedFinal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const labelCls = "block text-xs font-semibold text-gray-700";
  const inputCls =
    "mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 " +
    "placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#044421]/20 focus:border-[#044421]/40";

  // ✅ Avatar source: Firestore photoURL OR Auth photoURL OR fallback letter
  const avatarUrl = useMemo(() => {
    return userData?.photoURL || currentUser?.photoURL || "";
  }, [userData?.photoURL, currentUser?.photoURL]);

  const avatarLetter = useMemo(() => {
    const letter =
      userData?.firstName?.[0] ||
      currentUser?.displayName?.[0] ||
      currentUser?.email?.[0] ||
      "?";
    return String(letter).toUpperCase();
  }, [userData?.firstName, currentUser?.displayName, currentUser?.email]);

  // Obtener la información del usuario de Firestore al montar el componente
  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser?.uid) {
        setLoading(false);
        return;
      }

      try {
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data();
          setUserData(data);
          setOriginalData(data);
          setIsProfileIncomplete(!data.profileCompleted);
        } else {
          setUserData({});
          setOriginalData({});
          setIsProfileIncomplete(true);
        }
      } catch (err) {
        setError("Failed to load user data.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [currentUser?.uid]);

  // Actualizar la información del usuario en Firestore
  const handleUpdateInfo = async () => {
    if (!currentUser?.uid) return;

    const updatedData: any = {};

    Object.keys(userData).forEach((key) => {
      if (userData[key] !== originalData[key]) {
        updatedData[key] = userData[key];
      }
    });

    if (Object.keys(updatedData).length > 0) {
      const requiredFields = [
        "firstName",
        "lastName",
        "email",
        "phoneNumber",
        "title",
        "company",
        "companyWebsite",
        "position",
      ];

      const profileCompleted = requiredFields.every(
        (field) => userData[field] && String(userData[field]).trim() !== ""
      );

      updatedData.profileCompleted = profileCompleted;

      try {
        const userRef = doc(db, "users", currentUser.uid);
        await updateDoc(userRef, updatedData);

        alert("User info updated successfully!");
        setOriginalData({ ...originalData, ...updatedData });
        setUserData({ ...userData, ...updatedData });
        setIsProfileIncomplete(!updatedData.profileCompleted);
      } catch (err) {
        setError("Failed to update user data.");
      }
    } else {
      alert("No changes detected to update.");
    }
  };

  /**
   * Delete account:
   * 1) Update Firestore user doc with `disabled: true`
   * 2) Delete Firebase Auth user
   *
   * Note: Firebase can require "recent login" and block deletion.
   * With your requested UX (no password / no reauth), if Firebase requires it,
   * you must prompt the user to re-login and try again.
   */
  const handleDeleteAccount = async () => {
    if (!currentUser?.uid) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      if (deleteConfirmText.trim().toUpperCase() !== "DELETE") {
        setDeleteError('Type "DELETE" to confirm.');
        setIsDeleting(false);
        return;
      }

      if (!deleteCheckedFinal) {
        setDeleteError("Please confirm the checkbox to continue.");
        setIsDeleting(false);
        return;
      }

      // 1) Firestore: mark disabled
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, {
        disabled: true,
        disabledAt: new Date().toISOString(),
      });

      // 2) Auth: delete user
      try {
        await deleteUser(currentUser);
      } catch (err: any) {
        if (err?.code === "auth/requires-recent-login") {
          throw new Error(
            "For security, please log out and log in again, then retry deleting your account."
          );
        }
        throw err;
      }

      setShowDeleteModal(false);
      alert("Your account was deleted.");
    } catch (e: any) {
      console.error(e);
      setDeleteError(e?.message || "Failed to delete account.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#c9d3c0]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#044421]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#c9d3c0]">
        <div className="text-center text-[#044421] text-2xl font-semibold">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-10 py-8">
        {/* Header */}
        <div className="flex flex-col gap-1 mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#044421]">
            Account Details
          </h2>
          <p className="text-sm text-gray-600">
            Keep your information up to date to place orders and manage
            deliveries.
          </p>
        </div>

        {/* Alert */}
        {isProfileIncomplete && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
            <div className="flex items-start gap-3">
              <div className="mt-[2px] h-8 w-1 rounded-full bg-amber-400" />

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-semibold text-amber-900">
                    Incomplete profile
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-[2px] rounded-full border border-amber-200 bg-white text-amber-800">
                    Action needed
                  </span>
                </div>

                <p className="mt-1 text-xs sm:text-sm text-amber-800 leading-snug">
                  To place orders and request samples, please complete the
                  required profile fields.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Card */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          {/* Card header */}
          <div className="px-4 sm:px-6 py-4 border-b bg-[#f6faf7] rounded-t-2xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-[#044421]">Profile</p>
                <p className="text-xs text-gray-600">
                  This information is used for orders, invoices, and sample
                  requests.
                </p>
              </div>

              <div className="hidden md:flex items-center gap-2 text-xs text-gray-600">
                <span className="font-semibold">Email:</span>
                <span className="truncate max-w-[260px]">
                  {userData.email || currentUser?.email}
                </span>
              </div>
            </div>
          </div>

          {/* Card body */}
          <div className="p-4 sm:p-6">
            {/* Section: Basic */}
            <div className="mb-8">
              <div className="mb-4">
                <h3 className="text-base font-semibold text-gray-900">
                  Basic information
                </h3>
                <p className="text-sm text-gray-600">Name and role details.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="firstName" className={labelCls}>
                    First Name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={userData.firstName || ""}
                    onChange={(e) =>
                      setUserData({ ...userData, firstName: e.target.value })
                    }
                    className={inputCls}
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className={labelCls}>
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={userData.lastName || ""}
                    onChange={(e) =>
                      setUserData({ ...userData, lastName: e.target.value })
                    }
                    className={inputCls}
                  />
                </div>

                <div className="md:col-span-2 xl:col-span-1">
                  <label htmlFor="title" className={labelCls}>
                    Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={userData.title || ""}
                    onChange={(e) =>
                      setUserData({ ...userData, title: e.target.value })
                    }
                    className={inputCls}
                    placeholder="e.g. Head Roaster"
                  />
                </div>
              </div>
            </div>

            <div className="my-8 h-px w-full bg-gray-200" />

            {/* Section: Personal info */}
            <div className="mb-6">
              <div className="mb-4">
                <h3 className="text-base font-semibold text-gray-900">
                  Personal info
                </h3>
                <p className="text-sm text-gray-600">
                  Update your contact and company information.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <div className="xl:col-span-2">
                  <label htmlFor="company" className={labelCls}>
                    Company
                  </label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    value={userData.company || ""}
                    onChange={(e) =>
                      setUserData({ ...userData, company: e.target.value })
                    }
                    className={inputCls}
                  />
                </div>

                <div>
                  <label htmlFor="phone" className={labelCls}>
                    Phone
                  </label>
                  <input
                    type="text"
                    id="phone"
                    name="phone"
                    value={userData.phoneNumber || ""}
                    onChange={(e) =>
                      setUserData({ ...userData, phoneNumber: e.target.value })
                    }
                    className={inputCls}
                    placeholder="+44..."
                  />
                </div>

                <div className="md:col-span-2 xl:col-span-2">
                  <label htmlFor="companyWebsite" className={labelCls}>
                    Company Website
                  </label>
                  <input
                    type="text"
                    id="companyWebsite"
                    name="companyWebsite"
                    value={userData.companyWebsite || ""}
                    onChange={(e) =>
                      setUserData({
                        ...userData,
                        companyWebsite: e.target.value,
                      })
                    }
                    className={inputCls}
                    placeholder="https://..."
                  />
                </div>

                <div className="md:col-span-2 xl:col-span-1">
                  <label htmlFor="position" className={labelCls}>
                    Position
                  </label>
                  <input
                    type="text"
                    id="position"
                    name="position"
                    value={userData.position || ""}
                    onChange={(e) =>
                      setUserData({ ...userData, position: e.target.value })
                    }
                    className={inputCls}
                    placeholder="e.g. Buyer"
                  />
                </div>
              </div>
            </div>

            <div className="my-8 h-px w-full bg-gray-200" />

            {/* Section: Profile image */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  Profile image
                </h3>
                <p className="text-sm text-gray-600">
                  Shown in your account and portal.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-full overflow-hidden border bg-gray-100 flex items-center justify-center">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Profile"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          parent.innerHTML = `<span class="text-xs font-semibold text-gray-600">${avatarLetter}</span>`;
                        }
                      }}
                    />
                  ) : (
                    <span className="text-xs font-semibold text-gray-600">
                      {avatarLetter}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  className="h-10 px-4 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                  onClick={() => {
                    alert(
                      "Profile image comes from Google login (Firebase Auth). If you want manual upload, we can add it."
                    );
                  }}
                >
                  Update
                </button>
              </div>
            </div>
          </div>

          {/* Card footer */}
          <div className="px-4 sm:px-6 py-4 border-t bg-white rounded-b-2xl">
            {/* ✅ separated: delete left, update right */}
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                className="h-10 px-4 rounded-lg border border-gray-300 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50"
                onClick={() => {
                  setDeleteConfirmText("");
                  setDeleteCheckedFinal(false);
                  setDeleteError(null);
                  setShowDeleteModal(true);
                }}
              >
                Delete account
              </button>

              <button
                type="button"
                className="h-10 px-5 rounded-lg bg-[#044421] text-white text-sm font-semibold hover:bg-[#066232]
                          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#044421]/30"
                onClick={handleUpdateInfo}
              >
                Update Info
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[80] bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-gray-200">
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">
                Delete your account
              </h3>
              <button
                className="h-9 w-9 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700"
                onClick={() => setShowDeleteModal(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-sm text-gray-700">
                Your account will be permanently deleted.
              </p>

              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                To confirm, type <span className="font-semibold">DELETE</span>.
              </div>

              <div>
                <label className={labelCls}>Type DELETE to confirm</label>
                <input
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className={inputCls}
                  placeholder="DELETE"
                />
              </div>

              {/* Extra confirmation step */}
              <label className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={deleteCheckedFinal}
                  onChange={(e) => setDeleteCheckedFinal(e.target.checked)}
                />
                <span className="text-sm text-gray-700">
                  I understand this action is permanent.
                </span>
              </label>

              {deleteError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                  {deleteError}
                </div>
              )}
            </div>

            <div className="px-5 py-4 border-t flex items-center justify-end gap-3">
              <button
                type="button"
                className="h-10 px-4 rounded-lg border border-gray-300 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="h-10 px-4 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:bg-gray-400"
                onClick={handleDeleteAccount}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete account"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Profile;
