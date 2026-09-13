import PDFDocument from "pdfkit";

const GST_RATE = 0.18;

// Builds a simple invoice/receipt PDF for a single admission/renewal,
// entirely server-side (unlike the interactive receipt in
// MemberProfileModal.jsx, which is client-side jsPDF for manual
// download/share). This one is generated in the background so it can
// be attached to the automated WhatsApp Welcome message — kept
// intentionally simpler than the client-side version, since nobody
// is looking at it on screen while it's built.
//
// Returns a Promise<Buffer> of the finished PDF.
export function generateInvoicePdf({ gym, member, subscription }) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A5", margin: 36 });
      const chunks = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const gstNumber = (gym?.gstNumber || "").trim();
      const isGstInvoice = Boolean(gstNumber);
      const gymName = gym?.gymName || "Gym";
      const amount = Number(subscription?.planAmount || 0);
      const money = (n) => `Rs. ${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

      // ---- Header band ----
      doc.rect(0, 0, doc.page.width, 70).fill("#0f172a");
      doc
        .fillColor("#ffffff")
        .font("Helvetica-Bold")
        .fontSize(16)
        .text(gymName, 36, 20, { width: doc.page.width - 140 });

      if (isGstInvoice) {
        doc
          .font("Helvetica")
          .fontSize(9)
          .fillColor("#cbd5e1")
          .text(`GSTIN: ${gstNumber}`, 36, 42);
      }

      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .fillColor("#0f172a")
        .rect(doc.page.width - 110, 20, 74, 22)
        .fill("#22d3ee");
      doc
        .fillColor("#0f172a")
        .text(isGstInvoice ? "TAX INVOICE" : "RECEIPT", doc.page.width - 110, 27, {
          width: 74,
          align: "center",
        });

      // ---- Body ----
      doc.fillColor("#000000");
      let y = 90;

      doc.font("Helvetica-Bold").fontSize(10).text("Billed To", 36, y);
      doc.font("Helvetica").fontSize(11).text(member?.name || "-", 36, y + 14);
      doc.fontSize(9).fillColor("#64748b").text(member?.mobile || "", 36, y + 30);

      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .fillColor("#000000")
        .text("Date", doc.page.width - 130, y, { width: 94, align: "right" });
      doc
        .font("Helvetica")
        .fontSize(10)
        .text(
          new Date(subscription?.joiningDate || Date.now()).toLocaleDateString("en-IN"),
          doc.page.width - 130,
          y + 14,
          { width: 94, align: "right" }
        );

      y += 56;
      doc.moveTo(36, y).lineTo(doc.page.width - 36, y).strokeColor("#cbd5e1").stroke();
      y += 14;

      // ---- Line item ----
      doc.font("Helvetica-Bold").fontSize(9).fillColor("#475569");
      doc.text("Description", 36, y);
      doc.text("Amount", doc.page.width - 130, y, { width: 94, align: "right" });
      y += 16;

      doc.font("Helvetica").fontSize(10).fillColor("#000000");
      const planLabel = `Membership — ${subscription?.plan || member?.plan || ""}`.replace(
        "_",
        " "
      );
      const lineAmount = isGstInvoice ? amount / (1 + GST_RATE) : amount;
      doc.text(planLabel, 36, y, { width: doc.page.width - 200 });
      doc.text(money(lineAmount), doc.page.width - 130, y, { width: 94, align: "right" });
      y += 24;

      if (isGstInvoice) {
        const gstAmount = amount - lineAmount;
        const half = gstAmount / 2;
        doc.fontSize(9).fillColor("#64748b");
        doc.text("CGST (9%)", 36, y);
        doc.text(money(half), doc.page.width - 130, y, { width: 94, align: "right" });
        y += 14;
        doc.text("SGST (9%)", 36, y);
        doc.text(money(half), doc.page.width - 130, y, { width: 94, align: "right" });
        y += 20;
      }

      doc.moveTo(36, y).lineTo(doc.page.width - 36, y).strokeColor("#cbd5e1").stroke();
      y += 12;

      // ---- Total bar ----
      doc.rect(36, y, doc.page.width - 72, 30).fill("#0f172a");
      doc
        .fillColor("#ffffff")
        .font("Helvetica-Bold")
        .fontSize(11)
        .text("Total Paid", 46, y + 9)
        .text(money(amount), doc.page.width - 140, y + 9, { width: 94, align: "right" });

      y += 46;
      doc
        .fillColor("#94a3b8")
        .font("Helvetica")
        .fontSize(8)
        .text("Thank you for being a member!", 36, y, {
          width: doc.page.width - 72,
          align: "center",
        });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}