import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import {
  loginSchema,
  registerSchema,
  type LoginInput,
  type RegisterInput,
} from './auth.schemas';
import { ZodValidationPipe } from '../common/validation/zod-validation.pipe';
import type { Environment } from '../config/env.schema';

const REFRESH_COOKIE = 'refresh_token';

const COOKIE_OPTS = {
  httpOnly: true,
  secure: true,
  sameSite: 'none' as const,
  path: '/api/v1/auth',
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in ms
};

function getRefreshFromCookie(req: Request): string {
  const token = (req.cookies as Record<string, string> | undefined)?.[REFRESH_COOKIE];
  if (!token) throw new UnauthorizedException('Refresh token ausente.');
  return token;
}

@Controller('auth')
export class AuthController {
  private readonly allowedOrigins: string[];

  constructor(
    private readonly authService: AuthService,
    config: ConfigService<Environment, true>,
  ) {
    this.allowedOrigins = config.get('CORS_ORIGINS', { infer: true });
  }

  @Post('register')
  async register(
    @Body(new ZodValidationPipe(registerSchema)) input: RegisterInput,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { body, refreshToken } = await this.authService.register(input);
    res.cookie(REFRESH_COOKIE, refreshToken, COOKIE_OPTS);
    return body;
  }

  @Post('login')
  async login(
    @Body(new ZodValidationPipe(loginSchema)) input: LoginInput,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { body, refreshToken } = await this.authService.login(input);
    res.cookie(REFRESH_COOKIE, refreshToken, COOKIE_OPTS);
    return body;
  }

  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = getRefreshFromCookie(req);
    const { body, refreshToken } = await this.authService.refresh(token);
    res.cookie(REFRESH_COOKIE, refreshToken, COOKIE_OPTS);
    return body;
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = getRefreshFromCookie(req);
    res.clearCookie(REFRESH_COOKIE, { ...COOKIE_OPTS, maxAge: undefined });
    return this.authService.logout(token);
  }

  @Post('logout-all')
  async logoutAll(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = getRefreshFromCookie(req);
    res.clearCookie(REFRESH_COOKIE, { ...COOKIE_OPTS, maxAge: undefined });
    return this.authService.logoutAll(token);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleLogin() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const { body, refreshToken } = await this.authService.buildGoogleAuthResponse(req.user as any);
    res.cookie(REFRESH_COOKIE, refreshToken, COOKIE_OPTS);

    const b64 = Buffer.from(JSON.stringify(body)).toString('base64');
    const allowedStr = JSON.stringify(this.allowedOrigins);
    res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
    res.send(
      '<!DOCTYPE html><html><body><script>' +
      '(function(){' +
      'var payload=JSON.parse(atob("' + b64 + '"));' +
      'var allowed=' + allowedStr + ';' +
      'if(window.opener){' +
      'allowed.forEach(function(o){window.opener.postMessage({type:"GOOGLE_AUTH",payload:payload},o);});' +
      'setTimeout(function(){window.close();},500);' +
      '}else{document.body.innerHTML="<p>Autenticado! Pode fechar esta janela.</p>";}' +
      '})();' +
      '</script><p>Autenticando...</p></body></html>',
    );
  }
}
