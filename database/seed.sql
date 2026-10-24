INSERT INTO students (id, name, email)
VALUES (
    'STU_101',
    'Alex Kim',
    'alex.kim@university.edu'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO materials (
    id,
    section_number,
    title,
    content,
    image_url
)
VALUES
(
    'SEC_PY_01',
    1,
    'Python Lists & Mutability',
    'Lists are ordered, mutable collections.',
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=500&auto=format&fit=crop&q=60'
),
(
    'SEC_PY_02',
    2,
    'Python Tuples & Immutability',
    'Tuples are ordered, immutable collections.',
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=500&auto=format&fit=crop&q=60'
),
(
    'SEC_PY_03',
    3,
    'Python Dictionaries',
    'Dictionaries store key-value pairs.',
    'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=500&auto=format&fit=crop&q=60'
)
ON CONFLICT (id) DO NOTHING;