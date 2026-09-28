import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const saveMigration = readFileSync(
  resolve(
    __dirname,
    '../../prisma/migrations/20260729150000_versioned_save_integrity/migration.sql',
  ),
  'utf8',
);

describe('integridade das migrations', () => {
  it('calcula SHA-256 real no backfill de saves existentes', () => {
    expect(saveMigration).toContain(
      "encode(sha256(convert_to(\"data\", 'UTF8')), 'hex')",
    );
    expect(saveMigration).not.toContain('md5(');
  });
});
