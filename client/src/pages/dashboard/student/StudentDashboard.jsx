import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FaSearch, FaStar, FaStarHalfAlt, FaRegStar, FaUser, FaHome, FaBook, 
  FaChevronLeft, FaChevronRight, FaSignOutAlt, FaCaretDown, FaCog, FaUserCircle, 
  FaExternalLinkAlt, FaGlobe, FaPlay, FaFileAlt, FaYoutube, FaMapMarkerAlt, 
  FaArrowLeft, FaGraduationCap, FaLanguage, FaVideo, FaComments, FaPaperPlane } from "react-icons/fa";
import LoadingSpinner from "../../../components/LoadingSpinner";
import RatingStars from "../../../components/RatingStars";
import "./studentDashboard.scss";

import logActivity from '../../../utils/logActivity';
import newRequest from "../../../utils/newRequest";
import useAnalytics from '../../../hooks/useAnalytics';
import { useChat } from "../../../hooks/useChat";
import { useNotifications } from "../../../hooks/useNotifications";
import { useContext } from "react";
import { CurrencyContext } from "../../../context/CurrencyContext.jsx";
import StudentSidebar from "./StudentSidebar";
import FindTutors from "./FindTutors";
import MySessions from "./MySessions";
import MyLearning from "./MyLearning";
import Messages from "./Messages";
import Payments from "./Payments";
import Settings from "./Settings";
import HomeOverview from "./HomeOverview";
import SharedHeaderBanner from "./SharedHeaderBanner";
import SubjectPreferencesModal from "../../../components/SubjectPreferencesModal/SubjectPreferencesModal";

function StudentDashboard() {
  const [currentUser, setCurrentUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSection, setActiveSection] = useState("packages"); // New state for section toggle
  const [filters, setFilters] = useState({
    subject: "all",
    priceRange: "all",
    academicLevel: "all",
    language: "all"
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [packages, setPackages] = useState([]);
  const [tutors, setTutors] = useState([]); // State for tutors/educators
  const [tutorsLoading, setTutorsLoading] = useState(false); // Loading state for tutors
  const [tutorBanners, setTutorBanners] = useState({}); // map tutorId -> array of banner image urls
  const [selectedEducator, setSelectedEducator] = useState(null); // Selected educator for detail view
  const [educatorProfile, setEducatorProfile] = useState(null); // Educator profile details
  const [educatorPackages, setEducatorPackages] = useState([]); // Educator's packages
  const [educatorLoading, setEducatorLoading] = useState(false); // Loading state for educator details
  const [relatedResources, setRelatedResources] = useState([]); // New state for resources
  const [loading, setLoading] = useState(true);
  const [resourcesLoading, setResourcesLoading] = useState(false); // Loading state for resources
  const [error, setError] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const packagesPerPage = 12;
  const resourcesPerPage = 8;
  const navigate = useNavigate();
  const location = useLocation();
  const userMenuRef = useRef(null);
  const [recommendedTutors, setRecommendedTutors] = useState([]);
  const [workPlan, setWorkPlan] = useState([]);
  const [topSubjects, setTopSubjects] = useState([]);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [hasPreferences, setHasPreferences] = useState(false);
  const [preferencesChecked, setPreferencesChecked] = useState(false);
  const [preferencesRefreshKey, setPreferencesRefreshKey] = useState(0);
  const [mlRecommendations, setMlRecommendations] = useState([]);
  
  // Message modal states
  const [showChatModal, setShowChatModal] = useState(false);
  const [selectedEducatorForMessage, setSelectedEducatorForMessage] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  // Chat hooks
  const { createNewConversation, sendTextMessage, joinConversation } = useChat();
  const { showSuccessNotification, showErrorNotification } = useNotifications();
  
  // Currency context
  const { currency: selectedCurrency, convertCurrency, getCurrencySymbol } = useContext(CurrencyContext);
  // Analytics hook
  const { recordSearch } = useAnalytics();

  useEffect(() => {
    // Log dashboard view
    logActivity({ type: 'view_dashboard' });
    
    // Track user behavior for personalization
    trackUserBehavior();
    
    // Fetch personalized recommendations
    fetchPersonalizedRecommendations();
    
    // Check if user has preferences
    checkUserPreferences();
  }, []);

  // Track user behavior for better personalization
  const trackUserBehavior = async () => {
    try {
      // Track dashboard view
      await newRequest.post('/recommend/track', {
        interactionType: 'dashboard_view',
        recommendationSource: 'student_dashboard'
      });
    } catch (error) {
      console.error('Error tracking user behavior:', error);
    }
  };

  // Fetch up to 3 recent package thumbnails for each tutor to show in the profile banner
  useEffect(() => {
    let cancelled = false;
    const fetchBanners = async () => {
      if (!tutors || tutors.length === 0) return;
      try {
        const map = {};
        await Promise.all(tutors.map(async (tutor) => {
          try {
            const res = await newRequest.get(`/packages/public?educatorId=${tutor._id}`);
            const pkgs = Array.isArray(res.data) ? res.data : (res.data.packages || []);
            const imgs = (pkgs || []).slice(0, 3).map(p => {
              const image = p?.thumbnail || p?.image || p?.cover;
              if (!image) return '/img/noavatar.jpg';
              if (image.startsWith('http://') || image.startsWith('https://') || image.startsWith('/')) return image;
              const clean = image.startsWith('/') ? image.substring(1) : image;
              return `${getServerUrl()}/${clean}`;
            });
            // ensure length 3
            while (imgs.length < 3) imgs.push('/img/noavatar.jpg');
            map[tutor._id] = imgs;
          } catch (err) {
            console.error('Error fetching packages for tutor', tutor._id, err);
            map[tutor._id] = ['/img/noavatar.jpg','/img/noavatar.jpg','/img/noavatar.jpg'];
          }
        }));

        if (!cancelled) setTutorBanners(map);
      } catch (err) {
        console.error('Error building tutor banners', err);
      }
    };

    fetchBanners();
    return () => { cancelled = true; };
  }, [tutors]);

  // Fetch personalized recommendations
  const fetchPersonalizedRecommendations = async () => {
    try {
      // Get ML-powered personalized package recommendations
      const response = await newRequest.get('/recommend/personalized?limit=10');
      if (response.data.success && response.data.data.recommendations) {
        const recommendations = response.data.data.recommendations;
        console.log('ML Recommendations loaded:', recommendations.length);
        setMlRecommendations(recommendations);
      }
    } catch (error) {
      console.error('Error fetching personalized recommendations:', error);
      setMlRecommendations([]);
      // Fallback to basic recommendations
      setRecommendedTutors([]);
      setTopSubjects(['Mathematics', 'Science', 'English']);
      setWorkPlan([]);
    }
  };

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem("currentUser");
    if (userData) {
      setCurrentUser(JSON.parse(userData));
    }
    
    // Fetch packages from backend
    fetchPackages();
    
    // Fetch tutors when component mounts or when activeSection changes to tutors
    if (activeSection === "tutors") {
      fetchTutors();
    }

    // Listen for package review submissions to refresh packages ratings dynamically
    const handleReviewSubmitted = () => {
      fetchPackages();
    };
    window.addEventListener('package-review-submitted', handleReviewSubmitted);

    // Close user menu when clicking outside
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener('package-review-submitted', handleReviewSubmitted);
    };
  }, []);

  // Fetch related resources when section changes to resources or search query changes
  useEffect(() => {
    if (activeSection === "resources" && searchQuery.trim()) {
      fetchRelatedResources();
    }
  }, [activeSection, searchQuery]);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const response = await newRequest.get("/packages/public");
      setPackages(response.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching packages:", err);
      setError("Failed to load available packages");
      setLoading(false);
    }
  };

  // Fetch all tutors/educators
  const fetchTutors = async () => {
    try {
      setTutorsLoading(true);
      const response = await newRequest.get("/users/educators/all");
      setTutors(response.data.educators || []);
    } catch (err) {
      console.error("Error fetching tutors:", err);
      setError("Failed to load tutors");
    } finally {
      setTutorsLoading(false);
    }
  };

  // Fetch educator details and packages
  const fetchEducatorDetails = async (educatorId) => {
    try {
      setEducatorLoading(true);
      
      // Fetch educator basic info
      const userRes = await newRequest.get(`/users/${educatorId}`);
      const educator = userRes.data;
      
      // Fetch educator profile
      let profile = null;
      try {
        const profileRes = await newRequest.get(`/educatorProfiles/user/${educatorId}`);
        profile = profileRes.data;
      } catch (err) {
        console.log("No profile found, using basic info");
      }
      
      // Fetch educator's packages
      let packages = [];
      try {
        const packagesRes = await newRequest.get(`/packages/public?educatorId=${educatorId}`);
        packages = packagesRes.data || [];
      } catch (err) {
        console.log("Error fetching packages:", err);
      }
      
      setSelectedEducator(educator);
      setEducatorProfile(profile);
      setEducatorPackages(packages);
    } catch (err) {
      console.error("Error fetching educator details:", err);
      setError("Failed to load educator details");
    } finally {
      setEducatorLoading(false);
    }
  };

  // Handle view educator button click
  const handleViewEducator = (e, tutor) => {
    e.preventDefault();
    e.stopPropagation();
    fetchEducatorDetails(tutor._id);
  };

  // Handle back to tutors list
  const handleBackToTutors = () => {
    setSelectedEducator(null);
    setEducatorProfile(null);
    setEducatorPackages([]);
  };

  const checkUserPreferences = async () => {
    try {
      const response = await newRequest.get("/users/preferences/check");
      if (response.data.success) {
        const { hasPreferences, isEducator } = response.data.data;
        setHasPreferences(hasPreferences);
        setPreferencesChecked(true);
        
        // Show modal for new students who haven't set preferences
        if (!isEducator && !hasPreferences) {
          setShowPreferencesModal(true);
        }
      }
    } catch (error) {
      console.error("Error checking preferences:", error);
      setPreferencesChecked(true);
    }
  };

  const handlePreferencesSaved = (preferences) => {
    setHasPreferences(true);
    setShowPreferencesModal(false);
    // Trigger refresh of preferences display
    refreshHomePreferences();
    // Optionally refresh recommendations based on new preferences
    if (preferences && preferences.subjects) {
      // Trigger recommendation refresh
      newRequest.get('/recommend/tutors').then(res => {
        setRecommendedTutors(res.data.recommendedTutors || []);
        setTopSubjects(res.data.topSubjects || []);
      });
    }
  };

  // Function to refresh preferences in HomeOverview
  const refreshHomePreferences = () => {
    // Trigger a refresh by updating the key
    setPreferencesRefreshKey(prev => prev + 1);
  };

  // Function to open edit preferences modal
  const handleEditPreferences = () => {
    setShowPreferencesModal(true);
  };

  // Handle message educator from tutor profile card
  const handleMessageEducator = (tutor) => {
    if (!tutor || !tutor._id) {
      showErrorNotification('Educator information not available');
      return;
    }
    setSelectedEducatorForMessage(tutor);
    setShowChatModal(true);
  };

  // Handle send message to educator
  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedEducatorForMessage || isSending) return;

    setIsSending(true);
    try {
      console.log('Creating conversation with educator:', selectedEducatorForMessage._id);
      
      // Create conversation if it doesn't exist
      const conversation = await createNewConversation(
        selectedEducatorForMessage._id,
        selectedEducatorForMessage.fullName || selectedEducatorForMessage.name || selectedEducatorForMessage.username || 'Educator',
        'educator', // receiverType
        null // No booking ID for pre-booking messages
      );

      console.log('Conversation created/retrieved:', conversation);

      if (!conversation || !conversation._id) {
        throw new Error('Failed to create or retrieve conversation. Conversation ID is missing.');
      }

      // Join the conversation room so this client receives real-time events
      try {
        joinConversation(conversation._id);
      } catch (joinErr) {
        console.warn('Failed to join conversation room:', joinErr);
      }

      console.log('Sending message to conversation:', conversation._id);
      
      // Send the message
      await sendTextMessage(conversation._id, messageText.trim());
      
      console.log('Message sent successfully');
      
      setMessageText('');
      showSuccessNotification('Message sent successfully!');
      
      // Close modal and navigate to messages page
      setShowChatModal(false);
      setSelectedEducatorForMessage(null);
      navigate('/messages');
      
    } catch (error) {
      console.error('Error sending message:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        stack: error.stack
      });
      
      // Show more specific error message
      let errorMessage = 'Failed to send message. Please try again.';
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 404) {
        errorMessage = 'Conversation not found. Please try again.';
      } else if (error.response?.status === 400) {
        errorMessage = 'Invalid message data. Please check and try again.';
      }
      
      showErrorNotification(errorMessage);
    } finally {
      setIsSending(false);
    }
  };

  // Handle key press in message input
  const handleMessageKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Close chat modal
  const closeChatModal = () => {
    setShowChatModal(false);
    setSelectedEducatorForMessage(null);
    setMessageText('');
    setIsSending(false);
  };

  // Mock function to simulate fetching related resources from external sources
  const fetchRelatedResources = async () => {
    setResourcesLoading(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock data - in real implementation, this would call external APIs
    const mockResources = [
      {
        id: 1,
        title: `${searchQuery} - Khan Academy`,
        description: "Free online courses, lessons and practice for learning " + searchQuery.toLowerCase(),
        url: `https://www.khanacademy.org/search?page_search_query=${encodeURIComponent(searchQuery)}`,
        source: "Khan Academy",
        type: "course",
        icon: FaPlay,
        rating: 4.8,
        free: true
      },
      {
        id: 2,
        title: `${searchQuery} Tutorial - YouTube`,
        description: "Video tutorials and explanations about " + searchQuery.toLowerCase(),
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery + " tutorial")}`,
        source: "YouTube",
        type: "video",
        icon: FaYoutube,
        rating: 4.5,
        free: true
      },
      {
        id: 3,
        title: `${searchQuery} - Coursera`,
        description: "Professional courses and certificates in " + searchQuery.toLowerCase(),
        url: `https://www.coursera.org/search?query=${encodeURIComponent(searchQuery)}`,
        source: "Coursera",
        type: "course",
        icon: FaBook,
        rating: 4.7,
        free: false
      },
      {
        id: 4,
        title: `${searchQuery} Documentation`,
        description: "Official documentation and guides for " + searchQuery.toLowerCase(),
        url: `https://www.google.com/search?q=${encodeURIComponent(searchQuery + " documentation")}`,
        source: "Documentation",
        type: "docs",
        icon: FaFileAlt,
        rating: 4.6,
        free: true
      },
      {
        id: 5,
        title: `${searchQuery} - edX`,
        description: "University-level courses about " + searchQuery.toLowerCase(),
        url: `https://www.edx.org/search?q=${encodeURIComponent(searchQuery)}`,
        source: "edX",
        type: "course",
        icon: FaBook,
        rating: 4.6,
        free: true
      },
      {
        id: 6,
        title: `${searchQuery} - Stack Overflow`,
        description: "Community Q&A and discussions about " + searchQuery.toLowerCase(),
        url: `https://stackoverflow.com/search?q=${encodeURIComponent(searchQuery)}`,
        source: "Stack Overflow",
        type: "forum",
        icon: FaGlobe,
        rating: 4.4,
        free: true
      }
    ];

    setRelatedResources(mockResources);
    setResourcesLoading(false);
  };

  const handleSearchChange = (e) => {
    const newQuery = e.target.value;
    setSearchQuery(newQuery);
    setCurrentPage(1);
    
    // Store search query in sessionStorage for tracking
    if (newQuery.trim().length > 0) {
      sessionStorage.setItem('lastSearchQuery', newQuery.trim());
    } else {
      sessionStorage.removeItem('lastSearchQuery');
    }
  };

  // Debounced search tracking
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim().length > 2) {
        trackSearchQuery(searchQuery.trim(), filters);
      }
    }, 1000); // Track after 1 second of no typing

    return () => clearTimeout(timeoutId);
  }, [searchQuery, filters]);

  // Track search query
  const trackSearchQuery = async (query, currentFilters) => {
    try {
      await newRequest.post('/recommend/track-search', {
        searchQuery: query,
        filters: currentFilters || {}
      });

      // Also persist the search to analytics storage (best-effort)
      try {
        if (currentUser && currentUser._id) {
          await recordSearch({ userId: currentUser._id, query, filters: currentFilters || {}, resultsCount: 0 });
        }
      } catch (err) {
        console.warn('Failed to persist search analytics:', err?.response?.data || err.message);
      }
    } catch (error) {
      console.error('Error tracking search query:', error);
    }
  };

  // Handle search on Enter key
  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter' && searchQuery.trim().length > 0) {
      trackSearchQuery(searchQuery.trim(), filters);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
    setCurrentPage(1);
  };

  const handleSectionChange = (section) => {
    setActiveSection(section);
    setCurrentPage(1);
    // Fetch tutors when switching to tutors section
    if (section === "tutors") {
      fetchTutors();
    }
  };

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
  };

  const handleLogout = () => {
    const confirmLogout = window.confirm("Are you sure you want to log out?");
    
    if (confirmLogout) {
      setIsLoggingOut(true);
      
      // Clear user data from localStorage
      localStorage.removeItem("currentUser");
      localStorage.removeItem("accessToken");
      
      // Broadcast logout event to other tabs
      localStorage.setItem("logoutEvent", Date.now().toString());
      
      // Navigate to login page
      navigate("/", { state: { from: location } });
    }
  };

  // Listen for logout events from other tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "logoutEvent" || e.key === "accessToken" && e.newValue === null) {
        // Another tab logged out, log out this tab too
        setCurrentUser(null);
        navigate("/login");
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [navigate]);

  // Filter packages based on search and filters
  const filteredPackages = packages.filter(pkg => {
    // Search query filter
    const matchesSearch = 
      pkg.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      pkg.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (pkg.keywords && pkg.keywords.some(keyword => 
        keyword.toLowerCase().includes(searchQuery.toLowerCase())
      ));
    
    // Subject filter
    const matchesSubject = filters.subject === "all" || 
      (pkg.keywords && pkg.keywords.includes(filters.subject));
    
    // Price range filter
    let matchesPrice = true;
    if (filters.priceRange === "under30") {
      matchesPrice = pkg.rate < 30;
    } else if (filters.priceRange === "30to40") {
      matchesPrice = pkg.rate >= 30 && pkg.rate <= 40;
    } else if (filters.priceRange === "over40") {
      matchesPrice = pkg.rate > 40;
    }
    
    // Academic level filter
    const matchesLevel = filters.academicLevel === "all" || 
      pkg.academicLevel === filters.academicLevel;
    
    // Language filter
    const matchesLanguage = filters.language === "all" || 
      pkg.language === filters.language;
    
    return matchesSearch && matchesSubject && matchesPrice && matchesLevel && matchesLanguage;
  });

  // Pagination for tutors
  const indexOfLastPackage = currentPage * packagesPerPage;
  const indexOfFirstPackage = indexOfLastPackage - packagesPerPage;
  const currentPackages = filteredPackages.slice(indexOfFirstPackage, indexOfLastPackage);
  const totalPages = Math.ceil(filteredPackages.length / packagesPerPage);

  // Pagination for resources
  const indexOfLastResource = currentPage * resourcesPerPage;
  const indexOfFirstResource = indexOfLastResource - resourcesPerPage;
  const currentResources = relatedResources.slice(indexOfFirstResource, indexOfLastResource);
  const totalResourcePages = Math.ceil(relatedResources.length / resourcesPerPage);

  const nextPage = () => {
    const maxPages = activeSection === "tutors" ? totalPages : totalResourcePages;
    if (currentPage < maxPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Get server URL for image paths
  const getServerUrl = () => {
    return import.meta.env.VITE_API_URL || "http://localhost:8800";
  };

  // Helper function to get the correct profile picture URL
  const getProfilePictureUrl = (educator) => {
    if (!educator) return '/img/noavatar.jpg';
    
    const profilePic = educator.img || educator.profilePicture || educator.avatar || educator.picture;
    
    if (!profilePic) return '/img/noavatar.jpg';
    
    // If it's already a full URL (starts with http:// or https://)
    if (profilePic.startsWith('http://') || profilePic.startsWith('https://')) {
      return profilePic;
    }
    
    // If it's already a public path, use it as is
    if (profilePic.startsWith('/img/') || profilePic.startsWith('/public/')) {
      return profilePic;
    }
    
    // If it's a relative path, construct the full URL
    const cleanPath = profilePic.startsWith('/') ? profilePic.substring(1) : profilePic;
    const baseUrl = getServerUrl();
    return `${baseUrl}/${cleanPath}`;
  };

  // Helper function to get package image URL
  const getPackageImageUrl = (pkg) => {
    const image = pkg.thumbnail || pkg.image || pkg.cover;
    
    if (!image) return '/img/noavatar.jpg';
    
    if (image.startsWith('http://') || image.startsWith('https://')) {
      return image;
    }
    
    // If it's already a public path, use it as is
    if (image.startsWith('/img/') || image.startsWith('/public/')) {
      return image;
    }
    
    const cleanPath = image.startsWith('/') ? image.substring(1) : image;
    const baseUrl = getServerUrl();
    return `${baseUrl}/${cleanPath}`;
  };

  // Helper function to format package price with currency conversion
  const formatPackagePrice = (pkg) => {
    if (!pkg) return 'Rs.0 hr';
    
    const packageCurrency = pkg.currency || 'LKR';
    const packageRate = pkg.rate || pkg.price || 0;
    
    // Convert to selected currency if different from package currency
    const convertedRate = packageCurrency !== selectedCurrency
      ? convertCurrency(packageRate, packageCurrency, selectedCurrency)
      : packageRate;
    
    // Get symbol for selected currency
    const symbol = getCurrencySymbol(selectedCurrency);
    
    // Format with 2 decimal places for converted rates, but keep original format if same currency
    if (packageCurrency !== selectedCurrency) {
      return `${symbol}${convertedRate.toFixed(2)} hr`;
    }
    
    return `${symbol}${packageRate} hr`;
  };

  // Handle image error with fallback
  const handlePackageImageError = (e) => {
    if (e.target.dataset.retryCount === '1') {
      // Already tried fallback, stop here to prevent infinite loop
      return;
    }
    e.target.dataset.retryCount = '1';
    e.target.src = '/img/noavatar.jpg';
  };

  // Handle avatar image error with fallback
  const handleAvatarImageError = (e) => {
    if (e.target.dataset.retryCount === '1') {
      // Already tried fallback, stop here to prevent infinite loop
      return;
    }
    e.target.dataset.retryCount = '1';
    e.target.src = '/img/noavatar.jpg';
  };

  // Helper function to render stars for rating
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={`full-${i}`} className="star" />);
    }

    if (hasHalfStar) {
      stars.push(<FaStarHalfAlt key="half" className="star half" />);
    }

    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<FaRegStar key={`empty-${i}`} className="star empty" />);
    }

    return stars;
  };



  if (!currentUser) {
    return <div className="dashboard-error">Please log in to access your dashboard</div>;
  }

  if (loading) {
    return <div className="loading-container">Loading packages...</div>;
  }

  if (isLoggingOut) {
    return <div className="loading-container">Logging out...</div>;
  }

  return (
    <div className="student-dashboard">
      <StudentSidebar onLogout={handleLogout} username={currentUser?.username} />
      <div className="student-dashboard-content">
        {location.pathname === "/student-dashboard" ? (
                      <HomeOverview onPreferencesUpdate={refreshHomePreferences} refreshKey={preferencesRefreshKey} onEditPreferences={handleEditPreferences} />
        ) : location.pathname === "/find-tutors" ? (
          <div className="find-tutors-section">
            {/* Header Banner */}
            <SharedHeaderBanner 
              title="Discover qualified educators for your learning journey"
              subtitle=""
            />

            {/* Search and Filters Section */}
            <div className="search-section">
              <div className="search-container">
                <div className="search-bar">
                  <FaSearch className="search-icon" />
                  <input 
                    type="text" 
                    placeholder="Search what you need to learn here" 
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onKeyPress={handleSearchKeyPress}
                  />
                </div>
                <div className="filters">
                  <div className="filter-group">
                    <label>Domain</label>
                    <select name="subject" value={filters.subject} onChange={handleFilterChange}>
                      <option value="all">All Domains</option>
                      <option value="Technology">Technology</option>
                      <option value="Mathematics">Mathematics</option>
                      <option value="Physics">Physics</option>
                      <option value="Chemistry">Chemistry</option>
                      <option value="Biology">Biology</option>
                      <option value="Computer Science">Computer Science</option>
                      <option value="Literature">Literature</option>
                      <option value="History">History</option>
                    </select>
                  </div>
                  <div className="filter-group">
                    <label>Price Range</label>
                    <select name="priceRange" value={filters.priceRange} onChange={handleFilterChange}>
                      <option value="all">All Prices</option>
                      <option value="under30">Under $30</option>
                      <option value="30to40">$30 - $40</option>
                      <option value="over40">Over $40</option>
                    </select>
                  </div>
                  <div className="filter-group">
                    <label>Academic Level</label>
                    <select name="academicLevel" value={filters.academicLevel} onChange={handleFilterChange}>
                      <option value="all">All Levels</option>
                      <option value="highschool">High School</option>
                      <option value="university">University</option>
                    </select>
                  </div>
                  <div className="filter-group">
                    <label>Language</label>
                    <select name="language" value={filters.language} onChange={handleFilterChange}>
                      <option value="all">All Languages</option>
                      <option value="English">English</option>
                      <option value="Spanish">Spanish</option>
                      <option value="Mandarin">Mandarin</option>
                      <option value="Korean">Korean</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="tab-navigation">
                <button 
                  className={`tab-btn ${activeSection === "tutors" ? "active" : ""}`}
                  onClick={() => handleSectionChange("tutors")}
                >
                  <FaUser className="tab-icon" />
                  Instructors
                </button>
                <button 
                  className={`tab-btn ${activeSection === "packages" ? "active" : ""}`}
                  onClick={() => handleSectionChange("packages")}
                >
                  <FaBook className="tab-icon" />
                  Packages
                </button>
                <button 
                  className={`tab-btn ${activeSection === "resources" ? "active" : ""}`}
                  onClick={() => handleSectionChange("resources")}
                >
                  <FaGlobe className="tab-icon" />
                  Related Resources
                </button>
              </div>
            </div>

            {/* Content Section */}
            {activeSection === "tutors" ? (
              selectedEducator ? (
                // Educator Details Section
                <div className="educator-details-section">
                  <button className="back-to-tutors-btn" onClick={handleBackToTutors}>
                    <FaArrowLeft /> Back to Instructors
                  </button>
                  
                  {educatorLoading ? (
                    <div className="loading-container">
                      <LoadingSpinner size="medium" text="Loading educator details..." />
                  </div>
                  ) : (
                    <>
                      <div className="educator-details-header">
                        <div className="educator-profile-image-container">
                          <img 
                            src={getProfilePictureUrl(selectedEducator)}
                            alt={selectedEducator.fullName || selectedEducator.name || selectedEducator.username || 'Educator'}
                            className="educator-profile-image"
                            onError={handleAvatarImageError}
                            loading="lazy"
                          />
                          {educatorProfile?.isPro && (
                            <div className="pro-badge-large">PRO</div>
                          )}
                        </div>
                        <div className="educator-profile-info">
                          <h2>{selectedEducator.fullName || educatorProfile?.name || selectedEducator.name || selectedEducator.username}</h2>
                          <div className="educator-rating-section">
                            <div className="stars">
                              {renderStars(selectedEducator.rating || educatorProfile?.rating || 0)}
                            </div>
                            <span className="rating-value-large">
                              {(selectedEducator.rating || educatorProfile?.rating || 0).toFixed(1)}
                            </span>
                            {selectedEducator.totalReviews > 0 && (
                              <span className="review-count">({selectedEducator.totalReviews} reviews)</span>
                            )}
                          </div>
                          <p className="educator-bio-full">
                            {educatorProfile?.bio || selectedEducator.bio || selectedEducator.desc || "No bio provided."}
                          </p>
                          {selectedEducator.country && (
                            <div className="educator-location">
                              <FaMapMarkerAlt className="location-icon" />
                              <span>{selectedEducator.country}</span>
                            </div>
                          )}
                          {educatorProfile?.qualifications && (
                            <div className="educator-qualifications">
                              <FaGraduationCap className="qual-icon" />
                              <span>{educatorProfile.qualifications}</span>
                            </div>
                          )}
                          {educatorProfile?.languages && educatorProfile.languages.length > 0 && (
                            <div className="educator-languages">
                              <FaLanguage className="lang-icon" />
                              <span>{educatorProfile.languages.join(", ")}</span>
                            </div>
                          )}
                          {(educatorProfile?.subjects || selectedEducator.subjects) && 
                           (educatorProfile?.subjects?.length > 0 || selectedEducator.subjects?.length > 0) && (
                            <div className="educator-subjects">
                              <h4>Subjects:</h4>
                              <div className="subjects-list">
                                {(educatorProfile?.subjects || selectedEducator.subjects || []).map((subject, idx) => (
                                  <span key={idx} className="subject-badge">{subject}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          <div className="educator-action-buttons">
                            <button 
                              className="message-educator-detail-btn"
                              onClick={() => handleMessageEducator(selectedEducator)}
                              title="Message this instructor"
                            >
                              <FaComments className="message-icon" />
                              Message Instructor
                    </button>
                          </div>
                  </div>
                </div>

                      <div className="educator-packages-section">
                        <h3>Available Packages</h3>
                        {educatorPackages.length > 0 ? (
                          <div className="educator-packages-grid">
                            {educatorPackages.map(pkg => (
                              <div className="educator-package-card" key={pkg._id}>
                                <div className="package-image">
                                  <img
                                    src={getPackageImageUrl(pkg)}
                                    alt={pkg.title || 'Package'}
                                    onError={handlePackageImageError}
                                    loading="lazy"
                                  />
                                  <div className="price-badge">
                                    {formatPackagePrice(pkg)}
                            </div>
                                  {pkg.languages && pkg.languages.length > 0 && (
                                    <div className="language-badges">
                                      {pkg.languages.slice(0, 2).map((lang, index) => (
                                        <span key={index} className="language-badge">{lang}</span>
                            ))}
                          </div>
                                  )}
                        </div>
                        <div className="package-content">
                                  <h4 className="package-title">{pkg.title || 'Untitled Package'}</h4>
                                  <p className="package-description">
                                    {pkg.description || pkg.desc || 'No description available'}
                                  </p>
                                  <div className="package-meta-info">
                                    {pkg.sessions && (
                                      <span className="sessions-info">Sessions: {pkg.sessions}</span>
                                    )}
                                    {pkg.rating && (
                                      <div className="package-rating">
                                        <div className="stars">
                                          {renderStars(pkg.rating)}
                          </div>
                                        <span>{pkg.rating.toFixed(1)}</span>
                                      </div>
                                    )}
                                  </div>
                                  <Link 
                                    to={`/package/${pkg._id}`}
                                    className="view-package-btn"
                                  >
                                    View Package
                                  </Link>
                                </div>
                              </div>
                            ))}
                          </div>
                              ) : (
                          <div className="no-packages">
                            <p>No packages available from this educator.</p>
                                </div>
                              )}
                            </div>
                    </>
                  )}
                </div>
              ) : (
                // Instructors Section - shows tutor profiles
                <div className="tutors-profile-section">
                  {tutorsLoading ? (
                    <div className="loading-container">
                      <LoadingSpinner size="medium" text="Loading tutors..." />
                    </div>
                  ) : tutors.length > 0 ? (
                    <div className="tutors-profile-grid">
                      {tutors.map(tutor => (
                        <div className="tutor-profile-card" key={tutor._id}>
                          {/* Profile banner showing up to 3 latest package images */}
                          <div className="profile-banner">
                            {
                              (() => {
                                // Prefer pre-fetched banners (tutorBanners), fallback to tutor.latestPackages if available
                                const fetched = tutorBanners && tutorBanners[tutor._id];
                                const imgs = Array.isArray(fetched) && fetched.length ? fetched : (Array.isArray(tutor.latestPackages) && tutor.latestPackages.length ? tutor.latestPackages.slice(0,3).map(p => {
                                  const image = (typeof p === 'string') ? p : (p && (p.thumbnail || p.image || p.cover));
                                  if (!image) return '/img/noavatar.jpg';
                                  if (image.startsWith('http://') || image.startsWith('https://') || image.startsWith('/')) return image;
                                  const clean = image.startsWith('/') ? image.substring(1) : image;
                                  return `${getServerUrl()}/${clean}`;
                                }) : []);

                                // fill up to 3 with placeholders if needed
                                while (imgs.length < 3) imgs.push('/img/noavatar.jpg');

                                return imgs.map((src, i) => (
                                  <img key={i} src={src} alt={`pkg-${i}`} className={`banner-img banner-img-${i}`} onError={handlePackageImageError} />
                                ));
                              })()
                            }

                            <div className="avatar-wrapper">
                              <img 
                                src={getProfilePictureUrl(tutor)}
                                alt={tutor.fullName || tutor.name || tutor.username || 'Tutor'}
                                className="profile-picture"
                                onError={handleAvatarImageError}
                                loading="lazy"
                              />
                              {tutor.isPro && (
                                <div className="pro-badge">PRO</div>
                              )}
                            </div>
                          </div>

                          <div className="tutor-profile-info">
                            <h3 className="tutor-name">{tutor.fullName || tutor.name || tutor.username || 'Instructor'}</h3>
                            {tutor.country && (
                              <div className="tutor-location">
                                <FaMapMarkerAlt className="location-icon" />
                                <span>{tutor.country}</span>
                              </div>
                            )}

                            <div className="tutor-rating">
                              <div className="stars">
                                {renderStars(tutor.rating || 0)}
                              </div>
                              <span className="rating-value">{tutor.rating ? tutor.rating.toFixed(1) : '0.0'}</span>
                            </div>

                            {tutor.languages && tutor.languages.length > 0 && (
                              <div className="language-badges">
                                {tutor.languages.slice(0, 2).map((lang, index) => (
                                  <span key={index} className="language-badge">{lang === 'Sinhala' ? 'සිංහල' : lang}</span>
                                ))}
                              </div>
                            )}

                            {tutor.bio && (
                              <p className="tutor-bio">{tutor.bio}</p>
                            )}
                          </div>
                          <div className="tutor-card-buttons">
                            <button 
                              className="view-profile-btn"
                              onClick={(e) => handleViewEducator(e, tutor)}
                            >
                              View
                            </button>
                            <button 
                              className="message-educator-btn"
                              onClick={() => handleMessageEducator(tutor)}
                              title="Message this instructor"
                            >
                              <FaComments className="message-icon" />
                              Message
                            </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-results">
                      <p>No tutors available at the moment.</p>
                  </div>
                )}
              </div>
              )
            ) : activeSection === "packages" ? (
              // Courses Section - now shows the tutors/package cards
              <div className="tutors-section">
                {/* ML Recommended Packages Section */}
                {mlRecommendations.length > 0 && (
                  <div className="recommended-section" style={{ marginBottom: '2rem' }}>
                    <div className="section-header">
                      <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1a1a1a', marginBottom: '1rem' }}>
                        🎯 Recommended For You
                      </h2>
                      <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                        Personalized package recommendations based on your learning preferences and activity
                      </p>
                    </div>
                    <div className="tutors-grid" style={{ marginBottom: '2rem' }}>
                      {mlRecommendations.slice(0, 6).map(item => {
                        const pkg = item.package;
                        if (!pkg) return null;
                        return (
                          <div className="tutor-card" key={pkg._id} style={{ position: 'relative' }}>
                            {/* ML Badge */}
                            <div style={{
                              position: 'absolute',
                              top: '10px',
                              left: '10px',
                              backgroundColor: '#4CAF50',
                              color: 'white',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              zIndex: 2,
                              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                            }}>
                              {item.score ? `${Math.round(item.score * 100)}% Match` : 'Recommended'}
                            </div>
                            
                            <div className="package-image">
                              <img
                                src={getPackageImageUrl(pkg)}
                                alt={pkg.title || 'Package'}
                                onError={handlePackageImageError}
                                loading="lazy"
                              />
                            </div>
                            
                            <div className="tutor-info">
                              <h3 className="tutor-name">{pkg.title}</h3>
                              <p className="tutor-subject">{pkg.subject || 'General'}</p>
                              
                              {pkg.educator && (
                                <div className="educator-info" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                                  <FaUserCircle style={{ color: '#666' }} />
                                  <span style={{ fontSize: '0.85rem', color: '#666' }}>
                                    {pkg.educator.fullName || pkg.educator.username}
                                  </span>
                                </div>
                              )}
                              
                              {pkg.averageRating > 0 && (
                                <div className="rating" style={{ marginTop: '0.5rem' }}>
                                  {renderStars(pkg.averageRating)}
                                  <span style={{ fontSize: '0.85rem', color: '#666', marginLeft: '0.5rem' }}>
                                    ({pkg.totalReviews || 0})
                                  </span>
                                </div>
                              )}
                              
                              <div className="tutor-details" style={{ marginTop: '0.75rem' }}>
                                <div className="price" style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1a1a1a' }}>
                                  {formatPrice(pkg.price)}
                                </div>
                              </div>
                              
                              <button
                                className="view-profile-btn"
                                onClick={() => navigate(`/package/${pkg._id}`)}
                                style={{ marginTop: '1rem', width: '100%' }}
                              >
                                View Package
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <hr style={{ border: 'none', borderTop: '1px solid #e0e0e0', margin: '2rem 0' }} />
                  </div>
                )}
                
                <div className="section-header">
                  <div className="results-info">
                    Showing {indexOfFirstPackage + 1}-{Math.min(indexOfLastPackage, filteredPackages.length)} of {filteredPackages.length} results
                  </div>
                </div>

                {filteredPackages.length > 0 ? (
                  <>
                    <div className="tutors-grid">
                      {currentPackages.map(pkg => (
                        <div className="tutor-card" key={pkg._id}>
                          <div className="package-image">
                            <img
                              src={getPackageImageUrl(pkg)}
                              alt={pkg.title || 'Package'}
                              onError={handlePackageImageError}
                              loading="lazy"
                            />
                            {/* User avatars - top right: show purchaser avatars and a +N badge */}
                            <div className="user-avatars">
                              {
                                // Determine purchasers list from possible package properties
                                (() => {
                                  const purchasers = pkg.purchasers || pkg.purchasersList || pkg.enrolledUsers || pkg.students || [];
                                  const total = (pkg.enrolledCount ?? pkg.purchasersCount ?? purchasers.length) || 0;
                                  const maxVisible = 2;
                                  const visible = Array.isArray(purchasers) && purchasers.length ? purchasers.slice(0, maxVisible) : [];

                                  // If no purchaser objects are available, fall back to showing educator avatar placeholders
                                  if (visible.length === 0 && total > 0) {
                                    return (
                                      <>
                                        <img src={getProfilePictureUrl(pkg.educatorId)} alt="User" className="avatar-item" onError={handleAvatarImageError} />
                                        <img src={getProfilePictureUrl(pkg.educatorId)} alt="User" className="avatar-item" onError={handleAvatarImageError} />
                                        {total > 2 && <div className="avatar-count">+{total - 2}</div>}
                                      </>
                                    );
                                  }

                                  return (
                                    <>
                                      {visible.map((p, i) => (
                                        <img
                                          key={i}
                                          src={getProfilePictureUrl(p)}
                                          alt={p?.username || 'User'}
                                          className="avatar-item"
                                          onError={handleAvatarImageError}
                                        />
                                      ))}
                                      {total > maxVisible && (
                                        <div className="avatar-count">+{total - maxVisible}</div>
                                      )}
                                    </>
                                  );
                                })()
                              }
                            </div>
                            {/* Language badges - bottom right */}
                            <div className="language-badges">
                              {pkg.languages && pkg.languages.length > 0 ? (
                                pkg.languages.slice(0, 2).map((lang, index) => {
                                  const displayLang = (lang === 'Sinhala') ? 'සිංහල' : (lang === 'English' ? 'English' : lang);
                                  return <span key={index} className="language-badge">{displayLang}</span>;
                                })
                              ) : (
                                <>
                                  <span className="language-badge">English</span>
                                  <span className="language-badge">සිංහල</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="package-content">
                            {/* Title and Price on same line */}
                            <div className="package-header">
                              <h4 className="package-title">{pkg.title || 'Untitled Package'}</h4>
                              <span className="package-price">{formatPackagePrice(pkg)}</span>
                            </div>
                            <p className="package-description">
                              {pkg.description || pkg.desc || 'No description available'}
                            </p>
                            
                            <div className="package-footer">
                              <div className="instructor-section">
                                <img 
                                  src={getProfilePictureUrl(pkg.educatorId)}
                                  alt={pkg.educatorId?.fullName || pkg.educatorId?.name || pkg.educatorId?.username || 'Tutor'}
                                  className="tutor-avatar"
                                  onError={handleAvatarImageError}
                                  loading="lazy"
                                />
                                <div className="tutor-info">
                                  <span className="tutor-name">
                                    {pkg.educatorId?.fullName || pkg.educatorId?.name || pkg.educatorId?.username || 'Instructor'}
                                  </span>
                                  <div className="rating-info">
                                    <div className="stars">
                                      {renderStars(pkg.rating || 4.8)}
                                    </div>
                                    <span className="rating-value">
                                      {pkg.rating ? pkg.rating.toFixed(1) : '4.8'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <Link 
                                to={`/package/${pkg._id}`} 
                                className="view-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  console.log('View button clicked for package:', pkg);
                                  console.log('Package ID:', pkg._id);
                                  console.log('Package data:', pkg);
                                }}
                              >
                                View
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pagination">
                      <button 
                        className="pagination-btn prev" 
                        onClick={prevPage} 
                        disabled={currentPage === 1}
                      >
                        <FaChevronLeft /> Previous
                      </button>
                      <div className="page-info">
                        Page {currentPage} of {totalPages}
                      </div>
                      <button 
                        className="pagination-btn next" 
                        onClick={nextPage} 
                        disabled={currentPage === totalPages}
                      >
                        Next <FaChevronRight />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="no-results">
                    <p>No learning packages found matching your search criteria.</p>
                    <p>Try searching in `Related Resources` for additional learning materials.</p>
                  </div>
                )}
              </div>
            ) : (
              // Related Resources Section
              <div className="resources-section">
                <div className="section-header">
                  <h2>Related Learning Resources</h2>
                  {searchQuery && (
                    <div className="search-info">
                      Search results for: <strong>`{searchQuery}`</strong>
                    </div>
                  )}
                </div>

                {!searchQuery.trim() ? (
                  <div className="no-search-message">
                    <FaSearch className="search-placeholder-icon" />
                    <h3>Enter a search term to find related resources</h3>
                    <p>Search for topics, subjects, or skills to discover learning materials from across the web</p>
                  </div>
                ) : resourcesLoading ? (
                  <div className="loading-resources">
                    <LoadingSpinner 
                      size="medium" 
                      text="Searching for related resources..." 
                      variant="warning"
                    />
                  </div>
                ) : (
                  <>
                    <div className="resources-grid">
                      {currentResources.map(resource => {
                        const IconComponent = resource.icon;
                        return (
                          <div className="resource-card" key={resource.id}>
                            <div className="resource-header">
                              <div className="resource-icon">
                                <IconComponent />
                              </div>
                              <div className="resource-source">
                                <span className="source-name">{resource.source}</span>
                                {resource.free && <span className="free-badge">Free</span>}
                              </div>
                            </div>
                            <h3 className="resource-title">{resource.title}</h3>
                            <p className="resource-description">{resource.description}</p>
                            <div className="resource-meta">
                              <RatingStars rating={resource.rating} />
                              <span className="resource-type">{resource.type}</span>
                            </div>
                            <div className="resource-footer">
                              <a 
                                href={resource.url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="resource-link"
                              >
                                Visit Resource <FaExternalLinkAlt />
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {relatedResources.length > resourcesPerPage && (
                      <div className="pagination">
                        <button 
                          className="pagination-btn prev" 
                          onClick={prevPage} 
                          disabled={currentPage === 1}
                        >
                          <FaChevronLeft /> Previous
                        </button>
                        <div className="page-info">
                          Page {currentPage} of {totalResourcePages}
                        </div>
                        <button 
                          className="pagination-btn next" 
                          onClick={nextPage} 
                          disabled={currentPage === totalResourcePages}
                        >
                          Next <FaChevronRight />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        ) : location.pathname === "/my-sessions" ? (
          <MySessions />
        ) : location.pathname === "/my-learning" ? (
          <MyLearning />
        ) : location.pathname === "/messages" ? (
          <Messages />
        ) : location.pathname === "/payments" ? (
          <Payments />
        ) : location.pathname === "/settings" ? (
          <Settings />
        ) : null}
      </div>

      {/* Subject Preferences Modal */}
      {/* Chat Modal */}
      {showChatModal && selectedEducatorForMessage && (
        <div className="chat-modal-overlay" onClick={closeChatModal}>
          <div className="chat-modal" onClick={e => e.stopPropagation()}>
            <div className="chat-header">
              <div className="chat-user-info">
                <div className="user-avatar">
                  <img 
                    src={getProfilePictureUrl(selectedEducatorForMessage)}
                    alt={selectedEducatorForMessage.fullName || selectedEducatorForMessage.name || selectedEducatorForMessage.username || 'Educator'}
                    onError={handleAvatarImageError}
                  />
                </div>
                <div className="user-details">
                  <h4>{selectedEducatorForMessage.fullName || selectedEducatorForMessage.name || selectedEducatorForMessage.username || 'Educator'}</h4>
                  <p>Instructor</p>
                  <div className="user-status">
                    <span className="status-dot online"></span>
                    <span className="status-text">Online</span>
                  </div>
                </div>
              </div>
              <button className="close-chat-btn" onClick={closeChatModal}>
                ×
              </button>
            </div>
            
            <div className="chat-messages">
                <div className="no-messages">
                <FaComments />
                <p>Start a conversation with {selectedEducatorForMessage.fullName || selectedEducatorForMessage.name || selectedEducatorForMessage.username || 'Educator'}</p>
                <p className="message-hint">Ask questions about courses, availability, or teaching style.</p>
              </div>
            </div>
            
            <div className="chat-input">
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyPress={handleMessageKeyPress}
                placeholder="Type your message..."
                rows="1"
                disabled={isSending}
              />
              <button 
                className="send-btn"
                onClick={handleSendMessage}
                disabled={!messageText.trim() || isSending}
              >
                {isSending ? (
                  <LoadingSpinner size="small" />
                ) : (
                  <FaPaperPlane />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <SubjectPreferencesModal
        isOpen={showPreferencesModal}
        onClose={() => setShowPreferencesModal(false)}
        onPreferencesSaved={handlePreferencesSaved}
      />
    </div>
  );
}

export default StudentDashboard;
