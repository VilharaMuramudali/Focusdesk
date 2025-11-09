import React, { useState } from 'react';
import newRequest from '../utils/newRequest';
import { useNotifications } from '../hooks/useNotifications';

const ReviewSystemTest = () => {
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const { showSuccessNotification, showErrorNotification } = useNotifications();

  const addTestResult = (test, result, error = null) => {
    setTestResults(prev => [...prev, {
      test,
      result,
      error,
      timestamp: new Date().toISOString()
    }]);
  };

  const testReviewSystem = async () => {
    setLoading(true);
    try {
      // First test authentication
      const authResponse = await newRequest.get('/users/me');
      addTestResult('Authentication Test', authResponse.data);
      
      const response = await newRequest.get('/reviews/test');
      addTestResult('Review System Test', response.data);
      showSuccessNotification('Review system test completed');
    } catch (error) {
      addTestResult('Review System Test', null, {
        message: error.response?.data?.message || error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      showErrorNotification('Review system test failed');
    }
    setLoading(false);
  };

  const testPackageRatings = async () => {
    setLoading(true);
    try {
      // Get a sample package first
      const packagesResponse = await newRequest.get('/packages/public');
      if (packagesResponse.data && packagesResponse.data.length > 0) {
        const testPackage = packagesResponse.data[0];
        addTestResult('Sample Package Found', testPackage);
        
        // Test rating calculation
        const ratingResponse = await newRequest.get(`/packages/${testPackage._id}/refresh-ratings`);
        addTestResult('Package Rating Test', ratingResponse.data);
        
        // Also test getting package details
        const packageDetailResponse = await newRequest.get(`/packages/${testPackage._id}`);
        addTestResult('Package Detail Test', packageDetailResponse.data);
        
        showSuccessNotification('Package rating test completed');
      } else {
        addTestResult('Package Rating Test', null, 'No packages found');
      }
    } catch (error) {
      addTestResult('Package Rating Test', null, {
        message: error.response?.data?.message || error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      showErrorNotification('Package rating test failed');
    }
    setLoading(false);
  };

  const testReviewSubmission = async () => {
    setLoading(true);
    setTestResults([]);
    
    try {
      // Test 1: Check authentication
      addResult('Testing authentication...', 'info');
      const authResponse = await newRequest.get('/users/me');
      addResult(`✅ Authentication successful: ${authResponse.data.username}`, 'success');
      
      // Test 2: Get a real package
      addResult('Fetching a real package...', 'info');
      const packagesResponse = await newRequest.get('/packages');
      const testPackage = packagesResponse.data[0];
      addResult(`✅ Found package: ${testPackage.title}`, 'success');
      
      // Test 3: Submit a test review with the exact structure from frontend
      addResult('Submitting test review with frontend data structure...', 'info');
      const testReviewData = {
        educatorId: testPackage.educatorId,
        packageId: testPackage._id,
        sessionId: `test_session_${Date.now()}`,
        overallRating: 5,
        review: "This is a test review from the debugging system",
        categories: {
          overallExperience: 5,
          teachingQuality: 5,
          communication: 5,
          punctuality: 5,
          valueForMoney: 5
        },
        sessionDate: new Date().toISOString(),
        packageTitle: testPackage.title,
        educatorName: "Test Educator",
        bookingId: testPackage._id, // Using package ID as booking ID for test
        sessionIndex: 0
      };
      
      addResult(`📤 Sending review data: ${JSON.stringify(testReviewData, null, 2)}`, 'info');
      
      const reviewResponse = await newRequest.post('/reviews/submit', testReviewData);
      addResult(`✅ Review submitted successfully: ${reviewResponse.data.message}`, 'success');
      addResult(`📊 Review ID: ${reviewResponse.data.data._id}`, 'success');
      
      // Test 4: Verify the review was saved
      addResult('Verifying review was saved...', 'info');
      const savedReview = await newRequest.get(`/reviews/${reviewResponse.data.data._id}`);
      addResult(`✅ Review verified: ${savedReview.data.data.review}`, 'success');
      
    } catch (error) {
      console.error('Test error:', error);
      addResult(`❌ Test failed: ${error.message}`, 'error');
      if (error.response?.data) {
        addResult(`📋 Error details: ${JSON.stringify(error.response.data, null, 2)}`, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Review System Test Panel</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={testReviewSystem}
          disabled={loading}
          style={{ marginRight: '10px', padding: '10px 20px' }}
        >
          Test Review System
        </button>
        
        <button 
          onClick={testPackageRatings}
          disabled={loading}
          style={{ marginRight: '10px', padding: '10px 20px' }}
        >
          Test Package Ratings
        </button>
        
        <button 
          onClick={testReviewSubmission}
          disabled={loading}
          style={{ marginRight: '10px', padding: '10px 20px' }}
        >
          Test Review Submission
        </button>
        
        <button 
          onClick={clearResults}
          style={{ padding: '10px 20px' }}
        >
          Clear Results
        </button>
      </div>

      {loading && <div>Testing...</div>}

      <div style={{ marginTop: '20px' }}>
        <h3>Test Results:</h3>
        {testResults.map((result, index) => (
          <div key={index} style={{ 
            border: '1px solid #ccc', 
            margin: '10px 0', 
            padding: '10px',
            backgroundColor: result.error ? '#ffebee' : '#f1f8e9'
          }}>
            <h4>{result.test}</h4>
            <p><strong>Timestamp:</strong> {result.timestamp}</p>
            {result.error ? (
              <div>
                <p><strong>Error:</strong></p>
                <pre style={{ backgroundColor: '#fff', padding: '10px' }}>
                  {JSON.stringify(result.error, null, 2)}
                </pre>
              </div>
            ) : (
              <div>
                <p><strong>Result:</strong></p>
                <pre style={{ backgroundColor: '#fff', padding: '10px' }}>
                  {JSON.stringify(result.result, null, 2)}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReviewSystemTest;
