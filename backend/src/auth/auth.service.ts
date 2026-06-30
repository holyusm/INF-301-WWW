import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Credential, UserRole } from './entities/credential.entity';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Credential)
    private readonly credentialRepo: Repository<Credential>,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existingEmail = await this.credentialRepo.findOneBy({ email: dto.email });
    if (existingEmail) throw new ConflictException('Email ya registrado');

    const existingRun = await this.usersService.findByRun(dto.run);
    if (existingRun) throw new ConflictException('RUN ya registrado');

    const profile = await this.usersService.createProfile({
      run: dto.run,
      fullName: dto.fullName,
      phone: dto.phone,
      address: dto.address,
      commune: dto.commune,
      province: dto.province,
      region: dto.region,
      birthDate: dto.birthDate,
      gender: dto.gender,
    });

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const credential = await this.credentialRepo.save(
      this.credentialRepo.create({
        email: dto.email,
        passwordHash,
        role: dto.role ?? UserRole.CLIENTE,
        userId: profile.id,
      }),
    );

    return {
      user: {
        id: profile.id,
        email: credential.email,
        role: credential.role,
        ...profile,
      },
      token: this.jwtService.sign({
        sub: profile.id,
        role: credential.role,
        email: credential.email,
      }),
    };
  }

  async login(dto: LoginDto) {
    const credential = await this.credentialRepo.findOne({
      where: { email: dto.email },
      select: ['id', 'email', 'passwordHash', 'role', 'active', 'userId'],
    });
    if (!credential) throw new UnauthorizedException('Credenciales inválidas');
    if (!credential.active) throw new UnauthorizedException('Cuenta desactivada');

    const valid = await bcrypt.compare(dto.password, credential.passwordHash);
    if (!valid) throw new UnauthorizedException('Credenciales inválidas');

    const profile = await this.usersService.findById(credential.userId);

    return {
      user: {
        id: credential.userId,
        email: credential.email,
        role: credential.role,
        active: credential.active,
        ...profile,
      },
      token: this.jwtService.sign({
        sub: credential.userId,
        role: credential.role,
        email: credential.email,
      }),
    };
  }

  async getMe(userId: string) {
    const profile = await this.usersService.getUserById(userId);

    const credential = await this.credentialRepo.findOneBy({ userId });

    return {
      id: userId,
      email: credential?.email,
      role: credential?.role,
      active: credential?.active,
      ...profile,
    };
  }
}
