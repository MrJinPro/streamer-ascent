import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface SendMessageButtonProps {
  targetUserId: string;
  className?: string;
  variant?: 'default' | 'ghost' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'icon';
  label?: string;
}

const SendMessageButton: React.FC<SendMessageButtonProps> = ({
  targetUserId,
  className,
  variant = 'outline',
  size = 'sm',
  label = 'Написать',
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Don't show button for own profile or if not logged in
  if (!user || user.id === targetUserId) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/chat?dm=${targetUserId}`);
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={cn('gap-1.5', className)}
      onClick={handleClick}
    >
      <MessageCircle className="w-3.5 h-3.5" />
      {size !== 'icon' && <span>{label}</span>}
    </Button>
  );
};

export default SendMessageButton;
