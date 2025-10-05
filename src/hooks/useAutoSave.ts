import { useEffect, useRef } from 'react';
import { projectStorageService, StoredProject } from '../lib/services/project-storage-service';
import { useToast } from '@/components/ui/use-toast';

export function useAutoSave(project: StoredProject | null, enabled: boolean = true) {
  const { toast } = useToast();
  const cleanupRef = useRef<(() => void) | null>(null);
  const lastSavedRef = useRef<string>('');
  const toastShownRef = useRef<boolean>(false);

  useEffect(() => {
    if (!enabled || !project) {
      // Clean up if disabled or no project
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
      return;
    }

    // Start auto-save
    const cleanup = projectStorageService.startAutoSave(
      project.id,
      () => project
    );
    cleanupRef.current = cleanup;

    // Show toast on first auto-save (after 30 seconds)
    const timer = setTimeout(() => {
      const currentState = JSON.stringify(project);
      if (currentState !== lastSavedRef.current && !toastShownRef.current) {
        toast({
          title: 'Auto-saved',
          description: 'Your work has been saved automatically.',
          duration: 2000
        });
        lastSavedRef.current = currentState;
        toastShownRef.current = true;
      }
    }, 31000); // Slightly after first auto-save

    return () => {
      cleanup();
      clearTimeout(timer);
    };
  }, [project, enabled, toast]);

  // Manual save function
  const saveNow = () => {
    if (project) {
      projectStorageService.saveProject(project);
      toast({
        title: 'Saved',
        description: 'Project saved successfully.'
      });
    }
  };

  return { saveNow };
}
