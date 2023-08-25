import { Body, Controller, Get, HttpStatus, Post, Query, Res } from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { SessionManager } from '../core/abc/manager.abc';
import { parseBool } from '../helpers';
import { SessionQuery } from '../structures/base.dto';
import {
  ListSessionsQuery,
  SessionDTO,
  SessionLogoutRequest,
  SessionStartRequest,
  SessionStopRequest,
} from '../structures/sessions.dto';

@ApiSecurity('api_key')
@Controller('api/sessions')
@ApiTags('sessions')
export class SessionsController {
  constructor(private manager: SessionManager) { }

  @Post('/start/')
  async start(@Body() request: SessionStartRequest): Promise<SessionDTO> {
    const result = await this.manager.start(request);
    await this.manager.sessionStorage.configRepository.save(
      request.name,
      request.config,
    );
    return result;
  }

  @Post('/stop/')
  @ApiOperation({ summary: 'Stop session' })
  async stop(@Body() request: SessionStopRequest): Promise<void> {
    await this.manager.stop(request);
    if (request.logout) {
      await this.manager.logout(request);
    }
    return;
  }

  @Post('/logout/')
  @ApiOperation({ summary: 'Logout from session.' })
  clean(@Body() request: SessionLogoutRequest): Promise<void> {
    return this.manager.logout(request);
  }

  @Get('/')
  async list(@Query() query: ListSessionsQuery): Promise<SessionDTO[]> {
    const all = parseBool(query.all);
    return this.manager.getSessions(all);
  }

  @Get('/whatsapp-code')
  @ApiOperation({ summary: 'Get WhatsappAuthCode.' })
  whatsappCode(@Res() res: Response, @Query() sessionQuery: SessionQuery): void {
    const whatsappService = this.manager.getSession(sessionQuery.session);
    const code = whatsappService.getWhatsappAuthCode();
    res.status(HttpStatus.OK).send(code);

  }
}
