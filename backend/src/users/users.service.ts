import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../auth/entities/user.entity';
import { SavedAddress } from './entities/address.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateAddressDto } from './dto/create-address.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(SavedAddress)
    private readonly addressRepo: Repository<SavedAddress>,
  ) {}

  async getUserById(id: string): Promise<User> {
    const user = await this.userRepo.findOneBy({ id });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async updateProfile(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.getUserById(id);
    Object.assign(user, dto);
    return this.userRepo.save(user);
  }

  async getAddresses(userId: string): Promise<SavedAddress[]> {
    return this.addressRepo.findBy({ userId });
  }

  async addAddress(
    userId: string,
    dto: CreateAddressDto,
  ): Promise<SavedAddress> {
    const address = this.addressRepo.create({ ...dto, userId });
    return this.addressRepo.save(address);
  }

  async removeAddress(userId: string, addressId: string): Promise<void> {
    const address = await this.addressRepo.findOneBy({ id: addressId });
    if (!address) throw new NotFoundException('Dirección no encontrada');
    if (address.userId !== userId)
      throw new ForbiddenException('No tienes permiso para eliminar esta dirección');
    await this.addressRepo.remove(address);
  }
}
