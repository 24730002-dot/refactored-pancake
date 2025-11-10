import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, X, Loader2, User } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner@2.0.3';

interface Message {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender_profile?: {
    username: string;
    profile_photo_url?: string;
  };
}

interface ChatRoom {
  id: string;
  accommodation_id: string;
  accommodation_name: string;
  guest_id: string;
  host_id?: string;
  created_at: string;
  updated_at: string;
}

interface ChatProps {
  userId: string | null;
  accommodationId?: string;
  accommodationName?: string;
}

export function Chat({ userId, accommodationId, accommodationName }: ChatProps) {
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 채팅방 생성 또는 가져오기
  const getOrCreateChatRoom = async () => {
    if (!userId || !accommodationId || !accommodationName) return;

    try {
      setIsLoading(true);

      // 기존 채팅방 확인
      const { data: existingRoom, error: fetchError } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('guest_id', userId)
        .eq('accommodation_id', accommodationId)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

      if (existingRoom) {
        setChatRoom(existingRoom);
      } else {
        // 새 채팅방 생성
        const { data: newRoom, error: createError } = await supabase
          .from('chat_rooms')
          .insert({
            accommodation_id: accommodationId,
            accommodation_name: accommodationName,
            guest_id: userId,
          })
          .select()
          .single();

        if (createError) throw createError;

        setChatRoom(newRoom);
        
        // 시스템 메시지 추가
        await supabase.from('messages').insert({
          room_id: newRoom.id,
          sender_id: userId,
          content: `${accommodationName}에 대해 문의하시겠어요? 궁금하신 점을 남겨주시면 빠르게 답변드리겠습니다! 😊`,
        });
      }
    } catch (error) {
      console.error('Error getting chat room:', error);
      toast.error('채팅방을 불러오는데 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  // 메시지 불러오기
  const fetchMessages = async (roomId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender_profile:sender_id (
            username,
            profile_photo_url
          )
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(data || []);
      
      // 스크롤을 맨 아래로
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  // 채팅방이 열릴 때 메시지 불러오기
  useEffect(() => {
    if (isOpen && chatRoom) {
      fetchMessages(chatRoom.id);
    }
  }, [isOpen, chatRoom]);

  // 실시간 메시지 구독
  useEffect(() => {
    if (!chatRoom) return;

    const channel = supabase
      .channel(`chat:${chatRoom.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${chatRoom.id}`,
        },
        async (payload) => {
          const newMsg = payload.new as Message;
          
          // 프로필 정보 가져오기
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, profile_photo_url')
            .eq('id', newMsg.sender_id)
            .single();

          setMessages((prev) => [
            ...prev,
            { ...newMsg, sender_profile: profile },
          ]);

          // 스크롤을 맨 아래로
          setTimeout(() => {
            scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatRoom]);

  // 메시지 전송
  const sendMessage = async () => {
    if (!chatRoom || !userId || !newMessage.trim()) return;

    try {
      setIsSending(true);

      const { error } = await supabase.from('messages').insert({
        room_id: chatRoom.id,
        sender_id: userId,
        content: newMessage.trim(),
      });

      if (error) throw error;

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('메시지 전송에 실패했습니다');
    } finally {
      setIsSending(false);
    }
  };

  // 시간 포맷팅
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else {
      return date.toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  if (!userId) return null;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          onClick={() => {
            if (!chatRoom) {
              getOrCreateChatRoom();
            }
          }}
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          문의하기
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            {accommodationName || '숙소 문의'}
          </SheetTitle>
          {chatRoom && (
            <p className="text-sm text-muted-foreground">
              호스트에게 문의해보세요
            </p>
          )}
        </SheetHeader>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* 메시지 목록 */}
            <ScrollArea className="flex-1 p-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    메시지가 없습니다
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    첫 메시지를 보내보세요!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => {
                    const isOwn = message.sender_id === userId;
                    const profile = message.sender_profile as any;

                    return (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${
                          isOwn ? 'flex-row-reverse' : 'flex-row'
                        }`}
                      >
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarImage src={profile?.profile_photo_url} />
                          <AvatarFallback>
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div
                          className={`flex flex-col gap-1 max-w-[70%] ${
                            isOwn ? 'items-end' : 'items-start'
                          }`}
                        >
                          <div
                            className={`rounded-lg px-3 py-2 ${
                              isOwn
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words">
                              {message.content}
                            </p>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatTime(message.created_at)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={scrollRef} />
                </div>
              )}
            </ScrollArea>

            {/* 메시지 입력 */}
            <div className="p-4 border-t">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage();
                }}
                className="flex gap-2"
              >
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="메시지를 입력하세요..."
                  disabled={isSending}
                  className="flex-1"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!newMessage.trim() || isSending}
                >
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

// 채팅 목록 컴포넌트
interface ChatListProps {
  userId: string | null;
  onChatClick?: (roomId: string) => void;
}

export function ChatList({ userId, onChatClick }: ChatListProps) {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchChatRooms = async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('guest_id', userId)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      setChatRooms(data || []);
    } catch (error) {
      console.error('Error fetching chat rooms:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChatRooms();
  }, [userId]);

  if (!userId) return null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (chatRooms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">대화 내역이 없습니다</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {chatRooms.map((room) => (
        <Card
          key={room.id}
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => onChatClick?.(room.id)}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <MessageCircle className="h-5 w-5 text-primary" />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {room.accommodation_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {new Date(room.updated_at).toLocaleDateString('ko-KR')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
