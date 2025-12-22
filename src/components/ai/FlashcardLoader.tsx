import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FlashcardLoaderProps {
    isVisible: boolean;
    onComplete?: () => void;
    message?: string;
}

const FlashcardLoader: React.FC<FlashcardLoaderProps> = ({
    isVisible,
    onComplete,
    message = "Generating your guide..."
}) => {
    const [dots, setDots] = useState('');
    const gridSize = { cols: 4, rows: 3 };
    const tiles = Array.from({ length: gridSize.rows * gridSize.cols });

    // Animated dots for the loading message
    useEffect(() => {
        if (!isVisible) return;
        const interval = setInterval(() => {
            setDots(prev => prev.length >= 3 ? '' : prev + '.');
        }, 400);
        return () => clearInterval(interval);
    }, [isVisible]);

    // Check for reduced motion preference
    const prefersReducedMotion = typeof window !== 'undefined'
        && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.3 } }}
                    transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                    className="flex flex-col items-center justify-center p-8"
                >
                    {/* Tile Grid Container */}
                    <motion.div
                        className="relative bg-white/40 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/30"
                        style={{
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.3) 100%)',
                        }}
                    >
                        {/* Tile Grid */}
                        <div
                            className="grid gap-2"
                            style={{
                                gridTemplateColumns: `repeat(${gridSize.cols}, 1fr)`,
                            }}
                        >
                            {tiles.map((_, index) => {
                                const row = Math.floor(index / gridSize.cols);
                                const col = index % gridSize.cols;
                                const distance = row + col;

                                return (
                                    <motion.div
                                        key={index}
                                        className="w-10 h-10 rounded-xl"
                                        style={{
                                            background: 'linear-gradient(135deg, #818cf8 0%, #a78bfa 50%, #c4b5fd 100%)',
                                            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                                        }}
                                        initial={{ opacity: 0, scale: 0.2, rotate: -10 }}
                                        animate={prefersReducedMotion ? {
                                            opacity: 1,
                                            scale: 1,
                                            rotate: 0,
                                        } : {
                                            opacity: [0.6, 1, 0.6],
                                            scale: [0.85, 1, 0.85],
                                            rotate: 0,
                                            background: [
                                                'linear-gradient(135deg, #818cf8 0%, #a78bfa 50%, #c4b5fd 100%)',
                                                'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%)',
                                                'linear-gradient(135deg, #818cf8 0%, #a78bfa 50%, #c4b5fd 100%)',
                                            ],
                                        }}
                                        transition={prefersReducedMotion ? {
                                            duration: 0.3,
                                            delay: distance * 0.05,
                                        } : {
                                            opacity: {
                                                duration: 1.5,
                                                repeat: Infinity,
                                                delay: distance * 0.1,
                                                ease: 'easeInOut',
                                            },
                                            scale: {
                                                duration: 1.5,
                                                repeat: Infinity,
                                                delay: distance * 0.1,
                                                ease: 'easeInOut',
                                            },
                                            rotate: {
                                                duration: 0.4,
                                                delay: distance * 0.05,
                                            },
                                            background: {
                                                duration: 2,
                                                repeat: Infinity,
                                                delay: distance * 0.15,
                                                ease: 'easeInOut',
                                            },
                                        }}
                                    />
                                );
                            })}
                        </div>

                        {/* Loading Spinner Overlay */}
                        <motion.div
                            className="absolute inset-0 flex items-center justify-center"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                        >
                            <motion.div
                                className="w-12 h-12 rounded-full border-4 border-white/30 border-t-white"
                                animate={prefersReducedMotion ? {} : { rotate: 360 }}
                                transition={{
                                    duration: 1,
                                    repeat: Infinity,
                                    ease: 'linear',
                                }}
                            />
                        </motion.div>
                    </motion.div>

                    {/* Loading Text */}
                    <motion.div
                        className="mt-6 text-center"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <p className="text-lg font-medium bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            {message}{dots}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                            This will just take a moment
                        </p>
                    </motion.div>

                    {/* Decorative Elements */}
                    <motion.div
                        className="absolute -z-10 w-32 h-32 rounded-full bg-indigo-200/50 blur-3xl"
                        animate={prefersReducedMotion ? {} : {
                            scale: [1, 1.2, 1],
                            opacity: [0.3, 0.5, 0.3],
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                        style={{ top: '20%', left: '10%' }}
                    />
                    <motion.div
                        className="absolute -z-10 w-24 h-24 rounded-full bg-purple-200/50 blur-3xl"
                        animate={prefersReducedMotion ? {} : {
                            scale: [1.2, 1, 1.2],
                            opacity: [0.5, 0.3, 0.5],
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                        style={{ bottom: '20%', right: '10%' }}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default FlashcardLoader;
