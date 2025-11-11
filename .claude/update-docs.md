# 문서 자동 업데이트 가이드

## 📋 작업 완료 시 체크리스트

작업을 완료할 때마다 다음 단계를 따라주세요:

### 1. CLAUDE.md 업데이트

#### Phase 완료 체크
- Phase를 완료하면 해당 섹션의 모든 항목을 `[x]`로 체크
- Phase 제목에 `✅` 이모지 추가
- 부분 완료인 경우 `🔄 (진행중)` 표시

#### API 엔드포인트 추가
새로운 API를 구현하면:
1. `⚙️ API 설계` 섹션으로 이동
2. 해당 카테고리에 API 추가 (없으면 새 카테고리 생성)
3. 상태 컬럼에 버전 표시 (예: ✅ v2.4)

#### 버전 업데이트
주요 기능 완료 시:
1. 문서 상단 버전 번호 업데이트 (v2.4 → v2.5)
2. 최종 업데이트 날짜 수정
3. 변경사항 섹션 추가

### 2. PROJECT_STATUS.md 업데이트

현재 프로젝트 상황을 간단히 기록:

```markdown
# 프로젝트 현황

**최종 업데이트**: 2025-11-05
**현재 버전**: v2.4

## 완료된 Phase
- ✅ Phase 1: 데이터베이스 & 타입 정의
- ✅ Phase 2: 시스템 내 입력 기능
- 🔄 Phase 3: 소싱 관리 기능 (70%)
- ✅ Phase 4: Dashboard KPI

## 진행 중인 작업
- [ ] Phase 3: 자동 단계 전환 로직
- [ ] Phase 6: 12단계 완전 지원

## 다음 작업
- [ ] Phase 5: Report 페이지 강화
- [ ] Phase 7: 세그먼트 관리 완료
```

### 3. Git Commit 메시지 가이드

작업 완료 시 다음 형식으로 커밋:

```bash
git commit -m "feat: [작업명]

- 구현 내용 1
- 구현 내용 2
- API: POST /api/xxx 추가

Phase X 진행률: XX%
문서 업데이트: CLAUDE.md v2.X"
```

## 🔄 자동화 스크립트 (향후 계획)

### Git Hook 설정 (선택사항)

`.git/hooks/pre-commit` 파일 생성:

```bash
#!/bin/sh
# Pre-commit hook: 변경된 파일 확인

echo "📝 Checking for documentation updates..."

# API 파일 변경 확인
if git diff --cached --name-only | grep -q "app/api/"; then
  echo "⚠️  API 파일이 변경되었습니다. CLAUDE.md의 API 섹션을 업데이트했는지 확인하세요."
fi

# Phase 관련 파일 변경 확인
if git diff --cached --name-only | grep -q "components/\|app/"; then
  echo "⚠️  주요 컴포넌트가 변경되었습니다. Phase 체크리스트를 업데이트했는지 확인하세요."
fi

exit 0
```

실행 권한 부여:
```bash
chmod +x .git/hooks/pre-commit
```

## 📊 진행률 계산 가이드

Phase 진행률 계산 방법:

```
진행률 = (완료된 항목 수 / 전체 항목 수) × 100%

예시:
Phase 3: 8개 완료 / 11개 전체 = 72.7% ≈ 70%
```

## 🎯 체크포인트

### 매일 작업 종료 시
- [ ] CLAUDE.md Phase 체크리스트 업데이트
- [ ] 새로 구현한 API 문서에 추가
- [ ] 변경사항 커밋 메시지에 명확히 기재

### 주요 기능 완료 시
- [ ] 버전 번호 업그레이드
- [ ] 변경사항 섹션 추가
- [ ] PROJECT_STATUS.md 업데이트
- [ ] README.md 필요시 업데이트

### Phase 완료 시
- [ ] 모든 항목 `[x]` 체크
- [ ] Phase 제목에 ✅ 추가
- [ ] 다음 Phase로 진행

---

**문서 작성자**: Claude
**최종 업데이트**: 2025-11-05
