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
  id: string;
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

export function Favorites({ userId, isAuthenticated = true, onAccommodationClick }: FavoritesProps) {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // ⭐ React 강제 리렌더 — 핵심
  const forceUpdate = React.useReducer(() => ({}), {})[1];

  // localStorage → Favorite[] 형태로 변환
  const loadFromLocalStorage = () => {
    const favoritesDataJson = localStorage.getItem('petfriendly_favorites_data');
    const favoritesData = favoritesDataJson ? JSON.parse(favoritesDataJson) : [];

    return favoritesData.map((item: any) => ({
      id: item.id,
      accommodation_id: item.id,
      accommodation_name: item.name,
      accommodation_data: item.data,
      created_at: item.created_at
    }));
  };

  // 즐겨찾기 불러오기
  const fetchFavorites = async () => {
    try {
      setIsLoading(true);

      if (isAuthenticated && userId) {
        // 로그인 사용자 → Supabase 먼저 시도
        try {
          const { data, error } = await supabase
            .from('favorites')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

          if (!error && data) {
            setFavorites(data);
          } else {
            console.log('Supabase failed, fallback to localStorage');
            setFavorites(loadFromLocalStorage());
          }
        } catch (e) {
          console.log('Supabase exception, fallback local');
          setFavorites(loadFromLocalStorage());
        }
      } else {
        // 비로그인 사용자 → localStorage만 사용
        setFavorites(loadFromLocalStorage());
      }
    } catch (err) {
      console.error('Error fetching favorites:', err);
      setFavorites([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();

    const handleFavoritesChanged = () => {
      fetchFavorites();
      forceUpdate(); // ⭐ 여기서도 리렌더
    };

    window.addEventListener('favoritesChanged', handleFavoritesChanged);
    return () => window.removeEventListener('favoritesChanged', handleFavoritesChanged);
  }, [userId, isAuthenticated]);

  // ⭐ 즐겨찾기 삭제 (즉시 반영 포함)
  const removeFavorite = async (favoriteId: string) => {
    try {
      // localStorage 삭제
      const removeFromLocal = () => {
        const idsJson = localStorage.getItem('petfriendly_favorites');
        let ids = idsJson ? JSON.parse(idsJson) : [];
        ids = ids.filter((id: string) => id !== favoriteId);
        localStorage.setItem('petfriendly_favorites', JSON.stringify(ids));

        const dataJson = localStorage.getItem('petfriendly_favorites_data');
        let data = dataJson ? JSON.parse(dataJson) : [];
        data = data.filter((f: any) => f.id !== favoriteId);
        localStorage.setItem('petfriendly_favorites_data', JSON.stringify(data));
      };

      if (isAuthenticated && userId) {
        try {
          const { error } = await supabase
            .from('favorites')
            .delete()
            .eq('id', favoriteId);

          if (error) console.log('Supabase delete failed');
        } catch (e) {
          console.log('Supabase delete exception');
        }

        removeFromLocal();
      } else {
        removeFromLocal();
      }

      setFavorites((prev) => prev.filter((f) => f.id !== favoriteId));

      toast.success('즐겨찾기에서 제거했습니다');

      // ⭐ 즉시 갱신
      window.dispatchEvent(new CustomEvent('favoritesChanged'));
      forceUpdate();
    } catch (err) {
      console.error('Error removing favorite:', err);
      toast.error('삭제 실패');
    }
  };
  if (!userId) {
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
        {favorites.map((favorite) => {
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
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFavorite(favorite.id);
                    }}
                  >
                    <Heart className="h-4 w-4 fill-red-500 text-red-500" />
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

  // ⭐ 강제 렌더링 추가
  const forceUpdate = React.useReducer(() => ({}), {})[1];

  // 좋아요 상태 체크
  const checkFavorite = async () => {
    try {
      if (isAuthenticated && userId) {
        const { data, error } = await supabase
          .from('favorites')
          .select('id')
          .eq('user_id', userId)
          .eq('accommodation_id', accommodationId)
          .maybeSingle();

        if (data) {
          setIsFavorite(true);
        } else {
          const ls = localStorage.getItem('petfriendly_favorites');
          const arr = ls ? JSON.parse(ls) : [];
          setIsFavorite(arr.includes(accommodationId));
        }
      } else {
        const ls = localStorage.getItem('petfriendly_favorites');
        const arr = ls ? JSON.parse(ls) : [];
        setIsFavorite(arr.includes(accommodationId));
      }
    } catch {
      const ls = localStorage.getItem('petfriendly_favorites');
      const arr = ls ? JSON.parse(ls) : [];
      setIsFavorite(arr.includes(accommodationId));
    }
  };

  useEffect(() => {
    checkFavorite();
  }, [userId, accommodationId, isAuthenticated]);

  // 좋아요 토글
  const toggleFavorite = async () => {
    setIsLoading(true);
    try {
      const updateLocal = () => {
        const idsJson = localStorage.getItem('petfriendly_favorites');
        let ids = idsJson ? JSON.parse(idsJson) : [];

        const dataJson = localStorage.getItem('petfriendly_favorites_data');
        let dataArr = dataJson ? JSON.parse(dataJson) : [];

        if (isFavorite) {
          ids = ids.filter((id: string) => id !== accommodationId);
          dataArr = dataArr.filter((f: any) => f.id !== accommodationId);
          setIsFavorite(false);
        } else {
          ids.push(accommodationId);
          dataArr.push({
            id: accommodationId,
            name: accommodationName,
            data: accommodationData,
            created_at: new Date().toISOString()
          });
          setIsFavorite(true);
        }

        localStorage.setItem('petfriendly_favorites', JSON.stringify(ids));
        localStorage.setItem('petfriendly_favorites_data', JSON.stringify(dataArr));

        window.dispatchEvent(new CustomEvent('favoritesChanged'));
        forceUpdate(); // ⭐ 즉시 렌더링!
      };

      if (isAuthenticated && userId) {
        try {
          if (isFavorite) {
            await supabase
              .from('favorites')
              .delete()
              .eq('user_id', userId)
              .eq('accommodation_id', accommodationId);
          } else {
            await supabase.from('favorites').insert({
              user_id: userId,
              accommodation_id: accommodationId,
              accommodation_name: accommodationName,
              accommodation_data: accommodationData,
            });
          }
        } catch {
          // 실패해도 local로 처리됨
        }
        updateLocal();
      } else {
        updateLocal();
      }
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
