-- Seed public.books from TOP_100_BY_RATING_COUNT.csv (idempotent).
-- Source file: amazon-bestsellers-analysis/reports/TOP_100_BY_RATING_COUNT.csv
-- Idempotency: dedupe by (lower(title), lower(author)).

with seed(title, author, description, genre, subcategory, credit_price, image_url, thumbnail_url) as (
  values
    ('A Court of Mist and Fury: The second book in the GLOBALLY BESTSELLING, SENSATIONAL series (A Court of Thorns and Roses 2)', 'Sarah J. Maas', null, 'Comic Books', 'Comic Books', 335.3, 'https://images-eu.ssl-images-amazon.com/images/I/81zCK5-V09L._AC_UL900_SR900,600_.jpg', 'https://images-eu.ssl-images-amazon.com/images/I/81zCK5-V09L._AC_UL900_SR900,600_.jpg'),
    ('The Fault in Our Stars', 'John Green', null, 'Graphic Novels', 'Graphic Novels', 274.0, 'https://images-eu.ssl-images-amazon.com/images/I/A1c9bOWb6RL._AC_UL300_SR300,200_.jpg', 'https://images-eu.ssl-images-amazon.com/images/I/A1c9bOWb6RL._AC_UL300_SR300,200_.jpg'),
    ('1984 (Deluxe Hardbound Edition)', 'George Orwell', null, 'Children''s Reference', 'Children''s Reference', 439.0, 'https://images-eu.ssl-images-amazon.com/images/I/81vHA1+GmhS._AC_UL300_SR300,200_.jpg', 'https://images-eu.ssl-images-amazon.com/images/I/81vHA1+GmhS._AC_UL300_SR300,200_.jpg'),
    ('Normal People', 'Sally Rooney', null, 'Travel Guides', 'Travel Guides', 360.0, 'https://images-eu.ssl-images-amazon.com/images/I/61nFGO425OL._AC_UL600_SR600,400_.jpg', 'https://images-eu.ssl-images-amazon.com/images/I/61nFGO425OL._AC_UL600_SR600,400_.jpg'),
    ('Icebreaker', 'HANNAH GRACE', null, 'Horror Fiction', 'Horror Fiction', 300.0, 'https://images-eu.ssl-images-amazon.com/images/I/71pt0UrzwLL._AC_UL900_SR900,600_.jpg', 'https://images-eu.ssl-images-amazon.com/images/I/71pt0UrzwLL._AC_UL900_SR900,600_.jpg'),
    ('How to Win Friends and Influence People: Original Classic Edition | Premium Paperback', 'Dale Carnegie', null, 'Children''s Fiction', 'Children''s Fiction', 119.0, 'https://images-eu.ssl-images-amazon.com/images/I/71wrQ0bR8+S._AC_UL600_SR600,400_.jpg', 'https://images-eu.ssl-images-amazon.com/images/I/71wrQ0bR8+S._AC_UL600_SR600,400_.jpg'),
    ('The Ballad of Songbirds and Snakes (A Hunger Games Novel) (The Hunger Games)', 'Suzanne Collins', null, 'Graphic Novels', 'Graphic Novels', 363.85, 'https://images-eu.ssl-images-amazon.com/images/I/91XR4jelO5L._AC_UL300_SR300,200_.jpg', 'https://images-eu.ssl-images-amazon.com/images/I/91XR4jelO5L._AC_UL300_SR300,200_.jpg'),
    ('The Ballad of Songbirds and Snakes (A Hunger Games Novel)', 'Suzanne Collins', null, 'Graphic Novels', 'Graphic Novels', 838.0, 'https://images-eu.ssl-images-amazon.com/images/I/61eV1rw7cfL._AC_UL300_SR300,200_.jpg', 'https://images-eu.ssl-images-amazon.com/images/I/61eV1rw7cfL._AC_UL300_SR300,200_.jpg'),
    ('Untitled Panem Novel', 'Suzanne Collins', null, 'Graphic Novels', 'Graphic Novels', 2275.0, 'https://images-eu.ssl-images-amazon.com/images/I/819tY-gDcWL._AC_UL300_SR300,200_.jpg', 'https://images-eu.ssl-images-amazon.com/images/I/819tY-gDcWL._AC_UL300_SR300,200_.jpg'),
    ('Zodiac Academy 3: The Reckoning', 'Caroline Peckham', null, 'Graphic Novels', 'Graphic Novels', 449.0, 'https://images-eu.ssl-images-amazon.com/images/I/91G0zfKM87L._UX300__PJku-sticker-v8,TopRight,0,-50_AC_UL300_SR300,200_.jpg', 'https://images-eu.ssl-images-amazon.com/images/I/91G0zfKM87L._UX300__PJku-sticker-v8,TopRight,0,-50_AC_UL300_SR300,200_.jpg'),
    ('The Hunger Games', 'Suzanne Collins', null, 'Horror Fiction', 'Horror Fiction', 499.0, 'https://images-eu.ssl-images-amazon.com/images/I/61m1L9T31sL._AC_UL600_SR600,400_.jpg', 'https://images-eu.ssl-images-amazon.com/images/I/61m1L9T31sL._AC_UL600_SR600,400_.jpg'),
    ('The Hunger Games (Hunger Games Trilogy, Book 1)', 'Suzanne Collins', null, 'Comic Books', 'Comic Books', 275.5, 'https://images-eu.ssl-images-amazon.com/images/I/81qPd0bhz0L._AC_UL600_SR600,400_.jpg', 'https://images-eu.ssl-images-amazon.com/images/I/81qPd0bhz0L._AC_UL600_SR600,400_.jpg'),
    ('HUNGER GAMES01: 1 (The Hunger games)', 'Suzanne Collins', null, 'Graphic Novels', 'Graphic Novels', 1749.0, 'https://images-eu.ssl-images-amazon.com/images/I/71un2hI4mcL._AC_UL300_SR300,200_.jpg', 'https://images-eu.ssl-images-amazon.com/images/I/71un2hI4mcL._AC_UL300_SR300,200_.jpg'),
    ('Mockingjay: TikTok made me buy it! The third book in the international No.1 bestselling series: 3 (The Hunger Games)', 'Suzanne Collins', null, 'Graphic Novels', 'Graphic Novels', 420.0, 'https://images-eu.ssl-images-amazon.com/images/I/61+K+x5t7xL._AC_UL300_SR300,200_.jpg', 'https://images-eu.ssl-images-amazon.com/images/I/61+K+x5t7xL._AC_UL300_SR300,200_.jpg'),
    ('HUNGER GAMES03 MOCKINGJAY', 'Suzanne Collins', null, 'Graphic Novels', 'Graphic Novels', 1749.0, 'https://images-eu.ssl-images-amazon.com/images/I/51XZ1AO-6nL._AC_UL300_SR300,200_.jpg', 'https://images-eu.ssl-images-amazon.com/images/I/51XZ1AO-6nL._AC_UL300_SR300,200_.jpg'),
    ('The Boys in the Boat', 'Daniel James Brown', null, 'Literary Fiction', 'Literary Fiction', 434.0, 'https://images-eu.ssl-images-amazon.com/images/I/81E8gpUg3-L._AC_UL900_SR900,600_.jpg', 'https://images-eu.ssl-images-amazon.com/images/I/81E8gpUg3-L._AC_UL900_SR900,600_.jpg'),
    ('The Boys in the Boat: Nine Americans and Their Epic Quest for Gold at the 1936 Berlin Olympics', 'Daniel James Brown', null, 'Literary Fiction', 'Literary Fiction', 935.0, 'https://images-eu.ssl-images-amazon.com/images/I/81uQRVpi2UL._AC_UL900_SR900,600_.jpg', 'https://images-eu.ssl-images-amazon.com/images/I/81uQRVpi2UL._AC_UL900_SR900,600_.jpg')
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
insert into public.books (title, author, description, genre, category, subcategory, credit_price, owner_id, status, image_url, thumbnail_url)
select
  title,
  author,
  description,
  genre,
  'Amazon Bestsellers'::text as category,
  subcategory,
  credit_price,
  null::uuid as owner_id,
  'AVAILABLE'::text as status,
  image_url,
  thumbnail_url
from deduped;
