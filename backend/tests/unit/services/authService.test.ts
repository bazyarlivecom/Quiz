import { AuthService } from '../../../src/modules/auth/services/authService';
import { UserRepository } from '../../../src/modules/auth/repositories/userRepository';
import { ConflictError, UnauthorizedError } from '../../../src/shared/utils/errors';

jest.mock('../../../src/modules/auth/repositories/userRepository');
jest.mock('../../../src/shared/utils/bcrypt');
jest.mock('../../../src/shared/utils/jwt');

describe('AuthService', () => {
  let authService: AuthService;
  let mockUserRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    mockUserRepository = new UserRepository() as jest.Mocked<UserRepository>;
    authService = new AuthService();
    (authService as any).userRepository = mockUserRepository;
  });

  describe('registerUser', () => {
    it('should register a new user successfully', async () => {
      const registerDto = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Test123!@#',
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.findByUsername.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue({
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed',
        level: 1,
        xp: 0,
        total_score: 0,
        avatar_url: null,
        is_active: true,
        is_admin: false,
        last_login_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      });

      const { hashPassword } = require('../../../src/shared/utils/bcrypt');
      hashPassword.mockResolvedValue('hashed');

      const { generateToken, generateRefreshToken } = require('../../../src/shared/utils/jwt');
      generateToken.mockReturnValue('token');
      generateRefreshToken.mockReturnValue('refreshToken');

      const result = await authService.registerUser(registerDto);

      expect(result.user.username).toBe('testuser');
      expect(result.token).toBe('token');
      expect(result.refreshToken).toBe('refreshToken');
    });

    it('should throw ConflictError if email exists', async () => {
      const registerDto = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Test123!@#',
      };

      mockUserRepository.findByEmail.mockResolvedValue({
        id: 1,
        username: 'existing',
        email: 'test@example.com',
        password_hash: 'hash',
        level: 1,
        xp: 0,
        total_score: 0,
        avatar_url: null,
        is_active: true,
        is_admin: false,
        last_login_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      });

      await expect(authService.registerUser(registerDto)).rejects.toThrow(ConflictError);
    });
  });

  describe('loginUser', () => {
    it('should login user successfully', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'Test123!@#',
      };

      mockUserRepository.findByEmail.mockResolvedValue({
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed',
        level: 1,
        xp: 0,
        total_score: 0,
        avatar_url: null,
        is_active: true,
        is_admin: false,
        last_login_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      });

      const { comparePassword } = require('../../../src/shared/utils/bcrypt');
      comparePassword.mockResolvedValue(true);

      const { generateToken, generateRefreshToken } = require('../../../src/shared/utils/jwt');
      generateToken.mockReturnValue('token');
      generateRefreshToken.mockReturnValue('refreshToken');

      const result = await authService.loginUser(loginDto);

      expect(result.user.email).toBe('test@example.com');
      expect(result.token).toBe('token');
    });

    it('should throw UnauthorizedError for invalid credentials', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'WrongPassword',
      };

      mockUserRepository.findByEmail.mockResolvedValue({
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed',
        level: 1,
        xp: 0,
        total_score: 0,
        avatar_url: null,
        is_active: true,
        is_admin: false,
        last_login_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      });

      const { comparePassword } = require('../../../src/shared/utils/bcrypt');
      comparePassword.mockResolvedValue(false);

      await expect(authService.loginUser(loginDto)).rejects.toThrow(UnauthorizedError);
    });
  });
});

