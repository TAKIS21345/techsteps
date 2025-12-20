import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const TileWaveLoader: React.FC = () => {
    const [columns, setColumns] = useState(0);
    const [rows, setRows] = useState(0);

    useEffect(() => {
        const calculateGrid = () => {
            const tileSize = 64; // Approx tile size in px
            const cols = Math.ceil(window.innerWidth / tileSize);
            const rows = Math.ceil(window.innerHeight / tileSize);
            setColumns(cols);
            setRows(rows);
        };

        calculateGrid();
        window.addEventListener('resize', calculateGrid);
        return () => window.removeEventListener('resize', calculateGrid);
    }, []);

    if (columns === 0) return null;

    // Create grid array
    const tiles = Array.from({ length: rows * columns }).map((_, i) => {
        const row = Math.floor(i / columns);
        const col = i % columns;
        return { id: i, row, col };
    });

    return (
        <div className="fixed inset-0 z-50 flex flex-wrap bg-gray-50 overflow-hidden">
            {tiles.map((tile) => (
                <Tile
                    key={tile.id}
                    row={tile.row}
                    col={tile.col}
                    totalRows={rows}
                    totalCols={columns}
                />
            ))}

            {/* Centered Logo/Text Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1, duration: 0.8 }}
                    className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-xl flex flex-col items-center"
                >
                    <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
                    <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                        TechSteps
                    </h2>
                </motion.div>
            </div>
        </div>
    );
};

const Tile: React.FC<{ row: number; col: number; totalRows: number; totalCols: number }> = ({ row, col, totalRows, totalCols }) => {
    // Distance from top-left (0,0) logic for stagger
    const distance = row + col;
    const maxDistance = totalRows + totalCols;
    const normalizedDistance = distance / maxDistance;

    // Animation variants
    const variants = {
        hidden: {
            opacity: 0,
            scale: 0.2,
            // backgroundColor: '#f3f4f6' // gray-100
        },
        visible: {
            opacity: 1,
            scale: 1,
            // backgroundColor: '#e0e7ff', // indigo-100
            transition: {
                duration: 0.5,
                delay: distance * 0.05, // Stagger placement
                ease: "easeOut"
            }
        },
        wave: {
            scale: [1, 0.9, 1],
            backgroundColor: ['#e0e7ff', '#c7d2fe', '#e0e7ff'], // Pulse color
            transition: {
                duration: 2,
                repeat: Infinity,
                delay: distance * 0.1, // Wave flow delay
                ease: "easeInOut"
            }
        }
    };

    return (
        <motion.div
            className="w-16 h-16 border border-white/20" // Fixed size based on calc above (64px = 16rem/4 = 4rem = w-16)
            style={{
                width: '64px', // Force exact px to match calculation or use w-full logic in grid
                height: '64px',
                backgroundColor: '#e0e7ff'
            }}
            initial="hidden"
            animate={["visible", "wave"]}
            variants={variants}
        />
    );
};

export default TileWaveLoader;
