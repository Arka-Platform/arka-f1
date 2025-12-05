#!/usr/bin/env python3
"""
Script to check rating statistics and find the maximum rating count.
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

if __name__ == '__main__':
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    workspace_root = os.path.dirname(project_root)
    
    ratings_file = os.path.join(workspace_root, 'arka-backend', 'resources', 'books_data', 'ratings.csv')
    
    print("Counting ratings per book...")
    rating_counts = count_ratings_per_book(ratings_file)
    
    if rating_counts:
        counts = list(rating_counts.values())
        max_count = max(counts)
        print(f"\nStatistics:")
        print(f"Total books with ratings: {len(rating_counts)}")
        print(f"Maximum rating count: {max_count:,}")
        print(f"Average rating count: {sum(counts) / len(counts):.2f}")
        
        # Show top 20 books
        top_books = rating_counts.most_common(20)
        print(f"\nTop 20 books by rating count:")
        for i, (isbn, count) in enumerate(top_books, 1):
            print(f"{i}. ISBN: {isbn}, Ratings: {count:,}")


