import React, { useState, useEffect } from 'react';
import { Heart, Trash2, MapPin, Star } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner@2.0.3';

interface Favorite {
  id: string;                 // favorites.id (bigserial이지만 string으로 받아도 됨)
  accommodation_id: string;
  accommodation_name: string;
  accommodation_data: any;
  created_at: string;
}

interface FavoritesProps {
  userId: string | null;
  isAuthenticated?: boolean;
  onAccommodationClick?: (accommodationId: string) => void;
}

export function Favorites({
  userId,
  isAuthenticated = true,
  onAccommodationClick,
}: FavoritesProps) {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchFavorites = async () => {
    if (!isAuthenticated || !userId) {
      setFavorites([]);
      return;
    }

    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching favorites:', error);
        toast.error('즐겨찾기를 불러오는 중 오류가 발생했습니다');
        setFavorites([]);
        return;
      }

      setFavorites((data || []) as Favorite[]);
    } catch (err) {
      console.error('Error fetching favorites:', err);
      setFavorites([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && userId) {
      fetchFavorites();
    } else {
      setFavorites([]);
    }

    const handleFavoritesChanged = () => {
      fetchFavorites();
    };

    window.addEventListener('favoritesChanged', handleFavoritesChanged);
    return () => window.removeEventListener('favoritesChanged', handleFavoritesChanged);
  }, [userId, isAuthenticated]);

  const removeFavorite = async (favoriteId: string) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('id', favoriteId)
        .eq('user_id', userId); // 안전하게 내 것만 삭제

      if (error) {
        console.error('Error deleting favorite:', error);
        toast.error('삭제 실패');
        return;
      }

      setFavorites(prev => prev.filter(f => f.id !== favoriteId));
      toast.success('즐겨찾기에서 제거했습니다');

      window.dispatchEvent(new CustomEvent('favoritesChanged'));
    } catch (err) {
      console.error('Error removing favorite:', err);
      toast.error('삭제 실패');
    }
  };

  if (!isAuthenticated || !userId) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Heart className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">로그인 후 이용 가능합니다</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Heart className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-2">저장된 숙소가 없습니다</p>
        <p className="text-sm text-muted-foreground">
          마음에 드는 숙소를 저장해보세요
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[600px]">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {favorites.map(favorite => {
          const data = favorite.accommodation_data || {};
          return (
            <Card
              key={favorite.id}
              className="cursor-pointer hover:shadow-lg transition-shadow group"
              onClick={() => onAccommodationClick?.(favorite.accommodation_id)}
            >
              <CardHeader className="p-0">
                <div className="relative aspect-video overflow-hidden rounded-t-lg">
                  <ImageWithFallback
                    src={
                      data.image ||
                      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'
                    }
                    alt={favorite.accommodation_name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute top-2 right-2 bg-white/90 hover:bg-white"
                    onClick={e => {
                      e.stopPropagation();
                      removeFavorite(favorite.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-4">
                <CardTitle className="text-lg mb-2">
                  {favorite.accommodation_name}
                </CardTitle>

                {data.location && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                    <MapPin className="h-4 w-4" />
                    {data.location}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  {data.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm">{data.rating}</span>
                    </div>
                  )}

                  {data.price && (
                    <div className="text-sm">
                      <span className="font-semibold">{data.price}</span>
                      <span className="text-muted-foreground">/박</span>
                    </div>
                  )}
                </div>

                {data.petFriendly && (
                  <Badge variant="secondary" className="mt-2">
                    반려동물 동반 가능
                  </Badge>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </ScrollArea>
  );
}

// ===============================
// ⭐ FavoriteButton (카드에서 하트)
// ===============================

interface FavoriteButtonProps {
  userId: string | null;
  accommodationId: string;
  accommodationName: string;
  accommodationData?: any;
  isAuthenticated?: boolean;
}

export function FavoriteButton({
  userId,
  accommodationId,
  accommodationName,
  accommodationData,
  isAuthenticated = true,
}: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const checkFavorite = async () => {
    if (!isAuthenticated || !userId) {
      setIsFavorite(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('accommodation_id', accommodationId)
        .maybeSingle();

      if (error) {
        console.error('Error checking favorite:', error);
        setIsFavorite(false);
        return;
      }

      setIsFavorite(!!data);
    } catch (err) {
      console.error('Error checking favorite:', err);
      setIsFavorite(false);
    }
  };

  useEffect(() => {
    checkFavorite();
  }, [userId, accommodationId, isAuthenticated]);

  const toggleFavorite = async () => {
    if (!isAuthenticated || !userId) {
      toast.error('로그인이 필요합니다');
      return;
    }

    setIsLoading(true);
    try {
      if (isFavorite) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', userId)
          .eq('accommodation_id', accommodationId);

        if (error) throw error;

        setIsFavorite(false);
        toast.success('즐겨찾기에서 제거했습니다');
      } else {
        const { error } = await supabase.from('favorites').insert({
          user_id: userId,
          accommodation_id: accommodationId,
          accommodation_name: accommodationName,
          accommodation_data: accommodationData,
        });

        if (error) throw error;

        setIsFavorite(true);
        toast.success('즐겨찾기에 추가했습니다');
      }

      // 리스트 컴포넌트(Favorites)가 다시 불러오도록 이벤트
      window.dispatchEvent(new CustomEvent('favoritesChanged'));
    } catch (err) {
      console.error('Error toggling favorite:', err);
      toast.error('즐겨찾기 처리 중 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={isFavorite ? 'default' : 'outline'}
      size="icon"
      onClick={toggleFavorite}
      disabled={isLoading}
    >
      <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
    </Button>
  );
}
