import React from 'react';

const GameUI = ({ score, health, level }) => {
  return (
    <div className="flex items-center space-x-8 text-white">
      <div className="flex items-center space-x-2">
        <span className="font-bold text-xl">Score:</span>
        <span className="text-xl">{score}</span>
      </div>
      <div className="flex items-center space-x-2">
        <span className="font-bold text-xl">Level:</span>
        <span className="text-xl">{level}</span>
      </div>
      <div className="flex items-center space-x-2">
        <span className="font-bold text-xl">Health:</span>
        <div className="w-32 h-6 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-red-500 transition-all duration-300"
            style={{ width: `${health}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default GameUI; 