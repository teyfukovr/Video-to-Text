import { jsPDF } from "jspdf";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import { NOTO_SANS_BASE64 } from "./fonts"

const PDF_FONT_NAME = "NotoSans";
const PDF_FONT_FILE = "NotoSans-Regular.ttf";

const ensurePdfFont = (pdf) => {
    pdf.addFileToVFS(PDF_FONT_FILE, NOTO_SANS_BASE64);
    pdf.addFont(PDF_FONT_FILE, PDF_FONT_NAME, "normal");
    pdf.setFont(PDF_FONT_NAME, "normal");
};

const createTxtBlob = (text) => new Blob([text], { type: "text/plain" });

const createPdfBlob = (text) => {
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  ensurePdfFont(pdf);

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const horizontalMargin = 56;
  const topMargin = 64;
  const bottomMargin = 56;
  const lineHeight = 20;

  pdf.setFontSize(12);
  const lines = pdf.splitTextToSize(text, pageWidth - horizontalMargin * 2);
  let currentY = topMargin + 32;

  lines.forEach((line) => {
    if (currentY > pageHeight - bottomMargin) {
      pdf.addPage();
      pdf.setFont(PDF_FONT_NAME, "normal");
      pdf.setFontSize(12);
      currentY = topMargin;
    }

    pdf.text(line, horizontalMargin, currentY);
    currentY += lineHeight;
  });

  return pdf.output("blob");
};

const createDocxBlob = async (text) => {
  const textParagraphs = text.split(/\n+/).filter(Boolean);

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1260,
              right: 1260,
              bottom: 1260,
              left: 1260,
            },
          },
        },
        children: [
          ...textParagraphs.map(
            (paragraphText) =>
              new Paragraph({
                spacing: { after: 180, line: 360 },
                children: [
                  new TextRun({
                    text: paragraphText,
                    size: 24,
                  }),
                ],
              })
          ),
        ],
      },
    ],
  });

  return Packer.toBlob(doc);
};

export const downloadBlob = (blob, fileName) => {
  const fileUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = fileUrl;
  link.download = fileName;
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => URL.revokeObjectURL(fileUrl), 0);
};

export const generateFile = async (text, format) => {
  const safeText = text?.trim() ? text : "Пустой результат транскрибации.";

  switch (format) {
    case "txt":
      return {
        blob: createTxtBlob(safeText),
      };

    case "pdf":
      return {
        blob: await createPdfBlob(safeText),
      };

    case "docx":
      return {
        blob: await createDocxBlob(safeText),
      };

    default:
      throw new Error("Выбран неподдерживаемый формат файла.");
  }
};