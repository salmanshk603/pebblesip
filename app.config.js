// Production AdMob app ID comes from the environment so the real ID never ships in dev builds.
// Without ADMOB_ANDROID_APP_ID the Google sample app ID in app.json is used (test ads only).
module.exports = ({ config }) => {
  const realId = process.env.ADMOB_ANDROID_APP_ID;
  if (!realId) return config;
  return {
    ...config,
    plugins: config.plugins.map((p) =>
      Array.isArray(p) && p[0] === 'react-native-google-mobile-ads'
        ? [p[0], { ...p[1], androidAppId: realId }]
        : p,
    ),
  };
};
