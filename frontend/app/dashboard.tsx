'use client';

import { motion } from 'framer-motion';
import { Search, TrendingUp, Clock, FileText, Zap, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function DashboardPage() {
  const stats = [
    { label: 'Total Searches', value: '1,234', change: '+12%', icon: Search, color: 'from-purple-500 to-pink-500' },
    { label: 'Active Sources', value: '8', change: '+2', icon: FileText, color: 'from-blue-500 to-cyan-500' },
    { label: 'Avg Response Time', value: '0.3s', change: '-15%', icon: Zap, color: 'from-yellow-500 to-orange-500' },
    { label: 'Team Members', value: '12', change: '+3', icon: TrendingUp, color: 'from-green-500 to-emerald-500' },
  ];

  const recentSearches = [
    { query: 'Q4 marketing strategy', source: 'Google Drive', time: '2 min ago', results: 12 },
    { query: 'standup notes last week', source: 'Slack', time: '15 min ago', results: 8 },
    { query: 'product roadmap 2024', source: 'Notion', time: '1 hour ago', results: 24 },
    { query: 'customer feedback analysis', source: 'Google Drive', time: '3 hours ago', results: 18 },
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
          Welcome back, <span className="gradient-text">John</span>
        </h1>
        <p className="text-xl text-gray-400">Here's what's happening with your knowledge base today</p>
      </motion.div>

      {/* Quick Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-12"
      >
        <div className="glass p-2 rounded-2xl border border-purple-500/30 max-w-3xl">
          <div className="flex items-center gap-3 px-4 py-3">
            <Search className="w-6 h-6 text-purple-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search across all your sources..."
              className="flex-1 bg-transparent text-white placeholder:text-gray-500 outline-none text-lg"
            />
            <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
              Search
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
          >
            <Card className="glass p-6 border-white/10 group">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} p-3 group-hover:scale-110 transition-transform`}>
                  <stat.icon className="w-full h-full text-white" />
                </div>
                <span className="text-sm text-green-400 font-semibold">{stat.change}</span>
              </div>
              <h3 className="text-3xl font-black mb-1">{stat.value}</h3>
              <p className="text-sm text-gray-400">{stat.label}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent Searches */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="lg:col-span-2"
        >
          <Card className="glass p-6 border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Clock className="w-6 h-6 text-purple-400" />
                Recent Searches
              </h2>
              <Link href="/history" className="text-sm text-purple-400 hover:text-purple-300">
                View all
              </Link>
            </div>

            <div className="space-y-4">
              {recentSearches.map((search, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.7 + index * 0.1 }}
                  className="glass p-4 rounded-xl border border-white/5 hover:border-purple-500/30 transition-colors cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-white group-hover:text-purple-400 transition-colors">
                      {search.query}
                    </h3>
                    <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-purple-400 transition-colors" />
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      {search.source}
                    </span>
                    <span>{search.time}</span>
                    <span className="text-purple-400">{search.results} results</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <Card className="glass p-6 border-white/10">
            <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>
            
            <div className="space-y-3">
              <Button
                asChild
                className="w-full justify-start bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <Link href="/sources/add">
                  <Search className="w-5 h-5 mr-2" />
                  Add New Source
                </Link>
              </Button>

              <Button asChild variant="outline" className="w-full justify-start border-white/10 hover:bg-white/5">
                <Link href="/analytics">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  View Analytics
                </Link>
              </Button>

              <Button asChild variant="outline" className="w-full justify-start border-white/10 hover:bg-white/5">
                <Link href="/settings">
                  <FileText className="w-5 h-5 mr-2" />
                  Team Settings
                </Link>
              </Button>
            </div>

            {/* Usage Tip */}
            <div className="mt-8 p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                Pro Tip
              </h3>
              <p className="text-sm text-gray-300">
                Use natural language questions for better results. Try "What did we discuss about Q4 goals?"
              </p>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
