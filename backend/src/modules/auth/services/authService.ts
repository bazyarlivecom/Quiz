import { userRepository, User } from '../repositories/userRepository';
import { hashPassword, comparePassword } from '../../../shared/utils/bcrypt';
import { generateToken, generateRefreshToken } from '../../../shared/utils/jwt';
import { ValidationError, NotFoundError, UnauthorizedError } from '../../../shared/utils/errors';
import { RegisterDto, LoginDto, AuthResponse } from '../dto/auth.dto';

export const authService = {
  async register(dto: RegisterDto): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await userRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new ValidationError('User with this email already exists');
    }

    const existingUsername = await userRepository.findByUsername(dto.username);
    if (existingUsername) {
      throw new ValidationError('Username already taken');
    }

    // Hash password
    const password_hash = await hashPassword(dto.password);

    // Create user
    const user = await userRepository.create({
      username: dto.username,
      email: dto.email,
      password_hash,
    });

    // Generate tokens
    const token = generateToken({
      userId: user.id,
      email: user.email,
      username: user.username,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
      username: user.username,
    });

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        level: user.level,
        xp: user.xp,
        totalScore: user.total_score,
      },
      token,
      refreshToken,
    };
  },

  async login(dto: LoginDto): Promise<AuthResponse> {
    // Find user
    const user = await userRepository.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.is_active) {
      throw new UnauthorizedError('Account is inactive');
    }

    // Verify password
    const isPasswordValid = await comparePassword(dto.password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Update last login
    await userRepository.updateLastLogin(user.id);

    // Generate tokens
    const token = generateToken({
      userId: user.id,
      email: user.email,
      username: user.username,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
      username: user.username,
    });

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        level: user.level,
        xp: user.xp,
        totalScore: user.total_score,
      },
      token,
      refreshToken,
    };
  },

  async getMe(userId: number): Promise<User> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }
    return user;
  },
};



