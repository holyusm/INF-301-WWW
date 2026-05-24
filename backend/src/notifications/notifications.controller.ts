import {
  Controller,
  Get,
  Patch,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  getByUser(@Request() req: { user: { id: string } }) {
    return this.notificationsService.getByUser(req.user.id);
  }

  @Patch('read-all')
  markAllAsRead(@Request() req: { user: { id: string } }) {
    return this.notificationsService.markAllAsRead(req.user.id);
  }

  @Patch(':id/read')
  markAsRead(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.notificationsService.markAsRead(id, req.user.id);
  }
}
