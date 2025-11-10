import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Switch } from './ui/switch';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './ui/accordion';
import { ArrowLeft, User, MapPin, Moon, Sun, Edit2, Upload, X, Camera, Image, Trash2, LogIn, UserPlus, Music, Search, Navigation, Loader2, AlertCircle, Thermometer, MessageSquare, FileText, Shield, Activity, Heart, Star, MessageCircle } from 'lucide-react';
import { LocationSelector } from './LocationSelector';
import { BackgroundSelector, BackgroundSelection } from './BackgroundSelector';
import { MusicSelector } from './MusicSelector';
import { Community } from './Community';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useBackground } from '../lib/useBackground';
import { useMusicContext } from '../lib/MusicContext';
import Frame1 from '../imports/Frame1';
import svgPaths from '../imports/svg-gb2wprxdte';
import playIconPaths from '../imports/svg-tj5j19xf7j';
import volumeIconPaths from '../imports/svg-x788y0ihop';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner@2.0.3';

interface WeatherAPICity {
  id: number;
  name: string;
  region: string;
  country: string;
  lat: number;
  lon: number;
  url: string;
}

const WEATHER_API_KEY = 'b93e335c0d074c2ca9874431250506';

interface ProfileProps {
  isAuthenticated: boolean;
  onLogout: () => void;
  onBack: () => void;
  onShowAuth: (mode?: 'login' | 'signup') => void;
  onViewAccommodation?: (accommodation: any) => void;
}

export function Profile({ isAuthenticated, onLogout, onBack, onShowAuth, onViewAccommodation }: ProfileProps) {
  const [activeTab, setActiveTab] = useState<'background' | 'music' | 'location' | 'profile' | 'community' | 'reservations'>('background');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightReviewId, setHighlightReviewId] = useState<string | null>(null);

  const [showBackgroundSelector, setShowBackgroundSelector] = useState(false);
  const [showMusicSelector, setShowMusicSelector] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [guestLocation, setGuestLocation] = useState('');

  // Location selector states (integrated into location tab)
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string>('');
  const [useFahrenheit, setUseFahrenheit] = useState(true);
  const [originalUseFahrenheit, setOriginalUseFahrenheit] = useState(true);
  const [hasLocationChanged, setHasLocationChanged] = useState(false);
  const [hasTemperatureChanged, setHasTemperatureChanged] = useState(false);

  // Form states
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('');
  
  // Favorites refresh trigger
  const [favoritesRefresh, setFavoritesRefresh] = useState(0);
  
  // Profile photo states
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string>('');
  const [currentProfilePhotoUrl, setCurrentProfilePhotoUrl] = useState<string>('');

  // Background management - now works for both authenticated and guest users
  const { background, saveBackground, clearBackground } = useBackground(isAuthenticated);

  // Music management - now works for both authenticated and guest users
  const { currentTrack, isPlaying, availableTracks, changeTrack, clearMusic, togglePlayPause, volume, changeVolume, previousTrack, nextTrack } = useMusicContext();

  // Display location logic
  const displayLocation = isAuthenticated ? location : guestLocation;

  // Check for dark mode preference on load
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark') || 
                   localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(isDark);
  }, []);

  // Listen for favorites updates
  useEffect(() => {
    const handleStorageChange = () => {
      setFavoritesRefresh(prev => prev + 1);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Load guest location from localStorage
  useEffect(() => {
    if (!isAuthenticated) {
      const savedGuestLocation = localStorage.getItem('guestLocation');
      if (savedGuestLocation) {
        setGuestLocation(savedGuestLocation);
      }
    }
  }, [isAuthenticated]);

  // Fetch user profile for authenticated users
  useEffect(() => {
    if (isAuthenticated) {
      const fetchProfile = async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          
          if (user) {
            // Try to get profile from profiles table
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .single();
            
            setUserProfile(profile || { id: user.id, email: user.email });
            setEmail(user.email || '');
            setUsername(profile?.username || '');
            setPhoneNumber(profile?.phone || '');
            setLocation(profile?.location || '');
            setCurrentProfilePhotoUrl(profile?.profile_photo_url || '');
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
          toast.error('Failed to load profile');
        }
      };

      fetchProfile();
    }
  }, [isAuthenticated]);

  // Load temperature unit preference when location tab becomes active
  useEffect(() => {
    if (activeTab === 'location') {
      const loadTemperaturePreference = async () => {
        // Use localStorage for all users
        const saved = localStorage.getItem('useFahrenheit');
        if (saved !== null) {
          const savedValue = saved === 'true';
          setUseFahrenheit(savedValue);
          setOriginalUseFahrenheit(savedValue);
        }
      };

      loadTemperaturePreference();
      // Reset change flags when tab becomes active
      setHasLocationChanged(false);
      setHasTemperatureChanged(false);
    }
  }, [activeTab, isAuthenticated]);

  // Search cities using WeatherAPI
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    
    const searchTimeout = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://api.weatherapi.com/v1/search.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(searchQuery)}`
        );
        
        if (response.ok) {
          const data: WeatherAPICity[] = await response.json();
          setSearchResults(data.slice(0, 10)); // Limit to 10 results
        } else {
          console.error('Weather API search failed:', response.status);
          setSearchResults([]);
        }
      } catch (error) {
        console.error('Error searching cities:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [searchQuery]);

  const handleDarkModeToggle = async (checked: boolean) => {
    setIsDarkMode(checked);
    
    if (checked) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }

    // Persist to Supabase for authenticated users
    if (isAuthenticated) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { error } = await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              is_dark_mode: checked,
              updated_at: new Date().toISOString()
            });

          if (error) {
            console.error('Error updating dark mode preference:', error);
          }
        }
      } catch (error) {
        console.error('Error saving dark mode preference:', error);
      }
    }
  };

  const handleBackgroundSelect = async (selection: BackgroundSelection) => {
    const success = await saveBackground(selection);
    if (success) {
      toast.success('Background updated successfully');
    } else {
      toast.error('Failed to save background');
    }
  };

  const handleBackgroundClear = async () => {
    await clearBackground();
    toast.success('Background reset to default');
  };

  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }

      setProfilePhoto(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfilePhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeProfilePhoto = () => {
    setProfilePhoto(null);
    setProfilePhotoPreview('');
  };

  // Location functionality handlers
  const handleCitySelect = (cityName: string) => {
    setSelectedCity(cityName);
    setHasLocationChanged(true);
  };

  const handleUseCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser');
      return;
    }

    setIsGettingLocation(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Fetch city name from coordinates using WeatherAPI
          const response = await fetch(
            `https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${latitude},${longitude}&aqi=no`
          );
          
          if (response.ok) {
            const data = await response.json();
            const cityName = data.location.name;
            
            setSearchQuery(cityName);
            setSelectedCity(cityName);
            setHasLocationChanged(true);
            toast.success(`Location detected: ${cityName}, ${data.location.country}`);
          } else {
            throw new Error('Failed to get location details');
          }
        } catch (error) {
          console.error('Error getting location details:', error);
          setLocationError('Failed to get location details. Please try manual search.');
        } finally {
          setIsGettingLocation(false);
        }
      },
      (error) => {
        setIsGettingLocation(false);
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Location access denied. Please enable location permissions or search manually.');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('Location information unavailable. Please search manually.');
            break;
          case error.TIMEOUT:
            setLocationError('Location request timed out. Please try again or search manually.');
            break;
          default:
            setLocationError('Failed to get your location. Please search manually.');
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  const handleTemperatureUnitToggle = async (checked: boolean) => {
    setUseFahrenheit(checked);
    setHasTemperatureChanged(checked !== originalUseFahrenheit);
    
    // Save to localStorage for all users
    localStorage.setItem('useFahrenheit', checked.toString());
    
    // Dispatch event to notify other components
    window.dispatchEvent(new CustomEvent('temperatureUnitChanged', { detail: checked }));
  };

  const handleLocationSave = async () => {
    if (!hasLocationChanged && !hasTemperatureChanged) {
      toast.error('No changes to save');
      return;
    }

    if (hasLocationChanged && !selectedCity) {
      toast.error('Please select a city');
      return;
    }

    try {
      if (hasLocationChanged) {
        if (isAuthenticated) {
          // Save to Supabase for authenticated users
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('No user found');

          // Update location in Supabase
          const { error } = await supabase
            .from('profiles')
            .update({ location: selectedCity })
            .eq('id', user.id);

          if (error) throw error;

          // Update local state
          setLocation(selectedCity);
        } else {
          // Save to localStorage for guest users
          localStorage.setItem('guestLocation', selectedCity);
          setGuestLocation(selectedCity);
          
          // Dispatch event to notify other components
          window.dispatchEvent(new CustomEvent('guestLocationUpdate', { detail: selectedCity }));
        }
      }
      
      // Reset change flags
      setHasLocationChanged(false);
      setHasTemperatureChanged(false);
      setSelectedCity('');
      setSearchQuery('');
      setSearchResults([]);
      setLocationError('');
      
      // Show appropriate success message
      if (hasLocationChanged && hasTemperatureChanged) {
        toast.success(`Location and temperature settings updated`);
      } else if (hasLocationChanged) {
        toast.success(`Location updated to ${selectedCity}`);
      } else if (hasTemperatureChanged) {
        toast.success(`Temperature unit updated`);
      }

    } catch (error) {
      console.error('Error saving location:', error);
      toast.error('Failed to save location. Please try again.');
    }
  };

  const formatCityDisplay = (city: WeatherAPICity) => {
    if (city.region && city.region !== city.name) {
      return `${city.name}, ${city.region}, ${city.country}`;
    }
    return `${city.name}, ${city.country}`;
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
      throw error;
    }
  };

  const handleSaveProfile = async () => {
    if (!userProfile?.id) return;
    
    setIsLoading(true);
    
    try {
      let profilePhotoUrl = currentProfilePhotoUrl;

      // Upload new profile photo if one was selected
      if (profilePhoto) {
        try {
          profilePhotoUrl = await uploadProfilePhoto(userProfile.id);
        } catch (uploadError) {
          console.error('Profile photo upload failed:', uploadError);
          toast.error('Failed to upload profile photo. Other changes will still be saved.');
          // Continue with other updates even if photo upload fails
        }
      }

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: userProfile.id,
          username: username || null,
          phone: phoneNumber || null,
          email: email,
          location: location || null,
          profile_photo_url: profilePhotoUrl || null,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      setUserProfile({ 
        ...userProfile, 
        username, 
        phone: phoneNumber,
        email, 
        location,
        profile_photo_url: profilePhotoUrl
      });
      
      setCurrentProfilePhotoUrl(profilePhotoUrl || '');
      setProfilePhoto(null);
      setProfilePhotoPreview('');
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    // Reset form to original values
    setUsername(userProfile?.username || '');
    setPhoneNumber(userProfile?.phone || '');
    setEmail(userProfile?.email || '');
    setLocation(userProfile?.location || '');
    setProfilePhoto(null);
    setProfilePhotoPreview('');
    setIsEditing(false);
  };



  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('로그아웃되었습니다');
      
      // Call parent logout handler
      if (onLogout) {
        onLogout();
      }
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('로그아웃에 실패했습니다');
    }
  };

  // Determine which photo to show in avatar
  const avatarImageSrc = profilePhotoPreview || currentProfilePhotoUrl;

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-card border border-border rounded-xl mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="p-2 h-auto hover:bg-background/50"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              
              <div className="flex items-center gap-4 flex-1">
                <div className="relative">
                  <Avatar className="h-16 w-16 border-2 border-background">
                    <AvatarImage src={avatarImageSrc} className="object-cover" />
                    <AvatarFallback className="text-lg bg-primary text-primary-foreground">
                      {isAuthenticated ? (
                        userProfile?.username?.charAt(0)?.toUpperCase() || 
                        userProfile?.email?.charAt(0)?.toUpperCase() || 'U'
                      ) : (
                        'G'
                      )}
                    </AvatarFallback>
                  </Avatar>
                  
                  {/* Photo edit overlay when in editing mode */}
                  {isAuthenticated && isEditing && (
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center cursor-pointer hover:bg-black/60 transition-colors"
                         onClick={() => document.getElementById('profilePhotoEdit')?.click()}>
                      <Camera className="h-6 w-6 text-white" />
                      <Input
                        id="profilePhotoEdit"
                        type="file"
                        accept="image/*"
                        onChange={handleProfilePhotoChange}
                        className="hidden"
                      />
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <h1 className="text-xl font-semibold text-foreground">
                    {isAuthenticated ? (
                      userProfile?.username ? `@${userProfile.username}` : '프로필'
                    ) : (
                      '설정'
                    )}
                  </h1>
                  <p className="text-muted-foreground">
                    {isAuthenticated ? userProfile?.email : '게스트 사용자'}
                  </p>
                </div>

                {/* Edit Button - Only for authenticated users */}
                {isAuthenticated && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                    className="p-2 h-auto hover:bg-background/50"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Segmented Control */}
          <div className="px-6 py-4 border-b border-border">
            <div className="grid grid-cols-6 gap-1 bg-muted rounded-lg p-1 w-full">
              <button
                onClick={() => setActiveTab('background')}
                className={`px-2 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center whitespace-nowrap ${
                  activeTab === 'background'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Image className="h-4 w-4 sm:mr-1" />
                <span className="hidden lg:inline">배경</span>
              </button>
              <button
                onClick={() => setActiveTab('music')}
                className={`px-2 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center whitespace-nowrap ${
                  activeTab === 'music'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Music className="h-4 w-4 sm:mr-1" />
                <span className="hidden lg:inline">음악</span>
              </button>
              <button
                onClick={() => setActiveTab('location')}
                className={`px-2 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center whitespace-nowrap ${
                  activeTab === 'location'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <MapPin className="h-4 w-4 sm:mr-1" />
                <span className="hidden lg:inline">위치</span>
              </button>
              <button
                onClick={() => setActiveTab('reservations')}
                className={`px-2 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center whitespace-nowrap ${
                  activeTab === 'reservations'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <FileText className="h-4 w-4 sm:mr-1" />
                <span className="hidden lg:inline">이용기록</span>
              </button>
              <button
                onClick={() => setActiveTab('community')}
                className={`px-2 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center whitespace-nowrap ${
                  activeTab === 'community'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <MessageSquare className="h-4 w-4 sm:mr-1" />
                <span className="hidden lg:inline">커뮤니티</span>
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-2 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center whitespace-nowrap ${
                  activeTab === 'profile'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <User className="h-4 w-4 sm:mr-1" />
                <span className="hidden lg:inline">내 정보</span>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {activeTab === 'background' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-foreground mb-2">배경 설정</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Pexels의 사진이나 동영상으로 홈페이지 배경을 커스터마이징하세요.
                  </p>
                </div>

                {/* Current Background Display */}
                {background && (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          <img 
                            src={background.thumbnail} 
                            alt={background.alt || 'Background'} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">
                            {background.type === 'photo' ? '사진' : '동영상'} 배경
                          </p>
                          <p className="text-sm text-muted-foreground">
                            by {background.photographer}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Background Selection Button */}
                <Button 
                  onClick={() => setShowBackgroundSelector(true)}
                  className="w-full"
                >
                  <Image className="h-4 w-4 mr-2" />
                  {background ? '배경 변경' : '배경 선택'}
                </Button>

                {!background && (
                  <div className="text-center p-8 bg-muted/30 rounded-lg border-2 border-dashed border-muted">
                    <Image className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">커스텀 배경이 설정되지 않았습니다</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      기본 테마 배경을 사용 중입니다
                    </p>
                  </div>
                )}

                {/* Dark Mode Toggle */}
                <Card>
                  <CardContent className="p-[24px]">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>다크 모드</Label>
                        <p className="text-sm text-muted-foreground">
                          어두운 환경에서 편안한 시청을 위한 다크 테마 사용
                        </p>
                      </div>
                      <Switch
                        checked={isDarkMode}
                        onCheckedChange={handleDarkModeToggle}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'music' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-foreground mb-2">음악 설정</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    로파이 트랙과 앰비언트 사운드로 홈페이지 음악을 커스터마이징하세요.
                  </p>
                </div>

                {/* Current Track Display */}
                {currentTrack && (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                          <Music className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">
                            {currentTrack.title}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            by {currentTrack.artist || 'Various Artist'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {isPlaying ? '재생 중' : '일시정지'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Previous Button */}
                          <button
                            onClick={previousTrack}
                            className="bg-[#FFFFFF] dark:bg-[rgba(30,41,59,0.3)] box-border content-stretch flex flex-row h-8 items-center justify-center px-[11px] py-px relative rounded-lg shrink-0 hover:bg-gray-50 dark:hover:bg-[rgba(30,41,59,0.5)] transition-colors"
                          >
                            <div className="absolute border border-slate-400 border-solid inset-0 pointer-events-none rounded-lg" />
                            <div className="relative shrink-0 size-4">
                              <svg
                                className="block size-full"
                                fill="none"
                                preserveAspectRatio="none"
                                viewBox="0 0 16 16"
                              >
                                <g>
                                  <mask
                                    height="16"
                                    id="mask0_140_1321"
                                    maskUnits="userSpaceOnUse"
                                    style={{ maskType: "alpha" }}
                                    width="16"
                                    x="0"
                                    y="0"
                                  >
                                    <rect
                                      fill="#D9D9D9"
                                      height="16"
                                      width="16"
                                    />
                                  </mask>
                                  <g mask="url(#mask0_140_1321)">
                                    <path
                                      d={svgPaths.p39d96380}
                                      fill="#020817"
                                      className="dark:fill-[#F8FAFC]"
                                    />
                                  </g>
                                </g>
                              </svg>
                            </div>
                          </button>

                          {/* Pause/Play Button */}
                          <button
                            onClick={togglePlayPause}
                            className="bg-[#FFFFFF] dark:bg-[rgba(30,41,59,0.3)] box-border content-stretch flex flex-row h-8 items-center justify-center px-[11px] py-px relative rounded-lg shrink-0 hover:bg-gray-50 dark:hover:bg-[rgba(30,41,59,0.5)] transition-colors"
                          >
                            <div className="absolute border border-slate-400 border-solid inset-0 pointer-events-none rounded-lg" />
                            <div className="relative shrink-0 size-4">
                              <svg
                                className="block size-full"
                                fill="none"
                                preserveAspectRatio="none"
                                viewBox="0 0 16 16"
                              >
                                <g>
                                  <mask
                                    height="16"
                                    id="mask0_140_1317"
                                    maskUnits="userSpaceOnUse"
                                    style={{ maskType: "alpha" }}
                                    width="16"
                                    x="0"
                                    y="0"
                                  >
                                    <rect
                                      fill="#D9D9D9"
                                      height="16"
                                      width="16"
                                    />
                                  </mask>
                                  <g mask="url(#mask0_140_1317)">
                                    <path
                                      d={isPlaying ? svgPaths.p21029200 : playIconPaths.p286b900}
                                      fill="#020817"
                                      className="dark:fill-[#F8FAFC]"
                                    />
                                  </g>
                                </g>
                              </svg>
                            </div>
                          </button>

                          {/* Next Button */}
                          <button
                            onClick={nextTrack}
                            className="bg-[#FFFFFF] dark:bg-[rgba(30,41,59,0.3)] box-border content-stretch flex flex-row h-8 items-center justify-center px-[11px] py-px relative rounded-lg shrink-0 hover:bg-gray-50 dark:hover:bg-[rgba(30,41,59,0.5)] transition-colors"
                          >
                            <div className="absolute border border-slate-400 border-solid inset-0 pointer-events-none rounded-lg" />
                            <div className="relative shrink-0 size-4">
                              <svg
                                className="block size-full"
                                fill="none"
                                preserveAspectRatio="none"
                                viewBox="0 0 16 16"
                              >
                                <g>
                                  <mask
                                    height="16"
                                    id="mask0_140_1325"
                                    maskUnits="userSpaceOnUse"
                                    style={{ maskType: "alpha" }}
                                    width="16"
                                    x="0"
                                    y="0"
                                  >
                                    <rect
                                      fill="#D9D9D9"
                                      height="16"
                                      width="16"
                                    />
                                  </mask>
                                  <g mask="url(#mask0_140_1325)">
                                    <path
                                      d={svgPaths.p34ac4200}
                                      fill="#020817"
                                      className="dark:fill-[#F8FAFC]"
                                    />
                                  </g>
                                </g>
                              </svg>
                            </div>
                          </button>
                        </div>
                      </div>
                      
                      {/* Volume Slider */}
                      <div className="bg-muted/50 border border-border relative rounded-[10px] shrink-0 w-full mt-6">
                        <div className="relative size-full">
                          <div className="box-border content-stretch flex flex-col gap-3 items-start justify-start p-[17px] relative w-full">
                            <div className="box-border content-stretch flex flex-row items-center justify-between p-0 relative shrink-0 w-full">
                              <div className="box-border content-stretch flex flex-col items-start justify-start p-0 relative shrink-0">
                                <div className="flex flex-col font-['SF_Pro_Text:Medium',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-left text-nowrap text-foreground">
                                  <p className="block leading-[24px] whitespace-pre">음량</p>
                                </div>
                                <div className="flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-left text-nowrap text-muted-foreground">
                                  <p className="block leading-[20px] whitespace-pre">재생 볼륨 조절</p>
                                </div>
                              </div>
                              <div className="box-border content-stretch flex flex-col items-start justify-start p-0 relative shrink-0">
                                <div className="flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-left text-nowrap text-muted-foreground">
                                  <p className="block leading-[20px] whitespace-pre">{Math.round(volume * 100)}%</p>
                                </div>
                              </div>
                            </div>
                            <div className="h-4 relative shrink-0 w-full">
                              {/* Volume off icon */}
                              <div className="absolute left-0 size-4 top-1/2 translate-y-[-50%]">
                                <svg
                                  className="block size-full"
                                  fill="none"
                                  preserveAspectRatio="none"
                                  viewBox="0 0 16 16"
                                >
                                  <g>
                                    <path
                                      d={volumeIconPaths.p39ac0980}
                                      stroke="currentColor"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="1.33333"
                                      className="text-muted-foreground"
                                    />
                                    <path
                                      d="M14.6667 6L10.6667 10"
                                      stroke="currentColor"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="1.33333"
                                      className="text-muted-foreground"
                                    />
                                    <path
                                      d="M10.6667 6L14.6667 10"
                                      stroke="currentColor"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="1.33333"
                                      className="text-muted-foreground"
                                    />
                                  </g>
                                </svg>
                              </div>
                              
                              {/* Volume on icon */}
                              <div className="absolute right-0 size-4 top-1/2 translate-y-[-50%]">
                                <svg
                                  className="block size-full"
                                  fill="none"
                                  preserveAspectRatio="none"
                                  viewBox="0 0 16 16"
                                >
                                  <g>
                                    <path
                                      d={volumeIconPaths.p39ac0980}
                                      stroke="currentColor"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="1.33333"
                                      className="text-muted-foreground"
                                    />
                                    <path
                                      d={volumeIconPaths.p33554180}
                                      stroke="currentColor"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="1.33333"
                                      className="text-muted-foreground"
                                    />
                                    <path
                                      d={volumeIconPaths.p30a38f00}
                                      stroke="currentColor"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="1.33333"
                                      className="text-muted-foreground"
                                    />
                                  </g>
                                </svg>
                              </div>
                              
                              {/* Volume slider */}
                              <div className="absolute box-border content-stretch flex flex-row items-center justify-center left-7 p-0 right-7 top-1/2 translate-y-[-50%]">
                                <div 
                                  className="basis-0 bg-border grow h-4 min-h-px min-w-px overflow-clip relative rounded-[9999px] shrink-0 cursor-pointer"
                                  onClick={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const percent = (e.clientX - rect.left) / rect.width;
                                    changeVolume(percent);
                                  }}
                                >
                                  <div 
                                    className="absolute bg-primary bottom-0 left-0 top-0"
                                    style={{
                                      right: `${100 - (volume * 100)}%`
                                    }}
                                  />
                                </div>
                                <div
                                  className="absolute bg-background border border-border rounded-[9999px] size-4 top-0 cursor-pointer shadow-sm"
                                  style={{
                                    left: `${volume * 100}%`,
                                    transform: 'translateX(-50%)'
                                  }}
                                  onMouseDown={(e) => {
                                    const startX = e.clientX;
                                    const startVolume = volume;
                                    const slider = e.currentTarget.parentElement;
                                    const sliderRect = slider?.getBoundingClientRect();
                                    
                                    const handleMouseMove = (e: MouseEvent) => {
                                      if (!sliderRect) return;
                                      const deltaX = e.clientX - startX;
                                      const deltaPercent = deltaX / sliderRect.width;
                                      const newVolume = startVolume + deltaPercent;
                                      changeVolume(newVolume);
                                    };
                                    
                                    const handleMouseUp = () => {
                                      document.removeEventListener('mousemove', handleMouseMove);
                                      document.removeEventListener('mouseup', handleMouseUp);
                                    };
                                    
                                    document.addEventListener('mousemove', handleMouseMove);
                                    document.addEventListener('mouseup', handleMouseUp);
                                  }}
                                >
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Music Selection Button */}
                <Button 
                  onClick={() => setShowMusicSelector(true)}
                  className="w-full"
                >
                  <Music className="h-4 w-4 mr-2" />
                  {currentTrack ? '트랙 변경' : '음악 선택'}
                </Button>

                {!currentTrack && (
                  <div className="text-center p-8 bg-muted/30 rounded-lg border-2 border-dashed border-muted">
                    <Music className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">선택된 음악이 없습니다</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      로파이 트랙 컬렉션에서 선택하세요
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'location' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-foreground mb-2">시간 및 위치 설정</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    정확한 날씨 정보를 위해 위치를 설정하세요.
                  </p>
                </div>

                {/* Current Location Display */}
                {displayLocation && (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-foreground">{displayLocation}</p>
                          <p className="text-sm text-muted-foreground">현재 위치</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Use Current Location Button */}
                <Button
                  variant="outline"
                  onClick={handleUseCurrentLocation}
                  disabled={isGettingLocation}
                  className="w-full"
                >
                  {isGettingLocation ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      위치 확인 중...
                    </>
                  ) : (
                    <>
                      <Navigation className="h-4 w-4 mr-2" />
                      현재 위치 사용
                    </>
                  )}
                </Button>

                {/* Location Error */}
                {locationError && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-red-800 dark:text-red-200">{locationError}</p>
                    </div>
                  </div>
                )}

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      또는 직접 검색
                    </span>
                  </div>
                </div>

                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="도시 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Search Results */}
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {isSearching ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      <span className="ml-2 text-sm text-muted-foreground">도시 검색 중...</span>
                    </div>
                  ) : searchQuery.length >= 2 ? (
                    searchResults.length > 0 ? (
                      <div className="space-y-1">
                        {searchResults.map((city) => (
                          <button
                            key={city.id}
                            onClick={() => handleCitySelect(city.name)}
                            className={`w-full p-3 text-left rounded-lg border transition-colors hover:bg-muted ${
                              selectedCity === city.name ? 'bg-primary/10 border-primary' : 'border-border'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">{city.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {formatCityDisplay(city)}
                                </div>
                              </div>
                              {selectedCity === city.name && (
                                <div className="w-2 h-2 bg-primary rounded-full"></div>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">도시를 찾을 수 없습니다</p>
                        <p className="text-xs">다른 검색어를 시도해보세요</p>
                      </div>
                    )
                  ) : searchQuery.length > 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      <p className="text-sm">검색하려면 최소 2글자를 입력하세요</p>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">현재 위치를 사용하거나 도시를 검색하세요</p>
                    </div>
                  )}
                </div>

                {/* Temperature Unit Toggle */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="flex items-center gap-2">
                          <Thermometer className="h-4 w-4" />
                          온도 단위
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          화씨와 섭씨 중 선택하세요
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm ${!useFahrenheit ? 'text-foreground' : 'text-muted-foreground'}`}>°C</span>
                        <Switch
                          checked={useFahrenheit}
                          onCheckedChange={handleTemperatureUnitToggle}
                        />
                        <span className={`text-sm ${useFahrenheit ? 'text-foreground' : 'text-muted-foreground'}`}>°F</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Save Button */}
                {(hasLocationChanged || hasTemperatureChanged) && (
                  <Button 
                    onClick={handleLocationSave} 
                    className="w-full"
                  >
                    저장
                  </Button>
                )}
              </div>
            )}

            {activeTab === 'reservations' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-foreground mb-2">숙소 이용 기록</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    지금까지 예약한 숙소 내역을 확인하실 수 있습니다.
                  </p>
                </div>

                {(() => {
                  const reservations = JSON.parse(localStorage.getItem('petfriendly_reservations') || '[]');
                  const sortedReservations = reservations.sort((a: any, b: any) => 
                    new Date(b.reservationDate).getTime() - new Date(a.reservationDate).getTime()
                  );

                  return sortedReservations.length > 0 ? (
                    <div className="space-y-4">
                      {sortedReservations.map((reservation: any, index: number) => (
                        <Card key={index} className="overflow-hidden">
                          <div className="flex flex-col sm:flex-row gap-4 p-4">
                            {/* Accommodation Image */}
                            <div className="w-full sm:w-32 h-24 rounded-lg overflow-hidden flex-shrink-0">
                              <img
                                src={reservation.accommodationImage}
                                alt={reservation.accommodationName}
                                className="w-full h-full object-cover"
                              />
                            </div>

                            {/* Reservation Details */}
                            <div className="flex-1 space-y-2">
                              <div>
                                <h4 className="font-medium text-foreground">{reservation.accommodationName}</h4>
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {reservation.accommodationLocation}
                                </p>
                              </div>

                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                                <div className="text-muted-foreground">
                                  <span className="font-medium text-foreground">예약번호:</span> {reservation.reservationNumber}
                                </div>
                                <div className="text-muted-foreground">
                                  <span className="font-medium text-foreground">숙박:</span> {reservation.nights}박
                                </div>
                                <div className="text-muted-foreground">
                                  <span className="font-medium text-foreground">반려동물:</span> {reservation.numberOfPets}마리
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                                <div className="text-muted-foreground">
                                  <span className="font-medium text-foreground">체크인:</span>{' '}
                                  {new Date(reservation.checkInDate).toLocaleDateString('ko-KR', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </div>
                                <div className="text-muted-foreground">
                                  <span className="font-medium text-foreground">체크아웃:</span>{' '}
                                  {new Date(reservation.checkOutDate).toLocaleDateString('ko-KR', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-2 border-t">
                                <div>
                                  <span className="text-sm text-muted-foreground">총 금액</span>
                                  <div className="text-lg text-primary">
                                    ₩{reservation.totalPrice.toLocaleString()}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-xs text-muted-foreground">예약일시</div>
                                  <div className="text-sm">
                                    {new Date(reservation.reservationDate).toLocaleDateString('ko-KR')}
                                  </div>
                                </div>
                              </div>

                              {reservation.specialRequests && (
                                <div className="pt-2 border-t">
                                  <div className="text-sm font-medium mb-1">특별 요청사항</div>
                                  <div className="text-sm text-muted-foreground bg-muted/30 p-2 rounded">
                                    {reservation.specialRequests}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <p className="text-muted-foreground mb-2">아직 예약 내역이 없습니다</p>
                        <p className="text-sm text-muted-foreground">
                          Pet Friendly 숙소를 예약하고 반려동물과 함께 특별한 여행을 떠나보세요!
                        </p>
                      </CardContent>
                    </Card>
                  );
                })()}
              </div>
            )}

            {activeTab === 'community' && (
              <Community 
                isAuthenticated={isAuthenticated}
                onShowAuth={onShowAuth}
              />
            )}

            {activeTab === 'likes' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-foreground mb-2">좋아요 목록</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    내가 좋아요를 누른 후기들을 모아볼 수 있습니다.
                  </p>
                </div>

                {(() => {
                  // Get liked reviews from localStorage
                  const userLikesJson = localStorage.getItem('petfriendly_likes');
                  const userLikes: string[] = userLikesJson ? JSON.parse(userLikesJson) : [];

                  // Get all reviews (mock + user reviews)
                  const userReviewsJson = localStorage.getItem('petfriendly_reviews');
                  const userReviews = userReviewsJson ? JSON.parse(userReviewsJson) : [];
                  
                  // Mock reviews from Community.tsx
                  const MOCK_REVIEWS = [
                    {
                      id: '1',
                      user_id: 'user1',
                      accommodation_name: '제주 오션뷰 펫 리조트',
                      rating: 5,
                      title: '우리 댕댕이가 정말 좋아했어요! 🐕',
                      content: '제주도 여행 중 방문했는데 정말 최고였어요! 특히 전용 애견 수영장이 있어서 우리 골든리트리버 해피가 신나게 놀았습니다.',
                      images: ['https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800'],
                      likes_count: 42,
                      comments_count: 8,
                      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                      user_profile: {
                        username: '해피맘',
                        profile_photo_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200'
                      }
                    },
                    {
                      id: '2',
                      user_id: 'user2',
                      accommodation_name: '강릉 바다 애견 호텔',
                      rating: 5,
                      title: '바다뷰가 정말 환상적이에요!',
                      content: '강아지와 함께 바다를 보면서 힐링할 수 있는 곳이에요. 특히 일출이 정말 아름다웠고, 펜션 앞 해변에서 자유롭게 산책할 수 있어서 좋았습니다.',
                      images: ['https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800'],
                      likes_count: 35,
                      comments_count: 6,
                      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                      user_profile: {
                        username: '코코아빠',
                        profile_photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200'
                      }
                    }
                  ];

                  const allReviews = [...MOCK_REVIEWS, ...userReviews];
                  const likedReviews = allReviews.filter(review => userLikes.includes(review.id));

                  if (!isAuthenticated) {
                    return (
                      <Card>
                        <CardContent className="py-12 text-center">
                          <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                          <p className="text-muted-foreground mb-4">로그인이 필요합니다</p>
                          <div className="flex gap-2 justify-center">
                            <Button onClick={() => onShowAuth('login')} variant="default">
                              <LogIn className="h-4 w-4 mr-2" />
                              로그인
                            </Button>
                            <Button onClick={() => onShowAuth('signup')} variant="outline">
                              <UserPlus className="h-4 w-4 mr-2" />
                              회원가입
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  }

                  if (likedReviews.length === 0) {
                    return (
                      <Card>
                        <CardContent className="py-12 text-center">
                          <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                          <p className="text-muted-foreground mb-2">아직 좋아요를 누른 후기가 없습니다</p>
                          <p className="text-sm text-muted-foreground">
                            커뮤니티에서 마음에 드는 후기에 좋아요를 눌러보세요!
                          </p>
                        </CardContent>
                      </Card>
                    );
                  }

                  return (
                    <div className="space-y-4">
                      {likedReviews.map((review) => (
                        <Card key={review.id}>
                          <CardContent className="p-6">
                            <div className="space-y-4">
                              {/* Header */}
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <Avatar className="h-10 w-10 flex-shrink-0">
                                    <AvatarImage src={review.user_profile.profile_photo_url} />
                                    <AvatarFallback>{review.user_profile.username[0]}</AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <p className="font-medium truncate">{review.user_profile.username}</p>
                                      <div className="flex">
                                        {[...Array(5)].map((_, i) => (
                                          <Star
                                            key={i}
                                            className={`h-3 w-3 ${
                                              i < review.rating
                                                ? 'fill-yellow-400 text-yellow-400'
                                                : 'text-gray-300'
                                            }`}
                                          />
                                        ))}
                                      </div>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{review.accommodation_name}</p>
                                  </div>
                                </div>
                                <Badge variant="secondary" className="flex-shrink-0">
                                  {new Date(review.created_at).toLocaleDateString('ko-KR', { 
                                    month: 'short', 
                                    day: 'numeric' 
                                  })}
                                </Badge>
                              </div>

                              {/* Content */}
                              <div>
                                <h4 className="font-medium mb-1">{review.title}</h4>
                                <p className="text-sm text-muted-foreground line-clamp-3">{review.content}</p>
                              </div>

                              {/* Images */}
                              {review.images && review.images.length > 0 && (
                                <div className="grid grid-cols-3 gap-2">
                                  {review.images.slice(0, 3).map((image, idx) => (
                                    <div key={idx} className="aspect-square rounded-lg overflow-hidden bg-muted">
                                      <img
                                        src={image}
                                        alt={`Review image ${idx + 1}`}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Stats */}
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                                  {review.likes_count}
                                </div>
                                <div className="flex items-center gap-1">
                                  <MessageCircle className="h-4 w-4" />
                                  {review.comments_count}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="space-y-6">
                {isAuthenticated ? (
                  <>
                    {/* Profile Photo Edit Section - Only show when editing */}
                    {isEditing && profilePhotoPreview && (
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">새 프로필 사진</CardTitle>
                          <CardDescription>
                            새 프로필 사진 미리보기
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center gap-4">
                            <Avatar className="h-16 w-16">
                              <AvatarImage src={profilePhotoPreview} className="object-cover" />
                              <AvatarFallback>
                                {username?.charAt(0)?.toUpperCase() || userProfile?.email?.charAt(0)?.toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{profilePhoto?.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {profilePhoto && `${(profilePhoto.size / 1024).toFixed(1)} KB`}
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={removeProfilePhoto}
                              className="p-1 h-8 w-8"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Profile Form */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">이메일</Label>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={!isEditing}
                          className="bg-background"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="username">사용자명</Label>
                        <Input
                          id="username"
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          disabled={!isEditing}
                          placeholder="사용자명 입력"
                          className="bg-background"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">전화번호</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          disabled={!isEditing}
                          placeholder="전화번호 입력"
                          className="bg-background"
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {isEditing && (
                      <div className="flex gap-3">
                        <Button 
                          onClick={handleSaveProfile} 
                          disabled={isLoading}
                          className="flex-1"
                        >
                          {isLoading ? '저장 중...' : '변경사항 저장'}
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={handleCancelEdit}
                          className="flex-1"
                        >
                          취소
                        </Button>
                      </div>
                    )}

                    {/* Favorite Accommodations */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Heart className="h-5 w-5" />
                          좋아요한 숙소
                        </CardTitle>
                        <CardDescription>
                          내가 좋아요를 누른 숙소들을 모아볼 수 있습니다.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {(() => {
                          // Get favorites from localStorage
                          const favoritesDataJson = localStorage.getItem('petfriendly_favorites_data');
                          const favoritesData = favoritesDataJson ? JSON.parse(favoritesDataJson) : [];

                          if (favoritesData.length === 0) {
                            return (
                              <div className="flex flex-col items-center justify-center py-8 text-center">
                                <Heart className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                                <p className="text-muted-foreground mb-2">좋아요한 숙소가 없습니다</p>
                                <p className="text-sm text-muted-foreground">
                                  마음에 드는 숙소에 하트를 눌러보세요!
                                </p>
                              </div>
                            );
                          }

                          const handleRemoveFavorite = (e: React.MouseEvent, favoriteId: string) => {
                            e.stopPropagation();
                            
                            // Remove from favorites
                            const updatedFavorites = favoritesData.filter((fav: any) => fav.id !== favoriteId);
                            localStorage.setItem('petfriendly_favorites_data', JSON.stringify(updatedFavorites));
                            
                            // Also update the favorites list
                            const favoritesJson = localStorage.getItem('petfriendly_favorites');
                            const favorites: string[] = favoritesJson ? JSON.parse(favoritesJson) : [];
                            const updatedFavoritesList = favorites.filter(id => id !== favoriteId);
                            localStorage.setItem('petfriendly_favorites', JSON.stringify(updatedFavoritesList));
                            
                            toast.success('좋아요를 취소했습니다');
                            
                            // Force re-render by triggering a state update
                            window.dispatchEvent(new Event('storage'));
                          };

                          const handleCardClick = (favorite: any) => {
                            if (onViewAccommodation) {
                              // Navigate to detail page and close profile
                              onViewAccommodation(favorite);
                              onBack();
                            }
                          };

                          return (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {favoritesData.map((favorite: any) => {
                                const data = favorite.data || {};
                                return (
                                  <Card 
                                    key={favorite.id} 
                                    className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                                    onClick={() => handleCardClick(favorite)}
                                  >
                                    <div className="relative aspect-video overflow-hidden">
                                      {data.image && (
                                        <ImageWithFallback
                                          src={data.image}
                                          alt={favorite.name}
                                          className="w-full h-full object-cover"
                                        />
                                      )}
                                      <button 
                                        className="absolute top-2 right-2 bg-background/90 backdrop-blur-sm rounded-full p-2 hover:bg-background transition-colors"
                                        onClick={(e) => handleRemoveFavorite(e, favorite.id)}
                                        title="좋아요 취소"
                                      >
                                        <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                                      </button>
                                    </div>
                                    <CardContent className="p-4">
                                      <h4 className="font-medium mb-1 line-clamp-1">{favorite.name}</h4>
                                      {data.location && (
                                        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                                          <MapPin className="h-3 w-3" />
                                          {data.location}
                                        </div>
                                      )}
                                      <div className="flex items-center justify-between">
                                        {data.rating && (
                                          <div className="flex items-center gap-1">
                                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                            <span className="text-sm">{data.rating}</span>
                                          </div>
                                        )}
                                        {data.price && (
                                          <div className="text-sm font-medium">
                                            {data.price}
                                          </div>
                                        )}
                                      </div>
                                    </CardContent>
                                  </Card>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </CardContent>
                    </Card>

                    {/* Additional Sections - Accordion */}
                    <Card>
                      <Accordion type="single" collapsible className="w-full">
                        {/* Activity History */}
                        <AccordionItem value="activity">
                          <AccordionTrigger className="px-6">
                            <div className="flex items-center gap-2">
                              <Activity className="h-4 w-4" />
                              <span>활동기록</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-6">
                            <div className="space-y-4">
                              {(() => {
                                const reviews = JSON.parse(localStorage.getItem('petfriendly_reviews') || '[]');
                                const userReviews = reviews.filter((r: any) => r.user_id === userProfile?.id);
                                
                                // Get all comments from localStorage (including comments on MOCK_REVIEWS)
                                const allComments: any[] = [];
                                // Check all localStorage keys for comments
                                for (let i = 0; i < localStorage.length; i++) {
                                  const key = localStorage.key(i);
                                  if (key && key.startsWith('petfriendly_comments_')) {
                                    const commentsJson = localStorage.getItem(key);
                                    if (commentsJson) {
                                      try {
                                        const reviewComments = JSON.parse(commentsJson);
                                        allComments.push(...reviewComments);
                                      } catch (e) {
                                        console.error('Error parsing comments:', e);
                                      }
                                    }
                                  }
                                }
                                const userComments = allComments.filter((c: any) => c.user_id === userProfile?.id);

                                return (
                                  <>
                                    <div>
                                      <h4 className="font-medium mb-2">내가 작성한 후기</h4>
                                      {userReviews.length > 0 ? (
                                        <div className="space-y-2">
                                          {userReviews.map((review: any) => (
                                            <Card 
                                              key={review.id}
                                              className="cursor-pointer hover:bg-muted/50 transition-colors"
                                              onClick={() => setActiveTab('community')}
                                            >
                                              <CardContent className="p-4">
                                                <div className="flex items-start gap-3">
                                                  <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                      <span className="font-medium">{review.accommodation_name}</span>
                                                      <Badge variant="secondary" className="text-xs">
                                                        ⭐ {review.rating}
                                                      </Badge>
                                                    </div>
                                                    <p className="font-medium text-sm mb-1">{review.title}</p>
                                                    <p className="text-sm text-muted-foreground line-clamp-2">{review.content}</p>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                      {new Date(review.created_at).toLocaleDateString('ko-KR')}
                                                    </p>
                                                  </div>
                                                </div>
                                              </CardContent>
                                            </Card>
                                          ))}
                                        </div>
                                      ) : (
                                        <p className="text-sm text-muted-foreground">작성한 후기가 없습니다.</p>
                                      )}
                                    </div>

                                    <div>
                                      <h4 className="font-medium mb-2">내가 작성한 댓글</h4>
                                      {userComments.length > 0 ? (
                                        <div className="space-y-2">
                                          {userComments.map((comment: any, idx: number) => (
                                            <Card 
                                              key={idx}
                                              className="cursor-pointer hover:bg-muted/50 transition-colors"
                                              onClick={() => setActiveTab('community')}
                                            >
                                              <CardContent className="p-3">
                                                <p className="text-sm">{comment.content}</p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                  {new Date(comment.created_at).toLocaleDateString('ko-KR')}
                                                </p>
                                              </CardContent>
                                            </Card>
                                          ))}
                                        </div>
                                      ) : (
                                        <p className="text-sm text-muted-foreground">작성한 댓글이 없습니다.</p>
                                      )}
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                          </AccordionContent>
                        </AccordionItem>

                        {/* Terms of Service */}
                        <AccordionItem value="terms">
                          <AccordionTrigger className="px-6">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              <span>이용약관</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-6">
                            <div className="prose prose-sm max-w-none dark:prose-invert">
                              <h4>Pet Friendly 이용약관</h4>
                              <p className="text-sm text-muted-foreground">최종 업데이트: 2025년 11월 8일</p>
                              
                              <h5 className="mt-4">제1조 (��적)</h5>
                              <p className="text-sm">
                                본 약관은 Pet Friendly(이하 "서비스")가 제공하는 반려동물 동반 숙소 예약 및 정보 제공 서비스의 이용과 관련하여 ���사와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
                              </p>

                              <h5 className="mt-4">제2조 (정의)</h5>
                              <p className="text-sm">
                                1. "서비스"란 Pet Friendly가 제공하는 반려동물 동반 가능한 숙소 정보, 예약, 커뮤니티 등 모든 서비스를 의미합니다.<br />
                                2. "회원"이란 본 약관에 따라 서비스 이용 계약을 체결하고 서비스를 이용하는 자를 말합니다.<br />
                                3. "게스트"란 회원 가입 없이 제한적으로 서비스를 이용하는 자를 말합니다.
                              </p>

                              <h5 className="mt-4">제3조 (서비스의 내용)</h5>
                              <p className="text-sm">
                                1. 반려동물 동반 가능 숙소 정보 제공<br />
                                2. 숙소 예약 및 관리 서비스<br />
                                3. 커뮤니티 및 후기 공유 서비스<br />
                                4. 맞춤형 배경, 음악, 날씨 정보 제공<br />
                                5. 기타 회사가 정하는 서비스
                              </p>

                              <h5 className="mt-4">제4조 (회원가입)</h5>
                              <p className="text-sm">
                                1. 회원가입은 이용자가 약관의 내용에 동의하고 회사가 정한 절차에 따라 회원가입 신청을 완료함으로써 성립됩니다.<br />
                                2. 회사는 다음 각 호에 해당하는 경우 회원가입을 거부할 수 있습니다:<br />
                                - 실명이 아니거나 타인의 정보를 도용한 경우<br />
                                - 회원가입 신청서의 내용을 허위로 기재한 경우<br />
                                - 관련 법령을 위반한 경우
                              </p>

                              <h5 className="mt-4">제5조 (개인정보 보호)</h5>
                              <p className="text-sm">
                                회사는 관련 법령이 정하는 바에 따라 회원의 개인정보를 보호하기 위해 노력합니다. 개인정보의 보호 및 이용에 관해서는 관련 법령 및 회사의 개인정보 처리방침이 적용됩니다.
                              </p>

                              <h5 className="mt-4">제6조 (예약 및 취소)</h5>
                              <p className="text-sm">
                                1. 모든 숙소 예약은 사전 예약이 필수입니다.<br />
                                2. 예약 취소 및 환불 정책은 각 숙소의 정책을 따릅니다.<br />
                                3. 반려동물 동반 시 추가 요금이 발생할 수 있으며, 이는 각 숙소의 정책에 따릅니다.
                              </p>
                            </div>
                          </AccordionContent>
                        </AccordionItem>

                        {/* Privacy Policy */}
                        <AccordionItem value="privacy">
                          <AccordionTrigger className="px-6">
                            <div className="flex items-center gap-2">
                              <Shield className="h-4 w-4" />
                              <span>개인정보 취급방침</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-6">
                            <div className="prose prose-sm max-w-none dark:prose-invert">
                              <h4>Pet Friendly 개인정보 취급방침</h4>
                              <p className="text-sm text-muted-foreground">최종 업데이트: 2025년 11월 8일</p>
                              
                              <h5 className="mt-4">1. 개인정보의 수집 및 이용 목적</h5>
                              <p className="text-sm">
                                Pet Friendly는 다음의 목적을 위하여 개인정보를 처리합니다:<br />
                                - 회원 가입 및 관리<br />
                                - 서비스 제공 및 개선<br />
                                - 맞춤형 서비스 제공 (배경, 음악, 위치 기반 날씨 정보)<br />
                                - 고객 문의 및 불만 처리<br />
                                - 법령 ��� 이용약관을 위반하는 회원에 대한 조치
                              </p>

                              <h5 className="mt-4">2. 수집하는 개인정보 항목</h5>
                              <p className="text-sm">
                                <strong>필수 정보:</strong><br />
                                - 이메일 주소<br />
                                - 비밀번호 (암호화 저장)<br />
                                <br />
                                <strong>선택 정보:</strong><br />
                                - 사용자명<br />
                                - 전화번호<br />
                                - 프로필 사진<br />
                                - 위치 정보 (날씨 정보 제공용)<br />
                                - 배경 및 음악 설정<br />
                                - 다크모드 설정
                              </p>

                              <h5 className="mt-4">3. 개인정보의 보유 및 이용 기간</h5>
                              <p className="text-sm">
                                회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.<br />
                                <br />
                                - 회원 탈퇴 시까지: 회원정보, 서비스 이용 기록<br />
                                - 법령에서 정한 기간: 계약 또는 청약철회 등에 관한 기록 (5년)
                              </p>

                              <h5 className="mt-4">4. 개인정보의 제3자 제공</h5>
                              <p className="text-sm">
                                회사는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만, 다음의 경우에는 예외로 합니다:<br />
                                - 이용자가 사전에 동의한 경우<br />
                                - 법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우
                              </p>

                              <h5 className="mt-4">5. 개인정보의 파기</h5>
                              <p className="text-sm">
                                회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체 없이 해당 개인정보를 파기합니다.<br />
                                <br />
                                - 전자적 파일 형태: 복구 및 재생되지 않도록 안전하게 삭제<br />
                                - 기록물, 인쇄물, 서면 등: 분쇄 또는 소각
                              </p>

                              <h5 className="mt-4">6. 이용자의 권리</h5>
                              <p className="text-sm">
                                정보주체는 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다:<br />
                                - 개인정보 열람 요구<br />
                                - 오류 등이 있을 경우 정정 요구<br />
                                - 삭제 요구<br />
                                - 처리정지 요구
                              </p>

                              <h5 className="mt-4">7. 개인정보 보호책임자</h5>
                              <p className="text-sm">
                                Pet Friendly는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제를 처리하기 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.<br />
                                <br />
                                개인정보 보호책임자<br />
                                이메일: privacy@petfriendly.com
                              </p>

                              <h5 className="mt-4">8. 쿠키 및 자동 수집 정보</h5>
                              <p className="text-sm">
                                서비스는 사용자 경험 개선을 위해 브라우저 로컬스토리지를 사용합니다. 이는 사용자의 설정 (다크모드, 배경, 음악 등)을 저장하는 데 사용되며, 사용자는 언제든지 브라우저 설정을 통해 이를 관리할 수 있습니다.
                              </p>

                              <h5 className="mt-4">9. 개인정보 처리방침의 변경</h5>
                              <p className="text-sm">
                                이 개인정보 처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.
                              </p>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </Card>

                    {/* Sign Out Button - Secondary Treatment */}
                    <Button 
                      variant="secondary" 
                      onClick={handleLogout}
                      className="w-full"
                    >
                      로그아웃
                    </Button>
                  </>
                ) : (
                  <>
                    {/* Login/Signup prompt for unauthenticated users */}
                    <div className="text-center space-y-6">
                      <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="h-8 w-8 text-primary" />
                      </div>
                      
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold">계정 만들기</h3>
                        <p className="text-sm text-muted-foreground">
                          가입하여 환경 설정을 저장하고, 프로필을 사용자화하고, 기기 간 설정을 동기화하세요.
                        </p>
                      </div>

                      <div className="space-y-3">
                        <Button 
                          onClick={() => onShowAuth('signup')}
                          className="w-full"
                          size="lg"
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          회원가입
                        </Button>
                        <Button 
                          onClick={() => onShowAuth('login')}
                          variant="outline"
                          className="w-full"
                        >
                          <LogIn className="h-4 w-4 mr-2" />
                          로그인
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}


          </div>
        </div>



        {/* Background Selector Modal */}
        <BackgroundSelector
          isOpen={showBackgroundSelector}
          onClose={() => setShowBackgroundSelector(false)}
          onSelect={handleBackgroundSelect}
          currentBackground={background}
        />

        {/* Music Selector Modal */}
        <MusicSelector
          isOpen={showMusicSelector}
          onClose={() => setShowMusicSelector(false)}
          isAuthenticated={isAuthenticated}
        />
      </div>
    </div>
  );
}