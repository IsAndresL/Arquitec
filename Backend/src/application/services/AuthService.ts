import { prisma } from '@/shared/config/database'
import { hashPassword, comparePassword, generatePIN, hashPIN, verifyPIN } from '@/shared/utils/password'
import { generateUserToken, generateFarmerToken } from '@/shared/utils/jwt'
import { AppError, UnauthorizedError, NotFoundError, ValidationError, ConflictError } from '@/shared/errors/AppError'
import { setCache, deleteCache } from '@/shared/config/redis'

export class AuthService {
  async loginTechnician(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      throw new UnauthorizedError('Credenciales inválidas')
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedError('Cuenta bloqueada temporalmente. Intente más tarde.')
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Cuenta desactivada')
    }

    const isValid = await comparePassword(password, user.password)

    if (!isValid) {
      const failedLogins = user.failedLogins + 1
      const lockedUntil = failedLogins >= 5 ? new Date(Date.now() + 30 * 60 * 1000) : null
      
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLogins, lockedUntil },
      })

      throw new UnauthorizedError('Credenciales inválidas')
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { failedLogins: 0, lockedUntil: null, lastLoginAt: new Date() },
    })

    const token = generateUserToken(user.id, user.email, user.role)
    
    await setCache(`session:${user.id}`, token, 60 * 60 * 24 * 30)

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    }
  }

  async loginFarmer(farmerIdOrName: string, pin: string) {
    const trimmedInput = farmerIdOrName.trim();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(trimmedInput);
    
    let farmers = [];
    if (isUuid) {
      const f = await prisma.farmerProfile.findUnique({
        where: { id: trimmedInput }
      });
      if (f) farmers.push(f);
    } else {
      farmers = await prisma.farmerProfile.findMany({
        where: { 
          name: { equals: trimmedInput, mode: 'insensitive' },
          isActive: true
        }
      });
    }

    if (farmers.length === 0) {
      throw new NotFoundError('Campesino no encontrado');
    }

    let authenticatedFarmer = null;

    for (const farmer of farmers) {
      if (farmer.isLocked && farmer.lockedUntil && farmer.lockedUntil > new Date()) {
        throw new UnauthorizedError('Perfil bloqueado temporalmente. Contacte al técnico.');
      }

      if (!farmer.isActive) {
        continue;
      }

      const isValid = await verifyPIN(pin, farmer.pinHash);
      if (isValid) {
        authenticatedFarmer = farmer;
        break;
      }
    }

    if (!authenticatedFarmer) {
      // Incrementar intentos fallidos para el primer agricultor con ese nombre para control de fuerza bruta
      const targetFarmer = farmers[0];
      const failedAttempts = targetFarmer.failedAttempts + 1;
      const lockedUntil = failedAttempts >= 3 ? new Date(Date.now() + 5 * 60 * 1000) : null;
      const isLocked = failedAttempts >= 3;

      await prisma.farmerProfile.update({
        where: { id: targetFarmer.id },
        data: { failedAttempts, lockedUntil, isLocked },
      });

      throw new UnauthorizedError('PIN incorrecto');
    }

    await prisma.farmerProfile.update({
      where: { id: authenticatedFarmer.id },
      data: { failedAttempts: 0, lockedUntil: null, isLocked: false },
    });

    const token = generateFarmerToken(authenticatedFarmer.id, authenticatedFarmer.name);

    return {
      token,
      farmer: {
        id: authenticatedFarmer.id,
        name: authenticatedFarmer.name,
        photoUrl: authenticatedFarmer.photoUrl,
      },
    };
  }

  async createTechnician(email: string, password: string, name: string) {
    const existing = await prisma.user.findUnique({ where: { email } })

    if (existing) {
      throw new ConflictError('Ya existe un usuario con este email')
    }

    const hashedPassword = await hashPassword(password)

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'TECNICO_ADMIN',
      },
    })

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    }
  }

  async logout(userId: string) {
    await deleteCache(`session:${userId}`)
    return { message: 'Sesión cerrada' }
  }
}

export const authService = new AuthService()
