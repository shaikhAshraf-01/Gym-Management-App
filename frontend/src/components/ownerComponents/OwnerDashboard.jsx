import React, { useState, useEffect, useRef } from "react";
import { Phone, CalendarClock, User, Smartphone, MoreVertical, RefreshCw, Trash2 } from "lucide-react";

export default function OwnerDashboard() {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const dropdownRef = useRef(null);

  const [expiringMembers, setExpiringMembers] = useState([
    { id: 1, name: "Rahul Sharma", mobile: "+919876543210", daysLeft: 2 },
    { id: 2, name: "Sneha Patel", mobile: "+919876543211", daysLeft: 4 },
    { id: 3, name: "Amit Verma", mobile: "+919876543212", daysLeft: 0 },
    { id: 4, name: "Priya Nair", mobile: "+919876543213", daysLeft: 7 },
  ]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleDropdown = (id, e) => {
    e.stopPropagation();
    setActiveDropdown(activeDropdown === id ? null : id);
  };

  const handleRenew = (id, name) => {
    setActiveDropdown(null);
    alert(`Renew action triggered for ${name} (ID: ${id})`);
  };

  const handleDelete = (id, name) => {
    setActiveDropdown(null);
    const confirmDelete = window.confirm(`Are you sure you want to delete ${name}?`);
    if (confirmDelete) {
      setExpiringMembers(expiringMembers.filter(member => member.id !== id));
    }
  };

  return (
    /* Clean bg-gray-50 color applied to match AllMembers workspace */
    <div className=" md:p-6 max-w-7xl mx-auto bg-gray-50 min-h-screen pb-24 md:pb-6 text-gray-600">
      
     

      {/* Main Container Card - Uses crisp border layout matching AllMembers view container */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
        <div className="flex items-center gap-3 mb-6">
          <CalendarClock className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-bold text-gray-900 tracking-tight">
            Fees Expiring Soon
          </h3>
        </div>

        {/* Grid Header Layout for Desktop */}
        <div className="hidden md:grid grid-cols-5 gap-4 px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border border-gray-200 rounded-t-xl">
          <div>Name</div>
          <div>Mobile</div>
          <div>Expires In</div>
          <div className="text-center">Action</div>
          <div className="text-right">Manage</div>
        </div>

        {/* Dynamic List Render Matrix with standard border styles */}
        <div className="divide-y divide-gray-200 border-x border-b border-gray-200 rounded-b-xl overflow-hidden bg-white" ref={dropdownRef}>
          {expiringMembers.map((member) => (
            <div
              key={member.id}
              className="flex flex-col md:grid md:grid-cols-5 gap-2 md:gap-4 p-4 px-4 items-start md:items-center hover:bg-gray-50 transition-colors relative"
            >
              {/* Column 1: Member Name */}
              <div className="flex items-center gap-2 font-medium text-gray-900">
                <User className="h-4 w-4 text-gray-400 md:hidden" />
                <span>{member.name}</span>
              </div>

              {/* Column 2: Mobile Number */}
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Smartphone className="h-4 w-4 text-gray-400 md:hidden" />
                <span>{member.mobile}</span>
              </div>

              {/* Column 3: Membership Expiration Status Chip using light design styles */}
              <div>
                {member.daysLeft === 0 ? (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700">
                    Expired Today
                  </span>
                ) : member.daysLeft <= 2 ? (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                    {member.daysLeft} Days left
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                    {member.daysLeft} Days left
                  </span>
                )}
              </div>

              {/* Column 4: Native Device Phone Call Action Trigger - Styled in Blue matching AllMembers themes */}
              <div className="w-full md:w-auto flex md:justify-center mt-2 md:mt-0">
                <a
                  href={`tel:${member.mobile}`}
                  className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 md:py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors shadow-sm select-none cursor-pointer"
                >
                  <Phone className="h-3.5 w-3.5" />
                  <span>Call Now</span>
                </a>
              </div>

              {/* Column 5: Options Dropdown Trigger */}
              <div className="absolute top-4 right-4 md:static md:w-full md:flex md:justify-end">
                <div className="relative inline-block text-left">
                  <button
                    onClick={(e) => toggleDropdown(member.id, e)}
                    className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors focus:outline-none cursor-pointer"
                  >
                    <MoreVertical className="h-5 w-5" />
                  </button>

                  {/* Dropdown Card - Styled with light borders and high-utility white background shadow structures */}
                  {activeDropdown === member.id && (
                    <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-lg shadow-xl z-40 p-1 divide-y divide-gray-100">
                      <button
                        onClick={() => handleRenew(member.id, member.name)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors text-left"
                      >
                        <RefreshCw className="h-4 w-4 text-blue-600" />
                        <span>Renew Fees</span>
                      </button>
                      <button
                        onClick={() => handleDelete(member.id, member.name)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors text-left"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Delete Member</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
