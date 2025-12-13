import { cn } from '@/lib/utils';
import { SafetyLevel } from '@/types';
import { Shield, AlertTriangle, AlertOctagon } from 'lucide-react';

interface SafetyIndicatorProps {
  level: SafetyLevel;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const levelConfig = {
  safe: {
    icon: Shield,
    label: 'Safe Zone',
    bgClass: 'bg-safe',
    textClass: 'text-safe-foreground',
    ringClass: 'ring-safe/30',
  },
  caution: {
    icon: AlertTriangle,
    label: 'Exercise Caution',
    bgClass: 'bg-caution',
    textClass: 'text-caution-foreground',
    ringClass: 'ring-caution/30',
  },
  danger: {
    icon: AlertOctagon,
    label: 'High Risk Area',
    bgClass: 'bg-danger',
    textClass: 'text-danger-foreground',
    ringClass: 'ring-danger/30',
  },
};

const sizeConfig = {
  sm: {
    container: 'w-16 h-16',
    icon: 20,
    text: 'text-xs',
  },
  md: {
    container: 'w-24 h-24',
    icon: 32,
    text: 'text-sm',
  },
  lg: {
    container: 'w-32 h-32',
    icon: 48,
    text: 'text-base',
  },
};

export function SafetyIndicator({ 
  level, 
  size = 'md', 
  showLabel = true,
  className 
}: SafetyIndicatorProps) {
  const config = levelConfig[level];
  const sizeStyles = sizeConfig[size];
  const Icon = config.icon;

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <div
        className={cn(
          'rounded-full flex items-center justify-center ring-4',
          config.bgClass,
          config.ringClass,
          sizeStyles.container,
          'transition-all duration-300 hover:scale-105'
        )}
      >
        <Icon size={sizeStyles.icon} className={config.textClass} />
      </div>
      {showLabel && (
        <span className={cn('font-medium', sizeStyles.text, config.bgClass.replace('bg-', 'text-'))}>
          {config.label}
        </span>
      )}
    </div>
  );
}
