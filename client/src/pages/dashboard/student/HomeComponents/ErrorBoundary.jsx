import React from 'react';
import PropTypes from 'prop-types';
import { FaExclamationTriangle, FaRedo } from 'react-icons/fa';
import './ErrorBoundary.scss';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Log error to console or error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // You can also log the error to an error reporting service here
    // logErrorToService(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom error UI
      return (
        <div className="error-boundary">
          <div className="error-content">
            <FaExclamationTriangle className="error-icon" />
            <h2>Something went wrong</h2>
            <p className="error-message">
              {this.props.fallbackMessage || 
               "We're sorry, but something unexpected happened. Please try refreshing the page."}
            </p>
            
            {this.props.showDetails && this.state.error && (
              <details className="error-details">
                <summary>Error Details</summary>
                <pre className="error-stack">
                  {this.state.error.toString()}
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
            
            <div className="error-actions">
              <button 
                onClick={this.handleRetry}
                className="retry-button"
              >
                <FaRedo /> Try Again
              </button>
              
              <button 
                onClick={() => window.location.reload()}
                className="refresh-button"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  fallbackMessage: PropTypes.string,
  showDetails: PropTypes.bool
};

ErrorBoundary.defaultProps = {
  showDetails: process.env.NODE_ENV === 'development'
};

export default ErrorBoundary;
