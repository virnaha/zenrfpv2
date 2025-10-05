# RAG Capabilities Setup Guide

This guide walks you through setting up the enhanced RFP analyzer with RAG (Retrieval-Augmented Generation) capabilities.

## 🎯 What's New

The RFP analyzer now includes:
- **Vector-based document storage** with Supabase + pgvector
- **Intelligent document chunking** with overlap for better context
- **OpenAI embeddings** for semantic search
- **RAG-enhanced response generation** using your company knowledge
- **Knowledge Base management** interface for bulk document upload

## 🚀 Quick Start

### 1. Database Setup (Supabase)

1. **Create a Supabase project:**
   - Go to [supabase.com](https://supabase.com) and create a new project
   - Wait for the project to be ready (takes 2-3 minutes)

2. **Enable pgvector extension:**
   ```sql
   -- Run this in your Supabase SQL Editor
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

3. **Create the vector schema:**
   - Copy the entire contents of `src/lib/database/vector-schema.sql`
   - Paste and run it in your Supabase SQL Editor
   - This creates tables for document embeddings and vector search

4. **Get your Supabase credentials:**
   - Go to Project Settings → API
   - Copy your Project URL and anon/service role keys

### 2. OpenAI API Setup

1. **Get OpenAI API key:**
   - Visit [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
   - Create a new secret key
   - Ensure you have credits for embeddings (ada-002 model costs ~$0.0001/1K tokens)

### 3. Environment Configuration

1. **Copy the environment template:**
   ```bash
   cp .env.example .env
   ```

2. **Fill in your credentials:**
   ```bash
   # Required for RAG capabilities
   VITE_OPENAI_API_KEY=sk-your-actual-openai-key-here
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

   # Optional configurations
   VITE_OPENAI_MODEL=gpt-4-turbo-preview
   VITE_OPENAI_MAX_TOKENS=4000
   VITE_OPENAI_TEMPERATURE=7
   ```

### 4. Install Dependencies

```bash
npm install
```

### 5. Start the Application

```bash
npm run dev
```

## 📚 Using the Knowledge Base

### Accessing the Knowledge Base

Navigate to `/knowledge-base` in your application to access the document management interface.

### Uploading Documents

1. **Supported formats:** PDF, DOCX, TXT
2. **Drag and drop** multiple files or click to select
3. **Fill in metadata:**
   - **Description:** Brief summary of document content
   - **Category:** Choose from predefined categories
   - **Tags:** Comma-separated keywords for better search

### Document Processing Pipeline

When you upload documents, the system:

1. **Extracts text** from PDF/DOCX files
2. **Chunks the content** into ~500-token overlapping segments
3. **Generates embeddings** using OpenAI's ada-002 model
4. **Stores vectors** in Supabase for semantic search
5. **Indexes content** for fast retrieval

### Semantic Search

Use the Search tab to:
- **Query in natural language** ("API integration requirements", "pricing for enterprise clients")
- **Filter by category** to narrow results
- **View similarity scores** and source documents
- **Preview matching content** with context

## 🔧 RAG-Enhanced Response Generation

### How It Works

When generating RFP responses, the system:

1. **Analyzes the RFP** to understand requirements
2. **Searches your knowledge base** for relevant information
3. **Retrieves top matching content** using vector similarity
4. **Enhances prompts** with your specific company data
5. **Generates responses** that include accurate, specific details

### Response Quality Improvements

With RAG enabled, responses include:
- **Specific technical details** from your documentation
- **Accurate pricing information** from your rate cards
- **Real customer case studies** and success metrics
- **Precise feature descriptions** matching your capabilities
- **Company-specific value propositions** and differentiators

### Section Templates with RAG

The system includes optimized templates for:

- **Executive Summary:** Company overview + value proposition
- **Technical Approach:** Architecture + integration details
- **Pricing:** Package options + implementation costs
- **Company Overview:** History + expertise + certifications
- **References:** Case studies + customer testimonials

## 📁 Project Structure

```
src/lib/
├── database/
│   └── vector-schema.sql          # Database setup for pgvector
├── services/
│   ├── text-chunker.ts           # Document chunking logic
│   ├── embedding-service.ts      # OpenAI embeddings integration
│   ├── enhanced-document-processor.ts  # Main RAG processing
│   └── rag-enhanced-openai-service.ts  # RAG-powered generation
└── components/
    └── KnowledgeBase.tsx         # Document management UI
```

## 🎛️ Configuration Options

### Chunking Configuration

Adjust in `ChunkingOptions`:
```typescript
{
  chunkSize: 500,        // Target tokens per chunk
  overlapSize: 50,       // Overlap between chunks
  preserveParagraphs: true,
  preserveSentences: true,
  minChunkSize: 100,     // Minimum viable chunk size
}
```

### Search Parameters

Tune semantic search:
```typescript
{
  limit: 10,             // Max results to return
  similarityThreshold: 0.7,  // Minimum similarity score
  category: 'technical-specs', // Filter by category
}
```

### Generation Settings

Control response quality:
```typescript
{
  maxTokens: 1000,       // Response length limit
  temperature: 0.7,      // Creativity vs consistency
  useRAG: true,          // Enable/disable RAG
  maxChunks: 5,          // Context chunks to include
}
```

## 🔍 Monitoring & Debugging

### Check Service Status

The system provides status checks for:
- **OpenAI API** connection and credits
- **Supabase** database connectivity
- **Vector search** functionality
- **Document processing** pipeline

### Performance Metrics

Monitor:
- **Embedding generation** time and token usage
- **Search response** times and result relevance
- **Document processing** success rates
- **Storage usage** and costs

### Common Issues

1. **"RAG system not configured"**
   - Check your `.env` file has all required variables
   - Verify Supabase project is active

2. **"No relevant documents found"**
   - Upload more diverse content to your knowledge base
   - Try different search terms or lower similarity threshold

3. **"Embedding generation failed"**
   - Check OpenAI API key and billing account
   - Verify you have sufficient credits

4. **Slow document processing**
   - Normal for large documents (few minutes per MB)
   - Processing happens in background, UI remains responsive

## 💡 Best Practices

### Document Preparation

- **Use clear, descriptive filenames**
- **Add meaningful descriptions and tags**
- **Organize by logical categories**
- **Include diverse content types** (technical, business, case studies)
- **Keep documents updated** and remove outdated information

### Optimal Knowledge Base

- **500+ documents** for comprehensive coverage
- **Mix of content types** (specs, case studies, pricing, company info)
- **Regular updates** to maintain accuracy
- **Consistent tagging** for better discoverability
- **Quality over quantity** - well-described, relevant content

### Search Optimization

- **Use natural language** queries instead of keywords
- **Be specific** about what you're looking for
- **Try different phrasings** if initial results aren't relevant
- **Use category filters** to narrow scope
- **Review similarity scores** to gauge result quality

## 🔐 Security & Privacy

### Data Protection

- All documents stored in **your Supabase instance**
- Embeddings are **mathematical representations**, not readable text
- **Row-level security** policies protect your data
- API keys stored **locally** in environment variables

### Access Control

Configure Supabase RLS policies to:
- Restrict access by **user authentication**
- Implement **team-based permissions**
- Control **document visibility** by category
- Audit **access and modifications**

## 🚀 Production Deployment

### Scaling Considerations

- **Supabase Pro** for higher vector search performance
- **OpenAI rate limits** - consider upgrading for high volume
- **CDN** for faster document retrieval
- **Load balancing** for multiple concurrent users

### Cost Optimization

- **Batch process** documents during off-peak hours
- **Monitor embedding** usage and optimize chunk sizes
- **Archive old documents** that aren't frequently accessed
- **Use appropriate** OpenAI model for your use case

## 📞 Support

For issues or questions:
1. Check the **console logs** for detailed error messages
2. Verify **environment variables** are correctly set
3. Test with the **built-in status checks**
4. Review the **Supabase dashboard** for database issues

---

## 🎉 You're Ready!

With RAG capabilities set up, your RFP analyzer will now generate responses that include specific, accurate information from your company's knowledge base. The more quality documents you upload, the better your responses will become!

Navigate to `/knowledge-base` to start building your knowledge repository.