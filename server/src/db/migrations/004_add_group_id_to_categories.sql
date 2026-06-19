ALTER TABLE categories ADD COLUMN group_id INTEGER REFERENCES category_groups(id) ON DELETE SET NULL;
