INSERT INTO delivery_communes (id, name, delivery_price, is_active)
VALUES
  ('COM-1', 'Cocody', 5000, TRUE),
  ('COM-2', 'Plateau', 4500, TRUE),
  ('COM-3', 'Marcory', 3500, TRUE),
  ('COM-4', 'DeuxPlateaux', 4000, TRUE),
  ('COM-5', 'Zone4', 3000, TRUE),
  ('COM-6', 'Yopougon', 6000, TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO products (
  id, name, category, collection_id, price, compare_at_price, description, material, colors, sizes, stock, is_best_seller, image
)
VALUES
  (
    'robe-lagune',
    'Robe Lagune Noire',
    'Vetements',
    'col-abidjan-soiree',
    185000,
    220000,
    'Une robe colonne satinee a la ligne nette, pensee pour les soirees d''Abidjan.',
    'Satin duchesse et soie legere',
    ARRAY['Noir minuit', 'Rose poudree'],
    ARRAY['XS', 'S', 'M', 'L'],
    8,
    TRUE,
    'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=80'
  ),
  (
    'sac-ebene',
    'Sac Ebene Signature',
    'Sacs',
    'col-essentiels-maison',
    245000,
    NULL,
    'Un sac structure en cuir graine avec poignee sculpturale et doublure bordeaux.',
    'Cuir pleine fleur',
    ARRAY['Ebene', 'Ivoire fume'],
    ARRAY['Unique'],
    5,
    FALSE,
    'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1200&q=80'
  ),
  (
    'parfum-soleil',
    'Extrait Soleil d''Eburnie',
    'Parfums',
    'col-parfums-ivoire',
    95000,
    NULL,
    'Tubereuse, poivre rose et bois ambres dans un sillage intimiste.',
    'Extrait 50ml',
    ARRAY['Flacon or rose'],
    ARRAY['50ml', '100ml'],
    19,
    TRUE,
    'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=1200&q=80'
  ),
  (
    'manchette-bahia',
    'Manchette Bahia',
    'Accessoires',
    'col-essentiels-maison',
    65000,
    NULL,
    'Une manchette polie, large et lumineuse, pour rehausser une silhouette minimaliste.',
    'Laiton plaque or',
    ARRAY['Or champagne', 'Prune laquee'],
    ARRAY['Unique'],
    12,
    FALSE,
    'https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=1200&q=80'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO orders (
  id, customer_name, phone, commune, notes, subtotal, shipping, total, status, created_at
)
VALUES
  (
    'CMD-2401',
    'Awa Kone',
    '2250700001111',
    'Cocody',
    'Livraison en soiree',
    185000,
    5000,
    190000,
    'Livree',
    '2026-07-01T15:30:00.000Z'
  ),
  (
    'CMD-2402',
    'Nadia Traore',
    '2250500002222',
    'Zone4',
    'Cadeau anniversaire',
    95000,
    3000,
    98000,
    'En attente',
    '2026-07-02T10:00:00.000Z'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO order_items (order_id, product_id, name, price, color, size, quantity, image)
SELECT *
FROM (
  VALUES
    (
      'CMD-2401',
      'robe-lagune',
      'Robe Lagune Noire',
      185000,
      'Noir minuit',
      'M',
      1,
      'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=80'
    ),
    (
      'CMD-2402',
      'parfum-soleil',
      'Extrait Soleil d''Eburnie',
      95000,
      'Flacon or rose',
      '100ml',
      1,
      'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=1200&q=80'
    )
) AS seed(order_id, product_id, name, price, color, size, quantity, image)
WHERE NOT EXISTS (
  SELECT 1
  FROM order_items oi
  WHERE oi.order_id = seed.order_id
    AND oi.product_id = seed.product_id
    AND oi.color = seed.color
    AND oi.size = seed.size
);

INSERT INTO reviews (id, author, rating, title, body, created_at)
VALUES
  (
    'AV-001',
    'Ines D.',
    5,
    'Adresse rare',
    'La finition est impeccable et la conciergerie repond avec beaucoup de justesse.',
    '2026-06-30T11:00:00.000Z'
  ),
  (
    'AV-002',
    'Mariam B.',
    4,
    'Tres belle experience',
    'Le parfum est somptueux, et le suivi WhatsApp donne vraiment une sensation sur-mesure.',
    '2026-07-01T09:10:00.000Z'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO messages (id, name, phone, topic, message, is_read, created_at)
VALUES
  (
    'MSG-101',
    'Fatou S.',
    '2250100003333',
    'Privatisation showroom',
    'Bonjour, je souhaite connaitre vos disponibilites pour une visite privee samedi.',
    FALSE,
    '2026-07-02T18:15:00.000Z'
  )
ON CONFLICT (id) DO NOTHING;
