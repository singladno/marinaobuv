'use client';

import { useState } from 'react';
import { Eye, Code, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import type { Product } from '@/types/product';

interface ProductGptDebugCellProps {
  product: Product;
}

export function ProductGptDebugCell({ product }: ProductGptDebugCellProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'request' | 'response'>('request');

  const hasDebugInfo = product.gptRequest || product.gptResponse;

  if (!hasDebugInfo) {
    return (
      <div className="text-sm text-gray-400">
        <FileText className="mr-1 inline h-4 w-4" />
        Нет данных
      </div>
    );
  }

  const formatJson = (jsonString: string | null) => {
    if (!jsonString) return 'Нет данных';
    try {
      const parsed = JSON.parse(jsonString);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return jsonString;
    }
  };

  return (
    <>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          className="text-xs"
        >
          <Eye className="mr-1 h-3 w-3" />
          GPT Debug
        </Button>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="GPT Debug Information"
        size="xl"
      >
        <div className="space-y-4">
          {/* Tab Navigation */}
          <div className="flex space-x-2 border-b">
            <button
              onClick={() => setActiveTab('request')}
              className={`border-b-2 px-4 py-2 text-sm font-medium ${
                activeTab === 'request'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Code className="mr-2 inline h-4 w-4" />
              Request
            </button>
            <button
              onClick={() => setActiveTab('response')}
              className={`border-b-2 px-4 py-2 text-sm font-medium ${
                activeTab === 'response'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileText className="mr-2 inline h-4 w-4" />
              Response
            </button>
          </div>

          {/* Content */}
          <div className="max-h-96 overflow-auto">
            {activeTab === 'request' && (
              <div>
                <h4 className="mb-2 text-sm font-medium text-gray-700">
                  GPT Request:
                </h4>
                <pre className="overflow-auto whitespace-pre-wrap rounded bg-gray-50 p-4 text-xs">
                  {formatJson(product.gptRequest)}
                </pre>
              </div>
            )}

            {activeTab === 'response' && (
              <div>
                <h4 className="mb-2 text-sm font-medium text-gray-700">
                  GPT Response:
                </h4>
                <pre className="overflow-auto whitespace-pre-wrap rounded bg-gray-50 p-4 text-xs">
                  {formatJson(product.gptResponse)}
                </pre>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="rounded bg-blue-50 p-3 text-sm">
            <div className="mb-1 font-medium text-blue-800">Product Info:</div>
            <div className="text-blue-700">
              <div>ID: {product.id}</div>
              <div>Article: {product.article || 'N/A'}</div>
              <div>
                Source Messages: {product.sourceMessageIds?.length || 0}
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
