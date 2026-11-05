# 송성근 인바디 기록 API

2026-10-26: 사용자 확인 수치 저장·조회 구현. PDF/이미지 업로드, OCR, 신체 분석은 아직 미구현이다. 실제 TiDB 적용 및 프론트 연결은 미검증이다.

## API 사용

모든 요청에 `Authorization: Bearer <access_token>`이 필요하다. 로그인은 기존 `/api/auth/login`을 사용한다. 실행된 백엔드의 `/docs`에서 Swagger 명세를 확인할 수 있다.

| 메서드 | 경로 | 결과 |
| --- | --- | --- |
| POST | /api/inbody/records | 확인된 수치 저장, 201 |
| GET | /api/inbody/records?limit=20&offset=0 | 본인 기록 배열, 200. 빈 목록은 [] |
| GET | /api/inbody/records/{record_id} | 본인 기록 상세, 200 |

POST 본문 예시(실제 사용자 자료가 아닌 테스트용 수치):

```json
{
  "height_cm": 175.25,
  "weight_kg": 70,
  "skeletal_muscle_kg": 30.12,
  "body_fat_pct": 20.5,
  "measured_at": "2026-01-02T09:00:00+09:00"
}
```

응답은 위 필드와 `id`, `user_id`, `created_at`을 포함한다. 측정 시각은 UTC로 반환한다(예: `2026-01-02T00:00:00Z`). user_id는 토큰으로 결정하며 본문으로 받을 수 없다.

- 다섯 입력값 모두 필수. 숫자 문자열·불리언·null·추가 필드는 거부한다. 수치는 소수점 두 자리까지 허용한다.
- 현재 서비스 입력 범위: 키 100~230cm, 체중 20~300kg, 골격근량 0 초과~체중 이하, 체지방률 0~100%. 이는 입력 검증 정책이며 의료 기준이나 진단이 아니다. 대상 사용자 범위 확정 시 협의가 필요하다.
- 측정 시각은 시간대가 있는 ISO 8601 문자열이어야 한다. 미래 시각과 DB 저장 범위를 벗어난 연도는 거부한다.
- 목록은 measured_at DESC, id DESC. limit 1~100, offset 0~2147483647.
- 401: 인증 실패. 404: 없는 기록 또는 타인 기록. 422: 입력 오류(원문 수치는 오류 응답에서 제거). 503: 인증/DB 설정 누락.
- POST 재전송은 새 기록을 생성한다. 프론트에서 중복 제출 방지 필요. 프로필에 키·체중을 자동 반영하지 않는다.

## 파일 및 협업

- [모델](../../Semiproject-front/backend/app/db/models/inbody_record.py): 확정 ERD의 inbody_records 8개 컬럼만 사용.
- [라우터](../../Semiproject-front/backend/app/features/inbody/router.py): Swagger 설명 및 인증 적용.
- [스키마](../../Semiproject-front/backend/app/features/inbody/schemas.py): 입력 검증·UTC 응답.
- [서비스](../../Semiproject-front/backend/app/features/inbody/service.py): 저장·조회·소유권 제한.
- [공통 API 연결](../../Semiproject-front/backend/app/api/router.py): /api/inbody 등록.
- [테스트](../../Semiproject-front/backend/tests/test_inbody.py): 격리 SQLite 검증.

모델 자료형은 BIGINT PK/FK, 수치 NUMERIC(5,2), 시간 DATETIME이며 현재 모두 NOT NULL이다. 실제 TiDB DDL의 자료형·NULL 허용·시간대 정책을 공동 확인해야 한다. DB에는 UTC 시간대 정보를 제거한 시각을 저장하고 응답에서 UTC를 명시한다. Alembic/schema.sql/원격 DB는 변경하지 않았으며, 테이블 자동 생성도 하지 않는다. 목록 성능을 위한 복합 인덱스는 공동 DDL 검토 시 논의한다.

테스트: backend에서 `.venv/Scripts/python.exe -B -m pytest tests/test_auth.py tests/test_profiles.py tests/test_inbody.py -q -p no:cacheprovider` 실행, **59 passed, 1 warning**. 인바디 신규 17개 포함. 기존 Starlette/httpx 중단 예정 경고 1건이다.

다음 단계는 PDF/이미지 업로드 → 수치 추출 미리보기 → 사용자 수정·확인 → 현재 POST API 저장이다. 파일 제한, OCR 실행 환경 및 추출 실패 처리부터 검토한다.
