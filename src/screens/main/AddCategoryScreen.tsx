import { CategoryForm } from '../../components/forms/CategoryForm';
import { Screen } from '../../components/ui';

export function AddCategoryScreen() {
  return (
    <Screen title="New Category" subtitle="Create a wallet bucket">
      <CategoryForm />
    </Screen>
  );
}

export default AddCategoryScreen;
