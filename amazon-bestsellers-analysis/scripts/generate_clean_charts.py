#!/usr/bin/env python3
"""
Generate clean, sensible charts after removing price outliers.
Focus on meaningful visualizations with cleaned data.
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import os
from scipy import stats
import warnings
warnings.filterwarnings('ignore')

# Set style for better visualizations
plt.style.use('seaborn-v0_8-whitegrid')
sns.set_palette("husl")

class CleanChartGenerator:
    """Generate clean charts with outlier-removed data"""
    
    def __init__(self, csv_path):
        self.csv_path = csv_path
        self.df = None
        self.df_clean = None
        self.load_and_clean()
    
    def load_and_clean(self):
        """Load data and remove outliers"""
        print("Loading and cleaning data...")
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
        
        # Remove price outliers using IQR method
        self._remove_price_outliers()
        
        print(f"Final dataset: {len(self.df_clean):,} books")
    
    def _remove_price_outliers(self):
        """Remove price outliers using IQR method"""
        initial_count = len(self.df_clean)
        price_data = self.df_clean['price_clean'].dropna()
        
        if len(price_data) > 0:
            Q1 = price_data.quantile(0.25)
            Q3 = price_data.quantile(0.75)
            IQR = Q3 - Q1
            
            # Standard IQR method
            lower_bound = max(0, Q1 - 1.5 * IQR)
            upper_bound = Q3 + 1.5 * IQR
            
            # Cap at realistic maximum for Indian market
            upper_bound = min(upper_bound, 3000)
            lower_bound = max(lower_bound, 50)
            
            price_mask = (self.df_clean['price_clean'] >= lower_bound) & \
                        (self.df_clean['price_clean'] <= upper_bound)
            
            self.df_clean = self.df_clean[price_mask].copy()
            
            removed = initial_count - len(self.df_clean)
            print(f"Removed {removed:,} price outliers ({removed/initial_count*100:.1f}%)")
            print(f"Price range: ₹{lower_bound:.2f} - ₹{upper_bound:.2f}")
    
    def generate_charts(self, output_dir='outputs'):
        """Generate clean, sensible charts"""
        os.makedirs(output_dir, exist_ok=True)
        
        print("\nGenerating clean charts...")
        
        # 1. Price Distribution (Clean)
        self._chart_price_distribution(output_dir)
        
        # 2. Price by Genre (Clean)
        self._chart_price_by_genre(output_dir)
        
        # 3. Price vs Rating (Clean)
        self._chart_price_vs_rating(output_dir)
        
        # 4. Price Segments Distribution
        self._chart_price_segments(output_dir)
        
        # 5. Format Price Comparison
        self._chart_format_price(output_dir)
        
        # 6. Genre Market Share
        self._chart_genre_market_share(output_dir)
        
        # 7. Rating Distribution
        self._chart_rating_distribution(output_dir)
        
        # 8. Price-Rating Correlation Analysis
        self._chart_price_rating_correlation(output_dir)
        
        print(f"\n✓ All charts saved to {output_dir}/")
    
    def _chart_price_distribution(self, output_dir):
        """Price distribution histogram"""
        price_data = self.df_clean['price_clean'].dropna()
        
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(18, 6))
        
        # Histogram
        ax1.hist(price_data, bins=50, edgecolor='white', linewidth=1.5, alpha=0.8, color='#2E86AB')
        ax1.axvline(price_data.mean(), color='red', linestyle='--', linewidth=2, label=f'Mean: ₹{price_data.mean():.0f}')
        ax1.axvline(price_data.median(), color='green', linestyle='--', linewidth=2, label=f'Median: ₹{price_data.median():.0f}')
        ax1.set_xlabel('Price (₹)', fontsize=12, fontweight='bold')
        ax1.set_ylabel('Number of Books', fontsize=12, fontweight='bold')
        ax1.set_title('Price Distribution (Outliers Removed)', fontsize=14, fontweight='bold')
        ax1.legend()
        ax1.grid(True, alpha=0.3)
        
        # Box plot
        ax2.boxplot(price_data, vert=True, patch_artist=True,
                   boxprops=dict(facecolor='#2E86AB', alpha=0.7))
        ax2.set_ylabel('Price (₹)', fontsize=12, fontweight='bold')
        ax2.set_title('Price Distribution - Box Plot', fontsize=14, fontweight='bold')
        ax2.grid(True, alpha=0.3, axis='y')
        
        plt.tight_layout()
        plt.savefig(f'{output_dir}/clean_01_price_distribution.png', dpi=300, bbox_inches='tight')
        plt.close()
        print("✓ Saved: clean_01_price_distribution.png")
    
    def _chart_price_by_genre(self, output_dir):
        """Price distribution by genre"""
        # Extract genres from category links
        import re
        self.df_clean['category_id_0'] = self.df_clean['category-link-0'].astype(str).str.extract(r'/books/(\d+)/').fillna('')
        
        # Load genre mapping
        script_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.dirname(script_dir)
        import json
        mapping_file = os.path.join(project_root, 'data', 'category_genre_mapping.json')
        genre_mapping = {}
        if os.path.exists(mapping_file):
            with open(mapping_file, 'r', encoding='utf-8') as f:
                genre_mapping = json.load(f)
        
        self.df_clean['genre'] = self.df_clean['category_id_0'].apply(
            lambda x: genre_mapping.get(str(x), 'Other') if x and str(x) != 'nan' else 'Other'
        )
        
        # Top genres
        top_genres = self.df_clean['genre'].value_counts().head(6).index
        genre_price_df = self.df_clean[self.df_clean['genre'].isin(top_genres)]
        genre_price_df = genre_price_df[genre_price_df['price_clean'].notna()]
        
        plt.figure(figsize=(14, 8))
        sns.boxplot(data=genre_price_df, x='genre', y='price_clean', palette='Set2')
        plt.xlabel('Genre', fontsize=12, fontweight='bold')
        plt.ylabel('Price (₹)', fontsize=12, fontweight='bold')
        plt.title('Price Distribution by Genre (Top 6 Genres)', fontsize=14, fontweight='bold')
        plt.xticks(rotation=45, ha='right')
        plt.grid(True, alpha=0.3, axis='y')
        plt.tight_layout()
        plt.savefig(f'{output_dir}/clean_02_price_by_genre.png', dpi=300, bbox_inches='tight')
        plt.close()
        print("✓ Saved: clean_02_price_by_genre.png")
    
    def _chart_price_vs_rating(self, output_dir):
        """Price vs Rating scatter plot"""
        analysis_df = self.df_clean[['price_clean', 'rating']].dropna()
        
        # Sample if too large
        if len(analysis_df) > 5000:
            analysis_df = analysis_df.sample(5000, random_state=42)
        
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
        plt.title('Price vs Rating Relationship (Outliers Removed)', fontsize=14, fontweight='bold')
        plt.legend()
        plt.grid(True, alpha=0.3)
        plt.colorbar(label='Rating')
        plt.tight_layout()
        plt.savefig(f'{output_dir}/clean_03_price_vs_rating.png', dpi=300, bbox_inches='tight')
        plt.close()
        print("✓ Saved: clean_03_price_vs_rating.png")
    
    def _chart_price_segments(self, output_dir):
        """Price segments distribution"""
        segments = [
            (0, 200, "Budget (₹0-200)"),
            (200, 500, "Affordable (₹200-500)"),
            (500, 1000, "Mid-Range (₹500-1000)"),
            (1000, 2000, "Premium (₹1000-2000)"),
            (2000, 3000, "Luxury (₹2000-3000)")
        ]
        
        segment_counts = []
        segment_labels = []
        segment_colors = ['#2ecc71', '#3498db', '#9b59b6', '#e67e22', '#e74c3c']
        
        for low, high, label in segments:
            mask = (self.df_clean['price_clean'] >= low) & (self.df_clean['price_clean'] < high)
            count = mask.sum()
            if count > 0:
                segment_counts.append(count)
                segment_labels.append(f"{label}\n({count:,} books)")
        
        plt.figure(figsize=(12, 8))
        bars = plt.bar(range(len(segment_counts)), segment_counts, color=segment_colors[:len(segment_counts)], 
                       edgecolor='black', linewidth=1.5)
        plt.xlabel('Price Segment', fontsize=12, fontweight='bold')
        plt.ylabel('Number of Books', fontsize=12, fontweight='bold')
        plt.title('Price Segments Distribution (Outliers Removed)', fontsize=14, fontweight='bold')
        plt.xticks(range(len(segment_labels)), segment_labels, rotation=45, ha='right')
        
        # Add value labels
        for i, (bar, count) in enumerate(zip(bars, segment_counts)):
            plt.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 50,
                    f'{count:,}', ha='center', va='bottom', fontweight='bold')
        
        plt.grid(True, alpha=0.3, axis='y')
        plt.tight_layout()
        plt.savefig(f'{output_dir}/clean_04_price_segments.png', dpi=300, bbox_inches='tight')
        plt.close()
        print("✓ Saved: clean_04_price_segments.png")
    
    def _chart_format_price(self, output_dir):
        """Format price comparison"""
        format_price = self.df_clean.groupby('format')['price_clean'].agg(['mean', 'count']).sort_values('count', ascending=False)
        format_price = format_price[format_price['count'] >= 50].head(8)
        
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 6))
        
        # Average price by format
        ax1.barh(range(len(format_price)), format_price['mean'], color='steelblue', edgecolor='black')
        ax1.set_yticks(range(len(format_price)))
        ax1.set_yticklabels([str(f)[:20] for f in format_price.index], fontsize=10)
        ax1.set_xlabel('Average Price (₹)', fontsize=12, fontweight='bold')
        ax1.set_title('Average Price by Format', fontsize=14, fontweight='bold')
        ax1.grid(True, alpha=0.3, axis='x')
        ax1.invert_yaxis()
        
        # Count by format
        ax2.barh(range(len(format_price)), format_price['count'], color='coral', edgecolor='black')
        ax2.set_yticks(range(len(format_price)))
        ax2.set_yticklabels([str(f)[:20] for f in format_price.index], fontsize=10)
        ax2.set_xlabel('Number of Books', fontsize=12, fontweight='bold')
        ax2.set_title('Book Count by Format', fontsize=14, fontweight='bold')
        ax2.grid(True, alpha=0.3, axis='x')
        ax2.invert_yaxis()
        
        plt.tight_layout()
        plt.savefig(f'{output_dir}/clean_05_format_price.png', dpi=300, bbox_inches='tight')
        plt.close()
        print("✓ Saved: clean_05_format_price.png")
    
    def _chart_genre_market_share(self, output_dir):
        """Genre market share"""
        if 'genre' not in self.df_clean.columns:
            return
        
        genre_counts = self.df_clean['genre'].value_counts().head(8)
        
        plt.figure(figsize=(12, 8))
        colors = plt.cm.Set3(np.linspace(0, 1, len(genre_counts)))
        bars = plt.barh(range(len(genre_counts)), genre_counts.values, color=colors, edgecolor='black', linewidth=1.5)
        plt.xlabel('Number of Books', fontsize=12, fontweight='bold')
        plt.ylabel('Genre', fontsize=12, fontweight='bold')
        plt.title('Top Genres by Market Share', fontsize=14, fontweight='bold')
        plt.yticks(range(len(genre_counts)), genre_counts.index)
        plt.gca().invert_yaxis()
        
        # Add value labels
        for i, (idx, val) in enumerate(genre_counts.items()):
            plt.text(val + 20, i, f'{val:,}', va='center', fontsize=11, fontweight='bold')
        
        plt.grid(True, alpha=0.3, axis='x')
        plt.tight_layout()
        plt.savefig(f'{output_dir}/clean_06_genre_market_share.png', dpi=300, bbox_inches='tight')
        plt.close()
        print("✓ Saved: clean_06_genre_market_share.png")
    
    def _chart_rating_distribution(self, output_dir):
        """Rating distribution"""
        rating_data = self.df_clean['rating'].dropna()
        
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 6))
        
        # Histogram
        ax1.hist(rating_data, bins=20, edgecolor='white', linewidth=1.5, alpha=0.8, color='#06A77D')
        ax1.axvline(rating_data.mean(), color='red', linestyle='--', linewidth=2, label=f'Mean: {rating_data.mean():.2f}★')
        ax1.axvline(rating_data.median(), color='blue', linestyle='--', linewidth=2, label=f'Median: {rating_data.median():.2f}★')
        ax1.set_xlabel('Rating (out of 5)', fontsize=12, fontweight='bold')
        ax1.set_ylabel('Number of Books', fontsize=12, fontweight='bold')
        ax1.set_title('Rating Distribution', fontsize=14, fontweight='bold')
        ax1.legend()
        ax1.grid(True, alpha=0.3)
        
        # Rating categories
        rating_cats = {
            'Excellent (4.5-5.0)': (4.5, 5.0),
            'Very Good (4.0-4.5)': (4.0, 4.5),
            'Good (3.5-4.0)': (3.5, 4.0),
            'Average (3.0-3.5)': (3.0, 3.5),
            'Below Avg (<3.0)': (0, 3.0)
        }
        
        cat_counts = []
        cat_labels = []
        for label, (low, high) in rating_cats.items():
            mask = (rating_data >= low) & (rating_data < high) if high < 5.0 else (rating_data >= low) & (rating_data <= high)
            count = mask.sum()
            cat_counts.append(count)
            cat_labels.append(f"{label}\n({count:,})")
        
        colors = ['#2ecc71', '#3498db', '#f39c12', '#e67e22', '#e74c3c']
        ax2.bar(range(len(cat_counts)), cat_counts, color=colors, edgecolor='black', linewidth=1.5)
        ax2.set_xticks(range(len(cat_labels)))
        ax2.set_xticklabels(cat_labels, rotation=45, ha='right', fontsize=9)
        ax2.set_ylabel('Number of Books', fontsize=12, fontweight='bold')
        ax2.set_title('Rating Categories', fontsize=14, fontweight='bold')
        ax2.grid(True, alpha=0.3, axis='y')
        
        plt.tight_layout()
        plt.savefig(f'{output_dir}/clean_07_rating_distribution.png', dpi=300, bbox_inches='tight')
        plt.close()
        print("✓ Saved: clean_07_rating_distribution.png")
    
    def _chart_price_rating_correlation(self, output_dir):
        """Price-Rating correlation analysis"""
        analysis_df = self.df_clean[['price_clean', 'rating']].dropna()
        
        if len(analysis_df) < 100:
            return
        
        # Calculate correlation
        corr = analysis_df['price_clean'].corr(analysis_df['rating'])
        
        fig, axes = plt.subplots(2, 2, figsize=(16, 12))
        
        # Scatter plot
        axes[0, 0].scatter(analysis_df['price_clean'], analysis_df['rating'], alpha=0.5, s=20)
        z = np.polyfit(analysis_df['price_clean'], analysis_df['rating'], 1)
        p = np.poly1d(z)
        x_trend = np.linspace(analysis_df['price_clean'].min(), analysis_df['price_clean'].max(), 100)
        axes[0, 0].plot(x_trend, p(x_trend), "r--", linewidth=2)
        axes[0, 0].set_xlabel('Price (₹)', fontsize=11, fontweight='bold')
        axes[0, 0].set_ylabel('Rating', fontsize=11, fontweight='bold')
        axes[0, 0].set_title(f'Price vs Rating (r={corr:.3f})', fontsize=12, fontweight='bold')
        axes[0, 0].grid(True, alpha=0.3)
        
        # Price bins vs average rating
        price_bins = pd.cut(analysis_df['price_clean'], bins=10)
        bin_ratings = analysis_df.groupby(price_bins)['rating'].mean()
        axes[0, 1].plot(range(len(bin_ratings)), bin_ratings.values, marker='o', linewidth=2, markersize=8)
        axes[0, 1].set_xlabel('Price Bins', fontsize=11, fontweight='bold')
        axes[0, 1].set_ylabel('Average Rating', fontsize=11, fontweight='bold')
        axes[0, 1].set_title('Average Rating by Price Range', fontsize=12, fontweight='bold')
        axes[0, 1].grid(True, alpha=0.3)
        axes[0, 1].set_xticks(range(len(bin_ratings)))
        axes[0, 1].set_xticklabels([f'Bin {i+1}' for i in range(len(bin_ratings))], rotation=45, ha='right')
        
        # Rating bins vs average price
        rating_bins = pd.cut(analysis_df['rating'], bins=10)
        bin_prices = analysis_df.groupby(rating_bins)['price_clean'].mean()
        axes[1, 0].plot(range(len(bin_prices)), bin_prices.values, marker='s', linewidth=2, markersize=8, color='green')
        axes[1, 0].set_xlabel('Rating Bins', fontsize=11, fontweight='bold')
        axes[1, 0].set_ylabel('Average Price (₹)', fontsize=11, fontweight='bold')
        axes[1, 0].set_title('Average Price by Rating Range', fontsize=12, fontweight='bold')
        axes[1, 0].grid(True, alpha=0.3)
        axes[1, 0].set_xticks(range(len(bin_prices)))
        axes[1, 0].set_xticklabels([f'Bin {i+1}' for i in range(len(bin_prices))], rotation=45, ha='right')
        
        # Correlation summary
        axes[1, 1].axis('off')
        summary_text = f"""
        Price-Rating Correlation Analysis
        
        Correlation Coefficient: {corr:.4f}
        
        Interpretation:
        {'Positive correlation: Higher prices tend to have higher ratings' if corr > 0.1 else 'Weak/No correlation: Price and rating are largely independent' if abs(corr) < 0.1 else 'Negative correlation: Higher prices tend to have lower ratings'}
        
        Statistical Summary:
        • Mean Price: ₹{analysis_df['price_clean'].mean():.2f}
        • Mean Rating: {analysis_df['rating'].mean():.2f}★
        • Sample Size: {len(analysis_df):,} books
        """
        axes[1, 1].text(0.1, 0.5, summary_text, fontsize=11, verticalalignment='center',
                       bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.5))
        
        plt.suptitle('Price-Rating Relationship Analysis (Outliers Removed)', 
                    fontsize=14, fontweight='bold', y=0.995)
        plt.tight_layout()
        plt.savefig(f'{output_dir}/clean_08_price_rating_correlation.png', dpi=300, bbox_inches='tight')
        plt.close()
        print("✓ Saved: clean_08_price_rating_correlation.png")

if __name__ == '__main__':
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    csv_path = os.path.join(project_root, 'data', 'amazon_bestsellers_november_latest.csv')
    
    generator = CleanChartGenerator(csv_path)
    generator.generate_charts()
    
    # Generate findings
    print("\n" + "="*80)
    print("KEY FINDINGS FROM CLEANED DATA")
    print("="*80)
    
    price_data = generator.df_clean['price_clean'].dropna()
    rating_data = generator.df_clean['rating'].dropna()
    
    print(f"\n1. PRICE ANALYSIS:")
    print(f"   • Mean Price: ₹{price_data.mean():.2f}")
    print(f"   • Median Price: ₹{price_data.median():.2f}")
    print(f"   • Price Range: ₹{price_data.min():.2f} - ₹{price_data.max():.2f}")
    print(f"   • Standard Deviation: ₹{price_data.std():.2f}")
    
    print(f"\n2. RATING ANALYSIS:")
    print(f"   • Mean Rating: {rating_data.mean():.2f}★")
    print(f"   • Median Rating: {rating_data.median():.2f}★")
    print(f"   • Books with 4.0+ rating: {len(rating_data[rating_data >= 4.0]):,} ({(len(rating_data[rating_data >= 4.0])/len(rating_data)*100):.1f}%)")
    print(f"   • Books with 4.5+ rating: {len(rating_data[rating_data >= 4.5]):,} ({(len(rating_data[rating_data >= 4.5])/len(rating_data)*100):.1f}%)")
    
    # Price-Rating correlation
    analysis_df = generator.df_clean[['price_clean', 'rating']].dropna()
    if len(analysis_df) > 0:
        corr = analysis_df['price_clean'].corr(analysis_df['rating'])
        print(f"\n3. PRICE-RATING RELATIONSHIP:")
        print(f"   • Correlation: {corr:.4f}")
        if abs(corr) < 0.1:
            print(f"   • Finding: Weak correlation - Price and rating are largely independent")
        elif corr > 0.1:
            print(f"   • Finding: Positive correlation - Higher prices tend to have slightly higher ratings")
        else:
            print(f"   • Finding: Negative correlation - Higher prices tend to have lower ratings")
    
    # Price segments
    segments = [
        (0, 200, "Budget"),
        (200, 500, "Affordable"),
        (500, 1000, "Mid-Range"),
        (1000, 2000, "Premium"),
        (2000, 3000, "Luxury")
    ]
    
    print(f"\n4. PRICE SEGMENT DISTRIBUTION:")
    for low, high, name in segments:
        mask = (generator.df_clean['price_clean'] >= low) & (generator.df_clean['price_clean'] < high)
        count = mask.sum()
        if count > 0:
            pct = (count / len(generator.df_clean)) * 100
            avg_price = generator.df_clean.loc[mask, 'price_clean'].mean()
            avg_rating = generator.df_clean.loc[mask, 'rating'].mean()
            print(f"   • {name} (₹{low}-₹{high}): {count:,} books ({pct:.1f}%) | Avg: ₹{avg_price:.2f}, Rating: {avg_rating:.2f}★")
    
    print(f"\n✓ Analysis complete!")




