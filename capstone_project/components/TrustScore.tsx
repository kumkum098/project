"use client";

import { getTrustBadge } from "@/lib/trustScore";

/**
 * Trust Score Component
 * Displays user trust score with badge and progress bar
 * 
 * @param score - Trust score (0-100)
 * @param showBadge - Whether to show badge (default: true)
 * @param showProgress - Whether to show progress bar (default: true)
 * @param size - Size variant: 'sm' | 'md' | 'lg'
 */
interface TrustScoreProps {
  score: number;
  showBadge?: boolean;
  showProgress?: boolean;
  size?: "sm" | "md" | "lg";
}

export default function TrustScore({ 
  score, 
  showBadge = true, 
  showProgress = true,
  size = "md" 
}: TrustScoreProps) {
  const badge = getTrustBadge(score);

  // Size configurations
  const sizeConfig = {
    sm: {
      scoreText: "text-lg",
      badgeText: "text-xs",
      progressHeight: "h-2",
      container: "p-3",
    },
    md: {
      scoreText: "text-2xl",
      badgeText: "text-sm",
      progressHeight: "h-3",
      container: "p-4",
    },
    lg: {
      scoreText: "text-4xl",
      badgeText: "text-base",
      progressHeight: "h-4",
      container: "p-6",
    },
  };

  const config = sizeConfig[size];

  return (
    <div className={`bg-white rounded-lg shadow-md ${config.container}`}>
      {/* Score and Badge */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <span className={`font-bold text-gray-900 ${config.scoreText}`}>
            {score}
          </span>
        </div>
        
        {showBadge && (
          <span className={`px-3 py-1 rounded-full font-semibold ${badge.bgColor} ${badge.color} ${config.badgeText}`}>
            {badge.name}
          </span>
        )}
      </div>

      {/* Progress Bar */}
      {showProgress && (
        <div className="w-full bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`${config.progressHeight} bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-500`}
            style={{ width: `${score}%` }}
          ></div>
        </div>
      )}

      {/* Score Label */}
      <p className="text-xs text-gray-500 mt-2">
        Trust Score
      </p>
    </div>
  );
}