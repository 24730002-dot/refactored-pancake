import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Profile } from './Profile';
import { Logo } from './Logo';
import { LocationSelector } from './LocationSelector';
import { AccommodationList } from './AccommodationList';
import { AccommodationDetail } from './AccommodationDetail';
import { ReservationConfirmation } from './ReservationConfirmation';
import { Notifications } from './Notifications';
import { Edit3, ChevronDown, Sun, Moon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { useBackground } from '../lib/useBackground';
import newbg from '../assets/1.jpg';
import framesvgPaths from '../imports/svg-wrlpobapsl';
// 음악 관련 import 전부 제거 (useMusicContext, MusicSelector, playButtonPaths 등)
import { ScrollTopButton } from './ScrollTopButton'; 

interface DashboardProps {
  isAuthenticated: boolean;
  userId: string | null;
  onLogout: () => void;
  onShowAuth: (mode?: 'login' | 'signup') => void;
  locationRefreshTrigger?: number;
  onLocationRefresh?: () => void;
}

interface WeatherData {
  temp: number;
  condition: string;
  location?: string;
  humidity?: number;
  windSpeed?: number;
}

const WEATHER_API_KEY = 'b93e335c0d074c2ca9874431250506';

export function Dashboard({
  isAuthenticated,
  userId,
  onLogout,
  onShowAuth,
  locationRefreshTrigger,
  onLocationRefresh,
}: DashboardProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [weather, setWeather] = useState<WeatherData>({ temp: 78, condition: 'Clear' });
  const [showProfile, setShowProfile] = useState(false);
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [currentLocation, setCurrentLocation] = useState<string>('');
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [isHoveringWidget, setIsHoveringWidget] = useState(false);
  const [guestLocation, setGuestLocation] = useState<string>('');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string>('');
  const [useFahrenheit, setUseFahrenheit] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [selectedAccommodation, setSelectedAccommodation] = useState<any>(null);
  const [completedReservation, setCompletedReservation] = useState<any>(null);

  // 상세 화면 여부 (리스트 / 상세 뷰 판단용)
  const isDetailView = Boolean(selectedAccommodation || completedReservation);

  // Custom background hook
  const { background } = useBackground(isAuthenticated);

  useEffect(() => {
    const body = document.body;
    body.style.setProperty('--custom-bg-url', `url(${newbg})`);
    body.classList.add('custom-background');
  }, []);

  // Scroll to top on component mount (for mobile)
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  useEffect(() => {
  // 디테일/예약 화면으로 들어갈 때
  if (selectedAccommodation || completedReservation) {
    const isMobile = window.innerWidth < 768;
    const targetId = isMobile
      ? 'accommodations-section-mobile'
      : 'accommodations-section-desktop';

    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    } else {
      // 혹시 섹션 못 찾으면 그냥 맨 위로
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
}, [selectedAccommodation, completedReservation]);


  // Fetch user profile for authenticated users
  const fetchUserProfile = async () => {
    if (!isAuthenticated) {
      setProfilePhotoUrl('');
      return;
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profile) {
          setUserProfile(profile);
          setCurrentLocation(profile.location || '');
          setProfilePhotoUrl(profile.profile_photo_url || '');
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, [isAuthenticated]);

  // Load dark mode preference
  useEffect(() => {
    const loadDarkModePreference = async () => {
      if (isAuthenticated) {
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('is_dark_mode')
              .eq('id', user.id)
              .single();

            if (profile && profile.is_dark_mode !== undefined && profile.is_dark_mode !== null) {
              setIsDarkMode(profile.is_dark_mode);
              if (profile.is_dark_mode) {
                document.documentElement.classList.add('dark');
              } else {
                document.documentElement.classList.remove('dark');
              }
            }
          }
        } catch (error) {
          console.error('Error loading dark mode preference:', error);
        }
      } else {
        const saved = localStorage.getItem('darkMode');
        if (saved !== null) {
          const newVal = saved === 'true';
          setIsDarkMode(newVal);
          if (newVal) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
      }
    };

    loadDarkModePreference();
  }, [isAuthenticated]);

  // Load temperature unit preference
  useEffect(() => {
    const saved = localStorage.getItem('useFahrenheit');
    if (saved !== null) {
      setUseFahrenheit(saved === 'true');
    }

    const handleTemperatureUnitChange = (event: Event) => {
      const customEvent = event as CustomEvent<boolean>;
      setUseFahrenheit(customEvent.detail);
    };

    window.addEventListener('temperatureUnitChanged', handleTemperatureUnitChange);

    return () => {
      window.removeEventListener('temperatureUnitChanged', handleTemperatureUnitChange);
    };
  }, [isAuthenticated]);

  // Re-fetch location when locationRefreshTrigger changes
  useEffect(() => {
    if (locationRefreshTrigger && locationRefreshTrigger > 0 && isAuthenticated) {
      fetchUserProfile();
    }
  }, [locationRefreshTrigger, isAuthenticated]);

  // Get guest location using geolocation or localStorage
  useEffect(() => {
    if (isAuthenticated) return;

    const getGuestLocation = () => {
      const savedGuestLocation = localStorage.getItem('guestLocation');
      if (savedGuestLocation) {
        setGuestLocation(savedGuestLocation);
        return;
      }

      if (!navigator.geolocation) {
        setGuestLocation('Seoul');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;

            const response = await fetch(
              `https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${latitude},${longitude}&aqi=no`,
            );

            if (response.ok) {
              const data = await response.json();
              setGuestLocation(data.location.name);
            } else {
              setGuestLocation('Seoul');
            }
          } catch (error) {
            console.error('Error getting guest location:', error);
            setGuestLocation('Seoul');
          }
        },
        () => {
          setGuestLocation('Seoul');
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000,
        },
      );
    };

    getGuestLocation();

    const handleGuestLocationUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<string>;
      setGuestLocation(customEvent.detail);
    };

    window.addEventListener('guestLocationUpdate', handleGuestLocationUpdate);

    return () => {
      window.removeEventListener('guestLocationUpdate', handleGuestLocationUpdate);
    };
  }, [isAuthenticated]);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Fetch weather data
  useEffect(() => {
    const fetchWeather = async () => {
      setWeatherLoading(true);

      try {
        const locationToUse = isAuthenticated ? currentLocation : guestLocation;

        if (locationToUse) {
          const response = await fetch(
            `https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(
              locationToUse,
            )}&aqi=no`,
          );

          if (response.ok) {
            const data = await response.json();
            setWeather({
              temp: Math.round(useFahrenheit ? data.current.temp_f : data.current.temp_c),
              condition: data.current.condition.text,
              location: data.location.name,
              humidity: data.current.humidity,
              windSpeed: Math.round(
                useFahrenheit ? data.current.wind_mph : data.current.wind_kph,
              ),
            });
          } else {
            throw new Error('Weather API request failed');
          }
        } else {
          const temperatures = [72, 74, 76, 78, 80, 82];
          const conditions = ['Clear', 'Partly Cloudy', 'Sunny', 'Cloudy'];

          let temp = temperatures[Math.floor(Math.random() * temperatures.length)];
          if (!useFahrenheit) {
            temp = Math.round(((temp - 32) * 5) / 9);
          }

          setWeather({
            temp,
            condition: conditions[Math.floor(Math.random() * conditions.length)],
          });
        }
      } catch (error) {
        console.error('Error fetching weather:', error);
        const temperatures = [72, 74, 76, 78, 80, 82];
        const conditions = ['Clear', 'Partly Cloudy', 'Sunny', 'Cloudy'];

        let temp = temperatures[Math.floor(Math.random() * temperatures.length)];
        if (!useFahrenheit) {
          temp = Math.round(((temp - 32) * 5) / 9);
        }

        setWeather({
          temp,
          condition: conditions[Math.floor(Math.random() * conditions.length)],
        });
      } finally {
        setWeatherLoading(false);
      }
    };

    const locationToUse = isAuthenticated ? currentLocation : guestLocation;
    if (locationToUse || !isAuthenticated) {
      fetchWeather();
    }

    const weatherTimer = setInterval(fetchWeather, 10 * 60 * 1000);

    return () => clearInterval(weatherTimer);
  }, [isAuthenticated, currentLocation, guestLocation, useFahrenheit]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleProfileClick = () => {
    setShowProfile(true);
  };

  const handleCloseProfile = () => {
    setShowProfile(false);
    if (onLocationRefresh && isAuthenticated) {
      onLocationRefresh();
    }
  };

  const handleLogoutFromProfile = () => {
    setShowProfile(false);
    onLogout();
  };

  const handleWidgetClick = () => {
    setShowLocationSelector(true);
  };

  const handleLocationSave = async (cityName: string) => {
    if (isAuthenticated) {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error('No user found');

        const { error } = await supabase
          .from('profiles')
          .update({ location: cityName })
          .eq('id', user.id);

        if (error) throw error;

        setCurrentLocation(cityName);

        setWeatherLoading(true);
        try {
          const response = await fetch(
            `https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(
              cityName,
            )}&aqi=no`,
          );

          if (response.ok) {
            const data = await response.json();
            setWeather({
              temp: Math.round(useFahrenheit ? data.current.temp_f : data.current.temp_c),
              condition: data.current.condition.text,
              location: data.location.name,
              humidity: data.current.humidity,
              windSpeed: Math.round(
                useFahrenheit ? data.current.wind_mph : data.current.wind_kph,
              ),
            });
          }
        } catch (error) {
          console.error('Error fetching weather after location update:', error);
        } finally {
          setWeatherLoading(false);
        }
      } catch (error) {
        console.error('Error saving location:', error);
        toast.error('Failed to save location. Please try again.');
      }
    } else {
      localStorage.setItem('guestLocation', cityName);
      setGuestLocation(cityName);

      setWeatherLoading(true);
      try {
        const response = await fetch(
          `https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(
            cityName,
          )}&aqi=no`,
        );

        if (response.ok) {
          const data = await response.json();
          setWeather({
            temp: Math.round(useFahrenheit ? data.current.temp_f : data.current.temp_c),
            condition: data.current.condition.text,
            location: data.location.name,
            humidity: data.current.humidity,
            windSpeed: Math.round(
              useFahrenheit ? data.current.wind_mph : data.current.wind_kph,
            ),
          });
        }
      } catch (error) {
        console.error('Error fetching weather after location update:', error);
      } finally {
        setWeatherLoading(false);
      }

      toast.success(`Location updated to ${cityName}`);
    }
  };

  if (showProfile) {
    return (
      <Profile
        isAuthenticated={isAuthenticated}
        onLogout={handleLogoutFromProfile}
        onBack={handleCloseProfile}
        onShowAuth={onShowAuth}
      />
    );
  }

  const displayLocation = isAuthenticated ? currentLocation : guestLocation;

  const scrollToAccommodations = () => {
    const isMobile = window.innerWidth < 768;
    const targetId = isMobile
      ? 'accommodations-section-mobile'
      : 'accommodations-section-desktop';

    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const toggleDarkMode = async () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);

    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    localStorage.setItem('darkMode', String(newDarkMode));

    if (isAuthenticated) {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { error } = await supabase
            .from('profiles')
            .update({ is_dark_mode: newDarkMode })
            .eq('id', user.id);
          if (error) throw error;
        }
      } catch (error) {
        console.error('Error saving dark mode preference:', error);
      }
    }
  };

  return (
    <div className="relative">
      {/* ✅ 모바일 전용 레이아웃 (width < 768px) */}
      <div className="md:hidden min-h-screen flex flex-col">
        {/* 상단 헤더 - 로고 가운데 정렬 */}
        <header className="relative px-4 pt-4 pb-3 bg-background/90 backdrop-blur-sm shadow-md">
          {/* 가운데 로고 */}
          <div className="flex justify-center">
            <Logo
              onClick={() => {
                // 메인 홈으로 돌아가기 위한 모든 상태 초기화
                setShowProfile(false);
                setSelectedAccommodation(null);
                setCompletedReservation(null);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </div>

          {/* 오른쪽 상단 아이콘 */}
          <div className="absolute right-4 top-4 flex items-center gap-2">
            <button
              onClick={toggleDarkMode}
              className="bg-background/80 backdrop-blur-sm border border-border rounded-full p-2 hover:opacity-70 transition-opacity shadow"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? (
                <Sun className="h-4 w-4 text-foreground" />
              ) : (
                <Moon className="h-4 w-4 text-foreground" />
              )}
            </button>

            <button
              onClick={handleProfileClick}
              className="bg-background/80 backdrop-blur-sm border border-border rounded-full p-2 hover:opacity-70 transition-opacity shadow flex items-center justify-center"
              title={isAuthenticated ? 'Profile' : 'Profile & Settings'}
            >
              <svg
                className="block h-5 w-5"
                fill="none"
                preserveAspectRatio="none"
                viewBox="0 0 40 40"
              >
                <g clipPath="url(#clip0_149_608)">
                  <mask
                    id="mask0_149_608"
                    maskUnits="userSpaceOnUse"
                    style={{ maskType: 'alpha' }}
                    x="0"
                    y="0"
                    width="40"
                    height="40"
                  >
                    <rect width="40" height="40" fill="#D9D9D9" />
                  </mask>
                  <g mask="url(#mask0_149_608)">
                    <path
                      d={framesvgPaths.p2a914900}
                      fill="currentColor"
                      className="text-foreground"
                    />
                  </g>
                </g>
                <defs>
                  <clipPath id="clip0_149_608">
                    <rect width="40" height="40" fill="white" />
                  </clipPath>
                </defs>
              </svg>
            </button>
          </div>
        </header>

        {/* ✅ 모바일 시계/날씨 영역 – 리스트일 때만 보여줌 */}
        {!isDetailView && (
          <main className="px-4 pt-6 pb-4">
            <div
              className="relative rounded-3xl bg-black/30 backdrop-blur-md border border-white/20 px-5 py-6 flex flex-col items-center gap-3 text-white cursor-pointer"
              onClick={handleWidgetClick}
              onMouseEnter={() => setIsHoveringWidget(true)}
              onMouseLeave={() => setIsHoveringWidget(false)}
              title="Click to customize location"
            >
              <div
                className={`absolute right-4 top-4 z-10 transition-all duration-200 ${
                  isHoveringWidget ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                }`}
              >
                <div className="bg-white/20 backdrop-blur-sm rounded-full p-2 border border-white/30 shadow-lg">
                  <Edit3 className="h-4 w-4 text-white" />
                </div>
              </div>

              <p
                className="text-4xl font-light tracking-tight"
                style={{
                  textShadow:
                    '0px 0px 20px rgba(0, 0, 0, 0.5), 0px 0px 10px rgba(0, 0, 0, 0.4)',
                }}
              >
                {formatTime(currentTime)}
              </p>

              {displayLocation && (
                <p
                  className="text-lg opacity-90"
                  style={{
                    textShadow:
                      '0px 0px 15px rgba(0, 0, 0, 0.5), 0px 0px 8px rgba(0, 0, 0, 0.4)',
                  }}
                >
                  {displayLocation}
                </p>
              )}

              <div className="flex items-baseline gap-2 mt-2">
                <p
                  className="text-4xl font-light"
                  style={{
                    textShadow:
                      '0px 0px 20px rgba(0, 0, 0, 0.5), 0px 0px 10px rgba(0, 0, 0, 0.4)',
                  }}
                >
                  {weatherLoading ? '--' : weather.temp}°
                </p>
                <p
                  className="text-base opacity-90"
                  style={{
                    textShadow:
                      '0px 0px 15px rgba(0, 0, 0, 0.5), 0px 0px 8px rgba(0, 0, 0, 0.4)',
                  }}
                >
                  {weatherLoading ? 'Loading...' : weather.condition}
                </p>
              </div>
            </div>
          </main>
        )}

        {/* 숙소 섹션 (모바일) */}
<section
  id="accommodations-section-mobile"
  className="mt-2 bg-background/95 rounded-t-3xl px-4 pt-6 pb-10"
>
<AnimatePresence mode="wait">
    {completedReservation ? (
      <motion.div
        key="reservation"
        initial={{ x: 40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -40, opacity: 0 }}
        transition={{ duration: 0.25 }}
      >
        <ReservationConfirmation
          reservation={completedReservation}
          onBackToList={() => {
            setCompletedReservation(null);
            setSelectedAccommodation(null);
          }}
          onBackToDetail={() => setCompletedReservation(null)}
        />
      </motion.div>
    ) : selectedAccommodation ? (
      <motion.div
        key="detail"
        initial={{ x: 40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -40, opacity: 0 }}
        transition={{ duration: 0.25 }}
      >
        <AccommodationDetail
          accommodation={selectedAccommodation}
          onBack={() => setSelectedAccommodation(null)}
          isAuthenticated={isAuthenticated}
          userId={userId}
          onShowAuth={() => onShowAuth('login')}
          onReservationComplete={(reservation) => setCompletedReservation(reservation)}
        />
      </motion.div>
    ) : (
      <motion.div
        key="list"
        initial={{ x: 40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -40, opacity: 0 }}
        transition={{ duration: 0.25 }}
      >
        <AccommodationList
          onViewDetail={(accommodation) => setSelectedAccommodation(accommodation)}
          onReserve={(accommodation) => setSelectedAccommodation(accommodation)}
          userId={userId}
          isAuthenticated={isAuthenticated}
        />
      </motion.div>
    )}
  </AnimatePresence>
</section>
      </div>

      {/* 💻 데스크탑 전용 레이아웃 (md 이상) */}
      <div className="hidden md:block">
        <div className="relative min-h-screen flex flex-col">
          {/* 상단 헤더 */}
          <header className="fixed top-0 inset-x-0 z-20 px-4 pt-4 sm:px-6">
            <div className="mx-auto max-w-6xl flex items-center justify-between gap-3 rounded-full bg-background/80 backdrop-blur-sm border border-border/70 shadow-lg px-4 py-2">
              <Logo
                onClick={() => {
                  setShowProfile(false);
                  setSelectedAccommodation(null);
                  setCompletedReservation(null);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />

              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={toggleDarkMode}
                  className="bg-background/80 backdrop-blur-sm border border-border rounded-full p-2 sm:p-3 hover:opacity-70 transition-opacity shadow-lg"
                  title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                  {isDarkMode ? (
                    <Sun className="h-4 w-4 sm:h-5 sm:w-5 text-foreground" />
                  ) : (
                    <Moon className="h-4 w-4 sm:h-5 sm:w-5 text-foreground" />
                  )}
                </button>

                <div className="bg-background/80 backdrop-blur-sm border border-border rounded-full p-2 sm:p-3 hover:opacity-70 transition-opacity shadow-lg">
                  <Notifications userId={userId} />
                </div>

                <button
                  onClick={handleProfileClick}
                  className="bg-background/80 backdrop-blur-sm border border-border rounded-full size-10 sm:size-12 hover:opacity-70 transition-opacity shadow-lg flex items-center justify-center"
                  title={isAuthenticated ? 'Profile' : 'Profile & Settings'}
                >
                  <svg
                    className="block size-5 sm:size-6"
                    fill="none"
                    preserveAspectRatio="none"
                    viewBox="0 0 40 40"
                  >
                    <g clipPath="url(#clip0_149_608_pc)">
                      <mask
                        id="mask0_149_608_pc"
                        maskUnits="userSpaceOnUse"
                        style={{ maskType: 'alpha' }}
                        x="0"
                        y="0"
                        width="40"
                        height="40"
                      >
                        <rect width="40" height="40" fill="#D9D9D9" />
                      </mask>
                      <g mask="url(#mask0_149_608_pc)">
                        <path
                          d={framesvgPaths.p2a914900}
                          fill="currentColor"
                          className="text-foreground"
                        />
                      </g>
                    </g>
                    <defs>
                      <clipPath id="clip0_149_608_pc">
                        <rect width="40" height="40" fill="white" />
                      </clipPath>
                    </defs>
                  </svg>
                </button>
              </div>
            </div>
          </header>

          {/* ✅ 데스크탑 시계/날씨 영역 – 리스트일 때만 보여줌 */}
          {!isDetailView && (
            <main className="flex-1 flex items-center justify-center px-4 pt-28 pb-20 sm:pt-32 sm:pb-24">
              <div className="w-full max-w-5xl">
                <div
                  className="relative box-border content-stretch flex flex-col md:flex-row font-['Roboto:Light',_sans-serif] font-light gap-6 md:gap-10 lg:gap-14 xl:gap-20 items-center justify-center leading-[0] p-2 sm:p-4 text-[#ffffff] text-left tracking-[-0.25px] cursor-pointer transition-all duration-200"
                  onClick={handleWidgetClick}
                  onMouseEnter={() => setIsHoveringWidget(true)}
                  onMouseLeave={() => setIsHoveringWidget(false)}
                  title="Click to customize location"
                >
                  <div
                    className={`absolute right-6 top-6 md:static md:self-start md:translate-x-0 md:translate-y-0 z-10 transition-all duration-200 ${
                      isHoveringWidget ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                    }`}
                  >
                    <div className="bg-white/20 backdrop-blur-sm rounded-full p-2 border border-white/30 shadow-lg">
                      <Edit3 className="h-4 w-4 text-white" />
                    </div>
                  </div>

                  {/* 시간 + 위치 */}
                  <div
                    style={{ fontVariationSettings: "'wdth' 100" }}
                    className={`flex flex-col justify-center items-center md:items-start relative shrink-0 ${
                      isHoveringWidget ? 'scale-105' : ''
                    } transition-transform duration-200`}
                  >
                    <p
                      className="block leading-[normal] whitespace-pre text-[18vw] sm:text-[12vw] md:text-[9vw] lg:text-[7vw] xl:text-[120px]"
                      style={{
                        textShadow:
                          '0px 0px 40px rgba(0, 0, 0, 0.5), 0px 0px 20px rgba(0, 0, 0, 0.4), 0px 0px 10px rgba(0, 0, 0, 0.3)',
                        fontWeight: 300,
                      }}
                    >
                      {formatTime(currentTime)}
                    </p>
                    {displayLocation && (
                      <p
                        className="block leading-[normal] whitespace-pre text-[5vw] sm:text-[3vw] md:text-[2.2vw] lg:text-[1.6vw] xl:text-[22px] text-center md:text-left mt-2 opacity-80"
                        style={{
                          textShadow:
                            '0px 0px 20px rgba(0, 0, 0, 0.5), 0px 0px 10px rgba(0, 0, 0, 0.4)',
                        }}
                      >
                        {displayLocation}
                      </p>
                    )}
                  </div>

                  {/* 구분 점 */}
                  <div
                    style={{ fontVariationSettings: "'wdth' 100" }}
                    className="hidden md:flex flex-col justify-center relative shrink-0"
                  >
                    <p
                      className="block leading-[normal] whitespace-pre text-[6vw] lg:text-[4.5vw] xl:text-[70px]"
                      style={{
                        textShadow:
                          '0px 0px 40px rgba(0, 0, 0, 0.5), 0px 0px 20px rgba(0, 0, 0, 0.4), 0px 0px 10px rgba(0, 0, 0, 0.3)',
                        fontWeight: 300,
                      }}
                    >
                      •
                    </p>
                  </div>

                  {/* 온도 */}
                  <div
                    style={{ fontVariationSettings: "'wdth' 100" }}
                    className={`flex flex-col justify-center items-center md:items-start relative shrink-0 ${
                      isHoveringWidget ? 'scale-105' : ''
                    } transition-transform duration-200`}
                  >
                    <p
                      className="block leading-[normal] whitespace-pre text-[18vw] sm:text-[12vw] md:text-[9vw] lg:text-[7vw] xl:text-[120px]"
                      style={{
                        textShadow:
                          '0px 0px 40px rgba(0, 0, 0, 0.5), 0px 0px 20px rgba(0, 0, 0, 0.4), 0px 0px 10px rgba(0, 0, 0, 0.3)',
                        fontWeight: 300,
                      }}
                    >
                      {weatherLoading ? '--' : weather.temp}°
                    </p>
                    <p
                      className="block leading-[normal] whitespace-pre text-[5vw] sm:text-[3vw] md:text-[2.2vw] lg:text-[1.6vw] xl:text-[22px] text-center md:text-left mt-2 opacity-80"
                      style={{
                        textShadow:
                          '0px 0px 20px rgba(0, 0, 0, 0.5), 0px 0px 10px rgba(0, 0, 0, 0.4)',
                      }}
                    >
                      {weatherLoading ? 'Loading...' : weather.condition}
                    </p>
                  </div>
                </div>
              </div>
            </main>
          )}
        </div>

        {/* ✅ 스크롤 안내도 리스트에서만 */}
        {!isDetailView && (
          <div className="relative mt-2 mb-4 z-10">
            <div className="flex justify-center">
              <button
                onClick={scrollToAccommodations}
                className="flex flex-col items-center gap-2 text-white/80 hover:text-white transition-colors animate-bounce"
              >
                <span className="text-sm">숙소 둘러보기</span>
                <ChevronDown className="h-6 w-6" />
              </button>
            </div>
          </div>
        )}

        {/* Accommodation Section - 데스크탑 */}
        <div id="accommodations-section-desktop" className="pt-4 sm:pt-6">
  <AnimatePresence mode="wait">
    {completedReservation ? (
      <motion.div
        key="reservation-desktop"
        initial={{ x: 60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -60, opacity: 0 }}
        transition={{ duration: 0.25 }}
      >
        <ReservationConfirmation
          reservation={completedReservation}
          onBackToList={() => {
            setCompletedReservation(null);
            setSelectedAccommodation(null);
          }}
          onBackToDetail={() => setCompletedReservation(null)}
        />
      </motion.div>
    ) : selectedAccommodation ? (
      <motion.div
        key="detail-desktop"
        initial={{ x: 60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -60, opacity: 0 }}
        transition={{ duration: 0.25 }}
      >
        <AccommodationDetail
          accommodation={selectedAccommodation}
          onBack={() => setSelectedAccommodation(null)}
          isAuthenticated={isAuthenticated}
          userId={userId}
          onShowAuth={() => onShowAuth('login')}
          onReservationComplete={(reservation) => setCompletedReservation(reservation)}
        />
      </motion.div>
    ) : (
      <motion.div
        key="list-desktop"
        initial={{ x: 60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -60, opacity: 0 }}
        transition={{ duration: 0.25 }}
      >
        <AccommodationList
          onViewDetail={(accommodation) => setSelectedAccommodation(accommodation)}
          onReserve={(accommodation) => setSelectedAccommodation(accommodation)}
          userId={userId}
          isAuthenticated={isAuthenticated}
        />
      </motion.div>
    )}
  </AnimatePresence>
</div>
      </div>

      {/* 공통 모달들 */}
      <LocationSelector
        isOpen={showLocationSelector}
        onClose={() => setShowLocationSelector(false)}
        onLocationSave={handleLocationSave}
        currentLocation={displayLocation}
        isAuthenticated={isAuthenticated}
      />

      <ScrollTopButton />
    </div>
  );
}

