import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  register(dto: any) { return { message: 'User registered', data: dto }; }
  login(dto: any) { return { message: 'User logged in', data: dto }; }
}
