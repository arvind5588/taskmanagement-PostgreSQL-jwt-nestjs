import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
  ) {}

  create(createTaskDto: CreateTaskDto) {
    return this.taskRepository.save(createTaskDto);
  }

  findAll() {
    return this.taskRepository.find();
  }

  async findOne(id: string) {
    const taskList = await this.taskRepository.findOne({ where: { id } });
    if (!taskList) {
      throw new HttpException(
        `taskList with id=${id} not found!`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return taskList;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto) {
    await this.taskRepository.update(id, updateTaskDto);
    return this.taskRepository.findOne({ where: { id } });
  }

  async remove(id: string) {
    const taskToRemove = await this.taskRepository.findOne({ where: { id } });
    return this.taskRepository.remove(taskToRemove);
  }
}
