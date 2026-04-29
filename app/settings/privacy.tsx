import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Dimensions,
    Platform,
    ScrollView,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppText as Text } from '../../components/AppText';
import { useSettingStore } from "../../store/useSettingStore";
import { ACCENT_HEX_COLORS, useThemeStore } from "../../store/useThemeStore";

const { width } = Dimensions.get('window');
const scale = (size: number) => Math.round((width / 430) * size);

const safeShadow = Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
    android: { elevation: 2 },
});

// ─────────────────────────────────────────────────────────────────────────────
// 개인정보처리방침 데이터 (이메일 통일)
// ─────────────────────────────────────────────────────────────────────────────
const PRIVACY_SECTIONS = [
    {
        id: '01',
        icon: 'document-text-outline' as const,
        iconColor: '#3B82F6',
        title: '수집하는 개인정보 항목',
        content: [
            {
                subtitle: '필수 수집 항목',
                body: '서비스 제공을 위해 아래 정보를 수집합니다.\n\n• 소셜 로그인 정보 (이메일 주소, 소셜 서비스 고유 식별자)\n• 닉네임\n• 서비스 이용 기록 (대화 내용, 일기 데이터)\n• 기기 정보 (푸시 알림 토큰)',
            },
            {
                subtitle: '선택 수집 항목',
                body: '• 야간 알림 수신 동의 여부\n• 데일리 알림 수신 동의 여부',
            },
        ],
    },
    {
        id: '02',
        icon: 'shield-checkmark-outline' as const,
        iconColor: '#8B5CF6',
        title: '개인정보의 수집 및 이용 목적',
        content: [
            {
                subtitle: '주요 이용 목적',
                body: '수집된 개인정보는 아래 목적으로만 사용됩니다.\n\n• 회원 식별 및 서비스 제공\n• AI 친구와의 대화 서비스 운영\n• 대화 내용 기반 일기 자동 생성\n• 푸시 알림 발송 (야간 인사, 데일리 안부)\n• 서비스 개선 및 오류 대응',
            },
        ],
    },
    {
        id: '03',
        icon: 'time-outline' as const,
        iconColor: '#F59E0B',
        title: '개인정보의 보유 및 이용 기간',
        content: [
            {
                subtitle: '보유 기간',
                body: '회원 탈퇴 시 즉시 파기합니다. 단, 관련 법령에 의해 보존이 필요한 경우 해당 기간 동안 보관합니다.\n\n• 소비자 불만 또는 분쟁 처리에 관한 기록: 3년 (전자상거래법)\n• 접속에 관한 기록: 3개월 (통신비밀보호법)',
            },
        ],
    },
    {
        id: '04',
        icon: 'people-outline' as const,
        iconColor: '#10B981',
        title: '개인정보의 제3자 제공',
        content: [
            {
                subtitle: '원칙',
                body: 'Buddy는 수집된 개인정보를 원칙적으로 외부에 제공하지 않습니다.\n\n다만 아래 경우는 예외입니다.\n\n• 이용자가 사전에 동의한 경우\n• 법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우',
            },
        ],
    },
    {
        id: '05',
        icon: 'cube-outline' as const,
        iconColor: '#EC4899',
        title: '개인정보 처리 위탁',
        content: [
            {
                subtitle: '위탁 현황',
                body: '원활한 서비스 제공을 위해 아래 업체에 개인정보 처리를 위탁하고 있습니다.\n\n• Amazon Web Services (AWS): 서버 인프라 및 데이터 저장\n• Firebase (Google): 푸시 알림 발송\n• OpenAI: AI 대화 처리 (비식별 처리 후 전송)\n\n위탁 업체들은 위탁받은 업무 수행 목적 외 개인정보를 이용하지 않습니다.',
            },
        ],
    },
    {
        id: '06',
        icon: 'person-outline' as const,
        iconColor: '#64748B',
        title: '이용자의 권리와 행사 방법',
        content: [
            {
                subtitle: '이용자 권리',
                body: '이용자는 언제든지 아래 권리를 행사할 수 있습니다.\n\n• 개인정보 열람 요청\n• 오류 정정 요청\n• 삭제 요청 (앱 내 회원 탈퇴 기능 이용)\n• 처리 정지 요청\n\n권리 행사는 앱 설정 > 계정 또는 아래 이메일로 요청하실 수 있습니다.',
            },
        ],
    },
    {
        id: '07',
        icon: 'lock-closed-outline' as const,
        iconColor: '#F43F5E',
        title: '개인정보의 안전성 확보 조치',
        content: [
            {
                subtitle: '기술적 조치',
                body: '• 개인정보 암호화 저장 및 전송 (HTTPS/TLS)\n• 접근 권한 최소화 및 관리\n• 해킹·바이러스 방지를 위한 보안 프로그램 운영',
            },
            {
                subtitle: '관리적 조치',
                body: '• 개인정보 취급 직원 최소화\n• 정기적 보안 교육 실시\n• 내부 관리계획 수립 및 시행',
            },
        ],
    },
    {
        id: '08',
        icon: 'mail-outline' as const,
        iconColor: '#0EA5E9',
        title: '개인정보 보호책임자',
        content: [
            {
                subtitle: '담당자 정보',
                body: '개인정보 처리에 관한 문의, 불만 처리, 피해 구제 등의 업무를 담당합니다.\n\n• 이메일: buddyzzang11@gmail.com\n• 응답 시간: 영업일 기준 3일 이내\n\n기타 개인정보 침해에 대한 신고나 상담이 필요하신 경우 개인정보침해신고센터(privacy.kisa.or.kr)에 문의하실 수 있습니다.',
            },
        ],
    },
];

// ─────────────────────────────────────────────────────────────────────────────
// 섹션 카드 컴포넌트
// ─────────────────────────────────────────────────────────────────────────────
interface SectionCardProps {
    section: typeof PRIVACY_SECTIONS[0];
    isExpanded: boolean;
    onToggle: () => void;
}

function SectionCard({ section, isExpanded, onToggle }: SectionCardProps) {
    return (
        <View
            className="bg-slate-50 dark:bg-slate-900 rounded-[24px] overflow-hidden border border-slate-100 dark:border-slate-800/60"
            style={safeShadow}
        >
            <TouchableOpacity
                onPress={onToggle}
                activeOpacity={0.6}
                className="flex-row items-center justify-between px-5 py-4"
            >
                <View className="flex-row items-center" style={{ gap: scale(12), flex: 1 }}>
                    <View style={{ position: 'relative' }}>
                        <View
                            className="w-9 h-9 rounded-full bg-white dark:bg-slate-800 items-center justify-center"
                            style={safeShadow}
                        >
                            <Ionicons name={section.icon} size={scale(17)} color={section.iconColor} />
                        </View>
                        <View
                            className="absolute -top-1 -right-1 w-4 h-4 rounded-full items-center justify-center"
                            style={{ backgroundColor: section.iconColor }}
                        >
                            <Text className="text-white font-black" style={{ fontSize: scale(8) }} allowFontScaling={false}>
                                {section.id}
                            </Text>
                        </View>
                    </View>

                    <Text
                        className="font-bold text-slate-800 dark:text-slate-200 flex-1"
                        style={{ fontSize: scale(14) }}
                        allowFontScaling={false}
                    >
                        {section.title}
                    </Text>
                </View>

                <Ionicons
                    name={isExpanded ? "chevron-up" : "chevron-down"}
                    size={scale(17)}
                    color="#CBD5E1"
                />
            </TouchableOpacity>

            {isExpanded && (
                <View className="px-5 pb-5 border-t border-slate-200/60 dark:border-slate-700/60">
                    {section.content.map((item, idx) => (
                        <View key={idx} style={{ marginTop: scale(14) }}>
                            <Text
                                className="font-extrabold text-slate-700 dark:text-slate-300 mb-2"
                                style={{ fontSize: scale(13) }}
                                allowFontScaling={false}
                            >
                                {item.subtitle}
                            </Text>
                            <Text
                                className="font-medium text-slate-500 dark:text-slate-400"
                                style={{ fontSize: scale(13), lineHeight: scale(21) }}
                                allowFontScaling={false}
                            >
                                {item.body}
                            </Text>
                        </View>
                    ))}
                </View>
            )}
        </View>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// 메인 스크린
// ─────────────────────────────────────────────────────────────────────────────
export default function PrivacyScreen() {
    const router = useRouter();
    const { accent } = useThemeStore();
    const accentHex = ACCENT_HEX_COLORS[accent];

    // 폰트 설정 가져오기 (표준 헤더 규격 맞춤)
    const { fontFamily } = useSettingStore();
    const customFontFamily = fontFamily === 'System' ? undefined : fontFamily;

    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    const toggleSection = (id: string) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const expandAll = () => {
        setExpandedIds(new Set(PRIVACY_SECTIONS.map(s => s.id)));
    };

    const collapseAll = () => {
        setExpandedIds(new Set());
    };

    const allExpanded = expandedIds.size === PRIVACY_SECTIONS.length;

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-slate-950" edges={['top']}>

            {/* ✨ 완벽하게 이식된 표준 헤더 영역 ✨ */}
            <View className="flex-row items-center justify-between px-4 py-3 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl z-20 border-b border-slate-100 dark:border-slate-800/60">
                <TouchableOpacity onPress={() => router.back()} className="p-2" hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="chevron-back" size={scale(28)} color="#64748B" />
                </TouchableOpacity>

                <View className="absolute left-0 right-0 h-full items-center justify-center pointer-events-none" style={{ zIndex: -1 }}>
                    <Text className="font-black text-slate-900 dark:text-white tracking-tight" style={{ fontSize: scale(18), fontFamily: customFontFamily }} allowFontScaling={false}>
                        개인정보 처리방침
                    </Text>
                </View>

                {/* 우측: 펼치기/접기 토글 (크기를 적절히 조절하여 헤더 밸런스 유지) */}
                <TouchableOpacity
                    onPress={allExpanded ? collapseAll : expandAll}
                    activeOpacity={0.7}
                    className="px-3 py-1.5 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                >
                    <Text
                        className="font-bold text-slate-500 dark:text-slate-400"
                        style={{ fontSize: scale(12) }}
                        allowFontScaling={false}
                    >
                        {allExpanded ? '접기' : '펼치기'}
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingBottom: scale(80) }}
                showsVerticalScrollIndicator={false}
            >
                {/* 상단 안내 배너 */}
                <View
                    className="mx-5 mt-5 rounded-[20px] px-5 py-4"
                    style={{ backgroundColor: `${accentHex}15`, borderWidth: 1, borderColor: `${accentHex}30` }}
                >
                    <View className="flex-row items-center mb-2" style={{ gap: scale(8) }}>
                        <Ionicons name="shield-half-outline" size={scale(18)} color={accentHex} />
                        <Text
                            className="font-extrabold"
                            style={{ fontSize: scale(14), color: accentHex }}
                            allowFontScaling={false}
                        >
                            Buddy의 개인정보 보호 약속
                        </Text>
                    </View>
                    <Text
                        className="font-medium text-slate-500 dark:text-slate-400"
                        style={{ fontSize: scale(13), lineHeight: scale(20) }}
                        allowFontScaling={false}
                    >
                        버디는 여러분의 소중한 개인정보를 안전하게 보호합니다. 수집된 정보는 서비스 제공 목적 외에 사용되지 않습니다.
                    </Text>
                    <View className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex-row items-center" style={{ gap: scale(6) }}>
                        <Ionicons name="calendar-outline" size={scale(13)} color="#94A3B8" />
                        <Text
                            className="font-medium text-slate-400 dark:text-slate-500"
                            style={{ fontSize: scale(12) }}
                            allowFontScaling={false}
                        >
                            시행일: 2025년 1월 1일 · 최종 수정: 2025년 6월 1일
                        </Text>
                    </View>
                </View>

                {/* 섹션 목록 */}
                <View style={{ paddingHorizontal: scale(20), marginTop: scale(20), gap: scale(12) }}>
                    {PRIVACY_SECTIONS.map((section) => (
                        <SectionCard
                            key={section.id}
                            section={section}
                            isExpanded={expandedIds.has(section.id)}
                            onToggle={() => toggleSection(section.id)}
                        />
                    ))}
                </View>

                {/* 하단 문의 안내 */}
                <View
                    className="mx-5 mt-6 bg-slate-50 dark:bg-slate-900 rounded-[20px] px-5 py-4 border border-slate-100 dark:border-slate-800/60"
                    style={safeShadow}
                >
                    <View className="flex-row items-center mb-1" style={{ gap: scale(6) }}>
                        <Ionicons name="chatbubble-ellipses-outline" size={scale(15)} color="#94A3B8" />
                        <Text
                            className="font-extrabold text-slate-500 dark:text-slate-400"
                            style={{ fontSize: scale(13) }}
                            allowFontScaling={false}
                        >
                            문의하기
                        </Text>
                    </View>
                    <Text
                        className="font-medium text-slate-400 dark:text-slate-500"
                        style={{ fontSize: scale(12), lineHeight: scale(19) }}
                        allowFontScaling={false}
                    >
                        개인정보 처리에 관한 문의사항이 있으시면{'\n'}buddyzzang11@gmail.com으로 연락해 주세요.
                    </Text>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}