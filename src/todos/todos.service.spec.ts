import { MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { TodosService } from './todos.service';
import { Todo, TodoSchema, TodoStatus } from './entities/todo.entity';
import { CreateTodoDto } from './dto/create-todo.dto';

describe('TodosService', () => {
  let service: TodosService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot('mongodb://localhost/test_database'),
        MongooseModule.forFeature([{ name: Todo.name, schema: TodoSchema }]),
      ],
      providers: [TodosService],
    }).compile();

    service = module.get<TodosService>(TodosService);
  });

   afterEach(async () => {
    await service.deleteAll();
   });

  it('created a todo successfully', async () => {
    const createTodoDto = {
      title: 'Test Todo',
      description: 'This is a test todo',
    };

    const todo = await service.create(createTodoDto);
    expect(todo).toHaveProperty('id');
    expect(todo.title).toEqual(createTodoDto.title);
    expect(todo.description).toEqual(createTodoDto.description);
    expect(todo.status).toEqual('pending');
    expect(todo.deletedAt).toBeNull();
    expect(todo).toHaveProperty('createdAt');
    expect(todo).toHaveProperty('updatedAt');

    const createTodoDto2 = {
      title: 123, // invalid title type but should be coerced to string as auto-transform is enabled
      description: 'This is a test todo',
    } as unknown as CreateTodoDto;

    const todo2 = await service.create(createTodoDto2);
    expect(todo2).toHaveProperty('id');
    expect(todo2.title).toEqual(createTodoDto2.title.toString());
    expect(todo2.description).toEqual(createTodoDto2.description);
    expect(todo2.status).toEqual('pending');
    expect(todo2.deletedAt).toBeNull();
    expect(todo2).toHaveProperty('createdAt');
    expect(todo2).toHaveProperty('updatedAt');

    const createTodoDto3 = {
      title: 'Test Todo 3',
      description: 'This is a test todo',
      priority: 'high', // priority is not there in the schema but whitelist is enabled so it should be ignored
    };

    const todo3 = await service.create(createTodoDto3);
    expect(todo3).toHaveProperty('id');
    expect(todo3.title).toEqual(createTodoDto3.title);
    expect(todo3.description).toEqual(createTodoDto3.description);
    expect(todo3.status).toEqual('pending');
    expect(todo3.deletedAt).toBeNull();
    expect(todo3).toHaveProperty('createdAt');
    expect(todo3).toHaveProperty('updatedAt');
  });

  it('fails to create a todo with invalid data', async () => {
    const createTodoDto = {
      title: 'T',
      description: 'This is a test todo',
    } as CreateTodoDto;

    await expect(service.create(createTodoDto)).rejects.toThrow(
      'Invalid todo data',
    );

    const createTodoDto2 = {
      title: 'Test Todo',
      description: 'T',
    } as CreateTodoDto;

    await expect(service.create(createTodoDto2)).rejects.toThrow(
      'Invalid todo data',
    );
  });

  it('retrieves a single todo successfully', async () => {
    const newTodo = await service.create({
      title: 'Test Todo',
      description: 'Test Description',
    });

    const retrievedTodo = await service.findOne(newTodo.id);

    expect(retrievedTodo).toBeDefined();
    expect(retrievedTodo).toHaveProperty('_id');
    expect(retrievedTodo.title).toEqual('Test Todo');
    expect(retrievedTodo.description).toEqual('Test Description');
    expect(retrievedTodo.status).toEqual('pending');
    expect(retrievedTodo.deletedAt).toBeNull();
    expect(retrievedTodo).toHaveProperty('createdAt');
    expect(retrievedTodo).toHaveProperty('updatedAt');
    expect(retrievedTodo.__v).toBeDefined();
  });

  it('fails to retrieve a single todo with invalid id', async () => {
    await expect(service.findOne('65123ad133f5112e37acfbc3')).rejects.toThrow(
      'Todo with ID "65123ad133f5112e37acfbc3" not found',
    );
  });

  it('updates a todo successfully', async () => {
    const newTodo = await service.create({
      title: 'Original Title',
      description: 'Original Description',
    });
    const updatedTodo = await service.update(newTodo.id, {
      title: 'Updated Title',
      description: 'Updated Description',
      status: TodoStatus.Completed,
    });

    expect(updatedTodo).toBeDefined();
    expect(updatedTodo).toHaveProperty('_id');
    expect(updatedTodo.title).toEqual('Updated Title');
    expect(updatedTodo.description).toEqual('Updated Description');
    expect(updatedTodo.status).toEqual('completed');
    expect(updatedTodo.deletedAt).toBeNull();
    expect(updatedTodo).toHaveProperty('createdAt');
    expect(updatedTodo).toHaveProperty('updatedAt');
    expect(updatedTodo.__v).toBeDefined();
  });

  it('fails to update a todo with invalid id', async () => {
    await expect(
      service.update('65123ad133f5112e37acfbc3', {
        title: 'Updated Title',
        description: 'Updated Description',
        status: TodoStatus.Completed,
      }),
    ).rejects.toThrow('Todo with ID "65123ad133f5112e37acfbc3" not found');
  });

  it('fails to update a todo with invalid data', async () => {
    const newTodo = await service.create({
      title: 'Original Title',
      description: 'Original Description',
    });

    await expect(
      service.update(newTodo.id, {
        title: 'T',
        description: 'Updated Description',
        status: TodoStatus.Completed,
      }),
    ).rejects.toThrow('Invalid update data');

    await expect(
      service.update(newTodo.id, {
        title: 'Updated Title',
        description: 'T',
        status: TodoStatus.Completed,
      }),
    ).rejects.toThrow('Invalid update data');
  });

  it('soft deletes a todo successfully', async () => {
    const newTodo = await service.create({
      title: 'Test Todo',
      description: 'Test Description',
    });
    await service.remove(newTodo.id);

    await expect(service.findOne(newTodo.id)).rejects.toThrow(
      'Todo with ID "' + newTodo.id + '" not found',
    );
  });

  it('fails to soft delete a todo with invalid id', async () => {
    await expect(
      service.remove('65123ad133f5112e37acfbc3'),
    ).rejects.toThrow('Todo with ID "65123ad133f5112e37acfbc3" not found');
  });

  it('permanently deletes a todo successfully', async () => {
    const newTodo = await service.create({
      title: 'Test Todo',
      description: 'Test Description',
    });
    await service.delete(newTodo.id);

    await expect(service.findOne(newTodo.id)).rejects.toThrow(
      'Todo with ID "' + newTodo.id + '" not found',
    );
  });

  it('fails to permanently delete a todo with invalid id', async () => {
    await expect(
      service.delete('65123ad133f5112e37acfbc3'),
    ).rejects.toThrow('Todo with ID "65123ad133f5112e37acfbc3" not found');
  });

  it('deletes all soft deleted todos successfully', async () => {
   let todo1 = await service.create({
      title: 'Test Todo 1',
      description: 'Test Description 1',
    });
    let todo2 = await service.create({
      title: 'Test Todo 2',
      description: 'Test Description 2',
    });
   let todo3 = await service.create({
      title: 'Test Todo 3',
      description: 'Test Description 3',
    });

    await service.remove(todo1.id);
   
    await service.deleteSoftDeleted();

    const todos = await service.findAll();

    expect(todos).toBeDefined();
    expect(todos).toHaveLength(2);
  });

  it('retrieves all todos successfully', async () => {
    await service.create({
      title: 'Test Todo 1',
      description: 'Test Description 1',
    });
    await service.create({
      title: 'Test Todo 2',
      description: 'Test Description 2',
    });
    await service.create({
      title: 'Test Todo 3',
      description: 'Test Description 3',
    });

    const todos = await service.findAll();


    expect(todos).toBeDefined();
    expect(todos).toHaveLength(3);
  });

  it('retrieves all todos with pagination successfully', async () => {
    await service.create({
      title: 'Test Todo 1',
      description: 'Test Description 1',
    });
    await service.create({
      title: 'Test Todo 2',
      description: 'Test Description 2',
    });
    await service.create({
      title: 'Test Todo 3',
      description: 'Test Description 3',
    });

    const todos = await service.findAll(2, 2);

    expect(todos).toBeDefined();
    expect(todos).toHaveLength(1);
  });

  it('retrieves all todos with status filter successfully', async () => {
    await service.create({
      title: 'Test Todo 1',
      description: 'Test Description 1',
      status: TodoStatus.Completed,
    });
    await service.create({
      title: 'Test Todo 2',
      description: 'Test Description 2',
      status: TodoStatus.Completed,
    });
    await service.create({
      title: 'Test Todo 3',
      description: 'Test Description 3',
      status: TodoStatus.Pending,
    });

    const todos = await service.findAll(1, 10, TodoStatus.Completed);

    expect(todos).toBeDefined();
    expect(todos).toHaveLength(2);
  });
});
