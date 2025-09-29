'use client'
import { useState } from 'react'

export default function TestAuth() {
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const testEndpoint = async (endpoint: string, method: string = 'GET', body?: any) => {
    setLoading(true)
    try {
      const response = await fetch(`http://localhost:4000${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      })
      
      const data = await response.json()
      setResult(JSON.stringify(data, null, 2))
    } catch (error: any) {
      setResult(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const tests = [
    {
      name: 'Health Check',
      action: () => testEndpoint('/health')
    },
    {
      name: 'Test Signup',
      action: () => testEndpoint('/auth/signup', 'POST', {
        email: 'test@example.com',
        password: 'TestPassword123!',
        name: 'Test User'
      })
    },
    {
      name: 'Test Login',
      action: () => testEndpoint('/auth/login', 'POST', {
        email: 'test@example.com',
        password: 'TestPassword123!'
      })
    }
  ]

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Backend Connection Test</h1>
      
      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Test Endpoints</h2>
          <div className="space-y-3">
            {tests.map((test, index) => (
              <button
                key={index}
                onClick={test.action}
                disabled={loading}
                className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded border disabled:opacity-50"
              >
                {test.name}
              </button>
            ))}
          </div>
          
          {loading && (
            <div className="mt-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Testing...</p>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Result</h2>
          <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm overflow-auto max-h-96">
            <pre>{result || 'No test run yet'}</pre>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-800 mb-2">Setup Instructions</h3>
        <ol className="list-decimal list-inside text-sm text-yellow-700 space-y-1">
          <li>Start your backend server: <code className="bg-yellow-100 px-1 rounded">npm run dev</code></li>
          <li>Ensure MongoDB is running</li>
          <li>Configure your .env file</li>
          <li>Click the test buttons above</li>
        </ol>
      </div>
    </div>
  )
}
