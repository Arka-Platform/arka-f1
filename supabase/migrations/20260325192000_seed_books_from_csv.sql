-- Seed public.books from TOP_100_BY_RATING_COUNT.csv (idempotent).
-- Source file: amazon-bestsellers-analysis/reports/TOP_100_BY_RATING_COUNT.csv
-- Idempotency: dedupe by (lower(title), lower(author)).

with seed(title, author, description, genre, subcategory, credit_price) as (
  values
    ('A Court of Mist and Fury: The second book in the GLOBALLY BESTSELLING, SENSATIONAL series (A Court of Thorns and Roses 2)', 'Sarah J. Maas', null, 'Comic Books', 'Comic Books', 335.3),
    ('The Fault in Our Stars', 'John Green', null, 'Graphic Novels', 'Graphic Novels', 274.0),
    ('1984 (Deluxe Hardbound Edition)', 'George Orwell', null, 'Children''s Reference', 'Children''s Reference', 439.0),
    ('Normal People', 'Sally Rooney', null, 'Travel Guides', 'Travel Guides', 360.0),
    ('Icebreaker', 'HANNAH GRACE', null, 'Horror Fiction', 'Horror Fiction', 300.0),
    ('How to Win Friends and Influence People: Original Classic Edition | Premium Paperback', 'Dale Carnegie', null, 'Children''s Fiction', 'Children''s Fiction', 119.0),
    ('The Ballad of Songbirds and Snakes (A Hunger Games Novel) (The Hunger Games)', 'Suzanne Collins', null, 'Graphic Novels', 'Graphic Novels', 363.85),
    ('The Ballad of Songbirds and Snakes (A Hunger Games Novel)', 'Suzanne Collins', null, 'Graphic Novels', 'Graphic Novels', 838.0),
    ('Untitled Panem Novel', 'Suzanne Collins', null, 'Graphic Novels', 'Graphic Novels', 2275.0),
    ('Zodiac Academy 3: The Reckoning', 'Caroline Peckham', null, 'Graphic Novels', 'Graphic Novels', 449.0),
    ('The Hunger Games', 'Suzanne Collins', null, 'Horror Fiction', 'Horror Fiction', 499.0),
    ('The Hunger Games (Hunger Games Trilogy, Book 1)', 'Suzanne Collins', null, 'Comic Books', 'Comic Books', 275.5),
    ('HUNGER GAMES01: 1 (The Hunger games)', 'Suzanne Collins', null, 'Graphic Novels', 'Graphic Novels', 1749.0),
    ('Mockingjay: TikTok made me buy it! The third book in the international No.1 bestselling series: 3 (The Hunger Games)', 'Suzanne Collins', null, 'Graphic Novels', 'Graphic Novels', 420.0),
    ('HUNGER GAMES03 MOCKINGJAY', 'Suzanne Collins', null, 'Graphic Novels', 'Graphic Novels', 1749.0),
    ('The Boys in the Boat', 'Daniel James Brown', null, 'Literary Fiction', 'Literary Fiction', 434.0),
    ('The Boys in the Boat: Nine Americans and Their Epic Quest for Gold at the 1936 Berlin Olympics', 'Daniel James Brown', null, 'Literary Fiction', 'Literary Fiction', 935.0)
),
deduped as (
  select s.*
  from seed s
  where not exists (
    select 1
    from public.books b
    where lower(b.title) = lower(s.title)
      and lower(b.author) = lower(s.author)
  )
)
insert into public.books (title, author, description, genre, category, subcategory, credit_price, owner_id, status)
select
  title,
  author,
  description,
  genre,
  'Amazon Bestsellers'::text as category,
  subcategory,
  credit_price,
  null::uuid as owner_id,
  'AVAILABLE'::text as status
from deduped;
