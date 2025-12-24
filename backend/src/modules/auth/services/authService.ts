import { UserRepository } from '../repositories/userRepository';
import { hashPassword, comparePassword } from '../../../shared/utils/bcrypt';
import { generateToken, generateRefreshToken } from '../../../shared/utils/jwt';
import { ConflictError, UnauthorizedError } from '../../../shared/utils/errors';
import { RegisterDto } from '../dto/registerDto';
import { LoginDto } from '../dto/loginDto';
import { AuthResponseDto } from '../dto/authResponseDto';

export class AuthService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async registerUser(dto: RegisterDto): Promise<AuthResponseDto> {
    const existingUserByEmail = await this.userRepository.findByEmail(dto.email);
    if (existingUserByEmail) {
      throw new ConflictError('User with this email already exists');
    }

    const existingUserByUsername = await this.userRepository.findByUsername(dto.username);
    if (existingUserByUsername) {
      throw new ConflictError('User with this username already exists');
    }

    const passwordHash = await hashPassword(dto.password);

    const user = await this.userRepository.create({
      username: dto.username,
      email: dto.email,
      password_hash: passwordHash,
    });

    const token = generateToken({ userId: user.id, email: user.email });
    const refreshToken = generateRefreshToken({ userId: user.id, email: user.email });

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        level: user.level,
        xp: user.xp,
        totalScore: user.total_score,
        avatarUrl: user.avatar_url,
      },
      token,
      refreshToken,
    };
  }

  async loginUser(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.is_active) {
      throw new UnauthorizedError('User account is inactive');
    }

    const isPasswordValid = await comparePassword(dto.password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    await this.userRepository.updateLastLogin(user.id);

    const token = generateToken({ userId: user.id, email: user.email });
    const refreshToken = generateRefreshToken({ userId: user.id, email: user.email });

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        level: user.level,
        xp: user.xp,
        totalScore: user.total_score,
        avatarUrl: user.avatar_url,
      },
      token,
      refreshToken,
    };
  }

  async validateToken(token: string): Promise<{ userId: number; email: string }> {
    const { verifyToken } = await import('../../../shared/utils/jwt');
    return verifyToken(token);
  }
}

