# ONFIT 개인 포트폴리오 관리

- 공개 소개: https://tjdrms8353-spec.github.io/semiProject/
- 개인 저장소 About의 Website도 이 주소로 연결한다.
- 실제 서비스: https://onfit-web.onrender.com
- GitHub Pages는 `gh-pages` 브랜치 최상위 `index.html`, `portfolio.css`, `images/`와 `.nojekyll`로 배포한다. 이 폴더는 작업 소스 보관용이다.
- 저장소 루트 `README.md`는 개인 기본 `main`과 앱 작업 브랜치에 함께 관리한다. 최신 앱은 `integration/team-develop-20261106`에 있으며, 이 작업으로 앱 코드를 main에 병합하지 않았다.
- 내용 수정 후 README는 기본 main에도, 정적 소개 페이지는 gh-pages에도 반영해야 한다. 앱 작업 브랜치에만 푸시하면 두 소개가 자동 갱신되지는 않는다.
- 2026-11-11 기준 PC 1440px·모바일 390px의 headless Chrome 렌더를 확인했고 가로 넘침이 없었다. 실제 서비스 화면이나 라이브 API의 모든 기능 검증을 뜻하지 않는다.
- 예시 저장소의 구성 방식만 참고했으며 본문·페이지 코드는 ONFIT용으로 작성했다. 발표 자료·영상·운영 성과처럼 제공되지 않은 자료는 생성해 넣지 않았다.
- 취업용 보완: 30초 요약, 실제 로컬 앱의 비로그인 예시 체형 정면·측면 캡처, 문제·원인·해결·검증 사례, 대표 구현·테스트 링크, Render→API→TiDB 배포 구조를 추가했다. 캡처는 개인 인바디나 로그인 정보를 포함하지 않는다.
