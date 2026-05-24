import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AddItemDto } from './dto/add-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(@Request() req: { user: { id: string } }) {
    return this.cartService.getCart(req.user.id);
  }

  @Post('items')
  addItem(
    @Request() req: { user: { id: string } },
    @Body() dto: AddItemDto,
  ) {
    return this.cartService.addItem(req.user.id, dto);
  }

  @Put('items/:productId')
  updateItem(
    @Request() req: { user: { id: string } },
    @Param('productId') productId: string,
    @Body('quantity') quantity: number,
  ) {
    return this.cartService.updateItem(req.user.id, productId, quantity);
  }

  @Delete('items/:productId')
  removeItem(
    @Request() req: { user: { id: string } },
    @Param('productId') productId: string,
  ) {
    return this.cartService.removeItem(req.user.id, productId);
  }

  @Delete()
  clearCart(@Request() req: { user: { id: string } }) {
    return this.cartService.clearCart(req.user.id);
  }
}
