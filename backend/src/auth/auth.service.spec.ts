import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import {
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { User, UserRole, UserGender } from './entities/user.entity';

jest.mock('bcrypt');

const mockUserRepo = {
  findOneBy: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock.jwt.token'),
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

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  // ------------------------------------------------------------------ register
  describe('register', () => {
    it('registra un nuevo usuario y retorna token', async () => {
      mockUserRepo.findOneBy.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      mockUserRepo.create.mockReturnValue(baseUser);
      mockUserRepo.save.mockResolvedValue(baseUser);

      const result = await service.register({
        run: '12345678-9',
        fullName: 'Taro Yamamoto',
        email: 'taro@fukusuke.cl',
        password: 'plaintext',
        phone: '+56912345678',
        address: 'Av. Sushi 123',
        commune: 'Providencia',
        province: 'Santiago',
        region: 'Metropolitana',
      });

      expect(result.token).toBe('mock.jwt.token');
      expect(result.user).not.toHaveProperty('password');
    });

    it('lanza ConflictException cuando el email ya existe', async () => {
      // Primera llamada (email) → encontrado
      mockUserRepo.findOneBy.mockResolvedValueOnce(baseUser);

      await expect(
        service.register({
          run: '12345678-9',
          fullName: 'Otro',
          email: 'taro@fukusuke.cl',
          password: 'pass',
          phone: '+56900000000',
          address: 'Calle 1',
          commune: 'Vitacura',
          province: 'Santiago',
          region: 'Metropolitana',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('lanza ConflictException cuando el RUN ya existe', async () => {
      // Primera llamada (email) → null, segunda (run) → encontrado
      mockUserRepo.findOneBy
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(baseUser);

      await expect(
        service.register({
          run: '12345678-9',
          fullName: 'Otro',
          email: 'nuevo@fukusuke.cl',
          password: 'pass',
          phone: '+56900000000',
          address: 'Calle 1',
          commune: 'Vitacura',
          province: 'Santiago',
          region: 'Metropolitana',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ------------------------------------------------------------------- login
  describe('login', () => {
    it('retorna usuario y token con credenciales válidas', async () => {
      mockUserRepo.findOne.mockResolvedValue({
        ...baseUser,
        password: 'hashed-password',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login({
        email: 'taro@fukusuke.cl',
        password: 'plaintext',
      });

      expect(result.token).toBe('mock.jwt.token');
      expect(result.user).not.toHaveProperty('password');
    });

    it('lanza UnauthorizedException cuando el usuario no existe', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      await expect(
        service.login({ email: 'no@existe.cl', password: '123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('lanza UnauthorizedException cuando la contraseña es incorrecta', async () => {
      mockUserRepo.findOne.mockResolvedValue({
        ...baseUser,
        password: 'hashed-password',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ email: 'taro@fukusuke.cl', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ------------------------------------------------------------------- getMe
  describe('getMe', () => {
    it('retorna el usuario por id', async () => {
      mockUserRepo.findOneBy.mockResolvedValue(baseUser);

      const result = await service.getMe('user-uuid-1');

      expect(mockUserRepo.findOneBy).toHaveBeenCalledWith({ id: 'user-uuid-1' });
      expect(result).toEqual(baseUser);
    });

    it('lanza NotFoundException cuando el usuario no existe', async () => {
      mockUserRepo.findOneBy.mockResolvedValue(null);

      await expect(service.getMe('no-existe')).rejects.toThrow(NotFoundException);
    });
  });
});
