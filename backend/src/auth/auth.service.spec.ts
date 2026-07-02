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
import { UsersService } from '../users/users.service';
import { Credential, UserRole } from './entities/credential.entity';
import { UserProfile, UserGender } from '../users/entities/user-profile.entity';

jest.mock('bcrypt');

const mockCredentialRepo = {
  findOneBy: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
};

const mockUsersService = {
  findById: jest.fn(),
  findByRun: jest.fn(),
  createProfile: jest.fn(),
  getUserById: jest.fn(),
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
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  // ------------------------------------------------------------------ register
  describe('register', () => {
    it('registra un nuevo usuario y retorna token', async () => {
      mockCredentialRepo.findOneBy.mockResolvedValue(null);
      mockUsersService.findByRun.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      mockUsersService.createProfile.mockResolvedValue(baseProfile);
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
      mockUsersService.findByRun.mockResolvedValueOnce(baseProfile);

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
      mockUsersService.findById.mockResolvedValue(baseProfile);

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
      mockUsersService.getUserById.mockResolvedValue(baseProfile);
      mockCredentialRepo.findOneBy.mockResolvedValue(baseCredential);

      const result = await service.getMe('profile-uuid-1');

      expect(result.id).toBe('profile-uuid-1');
      expect(result.email).toBe('taro@fukusuke.cl');
      expect(result.fullName).toBe('Taro Yamamoto');
    });

    it('lanza NotFoundException cuando el usuario no existe', async () => {
      mockUsersService.getUserById.mockRejectedValue(
        new NotFoundException('Usuario no encontrado'),
      );

      await expect(service.getMe('no-existe')).rejects.toThrow(NotFoundException);
    });
  });

  // ---------------------------------------------------------- findAllCredentials
  describe('findAllCredentials', () => {
    it('retorna las credenciales sin passwordHash', async () => {
      const { passwordHash: _ph, ...safeCredential } = baseCredential;
      mockCredentialRepo.find.mockResolvedValue([safeCredential]);

      const result = await service.findAllCredentials();

      expect(mockCredentialRepo.find).toHaveBeenCalledWith({
        select: ['id', 'email', 'role', 'active', 'userId', 'createdAt'],
      });
      expect(result).toEqual([safeCredential]);
      expect(result[0]).not.toHaveProperty('passwordHash');
    });
  });

  // ------------------------------------------------------- adminUpdateCredential
  describe('adminUpdateCredential', () => {
    it('lanza NotFoundException cuando la credencial no existe', async () => {
      mockCredentialRepo.findOneBy.mockResolvedValue(null);

      await expect(
        service.adminUpdateCredential('no-existe', { role: UserRole.CAJERO }),
      ).rejects.toThrow(NotFoundException);
    });

    it('lanza ConflictException cuando el nuevo email ya está en uso', async () => {
      mockCredentialRepo.findOneBy
        .mockResolvedValueOnce(baseCredential)
        .mockResolvedValueOnce({ ...baseCredential, id: 'otro-id' });

      await expect(
        service.adminUpdateCredential('profile-uuid-1', { email: 'otro@fukusuke.cl' }),
      ).rejects.toThrow(ConflictException);
    });

    it('actualiza rol y estado activo mediante update()', async () => {
      mockCredentialRepo.findOneBy.mockResolvedValue(baseCredential);
      mockCredentialRepo.update.mockResolvedValue({ affected: 1 });
      const { passwordHash: _ph, ...safeCredential } = baseCredential;
      mockCredentialRepo.findOne.mockResolvedValue({
        ...safeCredential,
        role: UserRole.CAJERO,
        active: false,
      });

      const result = await service.adminUpdateCredential('profile-uuid-1', {
        role: UserRole.CAJERO,
        active: false,
      });

      expect(mockCredentialRepo.update).toHaveBeenCalledWith(
        baseCredential.id,
        { role: UserRole.CAJERO, active: false },
      );
      expect(result.role).toBe(UserRole.CAJERO);
      expect(result.active).toBe(false);
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('hashea la nueva contraseña cuando se provee', async () => {
      mockCredentialRepo.findOneBy.mockResolvedValue(baseCredential);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-password');
      mockCredentialRepo.update.mockResolvedValue({ affected: 1 });
      mockCredentialRepo.findOne.mockResolvedValue(baseCredential);

      await service.adminUpdateCredential('profile-uuid-1', { password: 'nueva123' });

      expect(bcrypt.hash).toHaveBeenCalledWith('nueva123', 10);
      expect(mockCredentialRepo.update).toHaveBeenCalledWith(
        baseCredential.id,
        { passwordHash: 'new-hashed-password' },
      );
    });
  });
});
