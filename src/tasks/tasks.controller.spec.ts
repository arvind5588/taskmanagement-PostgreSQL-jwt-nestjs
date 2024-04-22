import { Test, TestingModule } from '@nestjs/testing';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import * as faker from 'faker';

describe('TasksController', () => {
  let controller: TasksController;
  let service: TasksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [TasksService],
    }).compile();

    controller = module.get<TasksController>(TasksController);
    service = module.get<TasksService>(TasksService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // Add test case to create multiple tasks
  it('should create multiple tasks', async () => {
    const numberOfTasks = 5;
    const createdTasks = [];

    for (let i = 0; i < numberOfTasks; i++) {
      const createTaskDto = {
        title: faker.lorem.words(),
        description: faker.lorem.sentence(),
      };

      const task = await controller.create(createTaskDto);
      createdTasks.push(task);
    }

    // Fetch all tasks from the database
    const allTasks = await service.findAll();
    expect(allTasks.length).toEqual(numberOfTasks);
  });
});
