'use client';

import { motion } from 'framer-motion';
import { MoreVertical, RefreshCw, Trash2, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDate, formatNumber } from '@/lib/utils';
import type { Source } from '@/types';

interface SourceCardProps {
  source: Source;
  onSync?: (id: string) => void;
  onRemove?: (id: string) => void;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'active':
      return <CheckCircle className="w-4 h-4 text-green-400" />;
    case 'syncing':
      return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />;
    case 'error':
      return <AlertCircle className="w-4 h-4 text-red-400" />;
    default:
      return <AlertCircle className="w-4 h-4 text-gray-400" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'from-green-500/20 to-green-600/20 border-green-500/30';
    case 'syncing':
      return 'from-blue-500/20 to-blue-600/20 border-blue-500/30';
    case 'error':
      return 'from-red-500/20 to-red-600/20 border-red-500/30';
    default:
      return 'from-gray-500/20 to-gray-600/20 border-gray-500/30';
  }
};

export default function SourceCard({ source, onSync, onRemove }: SourceCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={`p-6 glass border bg-gradient-to-br ${getStatusColor(source.status)}`}>
        <div className="flex items-start justify-between">
          {/* Source Info */}
          <div className="flex items-start gap-4 flex-1">
            {/* Icon */}
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
              style={{ backgroundColor: source.color }}
            >
              {source.icon}
            </div>

            {/* Details */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">{source.name}</h3>
                {getStatusIcon(source.status)}
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span>{formatNumber(source.documents)} documents</span>
                <span>•</span>
                <span>Last sync: {formatDate(source.lastSync)}</span>
              </div>

              <Badge variant="outline" className="capitalize">
                {source.type}
              </Badge>
            </div>
          </div>

          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass">
              <DropdownMenuItem onClick={() => onSync?.(source.id)}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Sync Now
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onRemove?.(source.id)} className="text-red-400">
                <Trash2 className="w-4 h-4 mr-2" />
                Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Progress Bar (for syncing) */}
        {source.status === 'syncing' && (
          <div className="mt-4">
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 2, repeat: Infinity }}
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
              />
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
