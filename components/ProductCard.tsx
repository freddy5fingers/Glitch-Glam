
import React, { useState } from 'react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  isSelected: boolean;
  isComparisonSelected: boolean;
  isFavorite: boolean;
  isRecommended?: boolean;
  imageUrl?: string; // Resolved signed URL
  onClick: () => void;
  onToggleFavorite: (e: React.MouseEvent) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  isSelected, 
  isComparisonSelected,
  isFavorite, 
  isRecommended,
  imageUrl,
  onClick, 
  onToggleFavorite 
}) => {
  return (
    <div 
      onClick={onClick}
      className={`group cursor-pointer p-4 rounded-[2rem] border transition-all duration-500 flex items-center gap-4 relative overflow-hidden ${
        isSelected 
          ? 'bg-fuchsia-600 text-white border-fuchsia-600 shadow-xl shadow-fuchsia-500/20' 
          : isComparisonSelected
          ? 'bg-[#39FF14] text-black border-[#39FF14] shadow-xl shadow-[#39FF14]/20'
          : isRecommended
          ? 'bg-zinc-800 border-[#39FF14]/50 shadow-lg shadow-[#39FF14]/10'
          : 'bg-zinc-900/40 border-white/5 hover:border-[#39FF14]/50'
      }`}
    >
      {isRecommended && (
        <div className="absolute top-0 right-0 bg-[#39FF14] text-black text-[7px] font-bold px-2 py-1 rounded-bl-xl uppercase tracking-widest z-10 shadow-lg">
          AI Match
        </div>
      )}

      <div className="relative h-14 w-14 rounded-2xl overflow-hidden border border-white/10 flex-shrink-0 shadow-inner bg-black">
        {imageUrl ? (
            <img src={imageUrl} alt={product.name} className="w-full h-full object-cover" />
        ) : (
            <div className="w-full h-full" style={{ backgroundColor: product.hex }} />
        )}
        
        {!imageUrl && (product.finish === 'Shimmer' || product.finish === 'Glossy') && (
           <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-white/10" />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className={`text-[8px] font-bold uppercase tracking-widest mb-0.5 ${isSelected ? 'text-white/80' : isComparisonSelected ? 'text-black/70' : 'text-fuchsia-500'}`}>{product.brand}</p>
        <h4 className={`font-bold text-sm truncate leading-tight uppercase tracking-tight ${isComparisonSelected ? 'text-black' : 'text-white'}`}>{product.name}</h4>
        <p className={`text-[10px] ${isSelected ? 'text-white/60' : isComparisonSelected ? 'text-black/60' : 'text-zinc-500'}`}>{product.color} • {product.finish}</p>
      </div>

      <div className="flex flex-col items-center gap-2">
        <button 
          onClick={onToggleFavorite}
          className={`p-2 transition ${isFavorite ? 'text-fuchsia-400' : isComparisonSelected ? 'text-black/50 hover:text-black' : 'text-zinc-700 hover:text-fuchsia-400'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
        {(isSelected || isComparisonSelected) && (
          <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center text-[8px] font-bold text-black shadow-sm">
            {isSelected ? 'A' : 'B'}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
