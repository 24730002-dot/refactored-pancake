import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { SearchAndFilter, FilterOptions } from './SearchAndFilter';
import { FavoriteButton } from './Favorites';
import { ShareButton } from './ShareButton';
import { Dog, Cat, Bird, Rabbit, Wifi, Car, Home, Trees, Heart, Star, MapPin, Phone, Mail, Search, SlidersHorizontal, Facebook, Twitter, Instagram, Youtube } from 'lucide-react';

interface Accommodation {
  id: number;
  name: string;
  location: string;
  description: string;
  petTypes: ('dog' | 'cat' | 'bird' | 'small' | 'all')[];
  amenities: string[];
  pricePerNight: number;
  rating: number;
  imageUrl: string;
  maxPets: number;
  phone: string;
  email: string;
}

export const accommodations: Accommodation[] = [
  {
    id: 1,
    name: "코지 펫 리조트",
    location: "제주도, 서귀포시",
    description: "넓은 마당과 함께하는 프라이빗 숙소입니다. 반려견이 자유롭게 뛰어놀 수 있는 공간과 함께 편안한 휴식을 제공합니다. 제주도의 아름다운 자연을 만끽하며 특별한 시간을 보내세요.",
    petTypes: ['dog', 'cat'],
    amenities: ['WiFi', '전용 정원', '무료 주차', '반려동물 용품', '산책로', 'BBQ 시설'],
    pricePerNight: 150000,
    rating: 4.9,
    imageUrl: "https://images.unsplash.com/photo-1592901147824-212145b050cf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3p5JTIwcGV0JTIwZnJpZW5kbHklMjBob3RlbCUyMHJvb218ZW58MXx8fHwxNzYyNTE4ODU0fDA&ixlib=rb-4.1.0&q=80&w=1080",
    maxPets: 3,
    phone: "064-123-4567",
    email: "cozy@petresort.com"
  },
  {
    id: 2,
    name: "럭셔리 도그 하우스",
    location: "강원도, 강릉시",
    description: "럭셔리한 인테리어와 함께하는 프리미엄 반려동물 숙소입니다. 대형견도 환영하며, 전문 펫시터 서비스도 이용 가능합니다. 바다 전망과 함께 최상의 휴양을 경험하세요.",
    petTypes: ['dog'],
    amenities: ['WiFi', '오션뷰', '펫시터 서비스', '무료 주차', '반려동물 수영장', '24시간 컨시어지'],
    pricePerNight: 250000,
    rating: 5.0,
    imageUrl: "https://images.unsplash.com/photo-1651571473498-209522176a7e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBkb2clMjBmcmllbmRseSUyMGFjY29tbW9kYXRpb258ZW58MXx8fHwxNzYyNTE4ODU0fDA&ixlib=rb-4.1.0&q=80&w=1080",
    maxPets: 2,
    phone: "033-456-7890",
    email: "luxury@doghouse.com"
  },
  {
    id: 3,
    name: "캣 프렌들리 아파트",
    location: "서울, 강남구",
    description: "고양이 친화적인 공간 디자인으로 꾸며진 도심 속 휴식처입니다. 캣타워와 스크래처가 구비되어 있으며, 조용하고 안전한 환경을 제공합니다.",
    petTypes: ['cat'],
    amenities: ['WiFi', '캣타워', '스크래처', '무료 주차', '조용한 환경', '고급 침구'],
    pricePerNight: 120000,
    rating: 4.8,
    imageUrl: "https://images.unsplash.com/photo-1587280963766-6f31d3647a1f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXQlMjBmcmllbmRseSUyMGFwYXJ0bWVudCUyMGludGVyaW9yfGVufDF8fHx8MTc2MjUxODg1NXww&ixlib=rb-4.1.0&q=80&w=1080",
    maxPets: 2,
    phone: "02-789-0123",
    email: "catfriendly@apartment.com"
  },
  {
    id: 4,
    name: "포레스트 펫 코티지",
    location: "경기도, 가평군",
    description: "숲 속에 위치한 아늑한 펫 코티지입니다. 자연과 함께하는 힐링 공간으로 모든 종류의 반려동물을 환영합니다. 넓은 숲길 산책로와 개울가에서 특별한 추억을 만드세요.",
    petTypes: ['all'],
    amenities: ['WiFi', '숲길 산책로', '개울', '무료 주차', '반려동물 놀이터', '캠프파이어'],
    pricePerNight: 180000,
    rating: 4.7,
    imageUrl: "https://images.unsplash.com/photo-1760434875920-2b7a79ea163a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXQlMjBmcmllbmRseSUyMGNvdHRhZ2V8ZW58MXx8fHwxNzYyNTE4ODU1fDA&ixlib=rb-4.1.0&q=80&w=1080",
    maxPets: 4,
    phone: "031-234-5678",
    email: "forest@petcottage.com"
  },
  {
    id: 5,
    name: "버드 프렌들리 스튜디오",
    location: "경기도, 수원시",
    description: "조용하고 채광이 좋은 조류 친화적 숙소입니다. 넓은 케이지 공간과 함께 새들이 편안하게 지낼 수 있도록 설계되었습니다. 소음이 적고 환기가 잘 되는 환경을 제공합니다.",
    petTypes: ['bird'],
    amenities: ['WiFi', '조용한 환경', '우수한 환기', '자연광', '무료 주차', '새 전용 케이지'],
    pricePerNight: 90000,
    rating: 4.6,
    imageUrl: "https://images.unsplash.com/photo-1663999082401-2bb508fab2e2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiaXJkJTIwYXZpYXJ5JTIwcm9vbXxlbnwxfHx8fDE3NjI1MTkzMzJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
    maxPets: 3,
    phone: "031-567-8901",
    email: "bird@studio.com"
  },
  {
    id: 6,
    name: "스몰 펫 가든 하우스",
    location: "충청남도, 천안시",
    description: "토끼, 햄스터, 기니피그 등 소형 반려동물을 위한 특별한 공간입니다. 안전한 정원에서 자유롭게 활동할 수 있으며, 실내외 모두 반려동물 친화적으로 꾸며져 있습니다.",
    petTypes: ['small'],
    amenities: ['WiFi', '안전한 정원', '실내 놀이공간', '무료 주차', '소형 펫 용품', '온도 조절'],
    pricePerNight: 100000,
    rating: 4.8,
    imageUrl: "https://images.unsplash.com/photo-1674513235396-6a1d91aae4f1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzbWFsbCUyMHBldCUyMHJhYmJpdCUyMGFjY29tbW9kYXRpb258ZW58MXx8fHwxNzYyNTE5MzMyfDA&ixlib=rb-4.1.0&q=80&w=1080",
    maxPets: 5,
    phone: "041-890-1234",
    email: "smallpet@garden.com"
  },
  {
    id: 7,
    name: "해운대 펫 리조트",
    location: "부산광역시, 해운대구",
    description: "해변과 인접한 프리미엄 펫 리조트입니다. 반려동물과 함께 바다를 즐길 수 있으며, 전용 비치와 수영장이 마련되어 있습니다. 신선한 해산물 요리와 함께 특별한 휴가를 보내세요.",
    petTypes: ['dog', 'cat'],
    amenities: ['WiFi', '전용 비치', '펫 수영장', '무료 주차', '레스토랑', '해변 산책로'],
    pricePerNight: 280000,
    rating: 4.9,
    imageUrl: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZWFjaCUyMGhvdGVsJTIwcm9vbXxlbnwxfHx8fDE3NjI1MTkzMzJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
    maxPets: 2,
    phone: "051-123-4567",
    email: "haeundae@petresort.com"
  },
  {
    id: 8,
    name: "송도 펫 호텔",
    location: "인천광역시, 연수구",
    description: "현대적인 시설과 함께하는 도심형 펫 호텔입니다. 센트럴파크와 가까워 산책하기 좋으며, 최신식 펫 케어 시설을 갖추고 있습니다. 비즈니스 출장객들에게도 인기가 많습니다.",
    petTypes: ['dog', 'cat', 'small'],
    amenities: ['WiFi', '공원 인접', '펫 스파', '무료 주차', '24시간 서비스', '펫시터 이용 가능'],
    pricePerNight: 160000,
    rating: 4.7,
    imageUrl: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBob3RlbCUyMHJvb218ZW58MXx8fHwxNzYyNTE5MzMyfDA&ixlib=rb-4.1.0&q=80&w=1080",
    maxPets: 3,
    phone: "032-456-7890",
    email: "songdo@pethotel.com"
  },
  {
    id: 9,
    name: "팔공산 힐링 펜션",
    location: "대구광역시, 동구",
    description: "산 속에 자리한 힐링 펜션으로 반려동물과 함께 자연을 만끽할 수 있습니다. 등산로가 인접해 있어 트레킹을 즐기기 좋으며, 맑은 공기와 조용한 환경이 매력적입니다.",
    petTypes: ['dog', 'cat'],
    amenities: ['WiFi', '등산로', '마당', '무료 주차', 'BBQ 시설', '족욕탕'],
    pricePerNight: 130000,
    rating: 4.6,
    imageUrl: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3VudGFpbiUyMGNhYmluJTIwaW50ZXJpb3J8ZW58MXx8fHwxNzYyNTE5MzMyfDA&ixlib=rb-4.1.0&q=80&w=1080",
    maxPets: 2,
    phone: "053-789-0123",
    email: "palgong@pension.com"
  },
  {
    id: 10,
    name: "전주 한옥 펫 스테이",
    location: "전라북도, 전주시",
    description: "전통 한옥의 아름다움과 반려동물 친화적 시설이 조화를 이룬 특별한 숙소입니다. 한옥마을과 가까워 전통문화를 체험하기 좋으며, 마당에서 반려동물이 자유롭게 뛰어놀 수 있습니다.",
    petTypes: ['dog', 'cat', 'small'],
    amenities: ['WiFi', '전통 한옥', '넓은 마당', '무료 주차', '한옥마을 인접', '온돌방'],
    pricePerNight: 140000,
    rating: 4.8,
    imageUrl: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxrb3JlYW4lMjB0cmFkaXRpb25hbCUyMGhvdXNlfGVufDF8fHx8MTc2MjUxOTMzMnww&ixlib=rb-4.1.0&q=80&w=1080",
    maxPets: 3,
    phone: "063-234-5678",
    email: "jeonju@hanok.com"
  },
  {
    id: 11,
    name: "여수 오션뷰 빌라",
    location: "전라남도, 여수시",
    description: "바다가 한눈에 내려다보이는 펫 프렌들리 빌라입니다. 일출과 일몰을 감상할 수 있는 테라스가 있으며, 반려동물과 함께 해변 산책을 즐길 수 있습니다. 신선한 해산물 맛집이 근처에 있습니다.",
    petTypes: ['dog', 'cat'],
    amenities: ['WiFi', '오션뷰 테라스', '해변 접근', '무료 주차', '야외 샤워장', '조식 제공'],
    pricePerNight: 200000,
    rating: 4.9,
    imageUrl: "https://images.unsplash.com/photo-1582719508461-905c673771fd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvY2VhbiUyMHZpZXclMjB2aWxsYXxlbnwxfHx8fDE3NjI1MTkzMzJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
    maxPets: 2,
    phone: "061-567-8901",
    email: "yeosu@villa.com"
  },
  {
    id: 12,
    name: "경주 역사공원 펫 하우스",
    location: "경상북도, 경주시",
    description: "천년 고도 경주에서 반려동물과 함께하는 역사 여행. 대릉원, 첨성대 등 주요 관광지와 가까우며, 넓은 정원에서 산책을 즐길 수 있습니다. 고즈넉한 분위기 속에서 휴식을 취하세요.",
    petTypes: ['dog', 'cat', 'small'],
    amenities: ['WiFi', '정원', '관광지 인접', '무료 주차', '자전거 대여', '펫 용품 제공'],
    pricePerNight: 110000,
    rating: 4.7,
    imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoaXN0b3JpYyUyMGdhcmRlbiUyMGhvdXNlfGVufDF8fHx8MTc2MjUxOTMzMnww&ixlib=rb-4.1.0&q=80&w=1080",
    maxPets: 4,
    phone: "054-890-1234",
    email: "gyeongju@house.com"
  },
  {
    id: 13,
    name: "속초 설악 펫 캠핑장",
    location: "강원도, 속초시",
    description: "설악산 자락에 위치한 캠핑장형 숙소입니다. 반려동물과 함께 캠핑을 즐길 수 있으며, 편의시설이 잘 갖춰져 있어 초보자도 편하게 이용할 수 있습니다. 계곡물에서 더위를 식힐 수 있습니다.",
    petTypes: ['all'],
    amenities: ['WiFi', '캠핑 시설', '계곡', '무료 주차', '샤워장', '매점'],
    pricePerNight: 80000,
    rating: 4.5,
    imageUrl: "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYW1waW5nJTIwc2l0ZXxlbnwxfHx8fDE3NjI1MTkzMzJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
    maxPets: 5,
    phone: "033-123-4567",
    email: "sokcho@camping.com"
  },
  {
    id: 14,
    name: "남이섬 펫 카페 스테이",
    location: "강원도, 춘천시",
    description: "남이섬과 가까운 독특한 컨셉의 펫 카페 겸 숙소입니다. 1층은 펫 카페로 운영되며, 2층은 숙박 공간으로 제공됩니다. 다양한 반려동물 친구들을 만날 수 있는 특별한 경험을 선사합니다.",
    petTypes: ['dog', 'cat', 'bird', 'small'],
    amenities: ['WiFi', '펫 카페', '관광지 인접', '무료 주차', '반려동물 놀이방', '간식 제공'],
    pricePerNight: 120000,
    rating: 4.6,
    imageUrl: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3p5JTIwY2FmZSUyMGludGVyaW9yfGVufDF8fHx8MTc2MjUxOTMzMnww&ixlib=rb-4.1.0&q=80&w=1080",
    maxPets: 3,
    phone: "033-456-7890",
    email: "nami@cafe.com"
  },
  {
    id: 15,
    name: "담양 죽녹원 펫 스테이",
    location: "전라남도, 담양군",
    description: "대나무 숲으로 유명한 담양에서 반려동물과 함께 힐링하세요. 죽녹원 산책로가 가까우며, 시원한 대나무 그늘 아래에서 편안한 시간을 보낼 수 있습니다. 조용하고 평화로운 환경입니다.",
    petTypes: ['dog', 'cat', 'small'],
    amenities: ['WiFi', '대나무숲 인접', '정원', '무료 주차', 'BBQ 시설', '자연 산책로'],
    pricePerNight: 95000,
    rating: 4.7,
    imageUrl: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYW1ib28lMjBmb3Jlc3QlMjBob3VzZXxlbnwxfHx8fDE3NjI1MTkzMzJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
    maxPets: 3,
    phone: "061-789-0123",
    email: "damyang@stay.com"
  }
];

interface AccommodationListProps {
  onViewDetail: (accommodation: Accommodation) => void;
  onReserve: (accommodation: Accommodation) => void;
  userId: string | null;
  isAuthenticated?: boolean;
}

export function AccommodationList({ onViewDetail, onReserve, userId, isAuthenticated = true }: AccommodationListProps) {
  const [filters, setFilters] = useState<FilterOptions>({
    searchQuery: '',
    location: 'all',
    minPrice: 0,
    maxPrice: 500000,
    minRating: 0,
    petSize: 'all',
    sortBy: 'recommended',
  });

  // Filter and sort accommodations
  const filteredAccommodations = accommodations
    .filter(accommodation => {
      // Search query
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchesSearch = 
          accommodation.name.toLowerCase().includes(query) ||
          accommodation.location.toLowerCase().includes(query) ||
          accommodation.description.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }
      
      // Location filter
      if (filters.location !== 'all') {
        if (!accommodation.location.includes(filters.location)) return false;
      }
      
      // Price filter
      if (accommodation.pricePerNight < filters.minPrice || 
          accommodation.pricePerNight > filters.maxPrice) {
        return false;
      }
      
      // Rating filter
      if (accommodation.rating < filters.minRating) return false;
      
      // Pet size filter (simplified - you can expand this logic)
      if (filters.petSize !== 'all') {
        // For now, just check if they accept the pet type
        // You can add more sophisticated logic based on petSize
      }
      
      return true;
    })
    .sort((a, b) => {
      switch (filters.sortBy) {
        case 'price_low':
          return a.pricePerNight - b.pricePerNight;
        case 'price_high':
          return b.pricePerNight - a.pricePerNight;
        case 'rating':
          return b.rating - a.rating;
        case 'reviews':
          // Mock - in real app would sort by review count
          return b.rating - a.rating;
        case 'recommended':
        default:
          return b.rating - a.rating;
      }
    });

  const getPetTypeIcon = (petType: string) => {
    switch(petType) {
      case 'dog':
        return <Dog className="h-4 w-4" />;
      case 'cat':
        return <Cat className="h-4 w-4" />;
      case 'bird':
        return <Bird className="h-4 w-4" />;
      case 'small':
        return <Rabbit className="h-4 w-4" />;
      case 'all':
        return (
          <div className="flex gap-1">
            <Dog className="h-4 w-4" />
            <Cat className="h-4 w-4" />
          </div>
        );
      default:
        return null;
    }
  };

  const getPetTypeLabel = (petTypes: string[]) => {
    if (petTypes.includes('all')) return '모든 반려동물';
    const labels = [];
    if (petTypes.includes('dog')) labels.push('강아지');
    if (petTypes.includes('cat')) labels.push('고양이');
    if (petTypes.includes('bird')) labels.push('조류');
    if (petTypes.includes('small')) labels.push('소형 반려동물');
    return labels.join(', ');
  };

  const getAmenityIcon = (amenity: string) => {
    if (amenity.includes('WiFi')) return <Wifi className="h-4 w-4" />;
    if (amenity.includes('주차')) return <Car className="h-4 w-4" />;
    if (amenity.includes('정원') || amenity.includes('산책로') || amenity.includes('숲')) return <Trees className="h-4 w-4" />;
    return <Home className="h-4 w-4" />;
  };

  return (
    <div className="min-h-screen bg-background py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-foreground mb-6 text-center">Pet Friendly 숙소</h1>
          
          {/* Search and Filter */}
          <SearchAndFilter onFilterChange={setFilters} />
          
          <p className="text-muted-foreground max-w-2xl mx-auto text-center mt-6">
            반려동물과 함께하는 특별한 여행을 위한 최고의 숙소를 찾아보세요. 
            모든 숙소는 반려동물 친화적인 환경과 편의시설을 갖추고 있습니다.
          </p>
        </div>

        {/* Results Count */}
        {(filters.searchQuery || filters.location !== 'all' || filters.minPrice > 0 || filters.maxPrice < 500000 || filters.minRating > 0 || filters.petSize !== 'all') ? (
          <div className="mb-4 text-center text-sm text-muted-foreground">
            {filteredAccommodations.length}개의 숙소를 찾았습니다
          </div>
        ) : null}

        {/* Accommodation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredAccommodations.length > 0 ? (
            filteredAccommodations.map((accommodation) => (
<Card
  key={accommodation.id}
  className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col h-[650px]"
>

              {/* Image Section */}
              <div className="relative h-64 overflow-hidden">
                <ImageWithFallback
                  src={accommodation.imageUrl}
                  alt={accommodation.name}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
                {/* Action Buttons */}
                <div className="absolute top-4 right-4 flex gap-2">
                  <div className="bg-background/80 backdrop-blur-sm rounded-full hover:bg-background transition-colors">
                    <ShareButton
                      title={accommodation.name}
                      description={accommodation.description}
                      variant="ghost"
                      size="icon"
                    />
                  </div>
                  <div className="bg-background/80 backdrop-blur-sm rounded-full hover:bg-background transition-colors">
                    <FavoriteButton
                      userId={userId}
                      isAuthenticated={isAuthenticated}
                      accommodationId={accommodation.id.toString()}
                      accommodationName={accommodation.name}
                      accommodationData={{
                        image: accommodation.imageUrl,
                        location: accommodation.location,
                        rating: accommodation.rating,
                        price: accommodation.pricePerNight.toLocaleString('ko-KR') + '원',
                        petFriendly: true,
                      }}
                    />
                  </div>
                </div>
                {/* Rating Badge */}
                <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm rounded-lg px-3 py-1 flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{accommodation.rating}</span>
                </div>
              </div>

              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="mb-2">{accommodation.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {accommodation.location}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-primary">₩{accommodation.pricePerNight.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">/ 박</div>
                  </div>
                </div>

                {/* Pet Types */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {accommodation.petTypes.map((type, index) => {
                    const label = 
                      type === 'all' ? '모든 반려동물' :
                      type === 'dog' ? '강아지' :
                      type === 'cat' ? '고양이' :
                      type === 'bird' ? '조류' :
                      type === 'small' ? '소형 반려동물' : type;
                    
                    return (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {getPetTypeIcon(type)}
                        <span className="text-xs">{label}</span>
                      </Badge>
                    );
                  })}
                  <Badge variant="outline" className="text-xs">
                    최대 {accommodation.maxPets}마리
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 flex flex-col flex-1">
                {/* Description */}
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {accommodation.description}
                </p>

                {/* Amenities */}
                <div>
                  <h4 className="text-sm mb-2">편의시설</h4>
                  <div className="flex flex-wrap gap-2">
                    {accommodation.amenities.map((amenity, index) => (
                      <Badge key={index} variant="outline" className="flex items-center gap-1">
                        {getAmenityIcon(amenity)}
                        <span className="text-xs">{amenity}</span>
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Contact Info */}
                <div className="pt-2 border-t space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    {accommodation.phone}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    {accommodation.email}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2 mt-auto">
                  <Button 
                    className="flex-1"
                    onClick={() => onReserve(accommodation)}
                  >
                    예약하기
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => onViewDetail(accommodation)}
                  >
                    상세보기
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">검색 조건에 맞는 숙소가 없습니다.</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => {
                  setSearchQuery('');
                  setFilterPetType('');
                }}
              >
                필터 초기화
              </Button>
            </div>
          )}
        </div>

        {/* Notice Info */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            모든 숙소는 반려동물 동반 투숙이 가능하며, 사전 예약이 필요합니다.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-muted/30 border-t border-border mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Pet Friendly</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                반려동물과 함께하는 특별한 여행을 위한 최고의 숙소 예약 플랫폼입니다.
              </p>
              <div className="flex gap-4">
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  <Facebook className="h-5 w-5" />
                </a>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  <Instagram className="h-5 w-5" />
                </a>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  <Twitter className="h-5 w-5" />
                </a>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  <Youtube className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Services */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">서비스</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                    숙소 예약
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                    펫 시터 서비스
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                    반려동물 보험
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                    여행 가이드
                  </a>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">고객지원</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                    자주 묻는 질문
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                    예약 변경/취소
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                    고객센터
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                    파트너 등록
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">문의하기</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>1588-0000</span>
                </li>
                <li className="flex items-start gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>support@petfriendly.com</span>
                </li>
                <li className="flex items-start gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>서울특별시 강남구<br />테헤란로 123</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-12 pt-8 border-t border-border">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-muted-foreground text-center md:text-left">
                © 2025 Pet Friendly. All rights reserved.
              </p>
              <div className="flex flex-wrap justify-center gap-6 text-sm">
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  이용약관
                </a>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  개인정보처리방침
                </a>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  사업자정보
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
