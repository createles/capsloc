import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';


/* 
Extends Passport's AuthGuard with jwt strategy
Intercept incoming requests and execute JwtStrategy.validate()
and attach sanitized user object to req.user
Throws 401 Unauthorized if Bearer token missing, expired, or invalid
*/
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}