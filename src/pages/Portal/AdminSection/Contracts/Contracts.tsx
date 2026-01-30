// ContractLoader.tsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../../../../contexts/AuthContext";

interface User {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
}

type ContractLoaderProps = {
  contractId?: string;
  contractNo?: string;         // ← para mostrar en el email/título
  recipientName?: string | null;
  recipientEmail?: string | null;
  onUploaded?: (payload: { id: string; fileKey: string; s3Url: string; status?: "active" }) => void;
  onBack?: () => void;
};


const ContractLoader: React.FC<ContractLoaderProps> = ({ contractId, contractNo, recipientEmail, recipientName, onUploaded, onBack }) => {
  const { currentUser } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // NUEVO: estado de éxito
  const [success, setSuccess] = useState(false);
  const [uploadedInfo, setUploadedInfo] = useState<{fileKey: string; s3Url: string} | null>(null);


  const buildApprovedEmailHTML = (name: string | null, contractNo: string) => `
  <html>
    <body style="margin:0;padding:0;background:#f6f8fa;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f6f8fa;">
        <tr>
          <td align="center" style="padding:24px 12px;">
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:620px;background:#ffffff;border:1px solid #eaecef;border-radius:8px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;color:#111;">
              <tr>
                <td style="padding:20px 24px 12px;">
                  <h1 style="margin:0;font-size:18px;line-height:1.3;color:#111;">Your contract is now active</h1>
                  <p style="margin:8px 0 0;font-size:14px;line-height:1.6;color:#444;">
                    Hello ${name || 'there'}, your contract <b>#${contractNo}</b> has been approved and activated.
                  </p>
                </td>
              </tr>
              <tr><td style="padding:12px 24px;"><div style="height:1px;background:#eaecef;"></div></td></tr>
              <tr>
                <td style="padding:0 24px 16px;">
                  <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#444;">
                    You can review all the details any time in <b>My Orders</b>.
                  </p>
                  <p style="margin:0;font-size:14px;line-height:1.6;color:#444;">
                    If you have questions, just reply to this email.
                  </p>
                </td>
              </tr>
              <tr><td style="padding:16px 24px 20px;"><p style="margin:0;font-size:13px;line-height:1.6;color:#666;">— Caribbean Goods Team</p></td></tr>
            </table>
            <p style="margin:12px 0 0;font-size:12px;line-height:1.6;color:#8a8f98;font-family:Arial,Helvetica,sans-serif;">
              This message was sent regarding contract #${contractNo}.
            </p>
          </td>
        </tr>
      </table>
    </body>
  </html>`;


  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = await currentUser?.getIdToken();
        const response = await fetch(`${import.meta.env.VITE_FULL_ENDPOINT}/api/users`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch users');
        const data = await response.json();
        const activeUsers = data.filter((u: any) => u.isActive === true);
        setUsers(activeUsers);
      } catch (e) {
        console.error("Error fetching users:", e);
      }
    };
    if (!contractId) fetchUsers(); // solo si estamos creando
  }, [currentUser, contractId]);

  useEffect(() => {
    if (!searchTerm) { setFilteredUsers([]); return; }
    const lower = searchTerm.toLowerCase();
    setFilteredUsers(
      users.filter(
        u =>
          u.firstName.toLowerCase().includes(lower) ||
          u.lastName.toLowerCase().includes(lower) ||
          u.email.toLowerCase().includes(lower)
      )
    );
  }, [searchTerm, users]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type === 'application/pdf' ||
                 file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
      setSelectedFile(file);
    } else {
      alert("Only PDF or DOCX files are allowed.");
    }
  };

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });

  const handleSubmit = async () => {
    if (!selectedFile) return;

    // info para el nombre del archivo en el backend
    const display = currentUser?.displayName || '';
    const [firstName, ...rest] = display.split(' ').filter(Boolean);
    const lastName = rest.join(' ') || 'Admin';
    const userInfo = { firstName: firstName || 'Admin', lastName };

    try {
      setUploading(true);

      const base64Content = await fileToBase64(selectedFile);

      // 1) Subir a S3
      const uploadRes = await fetch(`${import.meta.env.VITE_FULL_ENDPOINT}/resourcelibray/upload`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: selectedFile.name,
          fileContent: base64Content,
          contentType: selectedFile.type,
          user: userInfo,
        }),
      });
      if (!uploadRes.ok) throw new Error('Failed to upload file');
      const uploadData = await uploadRes.json();

      const s3Url = uploadData.fileKey
        ? `https://caribbeangoods-content-s3.s3.amazonaws.com/${uploadData.fileKey}`
        : uploadData.s3Url;

      const token = await currentUser?.getIdToken();

      if (contractId) {
        // 2) Adjuntar a contrato existente
        const patchRes = await fetch(
          `${import.meta.env.VITE_FULL_ENDPOINT}/api/contracts/${contractId}/attachFile`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ fileKey: uploadData.fileKey, s3Url }),
          }
        );
        if (!patchRes.ok) {
          const t = await patchRes.text().catch(() => '');
          throw new Error(`Attach failed: ${t}`);
        }

        // ✅ Vista de éxito + callback al padre
        setUploadedInfo({ fileKey: uploadData.fileKey, s3Url });
        setSuccess(true);

        try {
          const token = await currentUser?.getIdToken();
          const subject = `Your contract #${(contractNo || contractId)} is now active`;
          const html = buildApprovedEmailHTML(recipientName || null, (contractNo || contractId)!);
        
          await fetch(`${import.meta.env.VITE_FULL_ENDPOINT}/email/sendCustomEmail`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
              recipientEmail: recipientEmail,   // ← pasado por props desde el detail
              subject,
              html,
            }),
          });
        } catch (e) {
          console.error('Email send error (approved):', e);
        }
      } else {
        // (opcional) flujo de creación
        const createRes = await fetch(`${import.meta.env.VITE_FULL_ENDPOINT}/api/addContract`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            name: selectedUser ? `${selectedUser.firstName} ${selectedUser.lastName}` : '—',
            email: selectedUser?.email || '—',
            fileKey: uploadData.fileKey,
            s3Url,
          }),
        });
        if (!createRes.ok) {
          const t = await createRes.text().catch(() => '');
          throw new Error(`Create failed: ${t}`);
        }
        const created = await createRes.json();
        setUploadedInfo({ fileKey: uploadData.fileKey, s3Url });
        setSuccess(true);
        onUploaded?.({ id: created.contractId, fileKey: uploadData.fileKey, s3Url, status: 'active' });
      }

      setSelectedFile(null);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Upload failed'); // solo error
    } finally {
      setUploading(false);
    }
  };

  // ── Vista de éxito ─────────────────────────────────────────────
  if (success && uploadedInfo) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-md w-full">
        <h2 className="text-xl font-bold mb-3">Contract updated</h2>
        <div className="border rounded p-4 bg-green-50 border-green-200 text-green-800">
          <p className="font-semibold mb-1">File attached & contract activated.</p>
          <p className="text-sm break-all">
            <span className="text-gray-700">File key:</span> <span className="font-mono">{uploadedInfo.fileKey}</span>
          </p>
          <a
            href={uploadedInfo.s3Url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-3 underline text-green-700 text-sm"
          >
            Open file
          </a>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
            onClick={() => {
              // primero notifica al padre (actualiza la lista)
              onUploaded?.({
                id: contractId!,
                fileKey: uploadedInfo.fileKey,
                s3Url: uploadedInfo.s3Url,
                status: 'active',
              });
              // luego cierra la vista
              onBack?.();
            }}
          >
            Back to contract
          </button>
        </div>
      </div>
    );
  }

  // ── Formulario (por defecto) ──────────────────────────────────
  return (
    <div className="bg-white p-4 rounded-lg shadow-md w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">
          {contractId ? 'Attach File to Contract' : 'Upload Contract'}
        </h2>
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

      {/* Buscar usuario solo si creamos */}
      {!contractId && (
        <div className="mb-4 relative">
          <label className="block mb-1 font-medium">Select User</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setSelectedUser(null); }}
            placeholder="Search by name or email"
            className="border px-3 py-2 w-full rounded text-sm"
          />
          {filteredUsers.length > 0 && !selectedUser && (
            <ul className="absolute bg-white border w-full mt-1 rounded max-h-48 overflow-y-auto z-10">
              {filteredUsers.map((u) => (
                <li
                  key={u.uid}
                  className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                  onClick={() => { setSelectedUser(u); setSearchTerm(`${u.firstName} ${u.lastName}`); setFilteredUsers([]); }}
                >
                  {u.firstName} {u.lastName} — {u.email}
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
      )}

      <button
        disabled={!selectedFile || (!contractId && !selectedUser) || uploading}
        onClick={handleSubmit}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {uploading ? 'Uploading…' : contractId ? 'Attach & Activate' : 'Submit Contract'}
      </button>
    </div>
  );
};

export default ContractLoader;
