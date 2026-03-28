-- Backfill image_url / thumbnail_url for catalog rows that already existed when
-- 20260325192000_seed_books_from_csv ran (that migration skips duplicates).
-- Same title+author keys as the seed VALUES.

with seed(title, author, image_url, thumbnail_url) as (
  values
    ('A Court of Mist and Fury: The second book in the GLOBALLY BESTSELLING, SENSATIONAL series (A Court of Thorns and Roses 2)', 'Sarah J. Maas', 'https://images-eu.ssl-images-amazon.com/images/I/81zCK5-V09L._AC_UL900_SR900,600_.jpg', 'https://images-eu.ssl-images-amazon.com/images/I/81zCK5-V09L._AC_UL900_SR900,600_.jpg'),
    ('The Fault in Our Stars', 'John Green', 'https://images-eu.ssl-images-amazon.com/images/I/A1c9bOWb6RL._AC_UL300_SR300,200_.jpg', 'https://images-eu.ssl-images-amazon.com/images/I/A1c9bOWb6RL._AC_UL300_SR300,200_.jpg'),
    ('1984 (Deluxe Hardbound Edition)', 'George Orwell', 'https://images-eu.ssl-images-amazon.com/images/I/81vHA1+GmhS._AC_UL300_SR300,200_.jpg', 'https://images-eu.ssl-images-amazon.com/images/I/81vHA1+GmhS._AC_UL300_SR300,200_.jpg'),
    ('Normal People', 'Sally Rooney', 'https://images-eu.ssl-images-amazon.com/images/I/61nFGO425OL._AC_UL600_SR600,400_.jpg', 'https://images-eu.ssl-images-amazon.com/images/I/61nFGO425OL._AC_UL600_SR600,400_.jpg'),
    ('Icebreaker', 'HANNAH GRACE', 'https://images-eu.ssl-images-amazon.com/images/I/71pt0UrzwLL._AC_UL900_SR900,600_.jpg', 'https://images-eu.ssl-images-amazon.com/images/I/71pt0UrzwLL._AC_UL900_SR900,600_.jpg'),
    ('How to Win Friends and Influence People: Original Classic Edition | Premium Paperback', 'Dale Carnegie', 'https://images-eu.ssl-images-amazon.com/images/I/71wrQ0bR8+S._AC_UL600_SR600,400_.jpg', 'https://images-eu.ssl-images-amazon.com/images/I/71wrQ0bR8+S._AC_UL600_SR600,400_.jpg'),
    ('The Ballad of Songbirds and Snakes (A Hunger Games Novel) (The Hunger Games)', 'Suzanne Collins', 'https://images-eu.ssl-images-amazon.com/images/I/91XR4jelO5L._AC_UL300_SR300,200_.jpg', 'https://images-eu.ssl-images-amazon.com/images/I/91XR4jelO5L._AC_UL300_SR300,200_.jpg'),
    ('The Ballad of Songbirds and Snakes (A Hunger Games Novel)', 'Suzanne Collins', 'https://images-eu.ssl-images-amazon.com/images/I/61eV1rw7cfL._AC_UL300_SR300,200_.jpg', 'https://images-eu.ssl-images-amazon.com/images/I/61eV1rw7cfL._AC_UL300_SR300,200_.jpg'),
    ('Untitled Panem Novel', 'Suzanne Collins', 'https://images-eu.ssl-images-amazon.com/images/I/819tY-gDcWL._AC_UL300_SR300,200_.jpg', 'https://images-eu.ssl-images-amazon.com/images/I/819tY-gDcWL._AC_UL300_SR300,200_.jpg'),
    ('Zodiac Academy 3: The Reckoning', 'Caroline Peckham', 'https://images-eu.ssl-images-amazon.com/images/I/91G0zfKM87L._UX300__PJku-sticker-v8,TopRight,0,-50_AC_UL300_SR300,200_.jpg', 'https://images-eu.ssl-images-amazon.com/images/I/91G0zfKM87L._UX300__PJku-sticker-v8,TopRight,0,-50_AC_UL300_SR300,200_.jpg'),
    ('The Hunger Games', 'Suzanne Collins', 'https://images-eu.ssl-images-amazon.com/images/I/61m1L9T31sL._AC_UL600_SR600,400_.jpg', 'https://images-eu.ssl-images-amazon.com/images/I/61m1L9T31sL._AC_UL600_SR600,400_.jpg'),
    ('The Hunger Games (Hunger Games Trilogy, Book 1)', 'Suzanne Collins', 'https://images-eu.ssl-images-amazon.com/images/I/81qPd0bhz0L._AC_UL600_SR600,400_.jpg', 'https://images-eu.ssl-images-amazon.com/images/I/81qPd0bhz0L._AC_UL600_SR600,400_.jpg'),
    ('HUNGER GAMES01: 1 (The Hunger games)', 'Suzanne Collins', 'https://images-eu.ssl-images-amazon.com/images/I/71un2hI4mcL._AC_UL300_SR300,200_.jpg', 'https://images-eu.ssl-images-amazon.com/images/I/71un2hI4mcL._AC_UL300_SR300,200_.jpg'),
    ('Mockingjay: TikTok made me buy it! The third book in the international No.1 bestselling series: 3 (The Hunger Games)', 'Suzanne Collins', 'https://images-eu.ssl-images-amazon.com/images/I/61+K+x5t7xL._AC_UL300_SR300,200_.jpg', 'https://images-eu.ssl-images-amazon.com/images/I/61+K+x5t7xL._AC_UL300_SR300,200_.jpg'),
    ('HUNGER GAMES03 MOCKINGJAY', 'Suzanne Collins', 'https://images-eu.ssl-images-amazon.com/images/I/51XZ1AO-6nL._AC_UL300_SR300,200_.jpg', 'https://images-eu.ssl-images-amazon.com/images/I/51XZ1AO-6nL._AC_UL300_SR300,200_.jpg'),
    ('The Boys in the Boat', 'Daniel James Brown', 'https://images-eu.ssl-images-amazon.com/images/I/81E8gpUg3-L._AC_UL900_SR900,600_.jpg', 'https://images-eu.ssl-images-amazon.com/images/I/81E8gpUg3-L._AC_UL900_SR900,600_.jpg'),
    ('The Boys in the Boat: Nine Americans and Their Epic Quest for Gold at the 1936 Berlin Olympics', 'Daniel James Brown', 'https://images-eu.ssl-images-amazon.com/images/I/81uQRVpi2UL._AC_UL900_SR900,600_.jpg', 'https://images-eu.ssl-images-amazon.com/images/I/81uQRVpi2UL._AC_UL900_SR900,600_.jpg')
)
update public.books b
set
  image_url = s.image_url,
  thumbnail_url = s.thumbnail_url
from seed s
where lower(b.title) = lower(s.title)
  and lower(b.author) = lower(s.author);
