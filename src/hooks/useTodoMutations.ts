import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  addTodo,
  completeTodo,
  deleteTodo,
  updateTodo,
  type CompleteTodoPayload,
  type TodoPayload,
  type UpdateTodoPayload,
} from '../lib/api/todos';
import { queryKeys } from '../lib/queryKeys';

function useInvalidateTodos() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.todos.all });
  };
}

function useInvalidateWallet() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.categories });
    void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    void queryClient.invalidateQueries({ queryKey: queryKeys.statement.all });
    void queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all });
  };
}

export function useAddTodo() {
  const invalidate = useInvalidateTodos();
  return useMutation({
    mutationFn: (payload: TodoPayload) => addTodo(payload),
    onSuccess: invalidate,
  });
}

export function useUpdateTodo() {
  const invalidate = useInvalidateTodos();
  return useMutation({
    mutationFn: (payload: UpdateTodoPayload) => updateTodo(payload),
    onSuccess: invalidate,
  });
}

export function useDeleteTodo() {
  const invalidate = useInvalidateTodos();
  return useMutation({
    mutationFn: (todoId: string) => deleteTodo(todoId),
    onSuccess: invalidate,
  });
}

export function useCompleteTodo() {
  const invalidateTodos = useInvalidateTodos();
  const invalidateWallet = useInvalidateWallet();
  return useMutation({
    mutationFn: (payload: CompleteTodoPayload) => completeTodo(payload),
    onSuccess: () => {
      invalidateTodos();
      invalidateWallet();
    },
  });
}
