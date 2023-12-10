import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum TodoStatus {
  Pending = 'pending',
  InProgress = 'in-progress',
  Completed = 'completed',
}

@Schema({ timestamps: true })
export class Todo extends Document {
  @Prop({ required: true, minlength: 3, maxlength: 50 })
  title: string;

  @Prop({ minlength: 3, maxlength: 200 })
  description: string;

  @Prop({
    required: true,
    enum: TodoStatus,
    default: TodoStatus.Pending,
  })
  status: TodoStatus;

  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;
}

export const TodoSchema = SchemaFactory.createForClass(Todo);

TodoSchema.index({ isDeleted: 1 });
TodoSchema.index({ isDeleted: 1, status: 1 });
TodoSchema.index({ isDeleted: 1, createdAt: -1 });



