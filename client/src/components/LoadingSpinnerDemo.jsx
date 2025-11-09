import React from 'react';
import LoadingSpinner from './LoadingSpinner';
import './LoadingSpinnerDemo.scss';

const LoadingSpinnerDemo = () => {
  return (
    <div className="loading-spinner-demo">
      <div className="demo-header">
        <h1>🎨 Cute Loading Spinners</h1>
        <p>Unique and adorable loading animations for the entire system</p>
      </div>

      <div className="demo-grid">
        {/* Size Variants */}
        <div className="demo-section">
          <h2>📏 Size Variants</h2>
          <div className="spinner-showcase">
            <div className="spinner-item">
              <h3>Small</h3>
              <LoadingSpinner size="small" text="Small spinner" variant="primary" />
            </div>
            <div className="spinner-item">
              <h3>Medium</h3>
              <LoadingSpinner size="medium" text="Medium spinner" variant="primary" />
            </div>
            <div className="spinner-item">
              <h3>Large</h3>
              <LoadingSpinner size="large" text="Large spinner" variant="primary" />
            </div>
          </div>
        </div>

        {/* Color Variants */}
        <div className="demo-section">
          <h2>🎨 Color Variants</h2>
          <div className="spinner-showcase">
            <div className="spinner-item">
              <h3>Primary (Blue)</h3>
              <LoadingSpinner size="medium" text="Primary theme" variant="primary" />
            </div>
            <div className="spinner-item">
              <h3>Success (Green)</h3>
              <LoadingSpinner size="medium" text="Success theme" variant="success" />
            </div>
            <div className="spinner-item">
              <h3>Warning (Orange)</h3>
              <LoadingSpinner size="medium" text="Warning theme" variant="warning" />
            </div>
            <div className="spinner-item">
              <h3>Purple</h3>
              <LoadingSpinner size="medium" text="Purple theme" variant="purple" />
            </div>
          </div>
        </div>

        {/* Custom Messages */}
        <div className="demo-section">
          <h2>💬 Custom Messages</h2>
          <div className="spinner-showcase">
            <div className="spinner-item">
              <h3>AI Analysis</h3>
              <LoadingSpinner 
                size="medium" 
                text="Analyzing your learning preferences..." 
                variant="purple" 
              />
            </div>
            <div className="spinner-item">
              <h3>Payment Processing</h3>
              <LoadingSpinner 
                size="medium" 
                text="Processing your payment securely..." 
                variant="success" 
              />
            </div>
            <div className="spinner-item">
              <h3>Data Loading</h3>
              <LoadingSpinner 
                size="medium" 
                text="Loading your dashboard data..." 
                variant="primary" 
              />
            </div>
            <div className="spinner-item">
              <h3>Searching</h3>
              <LoadingSpinner 
                size="medium" 
                text="Searching for the best tutors..." 
                variant="warning" 
              />
            </div>
          </div>
        </div>

        {/* No Text Variants */}
        <div className="demo-section">
          <h2>🔇 No Text Variants</h2>
          <div className="spinner-showcase">
            <div className="spinner-item">
              <h3>Small No Text</h3>
              <LoadingSpinner size="small" variant="primary" />
            </div>
            <div className="spinner-item">
              <h3>Medium No Text</h3>
              <LoadingSpinner size="medium" variant="success" />
            </div>
            <div className="spinner-item">
              <h3>Large No Text</h3>
              <LoadingSpinner size="large" variant="purple" />
            </div>
          </div>
        </div>
      </div>

      <div className="demo-features">
        <h2>✨ Features</h2>
        <div className="features-grid">
          <div className="feature-item">
            <h3>🎯 Multiple Sizes</h3>
            <p>Small, medium, and large variants for different contexts</p>
          </div>
          <div className="feature-item">
            <h3>🌈 Color Themes</h3>
            <p>Primary, success, warning, and purple color schemes</p>
          </div>
          <div className="feature-item">
            <h3>💫 Smooth Animations</h3>
            <p>Spinning dots, bouncing center ball, and floating particles</p>
          </div>
          <div className="feature-item">
            <h3>📱 Responsive</h3>
            <p>Adapts to different screen sizes and devices</p>
          </div>
          <div className="feature-item">
            <h3>♿ Accessible</h3>
            <p>Supports reduced motion preferences for accessibility</p>
          </div>
          <div className="feature-item">
            <h3>🌙 Dark Mode</h3>
            <p>Automatically adapts to dark mode preferences</p>
          </div>
        </div>
      </div>

      <div className="demo-usage">
        <h2>📝 Usage Examples</h2>
        <div className="code-examples">
          <div className="code-block">
            <h3>Basic Usage</h3>
            <pre>
{`<LoadingSpinner 
  size="medium" 
  text="Loading..." 
  variant="primary" 
/>`}
            </pre>
          </div>
          <div className="code-block">
            <h3>AI Recommendations</h3>
            <pre>
{`<LoadingSpinner 
  size="medium" 
  text="Analyzing your preferences..." 
  variant="purple" 
/>`}
            </pre>
          </div>
          <div className="code-block">
            <h3>Payment Processing</h3>
            <pre>
{`<LoadingSpinner 
  size="large" 
  text="Processing payment..." 
  variant="success" 
/>`}
            </pre>
          </div>
          <div className="code-block">
            <h3>Small Inline</h3>
            <pre>
{`<LoadingSpinner 
  size="small" 
  variant="warning" 
/>`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinnerDemo;
