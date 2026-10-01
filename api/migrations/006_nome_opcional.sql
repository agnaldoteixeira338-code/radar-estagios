-- O cadastro passa a pedir só e-mail e senha; o nome é opcional.
ALTER TABLE usuarios ALTER COLUMN nome DROP NOT NULL;
