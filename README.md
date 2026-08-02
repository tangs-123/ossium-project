# OSSIUM — Product Study

해양 생태계의 골격과 유기적 형태를 3D 프린팅 오브제로 재해석하는 OSSIUM의 랜딩페이지입니다. 모레이 MagSafe 카드 홀더를 중심으로 제품의 구조, 제작 과정, 다른 오브제 아카이브를 소개합니다.

## 주요 구성

- 스크롤 연동 제품 구조 필름과 5단계 상태 표시
- 모레이 MagSafe 홀더, 상어·노틸러스 AirPods 케이스, 고래 키체인, 라이터 케이스 아카이브
- 스케치 → 모델링 → 출력 → 가공 제작 과정
- 제품 상세 정보 모달 및 반응형 이미지 인터랙션
- 브랜드 문의 폼 (`mailto:` 방식으로 기본 메일 앱 연결)

## 실행 방법

별도 빌드 없이 `index.html`을 브라우저에서 열어 확인할 수 있습니다. 영상과 상대 경로 에셋이 안정적으로 작동하도록 로컬 서버 실행을 권장합니다.

```powershell
cd "C:\Users\tangg\Documents\오시움폴더"
npx vite
```

실행 뒤 터미널에 표시되는 주소(일반적으로 `http://localhost:5173`)를 브라우저에서 엽니다.

## 파일 구조

```text
├── index.html              # 랜딩페이지 마크업
├── styles.css              # 기본 스타일과 반응형 규칙
├── overrides.css           # 화면별 레이아웃 및 인터랙션 보정
├── script.js               # 스크롤, 영상, 모달, 문의 폼 동작
├── output_이미지에셋/       # 제품 이미지와 영상 에셋
└── src/                    # Vite 실험용 소스
```

## 배포

정적 사이트이므로 GitHub Pages, Vercel, Netlify 등에서 바로 배포할 수 있습니다. GitHub Pages를 사용할 경우 저장소 **Settings → Pages**에서 `main` 브랜치와 `/ (root)` 폴더를 선택하세요.

## Contact

zjsxmfhf2rl@gmail.com

© 2026 OSSIUM. All rights reserved.
