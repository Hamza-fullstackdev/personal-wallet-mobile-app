import { useRoute, type RouteProp } from '@react-navigation/native';

import { TodoForm } from '../../components/forms/TodoForm';
import { Screen } from '../../components/ui';
import type { TodosStackParamList } from '../../navigation/types';

type Route = RouteProp<TodosStackParamList, 'TodoForm'>;

export function TodoFormScreen() {
  const route = useRoute<Route>();
  const isEditing = Boolean(route.params?.todo);

  return (
    <Screen title={isEditing ? 'Edit Todo' : 'New Todo'} icon="flag-outline">
      <TodoForm />
    </Screen>
  );
}

export default TodoFormScreen;
