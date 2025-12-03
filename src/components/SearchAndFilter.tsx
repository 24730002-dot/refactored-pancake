import React, { useState, useEffect, useMemo } from 'react';
import { Search, SlidersHorizontal, X, MapPin, Star, DollarSign } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './ui/sheet';
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
  onOpenChange,
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
    [filters],
  );

  const formatPrice = (price: number) => price.toLocaleString('ko-KR') + '원';

  const applySearch = () => {
    updateFilters({ searchQuery: searchInput });

    if (onApply) onApply();
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
      <div className="flex flex-col gap-2 sm:flex-row">
        {/* 검색 인풋 */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />

          <Input
            type="text"
            placeholder="숙소 이름, 위치, 리뷰 내용 검색..."
            value={searchInput}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSearchInput(e.target.value)
            }
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Enter') applySearch();
            }}
            className="pl-10 pr-10"
          />

          {searchInput && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 transform"
              onClick={() => {
                setSearchInput('');
                updateFilters({ searchQuery: '' });
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* 검색 + 필터 버튼 묶음 */}
        <div className="flex w-full gap-2 sm:w-auto">
          <Button onClick={applySearch} className="flex-1 sm:flex-none">
            검색
          </Button>

          {/* 필터 버튼 */}
          <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                className="relative flex-1 sm:flex-none"
              >
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                필터
                {activeFiltersCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center p-0 text-xs"
                  >
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>

          <SheetContent className="w-full overflow-y-auto sm:max-w-md">
            {/* 안쪽 내용 폭 줄이고 가운데 정렬 */}
            <div className="w-full max-w-md mx-auto px-4 pb-6">
              <SheetHeader>
                <SheetTitle>필터</SheetTitle>
                <SheetDescription>
                  원하는 조건으로 숙소를 걸러보세요.
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* 정렬 기준 */}
                <div className="space-y-2">
                  <Label>정렬 기준</Label>
                  <Select
                    value={filters.sortBy}
                    onValueChange={(value: string) =>
                      updateFilters({ sortBy: value })
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
                    onValueChange={(value: string) =>
                      updateFilters({ location: value })
                    }
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
                    onValueChange={(value: number[]) =>
                      updateFilters({
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

                <Separator />

                {/* 최소 평점 */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    최소 평점
                  </Label>
                  <Select
                    value={filters.minRating.toString()}
                    onValueChange={(value: string) =>
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
                    onValueChange={(value: string) =>
                      updateFilters({ petSize: value })
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
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={resetAll}
                  >
                    초기화
                  </Button>
                  <Button className="flex-1" onClick={applySearch}>
                    적용
                  </Button>
                </div>
              </div>
            </div>
          </SheetContent>

          </Sheet>
        </div>
      </div>

      {/* 활성 필터 표시 */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {/* 검색어 */}
          {filters.searchQuery && (
            <Badge variant="secondary" className="gap-1">
              검색: {filters.searchQuery}
              <span
                role="button"
                className="cursor-pointer hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  updateFilters({ searchQuery: '' });
                  setSearchInput('');
                }}
              >
                <X className="h-3 w-3" />
              </span>
            </Badge>
          )}

          {/* 지역 */}
          {filters.location !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              지역: {filters.location}
              <span
                role="button"
                className="cursor-pointer hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  updateFilters({ location: 'all' });
                }}
              >
                <X className="h-3 w-3" />
              </span>
            </Badge>
          )}

          {/* 가격 */}
          {(filters.minPrice > 0 || filters.maxPrice < 500000) && (
            <Badge variant="secondary" className="gap-1">
              가격: {formatPrice(filters.minPrice)} ~{' '}
              {formatPrice(filters.maxPrice)}
              <span
                role="button"
                className="cursor-pointer hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  updateFilters({
                    minPrice: 0,
                    maxPrice: 500000,
                  });
                }}
              >
                <X className="h-3 w-3" />
              </span>
            </Badge>
          )}

          {/* 평점 */}
          {filters.minRating > 0 && (
            <Badge variant="secondary" className="gap-1">
              평점: {filters.minRating}+ ⭐
              <span
                role="button"
                className="cursor-pointer hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  updateFilters({ minRating: 0 });
                }}
              >
                <X className="h-3 w-3" />
              </span>
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
              <span
                role="button"
                className="cursor-pointer hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  updateFilters({ petSize: 'all' });
                }}
              >
                <X className="h-3 w-3" />
              </span>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
