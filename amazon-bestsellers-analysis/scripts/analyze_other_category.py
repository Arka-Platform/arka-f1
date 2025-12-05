"""Analyze what books are classified as 'Other' and why"""

import sys
import os
sys.path.append(os.path.dirname(__file__))

from business_analysis import BusinessBestsellersAnalyzer

# Load and analyze
import os
script_dir = os.path.dirname(os.path.abspath(__file__))
data_path = os.path.join(script_dir, '..', 'data', 'november_bestsellers_amazon_india.csv')
analyzer = BusinessBestsellersAnalyzer(data_path)

# Get books classified as "Other"
other_books = analyzer.df_clean[analyzer.df_clean['genre'] == 'Other'].copy()

print("="*80)
print("ANALYSIS OF 'OTHER' CATEGORY")
print("="*80)

print(f"\n1. Total 'Other' books: {len(other_books):,} ({len(other_books)/len(analyzer.df_clean)*100:.1f}%)")

print(f"\n2. Why are they 'Other'?")
print(f"   - Genre from category (Unknown): {(other_books['genre_from_category'] == 'Unknown').sum():,}")
print(f"   - Genre from title (Other): {(other_books['genre_from_title'] == 'Other').sum():,}")

print(f"\n3. Category ID distribution for 'Other' books:")
print("\n   Level 0 (Main Category):")
for cat_id, count in other_books['category_id_0'].value_counts().head(10).items():
    if cat_id and cat_id != '':
        print(f"      {cat_id}: {count:,} books")

print("\n   Level 1:")
for cat_id, count in other_books['category_id_1'].value_counts().head(10).items():
    if cat_id and cat_id != '':
        print(f"      {cat_id}: {count:,} books")

print("\n   Level 2:")
for cat_id, count in other_books['category_id_2'].value_counts().head(10).items():
    if cat_id and cat_id != '':
        print(f"      {cat_id}: {count:,} books")

print("\n   Level 3 (Most Specific):")
for cat_id, count in other_books['category_id_3'].value_counts().head(10).items():
    if cat_id and cat_id != '':
        print(f"      {cat_id}: {count:,} books")

print(f"\n4. Sample titles classified as 'Other':")
sample = other_books[['title_clean', 'genre_from_category', 'genre_from_title', 'category_id_0', 'category_id_1', 'category_id_2', 'category_id_3']].head(30)
for idx, row in sample.iterrows():
    print(f"\n   Title: {row['title_clean'][:60]}")
    print(f"      Category IDs: {row['category_id_0']} > {row['category_id_1']} > {row['category_id_2']} > {row['category_id_3']}")
    print(f"      Genre from category: {row['genre_from_category']}")
    print(f"      Genre from title: {row['genre_from_title']}")

print(f"\n5. Unmapped Category IDs (most common):")
all_cat_ids = []
for col in ['category_id_0', 'category_id_1', 'category_id_2', 'category_id_3']:
    all_cat_ids.extend(other_books[col].dropna().astype(str).tolist())

from collections import Counter
cat_counter = Counter([c for c in all_cat_ids if c and c != '' and c != 'nan'])
print("\n   Top 20 unmapped category IDs:")
for cat_id, count in cat_counter.most_common(20):
    mapped = analyzer._map_category_to_genre(cat_id)
    if mapped == 'Unknown':
        print(f"      {cat_id}: {count} occurrences (UNMAPPED)")

print("\n" + "="*80)
print("CONCLUSION")
print("="*80)
print("'Other' category contains books where:")
print("1. Category IDs are not in our mapping dictionary")
print("2. Title-based classification didn't match any genre keywords")
print("3. These are likely specialized or niche categories not covered in our mapping")

