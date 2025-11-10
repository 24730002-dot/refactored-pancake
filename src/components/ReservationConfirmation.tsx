import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { 
  CheckCircle2, Home, Calendar, User, Phone, Mail, MapPin, 
  Dog, Cat, Bird, Rabbit, Download, Share2, ArrowLeft 
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface ReservationData {
  accommodationId: number;
  accommodationName: string;
  accommodationLocation: string;
  accommodationImage: string;
  checkInDate: Date;
  checkOutDate: Date;
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  numberOfPets: number;
  specialRequests: string;
  totalPrice: number;
  nights: number;
  pricePerNight: number;
  reservationNumber: string;
  reservationDate: Date;
}

interface ReservationConfirmationProps {
  reservation: ReservationData;
  onBackToList: () => void;
  onBackToDetail: () => void;
}

export function ReservationConfirmation({ 
  reservation, 
  onBackToList, 
  onBackToDetail 
}: ReservationConfirmationProps) {
  
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('ko-KR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      weekday: 'short'
    });
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDownload = () => {
    // In a real app, this would generate a PDF
    toast.success('예약 확인서를 다운로드합니다');
  };

  const handleShare = async () => {
    const text = `${reservation.accommodationName} 예약이 완료되었습니다!\n예약번호: ${reservation.reservationNumber}\n체크인: ${formatDate(reservation.checkInDate)}\n체크아웃: ${formatDate(reservation.checkOutDate)}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: '숙소 예약 완료',
          text: text,
        });
      } catch (error: any) {
        // If user cancels or denies, fall back to clipboard
        if (error.name === 'AbortError') {
          // User cancelled the share dialog, do nothing
          return;
        }
        // For other errors (like NotAllowedError), fall back to clipboard
        try {
          await navigator.clipboard.writeText(text);
          toast.success('예약 정보가 클립보드에 복사되었습니다');
        } catch (clipboardError) {
          toast.error('공유할 수 없습니다');
        }
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      try {
        await navigator.clipboard.writeText(text);
        toast.success('예약 정보가 클립보드에 복사되었습니다');
      } catch (error) {
        toast.error('클립보드에 복사할 수 없습니다');
      }
    }
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8 space-y-4">
          <div className="flex justify-center">
            <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-6">
              <CheckCircle2 className="h-16 w-16 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div>
            <h1 className="text-foreground mb-2">예약이 완료되었습니다!</h1>
            <p className="text-lg text-muted-foreground">
              예약 확인 이메일이 발송되었습니다
            </p>
          </div>
        </div>

        {/* Reservation Number Card */}
        <Card className="mb-6 border-2 border-primary">
          <CardHeader className="text-center">
            <CardTitle>예약번호</CardTitle>
            <div className="text-3xl text-primary mt-2 tracking-wider">
              {reservation.reservationNumber}
            </div>
            <CardDescription className="mt-2">
              예약일시: {formatDate(reservation.reservationDate)} {formatTime(reservation.reservationDate)}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Accommodation Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>숙소 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="w-full sm:w-48 h-32 rounded-lg overflow-hidden flex-shrink-0">
                <ImageWithFallback
                  src={reservation.accommodationImage}
                  alt={reservation.accommodationName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="text-foreground">{reservation.accommodationName}</h3>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{reservation.accommodationLocation}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Booking Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>예약 상세정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Check-in / Check-out */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>체크인</span>
                </div>
                <div className="pl-6">
                  <div className="font-medium">{formatDate(reservation.checkInDate)}</div>
                  <div className="text-sm text-muted-foreground">오후 3시 이후</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>체크아웃</span>
                </div>
                <div className="pl-6">
                  <div className="font-medium">{formatDate(reservation.checkOutDate)}</div>
                  <div className="text-sm text-muted-foreground">오전 11시 이전</div>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-2">
                <Home className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">숙박 기간</span>
              </div>
              <div className="pl-6 text-muted-foreground">
                총 {reservation.nights}박
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-2">
                <Dog className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">반려동물</span>
              </div>
              <div className="pl-6 text-muted-foreground">
                {reservation.numberOfPets}마리
              </div>
            </div>

            {reservation.specialRequests && (
              <div className="border-t pt-4">
                <div className="font-medium mb-2">특별 요청사항</div>
                <div className="pl-0 text-muted-foreground bg-muted/30 p-3 rounded-lg">
                  {reservation.specialRequests}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Guest Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>예약자 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">이름</div>
                <div className="font-medium">{reservation.guestName}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">연락처</div>
                <div className="font-medium">{reservation.guestPhone}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">이메일</div>
                <div className="font-medium">{reservation.guestEmail}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Price Summary */}
        <Card className="mb-6 bg-muted/30">
          <CardHeader>
            <CardTitle>결제 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                ₩{reservation.pricePerNight.toLocaleString()} x {reservation.nights}박
              </span>
              <span className="font-medium">
                ₩{(reservation.pricePerNight * reservation.nights).toLocaleString()}
              </span>
            </div>
            <div className="border-t pt-3 flex justify-between text-lg">
              <span className="font-medium">총 결제 금액</span>
              <span className="text-primary">
                ₩{reservation.totalPrice.toLocaleString()}
              </span>
            </div>
            <div className="text-sm text-muted-foreground pt-2 border-t">
              결제는 체크인 시 현장에서 진행됩니다
            </div>
          </CardContent>
        </Card>

        {/* Important Notice */}
        <Card className="mb-6 border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20">
          <CardHeader>
            <CardTitle className="text-blue-900 dark:text-blue-300">유의사항</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <p>• 반려동물 예방접종 증명서를 반드시 지참해주세요</p>
            <p>• 체크인 시 예약번호를 제시해주세요</p>
            <p>• 취소는 체크인 7일 전까지 가능하며, 전액 환불됩니다</p>
            <p>• 숙소 연락처로 사전 연락 후 방문해주세요</p>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <Button
            variant="outline"
            onClick={handleDownload}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            확인서 다운로드
          </Button>
          <Button
            variant="outline"
            onClick={handleShare}
            className="gap-2"
          >
            <Share2 className="h-4 w-4" />
            예약 공유
          </Button>
          <Button
            variant="outline"
            onClick={onBackToDetail}
            className="gap-2"
          >
            <Home className="h-4 w-4" />
            숙소 상세보기
          </Button>
        </div>

        {/* Back to List Button */}
        <div className="flex justify-center">
          <Button
            onClick={onBackToList}
            size="lg"
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            숙소 목록으로 돌아가기
          </Button>
        </div>

        {/* Contact Support */}
        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>예약에 문제가 있으신가요?</p>
          <p className="mt-1">
            고객센터: <span className="text-foreground font-medium">1588-0000</span> | 
            이메일: <span className="text-foreground font-medium">support@petfriendly.com</span>
          </p>
        </div>
      </div>
    </div>
  );
}
