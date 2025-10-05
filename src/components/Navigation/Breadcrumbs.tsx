import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { useNavigation } from './NavigationProvider';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  path: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  className?: string;
}

// Route to breadcrumb mapping
const routeBreadcrumbMap: Record<string, BreadcrumbItem[]> = {
  '/': [{ label: 'Home', path: '/' }],
  '/help': [
    { label: 'Home', path: '/' },
    { label: 'Help', path: '/help' }
  ],
};

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, className }) => {
  const { currentPath, navigateWithGuard } = useNavigation();

  // Use provided items or generate from current path
  const breadcrumbItems = items || routeBreadcrumbMap[currentPath] || [
    { label: 'Home', path: '/' }
  ];

  if (breadcrumbItems.length === 1) {
    return null; // Don't show breadcrumbs on home page
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center space-x-1 text-sm text-muted-foreground', className)}
    >
      {breadcrumbItems.map((item, index) => {
        const isLast = index === breadcrumbItems.length - 1;
        const isFirst = index === 0;

        return (
          <React.Fragment key={item.path}>
            {index > 0 && (
              <ChevronRight className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
            )}

            <button
              onClick={() => !isLast && navigateWithGuard(item.path)}
              disabled={isLast}
              className={cn(
                'flex items-center gap-1 transition-colors',
                isLast
                  ? 'font-medium text-foreground cursor-default'
                  : 'hover:text-foreground'
              )}
              aria-current={isLast ? 'page' : undefined}
            >
              {isFirst && <Home className="h-4 w-4" />}
              <span className="truncate max-w-[200px]">{item.label}</span>
            </button>
          </React.Fragment>
        );
      })}
    </nav>
  );
};

// Hook to dynamically set breadcrumbs
export const useBreadcrumbs = (items: BreadcrumbItem[]) => {
  // This could be enhanced to store breadcrumbs in context
  // For now, it's a simple pass-through
  return items;
};
