import Inquiry from "../models/Inquiry.js";

// Inquiry.js stores `willingToJoin` and relies on `createdAt` (timestamps)
// as the add-date. Frontend (EnquiryView/EnquiryForm) calls these
// `whenToJoin` and `enquiryAddDate` — map between the two here so the
// slice doesn't need to change its field names.
const formatInquiry = (doc) => ({
  id: doc._id.toString(),
  name: doc.name,
  mobile: doc.mobile,
  whenToJoin: doc.willingToJoin,
  enquiryAddDate: doc.createdAt.toISOString().split("T")[0],
});

// @route  GET /owner/enquiries
// @access Private (owner, trainer)
export const getInquiries = async (req, res) => {
  try {
    const inquiries = await Inquiry.find({ gym: req.user.gymId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, enquiries: inquiries.map(formatInquiry) });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch enquiries.",
      error: error.message,
    });
  }
};

// @route  POST /owner/enquiries
// @access Private (owner, trainer)
export const addInquiry = async (req, res) => {
  try {
    const { name, mobile, whenToJoin } = req.body;

    if (!name || !mobile) {
      return res.status(400).json({
        success: false,
        message: "Name and mobile are required.",
      });
    }

    const inquiry = await Inquiry.create({
      gym: req.user.gymId,
      name,
      mobile,
      willingToJoin: whenToJoin,
    });

    res.status(201).json({
      success: true,
      message: "Enquiry added successfully.",
      enquiry: formatInquiry(inquiry),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to add enquiry.",
      error: error.message,
    });
  }
};

// @route  PUT /owner/enquiries/:id
// @access Private (owner, trainer)
// Used by EnquiryView's inline "Change Date" edit.
export const updateInquiry = async (req, res) => {
  try {
    const { id } = req.params;
    const { whenToJoin, name, mobile } = req.body;

    const inquiry = await Inquiry.findOne({ _id: id, gym: req.user.gymId });
    if (!inquiry) {
      return res.status(404).json({ success: false, message: "Enquiry not found." });
    }

    if (whenToJoin !== undefined) inquiry.willingToJoin = whenToJoin;
    if (name !== undefined) inquiry.name = name;
    if (mobile !== undefined) inquiry.mobile = mobile;
    await inquiry.save();

    res.status(200).json({
      success: true,
      message: "Enquiry updated successfully.",
      enquiry: formatInquiry(inquiry),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update enquiry.",
      error: error.message,
    });
  }
};

// @route  DELETE /owner/enquiries/:id
// @access Private (owner, trainer)
export const deleteInquiry = async (req, res) => {
  try {
    const { id } = req.params;
    const inquiry = await Inquiry.findOne({ _id: id, gym: req.user.gymId });
    if (!inquiry) {
      return res.status(404).json({ success: false, message: "Enquiry not found." });
    }

    await Inquiry.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: "Enquiry deleted successfully." });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete enquiry.",
      error: error.message,
    });
  }
};