export class TaskDto {
  id: string;
  title: string;
  description?: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}
