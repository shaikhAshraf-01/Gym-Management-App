import React, { useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  CalendarDays,
  BadgeCheck,
  Camera,
  Trash2,
  LogOut,
  MessageCircle,
  Plus,
  Send,
  X,
  FileText,
} from "lucide-react";

import { logout } from "../../redux/slices/authSlice";
import {
  fetchOwnerProfile,
  uploadGymLogo,
  removeGymLogo,
} from "../../redux/slices/ownerSlice";

export default function OwnerProfile() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const photoInputRef = useRef(null);

  const { owner, gym, currentSubscription, loading, uploading, error } =
    useSelector((state) => state.owner);


  const [whatsappConnected, setWhatsappConnected] = useState(false);

  const [showOffers, setShowOffers] = useState(false);

  const [showCreateTemplate, setShowCreateTemplate] = useState(false);

  const [templates, setTemplates] = useState([
    {
      id: 1,
      name: "15 August Offer",
      message:
        "🇮🇳 Special 15 August Offer! Join our gym today and get exciting benefits. Contact us for more details.",
    },
  ]);

  const [templateForm, setTemplateForm] = useState({
    name: "",
    message: "",
  });

  // Fetch owner profile

  useEffect(() => {
    dispatch(fetchOwnerProfile());
  }, [dispatch]);

  // Logout

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  // Gym Logo

  const handleLogoChange = async (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const formData = new FormData();
    formData.append("gymLogo", file);

    try {
      await dispatch(uploadGymLogo(formData)).unwrap();
    } catch (err) {
      alert(err);
    }

    e.target.value = "";
  };

  const handleRemoveLogo = async () => {
    try {
      await dispatch(removeGymLogo()).unwrap();
    } catch (error) {
      alert(error);
    }
  };

  // -------------------------------------------------------
  // WhatsApp
  // -------------------------------------------------------

  const handleConnectWhatsApp = () => {
    /*
      TEMPORARY FRONTEND BEHAVIOUR

      Later this button will start the actual Meta/WhatsApp
      connection process.

      Example future flow:

      Owner clicks Connect WhatsApp
             ↓
      Meta login / authorization
             ↓
      WhatsApp Business account
             ↓
      OTP / verification
             ↓
      Backend stores connection
             ↓
      whatsappConnected = true
    */

navigate("/owner/whatsapp/setup")  };

  const handleDisconnectWhatsApp = () => {
    /*
      Later this will call backend API to disconnect
      the WhatsApp Business integration.
    */

    setWhatsappConnected(false);
  };

  // -------------------------------------------------------
  // Template
  // -------------------------------------------------------

  const handleTemplateChange = (e) => {
    const { name, value } = e.target;

    setTemplateForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateTemplate = (e) => {
    e.preventDefault();

    if (!templateForm.name.trim() || !templateForm.message.trim()) {
      return;
    }

    const newTemplate = {
      id: Date.now(),
      name: templateForm.name.trim(),
      message: templateForm.message.trim(),
    };

    setTemplates((prev) => [...prev, newTemplate]);

    setTemplateForm({
      name: "",
      message: "",
    });

    setShowCreateTemplate(false);
  };

  // -------------------------------------------------------
  // Loading
  // -------------------------------------------------------

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // -------------------------------------------------------
  // Error
  // -------------------------------------------------------

  if (error) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <p className="text-red-500 font-medium">{error}</p>
      </div>
    );
  }

  // -------------------------------------------------------
  // No profile
  // -------------------------------------------------------

  if (!gym || !owner) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <p className="text-gray-500">
          Gym profile data could not be found.
        </p>
      </div>
    );
  }

  const logo = gym?.gymLogo || "";

  const subscription = currentSubscription || {};
  const isPlusPlan=subscription.subscriptionPlan==="Plus";

  /*
    Backend currently sends:

    currentSubscription.subscriptionPlan

    Values:
    Basic
    Plus
    Pro
  */

  const currentPlan = subscription.subscriptionPlan || "";

  // WhatsApp is available only for Plus and Pro.
  const whatsappAvailable =
    currentPlan === "Plus"

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-20">
      <div className="max-w-xl mx-auto">

        {/* =====================================================
            LOGO
        ====================================================== */}

        <div className="flex flex-col items-center text-center">
          <div className="relative">
            <div className="w-28 h-28 rounded-full bg-white border shadow-md overflow-hidden flex items-center justify-center">
              {logo ? (
                <img
                  src={logo}
                  alt={gym.gymName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Building2 className="w-12 h-12 text-gray-400" />
              )}
            </div>

            <button
              disabled={uploading}
              onClick={() => photoInputRef.current?.click()}
              className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 shadow-lg"
            >
              {uploading ? (
                "Uploading ..."
              ) : (
                <Camera size={16} />
              )}
            </button>

            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoChange}
            />
          </div>

          {logo && (
            <button
              disabled={uploading}
              onClick={handleRemoveLogo}
              className="mt-2 flex items-center gap-1 text-red-500 text-sm"
            >
              {uploading ? (
                <>Removing...</>
              ) : (
                <>
                  <Trash2 size={14} />
                  Remove Logo
                </>
              )}
            </button>
          )}

          <h1 className="text-2xl font-bold mt-4">
            {gym.gymName}
          </h1>

          <p className="text-gray-500 text-sm flex items-center gap-1 mt-1">
            <Building2 size={14} />
            {gym.gymCode}
          </p>
        </div>

        {/* =====================================================
            OWNER DETAILS
        ====================================================== */}

        <div className="bg-white rounded-xl shadow-sm border mt-8 p-5">
          <h2 className="text-sm font-bold text-gray-500 uppercase mb-5">
            Owner Details
          </h2>

          <div className="space-y-5">

            <div className="flex items-center gap-3">
              <User size={18} className="text-blue-600" />

              <div>
                <p className="text-xs text-gray-400">
                  Owner Name
                </p>

                <p className="font-semibold">
                  {owner.name}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Phone size={18} className="text-blue-600" />

              <div>
                <p className="text-xs text-gray-400">
                  Mobile Number
                </p>

                <p className="font-semibold">
                  {owner.mobile}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Mail size={18} className="text-blue-600" />

              <div>
                <p className="text-xs text-gray-400">
                  Email Address
                </p>

                <p className="font-semibold break-all">
                  {owner.email}
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* =====================================================
            GYM DETAILS
        ====================================================== */}

        <div className="bg-white rounded-xl shadow-sm border mt-6 p-5">
          <h2 className="text-sm font-bold text-gray-500 uppercase mb-5">
            Gym Details
          </h2>

          <div className="space-y-5">

            <div className="flex items-center gap-3">
              <MapPin size={18} className="text-blue-600" />

              <div>
                <p className="text-xs text-gray-400">
                  Location
                </p>

                <p className="font-semibold">
                  {gym.location}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Building2 size={18} className="text-blue-600" />

              <div>
                <p className="text-xs text-gray-400">
                  Gym Code
                </p>

                <p className="font-semibold">
                  {gym.gymCode}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <BadgeCheck
                size={18}
                className="text-green-600"
              />

              <div>
                <p className="text-xs text-gray-400">
                  Gym Status
                </p>

                <span
                  className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                    gym.status === "active"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {gym.status}
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* =====================================================
            SUBSCRIPTION DETAILS
        ====================================================== */}

        <div className="bg-white rounded-xl shadow-sm border mt-6 p-5">
          <h2 className="text-sm font-bold text-gray-500 uppercase mb-5">
            Subscription Details
          </h2>

          <div className="space-y-5">

            <div className="flex items-center gap-3">
              <BadgeCheck
                size={18}
                className="text-green-600"
              />

              <div>
                <p className="text-xs text-gray-400">
                  Current Plan
                </p>

                <p className="font-semibold">
                  {subscription.subscriptionPlan ||
                    "No Active Plan"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <CalendarDays
                size={18}
                className="text-blue-600"
              />

              <div>
                <p className="text-xs text-gray-400">
                  Start Date
                </p>

                <p className="font-semibold">
                  {subscription.startDate
                    ? new Date(
                        subscription.startDate
                      ).toLocaleDateString()
                    : "--"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <CalendarDays
                size={18}
                className="text-red-600"
              />

              <div>
                <p className="text-xs text-gray-400">
                  Expiry Date
                </p>

                <p className="font-semibold">
                  {subscription.endDate
                    ? new Date(
                        subscription.endDate
                      ).toLocaleDateString()
                    : "--"}
                </p>
              </div>
            </div>

          </div>
        </div>


        {/* =====================================================
            WHATSAPP SECTION
            ONLY PLUS / PRO
        ====================================================== */}

        {whatsappAvailable && (
          <div className="bg-white rounded-xl shadow-sm border mt-6 p-5">

            <div className="flex items-center justify-between mb-5">

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <MessageCircle
                    size={21}
                    className="text-green-600"
                  />
                </div>

                <div>
                  <h2 className="text-sm font-bold text-gray-800 uppercase">
                    WhatsApp Business
                  </h2>

                  <p className="text-xs text-gray-400 mt-0.5">
                    Available with {currentPlan} plan
                  </p>
                </div>
              </div>

              {whatsappConnected && (
                <span className="px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-[10px] font-bold uppercase">
                  Connected
                </span>
              )}

            </div>

            {!whatsappConnected ? (
              <div>
                <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                  Connect your WhatsApp Business account to create
                  templates and send promotional offers to your
                  members.
                </p>

                <button
                  onClick={handleConnectWhatsApp}
                  className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white rounded-lg py-3 text-sm font-semibold transition"
                >
                  <MessageCircle size={18} />
                  Connect WhatsApp
                </button>
              </div>
            ) : (
              <div>

                <div className="bg-green-50 border border-green-100 rounded-lg p-3 mb-4">
                  <p className="text-xs text-green-700">
                    Your WhatsApp Business account is connected.
                    You can now create templates and publish offers.
                  </p>
                </div>

                <div className="flex gap-3">

                  <button
                    onClick={() => setShowOffers(true)}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-3 text-sm font-semibold transition"
                  >
                    <Send size={17} />
                    Publish Offers
                  </button>

                  <button
                    onClick={handleDisconnectWhatsApp}
                    className="px-4 py-3 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold"
                  >
                    Disconnect
                  </button>

                </div>

              </div>
            )}

          </div>
        )}

        {/* =====================================================
            PUBLISH OFFERS MODAL
        ====================================================== */}

        {showOffers && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">

            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto">

              {/* Header */}

              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">

                <div>
                  <h2 className="text-base font-bold text-gray-900 uppercase tracking-wider">
                    Publish Offers
                  </h2>

                  <p className="text-xs text-gray-400 mt-1">
                    WhatsApp promotional templates
                  </p>
                </div>

                <button
                  onClick={() => setShowOffers(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  <X size={20} />
                </button>

              </div>

              <div className="p-5">

                {/* Create Template */}

                <button
                  onClick={() => setShowCreateTemplate(true)}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-3 text-sm font-semibold mb-5"
                >
                  <Plus size={18} />
                  Create New Template
                </button>

                {/* Templates */}

                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                    Your Templates
                  </h3>

                  {templates.length === 0 ? (
                    <div className="text-center border border-dashed border-gray-200 rounded-lg p-6">
                      <FileText
                        size={25}
                        className="mx-auto text-gray-300 mb-2"
                      />

                      <p className="text-xs text-gray-400">
                        No templates created yet.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">

                      {templates.map((template) => (
                        <div
                          key={template.id}
                          className="border border-gray-200 rounded-xl p-4"
                        >

                          <div className="flex items-center justify-between mb-2">

                            <h4 className="text-sm font-bold text-gray-800">
                              {template.name}
                            </h4>

                            <button
                              className="text-xs text-green-600 font-semibold flex items-center gap-1"
                              onClick={() =>
                                alert(
                                  "Template publishing will be connected to WhatsApp API later."
                                )
                              }
                            >
                              <Send size={13} />
                              Publish
                            </button>

                          </div>

                          <p className="text-xs text-gray-500 leading-relaxed">
                            {template.message}
                          </p>

                        </div>
                      ))}

                    </div>
                  )}

                </div>

              </div>

            </div>

          </div>
        )}

        {/* =====================================================
            CREATE TEMPLATE MODAL
        ====================================================== */}

        {showCreateTemplate && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">

            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">

              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">

                <h2 className="text-sm font-bold uppercase tracking-wider">
                  Create Template
                </h2>

                <button
                  onClick={() => setShowCreateTemplate(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"
                >
                  <X size={19} />
                </button>

              </div>

              <form
                onSubmit={handleCreateTemplate}
                className="p-5 space-y-4"
              >

                <div>
                  <label className="block text-xs uppercase font-bold text-gray-500 mb-1">
                    Template Name
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={templateForm.name}
                    onChange={handleTemplateChange}
                    placeholder="e.g. 15 August Offer"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase font-bold text-gray-500 mb-1">
                    Message
                  </label>

                  <textarea
                    name="message"
                    value={templateForm.message}
                    onChange={handleTemplateChange}
                    rows={5}
                    placeholder="Write your WhatsApp offer message..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-blue-500 resize-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-3 text-sm font-semibold"
                >
                  Save Template
                </button>

              </form>

            </div>

          </div>
        )}

        {/* =====================================================
            LOGOUT
        ====================================================== */}

        <button
          onClick={handleLogout}
          className="mt-8 w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl py-3 font-semibold transition"
        >
          <LogOut size={18} />
          Logout
        </button>

      </div>
    </div>
  );
}