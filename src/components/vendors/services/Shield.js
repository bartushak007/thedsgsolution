import React, { Component } from 'react';

class ErrorBoundary extends Component {
  state = {
    error: false,
    info: null,
  }

  componentDidCatch(error, info) {
    this.setState({
      error,
      info
    });
  }

  render() {
    const { error, info } = this.state;

    if (error) {
      return (
        <div className="shield">
          <details 
            style={{ whiteSpace: 'pre-wrap' }}
          >
            <summary>Something went wrong...</summary>
            <p>{error.toString()}</p>
            <hr />
            <p>{info.componentStack}</p>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;