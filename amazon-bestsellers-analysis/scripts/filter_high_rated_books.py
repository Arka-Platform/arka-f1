#!/usr/bin/env python3
"""
Script to filter books with more than 50,000 ratings from the Amazon bestsellers dataset.
"""

import csv
import os

def parse_rating_count(rating_str):
    """Parse rating count string, handling commas and empty values."""
    if not rating_str or rating_str.strip() == '':
        return 0
    # Remove commas and convert to int
    try:
        return int(rating_str.replace(',', ''))
    except ValueError:
        return 0

def filter_books_by_ratings(input_file, output_file, min_ratings=50000):
    """Filter books with more than min_ratings and save to output file."""
    
    books_with_high_ratings = []
    
    # Read the CSV file
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        
        for row in reader:
            # Get rating count from data2 column (next to image)
            rating_count_str = row.get('data2', '')
            rating_count = parse_rating_count(rating_count_str)
            
            if rating_count > min_ratings:
                books_with_high_ratings.append({
                    'title': row.get('title', ''),
                    'author': row.get('data5', ''),
                    'price': row.get('price', ''),
                    'rating': row.get('data', ''),
                    'rating_count': rating_count,
                    'format': row.get('data4', ''),
                    'image': row.get('image', '')
                })
    
    # Sort by rating count (descending)
    books_with_high_ratings.sort(key=lambda x: x['rating_count'], reverse=True)
    
    # Write to output file
    with open(output_file, 'w', encoding='utf-8') as f:
        if books_with_high_ratings:
            writer = csv.DictWriter(f, fieldnames=['title', 'author', 'price', 'rating', 'rating_count', 'format', 'image'])
            writer.writeheader()
            writer.writerows(books_with_high_ratings)
            print(f"Found {len(books_with_high_ratings)} books with more than {min_ratings:,} ratings")
            print(f"Results saved to: {output_file}")
        else:
            f.write(f"No books found with more than {min_ratings:,} ratings.\n")
            print(f"No books found with more than {min_ratings:,} ratings")
    
    return books_with_high_ratings

if __name__ == '__main__':
    # Set up file paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    data_file = os.path.join(project_root, 'data', 'november_bestsellers_amazon_india.csv')
    output_file = os.path.join(project_root, 'reports', 'books_with_50000_plus_ratings.csv')
    
    # Create reports directory if it doesn't exist
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    
    # Filter books
    books = filter_books_by_ratings(data_file, output_file, min_ratings=50000)
    
    # Print summary
    if books:
        print("\nTop 10 books by rating count:")
        for i, book in enumerate(books[:10], 1):
            print(f"{i}. {book['title'][:60]}... - {book['rating_count']:,} ratings")

