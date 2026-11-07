import { config } from '../../config';
import type { Category, Todo, TodosResponse } from '../../types';
import { api, type QueryParams } from './client';

export interface TodoQuery extends QueryParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export function getTodos(query: TodoQuery = {}): Promise<TodosResponse> {
  return api.get<TodosResponse>(config.api.todoGet, query);
}

export interface TodoPayload {
  title: string;
  description?: string;
  targetAmount?: number;
  targetDate?: string | null;
}

export function addTodo(payload: TodoPayload): Promise<{ todo: Todo }> {
  return api.post<{ todo: Todo }>(config.api.todoAdd, payload);
}

export interface UpdateTodoPayload extends TodoPayload {
  todoId: string;
}

export function updateTodo(payload: UpdateTodoPayload): Promise<{ todo: Todo }> {
  return api.post<{ todo: Todo }>(config.api.todoUpdate, payload);
}

export function deleteTodo(todoId: string): Promise<{ message: string }> {
  return api.post<{ message: string }>(config.api.todoDelete, { todoId });
}

export interface CompleteTodoPayload {
  todoId: string;
  amount: number;
  categoryId: string;
}

export function completeTodo(
  payload: CompleteTodoPayload,
): Promise<{ todo: Todo; category: Category }> {
  return api.post<{ todo: Todo; category: Category }>(config.api.todoComplete, payload);
}
