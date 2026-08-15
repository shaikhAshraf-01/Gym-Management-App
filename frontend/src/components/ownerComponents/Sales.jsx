import React, { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import {
  Wallet,
  Calendar,
  TrendingUp,
  Users,
} from "lucide-react";
import { PLAN_LABELS } from "../../redux/slices/membersSlice";

// ---------------------------------------------------------------
// Indian Fiscal Year boundaries
// 1st April to 31st March
// ---------------------------------------------------------------
function getFiscalYearRange(isLastYear = false) {
  const today = new Date();

  let currentYear = today.getFullYear();

  // Before April = previous calendar year
  if (today.getMonth() < 3) {
    currentYear -= 1;
  }

  const targetYear = isLastYear
    ? currentYear - 1
    : currentYear;

  const fromDate = `${targetYear}-04-01`;
  const toDate = `${targetYear + 1}-03-31`;

  return {
    fromDate,
    toDate,
  };
}

// ---------------------------------------------------------------
// Month boundaries
// ---------------------------------------------------------------
function getMonthRange(isLastMonth = false) {
  const today = new Date();

  let year = today.getFullYear();
  let month = today.getMonth();

  if (isLastMonth) {
    if (month === 0) {
      month = 11;
      year -= 1;
    } else {
      month -= 1;
    }
  }

  const startOfPeriod = new Date(
    year,
    month,
    1
  );

  const endOfPeriod = new Date(
    year,
    month + 1,
    0
  );

  // Format safely as local YYYY-MM-DD
  const format = (d) => {
    const y = d.getFullYear();
    const m = String(
      d.getMonth() + 1
    ).padStart(2, "0");
    const day = String(
      d.getDate()
    ).padStart(2, "0");

    return `${y}-${m}-${day}`;
  };

  return {
    fromDate: format(startOfPeriod),
    toDate: format(endOfPeriod),
  };
}

// ---------------------------------------------------------------
// Bar colors
// ---------------------------------------------------------------
const BAR_COLORS = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-violet-500",
  "bg-rose-500",
];

// ---------------------------------------------------------------
// Age groups
// ---------------------------------------------------------------
const AGE_GROUPS = [
  {
    key: "15-25",
    label: "15–25",
    min: 15,
    max: 25,
  },
  {
    key: "26-35",
    label: "26–35",
    min: 26,
    max: 35,
  },
  {
    key: "36-50",
    label: "36–50",
    min: 36,
    max: 50,
  },
  {
    key: "50+",
    label: "50+",
    min: 51,
    max: Infinity,
  },
];

export default function Sales() {
  const members = useSelector(
    (state) => state.members.members
  );

  // -------------------------------------------------------------
  // Date filter
  // -------------------------------------------------------------

  const [datePreset, setDatePreset] =
    useState("current-month");

  const [customFrom, setCustomFrom] =
    useState("");

  const [customTo, setCustomTo] =
    useState("");

  // -------------------------------------------------------------
  // Active date range
  // -------------------------------------------------------------

  const activeRange = useMemo(() => {
    if (datePreset === "current-month") {
      return getMonthRange(false);
    }

    if (datePreset === "last-month") {
      return getMonthRange(true);
    }

    if (datePreset === "current-fiscal") {
      return getFiscalYearRange(false);
    }

    if (datePreset === "last-fiscal") {
      return getFiscalYearRange(true);
    }

    return {
      fromDate: customFrom,
      toDate: customTo,
    };
  }, [
    datePreset,
    customFrom,
    customTo,
  ]);

  // -------------------------------------------------------------
  // Flatten membershipHistory
  //
  // Every join and renewal becomes an individual sale.
  // -------------------------------------------------------------

  const allSaleEntries = useMemo(() => {
    const entries = [];

    members.forEach((m) => {
      (m.membershipHistory || []).forEach(
        (h) => {
          entries.push({
            memberId: m.id,

            memberName: m.name,

            // Use history age if available.
            // Otherwise use current member age.
            age:
              h.age !== undefined &&
              h.age !== null &&
              h.age !== ""
                ? Number(h.age)
                : Number(m.age),

            plan: h.plan,

            amount: Number(
              h.amount || 0
            ),

            date: h.date,

            type: h.type,
          });
        }
      );
    });

    return entries;
  }, [members]);

  // -------------------------------------------------------------
  // Filter sales according to selected date range
  // -------------------------------------------------------------

  const incomeEntries = useMemo(() => {
    return allSaleEntries.filter(
      (entry) => {
        if (!entry.date) {
          return false;
        }

        if (
          activeRange.fromDate &&
          entry.date <
            activeRange.fromDate
        ) {
          return false;
        }

        if (
          activeRange.toDate &&
          entry.date >
            activeRange.toDate
        ) {
          return false;
        }

        return true;
      }
    );
  }, [
    allSaleEntries,
    activeRange,
  ]);

  // -------------------------------------------------------------
  // Total income
  // -------------------------------------------------------------

  const totalIncome = useMemo(() => {
    return incomeEntries.reduce(
      (sum, entry) =>
        sum + entry.amount,
      0
    );
  }, [incomeEntries]);

  // -------------------------------------------------------------
  // Income by Plan
  // -------------------------------------------------------------

  const planIncome = useMemo(() => {
    const totals = {};

    incomeEntries.forEach(
      (entry) => {
        const key =
          entry.plan || "unknown";

        if (!totals[key]) {
          totals[key] = {
            amount: 0,
            count: 0,
          };
        }

        totals[key].amount +=
          entry.amount;

        totals[key].count += 1;
      }
    );

    return Object.entries(totals)
      .map(
        ([plan, data]) => ({
          plan,
          amount: data.amount,
          count: data.count,
        })
      )
      .sort(
        (a, b) =>
          b.amount - a.amount
      );
  }, [incomeEntries]);

  const maxPlanAmount =
    planIncome.length > 0
      ? planIncome[0].amount
      : 0;

  // -------------------------------------------------------------
  // Sales by Age Group
  //
  // Counts sales entries, same as plan count.
  // Also calculates total amount for each age group.
  // -------------------------------------------------------------

  const ageIncome = useMemo(() => {
    const totals = {};

    // Initialize all groups so that
    // 0-sales groups also appear.
    AGE_GROUPS.forEach(
      (group) => {
        totals[group.key] = {
          amount: 0,
          count: 0,
        };
      }
    );

    incomeEntries.forEach(
      (entry) => {
        const age = Number(
          entry.age
        );

        if (!age || age < 15) {
          return;
        }

        const group =
          AGE_GROUPS.find(
            (g) =>
              age >= g.min &&
              age <= g.max
          );

        if (!group) {
          return;
        }

        totals[group.key].amount +=
          entry.amount;

        totals[group.key].count +=
          1;
      }
    );

    return AGE_GROUPS.map(
      (group) => ({
        ...group,
        amount:
          totals[group.key]
            .amount,
        count:
          totals[group.key]
            .count,
      })
    );
  }, [incomeEntries]);

  const maxAgeAmount =
    ageIncome.length > 0
      ? Math.max(
          ...ageIncome.map(
            (row) => row.amount
          )
        )
      : 0;

  // -------------------------------------------------------------
  // Render
  // -------------------------------------------------------------

  return (
    <div className="p-2 md:p-6 max-w-5xl mx-auto bg-gray-50 min-h-screen pb-24 md:pb-6 text-gray-900">

      {/* =========================================================
          HEADER
      ========================================================= */}

      <div className="border-b border-gray-200 pb-2 mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">
          Sales Overview
        </h1>

        <p className="text-gray-500 text-xs md:text-sm mt-0.5">
          Track financial performance,
          plan distribution and age-wise
          sales.
        </p>
      </div>

      {/* =========================================================
          TOTAL INCOME
      ========================================================= */}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 mb-6">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">

          <div className="flex items-center gap-3">
            <Wallet className="h-5 w-5 text-emerald-600" />

            <h3 className="text-base font-bold text-gray-900">
              Total Income
            </h3>
          </div>

          {/* Date selector */}
          <div className="w-full sm:w-64">
            <select
              value={datePreset}
              onChange={(e) =>
                setDatePreset(
                  e.target.value
                )
              }
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs text-gray-900 font-medium focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="current-month">
                Current Month
              </option>

              <option value="last-month">
                Last Month
              </option>

              <option value="current-fiscal">
                Current Fiscal Year
              </option>

              <option value="last-fiscal">
                Last Fiscal Year
              </option>

              <option value="custom">
                Custom Range
              </option>
            </select>
          </div>
        </div>

        {/* =====================================================
            CUSTOM DATE RANGE
        ===================================================== */}

        {datePreset ===
          "custom" && (
          <div className="grid grid-cols-2 gap-3 mb-6 p-3 bg-gray-50 border border-gray-100 rounded-xl animate-fadeIn">

            {/* From */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1 flex items-center gap-1">
                <Calendar className="h-3 w-3" />

                From
              </label>

              <input
                type="date"
                value={customFrom}
                onChange={(e) =>
                  setCustomFrom(
                    e.target.value
                  )
                }
                className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-xs text-gray-900 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* To */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1 flex items-center gap-1">
                <Calendar className="h-3 w-3" />

                To
              </label>

              <input
                type="date"
                value={customTo}
                onChange={(e) =>
                  setCustomTo(
                    e.target.value
                  )
                }
                className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-xs text-gray-900 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        )}

        {/* =====================================================
            TOTAL AMOUNT
        ===================================================== */}

        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-6 text-center mb-3">

          <p className="text-3xl font-black text-emerald-700">
            ₹
            {totalIncome.toLocaleString(
              "en-IN"
            )}
          </p>

          <p className="text-xs text-emerald-600 font-medium mt-1 capitalize">
            {datePreset.replace(
              "-",
              " "
            )}{" "}
            Performance
          </p>

          {activeRange.fromDate &&
            activeRange.toDate && (
              <p className="text-[10px] text-emerald-500 mt-0.5">
                (
                {
                  activeRange.fromDate
                }{" "}
                to{" "}
                {
                  activeRange.toDate
                }
                )
              </p>
            )}
        </div>

        <p className="text-xs text-gray-500 text-center">
          Generated from{" "}
          {incomeEntries.length}{" "}
          collection item
          {incomeEntries.length !== 1
            ? "s"
            : ""}
        </p>
      </div>

      {/* =========================================================
          INCOME BY PLAN
      ========================================================= */}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 mb-6">

        <div className="flex items-center gap-3 mb-5">
          <TrendingUp className="h-5 w-5 text-blue-600" />

          <h3 className="text-base font-bold text-gray-900">
            Income by Plan
          </h3>
        </div>

        {planIncome.length ===
        0 ? (
          <div className="text-center py-10 text-gray-400 border border-dashed border-gray-200 rounded-xl">
            <p className="text-sm font-medium">
              No sales data recorded
              for this timeframe.
            </p>
          </div>
        ) : (
          <div className="space-y-4">

            {planIncome.map(
              (row, idx) => (
                <div
                  key={row.plan}
                >

                  <div className="flex items-center justify-between mb-1.5">

                    <span className="text-sm font-semibold text-gray-700">

                      {
                        PLAN_LABELS[
                          row.plan
                        ] ||
                          row.plan
                      }

                      <span className="text-gray-400 font-normal ml-1.5">
                        ({row.count}{" "}
                        {row.count ===
                        1
                          ? "entry"
                          : "entries"}
                        )
                      </span>
                    </span>

                    <span className="text-sm font-bold text-gray-900">
                      ₹
                      {row.amount.toLocaleString(
                        "en-IN"
                      )}
                    </span>

                  </div>

                  <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">

                    <div
                      className={`h-full rounded-full ${
                        BAR_COLORS[
                          idx %
                            BAR_COLORS.length
                        ]
                      } transition-all duration-500`}
                      style={{
                        width: `${
                          maxPlanAmount >
                          0
                            ? (row.amount /
                                maxPlanAmount) *
                              100
                            : 0
                        }%`,
                      }}
                    />

                  </div>
                </div>
              )
            )}

          </div>
        )}
      </div>

      {/* =========================================================
          SALES BY AGE GROUP
      ========================================================= */}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">

        <div className="flex items-center gap-3 mb-5">

          <Users className="h-5 w-5 text-violet-600" />

          <h3 className="text-base font-bold text-gray-900">
            Sales by Age Group
          </h3>

        </div>

        {/* Age Groups */}

        <div className="space-y-4">

          {ageIncome.map(
            (row, idx) => (
              <div
                key={row.key}
              >

                {/* Label + count + amount */}
                <div className="flex items-center justify-between mb-1.5">

                  <span className="text-sm font-semibold text-gray-700">

                    {row.label}

                    <span className="text-gray-400 font-normal ml-1.5">
                      ({row.count}{" "}
                      {row.count ===
                      1
                        ? "sale"
                        : "sales"}
                      )
                    </span>

                  </span>

                  <span className="text-sm font-bold text-gray-900">
                    ₹
                    {row.amount.toLocaleString(
                      "en-IN"
                    )}
                  </span>

                </div>

                {/* Progress bar */}

                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">

                  <div
                    className={`h-full rounded-full ${
                      BAR_COLORS[
                        idx %
                          BAR_COLORS.length
                      ]
                    } transition-all duration-500`}
                    style={{
                      width: `${
                        maxAgeAmount >
                        0
                          ? (row.amount /
                              maxAgeAmount) *
                            100
                          : 0
                      }%`,
                    }}
                  />

                </div>

              </div>
            )
          )}

        </div>

      </div>
    </div>
  );
}