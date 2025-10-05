import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';

export interface ResponseSection {
  id: string;
  title: string;
  content: string;
  completed: boolean;
}

export interface ExportData {
  documentName: string;
  sections: ResponseSection[];
  analysisDate: string;
  companyName?: string;
}

// PDF Export Functionality
export const exportToPDF = async (data: ExportData): Promise<void> => {
  try {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - 2 * margin;
    let currentY = margin;

    // Add title
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('RFP Response Document', margin, currentY);
    currentY += 15;

    // Add document info
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Document: ${data.documentName}`, margin, currentY);
    currentY += 8;
    pdf.text(`Generated: ${data.analysisDate}`, margin, currentY);
    currentY += 8;
    if (data.companyName) {
      pdf.text(`Company: ${data.companyName}`, margin, currentY);
      currentY += 8;
    }
    currentY += 10;

    // Add a line separator
    pdf.setDrawColor(200, 200, 200);
    pdf.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 15;

    // Add sections
    const completedSections = data.sections.filter(section => section.completed && section.content.trim());
    
    for (let i = 0; i < completedSections.length; i++) {
      const section = completedSections[i];
      
      // Check if we need a new page
      if (currentY > pageHeight - 60) {
        pdf.addPage();
        currentY = margin;
      }

      // Section title
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(section.title, margin, currentY);
      currentY += 12;

      // Section content
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      
      // Split content into lines that fit the page width
      const lines = pdf.splitTextToSize(section.content, maxWidth);
      
      for (const line of lines) {
        // Check if we need a new page
        if (currentY > pageHeight - 20) {
          pdf.addPage();
          currentY = margin;
        }
        
        pdf.text(line, margin, currentY);
        currentY += 6;
      }
      
      currentY += 10; // Add space between sections
    }

    // Save the PDF
    const fileName = `rfp-response-${data.documentName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF. Please try again.');
  }
};

// DOCX Export Functionality
export const exportToDOCX = async (data: ExportData): Promise<void> => {
  try {
    const completedSections = data.sections.filter(section => section.completed && section.content.trim());
    
    // Create document sections
    const docSections = [];

    // Document header
    docSections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'RFP Response Document',
            bold: true,
            size: 32,
          }),
        ],
        heading: HeadingLevel.TITLE,
        spacing: { after: 400 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Document: ${data.documentName}`,
            size: 24,
          }),
        ],
        spacing: { after: 200 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Generated: ${data.analysisDate}`,
            size: 24,
          }),
        ],
        spacing: { after: 200 },
      })
    );

    if (data.companyName) {
      docSections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Company: ${data.companyName}`,
              size: 24,
            }),
          ],
          spacing: { after: 400 },
        })
      );
    }

    // Add sections
    for (const section of completedSections) {
      // Section title
      docSections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: section.title,
              bold: true,
              size: 28,
            }),
          ],
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
        })
      );

      // Section content - split into paragraphs
      const contentParagraphs = section.content.split('\n\n');
      for (const paragraph of contentParagraphs) {
        if (paragraph.trim()) {
          docSections.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: paragraph.trim(),
                  size: 22,
                }),
              ],
              spacing: { after: 200 },
            })
          );
        }
      }
    }

    // Create the document
    const doc = new Document({
      sections: [
        {
          children: docSections,
        },
      ],
    });

    // Generate and save the document
    const buffer = await Packer.toBlob(doc);
    const fileName = `rfp-response-${data.documentName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${new Date().toISOString().split('T')[0]}.docx`;
    saveAs(buffer, fileName);
  } catch (error) {
    console.error('Error generating DOCX:', error);
    throw new Error('Failed to generate DOCX document. Please try again.');
  }
};

// Utility function to format date
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Utility function to get document name from file name
export const getDocumentName = (fileName: string): string => {
  return fileName.replace(/\.[^/.]+$/, ''); // Remove file extension
};