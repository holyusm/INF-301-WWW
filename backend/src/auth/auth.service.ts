import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existingEmail = await this.userRepo.findOneBy({ email: dto.email });
    if (existingEmail) throw new ConflictException('Email ya registrado');

    const existingRun = await this.userRepo.findOneBy({ run: dto.run });
    if (existingRun) throw new ConflictException('RUN ya registrado');

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = this.userRepo.create({
      ...dto,
      password: hashed,
      role: dto.role ?? UserRole.CLIENTE,
    });
    const saved = await this.userRepo.save(user);
    const { password: _, ...result } = saved as User & { password: string };
    return {
      user: result,
      token: this.jwtService.sign({ sub: saved.id, role: saved.role }),
    };
  }

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({
      where: { email: dto.email },
      select: [
        'id',
        'run',
        'fullName',
        'email',
        'password',
        'phone',
        'address',
        'commune',
        'province',
        'region',
        'birthDate',
        'gender',
        'role',
        'active',
        'createdAt',
      ],
    });
    if (!user) throw new UnauthorizedException('Credenciales inválidas');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Credenciales inválidas');

    const { password: _, ...result } = user;
    return {
      user: result,
      token: this.jwtService.sign({ sub: user.id, role: user.role }),
    };
  }

  async getMe(userId: string) {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }
}
