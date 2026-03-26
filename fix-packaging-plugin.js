const { withAppBuildGradle } = require('@expo/config-plugins');

module.exports = function withFixPackaging(config) {
    return withAppBuildGradle(config, (config) => {
        const buildGradle = config.modResults.contents;

        // 이미 추가되어 있지 않다면 강제로 android { ... } 블록 안에 쑤셔 넣습니다!
        if (!buildGradle.includes("pickFirst 'META-INF/androidx.appcompat_appcompat.version'")) {
            config.modResults.contents = buildGradle.replace(
                /android\s*\{/,
                `android {
    packagingOptions {
        pickFirst 'META-INF/androidx.appcompat_appcompat.version'
        pickFirst 'META-INF/androidx.core_core.version'
        pickFirst 'META-INF/*'
    }
`
            );
        }
        return config;
    });
};