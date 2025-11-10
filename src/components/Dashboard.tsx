import React, { useState, useEffect } from 'react';
import { Profile } from './Profile';
import { Logo } from './Logo';
import { LocationSelector } from './LocationSelector';
import { AccommodationList } from './AccommodationList';
import { AccommodationDetail } from './AccommodationDetail';
import { ReservationConfirmation } from './ReservationConfirmation';
import { Notifications } from './Notifications';
import { Edit3, ChevronDown, Sun, Moon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner@2.0.3';
import { useBackground } from '../lib/useBackground';
import { useMusicContext } from '../lib/MusicContext';
import { BackgroundSelection } from './BackgroundSelector';

import { MusicSelector } from './MusicSelector';
import svgPaths from "../imports/svg-wixcs60w0b";
import Frame11 from '../imports/Frame11';
import framesvgPaths from '../imports/svg-wrlpobapsl';
import playButtonPaths from '../imports/svg-4cizzkdugw';

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

export function Dashboard({ isAuthenticated, userId, onLogout, onShowAuth, locationRefreshTrigger, onLocationRefresh }: DashboardProps) {
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
  const [showMusicSelector, setShowMusicSelector] = useState(false);
  const [useFahrenheit, setUseFahrenheit] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [selectedAccommodation, setSelectedAccommodation] = useState<any>(null);
  const [completedReservation, setCompletedReservation] = useState<any>(null);

  // Custom background hook - now works for both authenticated and unauthenticated users
  const { background } = useBackground(isAuthenticated);

  // Music hook - now works for both authenticated and unauthenticated users
  const { currentTrack, isPlaying, availableTracks, changeTrack, togglePlayPause, previousTrack, nextTrack } = useMusicContext();

  // Apply custom background to body
  useEffect(() => {
    const body = document.body;
    
    if (background) {
      if (background.type === 'photo') {
        // Set custom background image
        body.style.setProperty('--custom-bg-url', `url(${background.url})`);
        body.classList.add('custom-background');
      } else if (background.type === 'video') {
        // Handle video background
        let existingVideo = document.querySelector('.background-video') as HTMLVideoElement;
        
        if (!existingVideo) {
          existingVideo = document.createElement('video');
          existingVideo.className = 'background-video';
          existingVideo.autoplay = true;
          existingVideo.muted = true;
          existingVideo.loop = true;
          existingVideo.playsInline = true;
          document.body.appendChild(existingVideo);
        }
        
        existingVideo.src = background.url;
        body.classList.add('custom-background');
      }
    } else {
      // Remove custom background
      body.classList.remove('custom-background');
      body.style.removeProperty('--custom-bg-url');
      
      // Remove video if it exists
      const existingVideo = document.querySelector('.background-video');
      if (existingVideo) {
        existingVideo.remove();
      }
    }

    // Cleanup function
    return () => {
      if (!background) {
        body.classList.remove('custom-background');
        body.style.removeProperty('--custom-bg-url');
        
        const existingVideo = document.querySelector('.background-video');
        if (existingVideo) {
          existingVideo.remove();
        }
      }
    };
  }, [background]);

  // Scroll to top on component mount (for mobile)
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  // Fetch user profile for authenticated users
  const fetchUserProfile = async () => {
    if (!isAuthenticated) {
      setProfilePhotoUrl(''); // Clear profile photo for guests
      return;
    }
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
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
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('is_dark_mode')
              .eq('id', user.id)
              .single();
            
            if (profile && profile.is_dark_mode !== undefined && profile.is_dark_mode !== null) {
              setIsDarkMode(profile.is_dark_mode);
            }
          }
        } catch (error) {
          console.error('Error loading dark mode preference:', error);
        }
      } else {
        // For guests, use localStorage
        const saved = localStorage.getItem('darkMode');
        if (saved !== null) {
          setIsDarkMode(saved === 'true');
        }
      }
    };

    loadDarkModePreference();
  }, [isAuthenticated]);

  // Load temperature unit preference
  useEffect(() => {
    const loadTemperaturePreference = async () => {
      // Use localStorage for all users
      const saved = localStorage.getItem('useFahrenheit');
      if (saved !== null) {
        setUseFahrenheit(saved === 'true');
      }
    };

    loadTemperaturePreference();

    // Listen for temperature unit changes
    const handleTemperatureUnitChange = (event: CustomEvent) => {
      setUseFahrenheit(event.detail);
    };

    window.addEventListener('temperatureUnitChanged', handleTemperatureUnitChange as EventListener);

    return () => {
      window.removeEventListener('temperatureUnitChanged', handleTemperatureUnitChange as EventListener);
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
    if (isAuthenticated) return; // Only for guests
    
    const getGuestLocation = () => {
      // First check if guest has saved a location in localStorage
      const savedGuestLocation = localStorage.getItem('guestLocation');
      if (savedGuestLocation) {
        setGuestLocation(savedGuestLocation);
        return;
      }

      // If no saved location, try geolocation
      if (!navigator.geolocation) {
        setGuestLocation('Seoul'); // Fallback
        return;
      }

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
              setGuestLocation(data.location.name);
            } else {
              setGuestLocation('Seoul'); // Fallback
            }
          } catch (error) {
            console.error('Error getting guest location:', error);
            setGuestLocation('Seoul'); // Fallback
          }
        },
        () => {
          setGuestLocation('Seoul'); // Fallback if permission denied
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    };

    getGuestLocation();

    // Listen for guest location updates from other components (like Profile)
    const handleGuestLocationUpdate = (event: CustomEvent) => {
      setGuestLocation(event.detail);
    };

    window.addEventListener('guestLocationUpdate', handleGuestLocationUpdate as EventListener);

    return () => {
      window.removeEventListener('guestLocationUpdate', handleGuestLocationUpdate as EventListener);
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
          // Use real WeatherAPI for users with location (both auth and guest)
          const response = await fetch(
            `https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(locationToUse)}&aqi=no`
          );
          
          if (response.ok) {
            const data = await response.json();
            setWeather({
              temp: Math.round(useFahrenheit ? data.current.temp_f : data.current.temp_c),
              condition: data.current.condition.text,
              location: data.location.name,
              humidity: data.current.humidity,
              windSpeed: Math.round(useFahrenheit ? data.current.wind_mph : data.current.wind_kph)
            });
          } else {
            throw new Error('Weather API request failed');
          }
        } else {
          // Mock weather fallback
          const temperatures = [72, 74, 76, 78, 80, 82];
          const conditions = ['Clear', 'Partly Cloudy', 'Sunny', 'Cloudy'];
          
          setWeather({
            temp: temperatures[Math.floor(Math.random() * temperatures.length)],
            condition: conditions[Math.floor(Math.random() * conditions.length)]
          });
        }
      } catch (error) {
        console.error('Error fetching weather:', error);
        // Fallback to mock weather
        const temperatures = [72, 74, 76, 78, 80, 82];
        const conditions = ['Clear', 'Partly Cloudy', 'Sunny', 'Cloudy'];
        
        setWeather({
          temp: temperatures[Math.floor(Math.random() * temperatures.length)],
          condition: conditions[Math.floor(Math.random() * conditions.length)]
        });
      } finally {
        setWeatherLoading(false);
      }
    };

    const locationToUse = isAuthenticated ? currentLocation : guestLocation;
    if (locationToUse || !isAuthenticated) {
      fetchWeather();
    }
    
    // Update weather every 10 minutes
    const weatherTimer = setInterval(fetchWeather, 10 * 60 * 1000);

    return () => clearInterval(weatherTimer);
  }, [isAuthenticated, currentLocation, guestLocation, useFahrenheit]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleProfileClick = () => {
    setShowProfile(true);
  };

  const handleCloseProfile = () => {
    setShowProfile(false);
    // Trigger location refresh when coming back from profile
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
      // Save to Supabase for authenticated users
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No user found');

        // Update location in Supabase
        const { error } = await supabase
          .from('profiles')
          .update({ location: cityName })
          .eq('id', user.id);

        if (error) throw error;

        // Update local state
        setCurrentLocation(cityName);
        
        // Refresh weather immediately with the new location
        setWeatherLoading(true);
        try {
          const response = await fetch(
            `https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(cityName)}&aqi=no`
          );
          
          if (response.ok) {
            const data = await response.json();
            setWeather({
              temp: Math.round(useFahrenheit ? data.current.temp_f : data.current.temp_c),
              condition: data.current.condition.text,
              location: data.location.name,
              humidity: data.current.humidity,
              windSpeed: Math.round(useFahrenheit ? data.current.wind_mph : data.current.wind_kph)
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
      // Save to localStorage for guest users
      localStorage.setItem('guestLocation', cityName);
      setGuestLocation(cityName);
      
      // Refresh weather immediately with the new location
      setWeatherLoading(true);
      try {
        const response = await fetch(
          `https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(cityName)}&aqi=no`
        );
        
        if (response.ok) {
          const data = await response.json();
          setWeather({
            temp: Math.round(useFahrenheit ? data.current.temp_f : data.current.temp_c),
            condition: data.current.condition.text,
            location: data.location.name,
            humidity: data.current.humidity,
            windSpeed: Math.round(useFahrenheit ? data.current.wind_mph : data.current.wind_kph)
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
    const element = document.getElementById('accommodations-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const toggleDarkMode = async () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    
    // Update DOM
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Save to localStorage
    localStorage.setItem('darkMode', String(newDarkMode));
    
    // Save to database if authenticated
    if (isAuthenticated) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
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
      {/* Main Clock Section - Fixed Height */}
      <div className="relative min-h-screen flex flex-col">
        {/* Logo at top */}
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-10">
          <Logo onClick={() => {
            setShowProfile(false);
            setSelectedAccommodation(null);
            setCompletedReservation(null);
          }} />
        </div>

        {/* Dark Mode Toggle, Notifications and Profile Button - Top Right */}
        <div className="absolute top-8 right-8 z-10 flex items-center gap-3">
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="bg-background/80 backdrop-blur-sm border border-border rounded-full p-3 hover:opacity-70 transition-opacity shadow-lg"
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode ? (
              <Sun className="h-5 w-5 text-foreground" />
            ) : (
              <Moon className="h-5 w-5 text-foreground" />
            )}
          </button>
          
          {/* Notifications */}
          <div className="bg-background/80 backdrop-blur-sm border border-border rounded-full hover:opacity-70 transition-opacity shadow-lg">
            <Notifications userId={userId} />
          </div>
          
          {/* Profile Button */}
          <button 
            onClick={handleProfileClick}
            className="bg-background/80 backdrop-blur-sm border border-border rounded-full size-12 hover:opacity-70 transition-opacity shadow-lg flex items-center justify-center"
            title={isAuthenticated ? 'Profile' : 'Profile & Settings'}
          >
            <svg
              className="block size-6"
              fill="none"
              preserveAspectRatio="none"
              viewBox="0 0 40 40"
            >
              <g clipPath="url(#clip0_149_608)">
                <mask
                  height="40"
                  id="mask0_149_608"
                  maskUnits="userSpaceOnUse"
                  style={{ maskType: "alpha" }}
                  width="40"
                  x="0"
                  y="0"
                >
                  <rect
                    fill="#D9D9D9"
                    height="40"
                    width="40"
                  />
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
                  <rect fill="white" height="40" width="40" />
                </clipPath>
              </defs>
            </svg>
          </button>
        </div>

      {/* Main Clock and Weather Display */}
      <div 
        className="absolute time-container translate-x-[-50%] translate-y-[-50%] w-[85vw] max-w-none"
        style={{ top: "calc(50% + 0.5px)", left: "calc(50% + 0.5px)" }}
      >
        <div className="flex flex-row justify-center items-center">
          <div 
            className={`box-border content-stretch flex flex-col sm:flex-row font-['Roboto:Light',_sans-serif] font-light gap-4 sm:gap-6 md:gap-8 lg:gap-12 xl:gap-20 items-center justify-center leading-[0] p-[8px] relative text-[#ffffff] text-left text-nowrap tracking-[-0.25px] cursor-pointer transition-all duration-200`}
            onClick={handleWidgetClick}
            onMouseEnter={() => setIsHoveringWidget(true)}
            onMouseLeave={() => setIsHoveringWidget(false)}
            title="Click to customize location"
          >
            {/* Edit Icon - Now available for all users */}
            <div 
              className={`absolute -top-6 -right-6 z-10 transition-all duration-200 ${
                isHoveringWidget ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
              }`}
            >
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-2 border border-white/30 shadow-lg">
                <Edit3 className="h-4 w-4 text-white" />
              </div>
            </div>

            {/* Time */}
            <div 
              style={{ fontVariationSettings: "'wdth' 100" }}
              className={`flex flex-col justify-center items-center relative shrink-0 ${
                isHoveringWidget ? 'scale-105' : ''
              } transition-transform duration-200`}
            >
              <p className="block leading-[normal] text-nowrap whitespace-pre text-[14vw] sm:text-[12vw] md:text-[10vw] lg:text-[8vw] xl:text-[150px]" 
                 style={{ 
                   textShadow: '0px 0px 40px rgba(0, 0, 0, 0.5), 0px 0px 20px rgba(0, 0, 0, 0.4), 0px 0px 10px rgba(0, 0, 0, 0.3)',
                   fontWeight: '300'
                 }}>
                {formatTime(currentTime)}
              </p>
              {/* Location display */}
              {displayLocation && (
                <p className="block leading-[normal] text-nowrap whitespace-pre text-[6vw] sm:text-[2.5vw] md:text-[2vw] lg:text-[1.5vw] xl:text-[24px] text-center mt-2 opacity-80" 
                   style={{ 
                     textShadow: '0px 0px 20px rgba(0, 0, 0, 0.5), 0px 0px 10px rgba(0, 0, 0, 0.4)'
                   }}>
                  {displayLocation}
                </p>
              )}
            </div>
            
            {/* Dot Separator */}
            <div 
              style={{ fontVariationSettings: "'wdth' 100" }}
              className="flex flex-col justify-center relative shrink-0"
            >
              <p className="block leading-[normal] text-nowrap whitespace-pre text-[8vw] sm:text-[7vw] md:text-[6vw] lg:text-[4.5vw] xl:text-[75px]"
                 style={{ 
                   textShadow: '0px 0px 40px rgba(0, 0, 0, 0.5), 0px 0px 20px rgba(0, 0, 0, 0.4), 0px 0px 10px rgba(0, 0, 0, 0.3)',
                   fontWeight: '300'
                 }}>
                •
              </p>
            </div>
            
            {/* Temperature */}
            <div 
              style={{ fontVariationSettings: "'wdth' 100" }}
              className={`flex flex-col justify-center items-center relative shrink-0 ${
                isHoveringWidget ? 'scale-105' : ''
              } transition-transform duration-200`}
            >
              <p className="block leading-[normal] text-nowrap whitespace-pre text-[14vw] sm:text-[12vw] md:text-[10vw] lg:text-[8vw] xl:text-[150px]"
                 style={{ 
                   textShadow: '0px 0px 40px rgba(0, 0, 0, 0.5), 0px 0px 20px rgba(0, 0, 0, 0.4), 0px 0px 10px rgba(0, 0, 0, 0.3)',
                   fontWeight: '300'
                 }}>
                {weatherLoading ? '--' : weather.temp}°
              </p>
              <p className="block leading-[normal] text-nowrap whitespace-pre text-[6vw] sm:text-[2.5vw] md:text-[2vw] lg:text-[1.5vw] xl:text-[24px] text-center mt-2 opacity-80" 
                 style={{ 
                   textShadow: '0px 0px 20px rgba(0, 0, 0, 0.5), 0px 0px 10px rgba(0, 0, 0, 0.4)'
                 }}>
                {weatherLoading ? 'Loading...' : weather.condition}
              </p>
            </div>

          </div>
        </div>
      </div>

      {/* Bottom Music Controls */}
      <div className="absolute bottom-32 sm:bottom-28 left-1/2 translate-x-[-50%]">
          {/* Music Controls */}
          <div className="bg-background/80 backdrop-blur-sm border border-border relative rounded-lg h-14 px-6 shadow-lg">
            <div className="flex flex-row gap-5 items-center justify-center h-full">
              {/* Previous Button */}
              <button 
                onClick={previousTrack}
                className="relative shrink-0 size-7 hover:opacity-70 transition-opacity"
                disabled={!currentTrack}
              >
                <svg
                  className="block size-full"
                  fill="none"
                  preserveAspectRatio="none"
                  viewBox="0 0 32 32"
                >
                  <g>
                    <mask
                      height="32"
                      id="mask0_149_628"
                      maskUnits="userSpaceOnUse"
                      style={{ maskType: "alpha" }}
                      width="32"
                      x="0"
                      y="0"
                    >
                      <rect
                        fill="#D9D9D9"
                        height="32"
                        width="32"
                      />
                    </mask>
                    <g mask="url(#mask0_149_628)">
                      <path
                        d={framesvgPaths.p1b2b3100}
                        fill="currentColor"
                        className={`${currentTrack ? 'text-foreground' : 'text-muted-foreground'}`}
                      />
                    </g>
                  </g>
                </svg>
              </button>

              {/* Play/Pause Button */}
              <button 
                onClick={togglePlayPause}
                className="relative shrink-0 size-7 hover:opacity-70 transition-opacity"
                disabled={!currentTrack}
              >
                <svg
                  className="block size-full"
                  fill="none"
                  preserveAspectRatio="none"
                  viewBox="0 0 32 32"
                >
                  <g>
                    <mask
                      height="32"
                      id="mask0_149_612"
                      maskUnits="userSpaceOnUse"
                      style={{ maskType: "alpha" }}
                      width="32"
                      x="0"
                      y="0"
                    >
                      <rect
                        fill="#D9D9D9"
                        height="32"
                        width="32"
                      />
                    </mask>
                    <g mask="url(#mask0_149_612)">
                      <path
                        d={isPlaying ? framesvgPaths.p20bd5100 : playButtonPaths.p12f2cb00}
                        fill="currentColor"
                        className="text-foreground"
                      />
                    </g>
                  </g>
                </svg>
              </button>

              {/* Next Button */}
              <button 
                onClick={nextTrack}
                className="relative shrink-0 size-7 hover:opacity-70 transition-opacity"
                disabled={!currentTrack}
              >
                <svg
                  className="block size-full"
                  fill="none"
                  preserveAspectRatio="none"
                  viewBox="0 0 32 32"
                >
                  <g>
                    <mask
                      height="32"
                      id="mask0_149_616"
                      maskUnits="userSpaceOnUse"
                      style={{ maskType: "alpha" }}
                      width="32"
                      x="0"
                      y="0"
                    >
                      <rect
                        fill="#D9D9D9"
                        height="32"
                        width="32"
                      />
                    </mask>
                    <g mask="url(#mask0_149_616)">
                      <path
                        d={framesvgPaths.p20f12980}
                        fill="currentColor"
                        className={`${currentTrack ? 'text-foreground' : 'text-muted-foreground'}`}
                      />
                    </g>
                  </g>
                </svg>
              </button>
            </div>
          </div>
      </div>



        {/* Location Selector Modal - Now available for all users */}
        <LocationSelector
          isOpen={showLocationSelector}
          onClose={() => setShowLocationSelector(false)}
          onLocationSave={handleLocationSave}
          currentLocation={displayLocation}
          isAuthenticated={isAuthenticated}
        />

        {/* Music Selector Modal */}
        <MusicSelector
          isOpen={showMusicSelector}
          onClose={() => setShowMusicSelector(false)}
          isAuthenticated={isAuthenticated}
        />
      </div>

      {/* Scroll Down Indicator - Moved outside to prevent overlap */}
      <div className="relative -mt-16 mb-4 z-20">
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

      {/* Accommodation Section */}
      <div id="accommodations-section">
        {completedReservation ? (
          <ReservationConfirmation
            reservation={completedReservation}
            onBackToList={() => {
              setCompletedReservation(null);
              setSelectedAccommodation(null);
            }}
            onBackToDetail={() => setCompletedReservation(null)}
          />
        ) : selectedAccommodation ? (
          <AccommodationDetail
            accommodation={selectedAccommodation}
            onBack={() => setSelectedAccommodation(null)}
            isAuthenticated={isAuthenticated}
            userId={userId}
            onShowAuth={() => onShowAuth('login')}
            onReservationComplete={(reservation) => setCompletedReservation(reservation)}
          />
        ) : (
          <AccommodationList
            onViewDetail={(accommodation) => setSelectedAccommodation(accommodation)}
            onReserve={(accommodation) => setSelectedAccommodation(accommodation)}
            userId={userId}
            isAuthenticated={isAuthenticated}
          />
        )}
      </div>
    </div>
  );
}