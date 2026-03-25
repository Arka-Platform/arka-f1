'use client'

import React, { useId, useState, useEffect, useRef } from 'react'
import { booksApi, BookResponse } from '../../../utils/api'
import styles from './BookSearchInput.module.css'

interface BookSearchInputProps {
  value: string
  onChange: (value: string) => void
  onBookSelect?: (book: BookResponse) => void
  placeholder?: string
  label?: string
  required?: boolean
  fullWidth?: boolean
}

const BookSearchInput: React.FC<BookSearchInputProps> = ({
  value,
  onChange,
  onBookSelect,
  placeholder = "Search for a book...",
  label,
  required = false,
  fullWidth = false
}) => {
  const reactId = useId()
  const inputId = `book-search-${reactId}`
  const listboxId = `book-search-listbox-${reactId}`
  const [suggestions, setSuggestions] = useState<BookResponse[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    if (value.trim().length >= 2) {
      // Debounce search
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }

      searchTimeoutRef.current = setTimeout(async () => {
        await searchBooks(value.trim())
      }, 300)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [value])

  const searchBooks = async (query: string) => {
    try {
      setLoading(true)
      const results = await booksApi.search(query)
      setSuggestions(results.slice(0, 8)) // Limit to 8 suggestions
      setShowSuggestions(results.length > 0)
      setSelectedIndex(-1)
    } catch (error) {
      console.error('Failed to search books:', error)
      setSuggestions([])
      setShowSuggestions(false)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectBook = (book: BookResponse) => {
    onChange(book.title)
    setShowSuggestions(false)
    setSelectedIndex(-1)
    if (onBookSelect) {
      onBookSelect(book)
    }
    inputRef.current?.blur()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelectBook(suggestions[selectedIndex])
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setSelectedIndex(-1)
        break
    }
  }

  const handleFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true)
    }
  }

  const handleBlur = () => {
    // Delay to allow click on suggestion
    setTimeout(() => {
      setShowSuggestions(false)
      setSelectedIndex(-1)
    }, 200)
  }

  return (
    <div className={`${styles.bookSearchContainer} ${fullWidth ? styles.fullWidth : ''}`}>
      {label && (
        <label className={styles.label} htmlFor={inputId}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}
      <div className={styles.inputWrapper}>
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={styles.input}
          required={required}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showSuggestions && suggestions.length > 0}
          aria-controls={listboxId}
          aria-activedescendant={
            selectedIndex >= 0 && selectedIndex < suggestions.length
              ? `${listboxId}-option-${suggestions[selectedIndex].id}`
              : undefined
          }
        />
        {loading && (
          <div className={styles.loadingSpinner}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          </div>
        )}
        {!loading && value && (
          <button
            type="button"
            className={styles.clearButton}
            aria-label="Clear search"
            onClick={() => {
              onChange('')
              setSuggestions([])
              setShowSuggestions(false)
              inputRef.current?.focus()
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className={styles.suggestionsDropdown}
          id={listboxId}
          role="listbox"
          aria-label="Search suggestions"
        >
          {suggestions.map((book, index) => (
            <button
              key={book.id}
              id={`${listboxId}-option-${book.id}`}
              type="button"
              className={`${styles.suggestionItem} ${index === selectedIndex ? styles.selected : ''}`}
              onClick={() => handleSelectBook(book)}
              onMouseEnter={() => setSelectedIndex(index)}
              role="option"
              aria-selected={index === selectedIndex}
            >
              <div className={styles.suggestionContent}>
                {book.imageUrl && (
                  <img
                    src={book.imageUrl}
                    alt={book.title}
                    className={styles.suggestionImage}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                )}
                <div className={styles.suggestionText}>
                  <div className={styles.suggestionTitle}>{book.title}</div>
                  <div className={styles.suggestionAuthor}>by {book.author}</div>
                  {(book.genre || book.subcategory || book.category) && (
                    <div className={styles.suggestionMeta}>
                      {book.genre && book.genre}
                      {book.subcategory && ` • ${book.subcategory}`}
                      {book.category && !book.subcategory && ` • ${book.category}`}
                    </div>
                  )}
                </div>
              </div>
              {book.isbn && (
                <div className={styles.suggestionIsbn}>ISBN: {book.isbn}</div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default BookSearchInput

