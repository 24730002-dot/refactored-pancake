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

  // 즐겨찾기 목록 불러오기
  const fetchFavorites = async () => {
    try {
      setIsLoading(true);
      
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
      
      if (isAuthenticated && userId) {
        // 인증된 사용자 - Supabase 시도 후 실패시 localStorage
        try {
          const { data, error } = await supabase
            .from('favorites')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

          if (!error && data) {
            setFavorites(data);
          } else {
            console.log('Supabase fetch failed, using localStorage:', error);
            setFavorites(loadFromLocalStorage());
          }
        } catch (error) {
          console.log('Supabase fetch error, using localStorage:', error);
          setFavorites(loadFromLocalStorage());
        }
      } else {
        // 게스트 사용자 - localStorage에서 가져오기
        setFavorites(loadFromLocalStorage());
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
      setFavorites([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
    
    // 즐겨찾기 변경 이벤트 리스너
    const handleFavoritesChanged = () => {
      fetchFavorites();
    };
    
    window.addEventListener('favoritesChanged', handleFavoritesChanged);
    
    return () => {
      window.removeEventListener('favoritesChanged', handleFavoritesChanged);
    };
  }, [userId, isAuthenticated]);

  // 즐겨찾기 삭제
  const removeFavorite = async (favoriteId: string) => {
    try {
      const removeFromLocalStorage = () => {
        const favoritesJson = localStorage.getItem('petfriendly_favorites');
        let favorites: string[] = favoritesJson ? JSON.parse(favoritesJson) : [];
        favorites = favorites.filter(id => id !== favoriteId);
        localStorage.setItem('petfriendly_favorites', JSON.stringify(favorites));

        const favoritesDataJson = localStorage.getItem('petfriendly_favorites_data');
        let favoritesData = favoritesDataJson ? JSON.parse(favoritesDataJson) : [];
        favoritesData = favoritesData.filter((f: any) => f.id !== favoriteId);
        localStorage.setItem('petfriendly_favorites_data', JSON.stringify(favoritesData));
      };

      if (isAuthenticated && userId) {
        // 인증된 사용자 - Supabase 시도 후 실패시에도 localStorage 업데이트
        try {
          const { error } = await supabase
            .from('favorites')
            .delete()
            .eq('id', favoriteId);

          if (error) {
            console.log('Supabase delete failed, using localStorage:', error);
          }
        } catch (error) {
          console.log('Supabase delete error, using localStorage:', error);
        }
        
        // 항상 localStorage도 업데이트
        removeFromLocalStorage();
      } else {
        // 게스트 사용자 - localStorage에서 삭제
        removeFromLocalStorage();
      }

      setFavorites((prev) => prev.filter((f) => f.id !== favoriteId));
      toast.success('즐겨찾기에서 제거했습니다');
      
      // 즐겨찾기 변경 이벤트 발송
      window.dispatchEvent(new CustomEvent('favoritesChanged'));
    } catch (error) {
      console.error('Error removing favorite:', error);
      toast.error('즐겨찾기 제거에 실패했습니다');
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
                    src={data.image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'}
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

// 즐겨찾기 추가/제거 토글 버튼 컴포넌트
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

  // 즐겨찾기 상태 확인
  const checkFavorite = async () => {
    if (isAuthenticated && userId) {
      // 인증된 사용자 - Supabase에서 확인 (테이블이 없으면 localStorage로 폴백)
      try {
        const { data, error } = await supabase
          .from('favorites')
          .select('id')
          .eq('user_id', userId)
          .eq('accommodation_id', accommodationId)
          .maybeSingle();

        if (error) {
          // 테이블이 없으면 localStorage 사용
          if (error.code === '42P01') {
            const favoritesJson = localStorage.getItem('petfriendly_favorites');
            const favorites: string[] = favoritesJson ? JSON.parse(favoritesJson) : [];
            setIsFavorite(favorites.includes(accommodationId));
            return;
          }
          if (error.code !== 'PGRST116') throw error;
        }

        setIsFavorite(!!data);
      } catch (error) {
        console.error('Error checking favorite:', error);
        // Fallback to localStorage
        const favoritesJson = localStorage.getItem('petfriendly_favorites');
        const favorites: string[] = favoritesJson ? JSON.parse(favoritesJson) : [];
        setIsFavorite(favorites.includes(accommodationId));
      }
    } else {
      // 게스트 사용자 - localStorage에서 확인
      const favoritesJson = localStorage.getItem('petfriendly_favorites');
      const favorites: string[] = favoritesJson ? JSON.parse(favoritesJson) : [];
      setIsFavorite(favorites.includes(accommodationId));
    }
  };

  useEffect(() => {
    checkFavorite();
  }, [userId, accommodationId, isAuthenticated]);

  // 즐겨찾기 토글
  const toggleFavorite = async () => {
    try {
      setIsLoading(true);

      // localStorage 업데이트 함수
      const updateLocalStorage = () => {
        const favoritesJson = localStorage.getItem('petfriendly_favorites');
        let favorites: string[] = favoritesJson ? JSON.parse(favoritesJson) : [];
        
        const favoritesDataJson = localStorage.getItem('petfriendly_favorites_data');
        let favoritesData: any[] = favoritesDataJson ? JSON.parse(favoritesDataJson) : [];

        if (isFavorite) {
          // 즐겨찾기 제거
          favorites = favorites.filter(id => id !== accommodationId);
          favoritesData = favoritesData.filter(f => f.id !== accommodationId);
          setIsFavorite(false);
          toast.success('즐겨찾기에서 제거했습니다');
        } else {
          // 즐겨찾기 추가
          favorites.push(accommodationId);
          favoritesData.push({
            id: accommodationId,
            name: accommodationName,
            data: accommodationData,
            created_at: new Date().toISOString()
          });
          setIsFavorite(true);
          toast.success('즐겨찾기에 추가했습니다');
        }

        localStorage.setItem('petfriendly_favorites', JSON.stringify(favorites));
        localStorage.setItem('petfriendly_favorites_data', JSON.stringify(favoritesData));
        
        // 즐겨찾기 변경 이벤트 발송
        window.dispatchEvent(new CustomEvent('favoritesChanged'));
      };

      if (isAuthenticated && userId) {
        // 인증된 사용자 - Supabase 시도 후 실패시 localStorage 사용
        let supabaseSuccess = false;
        
        try {
          if (isFavorite) {
            // 즐겨찾기 제거
            const { error } = await supabase
              .from('favorites')
              .delete()
              .eq('user_id', userId)
              .eq('accommodation_id', accommodationId);

            if (!error) {
              supabaseSuccess = true;
            } else {
              console.log('Supabase delete failed, using localStorage:', error);
            }
          } else {
            // 즐겨찾기 추가
            const { error } = await supabase.from('favorites').insert({
              user_id: userId,
              accommodation_id: accommodationId,
              accommodation_name: accommodationName,
              accommodation_data: accommodationData,
            });

            if (!error) {
              supabaseSuccess = true;
            } else {
              console.log('Supabase insert failed, using localStorage:', error);
            }
          }
        } catch (error) {
          console.log('Supabase operation failed, using localStorage:', error);
        }

        // 항상 localStorage도 업데이트 (폴백 및 동기화)
        updateLocalStorage();
      } else {
        // 게스트 사용자 - localStorage만 사용
        updateLocalStorage();
      }
    } catch (error: any) {
      console.error('Error toggling favorite:', error);
      toast.error('즐겨찾기 처리에 실패했습니다');
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
      <Heart
        className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`}
      />
    </Button>
  );
}
