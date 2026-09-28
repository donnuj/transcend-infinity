import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const apiClient = readFileSync(
  resolve(__dirname, '../../../Assets/_Project/Scripts/Backend/ApiClient.cs'),
  'utf8',
);

describe('contrato de save do cliente Unity', () => {
  it('usa a revisão recebida no download para o próximo upload', () => {
    expect(apiClient).toContain(
      'StartCoroutine(GetSaveRaw("/player/save", onSuccess, onError))',
    );
    expect(apiClient).toContain('_saveRevision = response.revision;');
    expect(apiClient).toContain('\\"revision\\":{_saveRevision}');
  });

  it('isola a revisão ao trocar ou encerrar a sessão', () => {
    const resetCount = apiClient.match(/_saveRevision = 0;/g)?.length ?? 0;

    expect(resetCount).toBeGreaterThanOrEqual(3);
  });
});
