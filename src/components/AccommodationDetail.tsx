import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { ShareButton } from './ShareButton';
import { FavoriteButton } from './Favorites';
import { Chat } from './Chat';
import { 
  ArrowLeft, Dog, Cat, Bird, Rabbit, Wifi, Car, Home, Trees, 
  Star, MapPin, Phone, Mail, Calendar as CalendarIcon, Users,
  Check, X, ChevronLeft, ChevronRight
} from 'lucide-react';
// Using date-fns for date formatting
const formatDate = (date: Date | undefined): string => {
  if (!date) return '날짜 선택';
  return date.toLocaleDateString('ko-KR', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};
import { toast } from 'sonner@2.0.3';

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

interface AccommodationDetailProps {
  accommodation: Accommodation;
  onBack: () => void;
  isAuthenticated: boolean;
  userId: string | null;
  onShowAuth: () => void;
  onReservationComplete: (reservation: any) => void;
}

export function AccommodationDetail({ 
  accommodation, 
  onBack, 
  isAuthenticated,
  userId,
  onShowAuth,
  onReservationComplete
}: AccommodationDetailProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showReservationDialog, setShowReservationDialog] = useState(false);
  
  // Reservation form state
  const [checkInDate, setCheckInDate] = useState<Date>();
  const [checkOutDate, setCheckOutDate] = useState<Date>();
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [numberOfPets, setNumberOfPets] = useState(1);
  const [specialRequests, setSpecialRequests] = useState('');

  // Mock images - in a real app, these would come from the accommodation data
  const images = [
    accommodation.imageUrl,
    // Add more image variations
    accommodation.imageUrl.replace('w=1080', 'w=1080&sat=-20'),
    accommodation.imageUrl.replace('w=1080', 'w=1080&hue=20'),
  ];

  const handleReservation = () => {
    if (!isAuthenticated) {
      toast.error('예약하려면 로그인이 필요합니다');
      onShowAuth();
      return;
    }
    setShowReservationDialog(true);
  };

  const submitReservation = () => {
    if (!checkInDate || !checkOutDate) {
      toast.error('체크인/체크아웃 날짜를 선택해주세요');
      return;
    }
    if (!guestName || !guestPhone || !guestEmail) {
      toast.error('예약자 정보를 모두 입력해주세요');
      return;
    }

    // Calculate number of nights
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
    const totalPrice = accommodation.pricePerNight * nights;

    // Generate reservation number
    const reservationNumber = `PF${Date.now().toString().slice(-8)}`;

    // Create reservation data
    const reservationData = {
      accommodationId: accommodation.id,
      accommodationName: accommodation.name,
      accommodationLocation: accommodation.location,
      accommodationImage: accommodation.imageUrl,
      checkInDate,
      checkOutDate,
      guestName,
      guestPhone,
      guestEmail,
      numberOfPets,
      specialRequests,
      totalPrice,
      nights,
      pricePerNight: accommodation.pricePerNight,
      reservationNumber,
      reservationDate: new Date(),
    };

    // Save to localStorage for activity history
    const existingReservations = JSON.parse(localStorage.getItem('petfriendly_reservations') || '[]');
    existingReservations.push(reservationData);
    localStorage.setItem('petfriendly_reservations', JSON.stringify(existingReservations));

    // Show confirmation page
    onReservationComplete(reservationData);
    setShowReservationDialog(false);
  };

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

  const getAmenityIcon = (amenity: string) => {
    if (amenity.includes('WiFi')) return <Wifi className="h-4 w-4" />;
    if (amenity.includes('주차')) return <Car className="h-4 w-4" />;
    if (amenity.includes('정원') || amenity.includes('산책로') || amenity.includes('숲')) 
      return <Trees className="h-4 w-4" />;
    return <Home className="h-4 w-4" />;
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const previousImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              목록으로
            </Button>
            <div className="flex items-center gap-2">
              <ShareButton
                title={accommodation.name}
                description={accommodation.description}
                variant="outline"
                size="sm"
              />
              <FavoriteButton
                userId={userId}
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
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="relative h-96 sm:h-[500px] rounded-2xl overflow-hidden group">
              <ImageWithFallback
                src={images[currentImageIndex]}
                alt={`${accommodation.name} - 이미지 ${currentImageIndex + 1}`}
                className="w-full h-full object-cover"
              />
              
              {/* Navigation Buttons */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={previousImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                  
                  {/* Image Indicators */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          index === currentImageIndex 
                            ? 'bg-primary w-6' 
                            : 'bg-background/60 hover:bg-background/80'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
              
              {/* Rating Badge */}
              <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm rounded-lg px-3 py-1 flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{accommodation.rating}</span>
              </div>
            </div>

            {/* Title and Location */}
            <div>
              <h1 className="text-foreground mb-2">{accommodation.name}</h1>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-5 w-5" />
                <span>{accommodation.location}</span>
              </div>
            </div>

            {/* Pet Types */}
            <div>
              <h3 className="text-foreground mb-3">반려동물</h3>
              <div className="flex flex-wrap gap-2">
                {accommodation.petTypes.map((type, index) => {
                  const label = 
                    type === 'all' ? '모든 반려동물' :
                    type === 'dog' ? '강아지' :
                    type === 'cat' ? '고양이' :
                    type === 'bird' ? '조류' :
                    type === 'small' ? '소형 반려동물' : type;
                  
                  return (
                    <Badge key={index} variant="secondary" className="flex items-center gap-2 px-3 py-1">
                      {getPetTypeIcon(type)}
                      <span>{label}</span>
                    </Badge>
                  );
                })}
                <Badge variant="outline" className="px-3 py-1">
                  최대 {accommodation.maxPets}마리
                </Badge>
              </div>
            </div>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>숙소 소개</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {accommodation.description}
                </p>
              </CardContent>
            </Card>

            {/* Amenities */}
            <Card>
              <CardHeader>
                <CardTitle>편의시설</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {accommodation.amenities.map((amenity, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 rounded-lg bg-muted/30">
                      {getAmenityIcon(amenity)}
                      <span className="text-sm">{amenity}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* House Rules */}
            <Card>
              <CardHeader>
                <CardTitle>숙소 이용 규칙</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">
                      체크인: 오후 3시 이후, 체크아웃: 오전 11시 이전
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">
                      반려동물 예방접종 증명서 필수
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">
                      반려동물 배변 매너는 보호자가 책임집니다
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <X className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">
                      흡연 금지
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <X className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">
                      파티 또는 이벤트 금지
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle>연락처 정보</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <span>{accommodation.phone}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <span>{accommodation.email}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Reservation Card */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <div className="flex items-baseline justify-between">
                  <div>
                    <div className="text-3xl text-primary">
                      ₩{accommodation.pricePerNight.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">/ 박</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{accommodation.rating}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={handleReservation}
                  className="w-full h-12"
                  size="lg"
                >
                  예약하기
                </Button>
                
                <Chat
                  userId={userId}
                  accommodationId={accommodation.id.toString()}
                  accommodationName={accommodation.name}
                />
                
                <div className="text-center text-sm text-muted-foreground">
                  예약 확정 전까지 요금이 청구되지 않습니다
                </div>

                <div className="pt-4 border-t space-y-2">
                  <h4 className="font-medium mb-3">예약 안내</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>• 사전 예약 필수</p>
                    <p>• 반려동물 최대 {accommodation.maxPets}마리</p>
                    <p>• 예방접종 증명서 지참</p>
                    <p>• 취소 정책: 체크인 7일 전까지 전액 환불</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Reservation Dialog */}
      <Dialog open={showReservationDialog} onOpenChange={setShowReservationDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>예약하기 - {accommodation.name}</DialogTitle>
            <DialogDescription>
              예약 정보를 입력해주세요. 모든 정보는 필수입니다.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Date Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>체크인 날짜</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formatDate(checkInDate)}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={checkInDate}
                      onSelect={setCheckInDate}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label>체크아웃 날짜</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formatDate(checkOutDate)}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={checkOutDate}
                      onSelect={setCheckOutDate}
                      disabled={(date) => !checkInDate || date <= checkInDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Guest Info */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="guestName">예약자 이름</Label>
                <Input
                  id="guestName"
                  placeholder="이름을 입력하세요"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="guestPhone">연락처</Label>
                <Input
                  id="guestPhone"
                  type="tel"
                  placeholder="010-0000-0000"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="guestEmail">이메일</Label>
                <Input
                  id="guestEmail"
                  type="email"
                  placeholder="example@email.com"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="numberOfPets">반려동물 수</Label>
                <Input
                  id="numberOfPets"
                  type="number"
                  min="1"
                  max={accommodation.maxPets}
                  value={numberOfPets}
                  onChange={(e) => setNumberOfPets(parseInt(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  최대 {accommodation.maxPets}마리까지 가능합니다
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="specialRequests">특별 요청사항 (선택)</Label>
                <Textarea
                  id="specialRequests"
                  placeholder="숙소에 전달할 특별한 요청사항이 있다면 입력해주세요"
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  rows={4}
                />
              </div>
            </div>

            {/* Price Summary */}
            {checkInDate && checkOutDate && (
              <Card className="bg-muted/30">
                <CardHeader>
                  <CardTitle className="text-base">가격 상세</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {(() => {
                    const nights = Math.ceil(
                      (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
                    );
                    const totalPrice = accommodation.pricePerNight * nights;
                    
                    return (
                      <>
                        <div className="flex justify-between text-sm">
                          <span>₩{accommodation.pricePerNight.toLocaleString()} x {nights}박</span>
                          <span>₩{totalPrice.toLocaleString()}</span>
                        </div>
                        <div className="border-t pt-2 flex justify-between">
                          <span>총 금액</span>
                          <span className="text-primary">₩{totalPrice.toLocaleString()}</span>
                        </div>
                      </>
                    );
                  })()}
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowReservationDialog(false)}
                className="flex-1"
              >
                취소
              </Button>
              <Button
                onClick={submitReservation}
                className="flex-1"
              >
                예약 확정
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
