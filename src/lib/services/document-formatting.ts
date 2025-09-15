// Professional Document Formatting Service
// Converts responses from markdown/structured format to clean professional text

export interface FormattedResponse {
  questionText: string;
  formattedResponse: string;
  confidence: number;
  sources: string[];
  wordCount: number;
}

export interface DocumentSection {
  title: string;
  content: string;
  subsections?: DocumentSection[];
}

export interface FormattedDocument {
  title: string;
  executiveSummary: string;
  tableOfContents: string[];
  sections: DocumentSection[];
  complianceMatrix: Array<{
    requirement: string;
    response: string;
    status: 'Full Compliance' | 'Partial Compliance' | 'Not Applicable';
  }>;
  appendices: DocumentSection[];
  metadata: {
    generatedDate: string;
    totalPages: number;
    totalWords: number;
    averageConfidence: number;
  };
}

class DocumentFormattingService {

  /**
   * Clean markdown and structured formatting from response text
   */
  cleanResponseText(text: string): string {
    if (!text) return '';

    return text
      // Remove Zenloop structured format
      .replace(/🔹\s*\*\*ZENLOOP SOLUTION\*\*:\s*/gi, '')
      .replace(/💡\s*\*\*INDUSTRY INSIGHT\*\*:\s*/gi, '')
      .replace(/🎯\s*\*\*STRATEGIC RECOMMENDATION\*\*:\s*/gi, '')

      // Remove markdown formatting
      .replace(/\*\*(.*?)\*\*/g, '$1')  // Remove bold
      .replace(/\*(.*?)\*/g, '$1')      // Remove italic
      .replace(/`(.*?)`/g, '$1')        // Remove code formatting
      .replace(/#{1,6}\s*(.*)/g, '$1')  // Remove headers

      // Clean up bullet points - convert to standard format
      .replace(/^[•·\-\*]\s*/gm, '• ')  // Standardize bullets
      .replace(/^\d+\.\s*/gm, (match, offset, string) => {
        // For numbered lists, keep numbering clean
        const lineStart = string.lastIndexOf('\n', offset - 1) + 1;
        const lineText = string.slice(lineStart, offset);
        const number = lineText.match(/^(\d+)/)?.[1];
        return `${number}. `;
      })

      // Clean up spacing and formatting
      .replace(/\n{3,}/g, '\n\n')       // Reduce excessive line breaks
      .replace(/^\s+|\s+$/gm, '')       // Trim whitespace from lines
      .replace(/\s+/g, ' ')             // Normalize spaces
      .trim();
  }

  /**
   * Format a single response for professional document inclusion
   */
  formatResponse(questionText: string, response: string, confidence: number, sources: Array<{title: string; content: string}>): FormattedResponse {
    const formattedResponse = this.cleanResponseText(response);
    const wordCount = formattedResponse.split(/\s+/).length;
    const sourcesList = sources.map(s => s.title);

    return {
      questionText: questionText.trim(),
      formattedResponse,
      confidence,
      sources: sourcesList,
      wordCount
    };
  }

  /**
   * Generate executive summary from responses
   */
  generateExecutiveSummary(responses: FormattedResponse[], projectName: string): string {
    const totalQuestions = responses.length;
    const avgConfidence = responses.reduce((sum, r) => sum + r.confidence, 0) / totalQuestions;
    const totalWords = responses.reduce((sum, r) => sum + r.wordCount, 0);

    return `Executive Summary

This document presents Zenloop's comprehensive response to the ${projectName} Request for Proposal (RFP). Our response demonstrates Zenloop's proven capabilities in customer experience management, showcasing how our platform addresses each of your specific requirements.

Key highlights of our proposal:

• Comprehensive Coverage: We have provided detailed responses to all ${totalQuestions} questions in your RFP, demonstrating our thorough understanding of your needs.

• High Confidence Responses: Our responses maintain an average confidence level of ${avgConfidence.toFixed(1)}%, reflecting our extensive expertise and proven track record.

• Detailed Technical Information: This ${Math.ceil(totalWords / 250)}-page response provides in-depth coverage of our platform capabilities, implementation methodology, and strategic recommendations.

• Proven Experience: Each response is backed by real-world experience serving 500+ enterprise customers and comprehensive knowledge of customer experience best practices.

Zenloop is uniquely positioned to serve as your customer experience platform partner, combining advanced technology with deep industry expertise to deliver measurable business results. We look forward to discussing how our solution can transform your customer experience program and drive sustainable growth for your organization.`;
  }

  /**
   * Generate table of contents
   */
  generateTableOfContents(responses: FormattedResponse[]): string[] {
    const toc = [
      'Executive Summary',
      'Company Overview',
      'Response to RFP Questions'
    ];

    // Add question sections
    responses.forEach((response, index) => {
      const questionNumber = index + 1;
      const shortTitle = response.questionText.length > 60
        ? response.questionText.substring(0, 57) + '...'
        : response.questionText;
      toc.push(`${questionNumber}. ${shortTitle}`);
    });

    toc.push('Compliance Matrix');
    toc.push('Implementation Timeline');
    toc.push('Appendices');

    return toc;
  }

  /**
   * Generate compliance matrix
   */
  generateComplianceMatrix(responses: FormattedResponse[]): Array<{requirement: string; response: string; status: 'Full Compliance' | 'Partial Compliance' | 'Not Applicable'}> {
    return responses.map(response => ({
      requirement: response.questionText,
      response: response.formattedResponse.length > 100
        ? response.formattedResponse.substring(0, 97) + '...'
        : response.formattedResponse,
      status: response.confidence >= 90 ? 'Full Compliance' :
              response.confidence >= 70 ? 'Partial Compliance' : 'Not Applicable'
    }));
  }

  /**
   * Format complete document for export
   */
  formatCompleteDocument(
    responses: Array<{
      questionText: string;
      response: string;
      confidence: number;
      sources: Array<{title: string; content: string}>;
    }>,
    projectName: string,
    companyName: string = 'Zenloop',
    contactPerson: string = '',
    customCoverLetter: string = ''
  ): FormattedDocument {
    // Format all responses
    const formattedResponses = responses.map(r =>
      this.formatResponse(r.questionText, r.response, r.confidence, r.sources)
    );

    // Build sections
    const sections: DocumentSection[] = [
      {
        title: 'Company Overview',
        content: `${companyName} - Customer Experience Platform

${companyName} is a leading customer experience management platform that helps organizations transform customer feedback into actionable insights and measurable business results. Our comprehensive solution combines advanced survey capabilities, real-time analytics, and intelligent automation to create exceptional customer experiences.

Founded on the principle that every customer interaction is an opportunity to build stronger relationships, we serve over 500 enterprise customers worldwide, helping them achieve higher customer satisfaction, improved retention, and sustainable growth.

Our platform specializes in Net Promoter Score (NPS) programs, Customer Satisfaction (CSAT) measurement, Customer Effort Score (CES) tracking, and comprehensive Voice of Customer analytics. With deep expertise in closed-loop feedback management and advanced automation capabilities, we enable organizations to move beyond measurement to meaningful action.`
      },
      {
        title: 'Response to RFP Questions',
        content: 'The following sections provide detailed responses to each question in your RFP.',
        subsections: formattedResponses.map((response, index) => ({
          title: `Question ${index + 1}`,
          content: `Question: ${response.questionText}

Response: ${response.formattedResponse}

${response.sources.length > 0 ? `
Reference Materials:
${response.sources.map(source => `• ${source}`).join('\n')}` : ''}`
        }))
      }
    ];

    // Calculate metadata
    const totalWords = formattedResponses.reduce((sum, r) => sum + r.wordCount, 0);
    const averageConfidence = formattedResponses.reduce((sum, r) => sum + r.confidence, 0) / formattedResponses.length;

    return {
      title: `RFP Response - ${projectName}`,
      executiveSummary: this.generateExecutiveSummary(formattedResponses, projectName),
      tableOfContents: this.generateTableOfContents(formattedResponses),
      sections,
      complianceMatrix: this.generateComplianceMatrix(formattedResponses),
      appendices: [
        {
          title: 'Implementation Timeline',
          content: `Standard Implementation Process

Phase 1: Project Kickoff and Discovery (Week 1-2)
• Requirements gathering and technical assessment
• Stakeholder alignment and project planning
• Initial system configuration

Phase 2: Platform Setup and Integration (Week 3-4)
• Custom survey design and branding
• System integrations and data migration
• User account setup and permissions

Phase 3: Testing and Training (Week 5-6)
• User acceptance testing and refinement
• Comprehensive team training sessions
• Documentation and knowledge transfer

Phase 4: Go-Live and Optimization (Week 7-8)
• Production deployment and monitoring
• Initial campaign launch and support
• Performance optimization and fine-tuning

Our experienced implementation team will work closely with your organization to ensure a smooth transition and rapid time-to-value.`
        },
        {
          title: 'Additional Resources',
          content: `Supporting Documentation

This response is supported by extensive documentation available upon request:

• Technical architecture and security specifications
• Integration guides and API documentation
• Customer case studies and success stories
• Detailed product feature specifications
• Training materials and best practice guides

Contact Information:
${contactPerson ? `Primary Contact: ${contactPerson}` : 'Contact: Zenloop Sales Team'}
Email: sales@zenloop.com
Website: www.zenloop.com

We welcome the opportunity to discuss our proposal in detail and answer any additional questions you may have.`
        }
      ],
      metadata: {
        generatedDate: new Date().toLocaleDateString(),
        totalPages: Math.ceil(totalWords / 250), // Estimate 250 words per page
        totalWords,
        averageConfidence: Math.round(averageConfidence * 10) / 10
      }
    };
  }

  /**
   * Convert formatted document to Word-friendly HTML
   */
  toWordHTML(document: FormattedDocument): string {
    const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${document.title}</title>
    <style>
        body {
            font-family: 'Calibri', 'Arial', sans-serif;
            font-size: 11pt;
            line-height: 1.4;
            margin: 1in;
            color: #333;
        }
        h1 {
            font-size: 18pt;
            font-weight: bold;
            color: #1f4788;
            margin-bottom: 12pt;
            border-bottom: 2pt solid #1f4788;
            padding-bottom: 6pt;
        }
        h2 {
            font-size: 14pt;
            font-weight: bold;
            color: #1f4788;
            margin-top: 18pt;
            margin-bottom: 9pt;
        }
        h3 {
            font-size: 12pt;
            font-weight: bold;
            color: #2c5ba0;
            margin-top: 12pt;
            margin-bottom: 6pt;
        }
        p {
            margin-bottom: 6pt;
            text-align: justify;
        }
        ul, ol {
            margin-left: 18pt;
        }
        li {
            margin-bottom: 3pt;
        }
        .cover-page {
            text-align: center;
            page-break-after: always;
            margin-top: 100pt;
        }
        .executive-summary {
            page-break-before: always;
        }
        .section {
            margin-bottom: 24pt;
        }
        .question-section {
            border-left: 3pt solid #e6f2ff;
            padding-left: 12pt;
            margin: 18pt 0;
        }
        .question-title {
            font-weight: bold;
            color: #1f4788;
            margin-bottom: 6pt;
        }
        .response-content {
            margin-bottom: 12pt;
        }
        .sources {
            background-color: #f8f9fa;
            padding: 9pt;
            border-left: 3pt solid #6c757d;
            font-size: 10pt;
            margin-top: 9pt;
        }
        .compliance-table {
            width: 100%;
            border-collapse: collapse;
            margin: 12pt 0;
        }
        .compliance-table th, .compliance-table td {
            border: 1pt solid #dee2e6;
            padding: 6pt;
            text-align: left;
            font-size: 10pt;
        }
        .compliance-table th {
            background-color: #f8f9fa;
            font-weight: bold;
        }
        .footer {
            position: fixed;
            bottom: 0.5in;
            left: 1in;
            right: 1in;
            text-align: center;
            font-size: 9pt;
            color: #666;
            border-top: 1pt solid #dee2e6;
            padding-top: 6pt;
        }
    </style>
</head>
<body>
    <!-- Cover Page -->
    <div class="cover-page">
        <h1>${document.title}</h1>
        <p style="font-size: 14pt; margin-top: 24pt;">
            Prepared by Zenloop<br>
            ${document.metadata.generatedDate}
        </p>
        <p style="font-size: 12pt; margin-top: 48pt; color: #666;">
            Professional Customer Experience Platform Response
        </p>
    </div>

    <!-- Executive Summary -->
    <div class="executive-summary section">
        <h1>Executive Summary</h1>
        ${this.formatTextAsHTML(document.executiveSummary)}
    </div>

    <!-- Table of Contents -->
    <div class="section">
        <h1>Table of Contents</h1>
        <ol>
            ${document.tableOfContents.map(item => `<li>${item}</li>`).join('')}
        </ol>
    </div>

    <!-- Main Sections -->
    ${document.sections.map(section => `
        <div class="section">
            <h1>${section.title}</h1>
            ${this.formatTextAsHTML(section.content)}

            ${section.subsections ? section.subsections.map(subsection => `
                <div class="question-section">
                    <h3>${subsection.title}</h3>
                    ${this.formatTextAsHTML(subsection.content)}
                </div>
            `).join('') : ''}
        </div>
    `).join('')}

    <!-- Compliance Matrix -->
    <div class="section">
        <h1>Compliance Matrix</h1>
        <table class="compliance-table">
            <thead>
                <tr>
                    <th>Requirement</th>
                    <th>Response Summary</th>
                    <th>Compliance Status</th>
                </tr>
            </thead>
            <tbody>
                ${document.complianceMatrix.map(item => `
                    <tr>
                        <td>${item.requirement}</td>
                        <td>${item.response}</td>
                        <td>${item.status}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    <!-- Appendices -->
    ${document.appendices.map(appendix => `
        <div class="section">
            <h1>${appendix.title}</h1>
            ${this.formatTextAsHTML(appendix.content)}
        </div>
    `).join('')}

    <div class="footer">
        ${document.title} | Generated on ${document.metadata.generatedDate} | Page <span id="page-number"></span>
    </div>
</body>
</html>`;

    return html;
  }

  /**
   * Format plain text to HTML with proper paragraph and list handling
   */
  private formatTextAsHTML(text: string): string {
    if (!text) return '';

    return text
      .split('\n\n')
      .map(paragraph => {
        if (paragraph.trim().startsWith('•')) {
          // Handle bullet lists
          const items = paragraph.split('\n')
            .filter(line => line.trim())
            .map(line => `<li>${line.replace(/^•\s*/, '').trim()}</li>`)
            .join('');
          return `<ul>${items}</ul>`;
        } else if (/^\d+\./.test(paragraph.trim())) {
          // Handle numbered lists
          const items = paragraph.split('\n')
            .filter(line => line.trim())
            .map(line => `<li>${line.replace(/^\d+\.\s*/, '').trim()}</li>`)
            .join('');
          return `<ol>${items}</ol>`;
        } else {
          // Regular paragraph
          return `<p>${paragraph.trim()}</p>`;
        }
      })
      .join('');
  }
}

export const documentFormatter = new DocumentFormattingService();