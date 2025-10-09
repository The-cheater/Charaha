'use client';

import { motion } from 'framer-motion';
import { Plus, Database, Link as LinkIcon, CheckCircle2, XCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function SourcesPage() {
  const sources = [
    {
      name: 'Slack Workspace',
      type: 'slack',
      status: 'active',
      documents: 2847,
      lastSync: '5 min ago',
      icon: '💬',
      color: 'from-purple-500 to-pink-500',
    },
    {
      name: 'Google Drive',
      type: 'google-drive',
      status: 'active',
      documents: 1234,
      lastSync: '10 min ago',
      icon: '📁',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      name: 'Notion Workspace',
      type: 'notion',
      status: 'syncing',
      documents: 567,
      lastSync: 'Syncing...',
      icon: '📝',
      color: 'from-gray-500 to-gray-600',
    },
    {
      name: 'GitHub Repositories',
      type: 'github',
      status: 'error',
      documents: 89,
      lastSync: '2 hours ago',
      icon: '🐙',
      color: 'from-red-500 to-orange-500',
    },
  ];

  const availableSources = [
    { name: 'Confluence', icon: '🌐', description: 'Wiki & documentation' },
    { name: 'Jira', icon: '📋', description: 'Project management' },
    { name: 'Linear', icon: '📊', description: 'Issue tracking' },
    { name: 'Dropbox', icon: '📦', description: 'File storage' },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle2 className="w-5 h-5 text-green-400" />;
      case 'syncing':
        return <Clock className="w-5 h-5 text-yellow-400 animate-spin" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-400" />;
      default:
        return <Database className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between mb-12"
      >
        <div>
          <h1 className="text-5xl font-black font-display mb-3">
            <span className="gradient-text">Data Sources</span>
          </h1>
          <p className="text-xl text-gray-400">
            Connect and manage your knowledge sources
          </p>
        </div>
        <Button
          asChild
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-6"
        >
          <Link href="/sources/add">
            <Plus className="w-5 h-5 mr-2" />
            Add Source
          </Link>
        </Button>
      </motion.div>

      {/* Connected Sources */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold mb-6">Connected Sources</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {sources.map((source, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
            >
              <Card className="glass p-6 border-white/10 group cursor-pointer">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${source.color} flex items-center justify-center text-3xl group-hover:scale-110 transition-transform`}>
                      {source.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-1">{source.name}</h3>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(source.status)}
                        <span className="text-sm text-gray-400 capitalize">
                          {source.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <LinkIcon className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                  <div>
                    <p className="text-2xl font-bold">{source.documents.toLocaleString()}</p>
                    <p className="text-sm text-gray-400">Documents</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-300">{source.lastSync}</p>
                    <p className="text-sm text-gray-400">Last sync</p>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="flex-1 border-white/10 hover:bg-white/5"
                  >
                    <Link href={`/sources/${source.type}`}>
                      View Details
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white/10 hover:bg-white/5"
                  >
                    Configure
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Available Sources */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <h2 className="text-2xl font-bold mb-6">Available Sources</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {availableSources.map((source, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
              whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
            >
              <Card className="glass p-6 border-white/10 hover:border-purple-500/30 transition-colors cursor-pointer text-center group">
                <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">
                  {source.icon}
                </div>
                <h3 className="font-bold mb-1">{source.name}</h3>
                <p className="text-sm text-gray-400">{source.description}</p>
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-3 w-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Connect
                </Button>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
