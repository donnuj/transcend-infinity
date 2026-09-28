import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, type VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      clientID: config.getOrThrow<string>('GOOGLE_CLIENT_ID'),
      clientSecret: config.getOrThrow<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: config.getOrThrow<string>('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ) {
    const email = profile.emails?.[0]?.value;
    const displayName = profile.displayName ?? profile.username ?? 'Jogador';

    if (!email) return done(new Error('Google não retornou email.'), undefined);

    let account = await this.prisma.account.findUnique({
      where: { email },
      include: { player: true },
    });

    if (!account) {
      const username = await this.generateUsername(displayName);
      account = await this.prisma.account.create({
        data: {
          email,
          username,
          passwordHash: '!oauth',
          player: { create: { characterName: displayName } },
        },
        include: { player: true },
      });
    }

    done(null, account);
  }

  private async generateUsername(base: string): Promise<string> {
    const slug = base
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-zA-Z0-9_]/g, '_')
      .slice(0, 24);

    let candidate = slug;
    let suffix = 1;
    while (await this.prisma.account.findUnique({ where: { username: candidate } })) {
      candidate = `${slug}_${suffix++}`;
    }
    return candidate;
  }
}
