export const themeMigrationSql = `
  BEGIN;
  UPDATE campaigns SET theme = 'techno' WHERE theme = 'sci-fi';
  UPDATE campaigns SET theme = 'ember' WHERE theme = 'fantasy';
  COMMIT;
`;
