import React, { useState } from 'react';
import { Bot, Send, Sparkles, Lightbulb, TrendingUp, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIMessage {
  id: string;
  content: string;
  isAI: boolean;
  timestamp: Date;
}

const AICoach: React.FC = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: '1',
      content: 'Привет! Я твой AI-наставник в NovaBoost. 🚀\n\nЯ помогу тебе:\n• Анализировать твой прогресс\n• Давать персональные советы\n• Отвечать на вопросы о стриминге\n• Подсказывать следующие шаги\n\nО чём хочешь поговорить?',
      isAI: true,
      timestamp: new Date(),
    },
  ]);

  const quickActions = [
    { icon: TrendingUp, label: 'Анализ прогресса', prompt: 'Проанализируй мой прогресс за последнюю неделю' },
    { icon: Lightbulb, label: 'Советы на сегодня', prompt: 'Дай мне советы на сегодняшний стрим' },
    { icon: MessageSquare, label: 'Работа с чатом', prompt: 'Как лучше взаимодействовать с чатом?' },
    { icon: Sparkles, label: 'Идеи контента', prompt: 'Предложи идеи для нового контента' },
  ];

  const handleSend = () => {
    if (!message.trim()) return;

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      content: message,
      isAI: false,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage('');

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: AIMessage = {
        id: (Date.now() + 1).toString(),
        content: getAIResponse(message),
        isAI: true,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  const getAIResponse = (input: string): string => {
    const responses = [
      'Отличный вопрос! Судя по твоему прогрессу, ты на правильном пути. Рекомендую сосредоточиться на увеличении времени стримов до 3-4 часов — это оптимально для роста аудитории.',
      'Я вижу, что у тебя streak уже 7 дней — это здорово! 🔥 Продолжай в том же духе. Для следующего уровня тебе нужно ещё 550 XP — это примерно 2-3 выполненных задания.',
      'Хороший вопрос! Для работы с чатом советую: отвечать на первые сообщения новых зрителей, создавать интерактивные моменты каждые 15-20 минут, использовать ник зрителя при ответе.',
      'Интересная идея! Попробуй формат "вопрос-ответ" в начале стрима — это отлично вовлекает аудиторию и создаёт контакт с чатом.',
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleQuickAction = (prompt: string) => {
    setMessage(prompt);
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-gradient-cosmic shadow-glow">
          <Bot className="w-7 h-7 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold">AI Coach</h1>
          <p className="text-muted-foreground">Твой персональный наставник</p>
        </div>
        <div className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/20 text-success text-sm">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          Онлайн
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {quickActions.map((action, index) => (
          <button
            key={index}
            onClick={() => handleQuickAction(action.prompt)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-border hover:border-primary/50 hover:bg-primary/10 transition-all text-sm"
          >
            <action.icon className="w-4 h-4 text-primary" />
            {action.label}
          </button>
        ))}
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col rounded-xl glass border border-border overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex gap-4",
                !msg.isAI && "flex-row-reverse"
              )}
            >
              {msg.isAI && (
                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-cosmic shrink-0">
                  <Bot className="w-5 h-5 text-primary-foreground" />
                </div>
              )}
              <div className={cn(
                "max-w-[75%] p-4 rounded-2xl",
                msg.isAI 
                  ? "bg-secondary/80 text-foreground rounded-tl-sm" 
                  : "bg-primary text-primary-foreground rounded-tr-sm"
              )}>
                <p className="text-sm whitespace-pre-line">{msg.content}</p>
                <p className={cn(
                  "text-[10px] mt-2",
                  msg.isAI ? "text-muted-foreground" : "text-primary-foreground/70"
                )}>
                  {msg.timestamp.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Спроси что-нибудь..."
              className="flex-1 px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary focus:outline-none transition-colors"
            />
            <button 
              onClick={handleSend}
              className="p-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-glow"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            AI Coach использует данные твоего профиля для персонализированных советов
          </p>
        </div>
      </div>
    </div>
  );
};

export default AICoach;
