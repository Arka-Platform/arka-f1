#!/usr/bin/env python3
"""
Analyze patterns in the affordable price range (₹200-₹500):
- Genre patterns
- Book patterns
- Demand patterns (ratings, reviews, formats)
- Sub-genre analysis
- Author patterns
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import json
import os
import re
from collections import defaultdict, Counter
import warnings
warnings.filterwarnings('ignore')

# Set style
plt.style.use('seaborn-v0_8-whitegrid')
sns.set_palette("husl")

class AffordableSegmentAnalyzer:
    """Analyze affordable price segment (₹200-₹500)"""
    
    def __init__(self, csv_path):
        self.csv_path = csv_path
        self.df = None
        self.df_clean = None
        self.df_affordable = None
        self.genre_mapping = self._load_genre_mapping()
        self.load_and_prepare()
    
    def _load_genre_mapping(self):
        """Load genre mapping"""
        script_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.dirname(script_dir)
        mapping_file = os.path.join(project_root, 'data', 'category_genre_mapping.json')
        
        if os.path.exists(mapping_file):
            with open(mapping_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {}
    
    def load_and_prepare(self):
        """Load data and prepare for analysis"""
        print("Loading data...")
        self.df = pd.read_csv(self.csv_path, low_memory=False)
        self.df_clean = self.df.copy()
        
        # Extract and clean price
        self.df_clean['price_clean'] = self.df_clean['price'].astype(str).str.replace('₹', '').str.replace(',', '').str.strip()
        self.df_clean['price_clean'] = pd.to_numeric(self.df_clean['price_clean'], errors='coerce')
        
        # Extract rating
        self.df_clean['rating'] = self.df_clean['data'].astype(str).str.extract(r'(\d+\.?\d*)').astype(float)
        
        # Extract review count
        self.df_clean['review_count'] = self.df_clean['data2'].astype(str).str.replace(',', '')
        self.df_clean['review_count'] = pd.to_numeric(self.df_clean['review_count'], errors='coerce')
        
        # Extract other fields
        self.df_clean['format'] = self.df_clean['data4'].astype(str).str.strip()
        self.df_clean['author'] = self.df_clean['data5'].astype(str).str.strip()
        self.df_clean['title_clean'] = self.df_clean['data3'].astype(str).str.strip()
        
        # Remove price outliers
        self._remove_price_outliers()
        
        # Extract genres
        self._extract_genres()
        
        # Filter affordable segment
        self.df_affordable = self.df_clean[
            (self.df_clean['price_clean'] >= 200) & 
            (self.df_clean['price_clean'] < 500)
        ].copy()
        
        print(f"\nAffordable segment (₹200-₹500): {len(self.df_affordable):,} books")
        print(f"Represents {(len(self.df_affordable)/len(self.df_clean)*100):.1f}% of total market")
    
    def _remove_price_outliers(self):
        """Remove price outliers using IQR"""
        price_data = self.df_clean['price_clean'].dropna()
        if len(price_data) > 0:
            Q1 = price_data.quantile(0.25)
            Q3 = price_data.quantile(0.75)
            IQR = Q3 - Q1
            lower_bound = max(0, Q1 - 1.5 * IQR)
            upper_bound = min(Q3 + 1.5 * IQR, 3000)
            lower_bound = max(lower_bound, 50)
            
            price_mask = (self.df_clean['price_clean'] >= lower_bound) & \
                        (self.df_clean['price_clean'] <= upper_bound)
            self.df_clean = self.df_clean[price_mask].copy()
    
    def _extract_genres(self):
        """Extract genres from category links"""
        # Extract category IDs
        self.df_clean['category_id_0'] = self.df_clean['category-link-0'].astype(str).str.extract(r'/books/(\d+)/').fillna('')
        self.df_clean['category_id_1'] = self.df_clean['category-link-1'].astype(str).str.extract(r'/books/(\d+)/').fillna('')
        self.df_clean['category_id_2'] = self.df_clean['category-link-2'].astype(str).str.extract(r'/books/(\d+)/').fillna('')
        self.df_clean['category_id_3'] = self.df_clean['category-link-3'].astype(str).str.extract(r'/books/(\d+)/').fillna('')
        
        # Map to genre names
        self.df_clean['genre_main'] = self.df_clean['category_id_0'].apply(
            lambda x: self.genre_mapping.get(str(x), 'Other') if x and str(x) != 'nan' else 'Other'
        )
        self.df_clean['genre_level1'] = self.df_clean['category_id_1'].apply(
            lambda x: self.genre_mapping.get(str(x), '') if x and str(x) != 'nan' else ''
        )
        self.df_clean['genre_level2'] = self.df_clean['category_id_2'].apply(
            lambda x: self.genre_mapping.get(str(x), '') if x and str(x) != 'nan' else ''
        )
        
        # Determine sub-genre
        self.df_clean['subgenre'] = self.df_clean.apply(
            lambda row: row['genre_level2'] if (row['genre_level2'] and 
                                               row['genre_level2'] != row['genre_main'] and
                                               not str(row['genre_level2']).startswith('Category_'))
            else (row['genre_level1'] if (row['genre_level1'] and 
                                         row['genre_level1'] != row['genre_main'] and
                                         not str(row['genre_level1']).startswith('Category_'))
                  else ''), axis=1
        )
        
        self.df_clean['genre'] = self.df_clean['genre_main']
    
    def analyze_genre_patterns(self):
        """Analyze genre patterns in affordable segment"""
        print("\n" + "="*80)
        print("GENRE PATTERNS IN AFFORDABLE SEGMENT (₹200-₹500)")
        print("="*80)
        
        genre_counts = self.df_affordable['genre'].value_counts()
        
        print(f"\n1. TOP GENRES BY COUNT:")
        print(f"{'Rank':<6} {'Genre':<35} {'Count':<10} {'% Share':<10} {'Avg Price':<12} {'Avg Rating':<12}")
        print("-" * 95)
        
        for i, (genre, count) in enumerate(genre_counts.head(15).items(), 1):
            mask = self.df_affordable['genre'] == genre
            avg_price = self.df_affordable.loc[mask, 'price_clean'].mean()
            avg_rating = self.df_affordable.loc[mask, 'rating'].mean()
            pct = (count / len(self.df_affordable)) * 100
            print(f"{i:<6} {genre[:33]:<35} {count:<10,} {pct:<10.1f}% ₹{avg_price:<11.2f} {avg_rating:<12.2f}★")
        
        # Genre market share comparison
        print(f"\n2. GENRE MARKET SHARE COMPARISON:")
        print(f"{'Genre':<35} {'Affordable %':<15} {'Overall %':<15} {'Difference':<15}")
        print("-" * 80)
        
        overall_genre_counts = self.df_clean['genre'].value_counts()
        overall_total = len(self.df_clean)
        affordable_total = len(self.df_affordable)
        
        for genre in genre_counts.head(10).index:
            affordable_pct = (genre_counts[genre] / affordable_total) * 100
            overall_pct = (overall_genre_counts.get(genre, 0) / overall_total) * 100
            diff = affordable_pct - overall_pct
            print(f"{genre[:33]:<35} {affordable_pct:<15.1f}% {overall_pct:<15.1f}% {diff:+.1f}%")
        
        return genre_counts
    
    def analyze_subgenre_patterns(self):
        """Analyze sub-genre patterns"""
        print("\n" + "="*80)
        print("SUB-GENRE PATTERNS IN AFFORDABLE SEGMENT")
        print("="*80)
        
        # Sub-genres grouped by main genre
        genre_subgenre = self.df_affordable.groupby(['genre', 'subgenre']).size().sort_values(ascending=False)
        
        print(f"\n1. TOP SUB-GENRES (All Genres):")
        print(f"{'Rank':<6} {'Genre':<25} {'Sub-Genre':<30} {'Count':<10} {'Avg Price':<12} {'Avg Rating':<12}")
        print("-" * 100)
        
        for i, ((genre, subgenre), count) in enumerate(genre_subgenre.head(20).items(), 1):
            if subgenre and subgenre != '':
                mask = (self.df_affordable['genre'] == genre) & (self.df_affordable['subgenre'] == subgenre)
                avg_price = self.df_affordable.loc[mask, 'price_clean'].mean()
                avg_rating = self.df_affordable.loc[mask, 'rating'].mean()
                print(f"{i:<6} {genre[:23]:<25} {subgenre[:28]:<30} {count:<10,} ₹{avg_price:<11.2f} {avg_rating:<12.2f}★")
        
        # Sub-genres by main genre
        print(f"\n2. SUB-GENRES GROUPED BY MAIN GENRE:")
        genre_dict = defaultdict(list)
        for (genre, subgenre), count in genre_subgenre.items():
            if genre != 'Other' and subgenre and subgenre != '':
                genre_dict[genre].append((subgenre, count))
        
        top_genres = self.df_affordable['genre'].value_counts().head(5).index
        for genre in top_genres:
            if genre in genre_dict:
                print(f"\n   {genre}:")
                print(f"   {'Sub-Genre':<30} {'Count':<10} {'% of Genre':<12}")
                print(f"   {'-'*30} {'-'*10} {'-'*12}")
                total_genre = self.df_affordable[self.df_affordable['genre'] == genre].shape[0]
                for subgenre, count in sorted(genre_dict[genre], key=lambda x: x[1], reverse=True)[:8]:
                    pct = (count / total_genre) * 100
                    print(f"   {subgenre[:28]:<30} {count:<10,} {pct:<12.1f}%")
        
        return genre_subgenre
    
    def analyze_demand_patterns(self):
        """Analyze demand patterns (ratings, reviews, formats)"""
        print("\n" + "="*80)
        print("DEMAND PATTERNS IN AFFORDABLE SEGMENT")
        print("="*80)
        
        # Rating analysis
        rating_data = self.df_affordable['rating'].dropna()
        print(f"\n1. RATING PATTERNS:")
        print(f"   • Mean Rating: {rating_data.mean():.2f}★")
        print(f"   • Median Rating: {rating_data.median():.2f}★")
        print(f"   • Books with 4.0+★: {len(rating_data[rating_data >= 4.0]):,} ({(len(rating_data[rating_data >= 4.0])/len(rating_data)*100):.1f}%)")
        print(f"   • Books with 4.5+★: {len(rating_data[rating_data >= 4.5]):<10,} ({(len(rating_data[rating_data >= 4.5])/len(rating_data)*100):.1f}%)")
        
        # Review count analysis
        review_data = self.df_affordable['review_count'].dropna()
        if len(review_data) > 0:
            print(f"\n2. REVIEW COUNT PATTERNS (Demand Indicator):")
            print(f"   • Mean Reviews: {review_data.mean():.0f}")
            print(f"   • Median Reviews: {review_data.median():.0f}")
            print(f"   • Max Reviews: {review_data.max():,.0f}")
            print(f"   • Books with 100+ reviews: {len(review_data[review_data >= 100]):,} ({(len(review_data[review_data >= 100])/len(review_data)*100):.1f}%)")
            print(f"   • Books with 500+ reviews: {len(review_data[review_data >= 500]):,} ({(len(review_data[review_data >= 500])/len(review_data)*100):.1f}%)")
        
        # Format analysis
        format_counts = self.df_affordable['format'].value_counts()
        print(f"\n3. FORMAT PREFERENCES:")
        print(f"{'Format':<30} {'Count':<10} {'% Share':<10} {'Avg Price':<12} {'Avg Rating':<12}")
        print("-" * 85)
        
        for format_type, count in format_counts.head(10).items():
            if format_type and format_type != '':
                mask = self.df_affordable['format'] == format_type
                avg_price = self.df_affordable.loc[mask, 'price_clean'].mean()
                avg_rating = self.df_affordable.loc[mask, 'rating'].mean()
                pct = (count / len(self.df_affordable)) * 100
                print(f"{str(format_type)[:28]:<30} {count:<10,} {pct:<10.1f}% ₹{avg_price:<11.2f} {avg_rating:<12.2f}★")
        
        # Price distribution within affordable range
        print(f"\n4. PRICE DISTRIBUTION WITHIN AFFORDABLE RANGE:")
        price_ranges = [
            (200, 300, "₹200-₹300"),
            (300, 400, "₹300-₹400"),
            (400, 500, "₹400-₹500")
        ]
        
        for low, high, label in price_ranges:
            mask = (self.df_affordable['price_clean'] >= low) & (self.df_affordable['price_clean'] < high)
            count = mask.sum()
            if count > 0:
                avg_rating = self.df_affordable.loc[mask, 'rating'].mean()
                avg_reviews = self.df_affordable.loc[mask, 'review_count'].mean()
                pct = (count / len(self.df_affordable)) * 100
                print(f"   • {label}: {count:,} books ({pct:.1f}%) | Avg Rating: {avg_rating:.2f}★ | Avg Reviews: {avg_reviews:.0f}")
    
    def analyze_book_patterns(self):
        """Analyze book patterns (titles, authors)"""
        print("\n" + "="*80)
        print("BOOK PATTERNS IN AFFORDABLE SEGMENT")
        print("="*80)
        
        # Author analysis
        author_counts = self.df_affordable['author'].value_counts()
        print(f"\n1. TOP AUTHORS IN AFFORDABLE SEGMENT:")
        print(f"{'Rank':<6} {'Author':<40} {'Books':<10} {'Avg Price':<12} {'Avg Rating':<12} {'Avg Reviews':<12}")
        print("-" * 100)
        
        for i, (author, count) in enumerate(author_counts.head(20).items(), 1):
            if author and author != '' and str(author).lower() != 'nan':
                mask = self.df_affordable['author'] == author
                avg_price = self.df_affordable.loc[mask, 'price_clean'].mean()
                avg_rating = self.df_affordable.loc[mask, 'rating'].mean()
                avg_reviews = self.df_affordable.loc[mask, 'review_count'].mean()
                print(f"{i:<6} {str(author)[:38]:<40} {count:<10,} ₹{avg_price:<11.2f} {avg_rating:<12.2f}★ {avg_reviews:<12.0f}")
        
        # High-demand books (high reviews + high rating)
        print(f"\n2. HIGH-DEMAND BOOKS (High Reviews + High Rating):")
        high_demand = self.df_affordable[
            (self.df_affordable['review_count'] >= 500) & 
            (self.df_affordable['rating'] >= 4.5)
        ].sort_values('review_count', ascending=False)
        
        print(f"{'Title':<50} {'Author':<30} {'Price':<10} {'Rating':<10} {'Reviews':<10}")
        print("-" * 110)
        
        for idx, row in high_demand.head(15).iterrows():
            title = str(row['title_clean'])[:48] if pd.notna(row['title_clean']) else 'N/A'
            author = str(row['author'])[:28] if pd.notna(row['author']) else 'N/A'
            price = f"₹{row['price_clean']:.0f}" if pd.notna(row['price_clean']) else 'N/A'
            rating = f"{row['rating']:.1f}★" if pd.notna(row['rating']) else 'N/A'
            reviews = f"{row['review_count']:.0f}" if pd.notna(row['review_count']) else 'N/A'
            print(f"{title:<50} {author:<30} {price:<10} {rating:<10} {reviews:<10}")
    
    def generate_visualizations(self, output_dir='outputs'):
        """Generate visualizations for affordable segment"""
        os.makedirs(output_dir, exist_ok=True)
        
        print("\n" + "="*80)
        print("GENERATING AFFORDABLE SEGMENT VISUALIZATIONS")
        print("="*80)
        
        # 1. Genre distribution in affordable segment
        genre_counts = self.df_affordable['genre'].value_counts().head(10)
        plt.figure(figsize=(14, 8))
        colors = plt.cm.Set3(np.linspace(0, 1, len(genre_counts)))
        bars = plt.barh(range(len(genre_counts)), genre_counts.values, color=colors, edgecolor='black', linewidth=1.5)
        plt.xlabel('Number of Books', fontsize=12, fontweight='bold')
        plt.ylabel('Genre', fontsize=12, fontweight='bold')
        plt.title('Top 10 Genres in Affordable Segment (₹200-₹500)', fontsize=14, fontweight='bold')
        plt.yticks(range(len(genre_counts)), genre_counts.index)
        plt.gca().invert_yaxis()
        
        for i, (idx, val) in enumerate(genre_counts.items()):
            plt.text(val + 50, i, f'{val:,}', va='center', fontsize=11, fontweight='bold')
        
        plt.grid(True, alpha=0.3, axis='x')
        plt.tight_layout()
        plt.savefig(f'{output_dir}/affordable_01_genre_distribution.png', dpi=300, bbox_inches='tight')
        plt.close()
        print("✓ Saved: affordable_01_genre_distribution.png")
        
        # 2. Price distribution within affordable range
        price_data = self.df_affordable['price_clean'].dropna()
        plt.figure(figsize=(12, 6))
        plt.hist(price_data, bins=30, edgecolor='white', linewidth=1.5, alpha=0.8, color='#3498db')
        plt.axvline(price_data.mean(), color='red', linestyle='--', linewidth=2, label=f'Mean: ₹{price_data.mean():.0f}')
        plt.axvline(price_data.median(), color='green', linestyle='--', linewidth=2, label=f'Median: ₹{price_data.median():.0f}')
        plt.xlabel('Price (₹)', fontsize=12, fontweight='bold')
        plt.ylabel('Number of Books', fontsize=12, fontweight='bold')
        plt.title('Price Distribution in Affordable Segment (₹200-₹500)', fontsize=14, fontweight='bold')
        plt.legend()
        plt.grid(True, alpha=0.3)
        plt.tight_layout()
        plt.savefig(f'{output_dir}/affordable_02_price_distribution.png', dpi=300, bbox_inches='tight')
        plt.close()
        print("✓ Saved: affordable_02_price_distribution.png")
        
        # 3. Rating distribution in affordable segment
        rating_data = self.df_affordable['rating'].dropna()
        plt.figure(figsize=(12, 6))
        plt.hist(rating_data, bins=20, edgecolor='white', linewidth=1.5, alpha=0.8, color='#2ecc71')
        plt.axvline(rating_data.mean(), color='red', linestyle='--', linewidth=2, label=f'Mean: {rating_data.mean():.2f}★')
        plt.xlabel('Rating (out of 5)', fontsize=12, fontweight='bold')
        plt.ylabel('Number of Books', fontsize=12, fontweight='bold')
        plt.title('Rating Distribution in Affordable Segment', fontsize=14, fontweight='bold')
        plt.legend()
        plt.grid(True, alpha=0.3)
        plt.tight_layout()
        plt.savefig(f'{output_dir}/affordable_03_rating_distribution.png', dpi=300, bbox_inches='tight')
        plt.close()
        print("✓ Saved: affordable_03_rating_distribution.png")
        
        # 4. Format distribution
        format_counts = self.df_affordable['format'].value_counts().head(8)
        plt.figure(figsize=(12, 6))
        colors = plt.cm.viridis(np.linspace(0, 1, len(format_counts)))
        bars = plt.bar(range(len(format_counts)), format_counts.values, color=colors, edgecolor='black', linewidth=1.5)
        plt.xlabel('Format', fontsize=12, fontweight='bold')
        plt.ylabel('Number of Books', fontsize=12, fontweight='bold')
        plt.title('Format Distribution in Affordable Segment', fontsize=14, fontweight='bold')
        plt.xticks(range(len(format_counts)), [str(f)[:20] for f in format_counts.index], rotation=45, ha='right')
        
        for i, val in enumerate(format_counts.values):
            plt.text(i, val + 50, f'{val:,}', ha='center', va='bottom', fontsize=10, fontweight='bold')
        
        plt.grid(True, alpha=0.3, axis='y')
        plt.tight_layout()
        plt.savefig(f'{output_dir}/affordable_04_format_distribution.png', dpi=300, bbox_inches='tight')
        plt.close()
        print("✓ Saved: affordable_04_format_distribution.png")
        
        # 5. Genre vs Rating in affordable segment
        top_genres = self.df_affordable['genre'].value_counts().head(8).index
        genre_rating_df = self.df_affordable[self.df_affordable['genre'].isin(top_genres)]
        genre_rating_df = genre_rating_df[genre_rating_df['rating'].notna()]
        
        plt.figure(figsize=(14, 8))
        sns.boxplot(data=genre_rating_df, x='genre', y='rating', palette='Set2')
        plt.xlabel('Genre', fontsize=12, fontweight='bold')
        plt.ylabel('Rating (out of 5)', fontsize=12, fontweight='bold')
        plt.title('Rating Distribution by Genre in Affordable Segment', fontsize=14, fontweight='bold')
        plt.xticks(rotation=45, ha='right')
        plt.axhline(y=4.0, color='green', linestyle='--', alpha=0.7, label='4.0★ Threshold')
        plt.legend()
        plt.grid(True, alpha=0.3, axis='y')
        plt.tight_layout()
        plt.savefig(f'{output_dir}/affordable_05_genre_rating.png', dpi=300, bbox_inches='tight')
        plt.close()
        print("✓ Saved: affordable_05_genre_rating.png")
        
        # 6. Review count distribution (demand indicator)
        review_data = self.df_affordable['review_count'].dropna()
        if len(review_data) > 0:
            plt.figure(figsize=(12, 6))
            plt.hist(review_data, bins=50, edgecolor='white', linewidth=1.5, alpha=0.8, color='#e67e22')
            plt.axvline(review_data.mean(), color='red', linestyle='--', linewidth=2, label=f'Mean: {review_data.mean():.0f}')
            plt.axvline(review_data.median(), color='blue', linestyle='--', linewidth=2, label=f'Median: {review_data.median():.0f}')
            plt.xlabel('Review Count', fontsize=12, fontweight='bold')
            plt.ylabel('Number of Books', fontsize=12, fontweight='bold')
            plt.title('Review Count Distribution (Demand Indicator) in Affordable Segment', fontsize=14, fontweight='bold')
            plt.legend()
            plt.grid(True, alpha=0.3)
            plt.yscale('log')  # Log scale for better visualization
            plt.tight_layout()
            plt.savefig(f'{output_dir}/affordable_06_review_distribution.png', dpi=300, bbox_inches='tight')
            plt.close()
            print("✓ Saved: affordable_06_review_distribution.png")
        
        # 7. Price vs Rating in affordable segment
        analysis_df = self.df_affordable[['price_clean', 'rating']].dropna()
        if len(analysis_df) > 0:
            plt.figure(figsize=(12, 8))
            plt.scatter(analysis_df['price_clean'], analysis_df['rating'], 
                       alpha=0.5, s=30, c=analysis_df['rating'], cmap='RdYlGn', edgecolors='black', linewidth=0.3)
            
            # Add trend line
            z = np.polyfit(analysis_df['price_clean'], analysis_df['rating'], 1)
            p = np.poly1d(z)
            x_trend = np.linspace(analysis_df['price_clean'].min(), analysis_df['price_clean'].max(), 100)
            plt.plot(x_trend, p(x_trend), "r--", alpha=0.8, linewidth=2, label='Trend Line')
            
            plt.xlabel('Price (₹)', fontsize=12, fontweight='bold')
            plt.ylabel('Rating (out of 5)', fontsize=12, fontweight='bold')
            plt.title('Price vs Rating in Affordable Segment (₹200-₹500)', fontsize=14, fontweight='bold')
            plt.legend()
            plt.grid(True, alpha=0.3)
            plt.colorbar(label='Rating')
            plt.tight_layout()
            plt.savefig(f'{output_dir}/affordable_07_price_vs_rating.png', dpi=300, bbox_inches='tight')
            plt.close()
            print("✓ Saved: affordable_07_price_vs_rating.png")
        
        print(f"\n✓ All visualizations saved to {output_dir}/")
    
    def generate_findings_report(self, output_file='reports/AFFORDABLE_SEGMENT_ANALYSIS.md'):
        """Generate comprehensive findings report"""
        print("\n" + "="*80)
        print("GENERATING FINDINGS REPORT")
        print("="*80)
        
        os.makedirs(os.path.dirname(output_file), exist_ok=True)
        
        report = []
        report.append("# Affordable Segment Analysis (₹200-₹500)\n")
        report.append(f"**Analysis Date:** {pd.Timestamp.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        report.append(f"**Total Books in Segment:** {len(self.df_affordable):,}\n")
        report.append(f"**Market Share:** {(len(self.df_affordable)/len(self.df_clean)*100):.1f}% of total market\n")
        report.append("\n---\n")
        
        # Executive Summary
        report.append("## Executive Summary\n")
        price_data = self.df_affordable['price_clean'].dropna()
        rating_data = self.df_affordable['rating'].dropna()
        report.append(f"- **Average Price:** ₹{price_data.mean():.2f}")
        report.append(f"- **Median Price:** ₹{price_data.median():.2f}")
        report.append(f"- **Average Rating:** {rating_data.mean():.2f}★")
        report.append(f"- **Quality Standard:** {(len(rating_data[rating_data >= 4.0])/len(rating_data)*100):.1f}% have 4.0+★")
        report.append(f"- **Top Genre:** {self.df_affordable['genre'].value_counts().index[0]}")
        report.append("\n---\n")
        
        # Genre Patterns
        report.append("## 1. Genre Patterns\n")
        genre_counts = self.df_affordable['genre'].value_counts()
        report.append("### 1.1 Top Genres by Count\n")
        report.append("| Rank | Genre | Count | % Share | Avg Price | Avg Rating |")
        report.append("|------|-------|-------|---------|-----------|------------|")
        
        for i, (genre, count) in enumerate(genre_counts.head(15).items(), 1):
            mask = self.df_affordable['genre'] == genre
            avg_price = self.df_affordable.loc[mask, 'price_clean'].mean()
            avg_rating = self.df_affordable.loc[mask, 'rating'].mean()
            pct = (count / len(self.df_affordable)) * 100
            report.append(f"| {i} | {genre} | {count:,} | {pct:.1f}% | ₹{avg_price:.2f} | {avg_rating:.2f}★ |")
        
        # Sub-genre patterns
        report.append("\n### 1.2 Sub-Genre Patterns\n")
        genre_subgenre = self.df_affordable.groupby(['genre', 'subgenre']).size().sort_values(ascending=False)
        
        genre_dict = defaultdict(list)
        for (genre, subgenre), count in genre_subgenre.items():
            if genre != 'Other' and subgenre and subgenre != '':
                genre_dict[genre].append((subgenre, count))
        
        top_genres = self.df_affordable['genre'].value_counts().head(5).index
        for genre in top_genres:
            if genre in genre_dict:
                report.append(f"\n#### {genre}\n")
                report.append("| Sub-Genre | Count | % of Genre | Avg Price | Avg Rating |")
                report.append("|-----------|-------|------------|-----------|------------|")
                total_genre = self.df_affordable[self.df_affordable['genre'] == genre].shape[0]
                for subgenre, count in sorted(genre_dict[genre], key=lambda x: x[1], reverse=True)[:10]:
                    pct = (count / total_genre) * 100
                    mask = (self.df_affordable['genre'] == genre) & (self.df_affordable['subgenre'] == subgenre)
                    avg_price = self.df_affordable.loc[mask, 'price_clean'].mean()
                    avg_rating = self.df_affordable.loc[mask, 'rating'].mean()
                    report.append(f"| {subgenre} | {count:,} | {pct:.1f}% | ₹{avg_price:.2f} | {avg_rating:.2f}★ |")
        
        report.append("\n---\n")
        
        # Demand Patterns
        report.append("## 2. Demand Patterns\n")
        
        rating_data = self.df_affordable['rating'].dropna()
        review_data = self.df_affordable['review_count'].dropna()
        
        report.append("### 2.1 Rating Patterns (Quality Indicator)\n")
        report.append(f"- **Mean Rating:** {rating_data.mean():.2f}★")
        report.append(f"- **Median Rating:** {rating_data.median():.2f}★")
        report.append(f"- **Books with 4.0+★:** {len(rating_data[rating_data >= 4.0]):,} ({(len(rating_data[rating_data >= 4.0])/len(rating_data)*100):.1f}%)")
        report.append(f"- **Books with 4.5+★:** {len(rating_data[rating_data >= 4.5]):,} ({(len(rating_data[rating_data >= 4.5])/len(rating_data)*100):.1f}%)")
        
        if len(review_data) > 0:
            report.append("\n### 2.2 Review Count Patterns (Demand Indicator)\n")
            report.append(f"- **Mean Reviews:** {review_data.mean():.0f}")
            report.append(f"- **Median Reviews:** {review_data.median():.0f}")
            report.append(f"- **Books with 100+ reviews:** {len(review_data[review_data >= 100]):,} ({(len(review_data[review_data >= 100])/len(review_data)*100):.1f}%)")
            report.append(f"- **Books with 500+ reviews:** {len(review_data[review_data >= 500]):,} ({(len(review_data[review_data >= 500])/len(review_data)*100):.1f}%)")
        
        # Format patterns
        report.append("\n### 2.3 Format Preferences\n")
        format_counts = self.df_affordable['format'].value_counts()
        report.append("| Format | Count | % Share | Avg Price | Avg Rating |")
        report.append("|--------|-------|---------|-----------|------------|")
        
        for format_type, count in format_counts.head(10).items():
            if format_type and format_type != '':
                mask = self.df_affordable['format'] == format_type
                avg_price = self.df_affordable.loc[mask, 'price_clean'].mean()
                avg_rating = self.df_affordable.loc[mask, 'rating'].mean()
                pct = (count / len(self.df_affordable)) * 100
                report.append(f"| {format_type} | {count:,} | {pct:.1f}% | ₹{avg_price:.2f} | {avg_rating:.2f}★ |")
        
        report.append("\n---\n")
        
        # Book Patterns
        report.append("## 3. Book Patterns\n")
        
        report.append("### 3.1 Top Authors\n")
        author_counts = self.df_affordable['author'].value_counts()
        report.append("| Rank | Author | Books | Avg Price | Avg Rating | Avg Reviews |")
        report.append("|------|--------|-------|-----------|------------|-------------|")
        
        for i, (author, count) in enumerate(author_counts.head(20).items(), 1):
            if author and author != '' and str(author).lower() != 'nan':
                mask = self.df_affordable['author'] == author
                avg_price = self.df_affordable.loc[mask, 'price_clean'].mean()
                avg_rating = self.df_affordable.loc[mask, 'rating'].mean()
                avg_reviews = self.df_affordable.loc[mask, 'review_count'].mean()
                report.append(f"| {i} | {author} | {count:,} | ₹{avg_price:.2f} | {avg_rating:.2f}★ | {avg_reviews:.0f} |")
        
        # High-demand books
        high_demand = self.df_affordable[
            (self.df_affordable['review_count'] >= 500) & 
            (self.df_affordable['rating'] >= 4.5)
        ].sort_values('review_count', ascending=False)
        
        if len(high_demand) > 0:
            report.append("\n### 3.2 High-Demand Books (500+ Reviews, 4.5+★)\n")
            report.append("| Title | Author | Price | Rating | Reviews |")
            report.append("|-------|--------|-------|--------|---------|")
            
            for idx, row in high_demand.head(20).iterrows():
                title = str(row['title_clean'])[:60] if pd.notna(row['title_clean']) else 'N/A'
                author = str(row['author'])[:30] if pd.notna(row['author']) else 'N/A'
                price = f"₹{row['price_clean']:.0f}" if pd.notna(row['price_clean']) else 'N/A'
                rating = f"{row['rating']:.1f}★" if pd.notna(row['rating']) else 'N/A'
                reviews = f"{row['review_count']:.0f}" if pd.notna(row['review_count']) else 'N/A'
                report.append(f"| {title} | {author} | {price} | {rating} | {reviews} |")
        
        report.append("\n---\n")
        
        # Price sub-segments
        report.append("## 4. Price Sub-Segments Within Affordable Range\n")
        price_ranges = [
            (200, 300, "₹200-₹300"),
            (300, 400, "₹300-₹400"),
            (400, 500, "₹400-₹500")
        ]
        
        report.append("| Price Range | Count | % Share | Avg Rating | Avg Reviews | Top Genre |")
        report.append("|-------------|-------|---------|------------|-------------|-----------|")
        
        for low, high, label in price_ranges:
            mask = (self.df_affordable['price_clean'] >= low) & (self.df_affordable['price_clean'] < high)
            count = mask.sum()
            if count > 0:
                pct = (count / len(self.df_affordable)) * 100
                avg_rating = self.df_affordable.loc[mask, 'rating'].mean()
                avg_reviews = self.df_affordable.loc[mask, 'review_count'].mean()
                top_genre = self.df_affordable.loc[mask, 'genre'].value_counts().index[0] if len(self.df_affordable.loc[mask]) > 0 else 'N/A'
                report.append(f"| {label} | {count:,} | {pct:.1f}% | {avg_rating:.2f}★ | {avg_reviews:.0f} | {top_genre} |")
        
        report.append("\n---\n")
        
        # Key Insights
        report.append("## 5. Key Insights & Patterns\n")
        report.append("### 5.1 Genre Patterns\n")
        top_genre = genre_counts.index[0]
        top_genre_pct = (genre_counts.iloc[0] / len(self.df_affordable)) * 100
        report.append(f"- **Dominant Genre:** {top_genre} represents {top_genre_pct:.1f}% of affordable segment")
        report.append(f"- **Genre Diversity:** {len(genre_counts)} unique genres in affordable segment")
        report.append(f"- **Top 3 Genres:** {', '.join(genre_counts.head(3).index.tolist())} account for {(genre_counts.head(3).sum()/len(self.df_affordable)*100):.1f}% of segment")
        
        report.append("\n### 5.2 Demand Patterns\n")
        report.append(f"- **Quality Standard:** {(len(rating_data[rating_data >= 4.0])/len(rating_data)*100):.1f}% maintain 4.0+★ rating")
        report.append(f"- **High Demand Books:** {len(high_demand):,} books have 500+ reviews and 4.5+★ rating")
        if len(review_data) > 0:
            report.append(f"- **Review Activity:** Average of {review_data.mean():.0f} reviews per book indicates strong customer engagement")
        
        report.append("\n### 5.3 Format Preferences\n")
        top_format = format_counts.index[0]
        top_format_pct = (format_counts.iloc[0] / len(self.df_affordable)) * 100
        report.append(f"- **Preferred Format:** {top_format} dominates with {top_format_pct:.1f}% market share")
        
        report.append("\n### 5.4 Price Positioning\n")
        report.append(f"- **Price Concentration:** Most books cluster around ₹{price_data.median():.0f} (median)")
        report.append(f"- **Price Range:** ₹{price_data.min():.0f} - ₹{price_data.max():.0f}")
        
        report.append("\n---\n")
        
        # Visualizations
        report.append("## 6. Visualizations\n")
        report.append("The following visualizations are available:\n")
        viz_files = [
            ("affordable_01_genre_distribution.png", "Genre Distribution"),
            ("affordable_02_price_distribution.png", "Price Distribution"),
            ("affordable_03_rating_distribution.png", "Rating Distribution"),
            ("affordable_04_format_distribution.png", "Format Distribution"),
            ("affordable_05_genre_rating.png", "Rating by Genre"),
            ("affordable_06_review_distribution.png", "Review Count Distribution"),
            ("affordable_07_price_vs_rating.png", "Price vs Rating")
        ]
        
        for filename, description in viz_files:
            report.append(f"\n### {description}\n")
            report.append(f"![{description}](../outputs/{filename})\n")
            report.append(f"*Figure: {description}*\n")
        
        report.append("\n---\n")
        
        # Write report
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write('\n'.join(report))
        
        print(f"✓ Findings report saved to: {output_file}")

if __name__ == '__main__':
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    csv_path = os.path.join(project_root, 'data', 'amazon_bestsellers_november_latest.csv')
    
    analyzer = AffordableSegmentAnalyzer(csv_path)
    
    # Run analyses
    analyzer.analyze_genre_patterns()
    analyzer.analyze_subgenre_patterns()
    analyzer.analyze_demand_patterns()
    analyzer.analyze_book_patterns()
    
    # Generate visualizations
    analyzer.generate_visualizations()
    
    # Generate report
    analyzer.generate_findings_report()
    
    print("\n" + "="*80)
    print("✓ AFFORDABLE SEGMENT ANALYSIS COMPLETE!")
    print("="*80)
