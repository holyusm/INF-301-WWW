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
import { Credential } from './entities/credential.entity';
import { UserRole } from './entities/user.entity';
import { UserProfile, UserGender } from '../users/entities/user-profile.entity';

jest.mock('bcrypt');

const mockCredentialRepo = {
  findOneBy: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

const mockProfileRepo = {
  findOneBy: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock.jwt.token'),
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

const baseCredential: Credential = {
  id: 'cred-uuid-1',
  email: 'taro@fukusuke.cl',
  passwordHash: 'hashed-password',
  role: UserRole.CLIENTE,
  active: true,
  userId: 'profile-uuid-1',
  createdAt: new Date('2024-01-01'),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(Credential), useValue: mockCredentialRepo },
        { provide: getRepositoryToken(UserProfile), useValue: mockProfileRepo },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  // ------------------------------------------------------------------ register
  describe('register', () => {
    it('registra un nuevo usuario y retorna token', async () => {
      mockCredentialRepo.findOneBy.mockResolvedValue(null);
      mockProfileRepo.findOneBy.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      mockProfileRepo.create.mockReturnValue(baseProfile);
      mockProfileRepo.save.mockResolvedValue(baseProfile);
      mockCredentialRepo.create.mockReturnValue(baseCredential);
      mockCredentialRepo.save.mockResolvedValue(baseCredential);

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
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('lanza ConflictException cuando el email ya existe', async () => {
      mockCredentialRepo.findOneBy.mockResolvedValueOnce(baseCredential);

      await expect(
        service.register({
          run: '99999999-9',
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
      mockCredentialRepo.findOneBy.mockResolvedValueOnce(null);
      mockProfileRepo.findOneBy.mockResolvedValueOnce(baseProfile);

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
      mockCredentialRepo.findOne.mockResolvedValue({ ...baseCredential, passwordHash: 'hashed-password' });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockProfileRepo.findOneBy.mockResolvedValue(baseProfile);

      const result = await service.login({
        email: 'taro@fukusuke.cl',
        password: 'plaintext',
      });

      expect(result.token).toBe('mock.jwt.token');
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('lanza UnauthorizedException cuando el usuario no existe', async () => {
      mockCredentialRepo.findOne.mockResolvedValue(null);

      await expect(
        service.login({ email: 'no@existe.cl', password: '123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('lanza UnauthorizedException cuando la contraseña es incorrecta', async () => {
      mockCredentialRepo.findOne.mockResolvedValue({ ...baseCredential, passwordHash: 'hashed-password' });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ email: 'taro@fukusuke.cl', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ------------------------------------------------------------------- getMe
  describe('getMe', () => {
    it('retorna el perfil y credenciales del usuario', async () => {
      mockProfileRepo.findOneBy.mockResolvedValue(baseProfile);
      mockCredentialRepo.findOneBy.mockResolvedValue(baseCredential);

      const result = await service.getMe('profile-uuid-1');

      expect(result.id).toBe('profile-uuid-1');
      expect(result.email).toBe('taro@fukusuke.cl');
      expect(result.fullName).toBe('Taro Yamamoto');
    });

    it('lanza NotFoundException cuando el usuario no existe', async () => {
      mockProfileRepo.findOneBy.mockResolvedValue(null);

      await expect(service.getMe('no-existe')).rejects.toThrow(NotFoundException);
    });
  });
});
