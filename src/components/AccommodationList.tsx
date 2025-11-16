import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { SearchAndFilter, FilterOptions } from './SearchAndFilter';
import { FavoriteButton } from './Favorites';
import { ShareButton } from './ShareButton';
import {
  Dog, Cat, Bird, Rabbit,
  Wifi, Car, Home, Trees,
  Star, MapPin, Phone, Mail,
  Facebook, Twitter, Instagram, Youtube
} from 'lucide-react';

/* --- Accommodation 더미 데이터 (생략 없이 네가 올린 그대로) --- */
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

/* ------------------------------------------------------
   Accommodation 더미 데이터 (15개)
------------------------------------------------------ */


export const accommodations: Accommodation[] = [
  {
    id: 1,
    name: "코지 펫 리조트",
    location: "제주도, 서귀포시",
    description:
      "넓은 마당과 함께하는 프라이빗 숙소입니다. 반려견이 자유롭게 뛰어놀 수 있는 공간과 함께 편안한 휴식을 제공합니다. 제주도의 아름다운 자연을 만끽하며 특별한 시간을 보내세요.",
    petTypes: ["dog", "cat"],
    amenities: [
      "WiFi",
      "전용 정원",
      "무료 주차",
      "반려동물 용품",
      "산책로",
      "BBQ 시설",
    ],
    pricePerNight: 150000,
    rating: 4.9,
    imageUrl:
      "https://images.unsplash.com/photo-1592901147824-212145b050cf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg",
    maxPets: 3,
    phone: "064-123-4567",
    email: "cozy@petresort.com",
  },

  {
    id: 2,
    name: "럭셔리 도그 하우스",
    location: "강원도, 강릉시",
    description:
      "럭셔리한 인테리어와 함께하는 프리미엄 반려동물 숙소입니다. 대형견도 환영하며, 전문 펫시터 서비스도 이용 가능합니다.",
    petTypes: ["dog"],
    amenities: [
      "WiFi",
      "오션뷰",
      "펫시터 서비스",
      "무료 주차",
      "반려동물 수영장",
      "24시간 컨시어지",
    ],
    pricePerNight: 250000,
    rating: 5.0,
    imageUrl:
      "https://images.unsplash.com/photo-1651571473498-209522176a7e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg",
    maxPets: 2,
    phone: "033-456-7890",
    email: "luxury@doghouse.com",
  },

  {
    id: 3,
    name: "캣 프렌들리 아파트",
    location: "서울, 강남구",
    description:
      "고양이 친화적인 공간 디자인으로 꾸며진 도심 속 휴식처입니다.",
    petTypes: ["cat"],
    amenities: ["WiFi", "캣타워", "스크래처", "무료 주차", "조용한 환경"],
    pricePerNight: 120000,
    rating: 4.8,
    imageUrl:
      "https://images.unsplash.com/photo-1587280963766-6f31d3647a1f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg",
    maxPets: 2,
    phone: "02-789-0123",
    email: "catfriendly@apartment.com",
  },

  {
    id: 4,
    name: "포레스트 펫 코티지",
    location: "경기도, 가평군",
    description:
      "숲 속에 위치한 아늑한 펫 코티지입니다. 모든 종류의 반려동물을 환영합니다.",
    petTypes: ["all"],
    amenities: [
      "WiFi",
      "숲길 산책로",
      "개울",
      "무료 주차",
      "반려동물 놀이터",
      "캠프파이어",
    ],
    pricePerNight: 180000,
    rating: 4.7,
    imageUrl:
      "https://images.unsplash.com/photo-1760434875920-2b7a79ea163a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg",
    maxPets: 4,
    phone: "031-234-5678",
    email: "forest@petcottage.com",
  },

  {
    id: 5,
    name: "버드 프렌들리 스튜디오",
    location: "경기도, 수원시",
    description:
      "조용하고 채광이 좋은 조류 친화적 숙소입니다. 새들이 편안하게 지낼 수 있도록 설계되었습니다.",
    petTypes: ["bird"],
    amenities: ["WiFi", "조용한 환경", "우수한 환기", "자연광", "무료 주차"],
    pricePerNight: 90000,
    rating: 4.6,
    imageUrl:
      "https://images.unsplash.com/photo-1663999082401-2bb508fab2e2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg",
    maxPets: 3,
    phone: "031-567-8901",
    email: "bird@studio.com",
  },

  {
    id: 6,
    name: "스몰 펫 가든 하우스",
    location: "충청남도, 천안시",
    description:
      "소형 반려동물을 위한 안전한 정원과 실내놀이 공간이 있는 숙소입니다.",
    petTypes: ["small"],
    amenities: ["WiFi", "안전한 정원", "실내 놀이공간", "무료 주차"],
    pricePerNight: 100000,
    rating: 4.8,
    imageUrl:
      "https://images.unsplash.com/photo-1674513235396-6a1d91aae4f1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg",
    maxPets: 5,
    phone: "041-890-1234",
    email: "smallpet@garden.com",
  },

  {
    id: 7,
    name: "해운대 펫 리조트",
    location: "부산광역시, 해운대구",
    description:
      "해변과 인접한 프리미엄 펫 리조트입니다. 반려동물과 함께 바다를 즐길 수 있습니다.",
    petTypes: ["dog", "cat"],
    amenities: ["WiFi", "전용 비치", "펫 수영장", "무료 주차"],
    pricePerNight: 280000,
    rating: 4.9,
    imageUrl:
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg",
    maxPets: 2,
    phone: "051-123-4567",
    email: "haeundae@petresort.com",
  },

  {
    id: 8,
    name: "송도 펫 호텔",
    location: "인천광역시, 연수구",
    description:
      "센트럴파크와 가까운 현대식 도심형 펫 호텔입니다.",
    petTypes: ["dog", "cat", "small"],
    amenities: ["WiFi", "공원 인접", "펫 스파", "무료 주차"],
    pricePerNight: 160000,
    rating: 4.7,
    imageUrl:
      "https://images.unsplash.com/photo-1611892440504-42a792e24d32?crop=entropy&cs=tinysrgb&fit=max&fm=jpg",
    maxPets: 3,
    phone: "032-456-7890",
    email: "songdo@pethotel.com",
  },

  {
    id: 9,
    name: "팔공산 힐링 펜션",
    location: "대구광역시, 동구",
    description:
      "반려견과 함께 산 속 자연을 즐길 수 있는 힐링 펜션입니다.",
    petTypes: ["dog", "cat"],
    amenities: ["WiFi", "등산로", "마당", "무료 주차"],
    pricePerNight: 130000,
    rating: 4.6,
    imageUrl:
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg",
    maxPets: 2,
    phone: "053-789-0123",
    email: "palgong@pension.com",
  },

  {
    id: 10,
    name: "전주 한옥 펫 스테이",
    location: "전라북도, 전주시",
    description:
      "한옥 감성과 반려동물 친화적 환경이 조화를 이룬 숙소입니다.",
    petTypes: ["dog", "cat", "small"],
    amenities: ["WiFi", "전통 한옥", "넓은 마당", "무료 주차"],
    pricePerNight: 140000,
    rating: 4.8,
    imageUrl:
      "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?crop=entropy&cs=tinysrgb&fit=max&fm=jpg",
    maxPets: 3,
    phone: "063-234-5678",
    email: "jeonju@hanok.com",
  },

  {
    id: 11,
    name: "여수 오션뷰 빌라",
    location: "전라남도, 여수시",
    description:
      "바다가 한눈에 보이는 오션뷰 펫 프렌들리 빌라입니다.",
    petTypes: ["dog", "cat"],
    amenities: [
      "WiFi",
      "오션뷰 테라스",
      "해변 접근",
      "무료 주차",
      "조식 제공",
    ],
    pricePerNight: 200000,
    rating: 4.9,
    imageUrl:
      "https://images.unsplash.com/photo-1582719508461-905c673771fd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg",
    maxPets: 2,
    phone: "061-567-8901",
    email: "yeosu@villa.com",
  },

  {
    id: 12,
    name: "경주 역사공원 펫 하우스",
    location: "경상북도, 경주시",
    description:
      "경주의 주요 관광지와 가까운 반려동물 친화적 숙소입니다.",
    petTypes: ["dog", "cat", "small"],
    amenities: ["WiFi", "정원", "관광지 인접", "무료 주차"],
    pricePerNight: 110000,
    rating: 4.7,
    imageUrl:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?crop=entropy&cs=tinysrgb&fit=max&fm=jpg",
    maxPets: 4,
    phone: "054-890-1234",
    email: "gyeongju@house.com",
  },

  {
    id: 13,
    name: "속초 설악 펫 캠핑장",
    location: "강원도, 속초시",
    description:
      "설악산 자락에 위치한 반려동물 동반 캠핑장입니다.",
    petTypes: ["all"],
    amenities: ["WiFi", "캠핑 시설", "계곡", "무료 주차"],
    pricePerNight: 80000,
    rating: 4.5,
    imageUrl:
      "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg",
    maxPets: 5,
    phone: "033-123-4567",
    email: "sokcho@camping.com",
  },

  {
    id: 14,
    name: "남이섬 펫 카페 스테이",
    location: "강원도, 춘천시",
    description:
      "1층은 펫 카페, 2층은 숙소로 운영되는 독특한 구조의 펫 스테이입니다.",
    petTypes: ["dog", "cat", "bird", "small"],
    amenities: ["WiFi", "펫 카페", "관광지 인접", "무료 주차"],
    pricePerNight: 120000,
    rating: 4.6,
    imageUrl:
      "https://images.unsplash.com/photo-1554118811-1e0d58224f24?crop=entropy&cs=tinysrgb&fit=max&fm=jpg",
    maxPets: 3,
    phone: "033-456-7890",
    email: "nami@cafe.com",
  },

  {
    id: 15,
    name: "담양 죽녹원 펫 스테이",
    location: "전라남도, 담양군",
    description:
      "죽녹원 인근에서 자연을 즐길 수 있는 아늑한 펫 스테이입니다.",
    petTypes: ["dog", "cat", "small"],
    amenities: ["WiFi", "대나무숲 인접", "정원", "무료 주차"],
    pricePerNight: 95000,
    rating: 4.7,
    imageUrl:
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg",
    maxPets: 3,
    phone: "061-789-0123",
    email: "damyang@stay.com",
  },
];


/* ------------------------------------------------------ */

interface AccommodationListProps {
  onViewDetail: (accommodation: Accommodation) => void;
  onReserve: (accommodation: Accommodation) => void;
  userId: string | null;
  isAuthenticated?: boolean;
}

export function AccommodationList({
  onViewDetail,
  onReserve,
  userId,
  isAuthenticated = true,
}: AccommodationListProps) {
  const [filters, setFilters] = useState<FilterOptions>({
    searchQuery: '',
    location: 'all',
    minPrice: 0,
    maxPrice: 500000,
    minRating: 0,
    petSize: 'all',
    sortBy: 'recommended',
  });
const [filtersOpen, setFiltersOpen] = useState(false);
  // 필터 + 정렬
  const filteredAccommodations = accommodations
    .filter((accommodation) => {
      // 검색어
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matches =
          accommodation.name.toLowerCase().includes(query) ||
          accommodation.location.toLowerCase().includes(query) ||
          accommodation.description.toLowerCase().includes(query);
        if (!matches) return false;
      }

      
// 지역 필터 (완화 버전)
if (filters.location !== 'all') {
  const loc = filters.location.toLowerCase();
  const accLoc = accommodation.location.toLowerCase();

  if (!accLoc.includes(loc)) return false;
}


      // 가격
      if (
        accommodation.pricePerNight < filters.minPrice ||
        accommodation.pricePerNight > filters.maxPrice
      ) {
        return false;
      }

      // 평점
      if (accommodation.rating < filters.minRating) return false;

      // petSize는 지금은 실제 로직 없이 패스
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
          return b.rating - a.rating; // mock
        case 'recommended':
        default:
          return b.rating - a.rating;
      }
    });

  const getPetTypeIcon = (petType: string) => {
    switch (petType) {
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

  const getAmenityIcon = (amenity: string) => {
    if (amenity.includes('WiFi')) return <Wifi className="h-4 w-4" />;
    if (amenity.includes('주차')) return <Car className="h-4 w-4" />;
    if (
      amenity.includes('정원') ||
      amenity.includes('산책로') ||
      amenity.includes('숲')
    )
      return <Trees className="h-4 w-4" />;
    return <Home className="h-4 w-4" />;
  };

  const resetFilters = () => {
    setFilters({
      searchQuery: '',
      location: 'all',
      minPrice: 0,
      maxPrice: 500000,
      minRating: 0,
      petSize: 'all',
      sortBy: 'recommended',
    });
  };

  return (
    <div className="min-h-screen bg-background py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-foreground mb-6 text-center">Pet Friendly 숙소</h1>

          {/* 검색 + 필터 */}

<SearchAndFilter
  filters={filters}
  onFilterChange={setFilters}
  open={filtersOpen}
  onOpenChange={setFiltersOpen}
  onApply={() => {
    setFiltersOpen(false);  
    window.scrollTo({
      top: 550,
      behavior: "smooth",
    });
  }}
/>







          <p className="text-muted-foreground max-w-2xl mx-auto text-center mt-6">
            반려동물과 함께하는 특별한 여행을 위한 최고의 숙소를 찾아보세요.
            모든 숙소는 반려동물 친화적인 환경과 편의시설을 갖추고 있습니다.
          </p>
        </div>

        {/* 결과 개수 */}
        {(filters.searchQuery ||
          filters.location !== 'all' ||
          filters.minPrice > 0 ||
          filters.maxPrice < 500000 ||
          filters.minRating > 0 ||
          filters.petSize !== 'all') && (
          <div className="mb-4 text-center text-sm text-muted-foreground">
            {filteredAccommodations.length}개의 숙소를 찾았습니다
          </div>
        )}

        {/* 리스트 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredAccommodations.length > 0 ? (
            filteredAccommodations.map((accommodation) => (
              <Card
                key={accommodation.id}
                className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col h-[650px]"
              >
                {/* 이미지 */}
                <div className="relative h-64 overflow-hidden">
                  <ImageWithFallback
                    src={accommodation.imageUrl}
                    alt={accommodation.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />

                  {/* 공유 / 즐겨찾기 */}
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
                          price:
                            accommodation.pricePerNight.toLocaleString('ko-KR') +
                            '원',
                          petFriendly: true,
                        }}
                      />
                    </div>
                  </div>

                  {/* 평점 */}
                  <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm rounded-lg px-3 py-1 flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{accommodation.rating}</span>
                  </div>
                </div>

                {/* 본문 */}
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
                      <div className="text-primary">
                        ₩{accommodation.pricePerNight.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">/ 박</div>
                    </div>
                  </div>

                  {/* 반려동물 타입 */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {accommodation.petTypes.map((type, index) => {
                      const label =
                        type === 'all'
                          ? '모든 반려동물'
                          : type === 'dog'
                          ? '강아지'
                          : type === 'cat'
                          ? '고양이'
                          : type === 'bird'
                          ? '조류'
                          : '소형 반려동물';

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
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {accommodation.description}
                </p>

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

                <div className="flex gap-2 pt-2 mt-auto">
                  <Button className="flex-1" onClick={() => onReserve(accommodation)}>
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
            <p className="text-muted-foreground">
              검색 조건에 맞는 숙소가 없습니다.
            </p>
            <Button
  variant="outline"
  className="mt-4"
  onClick={() =>
    setFilters({
      searchQuery: '',
      location: 'all',
      minPrice: 0,
      maxPrice: 500000,
      minRating: 0,
      petSize: 'all',
      sortBy: 'recommended',
    })
  }
>
  필터 초기화
</Button>

          </div>
        )}
      </div>

      {/* 안내 문구 */}
      <div className="mt-12 text-center">
        <p className="text-sm text-muted-foreground">
          모든 숙소는 반려동물 동반 투숙이 가능하며, 사전 예약이 필요합니다.
        </p>
      </div>
    </div>

    {/* Footer는 네가 쓰던 그대로 아래에 유지 */}
    <footer className="bg-muted/30 border-t border-border mt-20">
      {/* ... 생략: 기존 footer 코드 그대로 ... */}
    </footer>
  </div>
  );
}
