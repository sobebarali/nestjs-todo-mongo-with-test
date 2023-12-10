import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateTodoDto } from './dto/create-todo.dto';
import { Todo, TodoStatus } from './entities/todo.entity';
import { UpdateTodoDto } from './dto/update-todo.dto';

@Injectable()
export class TodosService {
  private readonly logger = new Logger(TodosService.name);

  constructor(
    @InjectModel(Todo.name) private readonly todoModel: Model<Todo>,
  ) {}

  // Create a new todo
  async create(createTodoDto: CreateTodoDto): Promise<Todo> {
    try {
      const newTodo = new this.todoModel(createTodoDto);
      return await newTodo.save();
    } catch (error) {
      this.logger.error(`Error creating todo: ${error.message}`);
      throw new BadRequestException('Invalid todo data');
    }
  }

  // Get all todos with optional pagination
  async findAll(
    page?: number,
    limit?: number,
    status?: TodoStatus,
  ): Promise<Todo[]> {
    // Default pagination values
    page = page || 1;

    // Default limit value
    limit = limit || 10;

    
    const skip = (page - 1) * limit;
    const query = this.todoModel.find({ isDeleted: false });

    // Optional status filter
    if (status) {
      query.where({ status });
    }

    // Default sorting by createdAt in descending order
    query.sort({ createdAt: -1 });

    return query.skip(skip).limit(limit).lean().exec();
  }

  // Get a single todo by id
  async findOne(id: string): Promise<Todo> {
    const todo = await this.todoModel
      .findOne({ _id: id, isDeleted: { $ne: true } })
      .lean()
      .exec();
    if (!todo) {
      this.logger.error(`Todo with ID "${id}" not found`);
      throw new NotFoundException(`Todo with ID "${id}" not found`);
    }
    return todo;
  }

  // Update a todo by id
  async update(id: string, updateTodoDto: UpdateTodoDto): Promise<Todo> {
    try {
      const updatedTodo = await this.todoModel
        .findByIdAndUpdate(id, updateTodoDto, {
          new: true,
          runValidators: true,
        })
        .lean()
        .exec();

      if (!updatedTodo) {
        throw new NotFoundException(`Todo with ID "${id}" not found`);
      }

      return updatedTodo;
    } catch (error) {
      this.logger.error(`Error updating todo with ID ${id}: ${error.message}`);
      if (error.name === 'ValidationError') {
        throw new BadRequestException('Invalid update data');
      }
      throw error;
    }
  }

  // Soft delete a todo by id
  async remove(id: string): Promise<void> {
    const result = await this.todoModel
      .findByIdAndUpdate(id, { isDeleted: true, deletedAt: new Date() })
      .lean()
      .exec();

    if (!result) {
      this.logger.error(`Todo with ID "${id}" not found`);
      throw new NotFoundException(`Todo with ID "${id}" not found`);
    }
  }

  // Permanently delete a todo by id
  async delete(id: string): Promise<void> {
    const result = await this.todoModel.findByIdAndDelete(id).lean().exec();

    if (!result) {
      this.logger.error(`Todo with ID "${id}" not found`);
      throw new NotFoundException(`Todo with ID "${id}" not found`);
    }
  }

  //Delete all soft deleted todos
  async deleteSoftDeleted(): Promise<void> {
    await this.todoModel.deleteMany({ isDeleted: true }).lean().exec();
  }

  //Delete all todos
  async deleteAll(): Promise<void> {
    await this.todoModel.deleteMany({}).lean().exec();
  }
}
