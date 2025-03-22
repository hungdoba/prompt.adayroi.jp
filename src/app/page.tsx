'use client';
import { useState, useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ArrowPathIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  option: number;
  content: string;
  explain: string;
}

// Components
const MessageCard = ({
  message,
  onDelete,
  index,
}: {
  message: Message;
  onDelete: (index: number) => void;
  index: number;
}) => (
  <div
    className={cn(
      'mb-1 w-4/5 cursor-pointer flex',
      message.role === 'user' ? 'self-start' : 'self-end'
    )}
  >
    <XMarkIcon
      className={cn(
        'w-6 h-6 m-2',
        message.role === 'user' ? 'order-first' : 'order-last'
      )}
      onClick={() => onDelete(index)}
    />
    <Card className="w-full">
      <CardHeader>
        <CardTitle
          onClick={() => navigator.clipboard.writeText(message.content)}
        >
          {message.content}
        </CardTitle>
        <CardDescription
          onClick={() => navigator.clipboard.writeText(message.explain)}
          className="cursor-pointer hover:opacity-75 whitespace-pre-line text-xs"
        >
          {message.explain}
        </CardDescription>
      </CardHeader>
    </Card>
  </div>
);

export default function Home() {
  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState('');
  const [isDeleteMessage, setIsDeleteMessage] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Handlers
  const handleInputChange = (value: string) => {
    setContent(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!content.trim()) {
      setLoading(false);
      return;
    }

    // Add user message to the chat
    const userMessage: Message = {
      role: 'user',
      option: 0,
      content: '',
      explain: content,
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      const response = await fetch('api/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      const data = await response.json();

      const jsonString = data.response.match(/```json\n([\s\S]*?)\n```/)?.[1];
      if (!jsonString) throw new Error('Failed to parse JSON from response');

      let parsedResult: Message[] = [];
      try {
        parsedResult = JSON.parse(jsonString);
        if (!Array.isArray(parsedResult)) {
          throw new Error('Response is not an array');
        }
      } catch (parseError) {
        console.error('Failed to parse JSON:', parseError);
        throw new Error('Invalid response format');
      }

      console.log(parsedResult);

      // Add all items from parsedResult to messages
      setMessages((prev) => [...prev, ...parsedResult]);
      setContent('');
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteMessage = (index: number) => {
    setIsDeleteMessage(true);
    setMessages((prev) => prev.filter((_, i) => i !== index));
  };

  // Effects
  useEffect(() => {
    if (isDeleteMessage) {
      setIsDeleteMessage(false);
      return;
    }
    chatContainerRef.current?.scrollIntoView(false);
  }, [messages, isDeleteMessage]);

  return (
    <div className="flex flex-col items-center justify-center max-h-screen m-2">
      <div className="flex flex-col w-full">
        <ScrollArea className="h-[calc(88vh-8rem)] p-1 mb-2">
          <div ref={chatContainerRef} className="flex flex-col w-full">
            {messages.map((message, index) => (
              <MessageCard
                key={index}
                message={message}
                onDelete={deleteMessage}
                index={index}
              />
            ))}
          </div>
        </ScrollArea>

        <form onSubmit={handleSubmit} className="flex-none flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 justify-start hover:cursor-pointer">
              <ArrowPathIcon
                onClick={() => setMessages([])}
                className="h-6 w-6"
              />
              <Label>Delete all messages</Label>
            </div>
          </div>
          <Textarea
            className="mb-2"
            value={content}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Type your message here..."
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.ctrlKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <Button disabled={loading}>
            {loading ? 'Checking...' : 'Check'}
          </Button>
        </form>
      </div>
    </div>
  );
}
