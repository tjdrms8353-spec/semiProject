# ONFIT 회원 인증 API 연결 안내

실제 앱 루트는 `Semiproject-front`, API prefix는 `/api`다. 이번 구현은 인증 기능만 포함한다. 프론트 코드는 변경하지 않았다.

## 실행 및 확인

backend 폴더에서 실행한다.

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
# 환경변수 DATABASE_URL, SECRET_KEY 설정 후 실행
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

SECRET_KEY는 최소 32바이트의 무작위 비밀값이어야 하며 .env.example의 예시 값을 그대로 쓰면 인증 API가 503을 반환한다. `ACCESS_TOKEN_EXPIRE_MINUTES`는 기본 30분이다. 비밀값은 Git이나 프론트 VITE 변수에 넣지 않는다.

**TiDB 적용은 아직 완료되지 않았다.** 확정 ERD의 users 매핑은 구현했지만 현 schema.sql은 password_hash/name이 없는 구초안이다. 해당 SQL을 실행하지 말고 공통 자료형/제약과 마이그레이션을 검토한 뒤 개발 DB에 적용해야 한다. 앱 시작 시 테이블 자동 생성은 하지 않는다. 연결 설정이나 /health 성공만으로 DB 준비 완료를 판단하지 않는다.

실제 DB 없이 검증할 때는 `python -m pytest tests/test_auth.py -q`를 사용한다. 테스트가 임시 SQLite를 만들고 삭제하며 TiDB는 사용하지 않는다. Render의 3.12.8과 로컬 검증용 3.13은 다르므로 배포 전 목표 버전에서도 검증해야 한다.

실행 후 Swagger: `http://localhost:8000/docs`, OpenAPI: `http://localhost:8000/openapi.json`.

## 요청과 응답

| API | 입력 | 성공 | 오류 |
| --- | --- | --- | --- |
| POST `/api/auth/signup` | JSON email/password/name | 201 공개 사용자 | 409 이메일 중복, 422 입력 오류, 503 설정 없음 |
| POST `/api/auth/login` | JSON email/password | 200 토큰 | 401 인증 실패, 422 입력 오류, 503 설정 없음 |
| GET `/api/auth/me` | Authorization: Bearer 토큰 | 200 본인 사용자 | 401 토큰 오류/회원 없음, 503 설정 없음 |
| GET `/api/auth/status` | 없음 | configured/not-configured | 설정 여부만 확인, 연결 점검 아님 |

가입 요청 예시(시연용이며 실제 계정 아님):

```json
{"email":"member@example.com","password":"example-password-123","name":"테스트회원"}
```

이메일은 앞뒤 공백 제거 후 소문자로 정규화한다. 이름은 공백 제거 후 1~80자, 가입 비밀번호는 8~128자다. 비밀번호 공백은 변경하지 않는다. 클라이언트가 user_id 등을 보내면 422다. 현재 프론트 비밀번호 minlength=6과 다르므로 황상옥 담당 화면에서 정책을 맞춰야 한다.

사용자 응답: `id`, `email`, `name`, `created_at`만 반환한다. created_at은 UTC ISO 8601이고 password/password_hash는 포함하지 않는다. id는 현재 JSON 정수이며 대형 BIGINT 직렬화 정책은 실제 데이터 연동 전 팀 합의 대상이다.

로그인 응답 예시:

```json
{"access_token":"<발급된 토큰>","token_type":"bearer","expires_in":1800}
```

Swagger Authorize에는 access_token 값만 입력한다. 프론트에서는 `Authorization: Bearer <access_token>` 헤더로 /me를 요청한다. 토큰 subject로 본인을 결정하며 쿼리의 user_id는 사용하지 않는다. 일반 인증 오류는 `{"detail":"Invalid credentials or access token."}`와 WWW-Authenticate: Bearer로 반환한다. 입력 검증 응답은 원본 입력과 비밀번호를 포함하지 않는다.

## 프론트 연결 및 남은 범위

- AuthModal의 가입 버튼 → signup, 로그인 버튼 → login → 토큰으로 me 호출 순서다. 현재 화면은 안내만 표시하므로 황상옥이 연결해야 한다.
- refresh/logout/토큰 폐기와 로그인 시도 횟수 제한은 아직 구현하지 않았다. 만료 후 재로그인한다. 배포 전에 토큰 보관 방식과 요청 제한을 합의한다.
- 이번 인증을 기존 프로필·옷장·코디 API에 자동 적용하지 않았다. 해당 경로는 여전히 프로토타입이며 다음 기능 구현 때 소유권 검증을 연결한다.
- 인증 해시는 pwdlib의 Argon2, 토큰은 PyJWT HS256과 고정 issuer/audience/type 검증을 사용한다. 참고: [FastAPI 공식 보안 문서](https://fastapi.tiangolo.com/tutorial/security/oauth2-jwt/). 이 구현의 로그인 입력은 OAuth2 form이 아닌 JSON이며 Swagger는 HTTP Bearer를 사용한다.
