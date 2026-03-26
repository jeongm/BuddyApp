const { withAndroidManifest } = require('@expo/config-plugins');
module.exports = function withFixManifest(config) {
    return withAndroidManifest(config, async (config) => {
        const manifest = config.modResults.manifest;
        const app = manifest.application[0];

        manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';

        if (app.$['tools:replace']) {
            if (!app.$['tools:replace'].includes('android:appComponentFactory')) {
                app.$['tools:replace'] += ',android:appComponentFactory';
            }
        } else {
            app.$['tools:replace'] = 'android:appComponentFactory';
        }

        app.$['android:appComponentFactory'] = 'androidx.core.app.CoreComponentFactory';

        // ✅ [추가] 카카오/네이버 앱 쿼리 추가
        if (!manifest.queries) {
            manifest.queries = [];
        }
        manifest.queries.push({
            package: [
                { $: { 'android:name': 'com.kakao.talk' } },
                { $: { 'android:name': 'com.nhn.android.search' } }
            ]
        });

        return config;
    });
};