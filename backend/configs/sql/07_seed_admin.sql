INSERT INTO users (full_name, email, phone, password_hash, role)
VALUES (
    'Super Admin',
    'admin@3akarati.com',
    '+201000000000',
    '$2b$10$i6pvtm4RHzlRnP1ZX7cfHuOpM7B0ZE0kmWCSaoAw3w/vF5nH/phum',
    'admin'
) ON CONFLICT (email) DO NOTHING;
