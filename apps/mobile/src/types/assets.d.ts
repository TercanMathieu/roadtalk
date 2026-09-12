// Metro résout un import d'image en identifiant d'asset numérique
// (`ImageRequireSource` côté React Native). Ni Expo ni React Native ne
// fournissent cette déclaration, il faut donc la donner nous-mêmes.
declare module '*.png' {
  const asset: number;
  export default asset;
}
