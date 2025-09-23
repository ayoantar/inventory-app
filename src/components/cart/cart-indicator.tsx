'use client'

import { useState } from 'react'
import { useCart } from '@/contexts/cart-context'
import CartSidebar from './cart-sidebar'

export default function CartIndicator() {
  const { getItemCount } = useCart()
  const [showSidebar, setShowSidebar] = useState(false)
  const itemCount = getItemCount()

  if (itemCount === 0) {
    return null
  }

  return (
    <>
      {/* Floating Cart Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setShowSidebar(true)}
          className="bg-brand-orange hover text-brand-primary-text rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-200 relative group"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6H19M7 13v0a2 2 0 002 2h8.5m-10.5-2v-2a2 2 0 012-2h8.5" 
            />
          </svg>
          
          {/* Item Count Badge */}
          <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
            {itemCount > 99 ? '99+' : itemCount}
          </div>
          
          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            {itemCount} item{itemCount !== 1 ? 's' : ''} in cart
            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </div>
        </button>
      </div>

      {/* Cart Sidebar */}
      <CartSidebar 
        isOpen={showSidebar} 
        onClose={() => setShowSidebar(false)} 
      />
    </>
  )
}