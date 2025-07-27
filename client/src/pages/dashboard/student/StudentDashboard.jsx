import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FaSearch, FaStar, FaStarHalfAlt, FaRegStar, FaUser, FaHome, FaBook, 
  FaChevronLeft, FaChevronRight, FaSignOutAlt, FaCaretDown, FaCog, FaUserCircle, 
  FaExternalLinkAlt, FaGlobe, FaPlay, FaFileAlt, FaYoutube } from "react-icons/fa";
import "./studentDashboard.scss";
import Footer from "../../../components/footer/Footer";
import newRequest from "../../../utils/newRequest";
import StudentSidebar from "./StudentSidebar";
import FindTutors from "./FindTutors";
import MySessions from "./MySessions";
import LearningProgress from "./LearningProgress";
import MyLearning from "./MyLearning";
import Messages from "./Messages";
import Payments from "./Payments";
import Settings from "./Settings";
import HomeOverview from "./HomeOverview";

function StudentDashboard() {
  const [currentUser, setCurrentUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSection, setActiveSection] = useState("tutors"); // New state for section toggle
  const [filters, setFilters] = useState({
    subject: "all",
    priceRange: "all",
    academicLevel: "all",
    language: "all"
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [packages, setPackages] = useState([]);
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

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem("currentUser");
    if (userData) {
      setCurrentUser(JSON.parse(userData));
    }
    
    // Fetch packages from backend
    fetchPackages();

    // Close user menu when clicking outside
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
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
    setSearchQuery(e.target.value);
    setCurrentPage(1);
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

  // Rating stars component
  const RatingStars = ({ rating = 5 }) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<FaStar key={i} className="star filled" />);
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(<FaStarHalfAlt key={i} className="star half" />);
      } else {
        stars.push(<FaRegStar key={i} className="star empty" />);
      }
    }
    
    return <div className="rating-stars">{stars} <span className="rating-value">({rating})</span></div>;
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
          <HomeOverview />
        ) : location.pathname === "/find-tutors" ? (
          <>
            {/* Search and Filters Section */}
            <div className="search-section">
              <div className="search-container">
                <div className="search-bar">
                  <FaSearch className="search-icon" />
                  <input 
                    type="text" 
                    placeholder="Search for learning packages, topics, or subjects..." 
                    value={searchQuery}
                    onChange={handleSearchChange}
                  />
                </div>
                <div className="filters">
                  <div className="filter-group">
                    <label>Subject</label>
                    <select name="subject" value={filters.subject} onChange={handleFilterChange}>
                      <option value="all">All Subjects</option>
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

              {/* Section Toggle */}
              <div className="section-toggle">
                <button 
                  className={`toggle-btn ${activeSection === "tutors" ? "active" : ""}`}
                  onClick={() => handleSectionChange("tutors")}
                >
                  <FaUser className="toggle-icon" />
                  Tutors
                </button>
                <button 
                  className={`toggle-btn ${activeSection === "resources" ? "active" : ""}`}
                  onClick={() => handleSectionChange("resources")}
                >
                  <FaGlobe className="toggle-icon" />
                  Related Resources
                </button>
              </div>
            </div>

            {/* Content Section */}
            {activeSection === "tutors" ? (
              // Tutors Section
              <div className="tutors-section">
                <div className="section-header">
                  <h2>Available Learning Packages</h2>
                  <div className="results-info">
                    Showing {indexOfFirstPackage + 1}-{Math.min(indexOfLastPackage, filteredPackages.length)} of {filteredPackages.length} results
                  </div>
                </div>

                {filteredPackages.length > 0 ? (
                  <>
                    <div className="tutors-grid">
                      {currentPackages.map(pkg => (
                        <div className="tutor-card" key={pkg._id}>
                          <div className="tutor-image">
                            {pkg.thumbnail ? (
                              <img src={pkg.thumbnail} alt={pkg.title} className="package-thumbnail" />
                            ) : (
                              <div className="placeholder-thumbnail">
                                <FaBook size={40} />
                              </div>
                            )}
                          </div>
                          <h3 className="tutor-name">{pkg.title}</h3>
                          <RatingStars rating={pkg.rating || 5} />
                          <p className="tutor-description">{pkg.description}</p>
                          <div className="package-meta">
                            <span className="sessions-badge">{pkg.sessions || 1} session(s)</span>
                            {pkg.academicLevel && (
                              <span className="level-badge">{pkg.academicLevel}</span>
                            )}
                            {pkg.language && (
                              <span className="language-badge">{pkg.language}</span>
                            )}
                          </div>
                          <div className="tutor-footer">
                            <div className="tutor-price">${pkg.rate}/hr</div>
                            <Link to={`/package/${pkg._id}`} className="view-btn">View Details</Link>
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
                    <div className="loading-spinner"></div>
                    <p>Searching for related resources...</p>
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
            <Footer />
          </>
        ) : location.pathname === "/my-sessions" ? (
          <MySessions />
        ) : location.pathname === "/learning-progress" ? (
          <LearningProgress />
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
    </div>
  );
}

export default StudentDashboard;
