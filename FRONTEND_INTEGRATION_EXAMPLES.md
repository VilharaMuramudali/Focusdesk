# Frontend Integration Examples

## React Components for ML Recommendations

### 1. PersonalizedRecommendations Component

```jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PersonalizedRecommendations = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token'); // Get JWT token
      
      const response = await axios.get(
        'http://localhost:8800/api/recommend/personalized?limit=5',
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setRecommendations(response.data.data.recommendations);
      }
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError('Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  const handlePackageClick = async (packageId) => {
    // Track click interaction
    const token = localStorage.getItem('token');
    try {
      await axios.post(
        'http://localhost:8800/api/recommend/track',
        {
          packageId: packageId,
          interactionType: 'click',
          recommendationSource: 'ml-personalized'
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (err) {
      console.error('Error tracking click:', err);
    }

    // Navigate to package detail
    window.location.href = `/packages/${packageId}`;
  };

  if (loading) return <div className="loading">Loading recommendations...</div>;
  if (error) return <div className="error">{error}</div>;
  if (recommendations.length === 0) return null;

  return (
    <div className="personalized-recommendations">
      <h2>📚 Recommended For You</h2>
      <div className="recommendations-grid">
        {recommendations.map((rec, index) => (
          <div 
            key={rec.packageId} 
            className="recommendation-card"
            onClick={() => handlePackageClick(rec.packageId)}
          >
            <div className="card-badge">
              {index === 0 && '⭐ Top Pick'}
            </div>
            <h3>{rec.title}</h3>
            <p className="subject">{rec.subject}</p>
            <div className="score-badge">
              Match: {(rec.score * 100).toFixed(0)}%
            </div>
            <button className="view-btn">View Details</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PersonalizedRecommendations;
```

---

### 2. SimilarPackages Component

```jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SimilarPackages = ({ packageId }) => {
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (packageId) {
      fetchSimilarPackages();
    }
  }, [packageId]);

  const fetchSimilarPackages = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `http://localhost:8800/api/recommend/similar/${packageId}?limit=5`
      );

      if (response.data.success) {
        setSimilar(response.data.data.similar);
      }
    } catch (err) {
      console.error('Error fetching similar packages:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading similar packages...</div>;
  if (similar.length === 0) return null;

  return (
    <div className="similar-packages">
      <h3>💡 You Might Also Like</h3>
      <div className="similar-grid">
        {similar.map((pkg) => (
          <div key={pkg.packageId} className="similar-card">
            <h4>{pkg.title}</h4>
            <p>{pkg.subject}</p>
            <div className="similarity">
              {(pkg.similarity * 100).toFixed(0)}% similar
            </div>
            <a href={`/packages/${pkg.packageId}`}>Learn More →</a>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SimilarPackages;
```

---

### 3. Interaction Tracking Service

```javascript
// services/recommendationTracker.js

import axios from 'axios';

const API_BASE = 'http://localhost:8800/api/recommend';

class RecommendationTracker {
  constructor() {
    this.viewStartTime = null;
  }

  // Track package view
  async trackView(packageId) {
    this.viewStartTime = new Date();
    
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      await axios.post(
        `${API_BASE}/track-package-view`,
        {
          packageId,
          viewStartTime: this.viewStartTime,
          viewEndTime: new Date(),
          timeSpent: 0
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  }

  // Track when user leaves page (calculate time spent)
  async trackViewEnd(packageId) {
    if (!this.viewStartTime) return;

    const viewEndTime = new Date();
    const timeSpent = Math.floor((viewEndTime - this.viewStartTime) / 1000); // seconds

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      await axios.post(
        `${API_BASE}/track-package-view`,
        {
          packageId,
          viewStartTime: this.viewStartTime,
          viewEndTime,
          timeSpent
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (error) {
      console.error('Error tracking view end:', error);
    }

    this.viewStartTime = null;
  }

  // Track search query
  async trackSearch(searchQuery, filters = {}) {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      await axios.post(
        `${API_BASE}/track-search`,
        {
          searchQuery,
          filters
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (error) {
      console.error('Error tracking search:', error);
    }
  }

  // Track click
  async trackClick(packageId, source = 'general') {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      await axios.post(
        `${API_BASE}/track`,
        {
          packageId,
          interactionType: 'click',
          recommendationSource: source
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (error) {
      console.error('Error tracking click:', error);
    }
  }
}

export default new RecommendationTracker();
```

---

### 4. Package Detail Page Integration

```jsx
import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import SimilarPackages from '../components/SimilarPackages';
import tracker from '../services/recommendationTracker';

const PackageDetailPage = () => {
  const { packageId } = useParams();

  useEffect(() => {
    // Track view when component mounts
    tracker.trackView(packageId);

    // Track view end when component unmounts
    return () => {
      tracker.trackViewEnd(packageId);
    };
  }, [packageId]);

  return (
    <div className="package-detail">
      <div className="package-info">
        {/* Package details */}
      </div>

      {/* Similar packages section */}
      <SimilarPackages packageId={packageId} />
    </div>
  );
};

export default PackageDetailPage;
```

---

### 5. Dashboard Integration

```jsx
import React from 'react';
import PersonalizedRecommendations from '../components/PersonalizedRecommendations';

const Dashboard = () => {
  return (
    <div className="dashboard">
      <h1>Welcome to FocusDesk</h1>
      
      {/* Personalized Recommendations */}
      <PersonalizedRecommendations />

      {/* Other dashboard content */}
      <div className="dashboard-content">
        {/* ... */}
      </div>
    </div>
  );
};

export default Dashboard;
```

---

### 6. Search Page with Tracking

```jsx
import React, { useState, useEffect } from 'react';
import tracker from '../services/recommendationTracker';

const SearchPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);

  const handleSearch = async (query) => {
    setSearchQuery(query);
    
    // Track search
    await tracker.trackSearch(query);

    // Perform search
    // ... fetch results
  };

  const handleResultClick = (packageId) => {
    // Track click from search results
    tracker.trackClick(packageId, 'search-results');
    
    // Navigate to package
    window.location.href = `/packages/${packageId}`;
  };

  return (
    <div className="search-page">
      <input
        type="text"
        placeholder="Search packages..."
        value={searchQuery}
        onChange={(e) => handleSearch(e.target.value)}
      />

      <div className="search-results">
        {results.map((pkg) => (
          <div 
            key={pkg._id}
            className="result-card"
            onClick={() => handleResultClick(pkg._id)}
          >
            <h3>{pkg.title}</h3>
            <p>{pkg.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SearchPage;
```

---

## CSS Styles

```css
/* Personalized Recommendations */
.personalized-recommendations {
  margin: 2rem 0;
  padding: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
}

.personalized-recommendations h2 {
  margin-bottom: 1.5rem;
  font-size: 1.8rem;
}

.recommendations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
}

.recommendation-card {
  background: white;
  color: #333;
  border-radius: 8px;
  padding: 1.5rem;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  position: relative;
}

.recommendation-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0,0,0,0.2);
}

.card-badge {
  position: absolute;
  top: 0;
  right: 0;
  background: #fbbf24;
  color: #000;
  padding: 0.25rem 0.75rem;
  border-radius: 0 8px 0 8px;
  font-size: 0.8rem;
  font-weight: bold;
}

.score-badge {
  display: inline-block;
  background: #10b981;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  margin: 0.5rem 0;
}

.view-btn {
  width: 100%;
  padding: 0.75rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  margin-top: 1rem;
}

.view-btn:hover {
  background: #5568d3;
}

/* Similar Packages */
.similar-packages {
  margin: 2rem 0;
  padding: 2rem;
  background: #f9fafb;
  border-radius: 8px;
}

.similar-packages h3 {
  margin-bottom: 1rem;
  color: #374151;
}

.similar-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.similar-card {
  background: white;
  padding: 1rem;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  transition: border-color 0.2s;
}

.similar-card:hover {
  border-color: #667eea;
}

.similarity {
  color: #10b981;
  font-size: 0.9rem;
  font-weight: bold;
  margin: 0.5rem 0;
}
```

---

## Integration Checklist

- [ ] Install axios: `npm install axios`
- [ ] Create `PersonalizedRecommendations` component
- [ ] Create `SimilarPackages` component
- [ ] Create `recommendationTracker` service
- [ ] Add recommendations to Dashboard
- [ ] Add similar packages to Package Detail page
- [ ] Track searches in Search page
- [ ] Track views on package pages
- [ ] Track clicks on recommendations
- [ ] Test all tracking endpoints
- [ ] Style components with CSS

---

## Testing Your Integration

### 1. Dashboard Test
- Visit dashboard while logged in
- Verify "Recommended For You" section appears
- Click on a recommendation
- Check browser console for tracking requests

### 2. Package Detail Test
- Visit any package detail page
- Verify "You Might Also Like" section appears
- Wait 10 seconds and leave the page
- Check that view was tracked (timeSpent ~10 seconds)

### 3. Search Test
- Search for "mathematics"
- Check network tab for track-search request
- Click on a search result
- Verify click was tracked

---

## Best Practices

1. **Always track interactions** - More data = better recommendations
2. **Handle errors gracefully** - Don't break UI if tracking fails
3. **Use meaningful source tags** - Track where interactions come from
4. **Respect user privacy** - Only track with user consent
5. **Test in production** - Verify tracking works after deployment

---

## Next Steps

1. Implement the components in your React app
2. Test each interaction type
3. Monitor tracking data in MongoDB
4. Retrain model weekly: `python api/python-ai/train_from_csv.py`
5. Analyze recommendation CTR and adjust hybrid weights if needed
