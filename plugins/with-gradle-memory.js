// Release builds (R8 + Firebase + AdMob) run out of Metaspace with Expo's default
// `-Xmx2048m -XX:MaxMetaspaceSize=512m`. android/ is generated, so set it here.
const { withGradleProperties } = require('expo/config-plugins');

const JVM_ARGS = '-Xmx4096m -XX:MaxMetaspaceSize=1024m -Dfile.encoding=UTF-8';

module.exports = function withGradleMemory(config) {
  return withGradleProperties(config, (c) => {
    c.modResults = c.modResults.filter(
      (p) => !(p.type === 'property' && p.key === 'org.gradle.jvmargs'),
    );
    c.modResults.push({ type: 'property', key: 'org.gradle.jvmargs', value: JVM_ARGS });
    return c;
  });
};
