import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserProfile } from './entities/user-profile.entity';
import { SavedAddress } from './entities/address.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateAddressDto } from './dto/create-address.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserProfile)
    private readonly profileRepo: Repository<UserProfile>,
    @InjectRepository(SavedAddress)
    private readonly addressRepo: Repository<SavedAddress>,
  ) {}

  async getUserById(id: string): Promise<UserProfile> {
    const profile = await this.profileRepo.findOneBy({ id });
    if (!profile) throw new NotFoundException('Usuario no encontrado');
    return profile;
  }

  async findById(id: string): Promise<UserProfile | null> {
    return this.profileRepo.findOneBy({ id });
  }

  async findByRun(run: string): Promise<UserProfile | null> {
    return this.profileRepo.findOneBy({ run });
  }

  async createProfile(data: Partial<UserProfile>): Promise<UserProfile> {
    return this.profileRepo.save(this.profileRepo.create(data));
  }

  async updateProfile(id: string, dto: UpdateUserDto): Promise<UserProfile> {
    const profile = await this.getUserById(id);
    Object.assign(profile, dto);
    return this.profileRepo.save(profile);
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
