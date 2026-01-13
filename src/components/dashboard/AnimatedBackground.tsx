import React, { useMemo } from 'react';

const AnimatedBackground: React.FC = () => {
  // Generate stars with useMemo to prevent re-renders
  const stars = useMemo(() => 
    [...Array(100)].map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 2 + 0.5,
      opacity: 0.3 + Math.random() * 0.7,
      duration: `${2 + Math.random() * 4}s`,
      delay: `${-Math.random() * 4}s`,
    })), []
  );

  // Generate floating particles
  const particles = useMemo(() => 
    [...Array(50)].map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 3 + 1,
      duration: `${15 + Math.random() * 25}s`,
      delay: `${-Math.random() * 20}s`,
      color: Math.random() > 0.5 ? 'primary' : Math.random() > 0.5 ? 'nova-cyan' : 'nova-purple',
    })), []
  );

  // Generate shooting stars - one per minute
  const shootingStars = useMemo(() => 
    [...Array(2)].map((_, i) => ({
      id: i,
      delay: `${i * 60}s`, // 60 seconds between each
      startX: 10 + Math.random() * 30,
      startY: 5 + Math.random() * 25,
    })), []
  );

  // Generate nebula clouds
  const nebulaClouds = useMemo(() => 
    [...Array(6)].map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: 300 + Math.random() * 400,
      opacity: 0.03 + Math.random() * 0.05,
      duration: `${30 + Math.random() * 20}s`,
      delay: `${-Math.random() * 30}s`,
      color: ['primary', 'nova-purple', 'nova-cyan', 'nova-pink', 'accent'][Math.floor(Math.random() * 5)],
    })), []
  );

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Deep space gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-background" />
      
      {/* Nebula clouds */}
      {nebulaClouds.map((cloud) => (
        <div
          key={`nebula-${cloud.id}`}
          className={`absolute rounded-full blur-3xl animate-float bg-${cloud.color}/10`}
          style={{
            left: cloud.left,
            top: cloud.top,
            width: cloud.size,
            height: cloud.size,
            opacity: cloud.opacity,
            animationDuration: cloud.duration,
            animationDelay: cloud.delay,
          }}
        />
      ))}

      {/* Main gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-gradient-to-r from-nova-purple/15 to-nova-cyan/10 rounded-full blur-3xl animate-float" style={{ animationDuration: '20s' }} />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-gradient-to-r from-nova-pink/10 to-nova-gold/10 rounded-full blur-3xl animate-float" style={{ animationDuration: '25s', animationDelay: '-8s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-primary/8 to-accent/5 rounded-full blur-3xl animate-pulse-glow" style={{ animationDuration: '15s' }} />
      <div className="absolute top-10 right-1/3 w-[400px] h-[400px] bg-gradient-to-r from-nova-cyan/10 to-primary/10 rounded-full blur-3xl animate-float" style={{ animationDuration: '18s', animationDelay: '-4s' }} />

      {/* Stars layer */}
      <div className="absolute inset-0">
        {stars.map((star) => (
          <div
            key={`star-${star.id}`}
            className="absolute rounded-full bg-white animate-pulse"
            style={{
              left: star.left,
              top: star.top,
              width: star.size,
              height: star.size,
              opacity: star.opacity,
              animationDuration: star.duration,
              animationDelay: star.delay,
              boxShadow: star.size > 1.5 ? `0 0 ${star.size * 2}px rgba(255,255,255,0.5)` : 'none',
            }}
          />
        ))}
      </div>

      {/* Colored star clusters */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={`colored-star-${i}`}
            className="absolute rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: 2 + Math.random() * 2,
              height: 2 + Math.random() * 2,
              background: `hsl(var(--${['primary', 'nova-cyan', 'nova-purple', 'nova-pink'][Math.floor(Math.random() * 4)]}))`,
              opacity: 0.4 + Math.random() * 0.4,
              animationDuration: `${2 + Math.random() * 3}s`,
              animationDelay: `${-Math.random() * 3}s`,
              boxShadow: `0 0 8px currentColor`,
            }}
          />
        ))}
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0">
        {particles.map((particle) => (
          <div
            key={`particle-${particle.id}`}
            className="absolute rounded-full animate-float"
            style={{
              left: particle.left,
              top: particle.top,
              width: particle.size,
              height: particle.size,
              background: `hsl(var(--${particle.color}) / 0.4)`,
              animationDuration: particle.duration,
              animationDelay: particle.delay,
              boxShadow: `0 0 ${particle.size * 3}px hsl(var(--${particle.color}) / 0.3)`,
            }}
          />
        ))}
      </div>

      {/* Shooting stars - diagonal falling */}
      {shootingStars.map((star) => (
        <div
          key={`shooting-${star.id}`}
          className="absolute opacity-0"
          style={{
            top: `${star.startY}%`,
            left: `${star.startX}%`,
            width: '120px',
            height: '2px',
            background: 'linear-gradient(to left, white, hsl(var(--primary) / 0.8), transparent)',
            transform: 'rotate(45deg)',
            transformOrigin: 'right center',
            animation: `shooting-star-diagonal 1.5s ease-out ${star.delay} infinite`,
            boxShadow: '0 0 6px 2px hsl(var(--primary) / 0.5)',
          }}
        />
      ))}

      {/* Constellation lines (subtle) */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="constellationGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--nova-cyan))" />
          </linearGradient>
        </defs>
        <path
          d="M100,100 L200,150 L250,80 L400,200 M300,300 L450,250 L500,350"
          stroke="url(#constellationGradient)"
          strokeWidth="1"
          fill="none"
        />
        <path
          d="M600,150 L750,100 L850,180 M700,400 L800,350 L900,420"
          stroke="url(#constellationGradient)"
          strokeWidth="1"
          fill="none"
        />
      </svg>

      {/* Road/Path visual in background */}
      <svg className="absolute bottom-0 left-0 right-0 h-64 opacity-5" preserveAspectRatio="none" viewBox="0 0 1440 320">
        <defs>
          <linearGradient id="roadGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="50%" stopColor="hsl(var(--accent))" />
            <stop offset="100%" stopColor="hsl(var(--primary))" />
          </linearGradient>
        </defs>
        <path
          fill="url(#roadGradient)"
          d="M0,160L48,170.7C96,181,192,203,288,197.3C384,192,480,160,576,165.3C672,171,768,213,864,218.7C960,224,1056,192,1152,181.3C1248,171,1344,181,1392,186.7L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
        />
      </svg>

      {/* Subtle grid overlay */}
      <div 
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: 'linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Vignette effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-background/50 via-transparent to-background/50" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-transparent to-background/50" />
    </div>
  );
};

export default AnimatedBackground;
