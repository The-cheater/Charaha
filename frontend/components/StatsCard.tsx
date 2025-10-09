'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: {
    value: number;
    trend: 'up' | 'down';
  };
  color?: string;
  delay?: number;
}

export default function StatsCard({
  title,
  value,
  icon: Icon,
  change,
  color = 'from-purple-500 to-pink-500',
  delay = 0,
}: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <Card className="p-6 glass border-white/10 hover:border-white/20 transition-all">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm text-gray-400">{title}</p>
            <motion.h3
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: delay + 0.2 }}
              className="text-3xl font-black"
            >
              {value}
            </motion.h3>

            {change && (
              <div
                className={cn(
                  'flex items-center gap-1 text-sm font-medium',
                  change.trend === 'up' ? 'text-green-400' : 'text-red-400'
                )}
              >
                <span>{change.trend === 'up' ? '↑' : '↓'}</span>
                <span>{Math.abs(change.value)}%</span>
              </div>
            )}
          </div>

          <div
            className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br',
              color
            )}
          >
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
