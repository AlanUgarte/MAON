import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CartsService } from './carts.service';
import { AddCartItemDto, SetCartItemQtyDto, SetCartShippingDto } from './dto/cart.dto';

// Carrito ligado 1 a 1 a una conversación — se anida bajo /conversations
// en vez de tener su propio id público, mismo criterio que /messages.
@ApiTags('MAON AI Sales · Carrito')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('conversations/:conversationId/cart')
export class CartsController {
  constructor(private readonly carts: CartsService) {}

  @Get() get(@Param('conversationId') conversationId: string) {
    return this.carts.get(conversationId);
  }

  @Post('items')
  addItem(@Param('conversationId') conversationId: string, @Body() dto: AddCartItemDto) {
    return this.carts.addItem(conversationId, dto.productId, dto.quantity);
  }

  @Patch('items/:productId')
  setItemQuantity(
    @Param('conversationId') conversationId: string,
    @Param('productId') productId: string,
    @Body() dto: SetCartItemQtyDto,
  ) {
    return this.carts.setItemQuantity(conversationId, productId, dto.quantity);
  }

  @Delete('items/:productId')
  removeItem(@Param('conversationId') conversationId: string, @Param('productId') productId: string) {
    return this.carts.removeItem(conversationId, productId);
  }

  @Patch('shipping')
  setShipping(@Param('conversationId') conversationId: string, @Body() dto: SetCartShippingDto) {
    return this.carts.setShipping(conversationId, dto.wantsShipping, dto.shippingAddress);
  }

  @Post('confirm')
  confirm(@Param('conversationId') conversationId: string) {
    return this.carts.confirm(conversationId);
  }
}
