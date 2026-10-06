import { PrismaClient } from '@prisma/client';
import { createHash } from 'node:crypto';

const TARGET_EMAIL = 'raphagallo@gmail.com';
const PREMIUM_TYPE = 'season' as const;

const prisma = new PrismaClient();

async function main() {
  const account = await prisma.account.findUnique({
    where: { email: TARGET_EMAIL },
    include: { player: { include: { saveData: true } } },
  });

  if (!account) throw new Error(`Conta não encontrada: ${TARGET_EMAIL}`);
  if (!account.player) throw new Error('Jogador não encontrado.');
  if (!account.player.saveData) throw new Error('Save não encontrado.');

  let saveData: Record<string, unknown>;
  try {
    saveData = JSON.parse(account.player.saveData.data) as Record<string, unknown>;
  } catch {
    throw new Error('Save corrompido — não foi possível parsear.');
  }

  const bp = (saveData['battlePass'] as Record<string, unknown>) ?? {};
  bp['isPremium'] = true;
  bp['premiumType'] = PREMIUM_TYPE;
  const now = new Date();
  bp['premiumExpiresAt'] = new Date(now.getFullYear(), 11, 31, 23, 59, 59).toISOString();
  saveData['battlePass'] = bp;

  const data = JSON.stringify(saveData);
  const checksum = createHash('sha256').update(data, 'utf8').digest('hex');
  const nextRevision = account.player.saveData.revision + 1;

  await prisma.saveData.update({
    where: { playerId: account.player.id },
    data: { data, checksum, revision: nextRevision },
  });

  await prisma.purchase.create({
    data: {
      accountId: account.id,
      type: PREMIUM_TYPE,
      paymentId: `admin_grant_${Date.now()}`,
      amount: 29.99,
      status: 'admin_grant',
    },
  });

  console.log(`OK — premium season concedido para ${TARGET_EMAIL}`);
  console.log(`  battlePass.isPremium     = true`);
  console.log(`  battlePass.premiumType   = season`);
  console.log(`  battlePass.premiumExpiresAt = ${bp['premiumExpiresAt'] as string}`);
  console.log(`  saveData revision        = ${nextRevision}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
