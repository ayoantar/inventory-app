'use client'

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Asset } from '../../generated/prisma'

export interface CartItem {
  assetId: string
  asset: Asset & {
    createdBy: { name: string | null; email: string | null }
    lastModifiedBy: { name: string | null; email: string | null }
    _count: { transactions: number }
  }
  action: 'CHECK_IN' | 'CHECK_OUT'
  notes?: string
  expectedReturnDate?: string
  assignedUserId?: string
  assignedUserName?: string
  addedAt: string
}

interface CartState {
  items: CartItem[]
  isProcessing: boolean
  lastProcessedAt?: string
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: Omit<CartItem, 'addedAt'> }
  | { type: 'REMOVE_ITEM'; payload: { assetId: string } }
  | { type: 'UPDATE_ITEM'; payload: { assetId: string; updates: Partial<CartItem> } }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_PROCESSING'; payload: { isProcessing: boolean } }
  | { type: 'LOAD_FROM_STORAGE'; payload: CartState }

interface CartContextType {
  state: CartState
  addItem: (asset: CartItem['asset'], action: 'CHECK_IN' | 'CHECK_OUT') => boolean
  removeItem: (assetId: string) => void
  updateItem: (assetId: string, updates: Partial<CartItem>) => void
  clearCart: () => void
  processCart: () => Promise<{ success: boolean; errors: string[] }>
  getItemCount: () => number
  hasItem: (assetId: string) => boolean
  getCheckInItems: () => CartItem[]
  getCheckOutItems: () => CartItem[]
  canAddItem: (asset: CartItem['asset'], action: 'CHECK_IN' | 'CHECK_OUT') => { canAdd: boolean; reason?: string }
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const CART_STORAGE_KEY = 'asset-cart'

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM':
      // Check if item already exists
      const existingIndex = state.items.findIndex(item => item.assetId === action.payload.assetId)
      if (existingIndex >= 0) {
        // Update existing item
        const updatedItems = [...state.items]
        updatedItems[existingIndex] = {
          ...action.payload,
          addedAt: new Date().toISOString()
        }
        return { ...state, items: updatedItems }
      }
      // Add new item
      return {
        ...state,
        items: [...state.items, { ...action.payload, addedAt: new Date().toISOString() }]
      }

    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(item => item.assetId !== action.payload.assetId)
      }

    case 'UPDATE_ITEM':
      return {
        ...state,
        items: state.items.map(item =>
          item.assetId === action.payload.assetId
            ? { ...item, ...action.payload.updates }
            : item
        )
      }

    case 'CLEAR_CART':
      return {
        ...state,
        items: [],
        lastProcessedAt: new Date().toISOString()
      }

    case 'SET_PROCESSING':
      return {
        ...state,
        isProcessing: action.payload.isProcessing
      }

    case 'LOAD_FROM_STORAGE':
      return action.payload

    default:
      return state
  }
}

const initialState: CartState = {
  items: [],
  isProcessing: false
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState)
  const { data: session } = useSession()

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        // Validate the structure and remove expired items (older than 24 hours)
        const validItems = parsed.items?.filter((item: CartItem) => {
          const addedAt = new Date(item.addedAt)
          const now = new Date()
          const hoursDiff = (now.getTime() - addedAt.getTime()) / (1000 * 60 * 60)
          return hoursDiff < 24
        }) || []

        dispatch({
          type: 'LOAD_FROM_STORAGE',
          payload: {
            ...parsed,
            items: validItems,
            isProcessing: false // Reset processing state on load
          }
        })
      }
    } catch (error) {
      console.error('Failed to load cart from storage:', error)
    }
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state))
    } catch (error) {
      console.error('Failed to save cart to storage:', error)
    }
  }, [state])

  const canAddItem = useCallback((asset: CartItem['asset'], action: 'CHECK_IN' | 'CHECK_OUT'): { canAdd: boolean; reason?: string } => {
    // Check if item is already in cart
    const existingItem = state.items.find(item => item.assetId === asset.id)
    if (existingItem && existingItem.action === action) {
      return { canAdd: false, reason: `Asset is already in cart for ${action.toLowerCase().replace('_', ' ')}` }
    }

    // Validate business logic
    if (action === 'CHECK_OUT') {
      if (asset.status !== 'AVAILABLE') {
        return { canAdd: false, reason: `Asset is ${asset.status.toLowerCase().replace('_', ' ')} and cannot be checked out` }
      }
    } else if (action === 'CHECK_IN') {
      if (asset.status !== 'CHECKED_OUT') {
        return { canAdd: false, reason: `Asset is ${asset.status.toLowerCase().replace('_', ' ')} and cannot be checked in` }
      }
    }

    return { canAdd: true }
  }, [state.items])

  const addItem = useCallback((asset: CartItem['asset'], action: 'CHECK_IN' | 'CHECK_OUT'): boolean => {
    const validation = canAddItem(asset, action)
    if (!validation.canAdd) {
      console.warn('Cannot add item to cart:', validation.reason)
      return false
    }

    // Automatically assign to current user for check-outs
    const itemPayload: Omit<CartItem, 'addedAt'> = {
      assetId: asset.id,
      asset,
      action
    }

    if (action === 'CHECK_OUT' && session?.user) {
      itemPayload.assignedUserId = session.user.id
      itemPayload.assignedUserName = session.user.name || session.user.email || 'Current User'
    }

    dispatch({
      type: 'ADD_ITEM',
      payload: itemPayload
    })
    return true
  }, [canAddItem, session])

  const removeItem = useCallback((assetId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { assetId } })
  }, [])

  const updateItem = useCallback((assetId: string, updates: Partial<CartItem>) => {
    dispatch({ type: 'UPDATE_ITEM', payload: { assetId, updates } })
  }, [])

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR_CART' })
  }, [])

  const processCart = useCallback(async (): Promise<{ success: boolean; errors: string[] }> => {
    if (state.items.length === 0) {
      return { success: false, errors: ['Cart is empty'] }
    }

    dispatch({ type: 'SET_PROCESSING', payload: { isProcessing: true } })

    try {
      // Group items by action type for batch processing
      const checkInItems = state.items.filter(item => item.action === 'CHECK_IN')
      const checkOutItems = state.items.filter(item => item.action === 'CHECK_OUT')

      const errors: string[] = []
      let processedCount = 0

      // Process check-ins
      if (checkInItems.length > 0) {
        try {
          const response = await fetch('/api/transactions/bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'CHECK_IN',
              items: checkInItems.map(item => ({
                assetId: item.assetId,
                notes: item.notes
              }))
            })
          })

          if (response.ok) {
            const result = await response.json()
            processedCount += result.processed || 0
            if (result.errors?.length > 0) {
              errors.push(...result.errors)
            }
          } else {
            const errorData = await response.json()
            errors.push(`Check-in failed: ${errorData.error}`)
          }
        } catch (error) {
          errors.push(`Check-in error: ${error.message}`)
        }
      }

      // Process check-outs
      if (checkOutItems.length > 0) {
        try {
          const response = await fetch('/api/transactions/bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'CHECK_OUT',
              items: checkOutItems.map(item => ({
                assetId: item.assetId,
                notes: item.notes,
                expectedReturnDate: item.expectedReturnDate,
                assignedUserId: item.assignedUserId
              }))
            })
          })

          if (response.ok) {
            const result = await response.json()
            processedCount += result.processed || 0
            if (result.errors?.length > 0) {
              errors.push(...result.errors)
            }
          } else {
            const errorData = await response.json()
            errors.push(`Check-out failed: ${errorData.error}`)
          }
        } catch (error) {
          errors.push(`Check-out error: ${error.message}`)
        }
      }

      const success = processedCount > 0
      if (success && errors.length === 0) {
        // Clear cart only if all operations were successful
        clearCart()
      }

      return { success, errors }
    } catch (error) {
      console.error('Cart processing error:', error)
      return { success: false, errors: ['Failed to process cart'] }
    } finally {
      dispatch({ type: 'SET_PROCESSING', payload: { isProcessing: false } })
    }
  }, [state.items, clearCart])

  const getItemCount = useCallback(() => state.items.length, [state.items])

  const hasItem = useCallback((assetId: string) => {
    return state.items.some(item => item.assetId === assetId)
  }, [state.items])

  const getCheckInItems = useCallback(() => {
    return state.items.filter(item => item.action === 'CHECK_IN')
  }, [state.items])

  const getCheckOutItems = useCallback(() => {
    return state.items.filter(item => item.action === 'CHECK_OUT')
  }, [state.items])

  return (
    <CartContext.Provider
      value={{
        state,
        addItem,
        removeItem,
        updateItem,
        clearCart,
        processCart,
        getItemCount,
        hasItem,
        getCheckInItems,
        getCheckOutItems,
        canAddItem
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}