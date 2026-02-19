import { Dimensions, PixelRatio } from 'react-native';

// 기준 해상도 (디자이너가 작업한 기준, 보통 아이폰 X/11/Pro 사이즈인 375x812를 많이 씁니다)
const BASIC_DIMENSIONS = {
    width: 375,
    height: 812,
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * 가로 길이 변환 (width, marginHorizontal, paddingHorizontal 등)
 */
export const wp = (widthPercent: string | number) => {
    const elemWidth = typeof widthPercent === "number" ? widthPercent : parseFloat(widthPercent);
    return PixelRatio.roundToNearestPixel((SCREEN_WIDTH * elemWidth) / 100);
};

/**
 * 세로 길이 변환 (height, marginVertical, paddingVertical 등)
 */
export const hp = (heightPercent: string | number) => {
    const elemHeight = typeof heightPercent === "number" ? heightPercent : parseFloat(heightPercent);
    return PixelRatio.roundToNearestPixel((SCREEN_HEIGHT * elemHeight) / 100);
};

/**
 * 폰트 크기 및 아이콘 크기 등 전반적인 크기 변환 (가로폭 기준 비율)
 * 예: scale(16) -> 아이폰11에선 16, 아이폰14 Pro Max에선 18 정도로 커짐
 */
export const scale = (size: number) => {
    const scaleWidth = SCREEN_WIDTH / BASIC_DIMENSIONS.width;
    return size * scaleWidth;
};