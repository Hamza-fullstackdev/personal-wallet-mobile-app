import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Banner, Button, Card, Input, Logo, Screen } from '../../components/ui';
import { useLogin } from '../../hooks/useLogin';
import { Spacing } from '../../theme';

export function LoginScreen() {
  const loginMutation = useLogin();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!email.trim()) next.email = 'Email is required.';
    if (!password) next.password = 'Password is required.';
    else if (password.length < 8) next.password = 'Password must be at least 8 characters.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    setFormError(null);
    if (!validate()) return;

    try {
      await loginMutation.mutateAsync({ email: email.trim(), password });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to sign in.');
    }
  };

  return (
    <Screen scroll showBack={false} padded={false} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Logo tagline="Your money, organized." />
      </View>

      <Card style={styles.card}>
        <AppText variant="h3" style={styles.cardTitle}>
          Sign in
        </AppText>
        <AppText variant="caption" style={styles.cardSubtitle}>
          Welcome back. Enter your details to continue.
        </AppText>

        {formError ? <Banner message={formError} type="error" style={styles.banner} /> : null}

        <View style={styles.fields}>
          <Input
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            leftIcon="mail-outline"
            error={errors.email}
          />
          <Input
            label="Password"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            leftIcon="lock-closed-outline"
            error={errors.password}
          />
        </View>

        <Button
          title="Sign In"
          onPress={handleSubmit}
          loading={loginMutation.isPending}
          disabled={loginMutation.isPending}
          style={styles.submit}
        />
      </Card>

      <AppText variant="caption" center style={styles.footer}>
        Accounts are created by the administrator. Contact support if you need access.
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xxxl,
  },
  card: {
    padding: Spacing.xl,
  },
  cardTitle: {
    marginBottom: Spacing.xs,
  },
  cardSubtitle: {
    marginBottom: Spacing.lg,
  },
  banner: {
    marginBottom: Spacing.lg,
  },
  fields: {
    gap: Spacing.lg,
  },
  submit: {
    marginTop: Spacing.xl,
  },
  footer: {
    marginTop: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
  },
});

export default LoginScreen;
