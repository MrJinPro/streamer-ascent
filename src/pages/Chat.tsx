import React, { useState } from 'react';
import { chatMessages, currentUser } from '@/data/mockData';
import { Send, Paperclip, Smile } from 'lucide-react';
import { cn } from '@/lib/utils';

const Chat: React.FC = () => {
  const [message, setMessage] = useState('');

  const conversations = [
    { id: '1', name: 'Анна Куратор', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Anna', lastMessage: 'Давай обсудим следующие шаги?', unread: 2, online: true },
    { id: '2', name: 'Команда поддержки', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Support', lastMessage: 'Рады помочь!', unread: 0, online: true },
    { id: '3', name: 'Общий чат', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=General', lastMessage: 'Мария: Всем привет!', unread: 5, online: false },
  ];

  return (
    <div className="h-[calc(100vh-6rem)] flex gap-6 animate-fade-in">
      {/* Conversations List */}
      <div className="w-80 flex flex-col rounded-xl glass border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="font-display font-semibold">Чаты</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={cn(
                "flex items-center gap-3 p-4 cursor-pointer transition-colors",
                conv.id === '1' ? "bg-primary/10 border-l-2 border-primary" : "hover:bg-secondary/50"
              )}
            >
              <div className="relative">
                <img src={conv.avatar} alt={conv.name} className="w-12 h-12 rounded-full" />
                {conv.online && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-card" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm truncate">{conv.name}</p>
                  {conv.unread > 0 && (
                    <span className="flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full bg-primary text-primary-foreground">
                      {conv.unread}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">{conv.lastMessage}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col rounded-xl glass border border-border overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <img 
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Anna" 
            alt="Анна Куратор" 
            className="w-10 h-10 rounded-full"
          />
          <div>
            <p className="font-medium">Анна Куратор</p>
            <p className="text-xs text-success">Онлайн</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex gap-3",
                msg.isOwn && "flex-row-reverse"
              )}
            >
              {!msg.isOwn && (
                <img src={msg.senderAvatar} alt={msg.senderName} className="w-8 h-8 rounded-full" />
              )}
              <div className={cn(
                "max-w-[70%] p-3 rounded-2xl",
                msg.isOwn 
                  ? "bg-primary text-primary-foreground rounded-br-sm" 
                  : "bg-secondary text-foreground rounded-bl-sm"
              )}>
                <p className="text-sm">{msg.content}</p>
                <p className={cn(
                  "text-[10px] mt-1",
                  msg.isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                )}>
                  {new Date(msg.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3">
            <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
              <Paperclip className="w-5 h-5" />
            </button>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Напишите сообщение..."
              className="flex-1 px-4 py-2.5 rounded-full bg-secondary border border-border focus:border-primary focus:outline-none transition-colors"
            />
            <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
              <Smile className="w-5 h-5" />
            </button>
            <button className="p-2.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
