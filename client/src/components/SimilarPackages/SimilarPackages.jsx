import React, { useState, useEffect } from 'react';
import newRequest from '../../utils/newRequest';
import './SimilarPackages.scss';

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
      const response = await newRequest.get(`/recommend/similar/${packageId}?limit=5`);

      if (response.data.success) {
        setSimilar(response.data.data.similar);
      }
    } catch (err) {
      console.error('Error fetching similar packages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePackageClick = async (pkgId) => {
    // Track click
    try {
      await newRequest.post('/recommend/track', {
        packageId: pkgId,
        interactionType: 'click',
        recommendationSource: 'similar-packages'
      });
    } catch (err) {
      console.error('Error tracking click:', err);
    }

    // Navigate
    window.location.href = `/packages/${pkgId}`;
  };

  if (loading) return <div className="similar-packages loading">Loading similar packages...</div>;
  if (similar.length === 0) return null;

  return (
    <div className="similar-packages">
      <h3>💡 You Might Also Like</h3>
      <div className="similar-grid">
        {similar.map((pkg) => (
          <div 
            key={pkg.packageId} 
            className="similar-card"
            onClick={() => handlePackageClick(pkg.packageId)}
          >
            <h4>{pkg.title || 'Package'}</h4>
            <p>{pkg.subject || 'General'}</p>
            <div className="similarity">
              {(pkg.similarity * 100).toFixed(0)}% similar
            </div>
            <button className="learn-more">Learn More →</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SimilarPackages;
