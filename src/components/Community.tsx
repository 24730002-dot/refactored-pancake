import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { Star, Heart, MessageCircle, PawPrint, Upload, X, Image as ImageIcon, Filter, Trash2, Edit2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { supabase } from '../lib/supabase';

interface Review {
  id: string;
  user_id: string;
  accommodation_name: string;
  rating: number;
  title: string;
  content: string;
  images?: string[];
  likes_count: number;
  comments_count: number;
  created_at: string;
  user_profile: {
    username: string;
    profile_photo_url?: string;
  };
  user_liked?: boolean;
}

interface Comment {
  id: string;
  review_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user_profile: {
    username: string;
    profile_photo_url?: string;
  };
}

interface CommunityProps {
  isAuthenticated: boolean;
  onShowAuth: (mode?: 'login' | 'signup') => void;
  highlightReviewId?: string | null;
}

const ACCOMMODATION_NAMES = [
  '제주 오션뷰 펫 리조트',
  '강릉 바다 애견 호텔',
  '속초 반려동물 펜션',
  '평창 힐링 펫 스테이',
  '경주 한옥 반려동물 숙소',
  '부산 해운대 펫 호텔',
  '여수 오션 펫 리조트',
  '남해 독일마을 애견 펜션',
  '가평 숲속 반려견 빌라',
  '포천 아트밸리 펫 스테이',
  '양평 강변 애견 캠핑장',
  '춘천 호수 반려동물 펜션',
  '태안 해변 펫 리조트',
  '보령 머드 애견 호텔',
  '안면도 자연 펫 스테이'
];

// Mock review data with creative content
const MOCK_REVIEWS: Review[] = [
  {
    id: '1',
    user_id: 'user1',
    accommodation_name: '제주 오션뷰 펫 리조트',
    rating: 5,
    title: '우리 댕댕이가 정말 좋아했어요! 🐕',
    content: '제주도 여행 중 방문했는데 정말 최고였어요! 특히 전용 애견 수영장이 있어서 우리 골든리트리버 해피가 신나게 놀았습니다. 객실도 깔끔하고 반려동물 용품이 완비되어 있어서 편했어요. 주변에 산책로도 잘 되어있고, 직원분들도 친절하셨습니다. 다음에 꼭 다시 올게요!',
    images: [
      'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800',
      'https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=800',
      'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=800'
    ],
    likes_count: 42,
    comments_count: 8,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    user_profile: {
      username: '해피맘',
      profile_photo_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200'
    },
    user_liked: false
  },
  {
    id: '2',
    user_id: 'user2',
    accommodation_name: '강릉 바다 애견 호텔',
    rating: 5,
    title: '바다뷰가 정말 환상적이에요!',
    content: '강아지와 함께 바다를 보면서 힐링할 수 있는 곳이에요. 특히 일출이 정말 아름다웠고, 펜션 앞 해변에서 자유롭게 산책할 수 있어서 좋았습니다. 우리 시바견 코코가 모래사장에서 정말 행복해했어요. 조식도 맛있고, 반려견 간식도 서비스로 주셨어요!',
    images: [
      'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800',
      'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800'
    ],
    likes_count: 38,
    comments_count: 6,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    user_profile: {
      username: '코코아빠',
      profile_photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200'
    },
    user_liked: false
  },
  {
    id: '3',
    user_id: 'user3',
    accommodation_name: '가평 숲속 반려견 빌라',
    rating: 4,
    title: '자연 속에서 힐링하기 좋아요',
    content: '서울에서 가까워서 주말에 다녀왔어요. 숲속에 위치해있어서 공기도 좋고 조용해서 힐링하기 딱 좋습니다. 우리 웰시코기 뭉치가 넓은 마당에서 마음껏 뛰어놀았어요. 다만 주변에 편의점이 좀 멀어서 미리 준비해가는 게 좋을 것 같아요. 그래도 전체적으로 만족스러운 여행이었습니다!',
    images: [
      'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800',
      'https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?w=800',
      'https://images.unsplash.com/photo-1552053831-71594a27632d?w=800'
    ],
    likes_count: 31,
    comments_count: 4,
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    user_profile: {
      username: '뭉치사랑',
      profile_photo_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200'
    },
    user_liked: false
  },
  {
    id: '4',
    user_id: 'user4',
    accommodation_name: '속초 반려동물 펜션',
    rating: 5,
    title: '대형견도 환영하는 곳! 강추합니다 💯',
    content: '대형견 동반이 가능한 숙소를 찾기 힘든데, 여기는 우리 래브라도 초코를 정말 환영해주셨어요! 객실도 넓고, 전용 놀이터도 있어서 초코가 신나게 놀았습니다. 속초 관광지도 가까워서 여행하기 편했어요. 사장님도 반려견을 키우신다고 하셔서 더욱 믿음이 갔습니다. 최고예요!',
    images: [
      'https://images.unsplash.com/photo-1529472119196-cb724127a98e?w=800'
    ],
    likes_count: 56,
    comments_count: 12,
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    user_profile: {
      username: '초코엄마',
      profile_photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'
    },
    user_liked: false
  },
  {
    id: '5',
    user_id: 'user5',
    accommodation_name: '경주 한옥 반려동물 숙소',
    rating: 5,
    title: '한옥에서의 특별한 경험',
    content: '전통 한옥 스타일의 숙소인데, 반려동물 친화적으로 잘 꾸며져 있어요. 마당에서 우리 포메라니안 별이가 뛰어놀 수 있어서 좋았고, 한옥 특유의 운치도 느낄 수 있었습니다. 경주 관광지들도 근처에 있어서 편했어요. 밤에는 별도 보고, 정말 힐링되는 시간이었습니다.',
    images: [
      'https://images.unsplash.com/photo-1596854407944-bf87f6fdd49e?w=800',
      'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=800'
    ],
    likes_count: 45,
    comments_count: 7,
    created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    user_profile: {
      username: '별이네',
      profile_photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200'
    },
    user_liked: false
  },
  {
    id: '6',
    user_id: 'user6',
    accommodation_name: '여수 오션 펫 리조트',
    rating: 4,
    title: '야경이 아름다운 곳',
    content: '여수 밤바다를 반려견과 함께 즐길 수 있어서 좋았어요. 우리 비숑 구름이와 함께 해변 산책도 하고, 객실에서 야경도 감상했습니다. 시설도 깔끔하고 좋았어요. 다만 성수기라 가격이 좀 비싸긴 했지만, 그만한 가치가 있었습니다.',
    images: [
      'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800'
    ],
    likes_count: 28,
    comments_count: 5,
    created_at: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
    user_profile: {
      username: '구름파파',
      profile_photo_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200'
    },
    user_liked: false
  },
  {
    id: '7',
    user_id: 'user7',
    accommodation_name: '평창 힐링 펫 스테이',
    rating: 5,
    title: '겨울 여행 최고의 선택이었어요 ❄️',
    content: '눈 내리는 평창에서 우리 허스키 바람이와 함께 환상적인 시간을 보냈어요! 넓은 마당에서 눈썰매도 타고, 따뜻한 온돌방에서 휴식도 취했습니다. 주변에 스키장도 있어서 겨울 스포츠도 즐기기 좋아요. 사진 찍기도 좋고, 정말 추천합니다!',
    images: [
      'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800',
      'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800',
      'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800',
      'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=800'
    ],
    likes_count: 67,
    comments_count: 15,
    created_at: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    user_profile: {
      username: '바람이와함께',
      profile_photo_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200'
    },
    user_liked: false
  },
  {
    id: '8',
    user_id: 'user8',
    accommodation_name: '춘천 호수 반려동물 펜션',
    rating: 4,
    title: '호수뷰가 정말 예뻐요',
    content: '춘천 호수가 바로 앞에 있어서 뷰가 정말 좋습니다. 우리 말티즈 순이와 호수 주변을 산책하면서 좋은 시간 보냈어요. 조용하고 평화로운 분위기라 힐링하기 딱 좋아요. 춘천 닭갈비도 가까워서 저녁에 포장해서 먹었어요!',
    images: [
      'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800'
    ],
    likes_count: 22,
    comments_count: 3,
    created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    user_profile: {
      username: '순이집사',
      profile_photo_url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200'
    },
    user_liked: false
  }
];

const MOCK_COMMENTS: { [key: string]: Comment[] } = {
  '1': [
    {
      id: 'c1',
      review_id: '1',
      user_id: 'user2',
      content: '저도 다음 주에 예약했어요! 기대되네요 ㅎㅎ',
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      user_profile: { username: '코코아빠' }
    },
    {
      id: 'c2',
      review_id: '1',
      user_id: 'user3',
      content: '사진 보니까 정말 좋아보이네요! 우리 강아지도 데려가고 싶어요',
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      user_profile: { username: '뭉치사랑' }
    }
  ],
  '4': [
    {
      id: 'c3',
      review_id: '4',
      user_id: 'user1',
      content: '대형견 환영하는 곳 찾기 힘든데 좋은 정보 감사합니다!',
      created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      user_profile: { username: '해피맘' }
    }
  ],
  '7': [
    {
      id: 'c4',
      review_id: '7',
      user_id: 'user5',
      content: '허스키는 눈에서 정말 좋아하죠! 부러워요 ㅠㅠ',
      created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      user_profile: { username: '별이네' }
    }
  ]
};

export function Community({ isAuthenticated, onShowAuth, highlightReviewId }: CommunityProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showNewReviewDialog, setShowNewReviewDialog] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'recent' | 'popular'>('recent');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUsername, setCurrentUsername] = useState<string>('나');
  const [currentUserPhotoUrl, setCurrentUserPhotoUrl] = useState<string | undefined>(undefined);

  // New review form
  const [newReview, setNewReview] = useState({
    accommodationName: '',
    rating: 5,
    title: '',
    content: '',
  });
  const [reviewImages, setReviewImages] = useState<File[]>([]);
  const [reviewImagePreviews, setReviewImagePreviews] = useState<string[]>([]);

  // Get current user info
  useEffect(() => {
    const getCurrentUser = async () => {
      if (isAuthenticated) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUserId(user.id);
          
          // Get user profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, profile_photo_url')
            .eq('id', user.id)
            .single();
          
          if (profile) {
            setCurrentUsername(profile.username || '나');
            setCurrentUserPhotoUrl(profile.profile_photo_url);
          }
        }
      } else {
        setCurrentUserId(null);
        setCurrentUsername('나');
        setCurrentUserPhotoUrl(undefined);
      }
    };
    
    getCurrentUser();
  }, [isAuthenticated]);

  // Load reviews from localStorage and merge with mock data
  useEffect(() => {
    loadReviews();
  }, [sortBy, filterRating]);

  // Scroll to and highlight review when highlightReviewId changes
  useEffect(() => {
    if (highlightReviewId && reviews.length > 0) {
      // Wait for DOM to be ready
      setTimeout(() => {
        const element = document.getElementById(`review-${highlightReviewId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Add highlight effect
          element.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
          setTimeout(() => {
            element.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
          }, 2000);
        }
      }, 100);
    }
  }, [highlightReviewId, reviews]);

  const loadReviews = () => {
    setIsLoading(true);
    
    // Get user reviews from localStorage
    const userReviewsJson = localStorage.getItem('petfriendly_reviews');
    const userReviews: Review[] = userReviewsJson ? JSON.parse(userReviewsJson) : [];
    
    // Get user likes from localStorage
    const userLikesJson = localStorage.getItem('petfriendly_likes');
    const userLikes: string[] = userLikesJson ? JSON.parse(userLikesJson) : [];
    
    // Merge user reviews with mock reviews
    let allReviews = [...userReviews, ...MOCK_REVIEWS];
    
    // Apply rating filter
    if (filterRating) {
      allReviews = allReviews.filter(r => r.rating === filterRating);
    }
    
    // Apply sorting
    if (sortBy === 'recent') {
      allReviews.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else {
      allReviews.sort((a, b) => b.likes_count - a.likes_count);
    }
    
    // Mark reviews as liked
    allReviews = allReviews.map(review => ({
      ...review,
      user_liked: userLikes.includes(review.id)
    }));
    
    setReviews(allReviews);
    setIsLoading(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length + reviewImages.length > 5) {
      toast.error('최대 5장까지 업로드 가능합니다');
      return;
    }

    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error('이미지 파일만 업로드 가능합니다');
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('파일 크기는 5MB 이하여야 합니다');
        return false;
      }
      return true;
    });

    setReviewImages([...reviewImages, ...validFiles]);

    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setReviewImagePreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setReviewImages(reviewImages.filter((_, i) => i !== index));
    setReviewImagePreviews(reviewImagePreviews.filter((_, i) => i !== index));
  };

  const handleSubmitReview = () => {
    if (!isAuthenticated) {
      onShowAuth('login');
      toast.info('로그인 후 후기를 작성할 수 있습니다');
      return;
    }

    if (!newReview.title.trim() || !newReview.content.trim()) {
      toast.error('제목과 내용을 입력해주세요');
      return;
    }

    if (!newReview.accommodationName) {
      toast.error('숙소를 선택해주세요');
      return;
    }

    setIsLoading(true);
    
    // Create new review
    const review: Review = {
      id: 'user_' + Date.now(),
      user_id: currentUserId || 'guest',
      accommodation_name: newReview.accommodationName,
      rating: newReview.rating,
      title: newReview.title,
      content: newReview.content,
      images: reviewImagePreviews.length > 0 ? reviewImagePreviews : undefined,
      likes_count: 0,
      comments_count: 0,
      created_at: new Date().toISOString(),
      user_profile: {
        username: currentUsername,
        profile_photo_url: currentUserPhotoUrl
      },
      user_liked: false
    };
    
    // Save to localStorage
    const userReviewsJson = localStorage.getItem('petfriendly_reviews');
    const userReviews: Review[] = userReviewsJson ? JSON.parse(userReviewsJson) : [];
    userReviews.unshift(review);
    localStorage.setItem('petfriendly_reviews', JSON.stringify(userReviews));
    
    toast.success('후기가 작성되었습니다!');
    setShowNewReviewDialog(false);
    resetNewReviewForm();
    loadReviews();
    setIsLoading(false);
  };

  const resetNewReviewForm = () => {
    setNewReview({
      accommodationName: '',
      rating: 5,
      title: '',
      content: '',
    });
    setReviewImages([]);
    setReviewImagePreviews([]);
  };

  const handleLikeReview = (reviewId: string, currentlyLiked: boolean) => {
    if (!isAuthenticated) {
      onShowAuth('login');
      toast.info('로그인 후 좋아요를 누를 수 있습니다');
      return;
    }

    // Get user likes from localStorage
    const userLikesJson = localStorage.getItem('petfriendly_likes');
    let userLikes: string[] = userLikesJson ? JSON.parse(userLikesJson) : [];
    
    if (currentlyLiked) {
      // Unlike
      userLikes = userLikes.filter(id => id !== reviewId);
      toast.info('좋아요 취소');
    } else {
      // Like
      userLikes.push(reviewId);
      toast.success('좋아요!');
    }
    
    localStorage.setItem('petfriendly_likes', JSON.stringify(userLikes));
    
    // Update review like count in state
    const updatedReviews = reviews.map(r => {
      if (r.id === reviewId) {
        return {
          ...r,
          likes_count: currentlyLiked ? Math.max(0, r.likes_count - 1) : r.likes_count + 1,
          user_liked: !currentlyLiked
        };
      }
      return r;
    });
    
    setReviews(updatedReviews);
    
    // Also update selectedReview if it's the same review
    if (selectedReview && selectedReview.id === reviewId) {
      setSelectedReview({
        ...selectedReview,
        likes_count: currentlyLiked ? Math.max(0, selectedReview.likes_count - 1) : selectedReview.likes_count + 1,
        user_liked: !currentlyLiked
      });
    }
  };

  const handleDeleteReview = (reviewId: string) => {
    // Only allow deleting user's own reviews (those starting with 'user_')
    if (!reviewId.startsWith('user_')) {
      toast.error('본인이 작성한 후기만 삭제할 수 있습니다');
      return;
    }

    if (!window.confirm('정말로 이 후기를 삭제하시겠습니까?')) {
      return;
    }

    // Get user reviews from localStorage
    const userReviewsJson = localStorage.getItem('petfriendly_reviews');
    const userReviews: Review[] = userReviewsJson ? JSON.parse(userReviewsJson) : [];
    
    // Remove the review
    const updatedReviews = userReviews.filter(r => r.id !== reviewId);
    localStorage.setItem('petfriendly_reviews', JSON.stringify(updatedReviews));
    
    // Remove associated comments
    localStorage.removeItem(`petfriendly_comments_${reviewId}`);
    
    toast.success('후기가 삭제되었습니다');
    setSelectedReview(null);
    loadReviews();
  };

  const handleDeleteComment = (commentId: string, reviewId: string) => {
    if (!window.confirm('정말로 이 댓글을 삭제하시겠습니까?')) {
      return;
    }

    // Get user comments from localStorage
    const userCommentsJson = localStorage.getItem(`petfriendly_comments_${reviewId}`);
    const userComments: Comment[] = userCommentsJson ? JSON.parse(userCommentsJson) : [];
    
    // Remove the comment
    const updatedComments = userComments.filter(c => c.id !== commentId);
    localStorage.setItem(`petfriendly_comments_${reviewId}`, JSON.stringify(updatedComments));
    
    // Update comments count
    setReviews(reviews.map(r => {
      if (r.id === reviewId) {
        return { ...r, comments_count: Math.max(0, r.comments_count - 1) };
      }
      return r;
    }));
    
    toast.success('댓글이 삭제되었습니다');
    loadComments(reviewId);
  };

  const isUserReview = (reviewId: string) => {
    return reviewId.startsWith('user_');
  };

  const isUserComment = (commentId: string) => {
    return commentId.startsWith('comment_');
  };

  const loadComments = (reviewId: string) => {
    // Get comments from mock data or localStorage
    const mockComments = MOCK_COMMENTS[reviewId] || [];
    
    const userCommentsJson = localStorage.getItem(`petfriendly_comments_${reviewId}`);
    const userComments: Comment[] = userCommentsJson ? JSON.parse(userCommentsJson) : [];
    
    setComments([...mockComments, ...userComments]);
  };

  const handleAddComment = () => {
    if (!isAuthenticated) {
      onShowAuth('login');
      toast.info('로그인 후 댓글을 작성할 수 있습니다');
      return;
    }

    if (!newComment.trim() || !selectedReview) return;

    const comment: Comment = {
      id: 'comment_' + Date.now(),
      review_id: selectedReview.id,
      user_id: currentUserId || 'guest',
      content: newComment,
      created_at: new Date().toISOString(),
      user_profile: {
        username: currentUsername,
        profile_photo_url: currentUserPhotoUrl
      }
    };
    
    // Save to localStorage
    const userCommentsJson = localStorage.getItem(`petfriendly_comments_${selectedReview.id}`);
    const userComments: Comment[] = userCommentsJson ? JSON.parse(userCommentsJson) : [];
    userComments.push(comment);
    localStorage.setItem(`petfriendly_comments_${selectedReview.id}`, JSON.stringify(userComments));
    
    // Update comments count
    setReviews(reviews.map(r => {
      if (r.id === selectedReview.id) {
        return { ...r, comments_count: r.comments_count + 1 };
      }
      return r;
    }));
    
    setNewComment('');
    loadComments(selectedReview.id);
    toast.success('댓글이 작성되었습니다');
  };

  const openReviewDetail = (review: Review) => {
    setSelectedReview(review);
    loadComments(review.id);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return '오늘';
    if (days === 1) return '어제';
    if (days < 7) return `${days}일 전`;
    if (days < 30) return `${Math.floor(days / 7)}주 전`;
    if (days < 365) return `${Math.floor(days / 30)}개월 전`;
    return `${Math.floor(days / 365)}년 전`;
  };

  const StarRating = ({ rating, size = 'sm', interactive = false, onChange }: { 
    rating: number; 
    size?: 'sm' | 'md' | 'lg';
    interactive?: boolean;
    onChange?: (rating: number) => void;
  }) => {
    const sizeClasses = {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6'
    };

    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClasses[size]} ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            } ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
            onClick={interactive ? () => onChange?.(star) : undefined}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl text-foreground flex items-center gap-2">
            <PawPrint className="h-6 w-6 text-primary" />
            커뮤니티 후기
          </h2>
          <p className="text-muted-foreground mt-1">
            다른 반려동물 보호자들의 진솔한 후기를 확인하세요
          </p>
        </div>
        <Dialog open={showNewReviewDialog} onOpenChange={setShowNewReviewDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <PawPrint className="h-4 w-4" />
              후기 작성
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>후기 작성하기</DialogTitle>
              <DialogDescription>
                방문하신 숙소에 대한 솔직한 후기를 남겨주세요
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Accommodation Selection */}
              <div className="space-y-2">
                <Label htmlFor="accommodation">숙소 선택</Label>
                <select
                  id="accommodation"
                  className="w-full h-11 px-3 rounded-md border border-input bg-background text-foreground"
                  value={newReview.accommodationName}
                  onChange={(e) => setNewReview({ ...newReview, accommodationName: e.target.value })}
                >
                  <option value="">숙소를 선택하세요</option>
                  {ACCOMMODATION_NAMES.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              {/* Rating */}
              <div className="space-y-2">
                <Label>별점</Label>
                <StarRating 
                  rating={newReview.rating} 
                  size="lg" 
                  interactive 
                  onChange={(rating) => setNewReview({ ...newReview, rating })} 
                />
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">제목</Label>
                <Input
                  id="title"
                  placeholder="후기 제목을 입력하세요"
                  value={newReview.title}
                  onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
                  className="h-11"
                />
              </div>

              {/* Content */}
              <div className="space-y-2">
                <Label htmlFor="content">내용</Label>
                <Textarea
                  id="content"
                  placeholder="숙소에 대한 자세한 후기를 작성해주세요&#10;&#10;• 숙소 시설과 청결도는 어땠나요?&#10;• 반려동물이 편안하게 지냈나요?&#10;• 주변 산책로나 편의시설은 어땠나요?&#10;• 다른 보호자들에게 추천하고 싶은 점이 있나요?"
                  value={newReview.content}
                  onChange={(e) => setNewReview({ ...newReview, content: e.target.value })}
                  rows={8}
                  className="resize-none"
                />
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <Label>사진 (최대 5장)</Label>
                <div className="space-y-3">
                  {reviewImagePreviews.length > 0 && (
                    <div className="grid grid-cols-3 gap-3">
                      {reviewImagePreviews.map((preview, index) => (
                        <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-border">
                          <ImageWithFallback
                            src={preview}
                            alt={`Review image ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={() => removeImage(index)}
                            className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:opacity-80"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {reviewImagePreviews.length < 5 && (
                    <div>
                      <Input
                        id="images"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('images')?.click()}
                        className="w-full h-24 border-dashed"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <Upload className="h-6 w-6 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            사진 업로드 ({reviewImagePreviews.length}/5)
                          </span>
                        </div>
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowNewReviewDialog(false);
                    resetNewReviewForm();
                  }}
                  className="flex-1"
                >
                  취소
                </Button>
                <Button
                  onClick={handleSubmitReview}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? '작성 중...' : '후기 등록'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters and Sorting */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex gap-2 items-center flex-wrap">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <div className="flex gap-1 flex-wrap">
            <Button
              variant={filterRating === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterRating(null)}
            >
              전체
            </Button>
            {[5, 4, 3, 2, 1].map((rating) => (
              <Button
                key={rating}
                variant={filterRating === rating ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterRating(rating)}
                className="gap-1"
              >
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                {rating}
              </Button>
            ))}
          </div>
        </div>
        <Tabs value={sortBy} onValueChange={(v) => setSortBy(v as 'recent' | 'popular')}>
          <TabsList>
            <TabsTrigger value="recent">최신순</TabsTrigger>
            <TabsTrigger value="popular">인기순</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">후기를 불러오는 중...</p>
          </div>
        ) : reviews.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <PawPrint className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {filterRating ? `${filterRating}점 후기가 없습니다` : '아직 작성된 후기가 없습니다'}
              </p>
              <p className="text-sm text-muted-foreground mt-2">첫 번째 후기를 작성해보세요!</p>
            </CardContent>
          </Card>
        ) : (
          reviews.map((review) => (
            <Card key={review.id} id={`review-${review.id}`} className="hover:shadow-md transition-shadow cursor-pointer transition-all" onClick={() => openReviewDetail(review)}>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex gap-3 flex-1">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={review.user_profile?.profile_photo_url} />
                        <AvatarFallback>
                          {review.user_profile?.username?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {review.user_profile?.username || '익명'}
                          </p>
                          <Badge variant="secondary" className="text-xs">
                            {review.accommodation_name}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <StarRating rating={review.rating} size="sm" />
                          <span className="text-xs text-muted-foreground">
                            {formatDate(review.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                    {isUserReview(review.id) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteReview(review.id);
                        }}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {/* Content */}
                  <div>
                    <h3 className="font-medium text-lg mb-2">{review.title}</h3>
                    <p className="text-muted-foreground line-clamp-3">
                      {review.content}
                    </p>
                  </div>

                  {/* Images */}
                  {review.images && review.images.length > 0 && (
                    <div className="grid grid-cols-4 gap-2">
                      {review.images.slice(0, 4).map((image, index) => (
                        <div key={index} className="aspect-square rounded-lg overflow-hidden border border-border">
                          <ImageWithFallback
                            src={image}
                            alt={`Review image ${index + 1}`}
                            className="w-full h-full object-cover hover:scale-110 transition-transform"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-4 pt-2 border-t border-border">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLikeReview(review.id, review.user_liked || false);
                      }}
                      className="gap-2"
                    >
                      <Heart className={`h-4 w-4 ${review.user_liked ? 'fill-red-500 text-red-500' : ''}`} />
                      {review.likes_count > 0 && <span>{review.likes_count}</span>}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-2"
                    >
                      <MessageCircle className="h-4 w-4" />
                      {review.comments_count > 0 && <span>{review.comments_count}</span>}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Review Detail Dialog */}
      <Dialog open={!!selectedReview} onOpenChange={(open) => !open && setSelectedReview(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="sr-only">후기 상세</DialogTitle>
            <DialogDescription className="sr-only">
              후기의 전체 내용을 확인하고 댓글을 작성할 수 있습니다
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[80vh]">
            {selectedReview && (
              <div className="space-y-6 pr-4">
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex gap-3 flex-1">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={selectedReview.user_profile?.profile_photo_url} />
                        <AvatarFallback>
                          {selectedReview.user_profile?.username?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold">
                            {selectedReview.user_profile?.username || '익명'}
                          </h3>
                          <Badge variant="secondary">
                            {selectedReview.accommodation_name}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <StarRating rating={selectedReview.rating} size="sm" />
                          <span className="text-sm text-muted-foreground">
                            {formatDate(selectedReview.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                    {isUserReview(selectedReview.id) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteReview(selectedReview.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Review Content */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-medium mb-3">{selectedReview.title}</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {selectedReview.content}
                    </p>
                  </div>

                  {/* Images */}
                  {selectedReview.images && selectedReview.images.length > 0 && (
                    <div className="grid grid-cols-2 gap-3">
                      {selectedReview.images.map((image, index) => (
                        <div key={index} className="aspect-video rounded-lg overflow-hidden border border-border">
                          <ImageWithFallback
                            src={image}
                            alt={`Review image ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-4 py-3 border-y border-border">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLikeReview(selectedReview.id, selectedReview.user_liked || false)}
                      className="gap-2"
                    >
                      <Heart className={`h-4 w-4 ${selectedReview.user_liked ? 'fill-red-500 text-red-500' : ''}`} />
                      좋아요 {selectedReview.likes_count > 0 && `(${selectedReview.likes_count})`}
                    </Button>
                  </div>

                  {/* Comments Section */}
                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      댓글 {comments.length > 0 && `(${comments.length})`}
                    </h4>

                    {/* Comment Input */}
                    <div className="flex gap-2">
                      <Input
                        placeholder={isAuthenticated ? "댓글을 입력하세요..." : "로그인 후 댓글을 작성할 수 있습니다"}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleAddComment();
                          }
                        }}
                        disabled={!isAuthenticated}
                        className="flex-1"
                      />
                      <Button onClick={handleAddComment} disabled={!isAuthenticated || !newComment.trim()}>
                        작성
                      </Button>
                    </div>

                    {/* Comments List */}
                    <div className="space-y-3">
                      {comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3 p-3 rounded-lg bg-muted/30 group">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={comment.user_profile?.profile_photo_url} />
                            <AvatarFallback>
                              {comment.user_profile?.username?.charAt(0).toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium">
                                {comment.user_profile?.username || '익명'}
                              </p>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(comment.created_at)}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {comment.content}
                            </p>
                          </div>
                          {isUserComment(comment.id) && selectedReview && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteComment(comment.id, selectedReview.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      ))}
                      {comments.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          아직 댓글이 없습니다. 첫 댓글을 작성해보세요!
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
