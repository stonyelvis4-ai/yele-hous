update products
set deleted_at = coalesce(deleted_at, now())
where id in ('robe-lagune', 'sac-ebene', 'parfum-soleil', 'manchette-bahia');

update collections
set deleted_at = coalesce(deleted_at, now())
where id in ('col-abidjan-soiree', 'col-essentiels-maison', 'col-parfums-ivoire');
