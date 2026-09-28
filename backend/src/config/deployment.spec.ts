import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const repositoryRoot = resolve(__dirname, '../../..');
const compose = readFileSync(
  resolve(repositoryRoot, 'docker-compose.yml'),
  'utf8',
);
const nginx = readFileSync(
  resolve(repositoryRoot, 'nginx/default.conf.template'),
  'utf8',
);
const dockerfile = readFileSync(
  resolve(repositoryRoot, 'backend/Dockerfile'),
  'utf8',
);
const dockerignore = readFileSync(
  resolve(repositoryRoot, 'backend/.dockerignore'),
  'utf8',
);
const containerWorkflow = readFileSync(
  resolve(repositoryRoot, '.github/workflows/container-security.yml'),
  'utf8',
);
const appModule = readFileSync(
  resolve(repositoryRoot, 'backend/src/app.module.ts'),
  'utf8',
);

describe('perímetro de produção', () => {
  it('mantém o backend apenas na rede interna', () => {
    const backendService = compose.match(
      /backend:\n(?<body>[\s\S]*?)\n[ ]{2}nginx:/,
    )?.groups?.body;

    expect(backendService).toBeDefined();
    expect(backendService).toContain('expose:');
    expect(backendService).toContain('"3000"');
    expect(backendService).not.toContain('ports:');
  });

  it('aguarda serviços saudáveis antes de liberar dependentes', () => {
    expect(compose).toContain('condition: service_healthy');
    expect(compose).toContain('pg_isready');
    expect(compose).toContain('http://localhost:3000/api/v1/health');
    expect(appModule).toContain('controllers: [HealthController]');
  });

  it('redireciona HTTP para HTTPS', () => {
    expect(nginx).toMatch(/listen\s+80;/);
    expect(nginx).toContain('return 308 https://$host$request_uri;');
  });

  it('habilita TLS moderno e certificados configuráveis', () => {
    expect(nginx).toMatch(/listen\s+443\s+ssl/);
    expect(nginx).toContain('ssl_protocols TLSv1.2 TLSv1.3;');
    expect(nginx).toContain(
      '/etc/letsencrypt/live/${SERVER_NAME}/fullchain.pem',
    );
    expect(nginx).toContain('/etc/letsencrypt/live/${SERVER_NAME}/privkey.pem');
  });

  it('preserva o prefixo da API e define limites defensivos', () => {
    expect(nginx).toContain('proxy_pass http://backend:3000;');
    expect(nginx).not.toContain('proxy_pass http://backend:3000/;');
    expect(nginx).toContain('client_max_body_size 1m;');
    expect(nginx).toContain('proxy_connect_timeout 5s;');
    expect(nginx).toContain('proxy_read_timeout 30s;');
  });

  it('envia headers de segurança no HTTPS', () => {
    expect(nginx).toContain('Strict-Transport-Security');
    expect(nginx).toContain('X-Content-Type-Options');
    expect(nginx).toContain('Referrer-Policy');
    expect(nginx).toContain('Content-Security-Policy');
    expect(nginx).toContain("frame-ancestors 'none'");
  });

  it('limita abuso nas rotas públicas de autenticação', () => {
    expect(nginx).toContain(
      'limit_req_zone $binary_remote_addr zone=auth_per_ip:10m rate=5r/m;',
    );
    expect(nginx).toContain(
      'limit_req_zone $binary_remote_addr zone=register_per_ip:10m rate=2r/m;',
    );
    expect(nginx).toContain('limit_req_status 429;');
    expect(nginx).toMatch(
      /location = \/api\/v1\/auth\/login \{[\s\S]*?limit_req zone=auth_per_ip/,
    );
    expect(nginx).toMatch(
      /location = \/api\/v1\/auth\/register \{[\s\S]*?limit_req zone=register_per_ip/,
    );
    expect(nginx).toContain('proxy_set_header X-Forwarded-For $remote_addr;');
  });

  it('executa o backend com runtime mínimo e sem privilégios', () => {
    expect(dockerfile).toContain('FROM node:24.17.0-alpine3.23');
    expect(dockerfile).toContain('npm prune --omit=dev');
    expect(dockerfile).toContain('USER node');
    expect(dockerfile).not.toContain('COPY --from=builder /app/node_modules');
  });

  it('não envia secrets e artefatos locais para o build context', () => {
    expect(dockerignore).toContain('.env');
    expect(dockerignore).toContain('node_modules');
    expect(dockerignore).toContain('coverage');
    expect(dockerignore).toContain('*.key');
  });

  it('aplica restrições de runtime no Compose', () => {
    expect(compose).toContain('read_only: true');
    expect(compose).toContain('no-new-privileges:true');
    expect(compose).toContain('cap_drop:');
    expect(compose).toContain('- ALL');
  });

  it('gera SBOM e bloqueia vulnerabilidades altas no CI', () => {
    expect(containerWorkflow).toContain('--format cyclonedx');
    expect(containerWorkflow).toContain('--severity HIGH,CRITICAL');
    expect(containerWorkflow).toContain('--exit-code 1');
    expect(containerWorkflow).toContain(
      'ghcr.io/aquasecurity/trivy:0.70.0@sha256:',
    );
    expect(containerWorkflow).not.toContain('aquasecurity/trivy-action');
  });
});
