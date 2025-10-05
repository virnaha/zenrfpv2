-- Comprehensive database schema for the intelligent RFP learning system

-- Documents table - stores all documents (RFPs, responses, company docs, etc.)
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('rfp', 'rfp_response', 'technical_doc', 'case_study', 'pricing_sheet', 'compliance_doc', 'company_doc')),
    file_path VARCHAR(500),
    size BIGINT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Knowledge entries table - validated facts extracted from documents
CREATE TABLE IF NOT EXISTS knowledge_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('capability', 'pricing', 'case_study', 'technical_spec', 'compliance', 'differentiator', 'objection_handling')),
    source_documents UUID[] DEFAULT '{}',
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    validation_status VARCHAR(20) DEFAULT 'pending' CHECK (validation_status IN ('validated', 'pending', 'rejected', 'outdated')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    usage_count INTEGER DEFAULT 0,
    last_used TIMESTAMP WITH TIME ZONE
);

-- Question patterns table - common question types and variations
CREATE TABLE IF NOT EXISTS question_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    canonical_form TEXT NOT NULL,
    variations TEXT[] DEFAULT '{}',
    intent VARCHAR(50) NOT NULL CHECK (intent IN ('capability_inquiry', 'pricing_request', 'technical_requirement', 'compliance_check', 'experience_validation', 'timeline_inquiry', 'support_question')),
    industry_frequency JSONB DEFAULT '{}',
    typical_responses TEXT[] DEFAULT '{}',
    winning_response_ids UUID[] DEFAULT '{}',
    complexity_score INTEGER CHECK (complexity_score >= 1 AND complexity_score <= 10),
    keywords TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Winning responses table - successful answer templates
CREATE TABLE IF NOT EXISTS winning_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_pattern_id UUID REFERENCES question_patterns(id) ON DELETE CASCADE,
    response_text TEXT NOT NULL,
    win_rate DECIMAL(3,2) CHECK (win_rate >= 0 AND win_rate <= 1),
    usage_contexts JSONB DEFAULT '{}',
    key_elements TEXT[] DEFAULT '{}',
    supporting_evidence TEXT[] DEFAULT '{}',
    competitive_advantages TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used TIMESTAMP WITH TIME ZONE
);

-- Client profiles table - learned preferences by client/industry
CREATE TABLE IF NOT EXISTS client_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    industry VARCHAR(50) NOT NULL,
    size VARCHAR(20) CHECK (size IN ('enterprise', 'mid_market', 'smb', 'government', 'non_profit')),
    preferences JSONB DEFAULT '{}',
    historical_interactions JSONB DEFAULT '[]',
    decision_makers JSONB DEFAULT '[]',
    competitive_landscape JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RFP analyses table - comprehensive analysis results
CREATE TABLE IF NOT EXISTS rfp_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rfp_document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    analysis_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    similar_rfps JSONB DEFAULT '[]',
    extracted_requirements JSONB DEFAULT '[]',
    risk_assessment JSONB DEFAULT '{}',
    opportunity_score INTEGER CHECK (opportunity_score >= 0 AND opportunity_score <= 100),
    recommended_strategy JSONB DEFAULT '{}',
    knowledge_gaps JSONB DEFAULT '[]',
    competitive_analysis JSONB DEFAULT '{}',
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    processing_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Requirements table - extracted requirements from RFPs
CREATE TABLE IF NOT EXISTS requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rfp_analysis_id UUID REFERENCES rfp_analyses(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('functional', 'technical', 'performance', 'security', 'compliance', 'integration', 'support', 'pricing')),
    criticality VARCHAR(20) CHECK (criticality IN ('must_have', 'should_have', 'nice_to_have', 'unknown')),
    compliance_mandatory BOOLEAN DEFAULT FALSE,
    capability_match JSONB DEFAULT '{}',
    supporting_evidence TEXT[] DEFAULT '{}',
    risk_factors TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Learning feedback table - track performance and improve
CREATE TABLE IF NOT EXISTS learning_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    response_id UUID, -- Can reference winning_responses or other response types
    outcome VARCHAR(20) CHECK (outcome IN ('won', 'lost', 'no_decision', 'pending')),
    feedback_type VARCHAR(30) CHECK (feedback_type IN ('win_loss_analysis', 'user_feedback', 'performance_review', 'automated_analysis')),
    lessons_learned TEXT[] DEFAULT '{}',
    what_worked TEXT[] DEFAULT '{}',
    what_didnt_work TEXT[] DEFAULT '{}',
    recommendations TEXT[] DEFAULT '{}',
    confidence_adjustment DECIMAL(3,2) CHECK (confidence_adjustment >= -1 AND confidence_adjustment <= 1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(255)
);

-- Knowledge relationships table - map relationships between knowledge entries
CREATE TABLE IF NOT EXISTS knowledge_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_entry_id UUID REFERENCES knowledge_entries(id) ON DELETE CASCADE,
    to_entry_id UUID REFERENCES knowledge_entries(id) ON DELETE CASCADE,
    relationship_type VARCHAR(50) NOT NULL CHECK (relationship_type IN ('supports', 'contradicts', 'extends', 'replaces', 'requires', 'related')),
    strength DECIMAL(3,2) CHECK (strength >= 0 AND strength <= 1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(from_entry_id, to_entry_id, relationship_type)
);

-- Search index for full-text search on knowledge entries
CREATE INDEX IF NOT EXISTS idx_knowledge_entries_content_gin ON knowledge_entries USING GIN (to_tsvector('english', content));
CREATE INDEX IF NOT EXISTS idx_documents_content_gin ON documents USING GIN (to_tsvector('english', content));
CREATE INDEX IF NOT EXISTS idx_winning_responses_text_gin ON winning_responses USING GIN (to_tsvector('english', response_text));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type);
CREATE INDEX IF NOT EXISTS idx_documents_metadata_gin ON documents USING GIN (metadata);
CREATE INDEX IF NOT EXISTS idx_knowledge_entries_type ON knowledge_entries(type);
CREATE INDEX IF NOT EXISTS idx_knowledge_entries_confidence ON knowledge_entries(confidence_score);
CREATE INDEX IF NOT EXISTS idx_knowledge_entries_validation ON knowledge_entries(validation_status);
CREATE INDEX IF NOT EXISTS idx_question_patterns_intent ON question_patterns(intent);
CREATE INDEX IF NOT EXISTS idx_winning_responses_win_rate ON winning_responses(win_rate);
CREATE INDEX IF NOT EXISTS idx_client_profiles_industry ON client_profiles(industry);
CREATE INDEX IF NOT EXISTS idx_requirements_category ON requirements(category);
CREATE INDEX IF NOT EXISTS idx_requirements_criticality ON requirements(criticality);
CREATE INDEX IF NOT EXISTS idx_learning_feedback_outcome ON learning_feedback(outcome);
CREATE INDEX IF NOT EXISTS idx_rfp_analyses_opportunity ON rfp_analyses(opportunity_score);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_knowledge_entries_updated_at BEFORE UPDATE ON knowledge_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_question_patterns_updated_at BEFORE UPDATE ON question_patterns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_winning_responses_updated_at BEFORE UPDATE ON winning_responses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_client_profiles_updated_at BEFORE UPDATE ON client_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rfp_analyses_updated_at BEFORE UPDATE ON rfp_analyses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Views for analytics and reporting
CREATE OR REPLACE VIEW knowledge_base_stats AS
SELECT 
    COUNT(*) FILTER (WHERE type = 'capability') AS capability_entries,
    COUNT(*) FILTER (WHERE type = 'pricing') AS pricing_entries,
    COUNT(*) FILTER (WHERE type = 'case_study') AS case_study_entries,
    COUNT(*) FILTER (WHERE type = 'technical_spec') AS technical_entries,
    COUNT(*) FILTER (WHERE type = 'compliance') AS compliance_entries,
    COUNT(*) FILTER (WHERE validation_status = 'validated') AS validated_entries,
    COUNT(*) FILTER (WHERE validation_status = 'pending') AS pending_entries,
    AVG(confidence_score) AS avg_confidence_score,
    MAX(updated_at) AS last_updated
FROM knowledge_entries;

CREATE OR REPLACE VIEW performance_metrics AS
SELECT 
    COUNT(*) AS total_analyses,
    AVG(opportunity_score) AS avg_opportunity_score,
    AVG(confidence_score) AS avg_analysis_confidence,
    AVG(processing_time_ms) AS avg_processing_time_ms,
    COUNT(*) FILTER (WHERE opportunity_score >= 75) AS high_opportunity_count,
    COUNT(*) FILTER (WHERE confidence_score >= 0.8) AS high_confidence_count
FROM rfp_analyses
WHERE created_at >= NOW() - INTERVAL '30 days';

CREATE OR REPLACE VIEW win_rate_by_pattern AS
SELECT 
    qp.canonical_form,
    qp.intent,
    COUNT(wr.id) AS total_responses,
    AVG(wr.win_rate) AS avg_win_rate,
    MAX(wr.last_used) AS last_used
FROM question_patterns qp
LEFT JOIN winning_responses wr ON qp.id = wr.question_pattern_id
GROUP BY qp.id, qp.canonical_form, qp.intent
ORDER BY avg_win_rate DESC NULLS LAST;

-- Functions for knowledge base operations
CREATE OR REPLACE FUNCTION search_knowledge_entries(
    search_query TEXT,
    entry_type TEXT DEFAULT NULL,
    min_confidence DECIMAL DEFAULT 0.0,
    max_results INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    type VARCHAR(50),
    confidence_score DECIMAL(3,2),
    relevance_rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ke.id,
        ke.content,
        ke.type,
        ke.confidence_score,
        ts_rank(to_tsvector('english', ke.content), plainto_tsquery('english', search_query)) AS relevance_rank
    FROM knowledge_entries ke
    WHERE 
        (entry_type IS NULL OR ke.type = entry_type)
        AND ke.confidence_score >= min_confidence
        AND ke.validation_status = 'validated'
        AND to_tsvector('english', ke.content) @@ plainto_tsquery('english', search_query)
    ORDER BY relevance_rank DESC, ke.confidence_score DESC
    LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION find_similar_rfps(
    rfp_id UUID,
    similarity_threshold REAL DEFAULT 0.7,
    max_results INTEGER DEFAULT 5
)
RETURNS TABLE (
    similar_rfp_id UUID,
    similarity_score REAL,
    win_status VARCHAR(20)
) AS $$
BEGIN
    -- Simplified similarity based on content overlap
    -- In production, this would use more sophisticated ML similarity
    RETURN QUERY
    SELECT 
        d2.id AS similar_rfp_id,
        -- Simple text similarity using word overlap
        (
            SELECT COUNT(*)::REAL / GREATEST(
                array_length(string_to_array(lower(d1.content), ' '), 1),
                array_length(string_to_array(lower(d2.content), ' '), 1)
            )
            FROM documents d1 
            WHERE d1.id = rfp_id
        ) AS similarity_score,
        (d2.metadata->>'win_status')::VARCHAR(20) AS win_status
    FROM documents d2
    WHERE 
        d2.id != rfp_id
        AND d2.type = 'rfp'
        AND (
            SELECT COUNT(*)::REAL / GREATEST(
                array_length(string_to_array(lower(d1.content), ' '), 1),
                array_length(string_to_array(lower(d2.content), ' '), 1)
            ) >= similarity_threshold
            FROM documents d1 
            WHERE d1.id = rfp_id
        )
    ORDER BY similarity_score DESC
    LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

-- Initial seed data for testing
INSERT INTO documents (name, content, type, metadata) VALUES 
('Sample Healthcare RFP', 'We require a patient feedback management system with HIPAA compliance, real-time analytics, and mobile accessibility. The solution must support multiple languages and integrate with existing EMR systems.', 'rfp', '{"industry": "healthcare", "deal_size": 500000, "client_name": "General Hospital"}'),
('Sample Tech RFP', 'Looking for a customer experience platform that can handle high-volume survey distribution, advanced analytics, and API integrations. GDPR compliance is mandatory.', 'rfp', '{"industry": "technology", "deal_size": 250000, "client_name": "TechCorp Inc"}'),
('Winning Healthcare Response', 'Zenloop provides HIPAA-compliant feedback management with enterprise-grade security, real-time analytics dashboard, and seamless EMR integration through our certified API connectors.', 'rfp_response', '{"win_status": "won", "rfp_id": "healthcare-rfp-001"}')