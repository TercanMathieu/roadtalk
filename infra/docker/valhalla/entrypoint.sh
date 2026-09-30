#!/usr/bin/env bash
set -e

# L'image ghcr.io/gis-ops/docker-valhalla n'expose aucune variable
# d'environnement pour service_limits.* (vérifié dans ses scripts :
# configure_valhalla.sh ne patche que des chemins mjolnir, jamais les
# limites de service). Son run.sh génère valhalla.json puis démarre le
# serveur par un `exec` direct, sans point d'accroche entre les deux.
#
# On patche donc valhalla.json en tâche de fond, dès qu'il existe. La
# fenêtre n'est pas une vraie course : le fichier apparaît tout au début
# de configure_valhalla.sh, le serveur ne démarre qu'à la toute fin — après
# la construction complète des tuiles, qui peut durer plusieurs heures sur
# un premier build. Sur un redémarrage (tuiles déjà là), la fenêtre se
# réduit à quelques secondes, toujours largement suffisante.
if [ -n "${MOTORCYCLE_MAX_DISTANCE_METERS:-}" ]; then
  (
    config_file="/custom_files/valhalla.json"
    # 600 x 1s : couvre une reconstruction complète sans boucler indéfiniment
    # si le fichier n'apparaît jamais (config invalide, image changée...).
    for _ in $(seq 1 600); do
      if [ -f "$config_file" ]; then
        # sudo : ce process tourne sous l'utilisateur non-root de l'image
        # (UID 59999), qui n'a pas le droit d'écrire sur les fichiers générés
        # en root — même schéma que run_cmd() dans les scripts de l'image.
        sudo jq --argjson d "$MOTORCYCLE_MAX_DISTANCE_METERS" \
          '.service_limits.motorcycle.max_distance = $d' "$config_file" \
          | sudo sponge "$config_file"
        break
      fi
      sleep 1
    done
  ) &
fi

exec /valhalla/scripts/run.sh "$@"
