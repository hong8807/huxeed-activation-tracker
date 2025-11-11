# 📧 Gmail SMTP 무료 이메일 발송 설정 가이드

Nodemailer + Gmail SMTP를 사용하여 **완전 무료**로 이메일을 발송하는 방법입니다.

## ✅ 장점

- ✅ **완전 무료** (외부 서비스 가입 불필요)
- ✅ Gmail 계정만 있으면 사용 가능
- ✅ 하루 **500개**까지 발송 가능
- ✅ 신뢰할 수 있는 발송 (Gmail 도메인)

---

## 📋 설정 단계

### 1️⃣ Gmail 계정 준비

발송용 Gmail 계정을 준비하세요 (예: `huxeed.vtrack@gmail.com`)

> 💡 **권장**: 개인 Gmail이 아닌 별도의 업무용 계정 사용

---

### 2️⃣ Google 계정 2단계 인증 활성화

Gmail 앱 비밀번호를 사용하려면 **반드시 2단계 인증**이 활성화되어야 합니다.

1. **Google 계정 설정** 접속
   - https://myaccount.google.com

2. **보안** 메뉴 클릭

3. **2단계 인증** 찾아서 클릭

4. **시작하기** 버튼 클릭

5. 화면 안내에 따라 **휴대전화 인증** 완료

   ```
   ✅ SMS 문자 또는 Google 인증 앱 사용
   ```

---

### 3️⃣ Gmail 앱 비밀번호 생성 ⭐

1. **Google 계정 설정** → **보안** 메뉴 접속
   - https://myaccount.google.com/security

2. **검색창**에 "앱 비밀번호" 입력하여 찾기

3. **앱 비밀번호** 클릭
   - 비밀번호 재입력 요구 시 입력

4. **앱 선택** → **기타(맞춤 이름)** 선택

5. 이름 입력: `Huxeed V-track` (또는 원하는 이름)

6. **생성** 버튼 클릭

7. **16자리 앱 비밀번호** 복사
   ```
   예시: abcd efgh ijkl mnop
   ```

   > ⚠️ **중요**: 이 비밀번호는 다시 볼 수 없으니 반드시 복사하세요!

---

### 4️⃣ .env.local 파일 수정

프로젝트 루트의 `.env.local` 파일을 열어서 다음 값을 입력하세요:

```env
# Gmail SMTP Email Service (완전 무료)
EMAIL_USER=huxeed.vtrack@gmail.com
EMAIL_APP_PASSWORD=abcdefghijklmnop
```

**주의사항**:
- `EMAIL_USER`: 실제 Gmail 주소 입력
- `EMAIL_APP_PASSWORD`: 16자리 앱 비밀번호 입력 (**공백 제거**)
  - ❌ 틀림: `abcd efgh ijkl mnop`
  - ✅ 올바름: `abcdefghijklmnop`

---

### 5️⃣ 개발 서버 재시작

환경 변수가 변경되었으므로 **개발 서버를 재시작**하세요:

```bash
# 터미널에서 Ctrl+C로 중지 후
npm run dev
```

---

## 🧪 테스트 방법

1. **관리자 로그인**
   ```
   http://localhost:3000/login
   이메일: hsj@huxeed.com
   비밀번호: 관리자 비밀번호
   ```

2. **관리자 설정** 페이지 접속
   ```
   http://localhost:3000/admin/settings
   ```

3. **메일 수신자 관리** 탭에서 테스트 이메일 추가
   - 본인의 실제 이메일 주소 입력

4. **공용 계정 비밀번호** 탭에서 비밀번호 변경
   - 새 비밀번호 입력 (예: `test1234`)
   - 변경 버튼 클릭

5. **이메일 수신 확인**
   - 등록한 이메일에서 비밀번호 변경 알림 확인
   - 스팸 메일함도 확인

---

## 📊 발송 제한

Gmail SMTP는 다음과 같은 제한이 있습니다:

| 구분 | 제한 |
|------|------|
| **일일 발송 한도** | 500개 (개인 계정) |
| **분당 발송** | 제한 없음 (권장: 10개/분) |
| **수신자 제한** | 500명/메일 |

> 💡 **충분한 용량**: 비밀번호 변경은 가끔 발생하므로 500개/일이면 충분합니다.

---

## ❗ 문제 해결

### "Invalid login" 에러

```
❌ Error: Invalid login: 535-5.7.8 Username and Password not accepted
```

**원인**: 앱 비밀번호가 잘못되었거나 2단계 인증이 활성화되지 않음

**해결 방법**:
1. Gmail 계정의 2단계 인증 활성화 확인
2. 앱 비밀번호 재생성
3. `.env.local` 파일에 공백 없이 입력했는지 확인
4. 개발 서버 재시작

---

### "Less secure app access" 메시지

```
❌ Please log in via your web browser
```

**원인**: 앱 비밀번호 대신 일반 비밀번호 사용

**해결 방법**:
- 반드시 **앱 비밀번호** 사용 (16자리)
- 일반 Gmail 비밀번호는 사용 불가

---

### 이메일이 스팸으로 분류됨

**원인**: Gmail에서 발송한 이메일이 수신자의 스팸함으로 이동

**해결 방법**:
1. 수신자에게 발신자 이메일을 연락처에 추가하도록 안내
2. 첫 수신 시 "스팸 아님" 표시
3. 프로덕션 환경에서는 **커스텀 도메인** 사용 권장

---

## 🚀 프로덕션 배포 시 권장사항

프로덕션 환경에서는 다음 중 하나를 권장합니다:

### 옵션 1: Gmail SMTP 계속 사용 (소규모)
- 월 발송량 < 10,000개
- Google Workspace 계정 사용 (2,000개/일)

### 옵션 2: 전문 이메일 서비스로 전환 (대규모)
- **SendGrid**: 하루 100개 무료
- **Mailgun**: 월 5,000개 무료
- **Brevo (Sendinblue)**: 하루 300개 무료
- **Amazon SES**: 62,000개/월 무료 (EC2 사용 시)

---

## 📚 참고 자료

- [Gmail SMTP 설정](https://support.google.com/mail/answer/7126229)
- [Google 앱 비밀번호 만들기](https://support.google.com/accounts/answer/185833)
- [Nodemailer Gmail 가이드](https://nodemailer.com/usage/using-gmail/)

---

## ✅ 체크리스트

설정 완료 확인:

- [ ] Gmail 계정 준비
- [ ] 2단계 인증 활성화
- [ ] 앱 비밀번호 생성 (16자리)
- [ ] `.env.local` 파일 수정
- [ ] 공백 제거하여 앱 비밀번호 입력
- [ ] 개발 서버 재시작
- [ ] 테스트 이메일 발송 성공

---

**작성일**: 2025-11-07
**버전**: v1.0
**문의**: Huxeed V-track 개발팀
