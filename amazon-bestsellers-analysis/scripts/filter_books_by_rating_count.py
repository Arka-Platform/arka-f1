#!/usr/bin/env python3
"""
Script to find books with more than 50,000 ratings from the ratings dataset.
Counts ratings per book and merges with book information.
"""

import csv
import os
from collections import Counter

def count_ratings_per_book(ratings_file):
    """Count the number of ratings per book (ISBN)."""
    rating_counts = Counter()
    
    with open(ratings_file, 'r', encoding='latin-1') as f:
        reader = csv.DictReader(f, delimiter=';')
        for row in reader:
            isbn_value = row.get('ISBN', '')
            if isbn_value:
                isbn = str(isbn_value).strip('"')
                if isbn:
                    rating_counts[isbn] += 1
    
    return rating_counts

def load_books_info(books_file):
    """Load book information from books.csv."""
    books_info = {}
    
    def safe_strip(value):
        """Safely strip quotes from a value, handling None."""
        if value is None:
            return ''
        return str(value).strip('"')
    
    with open(books_file, 'r', encoding='latin-1') as f:
        reader = csv.DictReader(f, delimiter=';')
        for row in reader:
            isbn = safe_strip(row.get('ISBN'))
            if isbn:
                books_info[isbn] = {
                    'title': safe_strip(row.get('Book-Title')),
                    'author': safe_strip(row.get('Book-Author')),
                    'year': safe_strip(row.get('Year-Of-Publication')),
                    'publisher': safe_strip(row.get('Publisher')),
                    'image_url': safe_strip(row.get('Image-URL-L'))
                }
    
    return books_info

def filter_high_rated_books(ratings_file, books_file, output_file, min_ratings=50000):
    """Find books with more than min_ratings and save to output file."""
    
    print("Counting ratings per book...")
    rating_counts = count_ratings_per_book(ratings_file)
    
    print("Loading book information...")
    books_info = load_books_info(books_file)
    
    # Filter books with more than min_ratings
    high_rated_books = []
    
    for isbn, count in rating_counts.items():
        if count > min_ratings:
            book_data = books_info.get(isbn, {})
            high_rated_books.append({
                'ISBN': isbn,
                'Title': book_data.get('title', 'Unknown'),
                'Author': book_data.get('author', 'Unknown'),
                'Year': book_data.get('year', 'Unknown'),
                'Publisher': book_data.get('publisher', 'Unknown'),
                'Rating_Count': count,
                'Image_URL': book_data.get('image_url', '')
            })
    
    # Sort by rating count (descending)
    high_rated_books.sort(key=lambda x: x['Rating_Count'], reverse=True)
    
    # Write to output file
    if high_rated_books:
        with open(output_file, 'w', encoding='utf-8', newline='') as f:
            fieldnames = ['ISBN', 'Title', 'Author', 'Year', 'Publisher', 'Rating_Count', 'Image_URL']
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(high_rated_books)
        
        print(f"\nFound {len(high_rated_books)} books with more than {min_ratings:,} ratings")
        print(f"Results saved to: {output_file}")
        
        # Print top 10
        print("\nTop 10 books by rating count:")
        for i, book in enumerate(high_rated_books[:10], 1):
            title = book['Title'][:60] + '...' if len(book['Title']) > 60 else book['Title']
            print(f"{i}. {title}")
            print(f"   Author: {book['Author']}, Ratings: {book['Rating_Count']:,}")
    else:
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(f"No books found with more than {min_ratings:,} ratings.\n")
        print(f"No books found with more than {min_ratings:,} ratings")
    
    return high_rated_books

if __name__ == '__main__':
    # Set up file paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    workspace_root = os.path.dirname(project_root)
    
    ratings_file = os.path.join(workspace_root, 'arka-backend', 'resources', 'books_data', 'ratings.csv')
    books_file = os.path.join(workspace_root, 'arka-backend', 'resources', 'books_data', 'books.csv')
    output_file = os.path.join(project_root, 'reports', 'books_with_50000_plus_ratings.csv')
    
    # Create reports directory if it doesn't exist
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    
    # Check if files exist
    if not os.path.exists(ratings_file):
        print(f"Error: Ratings file not found at {ratings_file}")
        exit(1)
    
    if not os.path.exists(books_file):
        print(f"Error: Books file not found at {books_file}")
        exit(1)
    
    # Filter books
    books = filter_high_rated_books(ratings_file, books_file, output_file, min_ratings=50000)

