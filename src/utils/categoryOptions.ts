import type { SelectOption } from '../components/ui/Select';
import type { Category } from '../types';
import { formatAmount } from './format';

/** Build Select options from categories, showing the live balance like the web app. */
export function pickCategoryOptions(categories: Category[]): SelectOption[] {
  return categories.map((category) => ({
    label: `${category.name} (${formatAmount(category.balance)})`,
    value: category._id,
    description: category.description,
  }));
}

export default pickCategoryOptions;
