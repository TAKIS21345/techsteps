// 3x3 Glowing Box Grid with Diverging Trail Effect for Hero Section
// Creates a 3x3 grid of glowing boxes that follows the mouse with trailing particles

import React, { useEffect, useRef, useState } from 'react';

interface GridPosition {
  x: number;
  y: number;
  opacity: number;
  brightness: number;
}

interface TrailParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  opacity: number;
  life: number;
  maxLife: number;
  id: number;
}

interface CursorTrailProps {
  className?: string;
}

export const CursorTrail: React.FC<CursorTrailProps> = ({ className = '' }) => {
  const [grid, setGrid] = useState<GridPosition[]>([]);
  const [trailParticles, setTrailParticles] = useState<TrailParticle[]>([]);
  const [isInHero, setIsInHero] = useState(false);
  const animationRef = useRef<number>();
  const mousePos = useRef({ x: 0, y: 0 });
  const prevMousePos = useRef({ x: 0, y: 0 });
  const gridRef = useRef<GridPosition[]>([]);
  const trailRef = useRef<TrailParticle[]>([]);
  const particleIdRef = useRef(0);

  useEffect(() => {
    // Initialize 3x3 grid (9 boxes total)
    const initialGrid: GridPosition[] = [];
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const distance = Math.sqrt((row - 1) ** 2 + (col - 1) ** 2); // Distance from center
        initialGrid.push({
          x: 0,
          y: 0,
          opacity: 0,
          brightness: Math.max(0.3, 1 - distance * 0.3) // Center is brightest
        });
      }
    }
    
    gridRef.current = initialGrid;
    setGrid(initialGrid);
    trailRef.current = [];
    setTrailParticles([]);

    const handleMouseMove = (e: Event) => {
      const mouseEvent = e as MouseEvent;
      prevMousePos.current = { ...mousePos.current };
      mousePos.current = { x: mouseEvent.clientX, y: mouseEvent.clientY };
    };

    const handleMouseEnter = () => setIsInHero(true);
    const handleMouseLeave = () => setIsInHero(false);

    // Add event listeners to the hero section specifically
    const heroSection = document.querySelector('[data-hero-section]');
    if (heroSection) {
      heroSection.addEventListener('mousemove', handleMouseMove);
      heroSection.addEventListener('mouseenter', handleMouseEnter);
      heroSection.addEventListener('mouseleave', handleMouseLeave);
    }

    // Animation loop with smooth physics
    const animate = () => {
      const newGrid = [...gridRef.current];
      const newTrail = [...trailRef.current];
      const spacing = 10;
      
      // Calculate mouse velocity for particle generation
      const mouseVelX = mousePos.current.x - prevMousePos.current.x;
      const mouseVelY = mousePos.current.y - prevMousePos.current.y;
      const mouseSpeed = Math.sqrt(mouseVelX * mouseVelX + mouseVelY * mouseVelY);
      
      // Update all boxes in the 3x3 grid
      for (let i = 0; i < 9; i++) {
        const row = Math.floor(i / 3);
        const col = i % 3;
        
        // Calculate target position for this box in the grid
        const offsetX = (col - 1) * spacing; // -spacing, 0, +spacing
        const offsetY = (row - 1) * spacing; // -spacing, 0, +spacing
        
        const targetX = mousePos.current.x + offsetX;
        const targetY = mousePos.current.y + offsetY;
        
        // Smooth movement towards target
        const current = newGrid[i];
        current.x += (targetX - current.x) * 0.15;
        current.y += (targetY - current.y) * 0.15;
        
        // Set opacity based on whether we're in hero section
        current.opacity = isInHero ? 0.8 : 0;
        
        // Generate trail particles when moving fast enough and in hero section
        if (isInHero && mouseSpeed > 2 && Math.random() < 0.3) {
          const particle: TrailParticle = {
            x: current.x,
            y: current.y,
            vx: (Math.random() - 0.5) * 2 - mouseVelX * 0.1, // Diverge opposite to movement
            vy: (Math.random() - 0.5) * 2 - mouseVelY * 0.1,
            opacity: current.brightness * 0.6,
            life: 60, // 60 frames = 1 second at 60fps
            maxLife: 60,
            id: particleIdRef.current++
          };
          newTrail.push(particle);
        }
      }
      
      // Update trail particles
      for (let i = newTrail.length - 1; i >= 0; i--) {
        const particle = newTrail[i];
        
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;
        
        // Apply friction
        particle.vx *= 0.98;
        particle.vy *= 0.98;
        
        // Update life and opacity
        particle.life--;
        particle.opacity = (particle.life / particle.maxLife) * 0.6;
        
        // Remove dead particles
        if (particle.life <= 0) {
          newTrail.splice(i, 1);
        }
      }
      
      // Limit trail particles to prevent memory issues
      if (newTrail.length > 100) {
        newTrail.splice(0, newTrail.length - 100);
      }

      gridRef.current = newGrid;
      trailRef.current = newTrail;
      setGrid([...newGrid]);
      setTrailParticles([...newTrail]);
      
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (heroSection) {
        heroSection.removeEventListener('mousemove', handleMouseMove);
        heroSection.removeEventListener('mouseenter', handleMouseEnter);
        heroSection.removeEventListener('mouseleave', handleMouseLeave);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isInHero]);

  return (
    <div className={`fixed inset-0 pointer-events-none z-10 ${className}`}>
      {/* Main 3x3 Grid */}
      {grid.map((box, index) => (
        <div
          key={`grid-${index}`}
          className="absolute transition-opacity duration-300"
          style={{
            left: box.x - 3,
            top: box.y - 3,
            width: 6,
            height: 6,
            backgroundColor: `rgba(93, 165, 253, ${box.opacity * box.brightness})`, // Lighter blue
            borderRadius: '1px',
            boxShadow: `
              0 0 ${box.brightness * 10}px rgba(93, 165, 253, ${box.opacity * 0.8}),
              0 0 ${box.brightness * 16}px rgba(93, 165, 253, ${box.opacity * 0.4}),
              0 0 ${box.brightness * 24}px rgba(93, 165, 253, ${box.opacity * 0.2})
            `,
            filter: `brightness(${1 + box.brightness * 0.3})`,
            opacity: box.opacity,
          }}
        />
      ))}
      
      {/* Trail Particles */}
      {trailParticles.map((particle) => (
        <div
          key={`particle-${particle.id}`}
          className="absolute"
          style={{
            left: particle.x - 2,
            top: particle.y - 2,
            width: 4,
            height: 4,
            backgroundColor: `rgba(93, 165, 253, ${particle.opacity})`,
            borderRadius: '1px',
            boxShadow: `0 0 ${particle.opacity * 6}px rgba(93, 165, 253, ${particle.opacity * 0.6})`,
            opacity: particle.opacity,
          }}
        />
      ))}
    </div>
  );
};

export default CursorTrail;