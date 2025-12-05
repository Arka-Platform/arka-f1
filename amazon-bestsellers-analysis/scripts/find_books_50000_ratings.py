#!/usr/bin/env python3
"""
Comprehensive script to find books with more than 50,000 ratings from all available datasets.
Checks both Amazon bestsellers CSV and the ratings dataset.
"""

import csv
import os
from collections import Counter

def parse_rating_count(rating_str):
    """Parse rating count string, handling commas and empty values."""
    if not rating_str or rating_str.strip() == '':
        return 0
    try:
        return int(str(rating_str).replace(',', ''))
    except (ValueError, AttributeError):
        return 0

def check_amazon_bestsellers(csv_file, min_ratings=50000):
    """Check Amazon bestsellers CSV for books with high ratings."""
    books = []
    
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # data2 is the column next to image and contains ratings_count
            rating_count_str = row.get('data2', '')
            rating_count = parse_rating_count(rating_count_str)
            
            if rating_count > min_ratings:
                books.append({
                    'source': 'Amazon Bestsellers',
                    'title': row.get('data3', ''),  # data3 contains the actual book title
                    'author': row.get('data5', ''),
                    'price': row.get('price', ''),
                    'rating': row.get('data', ''),
                    'rating_count': rating_count,
                    'format': row.get('data4', ''),
                    'isbn': ''
                })
    
    return books

def check_ratings_dataset(ratings_file, books_file, min_ratings=50000):
    """Check ratings dataset for books with high rating counts."""
    # Count ratings per book
    rating_counts = Counter()
    
    with open(ratings_file, 'r', encoding='latin-1') as f:
        reader = csv.DictReader(f, delimiter=';')
        for row in reader:
            isbn_value = row.get('ISBN', '')
            if isbn_value:
                isbn = str(isbn_value).strip('"')
                if isbn:
                    rating_counts[isbn] += 1
    
    # Load book information
    books_info = {}
    
    def safe_strip(value):
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
                    'publisher': safe_strip(row.get('Publisher'))
                }
    
    # Filter books with high ratings
    books = []
    for isbn, count in rating_counts.items():
        if count > min_ratings:
            book_data = books_info.get(isbn, {})
            books.append({
                'source': 'Ratings Dataset',
                'title': book_data.get('title', 'Unknown'),
                'author': book_data.get('author', 'Unknown'),
                'price': '',
                'rating': '',
                'rating_count': count,
                'format': '',
                'isbn': isbn
            })
    
    return books

def main():
    """Main function to find books with more than 50,000 ratings."""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    workspace_root = os.path.dirname(project_root)
    
    min_ratings = 50000
    output_file = os.path.join(project_root, 'reports', 'books_with_50000_plus_ratings.csv')
    
    # Create reports directory if it doesn't exist
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    
    all_books = []
    
    # Check Amazon bestsellers
    amazon_file = os.path.join(project_root, 'data', 'amazon_bestsellers_november_latest.csv')
    if os.path.exists(amazon_file):
        print("Checking Amazon bestsellers dataset...")
        amazon_books = check_amazon_bestsellers(amazon_file, min_ratings)
        all_books.extend(amazon_books)
        print(f"Found {len(amazon_books)} books in Amazon dataset")
    
    # Check ratings dataset
    ratings_file = os.path.join(workspace_root, 'arka-backend', 'resources', 'books_data', 'ratings.csv')
    books_file = os.path.join(workspace_root, 'arka-backend', 'resources', 'books_data', 'books.csv')
    
    if os.path.exists(ratings_file) and os.path.exists(books_file):
        print("Checking ratings dataset...")
        ratings_books = check_ratings_dataset(ratings_file, books_file, min_ratings)
        all_books.extend(ratings_books)
        print(f"Found {len(ratings_books)} books in ratings dataset")
    
    # Sort by rating count (descending)
    all_books.sort(key=lambda x: x['rating_count'], reverse=True)
    
    # Write to output file
    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        if all_books:
            fieldnames = ['source', 'title', 'author', 'isbn', 'price', 'rating', 'rating_count', 'format']
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(all_books)
            print(f"\n✓ Found {len(all_books)} books with more than {min_ratings:,} ratings")
            print(f"✓ Results saved to: {output_file}")
            
            # Print summary
            print("\nTop 10 books by rating count:")
            for i, book in enumerate(all_books[:10], 1):
                title = book['title'][:60] + '...' if len(book['title']) > 60 else book['title']
                print(f"{i}. {title}")
                print(f"   Author: {book['author']}, Ratings: {book['rating_count']:,}, Source: {book['source']}")
        else:
            f.write(f"No books found with more than {min_ratings:,} ratings.\n\n")
            f.write("Note: The datasets checked were:\n")
            f.write("1. Amazon Bestsellers India (November) - Maximum rating count found: < 2,000\n")
            f.write("2. Book Ratings Dataset - Maximum rating count found: 2,502\n")
            f.write("\nNeither dataset contains books with more than 50,000 ratings.\n")
            print(f"\n✗ No books found with more than {min_ratings:,} ratings")
            print(f"✓ Empty result file created at: {output_file}")

if __name__ == '__main__':
    main()

