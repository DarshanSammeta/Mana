"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import ErrorState from "./ErrorState";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  name?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[ErrorBoundary: ${this.props.name || "Global"}]`, error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorState
          title={`${this.props.name || "Module"} Error`}
          message={this.state.error?.message || "An unexpected error occurred in this section."}
          onRetry={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
