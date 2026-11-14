// Signs release builds with the Play upload key. android/ is generated, so this patches
// app/build.gradle on every prebuild. Key location and passwords come from Gradle properties
// kept OUTSIDE the repo (~/.gradle/gradle.properties):
//   PEBBLESIP_UPLOAD_STORE_FILE, PEBBLESIP_UPLOAD_KEY_ALIAS,
//   PEBBLESIP_UPLOAD_STORE_PASSWORD, PEBBLESIP_UPLOAD_KEY_PASSWORD
// Without them, release builds fall back to the debug key (fine for local testing; Play rejects it).
const { withAppBuildGradle } = require('expo/config-plugins');

const MARK = '// pebblesip-release-signing';

const SIGNING_CONFIG = `
        ${MARK}
        release {
            if (project.hasProperty('PEBBLESIP_UPLOAD_STORE_FILE')) {
                storeFile file(PEBBLESIP_UPLOAD_STORE_FILE)
                storePassword PEBBLESIP_UPLOAD_STORE_PASSWORD
                keyAlias PEBBLESIP_UPLOAD_KEY_ALIAS
                keyPassword PEBBLESIP_UPLOAD_KEY_PASSWORD
            }
        }`;

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (c) => {
    let g = c.modResults.contents;
    if (g.includes(MARK)) return c;

    // 1) Add a `release` signing config next to Expo's `debug` one.
    g = g.replace(/signingConfigs\s*\{/, (m) => `${m}${SIGNING_CONFIG}`);

    // 2) In buildTypes.release, use it when the upload key is configured.
    const rel = g.indexOf('release {', g.indexOf('buildTypes {'));
    if (rel === -1) throw new Error('with-release-signing: buildTypes.release not found');
    const end = g.indexOf('\n        }', rel);
    const block = g
      .slice(rel, end)
      .replace(
        /signingConfig signingConfigs\.debug/,
        "signingConfig project.hasProperty('PEBBLESIP_UPLOAD_STORE_FILE') ? signingConfigs.release : signingConfigs.debug",
      );
    c.modResults.contents = g.slice(0, rel) + block + g.slice(end);
    return c;
  });
};
