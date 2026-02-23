// src/types/api.ts

// 제네릭(T)을 사용해서 어떤 데이터가 들어오든 재사용 가능하게 만듭니다.
export interface CommonResponse<T = any> {
  code: string;       // 예: "SUCCESS", "USER_NOT_FOUND"
  message: string;    // 예: "요청이 성공했습니다."
  result: T;          // 실제 데이터 (없으면 null)
}

// 에러 코드 타입도 미리 정의해두면 자동완성 되어서 편합니다.
export type ErrorCode =
  | 'SUCCESS'
  | 'USER_NOT_FOUND'
  | 'INVALID_PASSWORD_FORMAT'
  | 'EMAIL_DUPLICATED'
  | 'INVALID_TOKEN'
  // ... 필요한 것 추가
  ;