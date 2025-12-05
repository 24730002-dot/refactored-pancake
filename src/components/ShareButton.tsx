import React, { useState } from 'react';
import { Share2, Facebook, Twitter, MessageCircle, Mail, Copy, Check } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner@2.0.3';

interface ShareButtonProps {
  title: string;
  description?: string;
  url?: string;
  imageUrl?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function ShareButton({
  title,
  description = '',
  url,
  imageUrl,
  variant = 'outline',
  size = 'default',
}: ShareButtonProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

  const canShare = typeof navigator !== 'undefined' && navigator.share;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      toast.success('링크가 복사되었습니다');
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast.error('링크 복사에 실패했습니다');
    }
  };

  const getShareUrl = (platform: string) => {
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedTitle = encodeURIComponent(title);
    const encodedDescription = encodeURIComponent(description);

    switch (platform) {
      case 'facebook':
        return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
      case 'twitter':
        return `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
      case 'kakao':
        return `https://open.kakao.com/share?url=${encodedUrl}`;
      case 'line':
        return `https://social-plugins.line.me/lineit/share?url=${encodedUrl}`;
      case 'email':
        return `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0A${encodedUrl}`;
      default:
        return '';
    }
  };

  const openShareWindow = (platform: string) => {
    const url = getShareUrl(platform);
    if (url) {
      window.open(url, '_blank', 'width=600,height=400');
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (canShare) {
      try {
        await navigator.share({
          title,
          text: description,
          url: shareUrl,
        });
        toast.success('공유 완료!');
        return;
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.log('Native share failed, showing dialog');
        }
      }
    }

    setShowDialog(true);
  };

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <Button variant={variant} size={size} onClick={handleShare}>
        {size === 'icon' ? (
          <Share2 className="h-4 w-4" />
        ) : (
          <>
            <Share2 className="h-4 w-4 mr-2" />
            공유
          </>
        )}
      </Button>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>공유하기</DialogTitle>
          <DialogDescription>이 내용을 친구들과 공유해보세요</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="w-full" onClick={() => openShareWindow('facebook')}>
              <Facebook className="h-4 w-4 mr-2" />
              Facebook
            </Button>

            <Button variant="outline" className="w-full" onClick={() => openShareWindow('twitter')}>
              <Twitter className="h-4 w-4 mr-2" />
              Twitter
            </Button>

            <Button variant="outline" className="w-full" onClick={() => openShareWindow('kakao')}>
              <MessageCircle className="h-4 w-4 mr-2" />
              카카오톡
            </Button>

            <Button variant="outline" className="w-full" onClick={() => openShareWindow('line')}>
              <MessageCircle className="h-4 w-4 mr-2" />
              LINE
            </Button>

            <Button variant="outline" className="w-full col-span-2" onClick={() => openShareWindow('email')}>
              <Mail className="h-4 w-4 mr-2" />
              이메일
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="share-url">링크 복사</Label>
            <div className="flex gap-2">
              <Input id="share-url" value={shareUrl} readOnly className="flex-1" />

              <Button variant={isCopied ? 'default' : 'outline'} size="icon" onClick={copyToClipboard}>
                {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
