import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Home, FileText, FolderOpen, Settings, HelpCircle,
  Menu, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigation } from './NavigationProvider';
import { cn } from '@/lib/utils';
import { MobileMenu } from './MobileMenu';
import { NavigationConfirmDialog } from './NavigationConfirmDialog';

export interface NavigationItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

export const navigationItems: NavigationItem[] = [
  {
    label: 'Home',
    path: '/',
    icon: Home,
    description: 'Dashboard and project overview'
  },
  {
    label: 'Knowledge Base',
    path: '/knowledge-base',
    icon: FolderOpen,
    description: 'Manage company documents'
  },
  {
    label: 'Help',
    path: '/help',
    icon: HelpCircle,
    description: 'Support and documentation'
  }
];

interface HeaderProps {
  showWorkflowNav?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ showWorkflowNav = false }) => {
  const { currentPath, navigateWithGuard, pendingNavigation, confirmNavigation, cancelNavigation } = useNavigation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavigation = (path: string) => {
    navigateWithGuard(path);
    setMobileMenuOpen(false);
  };

  const isActive = (path: string) => {
    if (path === '/') {
      return currentPath === '/';
    }
    return currentPath.startsWith(path);
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4 sm:px-6">
          {/* Logo and Brand */}
          <div className="flex items-center gap-6">
            <Link
              to="/"
              onClick={(e) => {
                e.preventDefault();
                handleNavigation('/');
              }}
              className="flex items-center gap-2 transition-opacity hover:opacity-80"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <FileText className="h-5 w-5" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-semibold tracking-tight">zen-rfp generator</h1>
                <p className="text-xs text-muted-foreground">professional rfp responses</p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <Button
                  key={item.path}
                  variant={active ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => handleNavigation(item.path)}
                  className={cn(
                    'gap-2 transition-colors',
                    active && 'bg-secondary font-medium'
                  )}
                  title={item.description}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Button>
              );
            })}
          </nav>

          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        onNavigate={handleNavigation}
        currentPath={currentPath}
      />

      {/* Navigation Confirmation Dialog */}
      <NavigationConfirmDialog
        isOpen={!!pendingNavigation}
        onConfirm={confirmNavigation}
        onCancel={cancelNavigation}
      />
    </>
  );
};
