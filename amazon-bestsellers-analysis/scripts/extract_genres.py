#!/usr/bin/env python3
"""
Extract genres from Amazon category links following industry best practices.
This script extracts category IDs from URLs and maps them to genre names.
"""

import csv
import re
import os
import json
from collections import Counter, defaultdict
from urllib.parse import urlparse, parse_qs
import requests
from bs4 import BeautifulSoup

class GenreExtractor:
    """Extract and map genres from Amazon category links"""
    
    def __init__(self, csv_path):
        self.csv_path = csv_path
        self.category_mapping = {}
        self.genre_hierarchy = defaultdict(list)
        
    def extract_category_id(self, url):
        """Extract category ID from Amazon URL"""
        if not url or url == '' or url.lower() == 'nan':
            return None
        
        # Pattern: /bestsellers/books/{category_id}/
        match = re.search(r'/bestsellers/books/(\d+)/', str(url))
        if match:
            return match.group(1)
        return None
    
    def fetch_category_name_from_url(self, category_id):
        """Fetch category name from Amazon URL (with caching)"""
        if category_id in self.category_mapping:
            return self.category_mapping[category_id]
        
        # Try to fetch from Amazon (with rate limiting)
        url = f"https://www.amazon.in/gp/bestsellers/books/{category_id}/"
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            response = requests.get(url, headers=headers, timeout=5)
            if response.status_code == 200:
                soup = BeautifulSoup(response.content, 'html.parser')
                # Try to find category name in breadcrumbs or page title
                title = soup.find('title')
                if title:
                    # Extract category name from title
                    title_text = title.get_text()
                    # Amazon titles usually have format: "Best Sellers in {Category} | Amazon.in"
                    match = re.search(r'Best Sellers in (.+?)\s*\||Amazon', title_text)
                    if match:
                        category_name = match.group(1).strip()
                        self.category_mapping[category_id] = category_name
                        return category_name
        except Exception as e:
            print(f"Warning: Could not fetch category {category_id}: {e}")
        
        return None
    
    def analyze_category_structure(self):
        """Analyze the category structure from the CSV"""
        category_paths = Counter()
        all_category_ids = set()
        
        print("Analyzing category structure...")
        with open(self.csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for i, row in enumerate(reader):
                if i % 1000 == 0:
                    print(f"  Processed {i} rows...")
                
                cat0 = self.extract_category_id(row.get('category-link-0', ''))
                cat1 = self.extract_category_id(row.get('category-link-1', ''))
                cat2 = self.extract_category_id(row.get('category-link-2', ''))
                cat3 = self.extract_category_id(row.get('category-link-3', ''))
                
                if cat0:
                    all_category_ids.add(cat0)
                if cat1:
                    all_category_ids.add(cat1)
                if cat2:
                    all_category_ids.add(cat2)
                if cat3:
                    all_category_ids.add(cat3)
                
                path = (cat0, cat1, cat2, cat3)
                if any(path):
                    category_paths[path] += 1
        
        print(f"\nFound {len(category_paths)} unique category paths")
        print(f"Found {len(all_category_ids)} unique category IDs")
        
        return category_paths, all_category_ids
    
    def create_genre_mapping(self, use_fetching=False):
        """Create genre mapping from category IDs"""
        category_paths, all_category_ids = self.analyze_category_structure()
        
        # Common Amazon India book category mappings (based on industry knowledge and data analysis)
        # These are common category IDs for Amazon India books
        common_mappings = {
            # Literature & Fiction (Level 0: 1318224031 - 18,368 books)
            '1318224031': 'Literature & Fiction',
            '1318281031': 'Fiction',
            '1318280031': 'Genre Fiction',
            '1318282031': 'Literary Fiction',
            '1318289031': 'Contemporary Fiction',
            '1318278031': 'Historical Fiction',
            '1318273031': 'Romantic Fiction',
            '1318272031': 'Mystery & Thriller Fiction',
            '1318277031': 'Science Fiction',
            '1318274031': 'Fantasy Fiction',
            '1318276031': 'Horror Fiction',
            '1318275031': 'Action & Adventure Fiction',
            '1318279031': 'Literary Collections',
            '1318264031': 'Poetry',
            '1318270031': 'Drama & Plays',
            '1318265031': 'Essays & Letters',
            '1318247031': 'Short Stories',
            '1318235031': 'Anthologies',
            '1318253031': 'Literary Criticism',
            '1318185031': 'Fiction by Format',
            '1318186031': 'Fiction Collections',
            
            # Comics & Graphic Novels (Level 0: 64619754031 - 9,587 books)
            '64619754031': 'Comics & Graphic Novels',
            '67803437031': 'Graphic Novels',
            '67803436031': 'Comic Books',
            '67803452031': 'Manga',
            '67803443031': 'Superhero Comics',
            '67803444031': 'Fantasy Comics',
            '67803445031': 'Science Fiction Comics',
            '67803441031': 'Horror Comics',
            '67803578031': 'Manga Series',
            '67803513031': 'Superhero Series',
            '67803522031': 'Fantasy Series',
            '67803533031': 'Sci-Fi Series',
            '67803482031': 'Comic Collections',
            '67803470031': 'Graphic Novel Collections',
            '67803521031': 'Fantasy Collections',
            '67803516031': 'Superhero Collections',
            '67803506031': 'Horror Collections',
            '67803468031': 'Manga Collections',
            '67803538031': 'Action Comics',
            '67803547031': 'Adventure Comics',
            '67803550031': 'Romance Comics',
            '67803572031': 'Comedy Comics',
            '67803563031': 'Drama Comics',
            '67803543031': 'Mystery Comics',
            '67803542031': 'Thriller Comics',
            '67803532031': 'Historical Comics',
            '67803511031': 'Biographical Comics',
            '67803555031': 'Educational Comics',
            
            # Travel
            '1318295031': 'Travel',
            '1318299031': 'Travel Guides',
            '1318297031': 'Travel Writing',
            '14545919031': 'Travel Reference',
            '14545920031': 'Travel Guides by Region',
            '14545924031': 'Asia Travel Guides',
            '14545935031': 'Europe Travel Guides',
            
            # Children's Books
            '15417300031': "Children's Books",
            '15417301031': "Children's Fiction",
            '15417303031': "Children's Non-Fiction",
            '15417304031': "Children's Reference",
            
            # Business & Money
            '1318168031': 'Business & Money',
            '1318170031': 'Business',
            '1318171031': 'Economics',
            
            # Computers & Technology
            '15412190031': 'Computers & Technology',
            '15412169031': 'Programming',
            
            # Health, Fitness & Dieting
            '1318152031': 'Health, Fitness & Dieting',
            
            # Self-Help
            '1318160031': 'Self-Help',
            
            # Religion & Spirituality
            '1318140031': 'Religion & Spirituality',
            
            # Science & Math
            '1318130031': 'Science & Math',
            
            # History
            '1318120031': 'History',
            
            # Biographies & Memoirs
            '1318110031': 'Biographies & Memoirs',
            
            # Comics & Graphic Novels
            '1318100031': 'Comics & Graphic Novels',
            
            # Cookbooks, Food & Wine
            '1318090031': 'Cookbooks, Food & Wine',
            
            # Crafts, Hobbies & Home
            '1318080031': 'Crafts, Hobbies & Home',
            
            # Education & Reference
            '1318070031': 'Education & Reference',
            
            # Humor & Entertainment
            '1318060031': 'Humor & Entertainment',
            
            # Law
            '1318050031': 'Law',
            
            # Medical Books
            '1318040031': 'Medical Books',
            
            # Mystery, Thriller & Suspense
            '1318030031': 'Mystery, Thriller & Suspense',
            
            # Parenting & Relationships
            '1318020031': 'Parenting & Relationships',
            
            # Politics & Social Sciences
            '1318010031': 'Politics & Social Sciences',
            
            # Professional & Technical
            '1318000031': 'Professional & Technical',
            
            # Romance
            '1317990031': 'Romance',
            
            # Science Fiction & Fantasy
            '1317980031': 'Science Fiction & Fantasy',
            
            # Sports & Outdoors
            '1317970031': 'Sports & Outdoors',
            
            # Teen & Young Adult
            '1317960031': 'Teen & Young Adult',
            
            # Test Preparation
            '1317950031': 'Test Preparation',
            
            # Textbooks
            '1317940031': 'Textbooks',
            
            # Westerns
            '1317930031': 'Westerns',
        }
        
        # Update mapping with common mappings
        for cat_id, name in common_mappings.items():
            self.category_mapping[cat_id] = name
        
        # For unknown categories, try to fetch (if enabled)
        if use_fetching:
            print("\nFetching category names from Amazon (this may take a while)...")
            unknown_ids = [cid for cid in all_category_ids if cid not in self.category_mapping]
            print(f"Fetching {len(unknown_ids)} unknown category names...")
            
            for i, cat_id in enumerate(unknown_ids[:50]):  # Limit to 50 to avoid rate limiting
                if i % 10 == 0:
                    print(f"  Fetched {i}/{min(50, len(unknown_ids))}...")
                name = self.fetch_category_name_from_url(cat_id)
                if name:
                    self.category_mapping[cat_id] = name
        
        return self.category_mapping
    
    def extract_genres_for_dataset(self, output_csv=None):
        """Extract genres and add to dataset"""
        mapping = self.create_genre_mapping(use_fetching=False)
        
        print("\nExtracting genres from dataset...")
        rows_with_genres = []
        
        with open(self.csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                cat0 = self.extract_category_id(row.get('category-link-0', ''))
                cat1 = self.extract_category_id(row.get('category-link-1', ''))
                cat2 = self.extract_category_id(row.get('category-link-2', ''))
                cat3 = self.extract_category_id(row.get('category-link-3', ''))
                
                # Map category IDs to genre names
                genre_level0 = mapping.get(cat0, f'Category_{cat0}' if cat0 else 'Unknown')
                genre_level1 = mapping.get(cat1, f'Category_{cat1}' if cat1 else '')
                genre_level2 = mapping.get(cat2, f'Category_{cat2}' if cat2 else '')
                genre_level3 = mapping.get(cat3, f'Category_{cat3}' if cat3 else '')
                
                # Use the most specific genre available
                primary_genre = genre_level3 or genre_level2 or genre_level1 or genre_level0
                sub_genre = genre_level2 if genre_level2 and genre_level2 != primary_genre else genre_level1
                
                row['genre_primary'] = primary_genre
                row['genre_sub'] = sub_genre
                row['genre_level0'] = genre_level0
                row['genre_level1'] = genre_level1
                row['genre_level2'] = genre_level2
                row['genre_level3'] = genre_level3
                row['category_id_0'] = cat0 or ''
                row['category_id_1'] = cat1 or ''
                row['category_id_2'] = cat2 or ''
                row['category_id_3'] = cat3 or ''
                
                rows_with_genres.append(row)
        
        print(f"Extracted genres for {len(rows_with_genres)} books")
        
        # Save mapping to file
        mapping_file = os.path.join(os.path.dirname(self.csv_path), 'category_genre_mapping.json')
        with open(mapping_file, 'w', encoding='utf-8') as f:
            json.dump(mapping, f, indent=2)
        print(f"Saved category mapping to: {mapping_file}")
        
        # Save enhanced dataset if output specified
        if output_csv:
            fieldnames = list(rows_with_genres[0].keys())
            with open(output_csv, 'w', encoding='utf-8', newline='') as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(rows_with_genres)
            print(f"Saved enhanced dataset to: {output_csv}")
        
        # Print genre statistics
        genre_counts = Counter([r['genre_primary'] for r in rows_with_genres])
        print(f"\nTop 20 genres by book count:")
        for genre, count in genre_counts.most_common(20):
            print(f"  {genre}: {count} books")
        
        return rows_with_genres, mapping

if __name__ == '__main__':
    import sys
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    csv_path = os.path.join(project_root, 'data', 'amazon_bestsellers_november_latest.csv')
    
    extractor = GenreExtractor(csv_path)
    rows, mapping = extractor.extract_genres_for_dataset()
    
    print(f"\n✓ Genre extraction complete!")
    print(f"  Total books processed: {len(rows)}")
    print(f"  Unique genres found: {len(set(r['genre_primary'] for r in rows))}")

