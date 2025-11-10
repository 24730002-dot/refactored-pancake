import React, { useState } from 'react';
import { Search, SlidersHorizontal, X, MapPin, Star, DollarSign } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';

export interface FilterOptions {
  searchQuery: string;
  location: string;
  minPrice: number;
  maxPrice: number;
  minRating: number;
  petSize: string;
  sortBy: string;
}

interface SearchAndFilterProps {
  onFilterChange: (filters: FilterOptions) => void;
}

export function SearchAndFilter({ onFilterChange }: SearchAndFilterProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({
    searchQuery: '',
    location: 'all',
    minPrice: 0,
    maxPrice: 500000,
    minRating: 0,
    petSize: 'all',
    sortBy: 'recommended',
  });
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  // 필터 적용
  const applyFilters = () => {
    const updatedFilters = { ...filters, searchQuery };
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);

    // 활성 필터 개수 계산
    let count = 0;
    if (searchQuery) count++;
    if (filters.location !== 'all') count++;
    if (filters.minPrice > 0 || filters.maxPrice < 500000) count++;
    if (filters.minRating > 0) count++;
    if (filters.petSize !== 'all') count++;
    if (filters.sortBy !== 'recommended') count++;
    setActiveFiltersCount(count);
  };

  // 필터 초기화
  const resetFilters = () => {
    setSearchQuery('');
    const defaultFilters: FilterOptions = {
      searchQuery: '',
      location: 'all',
      minPrice: 0,
      maxPrice: 500000,
      minRating: 0,
      petSize: 'all',
      sortBy: 'recommended',
    };
    setFilters(defaultFilters);
    onFilterChange(defaultFilters);
    setActiveFiltersCount(0);
  };

  // 가격 포맷팅
  const formatPrice = (price: number) => {
    return price.toLocaleString('ko-KR') + '원';
  };

  return (
    <div className="space-y-4">
      {/* 검색바 */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="숙소 이름, 위치, 리뷰 내용 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                applyFilters();
              }
            }}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
              onClick={() => {
                setSearchQuery('');
                applyFilters();
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <Button onClick={applyFilters}>검색</Button>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="relative">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              필터
              {activeFiltersCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-md overflow-y-auto">
            <SheetHeader>
              <SheetTitle>필터</SheetTitle>
              <SheetDescription>
                검색 결과를 필터링하여 원하는 숙소를 찾아보세요
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-6 mt-6">
              {/* 정렬 */}
              <div className="space-y-2">
                <Label>정렬 기준</Label>
                <Select
                  value={filters.sortBy}
                  onValueChange={(value) =>
                    setFilters({ ...filters, sortBy: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="정렬 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recommended">추천순</SelectItem>
                    <SelectItem value="price_low">가격 낮은순</SelectItem>
                    <SelectItem value="price_high">가격 높은순</SelectItem>
                    <SelectItem value="rating">평점순</SelectItem>
                    <SelectItem value="reviews">리뷰 많은순</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* 지역 */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  지역
                </Label>
                <Select
                  value={filters.location}
                  onValueChange={(value) =>
                    setFilters({ ...filters, location: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="지역 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    <SelectItem value="서울">서울</SelectItem>
                    <SelectItem value="부산">부산</SelectItem>
                    <SelectItem value="제주">제주</SelectItem>
                    <SelectItem value="강원">강원</SelectItem>
                    <SelectItem value="경기">경기</SelectItem>
                    <SelectItem value="인천">인천</SelectItem>
                    <SelectItem value="대전">대전</SelectItem>
                    <SelectItem value="대구">대구</SelectItem>
                    <SelectItem value="광주">광주</SelectItem>
                    <SelectItem value="울산">울산</SelectItem>
                    <SelectItem value="경남">경남</SelectItem>
                    <SelectItem value="경북">경북</SelectItem>
                    <SelectItem value="전남">전남</SelectItem>
                    <SelectItem value="전북">전북</SelectItem>
                    <SelectItem value="충남">충남</SelectItem>
                    <SelectItem value="충북">충북</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* 가격대 */}
              <div className="space-y-4">
                <Label className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  가격대 (1박 기준)
                </Label>
                <div className="space-y-4">
                  <Slider
                    min={0}
                    max={500000}
                    step={10000}
                    value={[filters.minPrice, filters.maxPrice]}
                    onValueChange={(value) =>
                      setFilters({
                        ...filters,
                        minPrice: value[0],
                        maxPrice: value[1],
                      })
                    }
                    className="w-full"
                  />
                  <div className="flex items-center justify-between text-sm">
                    <span>{formatPrice(filters.minPrice)}</span>
                    <span>~</span>
                    <span>{formatPrice(filters.maxPrice)}</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* 평점 */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  최소 평점
                </Label>
                <Select
                  value={filters.minRating.toString()}
                  onValueChange={(value) =>
                    setFilters({ ...filters, minRating: parseFloat(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="평점 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">전체</SelectItem>
                    <SelectItem value="3">3.0 이상</SelectItem>
                    <SelectItem value="3.5">3.5 이상</SelectItem>
                    <SelectItem value="4">4.0 이상</SelectItem>
                    <SelectItem value="4.5">4.5 이상</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* 반려동물 크기 */}
              <div className="space-y-2">
                <Label>반려동물 크기</Label>
                <Select
                  value={filters.petSize}
                  onValueChange={(value) =>
                    setFilters({ ...filters, petSize: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="크기 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    <SelectItem value="small">소형 (7kg 이하)</SelectItem>
                    <SelectItem value="medium">중형 (7-15kg)</SelectItem>
                    <SelectItem value="large">대형 (15kg 이상)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 버튼 */}
              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1" onClick={resetFilters}>
                  초기화
                </Button>
                <Button className="flex-1" onClick={applyFilters}>
                  적용
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* 활성 필터 표시 */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {searchQuery && (
            <Badge variant="secondary" className="gap-1">
              검색: {searchQuery}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => {
                  setSearchQuery('');
                  applyFilters();
                }}
              />
            </Badge>
          )}
          {filters.location !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              지역: {filters.location}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => {
                  const updatedFilters = { ...filters, location: 'all' };
                  setFilters(updatedFilters);
                  onFilterChange(updatedFilters);
                  
                  // 활성 필터 개수 재계산
                  let count = 0;
                  if (searchQuery) count++;
                  if (updatedFilters.minPrice > 0 || updatedFilters.maxPrice < 500000) count++;
                  if (updatedFilters.minRating > 0) count++;
                  if (updatedFilters.petSize !== 'all') count++;
                  if (updatedFilters.sortBy !== 'recommended') count++;
                  setActiveFiltersCount(count);
                }}
              />
            </Badge>
          )}
          {(filters.minPrice > 0 || filters.maxPrice < 500000) && (
            <Badge variant="secondary" className="gap-1">
              가격: {formatPrice(filters.minPrice)} ~ {formatPrice(filters.maxPrice)}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => {
                  const updatedFilters = { ...filters, minPrice: 0, maxPrice: 500000 };
                  setFilters(updatedFilters);
                  onFilterChange(updatedFilters);
                  
                  // 활성 필터 개수 재계산
                  let count = 0;
                  if (searchQuery) count++;
                  if (updatedFilters.location !== 'all') count++;
                  if (updatedFilters.minRating > 0) count++;
                  if (updatedFilters.petSize !== 'all') count++;
                  if (updatedFilters.sortBy !== 'recommended') count++;
                  setActiveFiltersCount(count);
                }}
              />
            </Badge>
          )}
          {filters.minRating > 0 && (
            <Badge variant="secondary" className="gap-1">
              평점: {filters.minRating}+ ⭐
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => {
                  const updatedFilters = { ...filters, minRating: 0 };
                  setFilters(updatedFilters);
                  onFilterChange(updatedFilters);
                  
                  // 활성 필터 개수 재계산
                  let count = 0;
                  if (searchQuery) count++;
                  if (updatedFilters.location !== 'all') count++;
                  if (updatedFilters.minPrice > 0 || updatedFilters.maxPrice < 500000) count++;
                  if (updatedFilters.petSize !== 'all') count++;
                  if (updatedFilters.sortBy !== 'recommended') count++;
                  setActiveFiltersCount(count);
                }}
              />
            </Badge>
          )}
          {filters.petSize !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              반려동물: {filters.petSize === 'small' ? '소형' : filters.petSize === 'medium' ? '중형' : '대형'}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => {
                  const updatedFilters = { ...filters, petSize: 'all' };
                  setFilters(updatedFilters);
                  onFilterChange(updatedFilters);
                  
                  // 활성 필터 개수 재계산
                  let count = 0;
                  if (searchQuery) count++;
                  if (updatedFilters.location !== 'all') count++;
                  if (updatedFilters.minPrice > 0 || updatedFilters.maxPrice < 500000) count++;
                  if (updatedFilters.minRating > 0) count++;
                  if (updatedFilters.sortBy !== 'recommended') count++;
                  setActiveFiltersCount(count);
                }}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
