#!/usr/bin/env python3
"""
Update analysis scripts to use genre mapping from category links.
This script loads the genre mapping and updates the CSV with genre information.
"""

import pandas as pd
import json
import os
import re

def load_genre_mapping():
    """Load genre mapping from JSON file"""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    mapping_file = os.path.join(project_root, 'data', 'category_genre_mapping.json')
    
    if os.path.exists(mapping_file):
        with open(mapping_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}

def extract_category_id(url):
    """Extract category ID from Amazon URL"""
    if pd.isna(url) or url == '' or str(url).lower() == 'nan':
        return None
    match = re.search(r'/bestsellers/books/(\d+)/', str(url))
    return match.group(1) if match else None

def add_genres_to_dataframe(df, genre_mapping):
    """Add genre columns to dataframe using category links"""
    print("Adding genres from category links...")
    
    # Extract category IDs
    df['category_id_0'] = df['category-link-0'].apply(extract_category_id)
    df['category_id_1'] = df['category-link-1'].apply(extract_category_id)
    df['category_id_2'] = df['category-link-2'].apply(extract_category_id)
    df['category_id_3'] = df['category-link-3'].apply(extract_category_id)
    
    # Map category IDs to genre names
    df['genre_level0'] = df['category_id_0'].apply(lambda x: genre_mapping.get(str(x), 'Unknown') if x else 'Unknown')
    df['genre_level1'] = df['category_id_1'].apply(lambda x: genre_mapping.get(str(x), '') if x else '')
    df['genre_level2'] = df['category_id_2'].apply(lambda x: genre_mapping.get(str(x), '') if x else '')
    df['genre_level3'] = df['category_id_3'].apply(lambda x: genre_mapping.get(str(x), '') if x else '')
    
    # Determine primary genre (use most specific available)
    df['genre_primary'] = df.apply(
        lambda row: row['genre_level3'] if row['genre_level3'] and row['genre_level3'] != 'Unknown' and not row['genre_level3'].startswith('Category_')
        else (row['genre_level2'] if row['genre_level2'] and row['genre_level2'] != 'Unknown' and not row['genre_level2'].startswith('Category_')
              else (row['genre_level1'] if row['genre_level1'] and row['genre_level1'] != 'Unknown' and not row['genre_level1'].startswith('Category_')
                    else row['genre_level0'])), axis=1
    )
    
    # Determine sub-genre
    df['genre_sub'] = df.apply(
        lambda row: row['genre_level2'] if row['genre_level2'] and row['genre_level2'] != row['genre_primary'] and not row['genre_level2'].startswith('Category_')
        else (row['genre_level1'] if row['genre_level1'] and row['genre_level1'] != row['genre_primary'] and not row['genre_level1'].startswith('Category_')
              else ''), axis=1
    )
    
    # Main genre (from level 0)
    df['genre_main'] = df['genre_level0']
    
    print(f"Genre extraction complete:")
    print(f"  Primary genres: {df['genre_primary'].nunique()} unique")
    print(f"  Main genres: {df['genre_main'].nunique()} unique")
    print(f"\nTop 10 primary genres:")
    for genre, count in df['genre_primary'].value_counts().head(10).items():
        print(f"  {genre}: {count:,} books")
    
    return df

if __name__ == '__main__':
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    
    # Load genre mapping
    genre_mapping = load_genre_mapping()
    print(f"Loaded {len(genre_mapping)} genre mappings")
    
    # Load CSV
    csv_path = os.path.join(project_root, 'data', 'amazon_bestsellers_november_latest.csv')
    print(f"\nLoading data from: {csv_path}")
    df = pd.read_csv(csv_path)
    print(f"Loaded {len(df)} rows")
    
    # Add genres
    df = add_genres_to_dataframe(df, genre_mapping)
    
    # Save enhanced CSV (optional - for reference)
    # output_path = os.path.join(project_root, 'data', 'amazon_bestsellers_november_latest_with_genres.csv')
    # df.to_csv(output_path, index=False)
    # print(f"\nSaved enhanced dataset to: {output_path}")
    
    print("\n✓ Genre extraction complete!")
    print("  The dataframe now has genre columns: genre_primary, genre_sub, genre_main")
    print("  Update your analysis scripts to use these columns instead of keyword-based classification")


