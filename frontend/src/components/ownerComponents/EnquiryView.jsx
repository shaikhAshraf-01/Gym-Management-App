import React, { useState } from 'react';

const initialEnquiries = [
  { id: 1, name: 'Rahul Sharma', phone: '+91 98765 43210', source: 'Instagram', status: 'Trial Scheduled', date: '2026-07-25' },
  { id: 2, name: 'Anjali Desai', phone: '+91 87654 32109', source: 'Walk-in', status: 'New', date: '2026-07-26' },
  { id: 3, name: 'Vikram Singh', phone: '+91 76543 21098', source: 'Website', status: 'Contacted', date: '2026-07-24' },
];

export default function EnquiryView() {
  const [enquiries, setEnquiries] = useState(initialEnquiries);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEnquiries = enquiries.filter(item => {
    return item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.phone.includes(searchTerm);
  });

  return (
    <div>
      {/* Controls Header - Search input set to occupy full width */}
      <div className="w-full mb-4">
        <input
          type="text"
          placeholder="Search leads..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* 📱 MOBILE VIEW CARD LIST: Hidden on desktop layout */}
      <div className="block md:hidden space-y-3">
        {filteredEnquiries.map((lead) => (
          <div key={lead.id} className="border border-gray-100 rounded-xl p-4 bg-gray-50/50 shadow-sm space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold text-gray-900 text-sm">{lead.name}</h4>
                <p className="text-xs text-gray-500 mt-0.5">{lead.phone}</p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                lead.status === 'New' ? 'bg-blue-50 text-blue-700' :
                lead.status === 'Contacted' ? 'bg-purple-50 text-purple-700' :
                'bg-yellow-50 text-yellow-700'
              }`}>
                {lead.status}
              </span>
            </div>
            
            <div className="flex justify-between items-center text-xs pt-2 border-t border-gray-100">
              <span className="text-gray-400">Source: <b className="text-gray-600 font-medium">{lead.source}</b></span>
              <div className="space-x-3">
                <button className="text-blue-600 font-bold hover:underline">Convert</button>
                <button className="text-gray-500 font-medium">Edit</button>
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
              <th className="px-6 py-4">Lead Name</th>
              <th className="px-6 py-4">Contact Info</th>
              <th className="px-6 py-4">Source</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-gray-600 bg-white">
            {filteredEnquiries.map((lead) => (
              <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-900">{lead.name}</td>
                <td className="px-6 py-4">{lead.phone}</td>
                <td className="px-6 py-4">{lead.source}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    lead.status === 'New' ? 'bg-blue-50 text-blue-700' :
                    lead.status === 'Contacted' ? 'bg-purple-50 text-purple-700' :
                    'bg-yellow-50 text-yellow-700'
                  }`}>
                    {lead.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button className="text-blue-600 hover:text-blue-900 font-medium text-xs">Convert</button>
                  <button className="text-gray-400 hover:text-gray-600 font-medium text-xs">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredEnquiries.length === 0 && (
        <p className="text-center py-8 text-xs md:text-sm text-gray-400">No matching enquiries found.</p>
      )}
    </div>
  );
}
