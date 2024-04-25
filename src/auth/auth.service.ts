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
import { ERROR_MESSAGES } from '../utils/messages';

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
        const errorMessages = errors
          .map((error) => Object.values(error.constraints))
          .flat();
        this.logger.debug(`${errorMessages}`, AuthService.name);
        this.logger.debug(`${errors}`, AuthService.name);
        throw new BadRequestException(errorMessages);
      } else {
        isOk = true;
      }
    });

    if (isOk) {
      const userDetails = await this.usersRepository.findOne({
        where: { email: user.email },
      });
      if (userDetails == null) {
        throw new UnauthorizedException(ERROR_MESSAGES.INVALID_CREDENTIALS);
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
        throw new UnauthorizedException(ERROR_MESSAGES.INVALID_CREDENTIALS);
      }
    } else {
      throw new BadRequestException(ERROR_MESSAGES.INVALID_INPUT);
    }
  }

  async createUser(body: any): Promise<Record<string, any>> {
    let isOk = false;

    const userDTO = new UsersDTO();
    userDTO.email = body.email;
    userDTO.password = body.password;

    await validate(userDTO).then((errors) => {
      if (errors.length > 0) {
        const errorMessages = errors
          .map((error) => Object.values(error.constraints))
          .flat();
        this.logger.debug(`${errorMessages}`, AuthService.name);
        throw new BadRequestException(errorMessages);
      } else {
        isOk = true;
      }
    });
    if (isOk) {
      userDTO.password = bcrypt.hashSync(body.password, 10);
      await this.usersRepository.save(userDTO).catch((error) => {
        this.logger.debug(error.message, AuthService.name);
        isOk = false;
      });
      if (isOk) {
        return {
          statusCode: HttpStatus.CREATED,
          message: ERROR_MESSAGES.REGISTRATION_SUCCESS,
        };
      } else {
        throw new BadRequestException(ERROR_MESSAGES.USER_EXIST);
      }
    } else {
      throw new BadRequestException(ERROR_MESSAGES.INVALID_INPUT);
    }
  }
}
