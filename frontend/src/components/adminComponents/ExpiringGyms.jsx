import React from "react";
import { AlertCircle, Phone, CalendarRange } from "lucide-react";

export default function ExpiringGyms() {
  // Simulated database response array tracking subscriptions ending soon
  const expiringData = [
    { id: "GYM-9021", name: "Iron Paradise Hub", owner: "Rahul Sharma", phone: "9876543210", plan: "Annual Premium", value: "₹45,000", daysLeft: 3 },
    { id: "GYM-4011", name: "Gold's Fitness Arena", owner: "Amit Verma", phone: "9123456789", plan: "Quarterly Pro", value: "₹18,500", daysLeft: 7 },
    { id: "GYM-1082", name: "Pulse Crossfit Lab", owner: "Priya Patel", phone: "9988776655", plan: "Monthly Basic", value: "₹5,000", daysLeft: 12 },
    { id: "GYM-3044", name: "Titan Muscle Gym", owner: "Vikram Singh", phone: "8877665544", plan: "Annual Premium", value: "₹42,000", daysLeft: 14 },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-6 sm:mt-8">
      
      {/* Component Title Header */}
      <div className="p-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarRange className="h-5 w-5 text-amber-500" />
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">Expiring Subscriptions</h2>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-700 rounded-full animate-pulse">
          Action Required
        </span>
      </div>

      {/* Responsive Responsive Grid Wrapper */}
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px] md:min-w-0">
          <thead>
            <tr className="bg-slate-50/50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
              <th className="py-4 px-5">Gym Details</th>
              <th className="py-4 px-5">Owner</th>
              <th className="py-4 px-5 hidden sm:table-cell">Plan / Value</th>
              <th className="py-4 px-5 text-right">Time Left</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {expiringData.map((gym) => (
              <tr key={gym.id} className="hover:bg-slate-50/60 transition-colors">
                
                {/* 1. Gym Identity Column */}
                <td className="py-4 px-5">
                  <div className="font-semibold text-slate-800">{gym.name}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{gym.id}</div>
                </td>

                {/* 2. Owner Contact Column */}
                <td className="py-4 px-5">
                  <div className="font-medium text-slate-700">{gym.owner}</div>
                  <a 
                    href={`tel:${gym.phone}`} 
                    className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium mt-0.5"
                  >
                    <Phone className="h-3 w-3" />
                    <span>{gym.phone}</span>
                  </a>
                </td>

                {/* 3. Sub Plan Metadata Column (Hidden on tight mobile windows) */}
                <td className="py-4 px-5 hidden sm:table-cell">
                  <div className="text-slate-700 font-medium">{gym.plan}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{gym.value}</div>
                </td>

                {/* 4. Dynamic Time Counter Alert Status Column */}
                <td className="py-4 px-5 text-right">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border
                    ${gym.daysLeft <= 3 
                      ? "bg-red-50 text-red-700 border-red-200" 
                      : gym.daysLeft <= 7 
                        ? "bg-amber-50 text-amber-700 border-amber-200" 
                        : "bg-blue-50 text-blue-700 border-blue-200"
                    }
                  `}>
                    {gym.daysLeft <= 3 && <AlertCircle className="h-3.5 w-3.5" />}
                    <span>{gym.daysLeft} days left</span>
                  </span>
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
