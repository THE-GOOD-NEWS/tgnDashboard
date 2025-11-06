import React from 'react'

const ProductCardSkeleton = () => {
  return (
    <div className="relative product-card bg-creamey p-2 pt-4 border-everGreen border-2">
      {/* Fyonka badge skeleton */}
      <div className="absolute -top-5 -rotate-45 -left-5 z-20 w-[80px] h-[50px] bg-gray-200 animate-pulse" />
      
      {/* Image skeleton */}
      <div className="relative aspect-square overflow-hidden bg-gray-200 animate-pulse" />
      
      {/* Title skeleton */}
      <div className="mt-2 h-6 bg-gray-200 animate-pulse rounded" />
      
      {/* Price and button skeleton */}
      <div className="flex items-center justify-between mt-2">
        <div className="w-20 h-6 bg-gray-200 animate-pulse rounded" />
        <div className="w-20 h-8 bg-gray-200 animate-pulse rounded-full" />
      </div>
    </div>
  )
}

export default ProductCardSkeleton