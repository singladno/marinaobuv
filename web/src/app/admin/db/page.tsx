'use client';

import { useState, useEffect } from 'react';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';

export default function DatabasePage() {
  const [dbStats, setDbStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDbStats();
  }, []);

  const fetchDbStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/db');
      const data = await response.json();

      if (response.ok) {
        setDbStats(data);
      } else {
        setError(data.error || 'Failed to fetch database stats');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const openPrismaStudio = () => {
    // This would need to be implemented as a server action or API route
    // that starts Prisma Studio and provides access
    window.open('/api/admin/prisma-studio', '_blank');
  };

  if (loading) {
    return (
      <div className="p-6">
        <Text variant="h2" className="mb-4">
          Database Access
        </Text>
        <Text>Loading database information...</Text>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Text variant="h2" className="mb-4">
          Database Access
        </Text>
        <Text className="mb-4 text-red-600">Error: {error}</Text>
        <Button onClick={fetchDbStats}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Text variant="h2" className="mb-4">
        Database Access
      </Text>

      <div className="mb-6 grid gap-4">
        <div className="rounded-lg bg-green-50 p-4">
          <Text className="font-semibold text-green-800">
            ✅ Database Connected
          </Text>
          <Text className="text-green-600">Database: {dbStats?.database}</Text>
          <Text className="text-green-600">Status: {dbStats?.status}</Text>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg bg-blue-50 p-4 text-center">
            <Text className="text-2xl font-bold text-blue-800">
              {dbStats?.stats?.users}
            </Text>
            <Text className="text-blue-600">Users</Text>
          </div>
          <div className="rounded-lg bg-purple-50 p-4 text-center">
            <Text className="text-2xl font-bold text-purple-800">
              {dbStats?.stats?.products}
            </Text>
            <Text className="text-purple-600">Products</Text>
          </div>
          <div className="rounded-lg bg-orange-50 p-4 text-center">
            <Text className="text-2xl font-bold text-orange-800">
              {dbStats?.stats?.orders}
            </Text>
            <Text className="text-orange-600">Orders</Text>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <Text variant="h3" className="mb-2">
          Database Access Options:
        </Text>

        <div className="rounded-lg bg-gray-50 p-4">
          <Text className="mb-2 font-semibold">1. API Endpoint:</Text>
          <Text className="mb-2 text-sm text-gray-600">
            <code className="rounded bg-gray-200 px-2 py-1">
              GET /api/admin/db
            </code>
          </Text>
          <Text className="text-sm text-gray-600">
            Returns database statistics and connection status
          </Text>
        </div>

        <div className="rounded-lg bg-gray-50 p-4">
          <Text className="mb-2 font-semibold">
            2. Direct Database Connection:
          </Text>
          <Text className="mb-2 text-sm text-gray-600">
            <code className="rounded bg-gray-200 px-2 py-1">
              postgresql://postgres:postgres@localhost:5432/marinaobuv
            </code>
          </Text>
          <Text className="text-sm text-gray-600">
            Use this with database clients like pgAdmin, DBeaver, or psql
          </Text>
        </div>

        <div className="rounded-lg bg-gray-50 p-4">
          <Text className="mb-2 font-semibold">
            3. Prisma Studio (Local Development):
          </Text>
          <Text className="mb-2 text-sm text-gray-600">
            <code className="rounded bg-gray-200 px-2 py-1">
              npx prisma studio
            </code>
          </Text>
          <Text className="text-sm text-gray-600">
            Opens Prisma Studio at http://localhost:5555
          </Text>
        </div>
      </div>
    </div>
  );
}
