import { Injectable, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

const ADMIN_EMAIL = 'antony.jasper@gmail.com';

@Injectable()
export class AdminGuard extends AuthGuard('jwt') {
  handleRequest<T extends { email: string }>(err: unknown, user: T | null): T {
    if (err || !user) throw (err as Error) ?? new ForbiddenException('Acesso negado.');
    if (user.email !== ADMIN_EMAIL) throw new ForbiddenException('Acesso negado.');
    return user;
  }
}
