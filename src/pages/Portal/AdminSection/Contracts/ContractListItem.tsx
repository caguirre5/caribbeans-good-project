// import React, { useMemo, useState } from 'react';
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// import { faSearch } from '@fortawesome/free-solid-svg-icons';
// import type { Contract } from './ContractsDashboard';

// const statusColors: Record<string, string> = {
//   pending: 'bg-orange-100 text-orange-700 border-orange-300',
//   active: 'bg-blue-100 text-blue-700 border-blue-300',
//   completed: 'bg-green-100 text-green-700 border-green-300',
//   cancelled: 'bg-red-100 text-red-700 border-red-300',
// };

// interface ContractsListProps {
//   contracts: Contract[];
//   onSelect: (c: Contract) => void;
//   onRefresh?: () => void;
// }

// const ContractListItem: React.FC<ContractsListProps> = ({ contracts, onSelect }) => {
//   const [search, setSearch] = useState('');
//   const [statusFilter, setStatusFilter] = useState<
//     '' | 'pending' | 'active' | 'completed' | 'cancelled'
//   >('');
//   const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc'>('date_desc');

//   const formatDate = (timestamp: any) => {
//     if (!timestamp) return '—';
//     const seconds = timestamp.seconds ?? timestamp._seconds;
//     if (!seconds) return '—';
//     const date = new Date(seconds * 1000);
//     return date.toLocaleString();
//   };

//   const filteredAndSorted = useMemo(() => {
//     let list = contracts;

//     const term = search.trim().toLowerCase();
//     if (term) {
//       list = list.filter(
//         (c) =>
//           (c.contractNo || '').toLowerCase().includes(term) ||
//           c.name.toLowerCase().includes(term) ||
//           c.email.toLowerCase().includes(term) ||
//           c.fileKey.toLowerCase().includes(term) ||
//           c.id.toLowerCase().includes(term)
//       );
//     }

//     if (statusFilter) {
//       list = list.filter((c) => c.status === statusFilter);
//     }

//     const byDate = (c: Contract) => {
//       const s = (c.createdAt as any)?.seconds ?? (c.createdAt as any)?._seconds ?? 0;
//       return s * 1000;
//     };

//     return [...list].sort((a, b) =>
//       sortBy === 'date_asc' ? byDate(a) - byDate(b) : byDate(b) - byDate(a)
//     );
//   }, [contracts, search, statusFilter, sortBy]);

//   return (
//     <div>
//       <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-4">
//         <h2 className="text-xl font-bold">Contracts</h2>

//         <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
//           <div className="relative md:w-64">
//             <input
//               type="text"
//               placeholder="Search number, name, email or key…"
//               value={search}
//               onChange={(e) => setSearch(e.target.value)}
//               className="w-full border rounded px-3 py-2 pr-8 text-sm"
//             />
//             <FontAwesomeIcon
//               icon={faSearch}
//               className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
//             />
//           </div>

//           <select
//             value={statusFilter}
//             onChange={(e) => setStatusFilter(e.target.value as any)}
//             className="border rounded px-3 py-2 text-sm"
//           >
//             <option value="">All statuses</option>
//             <option value="pending">Pending</option>
//             <option value="active">Active</option>
//             <option value="completed">Completed</option>
//             <option value="cancelled">Cancelled</option>
//           </select>

//           <select
//             value={sortBy}
//             onChange={(e) => setSortBy(e.target.value as any)}
//             className="border rounded px-3 py-2 text-sm"
//           >
//             <option value="date_desc">Newest first</option>
//             <option value="date_asc">Oldest first</option>
//           </select>
//         </div>
//       </div>

//       {filteredAndSorted.length === 0 ? (
//         <p className="text-gray-600">No contracts match your filters.</p>
//       ) : (
//         <ul className="space-y-3">
//           {filteredAndSorted.map((c) => {
//             const label = c.contractNo || c.id;
//             return (
//               <li
//                 key={c.id}
//                 className="border p-3 rounded hover:bg-gray-50 cursor-pointer"
//                 onClick={() => onSelect(c)}
//               >
//                 <p className="font-semibold mb-1">Contract #{label}</p>
//                 <p className="text-sm text-gray-600">
//                   {c.name || '(No name)'} — {c.email || ''}
//                 </p>
//                 <p className="text-sm text-gray-500">
//                   {formatDate(c.createdAt)} • Status:{' '}
//                   <span
//                     className={`px-2 py-0.5 rounded-full border ${
//                       statusColors[c.status] || 'bg-gray-100 text-gray-700 border-gray-300'
//                     }`}
//                   >
//                     {c.status}
//                   </span>
//                 </p>
//               </li>
//             );
//           })}
//         </ul>
//       )}
//     </div>
//   );
// };

// export default ContractListItem;
