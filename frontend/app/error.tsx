'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-40 left-40 w-96 h-96 bg-red-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-40 right-40 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Animated Error Icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ 
            type: 'spring',
            stiffness: 200,
            damping: 15
          }}
          className="flex justify-center"
        >
          <div className="w-32 h-32 rounded-full glass border border-red-500/30 flex items-center justify-center">
            <motion.div
              animate={{ 
                rotate: [0, 10, -10, 10, 0],
              }}
              transition={{ 
                duration: 0.5,
                repeat: Infinity,
                repeatDelay: 2
              }}
            >
              <AlertTriangle className="w-16 h-16 text-red-400" />
            </motion.div>
          </div>
        </motion.div>

        {/* Error Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-4"
        >
          <h1 className="text-5xl font-black font-display gradient-text">
            Oops! Something went wrong
          </h1>
          <p className="text-xl text-gray-400 max-w-md mx-auto">
            Don't worry, it's not your fault. We're working on fixing this.
          </p>

          {/* Error Details (Dev Mode) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-8 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-left max-w-2xl mx-auto">
              <p className="text-sm font-mono text-red-400 break-words">
                {error.message}
              </p>
            </div>
          )}
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex items-center justify-center gap-4"
        >
          <Button
            onClick={reset}
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Try Again
          </Button>

          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-purple-500/50 hover:bg-purple-500/10"
          >
            <Link href="/">
              <Home className="w-5 h-5 mr-2" />
              Go Home
            </Link>
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
