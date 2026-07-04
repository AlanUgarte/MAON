import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  // Alta pública (self-signup): siempre VENDEDOR. El rol no lo puede elegir quien se registra solo
  // (si no, cualquiera podría autoasignarse ADMINISTRADOR); los demás roles los da de alta un admin.
  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (exists) throw new ConflictException('El email ya está registrado');

    const password = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        fullName: dto.fullName,
        password,
        role: 'VENDEDOR',
      },
    });
    return this.sign(user);
  }

  // Alta hecha por un admin/supervisor desde el CRM: acá sí se puede elegir el rol.
  async createUser(dto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) throw new ConflictException('El email ya está registrado');

    const password = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        fullName: dto.fullName,
        password,
        role: dto.role ?? 'VENDEDOR',
      },
    });
    return this.safeUser(user);
  }

  listUsers() {
    return this.prisma.user.findMany({
      where: { role: { in: ['VENDEDOR', 'SUPERVISOR'] } },
      select: { id: true, email: true, fullName: true, role: true, isActive: true, avatarUrl: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async toggleUserActive(id: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id } });
    const updated = await this.prisma.user.update({ where: { id }, data: { isActive: !user.isActive } });
    return this.safeUser(updated);
  }

  private safeUser(user: { id: string; email: string; fullName: string; role: string; isActive: boolean; avatarUrl?: string | null }) {
    return { id: user.id, email: user.email, fullName: user.fullName, role: user.role, isActive: user.isActive, avatarUrl: user.avatarUrl ?? null };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    if (!user.isActive) throw new UnauthorizedException('Usuario inactivo');
    return this.sign(user);
  }

  private sign(user: {
    id: string;
    email: string;
    role: string;
    fullName: string;
    avatarUrl?: string | null;
  }) {
    const token = this.jwt.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    return {
      accessToken: token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        avatarUrl: user.avatarUrl ?? null,
      },
    };
  }
}
