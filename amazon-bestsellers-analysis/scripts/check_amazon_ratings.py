#!/usr/bin/env python3
"""
Check maximum rating counts in Amazon bestsellers dataset.
"""

import csv
import os

def check_amazon_ratings(csv_file):
    """Check rating counts in Amazon dataset."""
    max_rating = 0
    max_book = None
    all_ratings = []
    books_with_ratings = []
    
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # data2 is the column next to image and contains ratings_count
            rating_str = row.get('data2', '').strip()
            if rating_str:
                # Try to parse the rating count
                try:
                    rating_count = int(rating_str.replace(',', ''))
                    all_ratings.append(rating_count)
                    books_with_ratings.append({
                        'title': row.get('title', ''),
                        'rating_count': rating_count,
                        'author': row.get('data5', ''),
                        'price': row.get('price', '')
                    })
                    if rating_count > max_rating:
                        max_rating = rating_count
                        max_book = row
                except ValueError:
                    # Skip non-numeric values
                    pass
    
    if all_ratings:
        print(f"Statistics:")
        print(f"Total books with ratings: {len(all_ratings)}")
        print(f"Maximum rating count: {max_rating:,}")
        print(f"Average rating count: {sum(all_ratings) / len(all_ratings):.2f}")
        
        # Show top 10
        books_with_ratings.sort(key=lambda x: x['rating_count'], reverse=True)
        print(f"\nTop 10 books by rating count:")
        for i, book in enumerate(books_with_ratings[:10], 1):
            title = book['title'][:60] + '...' if len(book['title']) > 60 else book['title']
            print(f"{i}. {title} - {book['rating_count']:,} ratings")
    else:
        print("No rating data found")

if __name__ == '__main__':
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    csv_file = os.path.join(project_root, 'data', 'november_bestsellers_amazon_india.csv')
    check_amazon_ratings(csv_file)

