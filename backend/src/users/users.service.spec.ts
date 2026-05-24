import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserProfile, UserGender } from './entities/user-profile.entity';
import { SavedAddress } from './entities/address.entity';

const mockProfileRepo = {
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

const baseProfile: UserProfile = {
  id: 'profile-uuid-1',
  run: '12345678-9',
  fullName: 'Taro Yamamoto',
  phone: '+56912345678',
  address: 'Av. Sushi 123',
  commune: 'Providencia',
  province: 'Santiago',
  region: 'Metropolitana',
  birthDate: '1990-01-01',
  gender: UserGender.M,
  createdAt: new Date('2024-01-01'),
};

const baseAddress: SavedAddress = {
  id: 'addr-uuid-1',
  userId: 'profile-uuid-1',
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
        { provide: getRepositoryToken(UserProfile), useValue: mockProfileRepo },
        { provide: getRepositoryToken(SavedAddress), useValue: mockAddressRepo },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  // ---------------------------------------------------------------- getUserById
  describe('getUserById', () => {
    it('retorna el perfil cuando existe', async () => {
      mockProfileRepo.findOneBy.mockResolvedValue(baseProfile);

      const result = await service.getUserById('profile-uuid-1');

      expect(mockProfileRepo.findOneBy).toHaveBeenCalledWith({ id: 'profile-uuid-1' });
      expect(result).toEqual(baseProfile);
    });

    it('lanza NotFoundException cuando no existe', async () => {
      mockProfileRepo.findOneBy.mockResolvedValue(null);

      await expect(service.getUserById('no-existe')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // --------------------------------------------------------------- updateProfile
  describe('updateProfile', () => {
    it('actualiza y retorna el perfil modificado', async () => {
      const updated = { ...baseProfile, fullName: 'Hanako Yamamoto' };
      mockProfileRepo.findOneBy.mockResolvedValue({ ...baseProfile });
      mockProfileRepo.save.mockResolvedValue(updated);

      const result = await service.updateProfile('profile-uuid-1', {
        fullName: 'Hanako Yamamoto',
      });

      expect(mockProfileRepo.save).toHaveBeenCalled();
      expect(result.fullName).toBe('Hanako Yamamoto');
    });

    it('lanza NotFoundException cuando el usuario no existe', async () => {
      mockProfileRepo.findOneBy.mockResolvedValue(null);

      await expect(
        service.updateProfile('no-existe', { fullName: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // --------------------------------------------------------------- getAddresses
  describe('getAddresses', () => {
    it('retorna las direcciones del usuario', async () => {
      mockAddressRepo.findBy.mockResolvedValue([baseAddress]);

      const result = await service.getAddresses('profile-uuid-1');

      expect(mockAddressRepo.findBy).toHaveBeenCalledWith({
        userId: 'profile-uuid-1',
      });
      expect(result).toEqual([baseAddress]);
    });

    it('retorna arreglo vacío cuando no hay direcciones', async () => {
      mockAddressRepo.findBy.mockResolvedValue([]);

      const result = await service.getAddresses('profile-uuid-1');

      expect(result).toEqual([]);
    });
  });

  // ---------------------------------------------------------------- addAddress
  describe('addAddress', () => {
    it('crea y retorna una nueva dirección', async () => {
      mockAddressRepo.create.mockReturnValue(baseAddress);
      mockAddressRepo.save.mockResolvedValue(baseAddress);

      const result = await service.addAddress('profile-uuid-1', {
        label: 'Casa',
        address: 'Av. Sushi 123',
        commune: 'Providencia',
      });

      expect(mockAddressRepo.create).toHaveBeenCalledWith({
        label: 'Casa',
        address: 'Av. Sushi 123',
        commune: 'Providencia',
        userId: 'profile-uuid-1',
      });
      expect(result).toEqual(baseAddress);
    });
  });

  // ------------------------------------------------------------- removeAddress
  describe('removeAddress', () => {
    it('elimina la dirección cuando pertenece al usuario', async () => {
      mockAddressRepo.findOneBy.mockResolvedValue(baseAddress);
      mockAddressRepo.remove.mockResolvedValue(undefined);

      await service.removeAddress('profile-uuid-1', 'addr-uuid-1');

      expect(mockAddressRepo.remove).toHaveBeenCalledWith(baseAddress);
    });

    it('lanza NotFoundException cuando la dirección no existe', async () => {
      mockAddressRepo.findOneBy.mockResolvedValue(null);

      await expect(
        service.removeAddress('profile-uuid-1', 'no-existe'),
      ).rejects.toThrow(NotFoundException);
    });

    it('lanza ForbiddenException cuando la dirección no pertenece al usuario', async () => {
      mockAddressRepo.findOneBy.mockResolvedValue({
        ...baseAddress,
        userId: 'otro-user',
      });

      await expect(
        service.removeAddress('profile-uuid-1', 'addr-uuid-1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
