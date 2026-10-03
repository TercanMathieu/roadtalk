import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  friendHandleSchema,
  type FriendsOverviewDto,
  type PublicUserDto,
} from '@roadtalk/contracts';
import { router, useFocusEffect } from 'expo-router';
import type React from 'react';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Share,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, Snackbar, spacing, Text, useSnackbar } from '../../ui';
import { useAuthStore } from '../auth/auth.store';
import {
  acceptFriendRequest,
  blockUser,
  removeFriend,
  removeFriendRequest,
  sendFriendRequest,
  unblockUser,
} from './api';
import { formatHandle, useFriendsStore } from './friends.store';
import { styles } from './FriendsScreen.styles';

const SINCE_FORMATTER = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

function sameHandle(user: PublicUserDto, handle: string): boolean {
  return formatHandle(user).toLowerCase() === handle.toLowerCase();
}

// Ajout d'amis par identifiant exact « Pseudo#TAG », demandes reçues et
// envoyées, blocage (ADR-005). L'envoi de balades viendra ensuite.
export function FriendsScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const snackbar = useSnackbar();
  const overview = useFriendsStore((state) => state.overview);
  const refresh = useFriendsStore((state) => state.refresh);
  const run = useFriendsStore((state) => state.run);
  const username = useAuthStore((state) => state.username);
  const tag = useAuthStore((state) => state.tag);
  const [handleInput, setHandleInput] = useState('');
  // Action en cours : `send` pour l'ajout, sinon l'identifiant de la ligne.
  const [busyKey, setBusyKey] = useState<string | undefined>(undefined);
  const [loadFailed, setLoadFailed] = useState(false);
  // Sous le champ plutôt qu'en bas d'écran : le clavier, ouvert pendant la
  // saisie, masquerait le message.
  const [addFeedback, setAddFeedback] = useState<
    { readonly isError: boolean; readonly text: string } | undefined
  >(undefined);

  useFocusEffect(
    useCallback(() => {
      refresh()
        .then(() => {
          setLoadFailed(false);
        })
        .catch(() => {
          setLoadFailed(true);
        });
    }, [refresh]),
  );

  const myHandle =
    typeof username === 'string' && typeof tag === 'string' ? `${username}#${tag}` : undefined;
  const parsedHandle = friendHandleSchema.safeParse(handleInput);

  const perform = (
    key: string,
    action: (accessToken: string) => Promise<FriendsOverviewDto>,
    successMessage?: (next: FriendsOverviewDto) => string,
  ): void => {
    if (busyKey !== undefined) {
      return;
    }
    setBusyKey(key);
    run(action)
      .then((next) => {
        if (successMessage !== undefined) {
          snackbar.show(successMessage(next));
        }
      })
      .catch((error: unknown) => {
        if (error instanceof Error) {
          snackbar.show(error.message);
        }
      })
      .finally(() => {
        setBusyKey(undefined);
      });
  };

  const handleSend = (): void => {
    if (!parsedHandle.success || busyKey !== undefined) {
      return;
    }
    const handle = parsedHandle.data;
    setBusyKey('send');
    setAddFeedback(undefined);
    run((accessToken) => sendFriendRequest(accessToken, handle))
      .then((next) => {
        setHandleInput('');
        // Une demande croisée devient tout de suite une amitié (voir l'API).
        const text = next.friends.some((friend) => sameHandle(friend.user, handle))
          ? `Vous êtes maintenant amis avec ${handle}.`
          : `Demande envoyée à ${handle}.`;
        setAddFeedback({ isError: false, text });
      })
      .catch((error: unknown) => {
        setAddFeedback({
          isError: true,
          text: error instanceof Error ? error.message : 'Demande impossible. Réessaie.',
        });
      })
      .finally(() => {
        setBusyKey(undefined);
      });
  };

  const confirmBlock = (user: PublicUserDto): void => {
    Alert.alert(
      `Bloquer ${formatHandle(user)} ?`,
      'Ce motard ne pourra plus t’envoyer de demande. Il n’en sera pas averti.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Bloquer',
          style: 'destructive',
          onPress: () => {
            perform(
              user.id,
              (accessToken) => blockUser(accessToken, user.id),
              () => 'Motard bloqué.',
            );
          },
        },
      ],
    );
  };

  const openRequestMenu = (requestId: string, user: PublicUserDto): void => {
    Alert.alert(formatHandle(user), undefined, [
      {
        text: 'Refuser',
        onPress: () => {
          perform(
            requestId,
            (accessToken) => removeFriendRequest(accessToken, requestId),
            () => 'Demande refusée.',
          );
        },
      },
      {
        text: 'Bloquer',
        style: 'destructive',
        onPress: () => {
          confirmBlock(user);
        },
      },
      { text: 'Annuler', style: 'cancel' },
    ]);
  };

  const openFriendMenu = (user: PublicUserDto): void => {
    Alert.alert(formatHandle(user), undefined, [
      {
        text: 'Retirer de mes amis',
        style: 'destructive',
        onPress: () => {
          perform(
            user.id,
            (accessToken) => removeFriend(accessToken, user.id),
            () => 'Ami retiré.',
          );
        },
      },
      {
        text: 'Bloquer',
        style: 'destructive',
        onPress: () => {
          confirmBlock(user);
        },
      },
      { text: 'Annuler', style: 'cancel' },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retour"
          hitSlop={8}
          onPress={() => {
            router.back();
          }}
          style={styles.backButton}
        >
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.textPrimary} />
        </Pressable>
        <Text variant="title" style={styles.headerTitle}>
          Amis
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.lg }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text variant="label" color={colors.textSecondary}>
            Ton identifiant
          </Text>
          {myHandle !== undefined ? (
            <View style={styles.myHandleRow}>
              <HandleText user={{ id: '', username: username ?? null, tag: tag ?? null }} large />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Partager mon identifiant"
                hitSlop={8}
                onPress={() => {
                  Share.share({ message: `Ajoute-moi sur RoadTalk : ${myHandle}` }).catch(
                    () => undefined,
                  );
                }}
                style={({ pressed }) => [styles.iconButton, pressed ? styles.pressed : null]}
              >
                <MaterialCommunityIcons
                  name="share-variant-outline"
                  size={20}
                  color={colors.textPrimary}
                />
              </Pressable>
            </View>
          ) : (
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                router.push('/profile');
              }}
            >
              <Text variant="body" color={colors.textSecondary}>
                Choisis d’abord ton pseudo dans ta fiche pour ajouter des amis.
              </Text>
            </Pressable>
          )}
        </View>

        <View style={styles.addBlock}>
          <View style={styles.addRow}>
            <TextInput
              value={handleInput}
              onChangeText={(text) => {
                setHandleInput(text);
                setAddFeedback(undefined);
              }}
              placeholder="Pseudo#TAG d’un ami"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="send"
              onSubmitEditing={handleSend}
              editable={myHandle !== undefined}
              style={styles.addInput}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Envoyer la demande"
              accessibilityState={{ disabled: !parsedHandle.success || busyKey !== undefined }}
              disabled={!parsedHandle.success || busyKey !== undefined}
              onPress={handleSend}
              style={({ pressed }) => [
                styles.addButton,
                !parsedHandle.success ? styles.disabled : null,
                pressed ? styles.pressed : null,
              ]}
            >
              {busyKey === 'send' ? (
                <ActivityIndicator color={colors.onAccentLight} />
              ) : (
                <Text variant="captionStrong" color={colors.onAccentLight}>
                  Ajouter
                </Text>
              )}
            </Pressable>
          </View>
          {addFeedback !== undefined ? (
            <Text
              variant="caption"
              color={addFeedback.isError ? colors.danger : colors.textSecondary}
              style={styles.addFeedback}
            >
              {addFeedback.text}
            </Text>
          ) : null}
        </View>

        {overview === undefined ? (
          <Text variant="body" color={colors.textSecondary} style={styles.message}>
            {loadFailed ? 'Amis indisponibles. Vérifie ton réseau.' : 'Chargement…'}
          </Text>
        ) : (
          <>
            {overview.incoming.length > 0 ? (
              <Section title={`Demandes reçues · ${String(overview.incoming.length)}`}>
                {overview.incoming.map((request, index) => (
                  <Row key={request.id} hasDivider={index > 0}>
                    <HandleText user={request.user} />
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Accepter ${formatHandle(request.user)}`}
                      disabled={busyKey !== undefined}
                      onPress={() => {
                        perform(
                          request.id,
                          (accessToken) => acceptFriendRequest(accessToken, request.id),
                          () => `Vous êtes maintenant amis avec ${formatHandle(request.user)}.`,
                        );
                      }}
                      style={({ pressed }) => [
                        styles.acceptButton,
                        pressed ? styles.pressed : null,
                      ]}
                    >
                      {busyKey === request.id ? (
                        <ActivityIndicator color={colors.onAccentLight} />
                      ) : (
                        <Text variant="captionStrong" color={colors.onAccentLight}>
                          Accepter
                        </Text>
                      )}
                    </Pressable>
                    <MenuButton
                      label={`Autres actions pour ${formatHandle(request.user)}`}
                      onPress={() => {
                        openRequestMenu(request.id, request.user);
                      }}
                    />
                  </Row>
                ))}
              </Section>
            ) : null}

            <Section title={`Amis · ${String(overview.friends.length)}`}>
              {overview.friends.length === 0 ? (
                <Text variant="body" color={colors.textSecondary} style={styles.rowMessage}>
                  Aucun ami pour l’instant. Partage ton identifiant, ou ajoute celui d’un ami.
                </Text>
              ) : (
                overview.friends.map((friend, index) => (
                  <Row key={friend.user.id} hasDivider={index > 0}>
                    <View style={styles.rowTexts}>
                      <HandleText user={friend.user} />
                      <Text variant="caption" color={colors.textSecondary}>
                        {`Amis depuis le ${SINCE_FORMATTER.format(friend.since)}`}
                      </Text>
                    </View>
                    <MenuButton
                      label={`Actions pour ${formatHandle(friend.user)}`}
                      onPress={() => {
                        openFriendMenu(friend.user);
                      }}
                    />
                  </Row>
                ))
              )}
            </Section>

            {overview.outgoing.length > 0 ? (
              <Section title="Demandes envoyées">
                {overview.outgoing.map((request, index) => (
                  <Row key={request.id} hasDivider={index > 0}>
                    <View style={styles.rowTexts}>
                      <HandleText user={request.user} />
                      <Text variant="caption" color={colors.textSecondary}>
                        En attente
                      </Text>
                    </View>
                    <TextButton
                      label="Annuler"
                      onPress={() => {
                        perform(
                          request.id,
                          (accessToken) => removeFriendRequest(accessToken, request.id),
                          () => 'Demande annulée.',
                        );
                      }}
                    />
                  </Row>
                ))}
              </Section>
            ) : null}

            {overview.blocked.length > 0 ? (
              <Section title="Bloqués">
                {overview.blocked.map((user, index) => (
                  <Row key={user.id} hasDivider={index > 0}>
                    <HandleText user={user} />
                    <TextButton
                      label="Débloquer"
                      onPress={() => {
                        perform(
                          user.id,
                          (accessToken) => unblockUser(accessToken, user.id),
                          () => 'Motard débloqué.',
                        );
                      }}
                    />
                  </Row>
                ))}
              </Section>
            ) : null}
          </>
        )}
      </ScrollView>

      <View style={[styles.snackbarWrapper, { bottom: insets.bottom + spacing.md }]}>
        <Snackbar message={snackbar.message} />
      </View>
    </View>
  );
}

function HandleText({
  user,
  large,
}: {
  readonly user: PublicUserDto;
  readonly large?: boolean;
}): React.JSX.Element {
  if (user.username === null || user.tag === null) {
    return (
      <Text variant="body" color={colors.textSecondary} style={styles.handle}>
        {formatHandle(user)}
      </Text>
    );
  }
  return (
    <Text variant={large === true ? 'title' : 'body'} numberOfLines={1} style={styles.handle}>
      {user.username}
      <Text variant={large === true ? 'title' : 'body'} color={colors.textSecondary}>
        {`#${user.tag}`}
      </Text>
    </Text>
  );
}

function Section({
  title,
  children,
}: {
  readonly title: string;
  readonly children: React.ReactNode;
}): React.JSX.Element {
  return (
    <View style={styles.section}>
      <Text variant="label" color={colors.textSecondary} style={styles.sectionTitle}>
        {title}
      </Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

function Row({
  hasDivider,
  children,
}: {
  readonly hasDivider: boolean;
  readonly children: React.ReactNode;
}): React.JSX.Element {
  return <View style={[styles.row, hasDivider ? styles.rowDivider : null]}>{children}</View>;
}

function MenuButton({
  label,
  onPress,
}: {
  readonly label: string;
  readonly onPress: () => void;
}): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [styles.iconButton, pressed ? styles.pressed : null]}
    >
      <MaterialCommunityIcons name="dots-horizontal" size={20} color={colors.textSecondary} />
    </Pressable>
  );
}

function TextButton({
  label,
  onPress,
}: {
  readonly label: string;
  readonly onPress: () => void;
}): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [styles.textButton, pressed ? styles.pressed : null]}
    >
      <Text variant="captionStrong" color={colors.textSecondary}>
        {label}
      </Text>
    </Pressable>
  );
}
