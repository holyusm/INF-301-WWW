import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User, UserRole, UserGender } from '../auth/entities/user.entity';
import { SavedAddress } from './entities/address.entity';

const mockUserRepo = {
  findOneBy: jest.fn(),
  save: jest.fn(),
};

const mockAddressRepo = {
  findBy: jest.fn(),
  findOneBy: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
};

const baseUser: User = {
  id: 'user-uuid-1',
  run: '12345678-9',
  fullName: 'Taro Yamamoto',
  email: 'taro@fukusuke.cl',
  password: 'hashed-password',
  phone: '+56912345678',
  address: 'Av. Sushi 123',
  commune: 'Providencia',
  province: 'Santiago',
  region: 'Metropolitana',
  birthDate: '1990-01-01',
  gender: UserGender.M,
  role: UserRole.CLIENTE,
  active: true,
  createdAt: new Date('2024-01-01'),
};

const baseAddress: SavedAddress = {
  id: 'addr-uuid-1',
  userId: 'user-uuid-1',
  label: 'Casa',
  address: 'Av. Sushi 123',
  commune: 'Providencia',
  createdAt: new Date('2024-01-01'),
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: getRepositoryToken(SavedAddress), useValue: mockAddressRepo },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  // ---------------------------------------------------------------- getUserById
  describe('getUserById', () => {
    it('retorna el usuario cuando existe', async () => {
      mockUserRepo.findOneBy.mockResolvedValue(baseUser);

      const result = await service.getUserById('user-uuid-1');

      expect(mockUserRepo.findOneBy).toHaveBeenCalledWith({ id: 'user-uuid-1' });
      expect(result).toEqual(baseUser);
    });

    it('lanza NotFoundException cuando no existe', async () => {
      mockUserRepo.findOneBy.mockResolvedValue(null);

      await expect(service.getUserById('no-existe')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // --------------------------------------------------------------- updateProfile
  describe('updateProfile', () => {
    it('actualiza y retorna el usuario modificado', async () => {
      const updated = { ...baseUser, fullName: 'Hanako Yamamoto' };
      mockUserRepo.findOneBy.mockResolvedValue({ ...baseUser });
      mockUserRepo.save.mockResolvedValue(updated);

      const result = await service.updateProfile('user-uuid-1', {
        fullName: 'Hanako Yamamoto',
      });

      expect(mockUserRepo.save).toHaveBeenCalled();
      expect(result.fullName).toBe('Hanako Yamamoto');
    });

    it('lanza NotFoundException cuando el usuario no existe', async () => {
      mockUserRepo.findOneBy.mockResolvedValue(null);

      await expect(
        service.updateProfile('no-existe', { fullName: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // --------------------------------------------------------------- getAddresses
  describe('getAddresses', () => {
    it('retorna las direcciones del usuario', async () => {
      mockAddressRepo.findBy.mockResolvedValue([baseAddress]);

      const result = await service.getAddresses('user-uuid-1');

      expect(mockAddressRepo.findBy).toHaveBeenCalledWith({
        userId: 'user-uuid-1',
      });
      expect(result).toEqual([baseAddress]);
    });

    it('retorna arreglo vacío cuando no hay direcciones', async () => {
      mockAddressRepo.findBy.mockResolvedValue([]);

      const result = await service.getAddresses('user-uuid-1');

      expect(result).toEqual([]);
    });
  });

  // ---------------------------------------------------------------- addAddress
  describe('addAddress', () => {
    it('crea y retorna una nueva dirección', async () => {
      mockAddressRepo.create.mockReturnValue(baseAddress);
      mockAddressRepo.save.mockResolvedValue(baseAddress);

      const result = await service.addAddress('user-uuid-1', {
        label: 'Casa',
        address: 'Av. Sushi 123',
        commune: 'Providencia',
      });

      expect(mockAddressRepo.create).toHaveBeenCalledWith({
        label: 'Casa',
        address: 'Av. Sushi 123',
        commune: 'Providencia',
        userId: 'user-uuid-1',
      });
      expect(result).toEqual(baseAddress);
    });
  });

  // ------------------------------------------------------------- removeAddress
  describe('removeAddress', () => {
    it('elimina la dirección cuando pertenece al usuario', async () => {
      mockAddressRepo.findOneBy.mockResolvedValue(baseAddress);
      mockAddressRepo.remove.mockResolvedValue(undefined);

      await service.removeAddress('user-uuid-1', 'addr-uuid-1');

      expect(mockAddressRepo.remove).toHaveBeenCalledWith(baseAddress);
    });

    it('lanza NotFoundException cuando la dirección no existe', async () => {
      mockAddressRepo.findOneBy.mockResolvedValue(null);

      await expect(
        service.removeAddress('user-uuid-1', 'no-existe'),
      ).rejects.toThrow(NotFoundException);
    });

    it('lanza ForbiddenException cuando la dirección no pertenece al usuario', async () => {
      mockAddressRepo.findOneBy.mockResolvedValue({
        ...baseAddress,
        userId: 'otro-user',
      });

      await expect(
        service.removeAddress('user-uuid-1', 'addr-uuid-1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
