import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Book } from '../components/shared/BookCard/BookCard'
import { useContribution } from './ContributionContext'
import { trackCartAdd, trackCartRemove } from '../utils/tracking'

interface CartItem extends Book {
  quantity: number
}

interface CartContextType {
  items: CartItem[]
  addToCart: (book: Book) => void
  removeFromCart: (bookId: string) => void
  updateQuantity: (bookId: string, quantity: number) => void
  clearCart: () => void
  getTotalPrice: () => number
  getItemCount: () => number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

interface CartProviderProps {
  children: ReactNode
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const { hydrated, mayClaimAdditionalBook, openContributionGate, afterSuccessfulNewLineAdd } = useContribution()
  const [items, setItems] = useState<CartItem[]>([])

  // Load cart from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return
    const storedCart = localStorage.getItem('arka_cart')
    if (storedCart) {
      try {
        setItems(JSON.parse(storedCart))
      } catch (error) {
        console.error('Error parsing stored cart:', error)
        localStorage.removeItem('arka_cart')
      }
    }
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (typeof window === 'undefined') return
    localStorage.setItem('arka_cart', JSON.stringify(items))
  }, [items])

  const addToCart = (book: Book) => {
    const isNewLine = !items.some((item) => item.id === book.id)
    if (hydrated && isNewLine && !mayClaimAdditionalBook()) {
      openContributionGate(book)
      return
    }

    trackCartAdd(book.id)
    setItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === book.id)

      if (existingItem) {
        return prevItems.map((item) =>
          item.id === book.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      }
      return [...prevItems, { ...book, quantity: 1 }]
    })

    if (hydrated && isNewLine) {
      afterSuccessfulNewLineAdd()
    }
  }

  const removeFromCart = (bookId: string) => {
    trackCartRemove(bookId)
    setItems((prevItems) => prevItems.filter((item) => item.id !== bookId))
  }

  const updateQuantity = (bookId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(bookId)
      return
    }
    
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === bookId ? { ...item, quantity } : item
      )
    )
  }

  const clearCart = () => {
    setItems([])
  }

  const getTotalPrice = (): number => {
    return items.reduce((total, item) => {
      const price = typeof item.price === 'number' ? item.price : 
                   typeof item.price === 'string' ? parseFloat(item.price.replace('₹', '').replace('$', '')) : 0
      return total + price * item.quantity
    }, 0)
  }

  const getItemCount = (): number => {
    return items.reduce((count, item) => count + item.quantity, 0)
  }

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalPrice,
        getItemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

