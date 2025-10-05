-- Vector storage schema for RAG capabilities
-- Run these commands in your Supabase SQL editor

-- Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create document_embeddings table for vector storage
CREATE TABLE IF NOT EXISTS document_embeddings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  content_length INTEGER NOT NULL,
  embedding VECTOR(1536), -- OpenAI ada-002 embeddings are 1536 dimensions
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for vector similarity search
CREATE INDEX IF NOT EXISTS document_embeddings_embedding_idx
ON document_embeddings USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create index for document_id lookups
CREATE INDEX IF NOT EXISTS document_embeddings_document_id_idx
ON document_embeddings(document_id);

-- Create index for chunk_index
CREATE INDEX IF NOT EXISTS document_embeddings_chunk_index_idx
ON document_embeddings(chunk_index);

-- Add RLS policies for security
ALTER TABLE document_embeddings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access embeddings for documents they own
-- Note: Adjust this based on your authentication setup
CREATE POLICY "Users can view their document embeddings" ON document_embeddings
    FOR SELECT USING (true); -- For now, allow all reads - adjust based on your auth

CREATE POLICY "Users can insert their document embeddings" ON document_embeddings
    FOR INSERT WITH CHECK (true); -- For now, allow all inserts - adjust based on your auth

CREATE POLICY "Users can update their document embeddings" ON document_embeddings
    FOR UPDATE USING (true); -- For now, allow all updates - adjust based on your auth

CREATE POLICY "Users can delete their document embeddings" ON document_embeddings
    FOR DELETE USING (true); -- For now, allow all deletes - adjust based on your auth

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE OR REPLACE TRIGGER update_document_embeddings_updated_at
    BEFORE UPDATE ON document_embeddings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function for similarity search
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(1536),
  similarity_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  content text,
  chunk_index int,
  similarity float,
  metadata jsonb
)
LANGUAGE sql STABLE
AS $$
  SELECT
    document_embeddings.id,
    document_embeddings.document_id,
    document_embeddings.content,
    document_embeddings.chunk_index,
    1 - (document_embeddings.embedding <=> query_embedding) AS similarity,
    document_embeddings.metadata
  FROM document_embeddings
  WHERE 1 - (document_embeddings.embedding <=> query_embedding) > similarity_threshold
  ORDER BY document_embeddings.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Add embeddings_generated column to documents table to track processing status
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS embeddings_generated BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS embeddings_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_embedded_at TIMESTAMP WITH TIME ZONE;

-- Comments for documentation
COMMENT ON TABLE document_embeddings IS 'Stores document chunks with vector embeddings for semantic search';
COMMENT ON COLUMN document_embeddings.embedding IS 'OpenAI ada-002 embedding vector (1536 dimensions)';
COMMENT ON COLUMN document_embeddings.chunk_index IS 'Sequential index of chunk within the document';
COMMENT ON COLUMN document_embeddings.content IS 'Text content of the document chunk';
COMMENT ON FUNCTION match_documents IS 'Performs semantic similarity search using cosine similarity';