import { Body, Controller, Get, Post, Delete, Param, Req, UseGuards, UnauthorizedException, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { WebAuthnService } from './webauthn.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { AuthService } from './auth.service.js';
import type { Request } from 'express';
import { Public } from '../../common/decorators/public.decorator.js';

@ApiTags('Auth - WebAuthn (Passkeys)')
@Controller('auth/webauthn')
export class WebAuthnController {
  constructor(
    private readonly webAuthnService: WebAuthnService,
    private readonly authService: AuthService,
  ) {}

  @Get('register/options')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Generate WebAuthn registration options' })
  async getRegistrationOptions(@Req() req: any) {
    return this.webAuthnService.getRegistrationOptions(req.user._id.toString());
  }

  @Get('authenticators')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List registered authenticators' })
  async getAuthenticators(@Req() req: any) {
    return this.webAuthnService.getAuthenticators(req.user._id.toString());
  }

  @Post('register/verify')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Verify WebAuthn registration and save authenticator' })
  async verifyRegistration(@Req() req: any, @Body() body: any) {
    return this.webAuthnService.verifyRegistration(req.user._id.toString(), body);
  }

  @Public()
  @Get('login/options')
  @ApiOperation({ summary: 'Generate WebAuthn authentication options' })
  async getAuthenticationOptions(@Query('email') email?: string) {
    return this.webAuthnService.getAuthenticationOptions(email);
  }

  @Public()
  @Post('login/verify')
  @ApiOperation({ summary: 'Verify WebAuthn authentication and issue JWT' })
  async verifyAuthentication(
    @Body() body: { email: string } & any, 
    @Req() req: any
  ) {
    const { email, ...assertionResponse } = body;
    const { verified, user } = await this.webAuthnService.verifyAuthentication(assertionResponse, email);
    
    if (!verified || !user) {
      throw new UnauthorizedException('Authentication failed');
    }

    const ip = req.ip || '0.0.0.0';
    const userAgent = req.headers['user-agent'] || 'unknown';
    
    // Use manual login flow with empty password for passkey auth
    return this.authService.login(user as any, { email: user.email, password: '', remember_me: true }, ip, userAgent);
  }

  @Delete('authenticators/:id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete a registered passkey' })
  async deleteAuthenticator(@Req() req: any, @Param('id') credentialId: string) {
    return this.webAuthnService.deleteAuthenticator(req.user._id.toString(), credentialId);
  }

  @Post('authenticators/:id/rename')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Rename a registered passkey' })
  async renameAuthenticator(
    @Req() req: any, 
    @Param('id') credentialId: string, 
    @Body('name') name: string
  ) {
    return this.webAuthnService.renameAuthenticator(req.user._id.toString(), credentialId, name);
  }
}
