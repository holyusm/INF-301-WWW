import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem]), AuthModule],
  providers: [OrdersService],
  controllers: [OrdersController],
  exports: [OrdersService],
})
export class OrdersModule {}
