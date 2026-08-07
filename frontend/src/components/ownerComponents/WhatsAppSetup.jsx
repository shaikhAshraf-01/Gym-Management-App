import React from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  MessageCircle,
  ShieldCheck,
  Smartphone,
  Info,
} from "lucide-react";

export default function WhatsAppSetup() {
  const navigate = useNavigate();

  // Temporary frontend state.
  // Later this will come from the backend after Meta connection.
  const isConnected = false;

  const handleConnectWhatsApp = () => {
    /*
      TEMPORARY:

      We are not connecting to Meta yet.

      Later this button will start the Meta OAuth flow:
      
      Owner
        ↓
      Meta Login
        ↓
      WhatsApp Business Account
        ↓
      Meta callback
        ↓
      Backend saves connection
        ↓
      WhatsApp becomes connected
    */

    alert("Meta WhatsApp connection will be implemented next.");
  };

  const handleManagement = () => {
    navigate("/owner/whatsapp");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-20">
      <div className="max-w-xl mx-auto">

        {/* ================= HEADER ================= */}

        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 transition cursor-pointer"
          >
            <ArrowLeft size={20} />
          </button>

          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Connect WhatsApp
            </h1>

            <p className="text-sm text-gray-500 mt-0.5">
              Connect your gym's WhatsApp Business account
            </p>
          </div>
        </div>

        {/* ================= MAIN CARD ================= */}

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

          {/* WhatsApp Header */}

          <div className="bg-green-50 border-b border-green-100 p-6 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <MessageCircle
                size={34}
                className="text-green-600"
              />
            </div>

            <h2 className="text-lg font-bold text-gray-900 mt-4">
              WhatsApp Business
            </h2>

            <p className="text-sm text-gray-600 mt-1 max-w-sm mx-auto">
              Connect your gym's WhatsApp Business account to
              send membership and promotional messages.
            </p>
          </div>

          {/* ================= CONTENT ================= */}

          <div className="p-5">

            {/* ================= NOT CONNECTED ================= */}

            {!isConnected ? (
              <>
                {/* Information box */}

                <div className="flex gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4 mb-5">
                  <Info
                    size={19}
                    className="text-blue-600 shrink-0 mt-0.5"
                  />

                  <div>
                    <p className="text-sm font-semibold text-blue-900">
                      How WhatsApp connection works
                    </p>

                    <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                      You will be redirected to Meta to securely
                      connect your WhatsApp Business account.
                      GymOpsFlow will use the connection to send
                      approved WhatsApp messages.
                    </p>
                  </div>
                </div>

                {/* Features */}

                <div className="space-y-3 mb-6">

                  <div className="flex items-center gap-3">
                    <CheckCircle2
                      size={18}
                      className="text-green-600 shrink-0"
                    />

                    <p className="text-sm text-gray-700">
                      Send membership-related messages
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <CheckCircle2
                      size={18}
                      className="text-green-600 shrink-0"
                    />

                    <p className="text-sm text-gray-700">
                      Create and manage message templates
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <CheckCircle2
                      size={18}
                      className="text-green-600 shrink-0"
                    />

                    <p className="text-sm text-gray-700">
                      Publish promotional offers
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <CheckCircle2
                      size={18}
                      className="text-green-600 shrink-0"
                    />

                    <p className="text-sm text-gray-700">
                      Owner and trainers can use the gym's
                      connected WhatsApp account
                    </p>
                  </div>

                </div>

                {/* Connect Button */}

                <button
                  onClick={handleConnectWhatsApp}
                  className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white rounded-xl py-3.5 font-semibold transition cursor-pointer shadow-sm"
                >
                  <MessageCircle size={19} />
                  Connect WhatsApp
                </button>

                {/* Security note */}

                <div className="flex items-center justify-center gap-2 mt-4">
                  <ShieldCheck
                    size={15}
                    className="text-gray-400"
                  />

                  <p className="text-[11px] text-gray-400">
                    Secure connection through Meta
                  </p>
                </div>
              </>
            ) : (

              /* ================= CONNECTED ================= */

              <>
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-5">

                  <div className="flex items-center gap-3">

                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle2
                        size={22}
                        className="text-green-600"
                      />
                    </div>

                    <div>
                      <p className="text-sm font-bold text-green-800">
                        WhatsApp Connected
                      </p>

                      <p className="text-xs text-green-700 mt-0.5">
                        Your gym's WhatsApp account is connected.
                      </p>
                    </div>

                  </div>

                </div>

                {/* Connected number */}

                <div className="border border-gray-200 rounded-xl p-4 mb-4">

                  <div className="flex items-center gap-3">

                    <Smartphone
                      size={19}
                      className="text-gray-500"
                    />

                    <div>
                      <p className="text-xs text-gray-400">
                        Connected Number
                      </p>

                      <p className="text-sm font-semibold text-gray-800 mt-0.5">
                        +91 XXXXX XXXXX
                      </p>
                    </div>

                  </div>

                </div>

                {/* Management button */}

                <button
                  onClick={handleManagement}
                  className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white rounded-xl py-3.5 font-semibold transition cursor-pointer"
                >
                  <MessageCircle size={19} />
                  Manage WhatsApp
                </button>

              </>
            )}

          </div>
        </div>

        {/* ================= IMPORTANT NOTE ================= */}

        <div className="mt-5 bg-white border border-gray-200 rounded-xl p-4">

          <div className="flex gap-3">

            <Info
              size={18}
              className="text-gray-400 shrink-0 mt-0.5"
            />

            <div>

              <p className="text-xs font-semibold text-gray-700">
                Important
              </p>

              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                WhatsApp is connected at the gym level. You do
                not need to connect every trainer separately.
                Trainers belonging to this gym can use the
                gym's connected WhatsApp account when sending
                permitted messages.
              </p>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}