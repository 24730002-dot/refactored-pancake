import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Separator } from './ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Eye, EyeOff, ArrowLeft, Upload, X, Heart, PawPrint } from 'lucide-react';
import { Logo } from './Logo';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner@2.0.3';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface AuthProps {
  onAuthSuccess: () => void;
  onBack?: () => void;
  initialMode?: 'login' | 'signup';
}

export function Auth({ onAuthSuccess, onBack, initialMode = 'login' }: AuthProps) {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');

  // Form data
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string>('');

  const validateForm = () => {
    if (!email || !password) {
      setError('Email and password are required');
      return false;
    }

    if (!isLogin) {
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return false;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        return false;
      }
    }

    return true;
  };

  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image must be less than 5MB');
        return;
      }

      setProfilePhoto(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfilePhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const removeProfilePhoto = () => {
    setProfilePhoto(null);
    setProfilePhotoPreview('');
  };

  const uploadProfilePhoto = async (userId: string): Promise<string | null> => {
    if (!profilePhoto) return null;

    try {
      const fileExt = profilePhoto.name.split('.').pop();
      const fileName = `${userId}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, profilePhoto, {
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading profile photo:', error);
      throw error; // Re-throw to handle in calling function
    }
  };

  const createUserProfile = async (userId: string, userEmail: string, profilePhotoUrl?: string | null) => {
    try {
      // Ensure we have a valid session before creating profile
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session found');
      }

      const profileData: any = {
        id: userId,
        email: userEmail,
      };

      if (username) profileData.username = username;
      if (phoneNumber) profileData.phone = phoneNumber;
      if (profilePhotoUrl) profileData.profile_photo_url = profilePhotoUrl;

      const { error: profileError } = await supabase
        .from('profiles')
        .insert([profileData]);

      if (profileError) throw profileError;

      return true;
    } catch (error) {
      console.error('Error creating profile:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      if (isLogin) {
        // Sign in
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          toast.success('Welcome back!');
          onAuthSuccess();
        }
      } else {
        // Sign up
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          try {
            // Wait a moment to ensure the session is fully established
            await new Promise(resolve => setTimeout(resolve, 100));

            // Upload profile photo if provided
            let profilePhotoUrl: string | null = null;
            if (profilePhoto) {
              try {
                profilePhotoUrl = await uploadProfilePhoto(data.user.id);
              } catch (uploadError) {
                console.error('Profile photo upload failed, continuing without photo:', uploadError);
                // Continue without photo rather than failing the entire signup
                profilePhotoUrl = null;
              }
            }

            // Create profile with or without photo
            await createUserProfile(data.user.id, data.user.email!, profilePhotoUrl);

            toast.success('Account created successfully!');
            onAuthSuccess();
          } catch (profileError) {
            console.error('Profile creation failed:', profileError);
            // Even if profile creation fails, the user account was created
            // so we should still redirect them and show a warning
            toast.warning('Account created but profile setup incomplete. You can update your profile later.');
            onAuthSuccess();
          }
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      
      // Provide user-friendly Korean error messages
      const errorMessage = error.message?.toLowerCase() || '';
      
      if (errorMessage.includes('invalid login credentials') || errorMessage.includes('invalid credentials')) {
        setError('이메일 또는 비밀번호가 올바르지 않습니다. 다시 확인해주세요.');
      } else if (errorMessage.includes('email not confirmed')) {
        setError('이메일 인증이 완료되지 않았습니다. 이메일을 확인해주세요.');
      } else if (errorMessage.includes('user already registered') || errorMessage.includes('duplicate')) {
        setError('이미 가입된 이메일 주소입니다.');
      } else if (errorMessage.includes('invalid email')) {
        setError('올바른 이메일 형식이 아닙니다.');
      } else if (errorMessage.includes('password')) {
        setError('비밀번호는 최소 6자 이상이어야 합니다.');
      } else if (errorMessage.includes('row-level security')) {
        setError('프로필 생성 중 오류가 발생했습니다. 다시 시도해주세요.');
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        setError('네트워크 연결을 확인해주세요.');
      } else {
        // Default fallback message in Korean
        setError('인증 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      }
      
      // Also show a toast for better visibility
      toast.error(isLogin ? '로그인 실패' : '회원가입 실패');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setUsername('');
    setPhoneNumber('');
    setProfilePhoto(null);
    setProfilePhotoPreview('');
    setError('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    resetForm();
  };

  return (
    <div className="relative min-h-screen grid lg:grid-cols-2">
      {/* Left Side - Branding (Hidden on mobile) */}
      <div className="hidden lg:flex flex-col justify-center items-center bg-gradient-to-br from-primary/10 via-primary/5 to-background p-12 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10">
            <PawPrint className="h-20 w-20" />
          </div>
          <div className="absolute top-32 right-20">
            <PawPrint className="h-16 w-16" />
          </div>
          <div className="absolute bottom-32 left-32">
            <PawPrint className="h-24 w-24" />
          </div>
          <div className="absolute bottom-10 right-10">
            <PawPrint className="h-16 w-16" />
          </div>
        </div>

        {/* Logo */}
        <div className="mb-8 z-10">
          <Logo />
        </div>

        {/* Hero Image */}
        <div className="w-full max-w-md mb-8 rounded-2xl overflow-hidden shadow-2xl z-10">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1509205477838-a534e43a849f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYXBweSUyMGRvZyUyMGNhdCUyMHRvZ2V0aGVyfGVufDF8fHx8MTc2MjUyNjIwNnww&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Happy pets together"
            className="w-full h-96 object-cover"
          />
        </div>

        {/* Branding Text */}
        <div className="text-center space-y-4 z-10 max-w-md">
          <h1 className="text-4xl text-foreground flex items-center justify-center gap-2">
            반려동물과 함께하는 여행
            <Heart className="h-8 w-8 text-red-500 fill-red-500" />
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Pet Friendly와 함께 소중한 가족과 특별한 추억을 만들어보세요
          </p>
          <div className="flex items-center justify-center gap-4 pt-4">
            <div className="flex items-center gap-2">
              <PawPrint className="h-5 w-5 text-primary" />
              <span className="text-sm text-muted-foreground">전국 15+ 숙소</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              <span className="text-sm text-muted-foreground">안전한 여행</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="flex flex-col min-h-screen">
        {/* Mobile Logo */}
        <div className="lg:hidden absolute top-8 left-1/2 transform -translate-x-1/2 z-10">
          <Logo />
        </div>

        {/* Back Button */}
        {onBack && (
          <div className="absolute top-8 left-8 z-10">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">뒤로가기</span>
            </Button>
          </div>
        )}

        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center p-4 pt-24 lg:pt-4">
          <Card className="w-full max-w-md border-border/50 backdrop-blur-sm bg-background/95">
          <CardHeader className="space-y-1 text-center pb-6">
            <div className="flex justify-center mb-2">
              <div className="bg-primary/10 rounded-full p-3">
                <PawPrint className="h-6 w-6 text-primary" />
              </div>
            </div>
            <CardTitle className="text-3xl">
              {isLogin ? '로그인' : '회원가입'}
            </CardTitle>
            <CardDescription className="text-base">
              {isLogin 
                ? 'Pet Friendly 계정으로 로그인하세요' 
                : '새로운 계정을 만들어 시작해보세요'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">이메일</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11"
                />
              </div>

              {!isLogin && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="username">사용자 이름 (선택)</Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="사용자 이름을 입력하세요"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">전화번호 (선택)</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="010-0000-0000"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="h-11"
                    />
                  </div>

                  {/* Profile Photo Upload */}
                  <div className="space-y-2">
                    <Label htmlFor="profilePhoto">프로필 사진 (선택)</Label>
                    
                    {profilePhotoPreview ? (
                      <div className="flex items-center gap-4 p-3 border border-border rounded-lg bg-muted/30">
                        <Avatar className="h-16 w-16 border-2 border-primary/20">
                          <AvatarImage src={profilePhotoPreview} className="object-cover" />
                          <AvatarFallback className="bg-primary/10">
                            {username?.charAt(0)?.toUpperCase() || email?.charAt(0)?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" title={profilePhoto?.name}>
                            {profilePhoto?.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {profilePhoto && `${(profilePhoto.size / 1024).toFixed(1)} KB`}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={removeProfilePhoto}
                          className="p-1 h-8 w-8 shrink-0 hover:bg-destructive/10 hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16 border-2 border-dashed border-border">
                          <AvatarFallback className="bg-muted">
                            {username?.charAt(0)?.toUpperCase() || email?.charAt(0)?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <Input
                            id="profilePhoto"
                            type="file"
                            accept="image/*"
                            onChange={handleProfilePhotoChange}
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById('profilePhoto')?.click()}
                            className="w-full h-11"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            사진 업로드
                          </Button>
                          <p className="text-xs text-muted-foreground mt-1">
                            JPG, PNG (최대 5MB)
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">비밀번호</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="비밀번호를 입력하세요"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {!isLogin && (
                  <p className="text-xs text-muted-foreground">
                    최소 6자 이상의 비밀번호를 입력하세요
                  </p>
                )}
              </div>

              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">비밀번호 확인</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="비밀번호를 다시 입력하세요"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="h-11 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full h-11 mt-6" disabled={isLoading}>
                {isLoading ? '처리중...' : (isLogin ? '로그인' : '회원가입')}
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">또는</span>
                </div>
              </div>
              
              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  {isLogin ? "아직 계정이 없으신가요?" : '이미 계정이 있으신가요?'}
                </p>
                <Button
                  variant="outline"
                  className="w-full h-11"
                  onClick={toggleMode}
                  type="button"
                >
                  {isLogin ? '회원가입하기' : '로그인하기'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer Note */}
        <div className="text-center py-6 px-4">
          <p className="text-xs text-muted-foreground">
            계속 진행하시면 Pet Friendly의{' '}
            <a href="#" className="underline hover:text-foreground">이용약관</a>과{' '}
            <a href="#" className="underline hover:text-foreground">개인정보처리방침</a>에 동의하게 됩니다.
          </p>
        </div>
      </div>
      </div>
    </div>
  );
}