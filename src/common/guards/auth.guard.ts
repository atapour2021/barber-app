import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { AuthGuard as BaseAuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends BaseAuthGuard('jwt') implements CanActivate {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}