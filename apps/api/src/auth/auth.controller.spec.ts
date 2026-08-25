import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { PasswordResetService } from './password-reset.service';
import { OAuthService } from './oauth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let passwordResetService: {
    handleForgotPassword: jest.Mock;
    handleResetPassword: jest.Mock;
  };
  let oAuthService: {
    loginWithGoogle: jest.Mock;
    loginWithFacebook: jest.Mock;
  };

  beforeEach(async () => {
    passwordResetService = {
      handleForgotPassword: jest.fn(),
      handleResetPassword: jest.fn(),
    };
    oAuthService = {
      loginWithGoogle: jest.fn(),
      loginWithFacebook: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: PasswordResetService, useValue: passwordResetService },
        { provide: OAuthService, useValue: oAuthService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('loginWithGoogle', () => {
    it('calls oAuthService.loginWithGoogle with dto', async () => {
      oAuthService.loginWithGoogle.mockResolvedValue({
        message: 'Google login ok',
      });

      const res = await controller.loginWithGoogle({
        idToken: 'google-token',
      });

      expect(oAuthService.loginWithGoogle).toHaveBeenCalledWith({
        idToken: 'google-token',
      });
      expect(res).toEqual({ message: 'Google login ok' });
    });
  });

  describe('loginWithFacebook', () => {
    it('calls oAuthService.loginWithFacebook with dto', async () => {
      oAuthService.loginWithFacebook.mockResolvedValue({
        message: 'Facebook login ok',
      });

      const res = await controller.loginWithFacebook({
        accessToken: 'fb-token',
      });

      expect(oAuthService.loginWithFacebook).toHaveBeenCalledWith({
        accessToken: 'fb-token',
      });
      expect(res).toEqual({ message: 'Facebook login ok' });
    });
  });

  describe('forgotPassword', () => {
    it('calls handleForgotPassword with email', async () => {
      passwordResetService.handleForgotPassword.mockResolvedValue({
        message: 'Sent',
      });

      const res = await controller.forgotPassword({
        email: 'test@example.com',
      });

      expect(passwordResetService.handleForgotPassword).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(res).toEqual({ message: 'Sent' });
    });
  });

  describe('resetPassword', () => {
    it('calls handleResetPassword with token and password', async () => {
      passwordResetService.handleResetPassword.mockResolvedValue({
        message: 'Success',
      });

      const res = await controller.resetPassword({
        token: 'test-token',
        password: 'ValidPassword123!',
      });

      expect(passwordResetService.handleResetPassword).toHaveBeenCalledWith(
        'test-token',
        'ValidPassword123!',
      );
      expect(res).toEqual({ message: 'Success' });
    });
  });
});
