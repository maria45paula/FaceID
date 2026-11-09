-- Ejecutar UNA vez en MySQL Workbench (después de faceaccess_completo.sql)
-- El descriptor facial se calcula en el Sprint 3, así que por ahora puede quedar vacío.
USE faceaccess;
ALTER TABLE rostros MODIFY descriptor TEXT NULL;
