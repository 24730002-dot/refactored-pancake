import React, { useState, useEffect, useMemo } from 'react';
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
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
  onApply?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}




/**
 * 필터 개수 계산 함수 (공용)
 */
const calcActiveFilterCount = (f: FilterOptions) => {
  let count = 0;
  if (f.searchQuery) count++;
  if (f.location !== 'all') count++;
  if (f.minPrice > 0 || f.maxPrice < 500000) count++;
  if (f.minRating > 0) count++;
  if (f.petSize !== 'all') count++;
  if (f.sortBy !== 'recommended') count++;
  return count;
};

export function SearchAndFilter({ 
  filters, 
  onFilterChange, 
  onApply,
  open,
  onOpenChange
}: SearchAndFilterProps) {

  // 검색창에 타이핑 중인 값 (Enter / 검색 버튼 누를 때 확정)
  const [searchInput, setSearchInput] = useState(filters.searchQuery);

  // 부모에서 searchQuery가 바뀌면 input도 맞춰주기
  useEffect(() => {
    setSearchInput(filters.searchQuery);
  }, [filters.searchQuery]);

  // 한 번에 업데이트하기 위한 헬퍼
  const updateFilters = (patch: Partial<FilterOptions>) => {
    const updated = { ...filters, ...patch };
    onFilterChange(updated);
  };

  const activeFiltersCount = useMemo(
    () => calcActiveFilterCount(filters),
    [filters]
  );

  const formatPrice = (price: number) => price.toLocaleString('ko-KR') + '원';

  const applySearch = () => {
  updateFilters({ searchQuery: searchInput });

  if (onApply) onApply();  // ⭐ 적용 버튼 눌렀을 때 추가 동작 실행!
};


  const resetAll = () => {
    const reset: FilterOptions = {
      searchQuery: '',
      location: 'all',
      minPrice: 0,
      maxPrice: 500000,
      minRating: 0,
      petSize: 'all',
      sortBy: 'recommended',
    };
    onFilterChange(reset);
    setSearchInput('');
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
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') applySearch();
            }}
            className="pl-10 pr-10"
          />

          {searchInput && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
              onClick={() => {
                setSearchInput('');
                updateFilters({ searchQuery: '' });
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <Button onClick={applySearch}>검색</Button>

        {/* 필터 버튼 */}
        <Sheet open={open} onOpenChange={onOpenChange}>
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
                원하는 조건으로 숙소를 걸러보세요.
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-6 mt-6">
              {/* 정렬 기준 */}
              <div className="space-y-2">
                <Label>정렬 기준</Label>
                <Select
                  value={filters.sortBy}
                  onValueChange={(value) => updateFilters({ sortBy: value })}
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
                  onValueChange={(value) => updateFilters({ location: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="지역 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
<SelectItem value="서울">서울</SelectItem>
<SelectItem value="부산광역시">부산</SelectItem>
<SelectItem value="제주도">제주</SelectItem>
<SelectItem value="강원도">강원</SelectItem>
<SelectItem value="경기도">경기</SelectItem>
<SelectItem value="인천광역시">인천</SelectItem>
<SelectItem value="대구광역시">대구</SelectItem>
<SelectItem value="광주광역시">광주</SelectItem>
<SelectItem value="전라남도">전남</SelectItem>
<SelectItem value="전라북도">전북</SelectItem>
<SelectItem value="충청남도">충남</SelectItem>
<SelectItem value="충청북도">충북</SelectItem>

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
                <Slider
                  min={0}
                  max={500000}
                  step={10000}
                  value={[filters.minPrice, filters.maxPrice]}
                  onValueChange={(value) =>
                    updateFilters({ minPrice: value[0], maxPrice: value[1] })
                  }
                  className="w-full"
                />
                <div className="flex items-center justify-between text-sm">
                  <span>{formatPrice(filters.minPrice)}</span>
                  <span>~</span>
                  <span>{formatPrice(filters.maxPrice)}</span>
                </div>
              </div>

              <Separator />

              {/* 최소 평점 */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  최소 평점
                </Label>
                <Select
                  value={filters.minRating.toString()}
                  onValueChange={(value) =>
                    updateFilters({ minRating: parseFloat(value) })
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
                  onValueChange={(value) => updateFilters({ petSize: value })}
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
                <Button variant="outline" className="flex-1" onClick={resetAll}>
                  초기화
                </Button>
                <Button className="flex-1" onClick={applySearch}>
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
          {/* 검색어 */}
          {filters.searchQuery && (
            <Badge variant="secondary" className="gap-1">
              검색: {filters.searchQuery}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => {
                  updateFilters({ searchQuery: '' });
                  setSearchInput('');
                }}
              />
            </Badge>
          )}

          {/* 지역 */}
          {filters.location !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              지역: {filters.location}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => updateFilters({ location: 'all' })}
              />
            </Badge>
          )}

          {/* 가격 */}
          {(filters.minPrice > 0 || filters.maxPrice < 500000) && (
            <Badge variant="secondary" className="gap-1">
              가격: {formatPrice(filters.minPrice)} ~ {formatPrice(filters.maxPrice)}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => updateFilters({ minPrice: 0, maxPrice: 500000 })}
              />
            </Badge>
          )}

          {/* 평점 */}
          {filters.minRating > 0 && (
            <Badge variant="secondary" className="gap-1">
              평점: {filters.minRating}+ ⭐
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => updateFilters({ minRating: 0 })}
              />
            </Badge>
          )}

          {/* 반려동물 크기 */}
          {filters.petSize !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              반려동물:{' '}
              {filters.petSize === 'small'
                ? '소형'
                : filters.petSize === 'medium'
                ? '중형'
                : '대형'}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => updateFilters({ petSize: 'all' })}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
