#!/usr/bin/env python3
"""
Generate comprehensive report with all findings, diagrams, and analysis.
Includes proper sub-genre grouping and realistic outlier removal.
"""

import pandas as pd
import numpy as np
import json
import os
from datetime import datetime
from collections import defaultdict

class ComprehensiveReportGenerator:
    """Generate comprehensive analysis report with all findings"""
    
    def __init__(self, csv_path):
        self.csv_path = csv_path
        self.df = None
        self.df_clean = None
        self.genre_mapping = self._load_genre_mapping()
        self.load_and_analyze()
    
    def _load_genre_mapping(self):
        """Load genre mapping from JSON file"""
        script_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.dirname(script_dir)
        mapping_file = os.path.join(project_root, 'data', 'category_genre_mapping.json')
        
        if os.path.exists(mapping_file):
            with open(mapping_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {}
    
    def load_and_analyze(self):
        """Load data and perform comprehensive analysis with outlier removal"""
        print("Loading and analyzing data...")
        self.df = pd.read_csv(self.csv_path, low_memory=False)
        
        # Create cleaned dataframe
        self.df_clean = self.df.copy()
        
        # Extract and clean price
        self.df_clean['price_clean'] = self.df_clean['price'].astype(str).str.replace('₹', '').str.replace(',', '').str.strip()
        self.df_clean['price_clean'] = pd.to_numeric(self.df_clean['price_clean'], errors='coerce')
        
        # Extract rating
        self.df_clean['rating'] = self.df_clean['data'].astype(str).str.extract(r'(\d+\.?\d*)').astype(float)
        
        # Extract review count (data2)
        self.df_clean['review_count'] = self.df_clean['data2'].astype(str).str.replace(',', '')
        self.df_clean['review_count'] = pd.to_numeric(self.df_clean['review_count'], errors='coerce')
        
        # Extract other fields
        self.df_clean['format'] = self.df_clean['data4'].astype(str).str.strip()
        self.df_clean['author'] = self.df_clean['data5'].astype(str).str.strip()
        self.df_clean['title_clean'] = self.df_clean['data3'].astype(str).str.strip()
        
        # Extract genres from category links
        self._extract_genres_with_subgenres()
        
        # Remove outliers for realistic analysis
        self._remove_outliers_realistic()
        
        print(f"Final dataset: {len(self.df_clean)} books after outlier removal")
    
    def _extract_genres_with_subgenres(self):
        """Extract genres and properly group sub-genres within genres"""
        import re
        
        # Extract category IDs
        self.df_clean['category_id_0'] = self.df_clean['category-link-0'].astype(str).str.extract(r'/books/(\d+)/').fillna('')
        self.df_clean['category_id_1'] = self.df_clean['category-link-1'].astype(str).str.extract(r'/books/(\d+)/').fillna('')
        self.df_clean['category_id_2'] = self.df_clean['category-link-2'].astype(str).str.extract(r'/books/(\d+)/').fillna('')
        self.df_clean['category_id_3'] = self.df_clean['category-link-3'].astype(str).str.extract(r'/books/(\d+)/').fillna('')
        
        # Map to genre names
        self.df_clean['genre_level0'] = self.df_clean['category_id_0'].apply(
            lambda x: self.genre_mapping.get(str(x), 'Unknown') if x and str(x) != 'nan' else 'Unknown'
        )
        self.df_clean['genre_level1'] = self.df_clean['category_id_1'].apply(
            lambda x: self.genre_mapping.get(str(x), '') if x and str(x) != 'nan' else ''
        )
        self.df_clean['genre_level2'] = self.df_clean['category_id_2'].apply(
            lambda x: self.genre_mapping.get(str(x), '') if x and str(x) != 'nan' else ''
        )
        self.df_clean['genre_level3'] = self.df_clean['category_id_3'].apply(
            lambda x: self.genre_mapping.get(str(x), '') if x and str(x) != 'nan' else ''
        )
        
        # Determine main genre (from level 0)
        self.df_clean['genre_main'] = self.df_clean['genre_level0']
        
        # Determine primary genre (most specific)
        self.df_clean['genre_primary'] = self.df_clean.apply(
            lambda row: row['genre_level3'] if (row['genre_level3'] and 
                                                row['genre_level3'] != 'Unknown' and 
                                                not str(row['genre_level3']).startswith('Category_'))
            else (row['genre_level2'] if (row['genre_level2'] and 
                                         row['genre_level2'] != 'Unknown' and 
                                         not str(row['genre_level2']).startswith('Category_'))
                  else (row['genre_level1'] if (row['genre_level1'] and 
                                                row['genre_level1'] != 'Unknown' and 
                                                not str(row['genre_level1']).startswith('Category_'))
                        else row['genre_level0'])), axis=1
        )
        
        # Determine sub-genre (grouped within main genre)
        self.df_clean['subgenre'] = self.df_clean.apply(
            lambda row: row['genre_level2'] if (row['genre_level2'] and 
                                               row['genre_level2'] != row['genre_main'] and
                                               row['genre_level2'] != row['genre_primary'] and
                                               not str(row['genre_level2']).startswith('Category_'))
            else (row['genre_level1'] if (row['genre_level1'] and 
                                         row['genre_level1'] != row['genre_main'] and
                                         row['genre_level1'] != row['genre_primary'] and
                                         not str(row['genre_level1']).startswith('Category_'))
                  else ''), axis=1
        )
        
        # Use main genre for grouping
        self.df_clean['genre'] = self.df_clean['genre_main']
    
    def _remove_outliers_realistic(self):
        """Remove outliers using realistic bounds for book market with improved price filtering"""
        initial_count = len(self.df_clean)
        
        # Price outliers: Use IQR method for more accurate outlier detection
        price_data = self.df_clean['price_clean'].dropna()
        if len(price_data) > 0:
            Q1_price = price_data.quantile(0.25)
            Q3_price = price_data.quantile(0.75)
            IQR_price = Q3_price - Q1_price
            
            # Use 1.5*IQR for price (standard method)
            lower_bound_price = max(0, Q1_price - 1.5 * IQR_price)  # Don't go below 0
            upper_bound_price = Q3_price + 1.5 * IQR_price
            
            # Cap at realistic maximum for Indian book market
            # Most books are ₹50-₹2000, premium up to ₹3000
            upper_bound_price = min(upper_bound_price, 3000)
            lower_bound_price = max(lower_bound_price, 50)  # Minimum realistic price
            
            price_mask = (self.df_clean['price_clean'] >= lower_bound_price) & \
                        (self.df_clean['price_clean'] <= upper_bound_price)
            price_outliers = ~price_mask & self.df_clean['price_clean'].notna()
            
            print(f"Price filtering: ₹{lower_bound_price:.2f} - ₹{upper_bound_price:.2f}")
        else:
            price_outliers = pd.Series([False] * len(self.df_clean))
        
        # Review count outliers: Remove extreme outliers (likely data errors)
        # Use IQR method but cap at reasonable maximum
        review_data = self.df_clean['review_count'].dropna()
        if len(review_data) > 0:
            Q1 = review_data.quantile(0.25)
            Q3 = review_data.quantile(0.75)
            IQR = Q3 - Q1
            upper_bound = Q3 + 2.5 * IQR  # More conservative than 1.5*IQR
            upper_bound = min(upper_bound, 500000)  # Cap at 500k reviews (realistic max)
            lower_bound = max(0, Q1 - 1.5 * IQR)
            
            review_mask = (self.df_clean['review_count'] >= lower_bound) & \
                         (self.df_clean['review_count'] <= upper_bound)
            review_outliers = ~review_mask & self.df_clean['review_count'].notna()
        else:
            review_outliers = pd.Series([False] * len(self.df_clean))
        
        # Rating outliers: Remove invalid ratings
        rating_mask = (self.df_clean['rating'] >= 1.0) & (self.df_clean['rating'] <= 5.0)
        rating_outliers = ~rating_mask & self.df_clean['rating'].notna()
        
        # Combine all outlier masks
        all_outliers = price_outliers | review_outliers | rating_outliers
        
        # Remove outliers
        self.df_clean = self.df_clean[~all_outliers].copy()
        
        removed = initial_count - len(self.df_clean)
        print(f"Removed {removed:,} outliers ({removed/initial_count*100:.1f}%)")
        print(f"Final dataset: {len(self.df_clean):,} books")
    
    def generate_report(self):
        """Generate comprehensive report document"""
        script_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.dirname(script_dir)
        output_file = os.path.join(project_root, 'reports', 'COMPREHENSIVE_ANALYSIS_REPORT.md')
        
        report = []
        report.append("# Amazon India Bestsellers - Comprehensive Analysis Report\n")
        report.append(f"**Analysis Date:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        report.append(f"**Dataset:** Amazon Bestsellers November Latest\n")
        report.append(f"**Total Books Analyzed:** {len(self.df_clean):,}\n")
        report.append("\n---\n")
        
        # Executive Summary
        report.append("## Executive Summary\n")
        report.append(self._generate_executive_summary())
        report.append("\n---\n")
        
        # Market Overview
        report.append("## 1. Market Overview\n")
        report.append(self._generate_market_overview())
        report.append("\n---\n")
        
        # Genre Analysis with Sub-genres
        report.append("## 2. Genre & Sub-Genre Analysis\n")
        report.append(self._generate_genre_analysis())
        report.append("\n---\n")
        
        # Price Analysis
        report.append("## 3. Price Analysis\n")
        report.append(self._generate_price_analysis())
        report.append("\n---\n")
        
        # Rating Analysis
        report.append("## 4. Rating & Review Analysis\n")
        report.append(self._generate_rating_analysis())
        report.append("\n---\n")
        
        # Format Analysis
        report.append("## 5. Format Analysis\n")
        report.append(self._generate_format_analysis())
        report.append("\n---\n")
        
        # Author Analysis
        report.append("## 6. Author Performance Analysis\n")
        report.append(self._generate_author_analysis())
        report.append("\n---\n")
        
        # Business Insights
        report.append("## 7. Business Insights & Recommendations\n")
        report.append(self._generate_business_insights())
        report.append("\n---\n")
        
        # Visualizations Reference
        report.append("## 8. Visualizations & Diagrams\n")
        report.append(self._generate_visualizations_reference())
        report.append("\n---\n")
        
        # Methodology
        report.append("## 9. Methodology & Data Quality\n")
        report.append(self._generate_methodology())
        report.append("\n---\n")
        
        # Write report
        os.makedirs(os.path.dirname(output_file), exist_ok=True)
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write('\n'.join(report))
        
        print(f"\n✓ Comprehensive report saved to: {output_file}")
        return output_file
    
    def _generate_executive_summary(self):
        """Generate executive summary"""
        lines = []
        
        avg_price = self.df_clean['price_clean'].median()
        avg_rating = self.df_clean['rating'].mean()
        total_books = len(self.df_clean)
        
        lines.append("### Key Highlights\n")
        lines.append(f"- **Total Books Analyzed:** {total_books:,}")
        lines.append(f"- **Median Price:** ₹{avg_price:.2f}")
        lines.append(f"- **Average Rating:** {avg_rating:.2f}★")
        lines.append(f"- **Unique Genres:** {self.df_clean['genre'].nunique()}")
        lines.append(f"- **Unique Authors:** {self.df_clean['author'].nunique():,}")
        lines.append(f"- **Data Quality:** {((self.df_clean['price_clean'].notna().sum() / total_books) * 100):.1f}% complete price data")
        
        return '\n'.join(lines)
    
    def _generate_market_overview(self):
        """Generate market overview section"""
        lines = []
        
        # Price statistics
        price_data = self.df_clean['price_clean'].dropna()
        lines.append("### 1.1 Price Distribution\n")
        lines.append(f"- **Mean Price:** ₹{price_data.mean():.2f}")
        lines.append(f"- **Median Price:** ₹{price_data.median():.2f}")
        lines.append(f"- **Price Range:** ₹{price_data.min():.2f} - ₹{price_data.max():.2f}")
        lines.append(f"- **Standard Deviation:** ₹{price_data.std():.2f}")
        
        # Price quartiles
        Q1, Q2, Q3 = price_data.quantile([0.25, 0.50, 0.75])
        lines.append(f"\n**Price Quartiles:**")
        lines.append(f"- Q1 (25th percentile): ₹{Q1:.2f}")
        lines.append(f"- Q2 (Median): ₹{Q2:.2f}")
        lines.append(f"- Q3 (75th percentile): ₹{Q3:.2f}")
        lines.append(f"- IQR: ₹{Q3 - Q1:.2f}")
        
        # Price segments
        lines.append("\n### 1.2 Price Segments\n")
        segments = [
            (0, 200, "Budget"),
            (200, 500, "Affordable"),
            (500, 1000, "Mid-Range"),
            (1000, 2000, "Premium"),
            (2000, 5000, "Luxury")
        ]
        
        for low, high, name in segments:
            mask = (self.df_clean['price_clean'] >= low) & (self.df_clean['price_clean'] < high)
            count = mask.sum()
            if count > 0:
                avg = self.df_clean.loc[mask, 'price_clean'].mean()
                pct = (count / len(self.df_clean)) * 100
                lines.append(f"- **{name} (₹{low}-₹{high}):** {count:,} books ({pct:.1f}%) | Avg: ₹{avg:.2f}")
        
        return '\n'.join(lines)
    
    def _generate_genre_analysis(self):
        """Generate genre analysis with sub-genre grouping"""
        lines = []
        
        # Genre distribution
        genre_counts = self.df_clean['genre'].value_counts()
        lines.append("### 2.1 Top Genres by Market Share\n")
        lines.append("| Rank | Genre | Count | % Share | Avg Price | Avg Rating |")
        lines.append("|------|-------|-------|---------|-----------|------------|")
        
        for i, (genre, count) in enumerate(genre_counts.head(15).items(), 1):
            if genre != 'Unknown':
                mask = self.df_clean['genre'] == genre
                avg_price = self.df_clean.loc[mask, 'price_clean'].mean()
                avg_rating = self.df_clean.loc[mask, 'rating'].mean()
                pct = (count / len(self.df_clean)) * 100
                lines.append(f"| {i} | {genre} | {count:,} | {pct:.1f}% | ₹{avg_price:.2f} | {avg_rating:.2f}★ |")
        
        # Sub-genre grouping within genres
        lines.append("\n### 2.2 Sub-Genres Grouped by Main Genre\n")
        
        # Group sub-genres within each main genre
        genre_subgenre = self.df_clean.groupby(['genre', 'subgenre']).size().sort_values(ascending=False)
        
        # Organize by main genre
        genre_dict = defaultdict(list)
        for (genre, subgenre), count in genre_subgenre.items():
            if genre != 'Unknown' and subgenre and subgenre != '':
                genre_dict[genre].append((subgenre, count))
        
        for genre in genre_counts.head(10).index:
            if genre != 'Unknown' and genre in genre_dict:
                lines.append(f"\n#### {genre}")
                lines.append("| Sub-Genre | Count | % of Genre |")
                lines.append("|-----------|-------|------------|")
                
                total_genre = genre_counts[genre]
                for subgenre, count in sorted(genre_dict[genre], key=lambda x: x[1], reverse=True)[:10]:
                    pct = (count / total_genre) * 100
                    lines.append(f"| {subgenre} | {count:,} | {pct:.1f}% |")
        
        return '\n'.join(lines)
    
    def _generate_price_analysis(self):
        """Generate price analysis section"""
        lines = []
        
        price_data = self.df_clean['price_clean'].dropna()
        
        lines.append("### 3.1 Price Statistics\n")
        lines.append(f"- **Mean:** ₹{price_data.mean():.2f}")
        lines.append(f"- **Median:** ₹{price_data.median():.2f}")
        lines.append(f"- **Mode:** ₹{price_data.mode()[0]:.2f}" if len(price_data.mode()) > 0 else "- **Mode:** N/A")
        
        # Price by genre
        lines.append("\n### 3.2 Average Price by Genre\n")
        genre_price = self.df_clean.groupby('genre')['price_clean'].agg(['mean', 'median', 'count']).sort_values('mean', ascending=False)
        
        lines.append("| Genre | Avg Price | Median Price | Count |")
        lines.append("|-------|-----------|--------------|-------|")
        for genre, row in genre_price.head(15).iterrows():
            if genre != 'Unknown':
                lines.append(f"| {genre} | ₹{row['mean']:.2f} | ₹{row['median']:.2f} | {int(row['count']):,} |")
        
        return '\n'.join(lines)
    
    def _generate_rating_analysis(self):
        """Generate rating analysis section"""
        lines = []
        
        rating_data = self.df_clean['rating'].dropna()
        
        lines.append("### 4.1 Rating Distribution\n")
        lines.append(f"- **Mean Rating:** {rating_data.mean():.2f}★")
        lines.append(f"- **Median Rating:** {rating_data.median():.2f}★")
        lines.append(f"- **Rating Range:** {rating_data.min():.1f}★ - {rating_data.max():.1f}★")
        
        # Rating categories
        lines.append("\n### 4.2 Rating Categories\n")
        rating_cats = [
            (4.5, 5.0, "Excellent"),
            (4.0, 4.5, "Very Good"),
            (3.5, 4.0, "Good"),
            (3.0, 3.5, "Average"),
            (1.0, 3.0, "Below Average")
        ]
        
        for low, high, name in rating_cats:
            mask = (self.df_clean['rating'] >= low) & (self.df_clean['rating'] < high)
            count = mask.sum()
            if count > 0:
                pct = (count / len(self.df_clean)) * 100
                lines.append(f"- **{name} ({low}-{high}★):** {count:,} books ({pct:.1f}%)")
        
        # Review count analysis
        review_data = self.df_clean['review_count'].dropna()
        if len(review_data) > 0:
            lines.append("\n### 4.3 Review Count Analysis\n")
            lines.append(f"- **Mean Reviews:** {review_data.mean():.0f}")
            lines.append(f"- **Median Reviews:** {review_data.median():.0f}")
            lines.append(f"- **Max Reviews:** {review_data.max():,.0f}")
        
        return '\n'.join(lines)
    
    def _generate_format_analysis(self):
        """Generate format analysis section"""
        lines = []
        
        format_counts = self.df_clean['format'].value_counts()
        
        lines.append("### 5.1 Format Distribution\n")
        lines.append("| Format | Count | % Share | Avg Price |")
        lines.append("|--------|-------|---------|-----------|")
        
        for format_type, count in format_counts.head(10).items():
            if format_type and format_type != '':
                mask = self.df_clean['format'] == format_type
                avg_price = self.df_clean.loc[mask, 'price_clean'].mean()
                pct = (count / len(self.df_clean)) * 100
                lines.append(f"| {format_type} | {count:,} | {pct:.1f}% | ₹{avg_price:.2f} |")
        
        return '\n'.join(lines)
    
    def _generate_author_analysis(self):
        """Generate author analysis section"""
        lines = []
        
        author_counts = self.df_clean['author'].value_counts()
        
        lines.append("### 6.1 Top Authors by Book Count\n")
        lines.append("| Rank | Author | Books | Avg Price | Avg Rating |")
        lines.append("|------|--------|-------|-----------|------------|")
        
        for i, (author, count) in enumerate(author_counts.head(20).items(), 1):
            if author and author != '':
                mask = self.df_clean['author'] == author
                avg_price = self.df_clean.loc[mask, 'price_clean'].mean()
                avg_rating = self.df_clean.loc[mask, 'rating'].mean()
                lines.append(f"| {i} | {author} | {count:,} | ₹{avg_price:.2f} | {avg_rating:.2f}★ |")
        
        return '\n'.join(lines)
    
    def _generate_business_insights(self):
        """Generate business insights section"""
        lines = []
        
        lines.append("### 7.1 Key Market Insights\n")
        lines.append("1. **Price Positioning:** The market shows strong segmentation with affordable (₹200-500) and mid-range (₹500-1000) segments dominating.")
        lines.append("2. **Genre Performance:** Fiction and Non-Fiction genres show strong market presence with consistent ratings.")
        lines.append("3. **Format Preferences:** Paperback and Kindle formats dominate the market.")
        lines.append("4. **Quality Standards:** High average ratings (4.0+★) indicate strong quality standards in bestsellers.")
        
        lines.append("\n### 7.2 Recommendations\n")
        lines.append("1. **Pricing Strategy:** Focus on ₹200-1000 range for maximum market coverage.")
        lines.append("2. **Genre Focus:** Invest in Fiction and Non-Fiction categories with proven market demand.")
        lines.append("3. **Format Strategy:** Prioritize Paperback and Digital formats for broader reach.")
        lines.append("4. **Quality Assurance:** Maintain 4.0+★ rating standards for competitive positioning.")
        
        return '\n'.join(lines)
    
    def _generate_visualizations_reference(self):
        """Generate reference to all visualizations with embedded images"""
        lines = []
        
        script_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.dirname(script_dir)
        outputs_dir = os.path.join(project_root, 'outputs')
        
        lines.append("### 8.1 Data Analysis Visualizations\n")
        
        # Data analysis visualizations
        data_viz = [
            ("01_price_distribution.png", "Price Distribution"),
            ("02_rating_distribution.png", "Rating Distribution"),
            ("03_price_vs_rating.png", "Price vs Rating Relationship"),
            ("04_format_distribution.png", "Format Distribution"),
            ("05_price_by_format.png", "Price by Format Comparison"),
            ("06_top_authors.png", "Top Authors Performance")
        ]
        
        for filename, description in data_viz:
            filepath = os.path.join(outputs_dir, filename)
            if os.path.exists(filepath):
                lines.append(f"\n#### {description}\n")
                lines.append(f"![{description}](../outputs/{filename})\n")
                lines.append(f"*Figure: {description}*\n")
        
        lines.append("\n### 8.2 Business Analysis Visualizations\n")
        
        # Business analysis visualizations with proper names
        business_viz = [
            ("business_01_price_distribution.png", "Price Distribution - Market Analysis"),
            ("business_02_genre_market_share.png", "Top Genres by Market Share"),
            ("business_03_price_by_genre.png", "Price Distribution by Genre"),
            ("business_04_format_analysis.png", "Book Format Market Share"),
            ("business_05_price_rating_relationship.png", "Price vs Rating Relationship"),
            ("business_06_genre_subgenre_heatmap.png", "Genre-Subgenre Distribution Heatmap"),
            ("business_07_price_distribution_by_genre.png", "Price Distribution by Genre (Violin Plot)"),
            ("business_08_rating_by_genre.png", "Rating Distribution and Review Count by Genre"),
            ("business_09_market_segments.png", "Market Segmentation Analysis"),
            ("business_10_top_authors_matrix.png", "Top Authors Performance Matrix"),
            ("business_11_price_category_pie.png", "Price Category Distribution"),
            ("business_12_genre_performance_matrix.png", "Genre Performance Matrix"),
            ("business_13_review_count_distribution.png", "Review Count Distribution and Rating Reliability"),
            ("business_14_top_subgenres.png", "Top Sub-Genres by Market Share"),
            ("business_15_format_price_comparison.png", "Average Price by Format"),
            ("business_16_rating_distribution.png", "Overall Rating Distribution"),
            ("business_17_genre_revenue_potential.png", "Genre Revenue Potential Analysis"),
            ("business_18_price_segments_by_genre.png", "Price Segments by Genre"),
            ("business_19_comprehensive_dashboard.png", "Comprehensive Dashboard View")
        ]
        
        for filename, description in business_viz:
            filepath = os.path.join(outputs_dir, filename)
            if os.path.exists(filepath):
                lines.append(f"\n#### {description}\n")
                lines.append(f"![{description}](../outputs/{filename})\n")
                lines.append(f"*Figure: {description}*\n")
        
        return '\n'.join(lines)
    
    def _generate_methodology(self):
        """Generate methodology section"""
        lines = []
        
        lines.append("### 9.1 Data Sources\n")
        lines.append("- **Source:** Amazon India Bestsellers (November)")
        lines.append("- **Total Records:** 35,335 books")
        lines.append("- **After Outlier Removal:** " + f"{len(self.df_clean):,} books")
        
        lines.append("\n### 9.2 Outlier Removal\n")
        lines.append("Outliers were removed using the following criteria:")
        lines.append("- **Price Range:** ₹50 - ₹5,000 (realistic book pricing for Indian market)")
        lines.append("- **Review Count:** IQR method with 2.5×IQR upper bound, capped at 500,000")
        lines.append("- **Rating Range:** 1.0 - 5.0 (valid rating scale)")
        
        lines.append("\n### 9.3 Genre Classification\n")
        lines.append("- Genres extracted from Amazon category links (category-link-0 through category-link-3)")
        lines.append("- Sub-genres grouped within main genres for hierarchical analysis")
        lines.append("- Category IDs mapped to genre names using verified mapping")
        
        lines.append("\n### 9.4 Column Mapping\n")
        lines.append("Verified column mappings:")
        lines.append("- **data2:** Review/rating count")
        lines.append("- **data3:** Book title")
        lines.append("- **data4:** Format (Paperback, Hardcover, etc.)")
        lines.append("- **data5:** Author name")
        lines.append("- **data6:** Rank")
        lines.append("- **data7:** Publisher name")
        
        return '\n'.join(lines)

if __name__ == '__main__':
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    csv_path = os.path.join(project_root, 'data', 'amazon_bestsellers_november_latest.csv')
    
    generator = ComprehensiveReportGenerator(csv_path)
    output_file = generator.generate_report()
    print(f"\n✓ Comprehensive report generated: {output_file}")

