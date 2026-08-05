# 망남생활권 어촌신활력증진사업 — 홍보·업무자동화 사이트

전남광주통합특별시 완도군 망남생활권 어촌신활력증진사업의 공식 홍보 사이트 겸 내부 업무자동화 도구.

## 구성

**공개 페이지**
- `/` — 사업 소개 + 방문·사업 문의 접수 폼
- `/news` — 블로그형 사업소식(최근 10건) + KPI 성과 + 현장 사진·영상 갤러리
- `/insta` — 인스타 홍보콘텐츠
- 좌측 사이드바: 사교원 허브(sakyowon.co.kr) 버튼, 관리자 로그인 버튼

**관리자 (`/admin`, 비밀번호 로그인)**
- 문의 확인·답변
- 사업결과보고서(PDF/텍스트) 업로드 → Claude가 블로그형 홍보글 초안 작성 → 검토 후 게시
- **기획안·보고서 작성** — 사업 지식자료(`data/knowledge/`) + 업로드 참고자료(자료요청 공문 등, PDF·HWP·HWPX·DOCX·XLSX·TXT) + 키워드 → Claude가 행정문서 초안 작성 → 편집 후 **한글파일(.hwpx) 다운로드**
- KPI 성과 관리, 사진·영상 업로드
- 예산집행 엑셀 업로드 → 연도별·사업별·품목별 집행실적 자동 정리
- 주민자료 엑셀 업로드 → 주민 관계도(그래프) 표시
- 주민 연락처 기반 단체 문자 발송 (알리고 API, 키 없으면 시뮬레이션)
- 구글 캘린더(ICS) → 인스타 스토리 기획안 자동 작성

## 실행

```bash
npm install
cp .env.example .env   # 값 채우기
npm run build
npm start              # http://localhost:3100
```

- DB: SQLite (`data/app.db`, 자동 생성). 업로드 파일: `data/uploads/`
- `data/` 디렉터리만 백업하면 전체 데이터가 보존됨
- 문서 작성 지식자료: `data/knowledge/*.txt|md` (공개 레포라 원문은 커밋하지 않음).
  데카 로컬에서는 `scripts/sync-knowledge.sh` 로 채우고, 서버에서는 데카 홈의
  `~deka/workspace/mangnam-vitality/data/knowledge/` 를 복사하면 됨.
  비어 있어도 동작하며 업로드 자료·키워드만으로 작성함
- HWP 업로드 텍스트 추출은 `hwp5txt`(pyhwp) CLI가 있으면 자동 사용, 없으면 PDF 변환 안내
- 환경변수는 `.env.example` 참고. AI·SMS 키가 없어도 사이트는 동작하며 해당 기능만 수동/시뮬레이션 모드로 전환됨

## 배포 (지미 참고)

- Node 20+ 필요, `npm run build` 후 `npm start` (포트 3100) 또는 systemd 서비스
- 리버스 프록시(nginx)로 도메인 연결, 업로드 용량 고려 `client_max_body_size 200m`
- 환경변수: `ADMIN_PASSWORD`(필수), `ANTHROPIC_API_KEY`, `ALIGO_API_KEY`/`ALIGO_USER_ID`/`SMS_SENDER`(문자), `DATA_DIR`(선택)
