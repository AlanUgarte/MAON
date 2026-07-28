import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'node:crypto';
import { OAuth2Client } from 'google-auth-library';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

// Dueño del negocio: entrar con esta cuenta de Google siempre da (o restaura) permisos
// de ADMINISTRADOR, sin importar cómo haya quedado el usuario en la base.
const OWNER_EMAIL = 'ugartemultiproductos@gmail.com';

@Injectable()
export class AuthService {
  private readonly googleClient = process.env.GOOGLE_CLIENT_ID
    ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
    : null;

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

  async deleteUser(id: string) {
    try {
      await this.prisma.user.delete({ where: { id } });
      return { ok: true };
    } catch {
      // Tiene ventas/clientes/mensajes asociados: no se puede borrar sin perder ese historial.
      throw new BadRequestException('No se puede borrar: tiene ventas o clientes asociados. Dalo de baja en cambio.');
    }
  }

  private safeUser(user: { id: string; email: string; fullName: string; role: string; isActive: boolean; avatarUrl?: string | null }) {
    return { id: user.id, email: user.email, fullName: user.fullName, role: user.role, isActive: user.isActive, avatarUrl: user.avatarUrl ?? null };
  }

  // Login con Google Identity Services: verifica el idToken contra GOOGLE_CLIENT_ID,
  // y crea el usuario si es la primera vez que entra. OWNER_EMAIL siempre queda (o
  // vuelve a quedar) ADMINISTRADOR y activo, sin importar el estado previo en la base.
  async loginWithGoogle(idToken: string) {
    if (!this.googleClient) {
      throw new BadRequestException('Login con Google no está configurado (falta GOOGLE_CLIENT_ID)');
    }
    const ticket = await this.googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload?.email || !payload.email_verified) {
      throw new UnauthorizedException('No se pudo verificar el email de Google');
    }
    const email = payload.email;
    const isOwner = email === OWNER_EMAIL;

    let user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Password inutilizable: nadie la conoce ni la puede usar, esta cuenta solo entra por Google.
      const randomPassword = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);
      user = await this.prisma.user.create({
        data: {
          email,
          fullName: payload.name ?? email,
          password: randomPassword,
          avatarUrl: payload.picture ?? null,
          role: isOwner ? 'ADMINISTRADOR' : 'VENDEDOR',
        },
      });
    } else if (isOwner && (user.role !== 'ADMINISTRADOR' || !user.isActive)) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { role: 'ADMINISTRADOR', isActive: true },
      });
    }
    if (!user.isActive) throw new UnauthorizedException('Usuario inactivo');
    return this.sign(user);
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
