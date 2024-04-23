import {
  BadRequestException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersDTO } from './dto/users.dto';
import { validate } from 'class-validator';
import { JwtService } from '@nestjs/jwt';
import { LoggerService } from '../logger/logger.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Users } from './entities/users.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private logger: LoggerService,
    private jwtService: JwtService,
    @InjectRepository(Users) private usersRepository: Repository<Users>,
  ) {}

  async login(user: any): Promise<Record<string, any>> {
    let isOk = false;

    const userDTO = new UsersDTO();
    userDTO.email = user.email;
    userDTO.password = user.password;

    await validate(userDTO).then((errors) => {
      if (errors.length > 0) {
        this.logger.debug(`${errors}`, AuthService.name);
      } else {
        isOk = true;
      }
    });

    if (isOk) {
      const userDetails = await this.usersRepository.findOne({
        where: { email: user.email },
      });
      if (userDetails == null) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const isValid = bcrypt.compareSync(user.password, userDetails.password);
      if (isValid) {
        return {
          statusCode: HttpStatus.CREATED,
          message: 'User logged in successfully.',
          data: {
            email: user.email,
            access_token: this.jwtService.sign(
              { email: user.email },
              {
                secret: process.env.JWT_SECRET,
              },
            ),
          },
        };
      } else {
        throw new UnauthorizedException('Invalid credentials');
      }
    } else {
      throw new BadRequestException('Invalid credentials');
    }
  }

  async createUser(body: any): Promise<Record<string, any>> {
    let isOk = false;

    const userDTO = new UsersDTO();
    userDTO.email = body.email;
    userDTO.password = bcrypt.hashSync(body.password, 10);

    await validate(userDTO).then((errors) => {
      if (errors.length > 0) {
        this.logger.debug(`${errors}`, AuthService.name);
      } else {
        isOk = true;
      }
    });
    if (isOk) {
      await this.usersRepository.save(userDTO).catch((error) => {
        this.logger.debug(error.message, AuthService.name);
        isOk = false;
      });
      if (isOk) {
        return {
          statusCode: HttpStatus.CREATED,
          message: `User has been registered successfully.`,
        };
      } else {
        throw new BadRequestException('User already exists');
      }
    } else {
      throw new BadRequestException('Invalid content');
    }
  }
}
