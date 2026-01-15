"use client";
import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";

export default function CornerStats() {
  const [activeUsers, setActiveUsers] = useState(0);
  const [totalVisits, setTotalVisits] = useState(0);
  const [pos, setPos] = useState({ top: "50%" });
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startTop = useRef(0);
  const hasRecordedVisit = useRef(false);

  // Format large numbers with commas or abbreviations
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  // Get full formatted number for tooltips
  const getFullNumber = (num: number): string => {
    return num.toLocaleString();
  };

  // API functions - KEEP AS IS
  const recordVisit = async (): Promise<{ totalVisits: number; activeUsers: number }> => {
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/visit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to record visit');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error recording visit:', error);
      throw error;
    }
  };

  const fetchStats = async (): Promise<{ totalVisits: number }> => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/stats`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching stats:', error);
      throw error;
    }
  };

  // Initialize on component mount - SIMPLIFIED
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      
      const savedPos = localStorage.getItem('cornerStatsPos');
      if (savedPos) {
        try {
          const parsed = JSON.parse(savedPos);
          if (parsed.top) {
            setPos({ top: parsed.top });
          }
        } catch (e) {
          console.error('Error loading saved position:', e);
          setPos({ top: "50%" });
        }
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    // SIMPLIFIED: Single function to initialize stats
    const initializeStats = async () => {
      const hasVisited = sessionStorage.getItem('visitRecorded');
   
      
      if (!hasVisited && !hasRecordedVisit.current) {
        try {
          hasRecordedVisit.current = true;
          // Try to record visit first
          const result = await recordVisit();
          setTotalVisits(result.totalVisits);
          sessionStorage.setItem('visitRecorded', 'true');
        } catch (error) {
          console.error('Failed to record visit, fetching stats instead:', error);
          // If visit fails, fetch stats
          try {
            const stats = await fetchStats();
            setTotalVisits(stats.totalVisits);
          } catch (statsError) {
            console.error('Failed to fetch stats:', statsError);
          }
        }
      } else {
        // Visit already recorded, just fetch stats
        try {
          const stats = await fetchStats();
          setTotalVisits(stats.totalVisits);
        } catch (error) {
          console.error('Failed to fetch stats:', error);
        }
      }
    };

    // Setup socket connection for real-time updates
    const setupSocket = () => {
      // Connect to socket-service instead of backend
      const socket = io(process.env.NEXT_PUBLIC_SOCKET_SERVICE_URL || 'http://localhost:3002', {
        withCredentials: true
      });
      
      if (socket) {
        const handleActiveUsers = (data: { count: number }) => {
          setActiveUsers(data.count);
        };

        // Set up listeners
        socket.on("activeUsers", handleActiveUsers);

        // Cleanup
        return () => {
          socket.off("activeUsers", handleActiveUsers);
          socket.disconnect();
        };
      }
    };

    // Initialize everything
    initializeStats();
    const cleanupSocket = setupSocket();

    return () => {
      if (cleanupSocket) cleanupSocket();
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Dragging functionality - KEEP AS IS
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleMove = (clientY: number) => {
      if (!isDragging.current || !containerRef.current) return;
      
      const deltaY = clientY - startY.current;
      const newTop = startTop.current + deltaY;
      
      const containerHeight = containerRef.current.offsetHeight;
      const viewportHeight = window.innerHeight;
      const minTop = 20;
      const maxTop = viewportHeight - containerHeight - 20;
      const clampedTop = Math.max(minTop, Math.min(maxTop, newTop));
      
      setPos({ top: `${clampedTop}px` });
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      e.preventDefault();
      handleMove(e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging.current) return;
      if (e.touches.length === 1) {
        handleMove(e.touches[0].clientY);
      }
    };

    const handleEndDrag = () => {
      if (!isDragging.current) return;
      
      isDragging.current = false;
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      
      if (containerRef.current) {
        localStorage.setItem('cornerStatsPos', JSON.stringify(pos));
      }
    };

    const opts = { passive: false } as AddEventListenerOptions;
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleEndDrag);
    document.addEventListener('touchmove', handleTouchMove, opts);
    document.addEventListener('touchend', handleEndDrag);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleEndDrag);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleEndDrag);
    };
  }, [pos]);

  const handleStartDrag = (clientY: number) => {
    if (!containerRef.current) return;
    
    isDragging.current = true;
    startY.current = clientY;
    startTop.current = containerRef.current.offsetTop;
    
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'grabbing';
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleStartDrag(e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    // Prevent default to avoid scrolling while dragging
    if (e.touches.length === 1) {
      handleStartDrag(e.touches[0].clientY);
    }
  };

  // Save position when it changes
  useEffect(() => {
    if (pos.top !== '50%') {
      localStorage.setItem('cornerStatsPos', JSON.stringify(pos));
    }
  }, [pos]);

  if (typeof window === 'undefined') {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={`fixed right-0 z-50 transform -translate-y-1/2 touch-none select-none`}
      style={{ top: pos.top }}
    >
      <div className="flex flex-col gap-2.5 items-end pr-3">
        {/* Active Users */}
        <div 
          className="relative group"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          <div className="w-10 h-10 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center backdrop-blur-sm hover:scale-105 transition-transform duration-200 cursor-grab active:cursor-grabbing relative">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-700 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            
            {/* Count Badge */}
            <div className="absolute -top-1.5 -right-1.5 bg-green-500 text-white rounded-full min-w-[22px] h-5 flex items-center justify-center border border-white dark:border-gray-800 px-1">
              <span className="text-[9px] font-bold leading-tight">
                {formatNumber(activeUsers)}
              </span>
            </div>
            
            {/* Small label text (always inside the bubble) */}
            <span className="text-[8px] text-gray-600 dark:text-gray-400 font-medium mt-0.5 leading-tight truncate max-w-[36px]">
              Active
            </span>
          </div>
          
          {/* Desktop Tooltip */}
          {!isMobile && (
            <div className="absolute right-12 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-xs px-2 py-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-50 shadow-lg">
              <div className="font-semibold text-[11px]">Active</div>
              <div className="text-[10px] text-gray-400 mt-0.5">Drag to reposition</div>
            </div>
          )}

          
        </div>

        {/* Total Visits */}
        <div 
          className="relative group"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          <div className="w-10 h-10 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center backdrop-blur-sm hover:scale-105 transition-transform duration-200 cursor-grab active:cursor-grabbing relative">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-700 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5s8.268 2.943 9.542 7c-1.274 4.057-5.065 7-9.542 7S3.732 16.057 2.458 12z" />
            </svg>
            
            {/* Count Badge */}
            <div className="absolute -top-1.5 -right-1.5 bg-blue-500 text-white rounded-full min-w-[22px] h-5 flex items-center justify-center border border-white dark:border-gray-800 px-1">
              <span className="text-[9px] font-bold leading-tight">
                {formatNumber(totalVisits)}
              </span>
            </div>
            
            {/* Small label text (always inside the bubble) */}
            <span className="text-[8px] text-gray-600 dark:text-gray-400 font-medium mt-0.5 leading-tight truncate max-w-[36px]">
              Visits
            </span>
          </div>
          
          {/* Desktop Tooltip */}
          {!isMobile && (
            <div className="absolute right-12 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-xs px-2 py-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-50 shadow-lg">
              <div className="font-semibold text-[11px]">Visits</div>
              <div className="text-[10px] text-gray-400 mt-0.5">Drag to reposition</div>
            </div>
          )}

          
        </div>
      </div>
      
      {/* Drag handle indicator - smaller */}
      <div 
        className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1.5 h-14 bg-gradient-to-b from-gray-300/60 to-gray-300/30 dark:from-gray-600/60 dark:to-gray-600/30 rounded-l cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      />
    </div>
  );
}