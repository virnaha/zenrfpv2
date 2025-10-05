import React, { useState, useEffect } from 'react';
import { FileWarning, Trash2, Clock, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { projectStorageService, StoredProject } from '../lib/services/project-storage-service';

interface RecoveryDialogProps {
  onRecover: (project: StoredProject) => void;
}

export const RecoveryDialog: React.FC<RecoveryDialogProps> = ({ onRecover }) => {
  const [show, setShow] = useState(false);
  const [unsavedProjects, setUnsavedProjects] = useState<StoredProject[]>([]);

  useEffect(() => {
    // Check for unsaved work on mount
    const { hasWork, projects } = projectStorageService.hasUnsavedWork();
    if (hasWork) {
      setUnsavedProjects(projects);
      setShow(true);
    }
  }, []);

  const handleRecover = (project: StoredProject) => {
    onRecover(project);
    setShow(false);
  };

  const handleDiscard = (projectId: string) => {
    projectStorageService.deleteProject(projectId);
    setUnsavedProjects(prev => prev.filter(p => p.id !== projectId));

    // Close dialog if no more projects
    if (unsavedProjects.length <= 1) {
      setShow(false);
    }
  };

  const handleDiscardAll = () => {
    unsavedProjects.forEach(project => {
      projectStorageService.deleteProject(project.id);
    });
    setShow(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'review':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTimeAgo = (isoString: string): string => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  if (!show || unsavedProjects.length === 0) return null;

  return (
    <Dialog open={show} onOpenChange={setShow}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileWarning className="h-5 w-5 text-yellow-600" />
            Recover Unsaved Work
          </DialogTitle>
          <DialogDescription>
            We found {unsavedProjects.length} project{unsavedProjects.length > 1 ? 's' : ''} with recent changes.
            Would you like to recover your work?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 overflow-y-auto flex-1 pr-2">
          {unsavedProjects.map(project => (
            <Card key={project.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <h4 className="font-medium truncate">{project.name}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground truncate mb-2">
                      {project.documentName}
                    </p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <Badge
                        variant="outline"
                        className={`text-xs ${getStatusColor(project.status)}`}
                      >
                        {project.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatTimeAgo(project.updatedAt)}
                      </div>
                      {project.questionsAnswered > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {project.questionsAnswered}/{project.questionsTotal} questions answered
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleRecover(project)}
                      className="w-full"
                    >
                      Recover
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDiscard(project.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 w-full"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Discard
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-between gap-2 pt-4 border-t mt-4">
          <Button
            variant="outline"
            onClick={handleDiscardAll}
            className="text-red-600 hover:text-red-700"
          >
            Discard All
          </Button>
          <Button variant="outline" onClick={() => setShow(false)}>
            Start Fresh
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
