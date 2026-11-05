# ONFIT 본인 프로필 API 연결 안내

회원 인증 연결은 [회원 인증 API 안내](./송성근_회원인증_API.md)를 참고한다. 아래 API는 모두 `/api` prefix와 `Authorization: Bearer <access_token>` 헤더를 사용한다. 실제 프론트 코드는 변경하지 않았다.

## 경로와 저장 규칙

| 메서드·경로 | 동작 | 상태 코드 |
| --- | --- | --- |
| GET `/api/profiles/me` | 본인 프로필 조회 | 200, 프로필 미생성 404 |
| PUT `/api/profiles/me` | 최초 생성 또는 전체 교체 | 최초 201, 기존 교체 200, 동시 생성 충돌 409 |
| PATCH `/api/profiles/me` | 이미 생성된 프로필의 일부 필드 변경 | 200, 미생성 404 |

공통 오류: 인증 실패 401, 입력 오류 422, 인증/DB 설정 미완료 503. 실제 연결 장애 또는 미반영 DB 스키마는 별도 서버 오류를 일으킬 수 있으므로 설정만으로 사용 준비 완료를 판단하지 않는다.

PUT에서 생략한 항목은 null로 초기화한다. PATCH에서 생략한 항목은 유지하고 명시적인 null은 값을 지운다. PATCH `{}`는 현재 상태 유지다. 선호 색상 `[]`는 빈 선택, null은 미설정으로 구분한다. 개인 정보와 입력 원문을 검증 오류 응답에 되돌려주지 않는다.

## 입력 필드

모든 필드는 선택적이며 null을 허용한다. 사용자 id와 프로필 id는 입력할 수 없다. 서버가 로그인 토큰에서 user_id를 결정한다.

| 필드 | JSON 타입·검증 | 의미 |
| --- | --- | --- |
| height_cm | 숫자, 100~230, 소수 둘째 자리까지 | 키 cm |
| weight_kg | 숫자, 20~300, 소수 둘째 자리까지 | 몸무게 kg |
| body_shape | 공백 제거 후 1~80자 문자열 | 사용자가 선택/입력한 체형 |
| preferred_fit | 공백 제거 후 1~80자 문자열 | 선호 핏 |
| preferred_style | 공백 제거 후 1~80자 문자열 | 선호 스타일 |
| personal_color | 공백 제거 후 1~80자 문자열 | 사용자가 제공한 퍼스널컬러 |
| preferred_colors | `#RRGGBB` 문자열 배열, 최대 12개 | 선호 색상 목록 |

수치의 문자열 입력과 boolean은 거부한다. 범위는 이번 입력 검증 정책으로 의료적 정상 범위를 뜻하지 않는다. 퍼스널컬러와 선호 색상은 서로 다른 입력이며 자동 추정하지 않는다. 체형·스타일·퍼스널컬러 enum은 아직 팀에서 확정하지 않아 임의 제한하지 않았다.

PUT 요청 예시(가상 값):

```json
{
  "height_cm": 175.25,
  "weight_kg": 70,
  "body_shape": "직접 입력한 체형",
  "preferred_fit": "편안하고 여유롭게",
  "preferred_style": "미니멀",
  "personal_color": null,
  "preferred_colors": ["#e8c6b7", "#353239"]
}
```

응답은 입력 필드 전체에 서버의 `id`, `user_id`를 포함한다. 수치는 JSON 숫자로 반환한다. 저장 후 GET으로 다시 확인할 수 있다.

PATCH 예시:

```json
{"preferred_style":"캐주얼","weight_kg":null}
```

이 요청은 스타일을 바꾸고 몸무게를 지우며 다른 값은 유지한다.

## 기존 프론트와 연결

| 기존 화면/DTO | 새 API 필드 |
| --- | --- |
| style | preferred_style |
| favorite_color 또는 화면 color | preferred_colors 배열의 값 |
| fit_preference | preferred_fit |

기존 POST `/api/profiles/`는 입력을 반환하는 **미저장 프로토타입**으로 유지하고 Swagger에 deprecated 표시했다. 새 저장 API와 혼동하지 않도록 프론트는 `/me`로 연결해야 한다. 기존 추천 API의 StyleProfileInput은 이번에 변경하지 않았다. 프로필을 저장했다고 기존 샘플 추천이 실제 개인화로 전환되는 것은 아니다.

## 구현 파일과 검증

- ORM: [user_profile.py](../../Semiproject-front/backend/app/db/models/user_profile.py)
- API: [features/styling/router.py](../../Semiproject-front/backend/app/features/styling/router.py)
- 입력·응답: [features/styling/schemas.py](../../Semiproject-front/backend/app/features/styling/schemas.py)
- 저장·조회: [features/styling/service.py](../../Semiproject-front/backend/app/features/styling/service.py)
- 테스트: [test_profiles.py](../../Semiproject-front/backend/tests/test_profiles.py)

backend에서 실행:

```powershell
.\.venv\Scripts\python.exe -B -m pytest tests/test_auth.py tests/test_profiles.py -q -p no:cacheprovider
```

인증 21개 + 프로필 21개 = 42개 통과. 임시 SQLite에서 저장/조회, 교체/부분 수정, 입력 범위, 미인증, 회원 간 격리, 기존 경로 및 Swagger를 검증했다. 원격 TiDB 연동은 미검증이다.

DB는 확정 ERD의 id PK, user_id FK/UK와 7개 프로필 필드를 사용한다. 자료형/길이/NULL 및 JSON 배열 저장 정책은 구현안이며 공동 DDL 검토가 필요하다. 기존 schema.sql 및 Alembic을 바꾸거나 실제 DB를 자동 생성하지 않았다. 해당 모델을 개발 TiDB에 반영하기 전에는 실서버에서 저장 가능하다고 볼 수 없다.
