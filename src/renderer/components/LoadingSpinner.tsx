import React from "react";

interface LoadingSpinnerProps {
  size?: "small" | "medium" | "large";
  text?: string;
  overlay?: boolean;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "medium",
  text,
  overlay = false,
  className = "",
}) => {
  const sizeClasses = {
    small: "w-4 h-4",
    medium: "w-8 h-8",
    large: "w-12 h-12",
  };

  const spinnerContent = (
    <div className={`loading-content ${className}`}>
      <div className={`loading-spinner ${sizeClasses[size]}`}></div>
      {text && <div className="loading-text">{text}</div>}
    </div>
  );

  if (overlay) {
    return <div className="loading-overlay">{spinnerContent}</div>;
  }

  return spinnerContent;
};

export default LoadingSpinner;
