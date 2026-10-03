import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ErrorCode, USERNAME_MAX_LENGTH, USERNAME_MIN_LENGTH, usernameSchema } from '@roadtalk/contracts';
import type React from 'react';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApiError } from '../../lib/http';
import { Button, colors, MockTag, spacing, Text } from '../../ui';
import { useAuthStore } from '../auth/auth.store';
import { Avatar } from './Avatar';
import { styles } from './ProfileCardScreen.styles';
import { useHandleSuggestion } from './useHandleSuggestion';

const AVATAR_SIZE = 96;
const UNLOCK_DATE_FORMATTER = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

interface Props {
  // Présent quand la fiche est ouverte depuis l'app (modification) : affiche
  // un bouton de fermeture. Absent à la première connexion, où la fiche est
  // un passage obligé.
  readonly onClose?: () => void;
}

// La fiche d'identité d'un utilisateur : portrait et identifiant public
// "Pseudo#TAG" (ADR-003). Un seul écran pour la première connexion et pour
// la modification — la seule différence est le bouton de fermeture.
export function ProfileCardScreen({ onClose }: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const saveHandle = useAuthStore((state) => state.saveHandle);
  const savedUsername = useAuthStore((state) => state.username) ?? undefined;
  const savedTag = useAuthStore((state) => state.tag);
  const changeAllowedAt = useAuthStore((state) => state.usernameChangeAllowedAt);
  const wasRejected = useAuthStore((state) => state.usernameRejectedAt) !== undefined;
  const [username, setUsername] = useState(savedUsername ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | undefined>(undefined);

  // Lu une fois par rendu : inutile de faire tourner une horloge pour une
  // échéance qui se compte en mois.
  const isLocked = changeAllowedAt !== undefined && changeAllowedAt > Date.now();
  const isUnchanged = username === savedUsername;
  const { check, redraw } = useHandleSuggestion(username, !isLocked && !isUnchanged);

  const formatError = formatProblem(username);
  // Le tag affiché : celui déjà enregistré tant que le pseudo n'a pas changé,
  // sinon celui que le serveur propose pour le nouveau pseudo.
  const tag = isUnchanged ? savedTag : check.status === 'available' ? check.suggestion.tag : undefined;
  const canSave = !isSaving && !isLocked && !isUnchanged && check.status === 'available';

  const handleSave = (): void => {
    if (check.status !== 'available') {
      return;
    }
    setSaveError(undefined);
    setIsSaving(true);
    saveHandle(check.suggestion.username, check.suggestion.tag)
      .then(() => {
        onClose?.();
      })
      .catch((error: unknown) => {
        if (error instanceof ApiError && error.code === ErrorCode.USERNAME_ALREADY_TAKEN) {
          // Quelqu'un a pris cette paire entre la proposition et la
          // validation : un nouveau tirage règle le cas.
          redraw();
          setSaveError('Ce tag vient d’être pris, en voici un autre.');
        } else if (error instanceof ApiError && error.code === ErrorCode.USERNAME_CHANGE_TOO_SOON) {
          setSaveError('Tu as déjà changé de pseudo il y a moins de 3 mois.');
        } else {
          setSaveError('Impossible d’enregistrer, réessaie.');
        }
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.md }]}
    >
      <View style={styles.header}>
        <Text variant="title" style={styles.title}>
          {savedUsername === undefined ? 'Crée ta fiche' : 'Ma fiche'}
        </Text>
        {onClose !== undefined ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fermer"
            hitSlop={8}
            onPress={onClose}
            style={({ pressed }) => [styles.closeButton, pressed ? styles.pressed : null]}
          >
            <MaterialCommunityIcons name="close" size={24} color={colors.textSecondary} />
          </Pressable>
        ) : null}
      </View>

      {wasRejected && savedUsername === undefined ? (
        <View style={styles.rejectedNotice}>
          <MaterialCommunityIcons name="shield-alert-outline" size={20} color={colors.textPrimary} />
          <Text variant="body" style={styles.rejectedText}>
            Ton ancien pseudo a été retiré par la modération. Choisis-en un nouveau pour continuer.
          </Text>
        </View>
      ) : null}

      <View style={styles.card}>
        <Avatar username={username} size={AVATAR_SIZE} />
        <View style={styles.handleRow}>
          <Text variant="title" numberOfLines={1} style={styles.handleName}>
            {username.length > 0 ? username : 'Pseudo'}
          </Text>
          <Text variant="title" color={colors.textSecondary} style={styles.handleTag}>
            {`#${tag ?? '····'}`}
          </Text>
        </View>
        <View style={styles.photoRow}>
          <Text variant="caption" color={colors.textSecondary}>
            Photo de profil
          </Text>
          <MockTag />
        </View>
      </View>

      <View style={styles.field}>
        <Text variant="label" color={colors.textSecondary} style={styles.fieldLabel}>
          Pseudo
        </Text>
        <TextInput
          value={username}
          onChangeText={(text) => {
            setUsername(text);
            setSaveError(undefined);
          }}
          editable={!isLocked}
          placeholder="Mathieu"
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={USERNAME_MAX_LENGTH}
          returnKeyType="done"
          style={[styles.input, isLocked ? styles.inputLocked : null]}
        />
        <Text variant="caption" color={statusColor(isLocked, formatError, check.status)} style={styles.fieldHint}>
          {statusMessage(isLocked, changeAllowedAt, formatError, isUnchanged, check.status)}
        </Text>
        {check.status === 'available' && !isUnchanged ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Tirer un autre tag"
            onPress={redraw}
            style={({ pressed }) => [styles.redrawButton, pressed ? styles.pressed : null]}
          >
            <MaterialCommunityIcons name="dice-multiple-outline" size={16} color={colors.textPrimary} />
            <Text variant="captionStrong">Autre tag</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.footer}>
        {saveError !== undefined ? (
          <Text variant="caption" color={colors.danger} style={styles.saveError}>
            {saveError}
          </Text>
        ) : null}
        {savedUsername !== undefined && !isLocked ? (
          <Text variant="caption" color={colors.textSecondary} style={styles.saveError}>
            Un changement de pseudo est possible une fois tous les 3 mois.
          </Text>
        ) : null}
        <Button label={isSaving ? 'Enregistrement…' : 'Enregistrer'} onPress={handleSave} disabled={!canSave} />
      </View>
    </KeyboardAvoidingView>
  );
}

// Problème de format décelable sans le serveur — undefined si le pseudo est
// vide (rien à reprocher encore) ou conforme.
function formatProblem(username: string): string | undefined {
  if (username.length === 0 || usernameSchema.safeParse(username).success) {
    return undefined;
  }
  if (username.length < USERNAME_MIN_LENGTH) {
    return `Au moins ${String(USERNAME_MIN_LENGTH)} caractères.`;
  }
  return 'Lettres sans accent, chiffres et underscore uniquement.';
}

type CheckStatus = ReturnType<typeof useHandleSuggestion>['check']['status'];

function statusMessage(
  isLocked: boolean,
  changeAllowedAt: number | undefined,
  formatError: string | undefined,
  isUnchanged: boolean,
  status: CheckStatus,
): string {
  if (isLocked && changeAllowedAt !== undefined) {
    return `Modifiable à partir du ${UNLOCK_DATE_FORMATTER.format(new Date(changeAllowedAt))}.`;
  }
  if (formatError !== undefined) {
    return formatError;
  }
  if (isUnchanged) {
    return 'C’est ton pseudo actuel.';
  }
  switch (status) {
    case 'checking':
      return 'Vérification…';
    case 'available':
      return 'Disponible. Le tag est tiré au hasard pour toi.';
    case 'not-allowed':
      return 'Ce pseudo n’est pas autorisé, choisis-en un autre.';
    case 'saturated':
      return 'Ce pseudo est trop demandé, choisis-en un autre.';
    case 'unreachable':
      return 'Vérification impossible, vérifie ta connexion.';
    case 'idle':
      return `${String(USERNAME_MIN_LENGTH)} à ${String(USERNAME_MAX_LENGTH)} caractères : lettres, chiffres, underscore.`;
  }
}

function statusColor(isLocked: boolean, formatError: string | undefined, status: CheckStatus): string {
  if (isLocked) {
    return colors.textSecondary;
  }
  if (formatError !== undefined || status === 'not-allowed' || status === 'saturated' || status === 'unreachable') {
    return colors.danger;
  }
  return colors.textSecondary;
}
