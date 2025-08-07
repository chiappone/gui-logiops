import React from "react";

interface ProgressBarProps {
  progress?: number; // 0-100, undefined for indeterminate
  className?: string;
  size?: "small" | "medium" | "large";
  color?: "primary" | "success" | "warning" | "error";
  showText?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  className = "",
  size = "medium",
  color = "primary",
  showText = false,
}) => {
  const sizeClasses = {
    small: "h-1",
    medium: "h-2",
    large: "h-3",
  };

  const colorClasses = {
    primary: "bg-blue-500",
    success: "bg-green-500",
    warning: "bg-yellow-500",
    error: "bg-red-500",
  };

  const isIndeterminate = progress === undefined;

  return (
    <div className={`progress-container ${className}`}>
      <div
        className={`progress-bar ${sizeClasses[size]} ${
          isIndeterminate ? "progress-indeterminate" : ""
        }`}
      >
        {!isIndeterminate && (
          <div
            className={`progress-fill ${colorClasses[color]}`}
            style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
          />
        )}
      </div>
      {showText && !isIndeterminate && (
        <div className="progress-text">{Math.round(progress)}%</div>
      )}
    </div>
  );
};

export default ProgressBar;
