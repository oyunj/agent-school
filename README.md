# Agent School 🎓

183개의 전문가 AI 에이전트와 1:1로 대화하는 채팅 웹사이트.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/oyunj/agent-school&env=ANTHROPIC_API_KEY&envDescription=Anthropic%20API%20Key%20required%20for%20Claude%20chat&envLink=https://console.anthropic.com/settings/keys)

## 기능

- **183개 에이전트**: 엔지니어링, 마케팅, 디자인, 게임 개발 등 14개 카테고리
- **카테고리 필터 + 검색**: 원하는 전문가를 빠르게 찾기
- **자동 자기소개**: 첫 대화 시 에이전트가 자신의 전문성과 함께 배울 내용을 소개
- **스트리밍 채팅**: 실시간 응답 스트리밍

## 나만의 배포 방법

1. 위 **Deploy with Vercel** 버튼 클릭
2. `ANTHROPIC_API_KEY` 입력 ([키 발급](https://console.anthropic.com/settings/keys))
3. Deploy!

## 로컬 실행

```bash
# 의존성 설치
npm install

# 환경변수 설정
cp .env.local.example .env.local
# .env.local에 ANTHROPIC_API_KEY 입력

# 개발 서버 실행
npm run dev
```

## 기술 스택

- [Next.js 14](https://nextjs.org) (App Router)
- [Tailwind CSS](https://tailwindcss.com)
- [Anthropic SDK](https://github.com/anthropic-ai/anthropic-sdk-typescript) (claude-sonnet-4-6)
- [gray-matter](https://github.com/jonschlinkert/gray-matter)
- [react-markdown](https://github.com/remarkjs/react-markdown)
