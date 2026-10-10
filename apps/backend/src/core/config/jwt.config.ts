import { registerAs } from '@nestjs/config';
import { jwtConfiguration } from '../auth/jwt-configuration';

export default registerAs('jwt', (): { secret: string; expiresIn: string } => ({
  secret: jwtConfiguration(process.env.JWT_SECRET).secret,
  expiresIn: process.env.JWT_EXPIRES_IN || '3600',
}));
