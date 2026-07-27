import React, { useState } from 'react';

const initialMembers = [
  { id: 'GYM-101', name: 'Rohan Mehta', plan: 'Monthly Pack', status: 'Active', renewal: '2026-08-15' },
  { id: 'GYM-102', name: 'Priya Nair', plan: 'Annual Membership', status: 'Expiring Soon', renewal: '2026-08-02' },
  { id: 'GYM-103', name: 'Kabir Kapoor', plan: 'Quarterly Pack', status: 'Expired', renewal: '2026-07-20' },
];

export default function MembersView() {
  const [members, setMembers] = useState(initialMembers);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMembers = members.filter(item => {
    return item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.id.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div>
      {/* Controls Header - Search input set to occupy full width */}
      <div className="w-full mb-4">
        <input
          type="text"
          placeholder="Search members..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {/* 📱 MOBILE VIEW CARD LIST: Hidden on desktop layout */}
      <div className="block md:hidden space-y-3">
        {filteredMembers.map((member) => (
          <div key={member.id} className="border border-gray-100 rounded-xl p-4 bg-gray-50/50 shadow-sm space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono text-gray-400 block mb-0.5">{member.id}</span>
                <h4 className="font-semibold text-gray-900 text-sm">{member.name}</h4>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                member.status === 'Active' ? 'bg-green-50 text-green-700' :
                member.status === 'Expiring Soon' ? 'bg-amber-50 text-amber-700' :
                'bg-red-50 text-red-700'
              }`}>
                {member.status}
              </span>
            </div>
            
            <div className="flex justify-between items-center text-xs pt-2 border-t border-gray-100">
              <span className="text-gray-400">Plan: <b className="text-gray-600 font-medium">{member.plan}</b></span>
              <div className="space-x-3">
                <button className="text-green-600 font-bold hover:underline">Renew</button>
                <button className="text-gray-500 font-medium">Manage</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 💻 DESKTOP VIEW TABLE: Hidden on mobile screens */}
      <div className="hidden md:block overflow-x-auto border border-gray-200 rounded-xl">
        <table className="min-w-full divide-y divide-gray-200 text-sm text-left">
          <thead className="bg-gray-50 text-gray-700 uppercase text-xs font-semibold">
            <tr>
              <th className="px-6 py-4">Member ID</th>
              <th className="px-6 py-4">Full Name</th>
              <th className="px-6 py-4">Plan Structure</th>
              <th className="px-6 py-4">Account Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-gray-600 bg-white">
            {filteredMembers.map((member) => (
              <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-mono text-xs text-gray-500">{member.id}</td>
                <td className="px-6 py-4 font-medium text-gray-900">{member.name}</td>
                <td className="px-6 py-4">{member.plan}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    member.status === 'Active' ? 'bg-green-50 text-green-700' :
                    member.status === 'Expiring Soon' ? 'bg-amber-50 text-amber-700' :
                    'bg-red-50 text-red-700'
                  }`}>
                    {member.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button className="text-green-600 hover:text-green-900 font-medium text-xs">Renew</button>
                  <button className="text-gray-400 hover:text-gray-600 font-medium text-xs">Manage</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredMembers.length === 0 && (
        <p className="text-center py-8 text-xs md:text-sm text-gray-400">No matching members found.</p>
      )}
    </div>
  );
}
