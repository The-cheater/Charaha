'use client';

import { motion } from 'framer-motion';
import { User, Bell, Shield, CreditCard, Users, Key } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function SettingsPage() {
  const [profile, setProfile] = useState({
    name: 'John Doe',
    email: 'john@company.com',
    role: 'Admin',
  });

  const settingsSections = [
    {
      title: 'Profile Settings',
      icon: User,
      description: 'Manage your personal information',
      href: '/settings',
    },
    {
      title: 'Notifications',
      icon: Bell,
      description: 'Configure notification preferences',
      href: '/settings/notifications',
    },
    {
      title: 'Security',
      icon: Shield,
      description: 'Password and authentication settings',
      href: '/settings/security',
    },
    {
      title: 'Billing',
      icon: CreditCard,
      description: 'Manage subscription and payments',
      href: '/settings/billing',
    },
    {
      title: 'Team',
      icon: Users,
      description: 'Manage team members and roles',
      href: '/settings/team',
    },
    {
      title: 'API Keys',
      icon: Key,
      description: 'Generate and manage API keys',
      href: '/settings/api',
    },
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
          <span className="gradient-text">Settings</span>
        </h1>
        <p className="text-xl text-gray-400">
          Manage your account and preferences
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Settings Navigation */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="lg:col-span-1"
        >
          <Card className="glass p-6 border-white/10">
            <div className="space-y-2">
              {settingsSections.map((section, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 + index * 0.05 }}
                  whileHover={{ x: 5, transition: { duration: 0.2 } }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <section.icon className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-semibold text-sm">{section.title}</p>
                    <p className="text-xs text-gray-400">{section.description}</p>
                  </div>
                </motion.button>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Profile Form */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card className="glass p-8 border-white/10">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <User className="w-6 h-6 text-purple-400" />
              Profile Information
            </h2>

            <form className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Full Name</label>
                  <Input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="bg-white/5 border-white/10 focus:border-purple-500 h-12"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <Input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="bg-white/5 border-white/10 focus:border-purple-500 h-12"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Role</label>
                <Input
                  type="text"
                  value={profile.role}
                  disabled
                  className="bg-white/5 border-white/10 h-12 cursor-not-allowed"
                />
              </div>

              <div className="flex items-center gap-4 pt-4">
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-8"
                >
                  Save Changes
                </Button>
                <Button variant="outline" className="border-white/10 hover:bg-white/5">
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
