---
**HOW TO USE THIS FILE:**
1. When starting a new session with Claude/Claude Code, include this file
2. Reference specific sections when asking for help (e.g., "See Technical Stack section")
3. Update this file when major changes are made to the project
4. This is your single source of truth for AI assistance on this project

**Last Updated:** 2025-01-05
---

# Claude Instructions for Zenloop RFP Generator

## Project Context

### What This Application Does
The **Zenloop RFP Generator** is an AI-powered application designed to help Zenloop's sales and customer success teams analyze RFP (Request for Proposal) documents and generate high-quality, company-specific responses. The application uses RAG (Retrieval-Augmented Generation) to incorporate actual Zenloop company knowledge into responses.

### Target Users
- Zenloop sales team members responding to RFPs
- Customer success teams handling RFI/RFP requests
- Consultants preparing proposal documents

### Current Development Stage
- **Stage**: Production-ready MVP with advanced features
- **Status**: Fully functional with RAG capabilities, document management, and multi-step workflow
- **Deployment**: Configured for Vercel deployment (see vercel.json)

### Core Business Value Proposition
1. **Speed**: Reduce RFP response time from days to hours
2. **Accuracy**: Use actual Zenloop data instead of generic content
3. **Consistency**: Maintain brand voice and messaging across all responses
4. **Intelligence**: Expert-level RFP analysis mimicking McKinsey/Accenture quality
5. **Knowledge Retention**: Build a searchable knowledge base of company documents

---

## Technology Stack

### Frontend Framework
- **React 18.2.0** with TypeScript
- **Vite 5.4.1** for build tooling and dev server
- **React Router DOM 6.21.3** for client-side routing

### UI Component Library
- **shadcn/ui** - Headless, accessible components built on Radix UI
- **Radix UI** primitives for accessibility-first components
- **Tailwind CSS 3.4.11** with custom configuration
- **Lucide React** for icons
- **next-themes** for dark mode support (configured but not fully implemented)

### State Management
- **@tanstack/react-query 5.17.9** for server state management
- **React hooks** for local component state
- No global state management library (Redux, Zustand, etc.) - state is managed through props and composition

### AI/LLM Integration
- **OpenAI API** (gpt-4-turbo-preview default model)
- **Streaming responses** for real-time content generation
- **Custom prompt engineering** with Zenloop-specific context
- **RAG implementation** using embeddings (ada-002 model)

### Database/Storage
- **Supabase** for backend storage
- **pgvector** extension for vector similarity search
- **Vector embeddings** stored with 1536 dimensions (OpenAI ada-002)

### Document Processing
- **mammoth** (1.10.0) for DOCX parsing
- **pdfjs-dist** (5.4.149) for PDF text extraction
- **docx** (9.5.1) for document generation/export
- **jspdf** (3.0.2) for PDF generation
- **file-saver** (2.0.5) for file downloads

### Form Management
- **react-hook-form** (7.53.0)
- **zod** (3.22.4) for schema validation
- **@hookform/resolvers** for form validation

### Key Dependencies
- **date-fns** for date formatting
- **recharts** for data visualization
- **sonner** for toast notifications
- **class-variance-authority** and **clsx** for conditional styling

---

## Project Structure

```
zenrfpv2-main/
├── src/
│   ├── components/           # React components
│   │   ├── ui/              # shadcn/ui base components (51 files)
│   │   ├── rfp-workflow/    # Workflow-specific components
│   │   ├── UnifiedRFPWorkflow.tsx        # Main app entry component
│   │   ├── ProfessionalRFPWorkflow.tsx   # Core workflow orchestrator
│   │   ├── KnowledgeBase.tsx             # Document management UI
│   │   ├── RFPAnalyzer.tsx               # AI analysis display
│   │   ├── RFPUploader.tsx               # File upload interface
│   │   ├── ResponseGenerator.tsx         # Response generation UI
│   │   ├── CompanyDocuments.tsx          # Company doc management
│   │   └── [other components]            # Various feature components
│   │
│   ├── lib/                  # Core business logic
│   │   ├── services/        # Service layer (23 files)
│   │   │   ├── openai-service.ts              # OpenAI API integration
│   │   │   ├── rag-enhanced-openai-service.ts # RAG-powered generation
│   │   │   ├── document-analyzer.ts           # RFP analysis logic
│   │   │   ├── embedding-service.ts           # Vector embeddings
│   │   │   ├── enhanced-document-processor.ts # Document processing pipeline
│   │   │   ├── text-chunker.ts               # Document chunking
│   │   │   ├── file-processor.ts             # File parsing (PDF/DOCX/TXT)
│   │   │   ├── supabase-service.ts           # Database operations
│   │   │   ├── knowledge-ingestion.ts        # Knowledge base ingestion
│   │   │   ├── zenloop-consultant-prompts.ts # Zenloop-specific prompts
│   │   │   ├── zenloop-competitive-intelligence.ts
│   │   │   └── [other services]
│   │   │
│   │   ├── config/          # Configuration management
│   │   │   ├── api-config.ts           # Central config with validation
│   │   │   ├── validate-config.ts      # Config validation utilities
│   │   │   └── index.ts                # Config exports
│   │   │
│   │   ├── database/        # Database schemas
│   │   │   ├── schema.sql             # Main database schema
│   │   │   └── vector-schema.sql      # pgvector setup
│   │   │
│   │   ├── types/           # TypeScript type definitions
│   │   ├── utils/           # Utility functions
│   │   └── utils.ts         # Common utilities
│   │
│   ├── hooks/               # Custom React hooks (7 files)
│   │   ├── useRFPAnalysis.tsx
│   │   ├── useQuestionExtraction.tsx
│   │   └── [other hooks]
│   │
│   ├── pages/               # Route pages
│   │   ├── Index.tsx
│   │   └── NotFound.tsx
│   │
│   ├── App.tsx              # React Router setup
│   ├── main.tsx             # React entry point
│   ├── App.css              # Global styles
│   └── index.css            # Tailwind directives
│
├── public/                  # Static assets
├── attached_assets/         # Project assets and resources
├── sample-zenloop-documents/ # Sample company documents
├── .env.example             # Environment variable template
├── package.json             # Dependencies and scripts
├── vite.config.ts           # Vite configuration
├── tailwind.config.ts       # Tailwind CSS configuration
├── tsconfig.json            # TypeScript configuration
├── vercel.json              # Vercel deployment config
│
├── RAG_SETUP_GUIDE.md       # RAG implementation guide
├── AI_DOCUMENT_ANALYSIS.md  # AI analysis feature docs
├── SYSTEM_PROMPT_UPDATE.md  # Prompt engineering docs
├── DOCUMENT_INTEGRATION_GUIDE.md # Document management guide
├── VERCEL_DEPLOYMENT_GUIDE.md    # Deployment instructions
└── CLAUDE.md                # This file
```

### Key Directory Purposes

**`src/components/`**
- **ui/**: Shadcn/ui components (buttons, cards, forms, etc.) - DO NOT modify these directly
- **rfp-workflow/**: Workflow step components (upload, analyze, generate, review, export)
- Root level: Feature components and main workflow orchestrators

**`src/lib/services/`**
- Core business logic and external API integrations
- Each service is a singleton or class-based service
- Services handle: OpenAI calls, document processing, embeddings, database operations

**`src/lib/config/`**
- Centralized configuration with Zod validation
- Environment variable management with fallbacks
- Feature flags and API configuration

**`src/hooks/`**
- Custom React hooks for data fetching and state management
- Named `use*` following React conventions

---

## Core Functionalities

### 1. RFP Document Upload

**Supported Formats:**
- PDF (via pdfjs-dist)
- DOCX (via mammoth)
- TXT (plain text)

**File Size Limitations:**
- Maximum: 10MB per file
- Handled in: `src/lib/services/file-processor.ts`

**Processing Pipeline:**
1. File selection via drag-and-drop or click
2. MIME type validation
3. Content extraction based on file type
4. Text normalization and cleaning
5. Store in project state for analysis

**Location:** `src/components/RFPUploader.tsx`, `src/components/rfp-workflow/RFPUploadWizard.tsx`

### 2. RAG Implementation

**Document Indexing:**
1. Document uploaded to knowledge base (`/knowledge-base` route)
2. Text extracted and chunked into ~500-token segments with 50-token overlap
3. Each chunk processed through OpenAI ada-002 to generate 1536-dimension embeddings
4. Embeddings stored in Supabase with pgvector extension
5. Metadata (category, tags, description) indexed for filtering

**Retrieval Mechanism:**
- **Semantic search** using cosine similarity
- **Query process:**
  1. User query/RFP content → embedding generation
  2. Vector similarity search in Supabase (pgvector)
  3. Filter by similarity threshold (default: 0.7)
  4. Return top N matching chunks (default: 10)
  5. Chunks included in prompt context

**Key Files:**
- `src/lib/services/embedding-service.ts` - Embedding generation
- `src/lib/services/enhanced-document-processor.ts` - Document chunking and processing
- `src/lib/services/text-chunker.ts` - Intelligent text chunking
- `src/lib/database/vector-schema.sql` - Database schema for vectors

### 3. Response Generation

**LLM Integration:**
- **Service:** `src/lib/services/openai-service.ts`
- **RAG Version:** `src/lib/services/rag-enhanced-openai-service.ts`
- **Model:** gpt-4-turbo-preview (configurable)
- **Streaming:** Real-time content streaming with chunk callbacks
- **System Prompt:** Zenloop consultant persona with 25+ years CX experience

**Prompt Template Structure:**
```typescript
{
  systemPrompt: "You are Sarah Chen, Zenloop consultant...",
  userPrompt: `
    Section Type: {sectionType}
    RFP Content: {rfpContent}
    Company Profile: {companyProfile}
    Requirements: {requirements}
    Retrieved Knowledge: {zenloopKnowledge}
  `
}
```

**Prompt Templates Location:**
- `src/lib/services/openai-service.ts` - Section templates (lines 356-438)
- `src/lib/services/zenloop-consultant-prompts.ts` - Zenloop-specific prompts

**Output Formatting:**
- Markdown format returned from API
- Rendered in UI with proper formatting
- Editable in review step

### 4. Document Analysis

**Analysis Capabilities:**
The AI analyzer extracts comprehensive intelligence from RFPs:

1. **Critical Requirements Matrix**
   - Mandatory (MUST have)
   - Desired (SHOULD have)
   - Optional (NICE to have)
   - Hidden (IMPLIED requirements)

2. **Evaluation Criteria Decoder**
   - Scoring methodology with weights
   - Decision-maker priorities
   - Budget indicators
   - Risk factors

3. **Strategic Intelligence**
   - Incumbent vendor analysis
   - Political landscape
   - Timeline pressures
   - Competitive positioning

4. **Win Theme Identification**
   - Primary value drivers
   - Pain points to address
   - Key differentiators
   - Required proof points

5. **Red Flags & Risks**
   - Unrealistic requirements
   - Conflicting specs
   - Information gaps
   - Potential deal breakers

**Confidence Scoring:**
- Each finding includes confidence score (0.0-1.0)
- Based on explicit vs. inferred information
- Displayed throughout UI

**Implementation:**
- `src/lib/services/document-analyzer.ts` - Analysis logic
- `src/components/RFPAnalyzer.tsx` - UI display

---

## Coding Conventions

### Naming Conventions

**Files:**
- Components: `PascalCase.tsx` (e.g., `RFPUploader.tsx`)
- Services: `kebab-case.ts` (e.g., `openai-service.ts`)
- Utilities: `kebab-case.ts` (e.g., `text-chunker.ts`)
- Types: `kebab-case.ts` or inline in component files

**Components:**
- React components: `PascalCase` (e.g., `RFPAnalysisStep`)
- Props interfaces: `ComponentNameProps` (e.g., `RFPAnalysisStepProps`)

**Functions:**
- camelCase for functions (e.g., `analyzeDocument`, `generateResponse`)
- Async functions: prefix with `async` keyword, not in name

**Variables:**
- camelCase for local variables
- SCREAMING_SNAKE_CASE for constants (e.g., `MAX_FILE_SIZE`)

**Services:**
- Singleton pattern: lowercase export (e.g., `export const openAIService`)
- Class exports: PascalCase (e.g., `export class OpenAIService`)

### State Management Patterns

**Local State:**
```typescript
// Use useState for component-local state
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
```

**Server State:**
```typescript
// Use React Query for API data
const { data, isLoading, error } = useQuery({
  queryKey: ['documents'],
  queryFn: fetchDocuments
});
```

**Prop Drilling:**
- Acceptable for 2-3 levels
- Beyond that, consider composition or context (not yet implemented)

**Callbacks:**
```typescript
// Pass callbacks for state updates to parent
interface ComponentProps {
  onComplete: (data: ResultData) => void;
  onError: (error: string) => void;
}
```

### Error Handling

**API Errors:**
```typescript
try {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  // Process response
} catch (error) {
  const message = error instanceof Error ? error.message : 'Unknown error';
  console.error('Operation failed:', message);
  onError?.(message);
  throw error; // Re-throw if parent needs to handle
}
```

**Service Layer:**
- Always return typed errors
- Log errors to console with context
- Provide user-friendly error messages
- Never expose API keys or sensitive data in errors

**UI Layer:**
```typescript
// Display errors in UI
{error && (
  <Alert variant="destructive">
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>Error</AlertTitle>
    <AlertDescription>{error}</AlertDescription>
  </Alert>
)}
```

### Logging Standards

**Console Logs:**
- Development: Use `console.log` for debugging
- Warnings: Use `console.warn` for recoverable issues
- Errors: Use `console.error` with context

**Example:**
```typescript
console.log('🎭 Using demo configuration');
console.warn('Failed to retrieve knowledge:', error);
console.error('Document analysis failed:', error);
```

**Remove before production:**
- Debug console.logs should be removed
- Keep warnings and errors for troubleshooting

### Comment Style

**When to Comment:**
- Complex business logic
- Non-obvious algorithm choices
- API integration quirks
- Temporary workarounds (with TODO)

**When NOT to Comment:**
- Self-explanatory code
- Type definitions (types are self-documenting)
- Simple variable assignments

**Style:**
```typescript
// Single-line for brief explanations
// Prefer writing self-documenting code over comments

/**
 * Multi-line for complex functions
 * Explain the "why", not the "what"
 */

// TODO: Description of what needs to be done
// FIXME: Description of the bug
```

---

## Common Development Tasks

### Adding a New Feature

**1. Identify Component Location**
- Reusable UI component → `src/components/`
- Workflow step → `src/components/rfp-workflow/`
- Business logic → `src/lib/services/`

**2. Create Component Structure**
```typescript
// src/components/NewFeature.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

interface NewFeatureProps {
  onComplete: (data: any) => void;
  onError: (error: string) => void;
}

export const NewFeature: React.FC<NewFeatureProps> = ({ onComplete, onError }) => {
  const [state, setState] = useState<any>(null);

  const handleAction = async () => {
    try {
      // Implementation
      onComplete(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      onError(message);
    }
  };

  return (
    <div>
      {/* UI implementation */}
    </div>
  );
};
```

**3. Integration**
- Add route in `src/App.tsx` if needed
- Import and use in parent component
- Pass required callbacks and data

**4. Testing**
- Manual testing in browser
- Test error states
- Test with various inputs

### Debugging Issues

**Common Error Patterns:**

1. **"Missing environment variable"**
   - Check `.env` file exists (copy from `.env.example`)
   - Verify all VITE_ prefixed variables are set
   - Restart dev server after .env changes

2. **"OpenAI API error: 401"**
   - Invalid API key
   - Check `VITE_OPENAI_API_KEY` in .env
   - Verify key has no extra spaces or quotes

3. **"Supabase connection failed"**
   - Check `VITE_SUPABASE_URL` and keys
   - Verify Supabase project is active
   - Run vector-schema.sql if RAG not working

4. **"Component not rendering"**
   - Check browser console for errors
   - Verify imports are correct
   - Check conditional rendering logic

5. **"Blank page on deployment"**
   - Environment variables not set in Vercel
   - Check build logs for errors
   - Verify `vercel.json` rewrite rules

**Where to Find Logs:**
- Browser console (F12 → Console tab)
- Network tab for API calls
- Vercel dashboard for deployment logs

**Debug Mode:**
- Configuration status logged on app startup (see `src/main.tsx:7`)
- Check console for "🎭 Using demo configuration" messages

### Performance Optimization

**Current Bottlenecks:**
1. Large RFP document parsing (PDF/DOCX)
2. Embedding generation for knowledge base (rate limited by OpenAI)
3. Streaming response rendering (minor)

**Optimization Strategies:**

1. **Document Processing:**
   - Process in chunks to avoid blocking UI
   - Show progress indicators
   - Consider Web Workers for parsing (not implemented)

2. **Embedding Generation:**
   - Batch chunk processing
   - Cache embeddings
   - Show progress during upload

3. **Response Generation:**
   - Already optimized with streaming
   - Chunk-by-chunk rendering
   - Cancel capability implemented

4. **React Rendering:**
   - Avoid unnecessary re-renders with `useCallback` and `useMemo`
   - Lazy load heavy components (some implemented)

---

## API & Integration Points

### Internal API Endpoints

**This is a frontend-only application** - no backend API server.

**Services communicate directly with:**
- OpenAI API (api.openai.com)
- Supabase API (your-project.supabase.co)

### External API Integrations

#### OpenAI API

**Base URL:** `https://api.openai.com/v1/`

**Endpoints Used:**
- `/chat/completions` - Text generation
- `/embeddings` - Vector embeddings (ada-002)

**Authentication:**
```typescript
headers: {
  'Authorization': `Bearer ${VITE_OPENAI_API_KEY}`,
  'OpenAI-Organization': VITE_OPENAI_ORGANIZATION // optional
}
```

**Rate Limiting:**
- Tier-based (depends on OpenAI account)
- Implement client-side rate limiting in `api-config.ts`
- Handle 429 errors with exponential backoff

**Cost Considerations:**
- gpt-4-turbo: ~$0.01/1K input tokens, ~$0.03/1K output tokens
- ada-002 embeddings: ~$0.0001/1K tokens
- Monitor usage in OpenAI dashboard

#### Supabase API

**Base URL:** Configured in `VITE_SUPABASE_URL`

**Key Operations:**
- Document storage (documents table)
- Vector embeddings (document_embeddings table)
- Semantic search (match_documents function)

**Authentication:**
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY // or SERVICE_ROLE_KEY for admin operations
);
```

**Row Level Security (RLS):**
- Currently permissive (all CRUD allowed)
- **TODO:** Implement user-based RLS policies

### Authentication

**Current State:** No authentication implemented

**Planned:**
- Supabase Auth for user management
- Row-level security for multi-tenant support
- Email/password or OAuth providers

---

## Known Issues & Workarounds

### Known Issues

1. **PDF Parsing Quality**
   - **Issue:** Some complex PDFs with multiple columns or tables parse incorrectly
   - **Workaround:** Convert to DOCX or manually paste text
   - **Priority:** Medium
   - **File:** `src/lib/services/file-processor.ts`

2. **Embedding Generation Speed**
   - **Issue:** Large documents take several minutes to process
   - **Workaround:** Upload smaller documents or be patient
   - **Priority:** Low (inherent to API)
   - **File:** `src/lib/services/embedding-service.ts`

3. **No Multi-User Support**
   - **Issue:** All data stored client-side or in shared database without auth
   - **Workaround:** None - single user or trust-based sharing
   - **Priority:** High (for production)
   - **Files:** Database schema, authentication layer

4. **Streaming Response Interruptions**
   - **Issue:** If connection drops, response generation stops without recovery
   - **Workaround:** Retry button after connection restored
   - **Priority:** Medium
   - **File:** `src/lib/services/openai-service.ts`

5. **Dark Mode Incomplete**
   - **Issue:** next-themes installed but dark mode not fully styled
   - **Workaround:** Use light mode only
   - **Priority:** Low (cosmetic)
   - **Files:** Various component styling

### Technical Debt

1. **No automated testing**
   - No Jest, Vitest, or Playwright tests
   - Manual testing only

2. **Prop drilling in workflow**
   - Deep prop passing through workflow steps
   - Consider Context API or state management

3. **Mock data in demo mode**
   - Services use mock data when API keys missing
   - Can be confusing for new developers

4. **Inconsistent error handling**
   - Some services throw, some return errors
   - Standardize error handling pattern

5. **No caching layer**
   - API calls not cached
   - Consider React Query caching or localStorage

---

## Testing Approach

### How to Run Tests

**Current State:** No automated test suite configured

**To Add Testing:**
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

### Test File Naming

**When tests are added:**
- Component tests: `ComponentName.test.tsx`
- Service tests: `service-name.test.ts`
- Integration tests: `feature-name.integration.test.ts`

### Critical User Paths to Test

1. **RFP Upload → Analysis → Response**
   - Upload various file types (PDF, DOCX, TXT)
   - Verify analysis extracts requirements
   - Generate at least one response section

2. **Knowledge Base Management**
   - Upload documents
   - Search documents
   - Retrieve relevant content for RFP

3. **Response Editing & Export**
   - Edit generated responses
   - Export to Word document
   - Export to PDF

4. **Error Handling**
   - Invalid file types
   - Missing API keys
   - Network errors during generation

### Mock Data Location

**Mock data defined in services:**
- `src/lib/services/document-analyzer.ts` - Mock analysis results
- `src/lib/services/openai-service.ts` - Mock generation (when no API key)

**Sample documents:**
- `sample-zenloop-documents/` - Example company documents
- `test-document.txt`, `test-rfp-zenloop.txt` - Test RFPs

---

## Deployment & Environment

### Environment Variables Required

**OpenAI (Required for AI features):**
```bash
VITE_OPENAI_API_KEY=sk-...          # Required
VITE_OPENAI_ORGANIZATION=org-...    # Optional
VITE_OPENAI_MODEL=gpt-4-turbo-preview
VITE_OPENAI_MAX_TOKENS=4000
VITE_OPENAI_TEMPERATURE=7           # Note: Divided by 10 in code
```

**Supabase (Required for RAG/Knowledge Base):**
```bash
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

**Optional Configuration:**
```bash
VITE_API_BASE_URL=http://localhost:3000/api
VITE_API_TIMEOUT=30000
VITE_ENABLE_REAL_TIME_COLLABORATION=false
VITE_ENABLE_ANALYTICS=true
```

### Build Process

**Development:**
```bash
npm install
npm run dev          # Starts Vite dev server on http://localhost:5173
```

**Production Build:**
```bash
npm run build        # Output to dist/
npm run preview      # Preview production build locally
```

**Build Mode:**
```bash
npm run build:dev    # Development mode build
```

### Deployment Targets

**Vercel (Recommended):**
1. Connect GitHub repository
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main

**Configuration:**
- `vercel.json` - SPA rewrite rules for React Router
- Output directory: `dist/`
- Build command: `npm run build`

**Other Platforms:**
- Any static hosting (Netlify, Cloudflare Pages, AWS S3+CloudFront)
- Requires SPA rewrite for client-side routing
- Serve `dist/` directory after build

### CI/CD Pipeline

**Current State:** No automated CI/CD configured

**Recommended Setup:**
- GitHub Actions for automated builds
- Run linter and type checks
- Deploy to Vercel on merge to main

---

## Business Logic & Domain Knowledge

### RFP Terminology

- **RFP**: Request for Proposal - formal document requesting vendor proposals
- **RFI**: Request for Information - preliminary information gathering
- **RFQ**: Request for Quotation - focused on pricing
- **SOW**: Statement of Work - project scope definition
- **MSA**: Master Service Agreement - legal framework
- **Incumbent**: Current vendor/provider serving the client

### RFP Components

**Common RFP Sections:**
1. Executive Summary
2. Company Overview/Background
3. Technical Approach/Methodology
4. Project Timeline/Milestones
5. Team Structure/Qualifications
6. Pricing/Cost Breakdown
7. References/Case Studies
8. Compliance/Certifications
9. Terms & Conditions
10. Appendices

**Evaluation Criteria:**
- **Technical capability** (30-40%)
- **Experience and qualifications** (20-30%)
- **Cost/pricing** (20-30%)
- **References and past performance** (10-20%)
- **Compliance** (pass/fail)

### Zenloop-Specific Context

**What Zenloop Does:**
- Customer Experience Management (CEM) platform
- Net Promoter Score (NPS) tracking and analytics
- Customer feedback collection and analysis
- CX insights and actionable recommendations

**Zenloop Value Propositions:**
1. **Comprehensive CX Platform** - End-to-end feedback management
2. **AI-Powered Insights** - Automated sentiment analysis and trend detection
3. **Integration Ecosystem** - Connects with major CRM, helpdesk, and marketing tools
4. **Enterprise-Grade Security** - GDPR compliant, SOC 2 certified
5. **Proven ROI** - Average 23% increase in NPS, 30% reduction in churn

**Key Differentiators:**
- **Closed-loop feedback** system
- **Real-time alerts** for detractors
- **Multi-channel** feedback collection
- **Customizable** dashboards and reports
- **Expert consultation** included with enterprise plans

**Target Industries:**
- E-commerce
- SaaS/Technology
- Financial services
- Healthcare
- Hospitality
- Retail

**Typical Customer Profile:**
- Mid-market to enterprise (100-10,000+ employees)
- Existing NPS program or CX initiative
- Multiple customer touchpoints
- Data-driven decision making culture

### Response Quality Criteria

**Zenloop Response Standards:**
1. **Professional Tone** - Consultative, not salesy
2. **Data-Driven** - Include metrics, case studies, proof points
3. **Customer-Centric** - Focus on client's needs and outcomes
4. **Comprehensive** - Address all requirements explicitly
5. **Compliant** - Follow RFP format and instructions precisely

**Red Flags to Avoid:**
- Generic, templated content
- Missing requirement responses
- Unsupported claims
- Pricing that doesn't match requirements
- Ignoring compliance requests

---

## UI/UX Guidelines

### Design Principles

1. **Clarity Over Cleverness** - Clear, straightforward UI
2. **Progressive Disclosure** - Show complexity only when needed
3. **Accessibility First** - Radix UI primitives ensure accessibility
4. **Responsive Design** - Mobile-friendly (though primarily desktop tool)
5. **Feedback & Affordance** - Loading states, progress indicators, clear CTAs

### Component Styling Approach

**Tailwind Utility Classes:**
```tsx
<div className="bg-white rounded-lg shadow-sm p-6">
  <h2 className="text-xl font-semibold mb-4">Title</h2>
</div>
```

**shadcn/ui Components:**
```tsx
import { Button } from '@/components/ui/button';

<Button variant="default" size="lg">
  Generate Response
</Button>
```

**Variants Available:**
- Button: default, destructive, outline, secondary, ghost, link
- Card: default (see shadcn/ui docs)
- Alert: default, destructive

### Responsive Design Breakpoints

**Tailwind Defaults:**
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

**Usage:**
```tsx
<div className="w-full md:w-1/2 lg:w-1/3">
  {/* Responsive width */}
</div>
```

### Accessibility Requirements

**All Components Must:**
1. Support keyboard navigation
2. Include ARIA labels where needed
3. Maintain color contrast ratios (WCAG AA)
4. Support screen readers
5. Show focus states

**Example:**
```tsx
<button
  aria-label="Upload RFP document"
  aria-describedby="upload-help-text"
  className="focus:ring-2 focus:ring-primary"
>
  Upload
</button>
```

### Loading States & Error Handling

**Loading State Pattern:**
```tsx
{isLoading && (
  <div className="flex items-center gap-2">
    <Loader2 className="h-4 w-4 animate-spin" />
    <span>Processing...</span>
  </div>
)}
```

**Progress Indicators:**
```tsx
<Progress value={progress} className="w-full" />
<p className="text-sm text-muted-foreground">{progress}% complete</p>
```

**Error Display:**
```tsx
<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>{errorMessage}</AlertDescription>
</Alert>
```

### Toast/Notification Patterns

**Using Sonner (preferred):**
```tsx
import { toast } from 'sonner';

toast.success('Document uploaded successfully');
toast.error('Failed to generate response');
toast.loading('Analyzing document...');
```

**Using shadcn Toast:**
```tsx
import { useToast } from '@/components/ui/use-toast';

const { toast } = useToast();

toast({
  title: "Success",
  description: "Your response has been generated.",
  variant: "default" // or "destructive"
});
```

---

## Security Considerations

### Sensitive Data Handling

**API Keys:**
- **NEVER** commit `.env` to git
- Store in environment variables only
- Use Vite's `import.meta.env` for access
- Prefix with `VITE_` for client-side access

**RFP Content:**
- May contain confidential client information
- Not stored persistently (unless in knowledge base)
- Transmitted only to OpenAI (check their data policy)
- Consider adding encryption for local storage

**Company Documents:**
- Stored in Supabase database
- Implement RLS policies for multi-user access
- Consider encryption at rest for sensitive docs

### API Key Management

**Development:**
```bash
# .env (local only)
VITE_OPENAI_API_KEY=sk-...
```

**Production:**
- Set in Vercel environment variables
- Never expose in client-side code (unavoidable for OpenAI)
- Consider proxy server for API calls (future enhancement)

**Best Practices:**
- Rotate keys regularly
- Use separate keys for dev/prod
- Monitor usage in OpenAI dashboard
- Set up usage limits

### File Upload Security

**Validation:**
```typescript
// File type validation
const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
if (!allowedTypes.includes(file.type)) {
  throw new Error('Invalid file type');
}

// File size validation
const MAX_SIZE = 10 * 1024 * 1024; // 10MB
if (file.size > MAX_SIZE) {
  throw new Error('File too large');
}
```

**Sanitization:**
- Text content is extracted, not executed
- No HTML rendering from uploaded files
- File content not directly rendered in DOM

### Data Sanitization

**User Input:**
- Always validate and sanitize user inputs
- Use Zod schemas for validation
- Escape special characters in search queries

**OpenAI Responses:**
- Markdown is rendered (safe via markdown library)
- No eval() or dangerous operations on AI output
- Display as read-only or in controlled editor

---

## Performance Targets

### Page Load Time
- **Target:** < 2 seconds for initial load
- **Current:** ~1.5 seconds (without large RFP)
- **Bottlenecks:** None significant

### File Processing Time
- **PDF (1MB):** 2-5 seconds
- **DOCX (1MB):** 1-3 seconds
- **TXT:** < 1 second

### RFP Analysis Time
- **Target:** < 30 seconds for comprehensive analysis
- **Current:** 10-20 seconds (depends on RFP length)
- **Dependent on:** OpenAI API response time

### Response Generation Time
- **Target:** Real-time streaming (< 30 seconds total)
- **Current:** 15-30 seconds per section (streaming)
- **Dependent on:** OpenAI API, response length

### Memory Usage Constraints
- **Browser:** < 500MB for typical session
- **Large RFP:** May spike to 1GB during PDF parsing
- **Optimization:** Process in chunks, release memory

### Concurrent User Handling
- **Current:** Single-user design (no backend)
- **Future:** Multi-user with Supabase scaling
- **Supabase Limits:** Depends on plan (Free: 500MB, Pro: Unlimited)

---

## AI/LLM Prompt Guidelines

### Prompt Template Structure

**System Prompt (Role Definition):**
```typescript
const systemPrompt = `You are Sarah Chen, a Senior Customer Experience Consultant and Zenloop implementation specialist with 25+ years of experience.

Your expertise includes:
- Enterprise CX platform implementations
- NPS and customer feedback programs
- Multi-channel customer experience strategies
- Data-driven CX transformation

When generating responses, you:
1. Position Zenloop as the optimal solution
2. Provide industry insights and best practices
3. Back claims with data and proof points
4. Use the format: Zenloop Solution → Industry Insight → Strategic Recommendation
5. Access Zenloop's knowledge base for specific capabilities`;
```

**User Prompt (Task + Context):**
```typescript
const userPrompt = `
Generate a ${sectionType} section for this RFP response.

## RFP Requirements:
${rfpContent}

## Key Requirements to Address:
${requirements.join('\n')}

## Zenloop Knowledge Base Context:
${retrievedKnowledge.join('\n\n')}

## Instructions:
- Address ALL requirements explicitly
- Use specific Zenloop features and capabilities
- Include relevant metrics and case studies
- Maintain professional, consultative tone
- Structure with clear headings and bullet points
`;
```

### Variables and Placeholders

**Standard Placeholders:**
- `{sectionType}` - Type of response section (e.g., "Executive Summary")
- `{rfpContent}` - Full or partial RFP text
- `{requirements}` - Extracted requirement list
- `{constraints}` - Budget, timeline, technical constraints
- `{retrievedKnowledge}` - RAG context from knowledge base
- `{companyProfile}` - Zenloop company information
- `{targetAudience}` - Decision-maker profile

**Implementation:**
```typescript
const buildPrompt = (template: string, context: GenerationContext): string => {
  return template
    .replace('{sectionType}', context.sectionType)
    .replace('{rfpContent}', context.rfpContent)
    .replace('{requirements}', context.requirements.join('\n'));
};
```

### Token Optimization Strategies

1. **Chunk Large Documents**
   - Don't send entire 100-page RFP in one prompt
   - Send relevant sections only

2. **Summarize Context**
   - Use extractive summarization for long requirements
   - RAG retrieval already limits context

3. **Limit Retrieved Context**
   - Default: Top 5 chunks from knowledge base
   - Configurable in `src/lib/services/openai-service.ts:147`

4. **Optimize System Prompt**
   - Current: ~200 tokens
   - Concise but comprehensive

5. **Token Budgets by Section**
   - Executive Summary: 800 tokens
   - Technical Approach: 1200 tokens
   - Pricing: 600 tokens
   - (See `OpenAIService.getSectionTemplates()`)

### Response Parsing Approach

**Streaming:**
```typescript
// Stream parsing
const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value);
  const lines = chunk.split('\n');

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = line.slice(6);
      if (data === '[DONE]') return;

      const parsed = JSON.parse(data);
      const content = parsed.choices?.[0]?.delta?.content;
      if (content) {
        accumulatedContent += content;
        onChunk?.(content); // Real-time UI update
      }
    }
  }
}
```

**Non-Streaming (Analysis):**
```typescript
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  body: JSON.stringify({
    model: 'gpt-4-turbo-preview',
    messages: [...],
    response_format: { type: "json_object" } // For structured output
  })
});

const result = await response.json();
const analysis = JSON.parse(result.choices[0].message.content);
```

---

## Quick Reference Commands

### Development
```bash
npm run dev          # Start dev server (localhost:5173)
npm run build        # Production build
npm run build:dev    # Development mode build
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Environment Setup
```bash
cp .env.example .env                    # Copy environment template
# Edit .env with your actual API keys

npm install                              # Install dependencies
npm run dev                              # Start development
```

### Database Setup (Supabase)
```sql
-- Run in Supabase SQL Editor:
-- 1. Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Run schema.sql
-- (Copy and paste contents of src/lib/database/schema.sql)

-- 3. Run vector-schema.sql
-- (Copy and paste contents of src/lib/database/vector-schema.sql)
```

### Deployment (Vercel)
```bash
# Install Vercel CLI (optional)
npm install -g vercel

# Deploy
vercel

# Or connect GitHub repo in Vercel dashboard for auto-deploy
```

### Troubleshooting
```bash
# Clear build cache
rm -rf dist/ node_modules/.vite

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check configuration
npm run dev
# Look for console logs about configuration status
```

---

## Priority Areas for Improvement

### Current Development Priorities

#### [High Priority] Issues

1. **Multi-User Authentication & RLS**
   - Implement Supabase Auth
   - Set up Row-Level Security policies
   - User session management
   - **Impact:** Required for production multi-tenant use

2. **Automated Testing**
   - Set up Vitest
   - Component tests for critical paths
   - Integration tests for workflows
   - **Impact:** Reduce bugs, enable confident refactoring

3. **Error Recovery in Streaming**
   - Handle connection drops gracefully
   - Resume or retry failed generations
   - Better error messages
   - **Impact:** Improved reliability

4. **PDF Parsing Quality**
   - Improve multi-column layout handling
   - Better table extraction
   - Consider alternative PDF library
   - **Impact:** Higher quality RFP analysis

#### [Medium Priority] Enhancements

1. **Response Versioning**
   - Track edit history
   - Allow rollback to previous versions
   - Compare versions side-by-side
   - **Impact:** Better collaboration and quality control

2. **Batch Document Upload**
   - Upload multiple documents at once
   - Progress tracking for batch operations
   - **Impact:** Faster knowledge base building

3. **Advanced Search Filters**
   - Filter by date, category, tags
   - Sort by relevance or recency
   - **Impact:** Better knowledge retrieval

4. **Export Formatting**
   - Improve Word document formatting
   - Add PDF export with branding
   - Custom templates
   - **Impact:** Professional-looking outputs

5. **Analytics Dashboard**
   - Track RFP response success rates
   - Time savings metrics
   - Most-used sections
   - **Impact:** Demonstrate ROI

#### [Low Priority] Nice-to-Haves

1. **Dark Mode Completion**
   - Complete dark theme styling
   - Theme toggle in UI
   - **Impact:** Cosmetic, user preference

2. **Collaborative Editing**
   - Real-time collaboration on responses
   - Comments and suggestions
   - **Impact:** Team productivity

3. **AI Training on Feedback**
   - Learn from edited responses
   - Improve prompts based on user edits
   - **Impact:** Better quality over time

4. **Mobile Optimization**
   - Fully responsive design
   - Mobile-specific workflows
   - **Impact:** Accessibility on-the-go

5. **Integrations**
   - Slack notifications
   - Google Drive sync
   - CRM integrations (Salesforce, HubSpot)
   - **Impact:** Workflow efficiency

---

## Do's and Don'ts

### DO:

✅ **Maintain TypeScript types**
- Use explicit types for all function parameters and returns
- Define interfaces for complex objects
- Avoid `any` type unless absolutely necessary

✅ **Add error boundaries for new features**
- Wrap async operations in try-catch
- Display user-friendly error messages
- Log errors to console with context

✅ **Use existing component patterns**
- Use shadcn/ui components from `src/components/ui/`
- Follow existing state management patterns (props + callbacks)
- Match existing styling conventions (Tailwind classes)

✅ **Test file upload with various formats**
- Test PDF, DOCX, and TXT files
- Test with different file sizes
- Test error cases (invalid files, too large, etc.)

✅ **Provide user feedback**
- Loading states for async operations
- Progress indicators for long operations
- Toast notifications for success/error
- Clear button states (disabled, loading)

✅ **Follow accessibility guidelines**
- Use semantic HTML
- Add ARIA labels where needed
- Ensure keyboard navigation works
- Maintain color contrast

✅ **Validate configuration**
- Check for required environment variables
- Provide clear error messages when missing
- Use demo mode fallback gracefully

✅ **Document complex logic**
- Add comments for non-obvious code
- Update this CLAUDE.md when making major changes
- Keep README files updated

### DON'T:

❌ **Modify core RAG logic without testing**
- Vector embeddings are critical
- Changes can break semantic search
- Always test with sample documents

❌ **Hardcode API endpoints**
- Use configuration from `src/lib/config/api-config.ts`
- Allow environment variable overrides
- Support demo mode

❌ **Skip loading states for async operations**
- Every API call should show loading state
- Long operations need progress indicators
- User should never wonder if something is happening

❌ **Ignore TypeScript errors**
- Fix all TS errors before committing
- Don't use `@ts-ignore` unless absolutely necessary
- Strong typing prevents runtime errors

❌ **Modify shadcn/ui components directly**
- Components in `src/components/ui/` are generated
- Create wrapper components for customization
- Update via shadcn CLI if needed

❌ **Commit sensitive data**
- Never commit `.env` files
- Don't include API keys in code
- Add secrets to `.gitignore`

❌ **Break the workflow steps**
- Maintain step order: upload → analyze → generate → review → export
- Each step depends on previous step data
- Test full workflow after changes

❌ **Remove error handling**
- Keep try-catch blocks
- Maintain error state management
- Display errors to users appropriately

---

## Context for AI Assistance

### Project Philosophy

- **Stability over Features**: Don't break existing functionality for new features
- **User Experience First**: Clear feedback, intuitive UI, minimal confusion
- **Data Accuracy**: Zenloop-specific information must be accurate and current
- **Performance Matters**: Large RFPs are common, optimize for that

### User Feedback Integration

**Current Feedback Channels:**
- Direct user testing with Zenloop sales team
- Feature requests tracked in project backlog (not in repo)

**Common Feedback:**
- "Need faster document processing" → Optimize parsing
- "Responses are too generic" → Improve RAG retrieval
- "Want to edit responses inline" → Add editing capability (partially implemented)
- "Hard to track multiple RFPs" → Dashboard view implemented

### Future Client-Facing Plans

This application will eventually be offered to Zenloop customers, not just internal team:

**Implications:**
1. **Multi-tenancy required** → User auth and data isolation
2. **White-labeling** → Customizable branding
3. **API limits** → Rate limiting, usage quotas
4. **SLA requirements** → Uptime monitoring, error tracking
5. **Data privacy** → GDPR compliance, data retention policies

**Preparation Needed:**
- Robust authentication system
- Database RLS policies
- Error tracking (Sentry, etc.)
- Usage analytics
- Customer-specific knowledge bases

### Performance with Large RFPs

**Critical Consideration:**
- RFPs can be 50-200 pages
- PDF parsing can take 30-60 seconds
- AI analysis can take 30-60 seconds
- Response generation is 20-40 seconds per section

**Optimizations in Place:**
- Streaming responses for real-time feedback
- Progress indicators throughout
- Chunked processing where possible

**Still Needed:**
- Web Workers for PDF parsing
- Background processing queue
- Caching for repeated analyses

### Zenloop Brand Consistency

**Brand Voice:**
- Professional but approachable
- Data-driven, not salesy
- Consultative expert positioning
- Customer-centric language

**Visual Identity:**
- Clean, modern design
- Primarily uses Zenloop brand colors (not strictly enforced in current UI)
- Professional aesthetics

**Tone in Responses:**
- Confident but not arrogant
- Backed by data and proof points
- Solutions-focused
- Industry expert positioning

---

## When Providing Assistance

### Code Assistance Guidelines

✅ **Be specific about file locations**
```
Good: "Update the generateSection function in src/lib/services/openai-service.ts at line 192"
Bad: "Update the generation function"
```

✅ **Provide complete code blocks**
```typescript
// Complete implementation
const handleUpload = async (file: File) => {
  try {
    const content = await fileProcessor.extractText(file);
    onComplete({ content, fileName: file.name });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    onError(message);
  }
};
```

Not just fragments:
```typescript
// Incomplete
await fileProcessor.extractText(file);
```

✅ **Explain architectural decisions**
```
"We use singleton pattern for services (openAIService) because:
1. Maintains single AbortController for cancellation
2. Reduces memory overhead
3. Simplifies import/usage across components"
```

✅ **Suggest test cases**
```
For this new feature, test:
1. Happy path with valid input
2. Error case with invalid file type
3. Edge case with empty file
4. Error recovery after network failure
```

✅ **Warn about side effects**
```
⚠️ Changing the chunking size in text-chunker.ts will:
1. Affect all existing embeddings (they'll need regeneration)
2. Change search relevance scores
3. Impact token usage and costs
Consider creating a migration script.
```

### Communication Style

**Use clear, actionable language:**
- "Add this function to src/lib/services/document-analyzer.ts"
- "Update the interface in src/types/rfp.ts to include..."
- "Test by uploading a PDF and checking the console for..."

**Provide context for suggestions:**
- "This follows the existing pattern in openai-service.ts"
- "This uses the same error handling as file-processor.ts"
- "This is consistent with how other async operations are handled"

**Reference relevant documentation:**
- "See RAG_SETUP_GUIDE.md for details on embeddings"
- "Refer to the Document Processing section above"
- "Check the Deployment section for environment variables"

---

## Appendix: Key File Reference

### Critical Files for Core Features

**RFP Analysis:**
- `src/lib/services/document-analyzer.ts` - Main analysis logic
- `src/lib/services/rfp-analyzer.ts` - Alternative analyzer
- `src/components/RFPAnalyzer.tsx` - Analysis UI

**Response Generation:**
- `src/lib/services/openai-service.ts` - OpenAI integration
- `src/lib/services/rag-enhanced-openai-service.ts` - RAG version
- `src/lib/services/zenloop-consultant-prompts.ts` - Prompt templates

**Document Processing:**
- `src/lib/services/file-processor.ts` - File parsing
- `src/lib/services/text-chunker.ts` - Text chunking
- `src/lib/services/enhanced-document-processor.ts` - Processing pipeline

**Knowledge Base:**
- `src/components/KnowledgeBase.tsx` - UI
- `src/lib/services/embedding-service.ts` - Embeddings
- `src/lib/services/knowledge-ingestion.ts` - Document ingestion
- `src/lib/database/vector-schema.sql` - Database schema

**Workflow:**
- `src/components/ProfessionalRFPWorkflow.tsx` - Main orchestrator
- `src/components/rfp-workflow/` - Individual step components
- `src/App.tsx` - Routing

**Configuration:**
- `src/lib/config/api-config.ts` - Central configuration
- `.env.example` - Environment variables template
- `vite.config.ts` - Build configuration

---

## Conclusion

This CLAUDE.md file provides comprehensive context for AI assistance on the Zenloop RFP Generator project. When working with Claude/Claude Code:

1. **Reference specific sections** when asking questions
2. **Update this file** when making significant changes
3. **Use it as a shared knowledge base** across development sessions
4. **Suggest improvements** to keep it current and useful

For questions not covered here, refer to:
- `RAG_SETUP_GUIDE.md` for RAG implementation details
- `AI_DOCUMENT_ANALYSIS.md` for analysis feature documentation
- `DOCUMENT_INTEGRATION_GUIDE.md` for document management
- `VERCEL_DEPLOYMENT_GUIDE.md` for deployment instructions

---

**Remember:** This application handles sensitive RFP data and represents the Zenloop brand. Always prioritize:
1. **Data accuracy** - Use real Zenloop information
2. **User experience** - Clear, intuitive workflows
3. **Performance** - Optimize for large documents
4. **Security** - Protect API keys and sensitive data
5. **Brand consistency** - Professional, expert positioning

Happy coding! 🚀
