import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Import the actual professional workflow
import { ProfessionalRFPWorkflow } from './ProfessionalRFPWorkflow';

export const UnifiedRFPWorkflow = () => {
  // Redirect to the professional workflow
  return <ProfessionalRFPWorkflow />;
};