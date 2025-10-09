'use client';

import { motion } from 'framer-motion';
import { TrendingUp, Search, Users, Clock, ArrowUp, ArrowDown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function AnalyticsPage() {
  const stats = [
    { label: 'Total Searches', value: '12,847', change: '+23.5%', trend: 'up', icon: Search },
    { label: 'Active Users', value: '487', change: '+12.3%', trend: 'up', icon: Users },
    { label: 'Avg Query Time', value: '0.31s', change: '-8.2%', trend: 'down', icon: Clock },
    { label: 'Success Rate', value: '94.2%', change: '+2.1%', trend: 'up', icon: TrendingUp },
  ];

  const topSearches = [
    { query: 'Q4 marketing strategy', count: 234, trend: 'up' },
    { query: 'product roadmap', count: 189, trend: 'up' },
    { query: 'team meeting notes', count: 167, trend: 'down' },
    { query: 'budget planning', count: 145, trend: 'up' },
    { query: 'customer feedback', count: 123, trend: 'up' },
  ];

  const sourceDistribution = [
    { name: 'Slack', percentage: 42, documents: 2847, color: 'from-purple-500 to-pink-500' },
    { name: 'Google Drive', percentage: 31, documents: 1234, color: 'from-blue-500 to-cyan-500' },
    { name: 'Notion', percentage: 18, documents: 567, color: 'from-green-500 to-emerald-500' },
    { name: 'GitHub', percentage: 9, documents: 89, color: 'from-yellow-500 to-orange-500' },
  ];

  return (
    <div className="min-h-screen p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-12"
      >
        <h1 className="text-5xl font-black font-display mb-3">
          <span className="gradient-text">Analytics</span>
        </h1>
        <p className="text-xl text-gray-400">
          Track your team's search patterns and insights
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
          >
            <Card className="glass p-6 border-white/10">
              <div className="flex items-center justify-between mb-4">
                <stat.icon className="w-8 h-8 text-purple-400" />
                <Badge
                  className={`${
                    stat.trend === 'up'
                      ? 'bg-green-500/20 text-green-400 border-green-500/30'
                      : 'bg-red-500/20 text-red-400 border-red-500/30'
                  }`}
                >
                  {stat.trend === 'up' ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
                  {stat.change}
                </Badge>
              </div>
              <h3 className="text-3xl font-black mb-1">{stat.value}</h3>
              <p className="text-sm text-gray-400">{stat.label}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Top Searches */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="glass p-6 border-white/10">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-purple-400" />
              Top Searches
            </h2>
            <div className="space-y-4">
              {topSearches.map((search, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                  className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-black text-gray-600">
                      {(index + 1).toString().padStart(2, '0')}
                    </span>
                    <div>
                      <p className="font-semibold">{search.query}</p>
                      <p className="text-sm text-gray-400">{search.count} searches</p>
                    </div>
                  </div>
                  {search.trend === 'up' ? (
                    <ArrowUp className="w-5 h-5 text-green-400" />
                  ) : (
                    <ArrowDown className="w-5 h-5 text-red-400" />
                  )}
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Source Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card className="glass p-6 border-white/10">
            <h2 className="text-2xl font-bold mb-6">Source Distribution</h2>
            <div className="space-y-6">
              {sourceDistribution.map((source, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">{source.name}</span>
                    <span className="text-sm text-gray-400">
                      {source.percentage}% • {source.documents.toLocaleString()} docs
                    </span>
                  </div>
                  <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${source.percentage}%` }}
                      transition={{ duration: 1, delay: 0.7 + index * 0.1, ease: 'easeOut' }}
                      className={`h-full bg-gradient-to-r ${source.color} rounded-full`}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
