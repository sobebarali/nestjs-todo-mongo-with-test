import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  Length,
} from 'class-validator';
import { TodoStatus } from '../entities/todo.entity';


export class CreateTodoDto {
  @IsNotEmpty()
  @IsString()
  @Length(3, 100) 
  readonly title: string;

  @IsString()
  @IsOptional()
  @Length(3, 500) 
  readonly description?: string;

  @IsEnum(TodoStatus)
  @IsOptional()
  readonly status?: TodoStatus;
}
