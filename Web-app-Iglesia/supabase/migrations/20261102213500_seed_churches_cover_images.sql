-- Migration: 20261102213500_seed_churches_cover_images.sql
-- Assigns representative church images to public.churches by slug.

update public.churches set cover_path = '/images/churches/catedral-san-ildefonso.png' where slug = 'catedral-san-ildefonso';
update public.churches set cover_path = '/images/churches/jesus-tercera-orden.jpg' where slug = 'jesus-tercera-orden';
update public.churches set cover_path = '/images/churches/la-candelaria.jpg' where slug = 'la-candelaria';
update public.churches set cover_path = '/images/churches/santa-lucia.jpg' where slug = 'santa-lucia';
update public.churches set cover_path = '/images/churches/san-juan-de-dios.jpg' where slug = 'san-juan-de-dios';
update public.churches set cover_path = '/images/churches/santa-ana.jpg' where slug = 'santa-ana';
update public.churches set cover_path = '/images/churches/la-mejorada.jpg' where slug = 'la-mejorada';
update public.churches set cover_path = '/images/churches/san-cristobal.jpg' where slug = 'san-cristobal';
update public.churches set cover_path = '/images/churches/santiago.jpg' where slug = 'santiago';
update public.churches set cover_path = '/images/churches/santa-isabel.jpg' where slug = 'santa-isabel';
