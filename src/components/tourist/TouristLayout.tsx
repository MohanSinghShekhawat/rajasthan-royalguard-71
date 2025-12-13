import { ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Map, Camera, Shield, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TouristLayoutProps {
  children: ReactNode;
}

const navItems = [
  { to: '/tourist', icon: Home, label: 'Home' },
  { to: '/tourist/map', icon: Map, label: 'Map' },
  { to: '/tourist/camera', icon: Camera, label: 'Camera' },
  { to: '/tourist/safety', icon: Shield, label: 'Safety' },
  { to: '/tourist/profile', icon: User, label: 'Profile' },
];

export function TouristLayout({ children }: TouristLayoutProps) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-card border-b">
        <div className="container flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg royal-gradient flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg">Rajasthan Safe</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container px-4 py-4 pb-20">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 glass-card border-t safe-area-inset-bottom">
        <div className="container flex items-center justify-around h-16 px-2">
          {navItems.map(({ to, icon: Icon, label }) => {
            const isActive = location.pathname === to || 
              (to !== '/tourist' && location.pathname.startsWith(to));
            
            return (
              <NavLink
                key={to}
                to={to}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg',
                  'transition-all duration-200',
                  isActive
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <Icon className={cn('w-5 h-5', isActive && 'text-primary')} />
                <span className="text-xs font-medium">{label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
