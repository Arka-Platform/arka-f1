"""
Amazon India Bestsellers - Quantitative Research Analysis
Applying best methodologies for data analysis and research
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from scipy import stats
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
import warnings
warnings.filterwarnings('ignore')

# Set style for better visualizations
plt.style.use('seaborn-v0_8-darkgrid')
sns.set_palette("husl")

class AmazonBestsellersAnalyzer:
    """Comprehensive analysis of Amazon India Bestsellers data"""
    
    def __init__(self, csv_path):
        """Initialize with data loading and cleaning"""
        self.csv_path = csv_path
        self.df = None
        self.df_clean = None
        self.genre_mapping = self._load_genre_mapping()
        self.load_and_clean_data()
    
    def _load_genre_mapping(self):
        """Load genre mapping from category links JSON file"""
        import json
        import os
        script_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.dirname(script_dir)
        mapping_file = os.path.join(project_root, 'data', 'category_genre_mapping.json')
        
        if os.path.exists(mapping_file):
            with open(mapping_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {}
    
    def _extract_genres_from_category_links(self):
        """Extract genres from category links using the mapping file"""
        import re
        
        print("Extracting genres from category links...")
        
        # Extract category IDs from URLs
        self.df_clean['category_id_0'] = self.df_clean['category-link-0'].astype(str).str.extract(r'/books/(\d+)/').fillna('')
        self.df_clean['category_id_1'] = self.df_clean['category-link-1'].astype(str).str.extract(r'/books/(\d+)/').fillna('')
        self.df_clean['category_id_2'] = self.df_clean['category-link-2'].astype(str).str.extract(r'/books/(\d+)/').fillna('')
        self.df_clean['category_id_3'] = self.df_clean['category-link-3'].astype(str).str.extract(r'/books/(\d+)/').fillna('')
        
        # Map category IDs to genre names
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
        
        # Determine primary genre
        self.df_clean['genre'] = self.df_clean.apply(
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
        
        print(f"  Extracted genres: {self.df_clean['genre'].nunique()} unique genres")
    
    def load_and_clean_data(self):
        """Load and clean the dataset with proper column mapping"""
        print("Loading data...")
        self.df = pd.read_csv(self.csv_path, low_memory=False)
        print(f"Original dataset shape: {self.df.shape}")
        
        # Create cleaned dataframe
        self.df_clean = self.df.copy()
        
        # Extract and clean price
        self.df_clean['price_clean'] = self.df_clean['price'].astype(str).str.replace('₹', '').str.replace(',', '').str.strip()
        self.df_clean['price_clean'] = pd.to_numeric(self.df_clean['price_clean'], errors='coerce')
        
        # Extract rating from "4.5 out of 5 stars"
        self.df_clean['rating'] = self.df_clean['data'].astype(str).str.extract(r'(\d+\.?\d*)').astype(float)
        
        # CORRECT COLUMN MAPPING (VERIFIED):
        # data2: review/rating count
        # data3: title (full title)
        # data4: format (Paperback, Hardcover, etc.)
        # data5: author
        # data6: rank (#1, #2, etc.)
        # data7: publisher
        
        # Extract review count (data2)
        self.df_clean['review_count'] = self.df_clean['data2'].astype(str).str.replace(',', '')
        self.df_clean['review_count'] = pd.to_numeric(self.df_clean['review_count'], errors='coerce')
        
        # Extract format (data4)
        self.df_clean['format'] = self.df_clean['data4'].astype(str).str.strip()
        
        # Extract author (data5)
        self.df_clean['author'] = self.df_clean['data5'].astype(str).str.strip()
        
        # Extract rank (data6)
        self.df_clean['rank'] = self.df_clean['data6'].astype(str).str.replace('#', '').str.strip()
        self.df_clean['rank'] = pd.to_numeric(self.df_clean['rank'], errors='coerce')
        
        # Extract publisher (data7)
        self.df_clean['publisher'] = self.df_clean['data7'].astype(str).str.strip()
        
        # Use data3 as title (verified correct)
        self.df_clean['title_clean'] = self.df_clean['data3'].astype(str).str.strip()
        
        # Extract genres from category links (INDUSTRY BEST PRACTICE)
        self._extract_genres_from_category_links()
        
        print(f"Cleaned dataset shape: {self.df_clean.shape}")
        print(f"Missing values:\n{self.df_clean[['price_clean', 'rating', 'review_count']].isnull().sum()}")
    
    def descriptive_statistics(self):
        """Generate comprehensive descriptive statistics"""
        print("\n" + "="*80)
        print("DESCRIPTIVE STATISTICS")
        print("="*80)
        
        numeric_cols = ['price_clean', 'rating', 'review_count', 'rank']
        stats_df = self.df_clean[numeric_cols].describe()
        
        print("\n1. Basic Statistics:")
        print(stats_df)
        
        print("\n2. Additional Metrics:")
        for col in numeric_cols:
            if self.df_clean[col].notna().sum() > 0:
                try:
                    col_data = pd.to_numeric(self.df_clean[col], errors='coerce').dropna()
                    if len(col_data) > 0:
                        print(f"\n{col.upper()}:")
                        print(f"  Mean: {col_data.mean():.2f}")
                        print(f"  Median: {col_data.median():.2f}")
                        print(f"  Std Dev: {col_data.std():.2f}")
                        print(f"  Skewness: {stats.skew(col_data):.2f}")
                        print(f"  Kurtosis: {stats.kurtosis(col_data):.2f}")
                except Exception as e:
                    print(f"\n{col.upper()}: Error calculating metrics - {str(e)}")
        
        return stats_df
    
    def price_analysis(self):
        """Comprehensive price analysis"""
        print("\n" + "="*80)
        print("PRICE ANALYSIS")
        print("="*80)
        
        price_data = self.df_clean['price_clean'].dropna()
        
        print(f"\n1. Price Distribution:")
        print(f"   Total books with price: {len(price_data)}")
        print(f"   Mean price: ₹{price_data.mean():.2f}")
        print(f"   Median price: ₹{price_data.median():.2f}")
        print(f"   Min price: ₹{price_data.min():.2f}")
        print(f"   Max price: ₹{price_data.max():.2f}")
        print(f"   Standard deviation: ₹{price_data.std():.2f}")
        
        # Price ranges
        print(f"\n2. Price Ranges:")
        ranges = [
            (0, 200, "Budget (₹0-200)"),
            (200, 500, "Affordable (₹200-500)"),
            (500, 1000, "Mid-range (₹500-1000)"),
            (1000, 2000, "Premium (₹1000-2000)"),
            (2000, float('inf'), "Luxury (₹2000+)")
        ]
        
        for min_price, max_price, label in ranges:
            count = len(price_data[(price_data >= min_price) & (price_data < max_price)])
            pct = (count / len(price_data)) * 100
            print(f"   {label}: {count} books ({pct:.1f}%)")
        
        return price_data
    
    def rating_analysis(self):
        """Rating and review analysis"""
        print("\n" + "="*80)
        print("RATING & REVIEW ANALYSIS")
        print("="*80)
        
        rating_data = self.df_clean['rating'].dropna()
        review_data = self.df_clean['review_count'].dropna()
        
        print(f"\n1. Rating Statistics:")
        print(f"   Mean rating: {rating_data.mean():.2f}/5.0")
        print(f"   Median rating: {rating_data.median():.2f}/5.0")
        print(f"   Books with 4.5+ stars: {len(rating_data[rating_data >= 4.5])} ({(len(rating_data[rating_data >= 4.5])/len(rating_data)*100):.1f}%)")
        print(f"   Books with 4.0+ stars: {len(rating_data[rating_data >= 4.0])} ({(len(rating_data[rating_data >= 4.0])/len(rating_data)*100):.1f}%)")
        
        print(f"\n2. Review Count Statistics:")
        print(f"   Mean reviews: {review_data.mean():.0f}")
        print(f"   Median reviews: {review_data.median():.0f}")
        print(f"   Books with 1000+ reviews: {len(review_data[review_data >= 1000])} ({(len(review_data[review_data >= 1000])/len(review_data)*100):.1f}%)")
        
        # Correlation analysis
        correlation = self.df_clean[['rating', 'review_count', 'price_clean']].corr()
        print(f"\n3. Correlations:")
        print(correlation)
        
        return rating_data, review_data
    
    def format_analysis(self):
        """Book format analysis"""
        print("\n" + "="*80)
        print("BOOK FORMAT ANALYSIS")
        print("="*80)
        
        format_counts = self.df_clean['format'].value_counts()
        print("\nFormat Distribution:")
        for format_type, count in format_counts.head(10).items():
            pct = (count / len(self.df_clean)) * 100
            print(f"   {format_type}: {count} ({pct:.1f}%)")
        
        # Price by format
        print("\nAverage Price by Format:")
        price_by_format = self.df_clean.groupby('format')['price_clean'].agg(['mean', 'count']).sort_values('count', ascending=False)
        price_by_format = price_by_format[price_by_format['count'] >= 10]  # Only formats with 10+ books
        for format_type, row in price_by_format.head(10).iterrows():
            print(f"   {format_type}: ₹{row['mean']:.2f} (n={int(row['count'])})")
        
        return format_counts
    
    def author_analysis(self):
        """Author and publisher analysis"""
        print("\n" + "="*80)
        print("AUTHOR & PUBLISHER ANALYSIS")
        print("="*80)
        
        # Top authors
        author_counts = self.df_clean['author'].value_counts()
        print(f"\n1. Top 10 Authors (by number of bestsellers):")
        for author, count in author_counts.head(10).items():
            print(f"   {author}: {count} books")
        
        # Top publishers
        publisher_counts = self.df_clean['publisher'].value_counts()
        print(f"\n2. Top 10 Publishers:")
        for publisher, count in publisher_counts.head(10).items():
            print(f"   {publisher}: {count} books")
        
        # Author performance (average rating)
        author_perf = self.df_clean.groupby('author').agg({
            'rating': 'mean',
            'review_count': 'mean',
            'price_clean': 'mean',
            'title': 'count'
        }).sort_values('title', ascending=False)
        author_perf = author_perf[author_perf['title'] >= 3]  # Authors with 3+ books
        
        print(f"\n3. Top Performing Authors (3+ books, by avg rating):")
        top_authors = author_perf.sort_values('rating', ascending=False).head(10)
        for author, row in top_authors.iterrows():
            print(f"   {author}: {row['rating']:.2f}★ avg, {int(row['title'])} books, ₹{row['price_clean']:.2f} avg price")
        
        return author_counts, publisher_counts
    
    def price_rating_relationship(self):
        """Analyze relationship between price and rating"""
        print("\n" + "="*80)
        print("PRICE-RATING RELATIONSHIP ANALYSIS")
        print("="*80)
        
        # Remove missing values
        analysis_df = self.df_clean[['price_clean', 'rating', 'review_count']].dropna()
        
        # Correlation
        corr = analysis_df['price_clean'].corr(analysis_df['rating'])
        print(f"\n1. Price-Rating Correlation: {corr:.4f}")
        
        # Statistical test
        if len(analysis_df) > 30:
            pearson_r, p_value = stats.pearsonr(analysis_df['price_clean'], analysis_df['rating'])
            print(f"   Pearson correlation: r={pearson_r:.4f}, p-value={p_value:.4f}")
            if p_value < 0.05:
                print("   ✓ Statistically significant relationship (p < 0.05)")
            else:
                print("   ✗ No statistically significant relationship")
        
        # Price by rating ranges
        print(f"\n2. Average Price by Rating Range:")
        rating_ranges = [
            (0, 3.5, "Low (0-3.5)"),
            (3.5, 4.0, "Medium (3.5-4.0)"),
            (4.0, 4.5, "High (4.0-4.5)"),
            (4.5, 5.0, "Very High (4.5-5.0)")
        ]
        
        for min_rating, max_rating, label in rating_ranges:
            subset = analysis_df[(analysis_df['rating'] >= min_rating) & (analysis_df['rating'] < max_rating)]
            if len(subset) > 0:
                avg_price = subset['price_clean'].mean()
                count = len(subset)
                print(f"   {label}: ₹{avg_price:.2f} (n={count})")
        
        return corr
    
    def market_segmentation(self):
        """Market segmentation using clustering"""
        print("\n" + "="*80)
        print("MARKET SEGMENTATION ANALYSIS")
        print("="*80)
        
        # Prepare data for clustering
        cluster_df = self.df_clean[['price_clean', 'rating', 'review_count']].dropna()
        
        if len(cluster_df) < 100:
            print("Insufficient data for clustering")
            return None
        
        # Standardize features
        scaler = StandardScaler()
        features = ['price_clean', 'rating', 'review_count']
        X_scaled = scaler.fit_transform(cluster_df[features])
        
        # K-means clustering
        n_clusters = 4
        kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
        cluster_df['segment'] = kmeans.fit_predict(X_scaled)
        
        print(f"\nMarket Segments (K-means, k={n_clusters}):")
        for i in range(n_clusters):
            segment = cluster_df[cluster_df['segment'] == i]
            print(f"\n   Segment {i+1} (n={len(segment)}):")
            print(f"      Avg Price: ₹{segment['price_clean'].mean():.2f}")
            print(f"      Avg Rating: {segment['rating'].mean():.2f}★")
            print(f"      Avg Reviews: {segment['review_count'].mean():.0f}")
        
        return cluster_df
    
    def generate_visualizations(self, output_dir='outputs'):
        """Generate comprehensive visualizations"""
        print("\n" + "="*80)
        print("GENERATING VISUALIZATIONS")
        print("="*80)
        
        import os
        os.makedirs(output_dir, exist_ok=True)
        
        # 1. Price Distribution
        plt.figure(figsize=(12, 6))
        price_data = self.df_clean['price_clean'].dropna()
        plt.hist(price_data, bins=50, edgecolor='black', alpha=0.7)
        plt.xlabel('Price (₹)', fontsize=12)
        plt.ylabel('Frequency', fontsize=12)
        plt.title('Distribution of Book Prices', fontsize=14, fontweight='bold')
        plt.axvline(price_data.mean(), color='red', linestyle='--', label=f'Mean: ₹{price_data.mean():.2f}')
        plt.axvline(price_data.median(), color='green', linestyle='--', label=f'Median: ₹{price_data.median():.2f}')
        plt.legend()
        plt.tight_layout()
        plt.savefig(f'{output_dir}/01_price_distribution.png', dpi=300, bbox_inches='tight')
        plt.close()
        print("✓ Saved: price_distribution.png")
        
        # 2. Rating Distribution
        plt.figure(figsize=(12, 6))
        rating_data = self.df_clean['rating'].dropna()
        plt.hist(rating_data, bins=20, edgecolor='black', alpha=0.7, color='orange')
        plt.xlabel('Rating (out of 5)', fontsize=12)
        plt.ylabel('Frequency', fontsize=12)
        plt.title('Distribution of Book Ratings', fontsize=14, fontweight='bold')
        plt.axvline(rating_data.mean(), color='red', linestyle='--', label=f'Mean: {rating_data.mean():.2f}')
        plt.legend()
        plt.tight_layout()
        plt.savefig(f'{output_dir}/02_rating_distribution.png', dpi=300, bbox_inches='tight')
        plt.close()
        print("✓ Saved: rating_distribution.png")
        
        # 3. Price vs Rating Scatter
        plt.figure(figsize=(12, 8))
        analysis_df = self.df_clean[['price_clean', 'rating']].dropna()
        plt.scatter(analysis_df['price_clean'], analysis_df['rating'], alpha=0.5, s=50)
        plt.xlabel('Price (₹)', fontsize=12)
        plt.ylabel('Rating (out of 5)', fontsize=12)
        plt.title('Price vs Rating Relationship', fontsize=14, fontweight='bold')
        
        # Add trend line
        z = np.polyfit(analysis_df['price_clean'], analysis_df['rating'], 1)
        p = np.poly1d(z)
        plt.plot(analysis_df['price_clean'], p(analysis_df['price_clean']), "r--", alpha=0.8, linewidth=2)
        
        plt.tight_layout()
        plt.savefig(f'{output_dir}/03_price_vs_rating.png', dpi=300, bbox_inches='tight')
        plt.close()
        print("✓ Saved: price_vs_rating.png")
        
        # 4. Format Distribution
        plt.figure(figsize=(12, 6))
        format_counts = self.df_clean['format'].value_counts().head(10)
        format_counts.plot(kind='bar', color='steelblue')
        plt.xlabel('Book Format', fontsize=12)
        plt.ylabel('Count', fontsize=12)
        plt.title('Top 10 Book Formats', fontsize=14, fontweight='bold')
        plt.xticks(rotation=45, ha='right')
        plt.tight_layout()
        plt.savefig(f'{output_dir}/04_format_distribution.png', dpi=300, bbox_inches='tight')
        plt.close()
        print("✓ Saved: format_distribution.png")
        
        # 5. Price by Format Box Plot
        plt.figure(figsize=(14, 8))
        top_formats = self.df_clean['format'].value_counts().head(8).index
        format_price_df = self.df_clean[self.df_clean['format'].isin(top_formats)]
        format_price_df = format_price_df[format_price_df['price_clean'].notna()]
        
        sns.boxplot(data=format_price_df, x='format', y='price_clean')
        plt.xlabel('Book Format', fontsize=12)
        plt.ylabel('Price (₹)', fontsize=12)
        plt.title('Price Distribution by Format', fontsize=14, fontweight='bold')
        plt.xticks(rotation=45, ha='right')
        plt.tight_layout()
        plt.savefig(f'{output_dir}/05_price_by_format.png', dpi=300, bbox_inches='tight')
        plt.close()
        print("✓ Saved: price_by_format.png")
        
        # 6. Top Authors
        plt.figure(figsize=(12, 8))
        top_authors = self.df_clean['author'].value_counts().head(15)
        top_authors.plot(kind='barh', color='coral')
        plt.xlabel('Number of Bestsellers', fontsize=12)
        plt.ylabel('Author', fontsize=12)
        plt.title('Top 15 Authors by Number of Bestsellers', fontsize=14, fontweight='bold')
        plt.tight_layout()
        plt.savefig(f'{output_dir}/06_top_authors.png', dpi=300, bbox_inches='tight')
        plt.close()
        print("✓ Saved: top_authors.png")
        
        print(f"\nAll visualizations saved to '{output_dir}/' directory")
    
    def generate_report(self, output_file='reports/analysis_report.txt'):
        """Generate comprehensive research report"""
        print("\n" + "="*80)
        print("GENERATING RESEARCH REPORT")
        print("="*80)
        
        import os
        os.makedirs(os.path.dirname(output_file), exist_ok=True)
        
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write("="*80 + "\n")
            f.write("AMAZON INDIA BESTSELLERS - QUANTITATIVE RESEARCH REPORT\n")
            f.write("="*80 + "\n\n")
            
            f.write("EXECUTIVE SUMMARY\n")
            f.write("-"*80 + "\n")
            f.write(f"Dataset: November Bestsellers Amazon India\n")
            f.write(f"Total Records: {len(self.df_clean)}\n")
            f.write(f"Analysis Date: {pd.Timestamp.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
            
            # Key Findings
            f.write("KEY FINDINGS\n")
            f.write("-"*80 + "\n")
            
            price_data = self.df_clean['price_clean'].dropna()
            rating_data = self.df_clean['rating'].dropna()
            
            f.write(f"1. Price Analysis:\n")
            f.write(f"   - Average book price: ₹{price_data.mean():.2f}\n")
            f.write(f"   - Median book price: ₹{price_data.median():.2f}\n")
            f.write(f"   - Price range: ₹{price_data.min():.2f} - ₹{price_data.max():.2f}\n\n")
            
            f.write(f"2. Rating Analysis:\n")
            f.write(f"   - Average rating: {rating_data.mean():.2f}/5.0\n")
            f.write(f"   - {len(rating_data[rating_data >= 4.5])} books ({len(rating_data[rating_data >= 4.5])/len(rating_data)*100:.1f}%) have 4.5+ stars\n\n")
            
            f.write(f"3. Format Distribution:\n")
            top_format = self.df_clean['format'].value_counts().index[0]
            top_format_count = self.df_clean['format'].value_counts().iloc[0]
            f.write(f"   - Most common format: {top_format} ({top_format_count} books)\n\n")
            
            f.write(f"4. Author Analysis:\n")
            top_author = self.df_clean['author'].value_counts().index[0]
            top_author_count = self.df_clean['author'].value_counts().iloc[0]
            f.write(f"   - Most prolific author: {top_author} ({top_author_count} bestsellers)\n\n")
            
            # Statistical Analysis
            f.write("STATISTICAL ANALYSIS\n")
            f.write("-"*80 + "\n")
            
            analysis_df = self.df_clean[['price_clean', 'rating']].dropna()
            if len(analysis_df) > 30:
                corr, p_val = stats.pearsonr(analysis_df['price_clean'], analysis_df['rating'])
                f.write(f"Price-Rating Correlation: r={corr:.4f}, p-value={p_val:.4f}\n")
                if p_val < 0.05:
                    f.write("Interpretation: Statistically significant relationship between price and rating.\n")
                else:
                    f.write("Interpretation: No statistically significant relationship found.\n")
            
            f.write("\n" + "="*80 + "\n")
            f.write("END OF REPORT\n")
            f.write("="*80 + "\n")
        
        print(f"✓ Report saved to: {output_file}")
    
    def run_full_analysis(self):
        """Run complete analysis pipeline"""
        print("\n" + "="*80)
        print("AMAZON INDIA BESTSELLERS - COMPREHENSIVE QUANTITATIVE ANALYSIS")
        print("="*80)
        
        # Run all analyses
        self.descriptive_statistics()
        self.price_analysis()
        self.rating_analysis()
        self.format_analysis()
        self.author_analysis()
        self.price_rating_relationship()
        self.market_segmentation()
        
        # Generate outputs
        self.generate_visualizations()
        self.generate_report()
        
        print("\n" + "="*80)
        print("ANALYSIS COMPLETE!")
        print("="*80)
        print("\nOutputs generated:")
        print("  - Visualizations: outputs/")
        print("  - Research Report: reports/analysis_report.txt")
        print("\nKey insights available in the report and visualizations.")


if __name__ == "__main__":
    # Run analysis
    import os
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_path = os.path.join(script_dir, '..', 'data', 'amazon_bestsellers_november_latest.csv')
    analyzer = AmazonBestsellersAnalyzer(data_path)
    analyzer.run_full_analysis()

