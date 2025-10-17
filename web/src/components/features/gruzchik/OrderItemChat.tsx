'use client';

import { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Send,
  Image as ImageIcon,
  Video,
  FileText,
  Shield,
  Eye,
  EyeOff,
} from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Switch } from '@/components/ui/Switch';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { OrderItemData } from './OrderItemCard';
import { cn } from '@/lib/utils';

interface ChatMessage {
  id: string;
  text: string;
  sender: 'gruzchik' | 'client' | 'admin';
  timestamp: Date;
  isService: boolean;
  attachments?: {
    type: 'image' | 'video' | 'file';
    url: string;
    name: string;
  }[];
}

interface OrderItemChatProps {
  item: OrderItemData;
  onClose: () => void;
}

export function OrderItemChat({ item, onClose }: OrderItemChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isService, setIsService] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch messages from API
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch(
          `/api/gruzchik/order-items/${item.itemId}/messages`
        );
        const data = await response.json();

        if (data.success) {
          const formattedMessages: ChatMessage[] = data.messages.map(
            (msg: any) => ({
              id: msg.id,
              text: msg.text,
              sender: msg.sender,
              timestamp: new Date(msg.timestamp),
              isService: msg.isService,
              attachments: msg.attachments,
            })
          );
          setMessages(formattedMessages);
        } else {
          console.error('Failed to fetch messages:', data.error);
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    fetchMessages();
  }, [item.itemId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() && !fileInputRef.current?.files?.length) return;

    setIsLoading(true);

    try {
      const response = await fetch(
        `/api/gruzchik/order-items/${item.itemId}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: newMessage.trim(),
            isService,
            attachments: [], // TODO: Handle file attachments
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        const newMessage: ChatMessage = {
          id: data.message.id,
          text: data.message.text,
          sender: data.message.sender,
          timestamp: new Date(data.message.timestamp),
          isService: data.message.isService,
          attachments: data.message.attachments,
        };

        setMessages(prev => [...prev, newMessage]);
        setNewMessage('');
        setIsService(false);
      } else {
        console.error('Failed to send message:', data.error);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // TODO: Handle file upload
    console.log('Files to upload:', files);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSenderName = (sender: ChatMessage['sender']) => {
    switch (sender) {
      case 'gruzchik':
        return 'Грузчик';
      case 'client':
        return item.customerName || 'Клиент';
      case 'admin':
        return 'Админ';
      default:
        return 'Неизвестно';
    }
  };

  const getSenderColor = (sender: ChatMessage['sender']) => {
    switch (sender) {
      case 'gruzchik':
        return 'bg-blue-500 text-white';
      case 'client':
        return 'bg-gray-500 text-white';
      case 'admin':
        return 'bg-purple-500 text-white';
      default:
        return 'bg-gray-400 text-white';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-white p-4">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" onClick={onClose} className="p-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="font-semibold text-gray-900">Чат по товару</h2>
            <p className="text-sm text-gray-500">
              {item.itemName} • #{item.itemCode}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map(message => (
            <div
              key={message.id}
              className={cn(
                'flex',
                message.sender === 'gruzchik' ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={cn(
                  'max-w-[80%] rounded-lg p-3',
                  message.sender === 'gruzchik'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-900'
                )}
              >
                <div className="mb-1 flex items-center space-x-2">
                  <span className="text-xs font-medium opacity-75">
                    {getSenderName(message.sender)}
                  </span>
                  {message.isService && (
                    <Badge variant="secondary" className="text-xs">
                      <Shield className="mr-1 h-3 w-3" />
                      Служебный
                    </Badge>
                  )}
                </div>
                <p className="text-sm">{message.text}</p>
                <p className="mt-1 text-xs opacity-75">
                  {formatTime(message.timestamp)}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="border-t bg-white p-4">
        {/* Service Message Toggle */}
        <div className="mb-3 flex items-center space-x-2">
          <Switch
            id="service-message"
            checked={isService}
            onCheckedChange={setIsService}
          />
          <label
            htmlFor="service-message"
            className="flex items-center space-x-1 text-sm font-medium text-gray-700"
          >
            {isService ? (
              <>
                <Shield className="h-4 w-4 text-orange-500" />
                <span className="text-orange-600">Служебное сообщение</span>
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 text-green-500" />
                <span className="text-green-600">Видно клиенту</span>
              </>
            )}
          </label>
        </div>

        {/* File Upload Button */}
        <div className="mb-3 flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-1"
          >
            <ImageIcon className="h-4 w-4" />
            <span>Фото</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-1"
          >
            <Video className="h-4 w-4" />
            <span>Видео</span>
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleFileUpload}
            className="hidden"
            aria-label="Upload files"
          />
        </div>

        {/* Text Input */}
        <div className="flex space-x-2">
          <Textarea
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            placeholder="Введите сообщение..."
            className="max-h-32 min-h-[40px] flex-1 resize-none"
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isLoading}
            size="sm"
            className="px-3"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
