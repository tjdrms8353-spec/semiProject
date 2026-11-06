# ONFIT

2026-11-06 팀원 폴더와 기존 3D 피팅을 통합한 작업본이다. 현재 실행·API 계약·DB 충돌·검증 범위는 [통합 안내](docs/integration/팀원_프로젝트_통합_2026-11-06.md)를 우선 참고한다. 팀원 원본 폴더는 보존하며 실제 DB 자동 변경은 하지 않는다.

**크롤링 기반 개인 맞춤형 패션 코디 및 스마트 구매 추천 서비스**

ONFIT은 옷, 신발, 액세서리를 개인 취향과 체형에 맞춰 제안하고, 상품 매칭과 가격 흐름을 함께 보여주는 4인 팀 프로젝트입니다.

## Tech stack

| Area | Stack | Responsibility |
| --- | --- | --- |
| Frontend | React, Tailwind CSS, Vite | Style profile, outfit recommendations, digital wardrobe, price insights |
| API | Python, FastAPI | Member/profile, outfit, wardrobe, product and price APIs |
| Database | TiDB Cloud | Users, profiles, products, offers, price history, wardrobe and outfits |
| Collection | Python, Playwright, BeautifulSoup | Approved-source product collection and scheduled price refresh |
| Data | Pandas, NumPy, RapidFuzz | Product matching, price statistics and recommendation signals |
| Deploy | GitHub, Render | Static frontend, API web service and scheduled collection job |

## Repository layout

```text
ONFIT/
├── frontend/                 # React + Tailwind, owned by Hwang Sang-ok
│   ├── public/
│   └── src/
│       ├── assets/
│       ├── components/        # common, outfit, wardrobe, price
│       ├── pages/
│       └── services/api.js
├── backend/                  # Single FastAPI application
│   ├── app/
│   │   ├── api/               # auth, profiles, outfits, wardrobe, products, prices
│   │   ├── core/              # settings and security
│   │   ├── crawlers/          # collectors, parsers, pipelines, scheduled jobs
│   │   ├── db/                # TiDB connection and ORM
│   │   ├── schemas/
│   │   └── services/          # styling, recommendation, price, matching
│   ├── alembic/
│   ├── tests/
│   └── requirements.txt
├── database/                  # schema.sql and seed.sql
├── docs/                      # project notes and existing team artifacts
├── .github/workflows/
└── render.yaml
```

## Run locally

### Frontend

```bash
cd frontend
npm install
Copy-Item .env.example .env.local
npm run dev
```

### FastAPI

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item ..\.env.example .env
uvicorn app.main:app --reload
```

Set `DATABASE_URL` and `SECRET_KEY` in `backend/.env` before connecting real accounts or data. The example prices and product images are presentation data until the team connects approved sources and TiDB.

## Team ownership

- **Song Seong-geun (PM):** body/color styling, wardrobe and outfit recommendation APIs; integration and deliverables.
- **Hwang Sang-ok:** all frontend screens, responsive UI, profile and recommendation flows, price charts/comparison, API integration.
- **Ahn Jong-beom:** product collection, normalization and matching, seller price comparison.
- **Lee Seung-ho:** scheduled price refresh, price history, timing analysis and crawl logs.

See [ONFIT project notes](docs/onfit/README.md) for collaboration rules and data-handling notes.
