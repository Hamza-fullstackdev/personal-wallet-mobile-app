import { useCallback, useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import {
  AppText,
  Banner,
  Button,
  Card,
  Input,
  Screen,
  Select,
  type SelectOption,
} from '../../components/ui';
import { useCurrencies } from '../../hooks/useCurrencies';
import { useUpdateUser } from '../../hooks/useWalletMutations';
import { useAuthStore } from '../../store/authStore';
import { Colors, Radius, Spacing } from '../../theme';
import { initialOf } from '../../utils/format';

export function SettingsScreen() {
  const user = useAuthStore((state) => state.user);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const signOut = useAuthStore((state) => state.signOut);

  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [password, setPassword] = useState('');
  const [currency, setCurrency] = useState(user?.currency ?? 'PKR');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const { currencies, loading: currenciesLoading } = useCurrencies();
  const updateUserMutation = useUpdateUser();

  const currencyOptions: SelectOption[] = useMemo(
    () =>
      currencies.map((item) => ({
        label: `${item.name} (${item.currency})`,
        value: item.currency,
        description: item.country,
      })),
    [currencies],
  );

  const validate = useCallback(() => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = 'Name is required.';
    else if (name.trim().length < 3) next.name = 'Name must be at least 3 characters.';
    if (!email.trim()) next.email = 'Email is required.';
    else if (!email.includes('@')) next.email = 'Enter a valid email.';
    if (password && password.length < 8) next.password = 'Password must be at least 8 characters.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [name, email, password]);

  const handleSubmit = async () => {
    setFormError(null);
    if (!validate()) return;

    try {
      const payload: { name: string; email: string; currency: string; password?: string } = {
        name: name.trim(),
        email: email.trim(),
        currency,
      };
      if (password) payload.password = password;

      const result = await updateUserMutation.mutateAsync(payload);
      updateProfile(result.user);
      setPassword('');
      Alert.alert('Success', 'Profile updated successfully.');
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Something went wrong.');
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  return (
    <Screen title="Settings" subtitle="Manage your profile and preferences" icon="settings-outline">
      <Card style={styles.profileCard}>
        <View style={styles.avatar}>
          <AppText variant="h2" color={Colors.onPrimary}>
            {initialOf(user?.name)}
          </AppText>
        </View>
        <View style={styles.profileInfo}>
          <AppText variant="h3" numberOfLines={1}>
            {user?.name}
          </AppText>
          <AppText variant="caption" numberOfLines={1}>
            {user?.email}
          </AppText>
        </View>
      </Card>

      <Card style={styles.formCard}>
        <AppText variant="h3" style={styles.formTitle}>
          Profile details
        </AppText>

        {formError ? <Banner message={formError} type="error" style={styles.banner} /> : null}

        <View style={styles.fields}>
          <Input
            label="Full name"
            value={name}
            onChangeText={setName}
            leftIcon="person-outline"
            error={errors.name}
          />
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            leftIcon="mail-outline"
            error={errors.email}
          />
          <Input
            label="New password"
            placeholder="Leave blank to keep current"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            leftIcon="lock-closed-outline"
            error={errors.password}
          />
          <Select
            label="Preferred currency"
            options={currencyOptions}
            value={currency}
            onChange={setCurrency}
            icon="cash-outline"
            disabled={currenciesLoading}
            placeholder={currenciesLoading ? 'Loading currencies...' : 'Choose a currency'}
            sheetTitle="Currency"
          />
        </View>

        <Button
          title="Save Changes"
          onPress={handleSubmit}
          loading={updateUserMutation.isPending}
          disabled={updateUserMutation.isPending}
          style={styles.saveButton}
        />
      </Card>

      <Button
        title="Sign Out"
        variant="danger"
        icon="log-out-outline"
        onPress={handleLogout}
        style={styles.logoutButton}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: { flex: 1 },
  formCard: { marginBottom: Spacing.lg },
  formTitle: { marginBottom: Spacing.lg },
  banner: { marginBottom: Spacing.lg },
  fields: { gap: Spacing.lg },
  saveButton: { marginTop: Spacing.xl },
  logoutButton: { marginBottom: Spacing.xxl },
});

export default SettingsScreen;
